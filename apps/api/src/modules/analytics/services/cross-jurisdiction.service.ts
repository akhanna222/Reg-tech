import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing } from '../../database/entities/filing.entity';
import { Organization } from '../../database/entities/organization.entity';

export interface JurisdictionStats {
  jurisdiction: string;
  totalFilings: number;
  totalOrganizations: number;
  crsFilings: number;
  fatcaFilings: number;
  submittedCount: number;
  validatedCount: number;
  rejectedCount: number;
  transmittedCount: number;
  complianceRate: number;
  averageFilingsPerOrg: number;
}

export interface JurisdictionComparisonResult {
  reportingPeriod: string;
  jurisdictions: JurisdictionStats[];
  generatedAt: string;
}

@Injectable()
export class CrossJurisdictionService {
  private readonly logger = new Logger(CrossJurisdictionService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Compare filing statistics across multiple jurisdictions for a given reporting period.
   */
  async compareJurisdictions(
    countries: string[],
    reportingPeriod: string,
  ): Promise<JurisdictionComparisonResult> {
    const jurisdictions: JurisdictionStats[] = [];

    for (const country of countries) {
      const jurisdiction = country.toUpperCase();
      const stats = await this.getJurisdictionStats(jurisdiction, reportingPeriod);
      jurisdictions.push(stats);
    }

    return {
      reportingPeriod,
      jurisdictions,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getJurisdictionStats(
    jurisdiction: string,
    reportingPeriod: string,
  ): Promise<JurisdictionStats> {
    const baseQuery = this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.organization', 'org')
      .where('org.jurisdiction = :jurisdiction', { jurisdiction })
      .andWhere('filing.reportingPeriod = :reportingPeriod', { reportingPeriod });

    const totalFilings = await baseQuery.getCount();

    const totalOrganizations = await this.organizationRepository.count({
      where: { jurisdiction },
    });

    // Status breakdown
    const statusBreakdown = await this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.organization', 'org')
      .select('filing.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('org.jurisdiction = :jurisdiction', { jurisdiction })
      .andWhere('filing.reportingPeriod = :reportingPeriod', { reportingPeriod })
      .groupBy('filing.status')
      .getRawMany();

    const statusCounts: Record<string, number> = {};
    for (const row of statusBreakdown) {
      statusCounts[row.status] = parseInt(row.count, 10);
    }

    // Type breakdown
    const typeBreakdown = await this.filingRepository
      .createQueryBuilder('filing')
      .leftJoin('filing.organization', 'org')
      .select('filing.filingType', 'filingType')
      .addSelect('COUNT(*)', 'count')
      .where('org.jurisdiction = :jurisdiction', { jurisdiction })
      .andWhere('filing.reportingPeriod = :reportingPeriod', { reportingPeriod })
      .groupBy('filing.filingType')
      .getRawMany();

    const typeCounts: Record<string, number> = {};
    for (const row of typeBreakdown) {
      typeCounts[row.filingType] = parseInt(row.count, 10);
    }

    const transmittedCount = statusCounts['TRANSMITTED'] ?? 0;
    const complianceRate =
      totalFilings > 0 ? (transmittedCount / totalFilings) * 100 : 0;
    const averageFilingsPerOrg =
      totalOrganizations > 0 ? totalFilings / totalOrganizations : 0;

    return {
      jurisdiction,
      totalFilings,
      totalOrganizations,
      crsFilings: typeCounts['CRS'] ?? 0,
      fatcaFilings: typeCounts['FATCA'] ?? 0,
      submittedCount: statusCounts['SUBMITTED'] ?? 0,
      validatedCount: statusCounts['VALIDATED'] ?? 0,
      rejectedCount: statusCounts['REJECTED'] ?? 0,
      transmittedCount,
      complianceRate: Math.round(complianceRate * 100) / 100,
      averageFilingsPerOrg: Math.round(averageFilingsPerOrg * 100) / 100,
    };
  }
}
