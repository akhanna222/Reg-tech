import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing, FilingStatus } from '../../database/entities/filing.entity';

export interface SubmissionFilters {
  status?: FilingStatus;
  jurisdiction?: string;
  organizationId?: string;
  filingType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedSubmissions {
  data: Filing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SubmissionBrowserService {
  private readonly logger = new Logger(SubmissionBrowserService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
  ) {}

  async findAll(
    filters: SubmissionFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedSubmissions> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;

    const qb = this.filingRepository
      .createQueryBuilder('filing')
      .leftJoinAndSelect('filing.organization', 'organization')
      .leftJoinAndSelect('filing.validationResults', 'validationResults');

    // Only show submitted and beyond (not drafts)
    qb.andWhere('filing.status != :draftStatus', {
      draftStatus: FilingStatus.DRAFT,
    });

    if (filters.status) {
      qb.andWhere('filing.status = :status', { status: filters.status });
    }

    if (filters.jurisdiction) {
      qb.andWhere('organization.jurisdiction = :jurisdiction', {
        jurisdiction: filters.jurisdiction.toUpperCase(),
      });
    }

    if (filters.organizationId) {
      qb.andWhere('filing.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters.filingType) {
      qb.andWhere('filing.filingType = :filingType', {
        filingType: filters.filingType,
      });
    }

    if (filters.dateFrom) {
      qb.andWhere('filing.submittedAt >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      qb.andWhere('filing.submittedAt <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    // Validate sortBy to prevent injection
    const allowedSorts = ['createdAt', 'submittedAt', 'status', 'filingType', 'reportingPeriod'];
    const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';

    qb.orderBy(`filing.${safeSortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<Filing> {
    const filing = await this.filingRepository.findOne({
      where: { id },
      relations: [
        'organization',
        'documents',
        'validationResults',
      ],
    });

    if (!filing) {
      throw new NotFoundException(`Submission not found: ${id}`);
    }

    return filing;
  }
}
