import { Injectable, Logger } from '@nestjs/common';

export interface CrossRecordViolation {
  ruleId: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  affectedRecords: number[];
}

export interface CrossRecordResult {
  valid: boolean;
  violations: CrossRecordViolation[];
  duplicatesDetected: number;
}

@Injectable()
export class CrossRecordValidatorService {
  private readonly logger = new Logger(CrossRecordValidatorService.name);

  /**
   * Validate across all records in a filing for:
   * - Duplicate detection by TIN + name combination
   * - Aggregation checks (e.g., reported totals vs sum of records)
   * - Consistency checks across related records
   */
  async validateCrossRecord(
    records: Record<string, unknown>[],
  ): Promise<CrossRecordResult> {
    const violations: CrossRecordViolation[] = [];

    // Duplicate detection by TIN + normalized name
    const duplicates = this.detectDuplicates(records);
    violations.push(...duplicates);

    // Aggregation checks
    const aggregationIssues = this.checkAggregations(records);
    violations.push(...aggregationIssues);

    // Consistency checks
    const consistencyIssues = this.checkConsistency(records);
    violations.push(...consistencyIssues);

    const duplicatesDetected = duplicates.length;
    const valid = !violations.some((v) => v.severity === 'ERROR');

    this.logger.debug(
      `Cross-record validation: valid=${valid}, duplicates=${duplicatesDetected}, total_violations=${violations.length}`,
    );

    return { valid, violations, duplicatesDetected };
  }

  private detectDuplicates(
    records: Record<string, unknown>[],
  ): CrossRecordViolation[] {
    const violations: CrossRecordViolation[] = [];
    const seen = new Map<string, number[]>();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const tin = (record.tin as string)?.trim().toUpperCase() ?? '';
      const name = (record.accountHolderName as string)?.trim().toUpperCase() ?? '';

      if (!tin || !name) continue;

      const key = `${tin}::${name}`;
      const existing = seen.get(key);
      if (existing) {
        existing.push(i);
      } else {
        seen.set(key, [i]);
      }
    }

    for (const [key, indices] of seen.entries()) {
      if (indices.length > 1) {
        violations.push({
          ruleId: 'CR-001',
          severity: 'ERROR',
          message: `Duplicate TIN+Name detected: "${key}" appears in ${indices.length} records`,
          affectedRecords: indices,
        });
      }
    }

    return violations;
  }

  private checkAggregations(
    records: Record<string, unknown>[],
  ): CrossRecordViolation[] {
    const violations: CrossRecordViolation[] = [];

    // Group by account number and check for balance consistency
    const accountGroups = new Map<string, number[]>();
    for (let i = 0; i < records.length; i++) {
      const accountNumber = records[i].accountNumber as string | undefined;
      if (!accountNumber) continue;

      const existing = accountGroups.get(accountNumber);
      if (existing) {
        existing.push(i);
      } else {
        accountGroups.set(accountNumber, [i]);
      }
    }

    for (const [accountNumber, indices] of accountGroups.entries()) {
      if (indices.length > 1) {
        // Check that balances are consistent for same account
        const balances = indices.map(
          (i) => records[i].accountBalance as number | undefined,
        );
        const uniqueBalances = new Set(balances.filter((b) => b !== undefined));
        if (uniqueBalances.size > 1) {
          violations.push({
            ruleId: 'CR-002',
            severity: 'WARNING',
            message: `Account ${accountNumber} has inconsistent balances across ${indices.length} records`,
            affectedRecords: indices,
          });
        }
      }
    }

    return violations;
  }

  private checkConsistency(
    records: Record<string, unknown>[],
  ): CrossRecordViolation[] {
    const violations: CrossRecordViolation[] = [];

    // Check that currency codes are consistent within the filing
    const currencies = new Set<string>();
    for (const record of records) {
      const currency = record.currencyCode as string | undefined;
      if (currency) currencies.add(currency.toUpperCase());
    }

    if (currencies.size > 1) {
      violations.push({
        ruleId: 'CR-003',
        severity: 'WARNING',
        message: `Multiple currency codes detected in filing: ${[...currencies].join(', ')}. Verify this is intentional.`,
        affectedRecords: [],
      });
    }

    return violations;
  }
}
