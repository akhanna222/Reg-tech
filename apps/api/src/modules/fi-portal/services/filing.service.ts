import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Filing, FilingStatus } from '../../database/entities/filing.entity';
import { CreateFilingDto, UpdateFilingDto } from '../dto/create-filing.dto';

export interface FilingFilters {
  status?: FilingStatus;
  filingType?: string;
  reportingPeriod?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFilings {
  data: Filing[];
  total: number;
  page: number;
  limit: number;
}

/** Allowed status transitions for filings. */
const VALID_STATUS_TRANSITIONS: Record<FilingStatus, FilingStatus[]> = {
  [FilingStatus.DRAFT]: [FilingStatus.SUBMITTED],
  [FilingStatus.SUBMITTED]: [FilingStatus.VALIDATED, FilingStatus.REJECTED],
  [FilingStatus.VALIDATED]: [FilingStatus.TRANSMITTED],
  [FilingStatus.REJECTED]: [FilingStatus.DRAFT],
  [FilingStatus.TRANSMITTED]: [],
};

@Injectable()
export class FilingService {
  private readonly logger = new Logger(FilingService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectQueue('validation')
    private readonly validationQueue: Queue,
  ) {}

  async createFiling(dto: CreateFilingDto, orgId: string): Promise<Filing> {
    const filing = this.filingRepository.create({
      organizationId: orgId,
      reportingPeriod: dto.reportingPeriod,
      filingType: dto.filingType,
      status: FilingStatus.DRAFT,
    });

    const saved = await this.filingRepository.save(filing);
    this.logger.log(`Filing created: ${saved.id} for org ${orgId}`);
    return saved;
  }

  async listFilings(
    orgId: string,
    filters: FilingFilters = {},
  ): Promise<PaginatedFilings> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.filingRepository
      .createQueryBuilder('filing')
      .where('filing.organizationId = :orgId', { orgId });

    if (filters.status) {
      qb.andWhere('filing.status = :status', { status: filters.status });
    }
    if (filters.filingType) {
      qb.andWhere('filing.filingType = :filingType', {
        filingType: filters.filingType,
      });
    }
    if (filters.reportingPeriod) {
      qb.andWhere('filing.reportingPeriod = :reportingPeriod', {
        reportingPeriod: filters.reportingPeriod,
      });
    }

    qb.orderBy('filing.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async getFiling(id: string): Promise<Filing> {
    const filing = await this.filingRepository.findOne({
      where: { id },
      relations: ['documents', 'validationResults', 'organization'],
    });

    if (!filing) {
      throw new NotFoundException(`Filing not found: ${id}`);
    }

    return filing;
  }

  async updateFiling(id: string, dto: UpdateFilingDto): Promise<Filing> {
    const filing = await this.getFiling(id);

    if (filing.status !== FilingStatus.DRAFT) {
      throw new BadRequestException(
        `Filing can only be updated in DRAFT status. Current status: ${filing.status}`,
      );
    }

    if (dto.reportingPeriod !== undefined) {
      filing.reportingPeriod = dto.reportingPeriod;
    }

    return this.filingRepository.save(filing);
  }

  async submitFiling(id: string, userId: string): Promise<Filing> {
    const filing = await this.getFiling(id);

    this.validateStatusTransition(filing.status, FilingStatus.SUBMITTED);

    filing.status = FilingStatus.SUBMITTED;
    filing.submittedBy = userId;
    filing.submittedAt = new Date();

    const saved = await this.filingRepository.save(filing);

    // Trigger async validation pipeline
    await this.validationQueue.add('validate-filing', {
      filingId: id,
      submittedBy: userId,
    });

    this.logger.log(`Filing ${id} submitted by user ${userId}, validation queued`);

    return saved;
  }

  private validateStatusTransition(
    currentStatus: FilingStatus,
    targetStatus: FilingStatus,
  ): void {
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
      );
    }
  }
}
