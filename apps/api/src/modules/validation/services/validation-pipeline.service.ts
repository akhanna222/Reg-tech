import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Filing } from '../../database/entities/filing.entity';
import {
  ValidationResult,
  ValidationStage,
} from '../../database/entities/validation-result.entity';

@Injectable()
export class ValidationPipelineService {
  private readonly logger = new Logger(ValidationPipelineService.name);

  constructor(
    @InjectQueue('validation')
    private readonly validationQueue: Queue,
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectRepository(ValidationResult)
    private readonly validationResultRepository: Repository<ValidationResult>,
  ) {}

  /**
   * Trigger the full validation pipeline for a filing.
   * Adds a job to the BullMQ validation queue.
   */
  async triggerValidation(filingId: string): Promise<{ jobId: string }> {
    const filing = await this.filingRepository.findOne({
      where: { id: filingId },
    });

    if (!filing) {
      throw new NotFoundException(`Filing not found: ${filingId}`);
    }

    const job = await this.validationQueue.add('validate-filing', {
      filingId,
      triggeredAt: new Date().toISOString(),
    });

    this.logger.log(`Validation triggered for filing ${filingId}, job=${job.id}`);
    return { jobId: String(job.id) };
  }

  /**
   * Retrieve all validation results for a filing, grouped by stage.
   */
  async getResults(filingId: string): Promise<Record<ValidationStage, ValidationResult | null>> {
    const results = await this.validationResultRepository.find({
      where: { filingId },
      order: { executedAt: 'ASC' },
    });

    const grouped: Record<string, ValidationResult | null> = {
      [ValidationStage.XSD]: null,
      [ValidationStage.BUSINESS_RULES]: null,
      [ValidationStage.CROSS_RECORD]: null,
      [ValidationStage.JURISDICTION]: null,
    };

    for (const result of results) {
      // Keep the latest result for each stage
      grouped[result.stage] = result;
    }

    return grouped as Record<ValidationStage, ValidationResult | null>;
  }
}
