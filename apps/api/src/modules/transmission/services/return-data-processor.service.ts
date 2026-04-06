import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../database/entities/transmission-package.entity';
import { SigningService } from '../../crypto/signing.service';
import { EncryptionService } from '../../crypto/encryption.service';
import { KeyManagementService } from '../../crypto/key-management.service';
import { XsdValidatorService } from '../../validation/services/xsd-validator.service';
import { RawStorageService } from '../../storage/raw-storage.service';
import { StatusResponseService } from './status-response.service';

@Injectable()
export class ReturnDataProcessorService {
  private readonly logger = new Logger(ReturnDataProcessorService.name);

  constructor(
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
    private readonly signingService: SigningService,
    private readonly encryptionService: EncryptionService,
    private readonly keyManagement: KeyManagementService,
    private readonly xsdValidator: XsdValidatorService,
    private readonly rawStorage: RawStorageService,
    private readonly statusResponse: StatusResponseService,
  ) {}

  /**
   * Process an inbound data package from another jurisdiction.
   * Steps: verify signature, decrypt, validate XSD, parse, store.
   */
  async processInbound(
    packageBuffer: Buffer,
    sourceJurisdiction: string,
  ): Promise<TransmissionPackage> {
    const jurisdiction = sourceJurisdiction.toUpperCase();
    this.logger.log(`Processing inbound package from ${jurisdiction}`);

    // Step 1: Verify signature
    const sourceCert = await this.keyManagement.loadPublicKey(jurisdiction);
    // For signature verification, we need to separate the signature from data
    // In production, the package format would have a defined structure
    const packageContent = packageBuffer.toString('utf-8');
    const signatureValid = this.signingService.verifySignature(
      packageContent,
      sourceCert,
    );

    if (!signatureValid) {
      this.logger.warn(
        `Signature verification failed for inbound package from ${jurisdiction}`,
      );

      // Send NACK response for signature failure (best-effort, don't block throw)
      this.statusResponse
        .sendNackResponse('signature-failure', jurisdiction, [
          {
            code: 'SIGNATURE_INVALID',
            message: `Signature verification failed for package from ${jurisdiction}`,
          },
        ])
        .catch((err) =>
          this.logger.error('Failed to send NACK for signature failure', err),
        );

      throw new BadRequestException(
        `Signature verification failed for package from ${jurisdiction}`,
      );
    }

    // Step 2: Decrypt
    const ourPrivateKey = await this.keyManagement.loadPrivateKey(jurisdiction);
    const decryptedData = this.encryptionService.decryptFromJurisdiction(
      packageBuffer,
      ourPrivateKey,
    );
    const xmlContent = decryptedData.toString('utf-8');

    // Step 3: Validate XSD (determine schema type from content)
    const schemaType = xmlContent.includes('FATCA') ? 'FATCA' : 'CRS';
    const xsdResult = await this.xsdValidator.validateXsd(
      xmlContent,
      schemaType as 'CRS' | 'FATCA',
    );

    if (!xsdResult.valid) {
      this.logger.warn(
        `XSD validation failed for inbound package from ${jurisdiction}: ${xsdResult.errors.length} errors`,
      );

      // Send NACK response with validation errors
      const validationErrors = xsdResult.errors.map((err, idx) => ({
        code: `XSD_VALIDATION_${idx + 1}`,
        message: typeof err === 'string' ? err : String(err),
      }));

      this.statusResponse
        .sendNackResponse('xsd-failure', jurisdiction, validationErrors)
        .catch((nackErr) =>
          this.logger.error('Failed to send NACK for XSD validation failure', nackErr),
        );

      throw new BadRequestException(
        `Inbound package from ${jurisdiction} failed XSD validation`,
      );
    }

    // Step 4: Store the validated package
    const storageKey = `inbound/${jurisdiction}/${Date.now()}.xml`;
    await this.rawStorage.upload(storageKey, decryptedData, 'application/xml');

    // Step 5: Create transmission record for tracking
    const transmission = this.transmissionRepository.create({
      filingId: '00000000-0000-0000-0000-000000000000', // Placeholder for inbound
      destination: jurisdiction,
      packageKey: storageKey,
      status: TransmissionStatus.ACK,
      dispatchedAt: new Date(),
      ackReceivedAt: new Date(),
      ackPayload: {
        direction: 'INBOUND',
        sourceJurisdiction: jurisdiction,
        schemaType,
        receivedAt: new Date().toISOString(),
      },
    });

    const saved = await this.transmissionRepository.save(transmission);

    // Send ACK response to source jurisdiction after successful processing
    this.statusResponse
      .sendAckResponse(saved.id, jurisdiction)
      .catch((ackErr) =>
        this.logger.error(
          `Failed to send ACK for transmission ${saved.id} to ${jurisdiction}`,
          ackErr,
        ),
      );

    this.logger.log(
      `Inbound package processed: transmission=${saved.id}, source=${jurisdiction}`,
    );

    return saved;
  }
}
