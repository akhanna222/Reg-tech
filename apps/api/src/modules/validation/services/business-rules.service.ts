import { Injectable, Logger } from '@nestjs/common';

export interface BusinessRuleViolation {
  ruleId: string;
  severity: 'ERROR' | 'WARNING';
  field: string;
  message: string;
  recordIndex?: number;
}

export interface BusinessRulesResult {
  valid: boolean;
  violations: BusinessRuleViolation[];
}

// Common TIN format patterns by jurisdiction
const TIN_PATTERNS: Record<string, RegExp> = {
  US: /^\d{9}$/, // SSN/EIN format
  GB: /^\d{10}$/, // UK UTR
  DE: /^\d{11}$/, // German tax ID
  FR: /^\d{13}$/, // French SPI
  AU: /^\d{9}$/, // Australian TFN
  CA: /^\d{9}$/, // Canadian SIN
};

// ISO 3166-1 alpha-2 country codes (subset for validation)
const VALID_COUNTRY_CODES = new Set([
  'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB',
  'BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','KH','CM',
  'CA','CV','CF','TD','CL','CN','CO','KM','CG','CR','CI','HR','CU','CY','CZ',
  'DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','ET','FJ','FI','FR','GA',
  'GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN',
  'ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW',
  'KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MK','MG','MW','MY','MV',
  'ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA',
  'NR','NP','NL','NZ','NI','NE','NG','NO','OM','PK','PW','PA','PG','PY','PE',
  'PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN',
  'RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SZ',
  'SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV',
  'UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW',
]);

@Injectable()
export class BusinessRulesService {
  private readonly logger = new Logger(BusinessRulesService.name);

  /**
   * Validate parsed filing data against business rules for the given jurisdiction.
   * Checks: TIN formats, country codes, date ranges, mandatory fields.
   */
  async validateBusinessRules(
    parsedData: Record<string, unknown>,
    jurisdiction: string,
  ): Promise<BusinessRulesResult> {
    const violations: BusinessRuleViolation[] = [];

    const accounts = (parsedData.accounts ?? []) as Record<string, unknown>[];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      // Rule BR-001: TIN format validation
      this.validateTinFormat(account, jurisdiction, i, violations);

      // Rule BR-002: Country code validation
      this.validateCountryCode(account, i, violations);

      // Rule BR-003: Date range validation
      this.validateDateRanges(account, i, violations);

      // Rule BR-004: Mandatory field checks
      this.validateMandatoryFields(account, i, violations);

      // Rule BR-005: Account balance must be non-negative
      this.validateAccountBalance(account, i, violations);
    }

    const valid = !violations.some((v) => v.severity === 'ERROR');

    this.logger.debug(
      `Business rules validation: valid=${valid}, violations=${violations.length}, jurisdiction=${jurisdiction}`,
    );

    return { valid, violations };
  }

  private validateTinFormat(
    account: Record<string, unknown>,
    jurisdiction: string,
    index: number,
    violations: BusinessRuleViolation[],
  ): void {
    const tin = account.tin as string | undefined;
    if (!tin) {
      violations.push({
        ruleId: 'BR-001',
        severity: 'ERROR',
        field: 'tin',
        message: 'TIN is required for each account holder',
        recordIndex: index,
      });
      return;
    }

    const pattern = TIN_PATTERNS[jurisdiction];
    if (pattern && !pattern.test(tin.replace(/[\s-]/g, ''))) {
      violations.push({
        ruleId: 'BR-001',
        severity: 'WARNING',
        field: 'tin',
        message: `TIN format may not match expected pattern for jurisdiction ${jurisdiction}`,
        recordIndex: index,
      });
    }
  }

  private validateCountryCode(
    account: Record<string, unknown>,
    index: number,
    violations: BusinessRuleViolation[],
  ): void {
    const countryCode = account.residenceCountryCode as string | undefined;
    if (countryCode && !VALID_COUNTRY_CODES.has(countryCode.toUpperCase())) {
      violations.push({
        ruleId: 'BR-002',
        severity: 'ERROR',
        field: 'residenceCountryCode',
        message: `Invalid country code: ${countryCode}`,
        recordIndex: index,
      });
    }
  }

  private validateDateRanges(
    account: Record<string, unknown>,
    index: number,
    violations: BusinessRuleViolation[],
  ): void {
    const birthDate = account.birthDate as string | undefined;
    if (birthDate) {
      const date = new Date(birthDate);
      const now = new Date();
      if (date > now) {
        violations.push({
          ruleId: 'BR-003',
          severity: 'ERROR',
          field: 'birthDate',
          message: 'Birth date cannot be in the future',
          recordIndex: index,
        });
      }
      if (date < new Date('1900-01-01')) {
        violations.push({
          ruleId: 'BR-003',
          severity: 'WARNING',
          field: 'birthDate',
          message: 'Birth date is before 1900, please verify',
          recordIndex: index,
        });
      }
    }
  }

  private validateMandatoryFields(
    account: Record<string, unknown>,
    index: number,
    violations: BusinessRuleViolation[],
  ): void {
    const requiredFields = ['accountNumber', 'accountHolderName', 'tin'];
    for (const field of requiredFields) {
      if (!account[field]) {
        violations.push({
          ruleId: 'BR-004',
          severity: 'ERROR',
          field,
          message: `Mandatory field "${field}" is missing`,
          recordIndex: index,
        });
      }
    }
  }

  private validateAccountBalance(
    account: Record<string, unknown>,
    index: number,
    violations: BusinessRuleViolation[],
  ): void {
    const balance = account.accountBalance as number | undefined;
    if (balance !== undefined && balance < 0) {
      violations.push({
        ruleId: 'BR-005',
        severity: 'WARNING',
        field: 'accountBalance',
        message: 'Negative account balance detected, please verify',
        recordIndex: index,
      });
    }
  }
}
