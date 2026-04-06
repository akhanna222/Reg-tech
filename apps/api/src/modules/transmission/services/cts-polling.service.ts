import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { SftpTransportService } from './sftp-transport.service';
import {
  InboundTransmission,
  IngestionStatus,
} from '../../database/entities/inbound-transmission.entity';
import { EventStoreService } from '../../event-store/event-store.service';
import { RawStorageService } from '../../storage/raw-storage.service';

export interface PollResult {
  jurisdiction: string;
  newPackages: number;
  error?: string;
}

@Injectable()
export class CtsPollingService {
  private readonly logger = new Logger(CtsPollingService.name);
  private readonly pollingEnabled: boolean;
  private readonly jurisdictions: string[];
  private lastPollTimestamp: Date | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly sftpTransport: SftpTransportService,
    private readonly eventStore: EventStoreService,
    private readonly rawStorage: RawStorageService,
    @InjectRepository(InboundTransmission)
    private readonly inboundRepo: Repository<InboundTransmission>,
    @InjectQueue('inbound-transmission')
    private readonly inboundQueue: Queue,
  ) {
    this.pollingEnabled = this.config.get<string>(
      'CTS_POLLING_ENABLED',
      'true',
    ) === 'true';

    const jurisdictionStr = this.config.get<string>(
      'CTS_POLLING_JURISDICTIONS',
      '',
    );
    this.jurisdictions = jurisdictionStr
      ? jurisdictionStr.split(',').map((j) => j.trim().toUpperCase())
      : [];
  }

  /**
   * Scheduled cron job that polls all configured jurisdictions.
   * Default schedule: every 4 hours (configurable via CTS_POLLING_INTERVAL_CRON).
   * The cron expression is read from config; the decorator uses a default.
   */
  @Cron(process.env.CTS_POLLING_INTERVAL_CRON || '0 */4 * * *', {
    name: 'cts-inbox-poll',
  })
  async pollAllJurisdictions(): Promise<PollResult[]> {
    if (!this.pollingEnabled) {
      this.logger.debug('CTS polling is disabled — skipping scheduled poll');
      return [];
    }

    if (this.jurisdictions.length === 0) {
      this.logger.debug(
        'No jurisdictions configured for CTS polling — skipping',
      );
      return [];
    }

    this.logger.log(
      `Starting scheduled CTS inbox poll for ${this.jurisdictions.length} jurisdiction(s): ${this.jurisdictions.join(', ')}`,
    );

    const results: PollResult[] = [];
    let totalNew = 0;

    for (const jurisdiction of this.jurisdictions) {
      const result = await this.pollSingleJurisdiction(jurisdiction);
      results.push(result);
      totalNew += result.newPackages;
    }

    this.lastPollTimestamp = new Date();

    this.logger.log(
      `Polled ${this.jurisdictions.length} jurisdictions, received ${totalNew} packages`,
    );

    return results;
  }

  /**
   * Poll a single jurisdiction's CTS inbox. Public — callable on-demand from controller.
   */
  async pollSingleJurisdiction(jurisdiction: string): Promise<PollResult> {
    const jur = jurisdiction.toUpperCase();
    this.logger.log(`Polling CTS inbox for jurisdiction ${jur}`);

    try {
      const files = await this.sftpTransport.downloadFromInbox(jur);
      let newPackages = 0;

      for (const file of files) {
        try {
          // Deduplication: check if this filename was already processed
          const existing = await this.inboundRepo
            .createQueryBuilder('it')
            .where('it.packageKey LIKE :pattern', {
              pattern: `%/${file.filename}`,
            })
            .getOne();

          if (existing) {
            this.logger.debug(
              `Skipping already-processed file: ${file.filename} (inboundTransmission=${existing.id})`,
            );
            continue;
          }

          // Create InboundTransmission record with status RECEIVED
          const storageKey = `inbound/${jur}/${file.filename}`;

          const inboundTransmission = this.inboundRepo.create({
            sourceJurisdiction: jur,
            packageKey: storageKey,
            ingestionStatus: IngestionStatus.RECEIVED,
            signatureValid: null,
            decryptionOk: null,
            structuralValid: null,
            errorDetails: null,
            processedAt: null,
          });

          const saved = await this.inboundRepo.save(inboundTransmission);

          // Store raw package in MinIO
          await this.rawStorage.upload(
            storageKey,
            file.data,
            'application/octet-stream',
          );

          // Queue BullMQ job for inbound processing
          await this.inboundQueue.add('process-inbound', {
            packageBase64: file.data.toString('base64'),
            sourceJurisdiction: jur,
            receivedAt: new Date().toISOString(),
            inboundTransmissionId: saved.id,
            source: 'CTS_POLL',
          });

          // Log audit event
          await this.eventStore.appendEvent(
            'CTS_POLL_RECEIVED',
            {
              actorId: null,
              actorRole: 'SYSTEM',
              resourceType: 'InboundTransmission',
              resourceId: saved.id,
              jurisdiction: jur,
              ipAddress: null,
              payloadHash: null,
            },
            {
              filename: file.filename,
              storageKey,
              fileSize: file.data.length,
            },
          );

          newPackages++;
          this.logger.log(
            `New inbound package from ${jur}: ${file.filename} -> inboundTransmission=${saved.id}`,
          );
        } catch (fileError) {
          this.logger.error(
            `Failed to process polled file ${file.filename} from ${jur}`,
            fileError,
          );
          // Continue processing remaining files
        }
      }

      this.logger.log(
        `Jurisdiction ${jur}: found ${files.length} file(s), ${newPackages} new`,
      );

      return { jurisdiction: jur, newPackages };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to poll CTS inbox for jurisdiction ${jur}: ${errorMsg}`,
      );
      return { jurisdiction: jur, newPackages: 0, error: errorMsg };
    }
  }

  /**
   * Returns the timestamp of the last completed poll, or null if never polled.
   */
  getLastPollTimestamp(): Date | null {
    return this.lastPollTimestamp;
  }

  /**
   * Returns the configured list of jurisdictions.
   */
  getConfiguredJurisdictions(): string[] {
    return [...this.jurisdictions];
  }

  /**
   * Returns whether polling is enabled.
   */
  isPollingEnabled(): boolean {
    return this.pollingEnabled;
  }
}
