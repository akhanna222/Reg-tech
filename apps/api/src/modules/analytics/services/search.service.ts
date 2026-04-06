import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing } from '../../database/entities/filing.entity';

export interface SearchFilters {
  status?: string;
  filingType?: string;
  jurisdiction?: string;
  reportingPeriod?: string;
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResult {
  data: Filing[];
  total: number;
  page: number;
  limit: number;
  query: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
  ) {}

  /**
   * Full-text search over filings using PostgreSQL tsvector.
   * Searches across organization name, filing type, reporting period, and status.
   * To be upgraded to OpenSearch/Elasticsearch in a future iteration.
   */
  async searchFilings(
    query: string,
    filters: SearchFilters = {},
    page = 1,
    limit = 20,
  ): Promise<SearchResult> {
    const qb = this.filingRepository
      .createQueryBuilder('filing')
      .leftJoinAndSelect('filing.organization', 'org')
      .leftJoinAndSelect('filing.validationResults', 'vr');

    if (query && query.trim().length > 0) {
      const sanitizedQuery = this.sanitizeSearchQuery(query);
      // PostgreSQL full-text search using to_tsvector and to_tsquery
      qb.andWhere(
        `(
          to_tsvector('english', COALESCE(org.name, '')) ||
          to_tsvector('english', COALESCE(filing."reportingPeriod", '')) ||
          to_tsvector('english', COALESCE(filing."filingType"::text, '')) ||
          to_tsvector('english', COALESCE(filing.status::text, ''))
        ) @@ plainto_tsquery('english', :query)`,
        { query: sanitizedQuery },
      );
    }

    // Apply filters
    if (filters.status) {
      qb.andWhere('filing.status = :status', { status: filters.status });
    }
    if (filters.filingType) {
      qb.andWhere('filing.filingType = :filingType', {
        filingType: filters.filingType,
      });
    }
    if (filters.jurisdiction) {
      qb.andWhere('org.jurisdiction = :jurisdiction', {
        jurisdiction: filters.jurisdiction.toUpperCase(),
      });
    }
    if (filters.reportingPeriod) {
      qb.andWhere('filing.reportingPeriod = :reportingPeriod', {
        reportingPeriod: filters.reportingPeriod,
      });
    }
    if (filters.organizationId) {
      qb.andWhere('filing.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }
    if (filters.dateFrom) {
      qb.andWhere('filing.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('filing.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    qb.orderBy('filing.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, query };
  }

  /**
   * Sanitize search query to prevent injection in to_tsquery.
   */
  private sanitizeSearchQuery(query: string): string {
    // Remove special tsquery characters, keep only alphanumeric and spaces
    return query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  }
}
