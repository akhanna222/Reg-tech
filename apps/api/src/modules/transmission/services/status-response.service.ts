import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { EncryptionService } from '../../crypto/encryption.service';
import { SigningService } from '../../crypto/signing.service';
import { KeyManagementService } from '../../crypto/key-management.service';
import { SftpTransportService } from './sftp-transport.service';

export interface StatusError {
  code: string;
  message: string;
}

@Injectable()
export class StatusResponseService {
  private readonly logger = new Logger(StatusResponseService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    private readonly encryptionService: EncryptionService,
    private readonly signingService: SigningService,
    private readonly keyManagement: KeyManagementService,
    private readonly sftpTransport: SftpTransportService,
  ) {}

  /**
   * Send an ACK (acceptance) response back to the source jurisdiction via SFTP.
   */
  async sendAckResponse(
    inboundTransmissionId: string,
    sourceJurisdiction: string,
  ): Promise<void> {
    const jurisdiction = sourceJurisdiction.toUpperCase();
    const messageRefId = `ACK-${inboundTransmissionId}`;

    this.logger.log(
      `Sending ACK response to ${jurisdiction} for transmission ${inboundTransmissionId}`,
    );

    try {
      // Step 1: Generate OECD-format ACK XML
      const statusXml = this.generateStatusXml('ACK', messageRefId);

      // Step 2: Sign with our private key
      const ourPrivateKey = await this.keyManagement.loadPrivateKey(jurisdiction);
      const ourCertificate = await this.keyManagement.loadCertificate(jurisdiction);
      const { signedXml } = this.signingService.signPackage(
        statusXml,
        ourPrivateKey,
        ourCertificate,
      );

      // Step 3: Encrypt using source jurisdiction's public key
      const sourcePublicKey = await this.keyManagement.loadPublicKey(jurisdiction);
      const encryptedData = this.encryptionService.encryptForJurisdiction(
        Buffer.from(signedXml, 'utf-8'),
        sourcePublicKey,
      );

      // Step 4: Upload to source jurisdiction's CTS status outbox
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\.\d+Z$/, '');
      const filename = `STATUS_ACK_${messageRefId}_${timestamp}.xml.enc`;

      const remotePath = await this.sftpTransport.uploadStatusMessage(
        jurisdiction,
        filename,
        encryptedData,
      );

      // Step 5: Log audit event
      await this.auditEventRepository.save(
        this.auditEventRepository.create({
          action: 'CTS_ACK_SENT',
          resourceType: 'TRANSMISSION',
          resourceId: inboundTransmissionId,
          jurisdiction: jurisdiction.substring(0, 2),
          metadata: {
            sourceJurisdiction: jurisdiction,
            messageRefId,
            remotePath,
            filename,
            sentAt: new Date().toISOString(),
          },
        }),
      );

      this.logger.log(
        `ACK response sent to ${jurisdiction}: ${remotePath}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send ACK response to ${jurisdiction} for transmission ${inboundTransmissionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send a NACK (rejection) response back to the source jurisdiction via SFTP.
   */
  async sendNackResponse(
    inboundTransmissionId: string,
    sourceJurisdiction: string,
    errors: StatusError[],
  ): Promise<void> {
    const jurisdiction = sourceJurisdiction.toUpperCase();
    const messageRefId = `NACK-${inboundTransmissionId}`;

    this.logger.log(
      `Sending NACK response to ${jurisdiction} for transmission ${inboundTransmissionId} with ${errors.length} error(s)`,
    );

    try {
      // Step 1: Generate OECD-format NACK XML with error details
      const statusXml = this.generateStatusXml('NACK', messageRefId, errors);

      // Step 2: Sign with our private key
      const ourPrivateKey = await this.keyManagement.loadPrivateKey(jurisdiction);
      const ourCertificate = await this.keyManagement.loadCertificate(jurisdiction);
      const { signedXml } = this.signingService.signPackage(
        statusXml,
        ourPrivateKey,
        ourCertificate,
      );

      // Step 3: Encrypt using source jurisdiction's public key
      const sourcePublicKey = await this.keyManagement.loadPublicKey(jurisdiction);
      const encryptedData = this.encryptionService.encryptForJurisdiction(
        Buffer.from(signedXml, 'utf-8'),
        sourcePublicKey,
      );

      // Step 4: Upload to source jurisdiction's CTS status outbox
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\.\d+Z$/, '');
      const filename = `STATUS_NACK_${messageRefId}_${timestamp}.xml.enc`;

      const remotePath = await this.sftpTransport.uploadStatusMessage(
        jurisdiction,
        filename,
        encryptedData,
      );

      // Step 5: Log audit event
      await this.auditEventRepository.save(
        this.auditEventRepository.create({
          action: 'CTS_NACK_SENT',
          resourceType: 'TRANSMISSION',
          resourceId: inboundTransmissionId,
          jurisdiction: jurisdiction.substring(0, 2),
          metadata: {
            sourceJurisdiction: jurisdiction,
            messageRefId,
            remotePath,
            filename,
            errors,
            sentAt: new Date().toISOString(),
          },
        }),
      );

      this.logger.log(
        `NACK response sent to ${jurisdiction}: ${remotePath}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send NACK response to ${jurisdiction} for transmission ${inboundTransmissionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate OECD CTS-format status message XML.
   */
  private generateStatusXml(
    type: 'ACK' | 'NACK',
    messageRefId: string,
    errors?: StatusError[],
  ): string {
    const timestamp = new Date().toISOString();
    const statusCode = type === 'ACK' ? 'ACCEPTED' : 'REJECTED';

    const errorElements = errors
      ? errors
          .map(
            (err) =>
              `    <crs:Error>\n` +
              `      <crs:ErrorCode>${this.escapeXml(err.code)}</crs:ErrorCode>\n` +
              `      <crs:ErrorMessage>${this.escapeXml(err.message)}</crs:ErrorMessage>\n` +
              `    </crs:Error>`,
          )
          .join('\n')
      : '';

    const errorsBlock = errorElements
      ? `\n  <crs:ValidationErrors>\n${errorElements}\n  </crs:ValidationErrors>`
      : '';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<crs:StatusMessage',
      '  xmlns:crs="urn:oecd:ties:crs:v2"',
      '  xmlns:stf="urn:oecd:ties:crsstf:v5"',
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '  version="2.0">',
      '  <crs:MessageSpec>',
      `    <crs:MessageRefId>${this.escapeXml(messageRefId)}</crs:MessageRefId>`,
      `    <crs:MessageType>STATUS</crs:MessageType>`,
      `    <crs:Timestamp>${timestamp}</crs:Timestamp>`,
      '  </crs:MessageSpec>',
      '  <crs:StatusDetail>',
      `    <crs:Status>${statusCode}</crs:Status>`,
      `    <crs:OriginalMessageRefId>${this.escapeXml(messageRefId)}</crs:OriginalMessageRefId>`,
      `    <crs:Timestamp>${timestamp}</crs:Timestamp>`,
      '  </crs:StatusDetail>' + errorsBlock,
      '</crs:StatusMessage>',
    ].join('\n');
  }

  /**
   * Escape special characters for XML content.
   */
  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
