import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReturnDataProcessorService } from '../services/return-data-processor.service';
import { ResultDistributorService } from '../services/result-distributor.service';

interface InboundTransmissionJobData {
  packageBase64: string;
  sourceJurisdiction: string;
  receivedAt: string;
}

@Processor('inbound-transmission')
export class InboundTransmissionProcessor {
  private readonly logger = new Logger(InboundTransmissionProcessor.name);

  constructor(
    private readonly returnDataProcessor: ReturnDataProcessorService,
    private readonly resultDistributor: ResultDistributorService,
  ) {}

  @Process('process-inbound')
  async handleInbound(job: Job<InboundTransmissionJobData>): Promise<void> {
    const { packageBase64, sourceJurisdiction, receivedAt } = job.data;

    this.logger.log(
      `Processing inbound transmission from ${sourceJurisdiction}, received at ${receivedAt}`,
    );

    try {
      await job.progress(10);

      // Step 1: Decode the package
      const packageBuffer = Buffer.from(packageBase64, 'base64');

      // Step 2: Process the inbound data (verify, decrypt, validate, store)
      await job.progress(30);
      const transmission = await this.returnDataProcessor.processInbound(
        packageBuffer,
        sourceJurisdiction,
      );

      // Step 3: Distribute results (notify TA users and FIs)
      await job.progress(70);
      const { notified } = await this.resultDistributor.distributeResults(
        transmission.id,
      );

      await job.progress(100);
      this.logger.log(
        `Inbound transmission processed: id=${transmission.id}, source=${sourceJurisdiction}, notified=${notified}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process inbound transmission from ${sourceJurisdiction}`,
        error,
      );
      throw error;
    }
  }
}
