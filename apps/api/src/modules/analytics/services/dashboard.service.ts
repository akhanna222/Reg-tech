import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing } from '../../database/entities/filing.entity';
import { Organization } from '../../database/entities/organization.entity';

export interface DateRange {
  from: string;
  to: string;
}

export interface DashboardMetrics {
  totalFilings: number;
  filingsByStatus: Record<string, number>;
  filingsByType: Record<string, number>;
  recentSubmissions: number;
  pendingValidation: number;
  transmittedCount: number;
  rejectedCount: number;
}

export interface CountryComparison {
  jurisdiction: string;
  totalFilings: number;
  totalOrganizations: number;
  complianceRate: number;
  averageProcessingDays: number;
}

export interface FiPerformanceMetrics {
  organizationId: string;
  totalFilings: number;
  onTimeSubmissions: number;
  rejectionRate: number;
  averageValidationErrors: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getDashboardMetrics(
    jurisdiction?: string,
    dateRange?: DateRange,
  ): Promise<DashboardMetrics> {
    const qb = this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.organization', 'org');

    if (jurisdiction) {
      qb.andWhere('org.jurisdiction = :jurisdiction', {
        jurisdiction: jurisdiction.toUpperCase(),
      });
    }

    if (dateRange?.from) {
      qb.andWhere('filing.createdAt >= :from', { from: dateRange.from });
    }
    if (dateRange?.to) {
      qb.andWhere('filing.createdAt <= :to', { to: dateRange.to });
    }

    const totalFilings = await qb.getCount();

    // Filings by status
    const statusCounts = await this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.organization', 'org')
      .select('filing.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(jurisdiction ? 'org.jurisdiction = :jurisdiction' : '1=1', {
        jurisdiction: jurisdiction?.toUpperCase(),
      })
      .groupBy('filing.status')
      .getRawMany();

    const filingsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      filingsByStatus[row.status] = parseInt(row.count, 10);
    }

    // Filings by type
    const typeCounts = await this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.organization', 'org')
      .select('filing.filingType', 'filingType')
      .addSelect('COUNT(*)', 'count')
      .where(jurisdiction ? 'org.jurisdiction = :jurisdiction' : '1=1', {
        jurisdiction: jurisdiction?.toUpperCase(),
      })
      .groupBy('filing.filingType')
      .getRawMany();

    const filingsByType: Record<string, number> = {};
    for (const row of typeCounts) {
      filingsByType[row.filingType] = parseInt(row.count, 10);
    }

    return {
      totalFilings,
      filingsByStatus,
      filingsByType,
      recentSubmissions: filingsByStatus['SUBMITTED'] ?? 0,
      pendingValidation: filingsByStatus['SUBMITTED'] ?? 0,
      transmittedCount: filingsByStatus['TRANSMITTED'] ?? 0,
      rejectedCount: filingsByStatus['REJECTED'] ?? 0,
    };
  }

  async getCountryComparison(countries: string[]): Promise<CountryComparison[]> {
    const results: CountryComparison[] = [];

    for (const country of countries) {
      const jurisdiction = country.toUpperCase();

      const totalFilings = await this.filingRepository
        .createQueryBuilder('filing')
        .leftJoin('filing.organization', 'org')
        .where('org.jurisdiction = :jurisdiction', { jurisdiction })
        .getCount();

      const totalOrganizations = await this.organizationRepository.count({
        where: { jurisdiction },
      });

      const transmittedCount = await this.filingRepository
        .createQueryBuilder('filing')
        .leftJoin('filing.organization', 'org')
        .where('org.jurisdiction = :jurisdiction', { jurisdiction })
        .andWhere('filing.status = :status', { status: 'TRANSMITTED' })
        .getCount();

      const complianceRate =
        totalFilings > 0 ? (transmittedCount / totalFilings) * 100 : 0;

      // Average processing time (submitted to transmitted)
      const avgResult = await this.filingRepository
        .createQueryBuilder('filing')
        .leftJoin('filing.organization', 'org')
        .select(
          "AVG(EXTRACT(EPOCH FROM (filing.updatedAt - filing.submittedAt)) / 86400)",
          'avgDays',
        )
        .where('org.jurisdiction = :jurisdiction', { jurisdiction })
        .andWhere('filing.status = :status', { status: 'TRANSMITTED' })
        .andWhere('filing.submittedAt IS NOT NULL')
        .getRawOne();

      results.push({
        jurisdiction,
        totalFilings,
        totalOrganizations,
        complianceRate: Math.round(complianceRate * 100) / 100,
        averageProcessingDays: parseFloat(avgResult?.avgDays ?? '0') || 0,
      });
    }

    return results;
  }

  async getFiPerformanceMetrics(orgId: string): Promise<FiPerformanceMetrics> {
    const totalFilings = await this.filingRepository.count({
      where: { organizationId: orgId },
    });

    const rejectedCount = await this.filingRepository.count({
      where: { organizationId: orgId, status: 'REJECTED' as any },
    });

    const rejectionRate =
      totalFilings > 0 ? (rejectedCount / totalFilings) * 100 : 0;

    // Average validation errors per filing
    const avgErrors = await this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.validationResults', 'vr')
      .select('AVG(jsonb_array_length(vr.errors))', 'avgErrors')
      .where('filing.organizationId = :orgId', { orgId })
      .getRawOne();

    return {
      organizationId: orgId,
      totalFilings,
      onTimeSubmissions: totalFilings - rejectedCount, // Simplified
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      averageValidationErrors: parseFloat(avgErrors?.avgErrors ?? '0') || 0,
    };
  }
}
