import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filing } from '../../database/entities/filing.entity';

export interface AnomalyAlert {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  organizationId?: string;
  organizationName?: string;
  filingId?: string;
  zScore: number;
  value: number;
  mean: number;
  stddev: number;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
  ) {}

  /**
   * Detect anomalies across filings for a jurisdiction using statistical analysis.
   * Uses z-scores to identify outliers in filing patterns.
   */
  async detectAnomalies(jurisdiction?: string): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Anomaly 1: Filing volume outliers per organization
    const volumeAnomalies = await this.detectVolumeAnomalies(jurisdiction);
    alerts.push(...volumeAnomalies);

    // Anomaly 2: High rejection rate outliers
    const rejectionAnomalies = await this.detectRejectionRateAnomalies(jurisdiction);
    alerts.push(...rejectionAnomalies);

    // Anomaly 3: Unusual submission timing patterns
    const timingAnomalies = await this.detectTimingAnomalies(jurisdiction);
    alerts.push(...timingAnomalies);

    // Sort by severity (HIGH first) then by z-score descending
    const severityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    alerts.sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      return sevDiff !== 0 ? sevDiff : Math.abs(b.zScore) - Math.abs(a.zScore);
    });

    this.logger.debug(
      `Anomaly detection complete: ${alerts.length} alerts for jurisdiction=${jurisdiction ?? 'ALL'}`,
    );

    return alerts;
  }

  private async detectVolumeAnomalies(
    jurisdiction?: string,
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Calculate filing count per org with mean and stddev
    let query = `
      WITH org_counts AS (
        SELECT
          f."organizationId",
          o.name AS org_name,
          COUNT(*) AS filing_count
        FROM filings f
        JOIN organizations o ON o.id = f."organizationId"
        ${jurisdiction ? "WHERE o.jurisdiction = $1" : ""}
        GROUP BY f."organizationId", o.name
      ),
      stats AS (
        SELECT
          AVG(filing_count) AS mean_count,
          STDDEV_POP(filing_count) AS stddev_count
        FROM org_counts
      )
      SELECT
        oc."organizationId",
        oc.org_name,
        oc.filing_count,
        s.mean_count,
        s.stddev_count,
        CASE WHEN s.stddev_count > 0
          THEN (oc.filing_count - s.mean_count) / s.stddev_count
          ELSE 0
        END AS z_score
      FROM org_counts oc, stats s
      WHERE s.stddev_count > 0
        AND ABS((oc.filing_count - s.mean_count) / s.stddev_count) > 2
      ORDER BY ABS((oc.filing_count - s.mean_count) / s.stddev_count) DESC
    `;

    const params = jurisdiction ? [jurisdiction.toUpperCase()] : [];

    try {
      const rows = await this.filingRepository.query(query, params);

      for (const row of rows) {
        const zScore = parseFloat(row.z_score);
        alerts.push({
          type: 'FILING_VOLUME_OUTLIER',
          severity: Math.abs(zScore) > 3 ? 'HIGH' : 'MEDIUM',
          description: `Organization "${row.org_name}" has an unusual filing count (${row.filing_count}) compared to peers`,
          organizationId: row.organizationId,
          organizationName: row.org_name,
          zScore,
          value: parseFloat(row.filing_count),
          mean: parseFloat(row.mean_count),
          stddev: parseFloat(row.stddev_count),
        });
      }
    } catch (error) {
      this.logger.error('Failed to detect volume anomalies', error);
    }

    return alerts;
  }

  private async detectRejectionRateAnomalies(
    jurisdiction?: string,
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    let query = `
      WITH org_rates AS (
        SELECT
          f."organizationId",
          o.name AS org_name,
          COUNT(*) FILTER (WHERE f.status = 'REJECTED')::float / NULLIF(COUNT(*), 0) AS rejection_rate,
          COUNT(*) AS total_filings
        FROM filings f
        JOIN organizations o ON o.id = f."organizationId"
        ${jurisdiction ? "WHERE o.jurisdiction = $1" : ""}
        GROUP BY f."organizationId", o.name
        HAVING COUNT(*) >= 3
      ),
      stats AS (
        SELECT
          AVG(rejection_rate) AS mean_rate,
          STDDEV_POP(rejection_rate) AS stddev_rate
        FROM org_rates
      )
      SELECT
        r."organizationId",
        r.org_name,
        r.rejection_rate,
        r.total_filings,
        s.mean_rate,
        s.stddev_rate,
        CASE WHEN s.stddev_rate > 0
          THEN (r.rejection_rate - s.mean_rate) / s.stddev_rate
          ELSE 0
        END AS z_score
      FROM org_rates r, stats s
      WHERE s.stddev_rate > 0
        AND (r.rejection_rate - s.mean_rate) / s.stddev_rate > 2
      ORDER BY (r.rejection_rate - s.mean_rate) / s.stddev_rate DESC
    `;

    const params = jurisdiction ? [jurisdiction.toUpperCase()] : [];

    try {
      const rows = await this.filingRepository.query(query, params);

      for (const row of rows) {
        const zScore = parseFloat(row.z_score);
        const rate = (parseFloat(row.rejection_rate) * 100).toFixed(1);
        alerts.push({
          type: 'HIGH_REJECTION_RATE',
          severity: Math.abs(zScore) > 3 ? 'HIGH' : 'MEDIUM',
          description: `Organization "${row.org_name}" has a ${rate}% rejection rate (${row.total_filings} filings)`,
          organizationId: row.organizationId,
          organizationName: row.org_name,
          zScore,
          value: parseFloat(row.rejection_rate),
          mean: parseFloat(row.mean_rate),
          stddev: parseFloat(row.stddev_rate),
        });
      }
    } catch (error) {
      this.logger.error('Failed to detect rejection rate anomalies', error);
    }

    return alerts;
  }

  private async detectTimingAnomalies(
    jurisdiction?: string,
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Detect organizations that submit at unusual times (e.g., bulk submissions)
    let query = `
      WITH daily_submissions AS (
        SELECT
          f."organizationId",
          o.name AS org_name,
          DATE(f."submittedAt") AS submit_date,
          COUNT(*) AS daily_count
        FROM filings f
        JOIN organizations o ON o.id = f."organizationId"
        WHERE f."submittedAt" IS NOT NULL
        ${jurisdiction ? "AND o.jurisdiction = $1" : ""}
        GROUP BY f."organizationId", o.name, DATE(f."submittedAt")
      ),
      stats AS (
        SELECT
          AVG(daily_count) AS mean_daily,
          STDDEV_POP(daily_count) AS stddev_daily
        FROM daily_submissions
      )
      SELECT
        ds."organizationId",
        ds.org_name,
        ds.submit_date,
        ds.daily_count,
        s.mean_daily,
        s.stddev_daily,
        CASE WHEN s.stddev_daily > 0
          THEN (ds.daily_count - s.mean_daily) / s.stddev_daily
          ELSE 0
        END AS z_score
      FROM daily_submissions ds, stats s
      WHERE s.stddev_daily > 0
        AND (ds.daily_count - s.mean_daily) / s.stddev_daily > 2.5
      ORDER BY (ds.daily_count - s.mean_daily) / s.stddev_daily DESC
      LIMIT 20
    `;

    const params = jurisdiction ? [jurisdiction.toUpperCase()] : [];

    try {
      const rows = await this.filingRepository.query(query, params);

      for (const row of rows) {
        const zScore = parseFloat(row.z_score);
        alerts.push({
          type: 'UNUSUAL_SUBMISSION_VOLUME',
          severity: 'LOW',
          description: `Organization "${row.org_name}" submitted ${row.daily_count} filings on ${row.submit_date}`,
          organizationId: row.organizationId,
          organizationName: row.org_name,
          zScore,
          value: parseFloat(row.daily_count),
          mean: parseFloat(row.mean_daily),
          stddev: parseFloat(row.stddev_daily),
        });
      }
    } catch (error) {
      this.logger.error('Failed to detect timing anomalies', error);
    }

    return alerts;
  }
}
