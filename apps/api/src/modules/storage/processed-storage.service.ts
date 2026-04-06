import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing } from '../database/entities/filing.entity';

export interface ParsedFilingData {
  filingId: string;
  reportingPeriod: string;
  filingType: string;
  accounts: Record<string, unknown>[];
  reportingFI: Record<string, unknown>;
  messageSpec: Record<string, unknown>;
}

@Injectable()
export class ProcessedStorageService {
  private readonly logger = new Logger(ProcessedStorageService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
  ) {}

  async storeParsedData(filingId: string, data: ParsedFilingData): Promise<void> {
    await this.filingRepository
      .createQueryBuilder()
      .update(Filing)
      .set({ parsedData: data } as any)
      .where('id = :filingId', { filingId })
      .execute();

    this.logger.debug(`Stored parsed data for filing ${filingId}`);
  }

  async retrieveParsedData(filingId: string): Promise<ParsedFilingData | null> {
    const filing = await this.filingRepository
      .createQueryBuilder('filing')
      .select('filing.parsedData')
      .where('filing.id = :filingId', { filingId })
      .getOne();

    return (filing as any)?.parsedData ?? null;
  }

  async deleteParsedData(filingId: string): Promise<void> {
    await this.filingRepository
      .createQueryBuilder()
      .update(Filing)
      .set({ parsedData: null } as any)
      .where('id = :filingId', { filingId })
      .execute();

    this.logger.debug(`Deleted parsed data for filing ${filingId}`);
  }
}
