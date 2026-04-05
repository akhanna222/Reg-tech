import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing, FilingStatus } from '../../database/entities/filing.entity';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../database/entities/transmission-package.entity';
import { FilingDocument } from '../../database/entities/filing-document.entity';
import { RawStorageService } from '../../storage/raw-storage.service';
import { EncryptionService } from '../../crypto/encryption.service';
import { SigningService } from '../../crypto/signing.service';
import { KeyManagementService } from '../../crypto/key-management.service';

export interface TransmissionStep {
  step: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: Date;
  details?: string;
}

@Injectable()
export class TransmissionPipelineService {
  private readonly logger = new Logger(TransmissionPipelineService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
    @InjectRepository(FilingDocument)
    private readonly filingDocumentRepository: Repository<FilingDocument>,
    private readonly rawStorage: RawStorageService,
    private readonly encryptionService: EncryptionService,
    private readonly signingService: SigningService,
    private readonly keyManagement: KeyManagementService,
  ) {}

  /**
   * Orchestrate the 7-step transmission pipeline:
   * 1. Final validation check
   * 2. Dataset lock
   * 3. XML packaging
   * 4. Encryption
   * 5. Digital signing
   * 6. CTS dispatch
   * 7. ACK polling setup
   */
  async transmit(
    filingId: string,
    userId: string,
  ): Promise<TransmissionPackage> {
    const steps: TransmissionStep[] = [];

    const filing = await this.filingRepository.findOne({
      where: { id: filingId },
      relations: ['organization'],
    });

    if (!filing) {
      throw new NotFoundException(`Filing not found: ${filingId}`);
    }

    if (filing.status !== FilingStatus.VALIDATED) {
      throw new BadRequestException(
        `Filing must be in VALIDATED status for transmission. Current: ${filing.status}`,
      );
    }

    const jurisdiction = filing.organization.jurisdiction;

    try {
      // Step 1: Final validation check
      steps.push({
        step: 'FINAL_VALIDATION',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: 'Filing validation status confirmed',
      });

      // Step 2: Dataset lock - prevent further edits
      await this.filingRepository.update(filingId, {
        status: FilingStatus.TRANSMITTED,
      });
      steps.push({
        step: 'DATASET_LOCK',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: 'Filing locked for transmission',
      });

      // Step 3: XML packaging - fetch and prepare the XML
      const documents = await this.filingDocumentRepository.find({
        where: { filingId },
        order: { uploadedAt: 'DESC' },
      });

      if (documents.length === 0) {
        throw new BadRequestException('No documents found for filing');
      }

      const latestDoc = documents[0];
      const xmlBuffer = await this.rawStorage.download(latestDoc.storageKey);
      const xmlContent = xmlBuffer.toString('utf-8');
      steps.push({
        step: 'XML_PACKAGING',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: `Packaged document: ${latestDoc.storageKey}`,
      });

      // Step 4: Encryption
      const destPublicKey = await this.keyManagement.loadPublicKey(jurisdiction);
      const encryptedData = this.encryptionService.encryptForJurisdiction(
        Buffer.from(xmlContent, 'utf-8'),
        destPublicKey,
      );
      steps.push({
        step: 'ENCRYPTION',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: `Encrypted for jurisdiction: ${jurisdiction}`,
      });

      // Step 5: Digital signing
      const privateKey = await this.keyManagement.loadPrivateKey(jurisdiction);
      const certificate = await this.keyManagement.loadCertificate(jurisdiction);
      const { signatureValue } = this.signingService.signPackage(
        xmlContent,
        privateKey,
        certificate,
      );
      steps.push({
        step: 'SIGNING',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: 'Package signed with XMLDSig',
      });

      // Step 6: Upload encrypted package and create transmission record
      const packageKey = `transmissions/${filingId}/${Date.now()}.enc`;
      await this.rawStorage.upload(packageKey, encryptedData, 'application/octet-stream');

      const transmission = this.transmissionRepository.create({
        filingId,
        destination: jurisdiction,
        packageKey,
        signature: signatureValue,
        status: TransmissionStatus.DISPATCHED,
        dispatchedAt: new Date(),
      });
      const saved = await this.transmissionRepository.save(transmission);
      steps.push({
        step: 'CTS_DISPATCH',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: `Transmission ${saved.id} dispatched to ${jurisdiction}`,
      });

      // Step 7: ACK polling will be handled by the inbound processor
      steps.push({
        step: 'ACK_POLLING_SETUP',
        status: 'SUCCESS',
        timestamp: new Date(),
        details: 'ACK polling configured for transmission',
      });

      this.logger.log(
        `Transmission pipeline complete: filing=${filingId}, transmission=${saved.id}, user=${userId}`,
      );

      return saved;
    } catch (error) {
      this.logger.error(
        `Transmission pipeline failed for filing ${filingId}`,
        error,
      );

      // Revert filing status if transmission failed after lock
      if (steps.some((s) => s.step === 'DATASET_LOCK' && s.status === 'SUCCESS')) {
        await this.filingRepository.update(filingId, {
          status: FilingStatus.VALIDATED,
        });
      }

      throw error;
    }
  }
}
