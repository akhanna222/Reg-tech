import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../database/entities/transmission-package.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { SftpTransportService } from '../services/sftp-transport.service';
import { RawStorageService } from '../../storage/raw-storage.service';

export interface CtsDispatchJobData {
  transmissionPackageId: string;
  destinationJurisdiction: string;
  packageKey: string;
  senderJurisdiction: string;
  messageRefId: string;
}

@Processor('cts-dispatch')
export class CtsDispatchProcessor {
  private readonly logger = new Logger(CtsDispatchProcessor.name);

  constructor(
    private readonly sftpTransport: SftpTransportService,
    private readonly rawStorage: RawStorageService,
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  @Process({
    name: 'dispatch',
    concurrency: 1,
  })
  async handleDispatch(job: Job<CtsDispatchJobData>): Promise<void> {
    const {
      transmissionPackageId,
      destinationJurisdiction,
      packageKey,
      senderJurisdiction,
      messageRefId,
    } = job.data;

    this.logger.log(
      `CTS dispatch started: transmission=${transmissionPackageId}, destination=${destinationJurisdiction}`,
    );

    try {
      await job.progress(10);

      // Step 1: Load the transmission package record
      const transmission = await this.transmissionRepository.findOne({
        where: { id: transmissionPackageId },
      });

      if (!transmission) {
        throw new Error(
          `Transmission package not found: ${transmissionPackageId}`,
        );
      }

      // Step 2: Download the encrypted package from MinIO
      await job.progress(20);
      const encryptedData = await this.rawStorage.download(packageKey);

      this.logger.debug(
        `Downloaded encrypted package from MinIO: ${packageKey} (${encryptedData.length} bytes)`,
      );

      // Step 3: Generate the CTS filename
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\.\d+Z$/, '');
      const filename = `${senderJurisdiction}_${messageRefId}_${timestamp}.xml.enc`;

      // Step 4: Upload to destination jurisdiction's CTS outbox via SFTP
      await job.progress(50);
      const remotePath = await this.sftpTransport.uploadToOutbox(
        destinationJurisdiction,
        filename,
        encryptedData,
      );

      this.logger.log(
        `Package uploaded to CTS outbox: ${remotePath}`,
      );

      // Step 5: Update transmission status to DISPATCHED
      await job.progress(80);
      await this.transmissionRepository.update(transmissionPackageId, {
        status: TransmissionStatus.DISPATCHED,
        dispatchedAt: new Date(),
      });

      // Step 6: Log audit event
      await this.auditEventRepository.save(
        this.auditEventRepository.create({
          action: 'CTS_SFTP_DISPATCH',
          resourceType: 'TRANSMISSION',
          resourceId: transmissionPackageId,
          jurisdiction: destinationJurisdiction.substring(0, 2),
          metadata: {
            destinationJurisdiction,
            senderJurisdiction,
            messageRefId,
            remotePath,
            filename,
            packageSizeBytes: encryptedData.length,
            dispatchedAt: new Date().toISOString(),
          },
        }),
      );

      await job.progress(100);
      this.logger.log(
        `CTS dispatch complete: transmission=${transmissionPackageId}, remote=${remotePath}`,
      );
    } catch (error) {
      this.logger.error(
        `CTS dispatch failed: transmission=${transmissionPackageId}`,
        error,
      );

      // Update status to ERROR
      await this.transmissionRepository
        .update(transmissionPackageId, {
          status: TransmissionStatus.ERROR,
        })
        .catch((updateErr) => {
          this.logger.error(
            'Failed to update transmission status to ERROR',
            updateErr,
          );
        });

      // Log failure audit event
      await this.auditEventRepository
        .save(
          this.auditEventRepository.create({
            action: 'CTS_SFTP_DISPATCH_FAILED',
            resourceType: 'TRANSMISSION',
            resourceId: transmissionPackageId,
            jurisdiction: destinationJurisdiction.substring(0, 2),
            metadata: {
              destinationJurisdiction,
              senderJurisdiction,
              messageRefId,
              error: error instanceof Error ? error.message : String(error),
              attempt: job.attemptsMade + 1,
            },
          }),
        )
        .catch((auditErr) => {
          this.logger.error('Failed to log dispatch failure audit event', auditErr);
        });

      // Re-throw for BullMQ retry
      throw error;
    }
  }
}
