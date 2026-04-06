/**
 * Jurisdiction rule seed data in json-rules-engine format.
 *
 * createdByEmail is resolved to a user id at seed-time.
 */

export interface JurisdictionRuleSeed {
  id: string;
  jurisdiction: string;
  ruleName: string;
  ruleDefinition: Record<string, unknown>;
  version: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdByEmail: string;
}

export const jurisdictionRuleSeeds: JurisdictionRuleSeed[] = [
  // ── IE Rules ─────────────────────────────────────────────────────
  {
    id: '50000000-0000-4000-a000-000000000001',
    jurisdiction: 'IE',
    ruleName: 'IE-TIN-FORMAT',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'accountHolder',
            path: '$.jurisdiction',
            operator: 'equal',
            value: 'IE',
          },
          {
            fact: 'accountHolder',
            path: '$.tin',
            operator: 'doesNotMatch',
            value: '^[0-9]{7}[A-Z]{1,2}$',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'IE-TIN-001',
          message: 'TIN format must be 7 digits followed by 1-2 letters (Irish PPS number)',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'admin@revenue.ie',
  },
  {
    id: '50000000-0000-4000-a000-000000000002',
    jurisdiction: 'IE',
    ruleName: 'IE-HIGH-VALUE-ACCOUNT',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'account',
            path: '$.balance',
            operator: 'greaterThan',
            value: 1000000,
          },
          {
            fact: 'account',
            path: '$.currency',
            operator: 'equal',
            value: 'EUR',
          },
        ],
      },
      event: {
        type: 'validation-warning',
        params: {
          code: 'IE-HVA-001',
          message: 'Account balance exceeds EUR 1,000,000 threshold — flagged for enhanced review',
          severity: 'WARNING',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'admin@revenue.ie',
  },

  // ── GB Rules ─────────────────────────────────────────────────────
  {
    id: '50000000-0000-4000-a000-000000000003',
    jurisdiction: 'GB',
    ruleName: 'GB-TIN-FORMAT',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'accountHolder',
            path: '$.jurisdiction',
            operator: 'equal',
            value: 'GB',
          },
          {
            fact: 'accountHolder',
            path: '$.tin',
            operator: 'doesNotMatch',
            value: '^[0-9]{10}$',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'GB-TIN-001',
          message: 'TIN format must be 10 digits (UK Unique Taxpayer Reference)',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'admin@hmrc.gov.uk',
  },
  {
    id: '50000000-0000-4000-a000-000000000004',
    jurisdiction: 'GB',
    ruleName: 'GB-FATCA-US-TIN-REQUIRED',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'filing',
            path: '$.filingType',
            operator: 'equal',
            value: 'FATCA',
          },
          {
            fact: 'accountHolder',
            path: '$.usTin',
            operator: 'equal',
            value: '',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'GB-FATCA-001',
          message: 'FATCA reporting requires a valid US TIN for the account holder',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'admin@hmrc.gov.uk',
  },

  // ── DE Rules ─────────────────────────────────────────────────────
  {
    id: '50000000-0000-4000-a000-000000000005',
    jurisdiction: 'DE',
    ruleName: 'DE-TIN-FORMAT',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'accountHolder',
            path: '$.jurisdiction',
            operator: 'equal',
            value: 'DE',
          },
          {
            fact: 'accountHolder',
            path: '$.tin',
            operator: 'doesNotMatch',
            value: '^[0-9]{11}$',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'DE-TIN-001',
          message: 'TIN format must be 11 digits (German Steuerliche Identifikationsnummer)',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'admin@bzst.de',
  },
  {
    id: '50000000-0000-4000-a000-000000000006',
    jurisdiction: 'DE',
    ruleName: 'DE-REPORTING-PERIOD-CALENDAR-YEAR',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'filing',
            path: '$.jurisdiction',
            operator: 'equal',
            value: 'DE',
          },
          {
            fact: 'messageSpec',
            path: '$.reportingPeriod',
            operator: 'doesNotMatch',
            value: '^[0-9]{4}$',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'DE-RP-001',
          message: 'Reporting period must match a calendar year (4-digit format)',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'admin@bzst.de',
  },

  // ── GLOBAL Rules ─────────────────────────────────────────────────
  {
    id: '50000000-0000-4000-a000-000000000007',
    jurisdiction: 'XX',
    ruleName: 'GLOBAL-ACCOUNT-HOLDER-NAME-REQUIRED',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'accountHolder',
            path: '$.name',
            operator: 'equal',
            value: '',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'GL-NAME-001',
          message: 'Account holder name must not be empty',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'sysadmin@regtech.platform',
  },
  {
    id: '50000000-0000-4000-a000-000000000008',
    jurisdiction: 'XX',
    ruleName: 'GLOBAL-COUNTRY-CODE-ISO-3166',
    ruleDefinition: {
      conditions: {
        all: [
          {
            fact: 'accountHolder',
            path: '$.countryCode',
            operator: 'doesNotMatch',
            value: '^[A-Z]{2}$',
          },
        ],
      },
      event: {
        type: 'validation-error',
        params: {
          code: 'GL-CC-001',
          message: 'Country code must be a valid ISO 3166-1 alpha-2 code',
          severity: 'ERROR',
        },
      },
    },
    version: 1,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isActive: true,
    createdByEmail: 'sysadmin@regtech.platform',
  },
];
