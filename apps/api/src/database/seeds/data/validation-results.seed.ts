/**
 * Validation result seed data.
 *
 * Stages run in order: XSD -> BUSINESS_RULES -> CROSS_RECORD -> JURISDICTION.
 * - VALIDATED / TRANSMITTED filings: all 4 stages PASS
 * - REJECTED filings: XSD PASS, BUSINESS_RULES FAIL with realistic errors
 */

export interface ValidationResultSeed {
  id: string;
  filingId: string;
  stage: 'XSD' | 'BUSINESS_RULES' | 'CROSS_RECORD' | 'JURISDICTION';
  status: 'PASS' | 'FAIL' | 'WARNING';
  errors: Record<string, unknown>[];
  warnings: Record<string, unknown>[];
  executedAt: string;
  ruleVersion: string | null;
}

const allStagesPass = (
  filingId: string,
  baseId: string,
  baseTime: string,
): ValidationResultSeed[] => [
  {
    id: `${baseId}1`,
    filingId,
    stage: 'XSD',
    status: 'PASS',
    errors: [],
    warnings: [],
    executedAt: baseTime,
    ruleVersion: '1.0',
  },
  {
    id: `${baseId}2`,
    filingId,
    stage: 'BUSINESS_RULES',
    status: 'PASS',
    errors: [],
    warnings: [],
    executedAt: new Date(new Date(baseTime).getTime() + 5000).toISOString(),
    ruleVersion: '1.0',
  },
  {
    id: `${baseId}3`,
    filingId,
    stage: 'CROSS_RECORD',
    status: 'PASS',
    errors: [],
    warnings: [],
    executedAt: new Date(new Date(baseTime).getTime() + 10000).toISOString(),
    ruleVersion: '1.0',
  },
  {
    id: `${baseId}4`,
    filingId,
    stage: 'JURISDICTION',
    status: 'PASS',
    errors: [],
    warnings: [],
    executedAt: new Date(new Date(baseTime).getTime() + 15000).toISOString(),
    ruleVersion: '1.0',
  },
];

export const validationResultSeeds: ValidationResultSeed[] = [
  // ── Celtic FS filing 2 (VALIDATED) — all PASS ────────────────────
  ...allStagesPass(
    '20000000-0000-4000-a000-000000000002',
    '40000000-0000-4000-a000-00000000002',
    '2024-11-15T10:35:00Z',
  ),

  // ── Celtic FS filing 3 (TRANSMITTED) — all PASS ──────────────────
  ...allStagesPass(
    '20000000-0000-4000-a000-000000000003',
    '40000000-0000-4000-a000-00000000003',
    '2024-12-01T09:05:00Z',
  ),

  // ── Celtic FS filing 4 (2023 TRANSMITTED) — all PASS ─────────────
  ...allStagesPass(
    '20000000-0000-4000-a000-000000000004',
    '40000000-0000-4000-a000-00000000004',
    '2024-03-15T14:05:00Z',
  ),

  // ── Dublin IB filing 6 (REJECTED) — XSD PASS, BUSINESS_RULES FAIL
  {
    id: '40000000-0000-4000-a000-000000000061',
    filingId: '20000000-0000-4000-a000-000000000006',
    stage: 'XSD',
    status: 'PASS',
    errors: [],
    warnings: [],
    executedAt: '2024-10-05T16:35:00Z',
    ruleVersion: '1.0',
  },
  {
    id: '40000000-0000-4000-a000-000000000062',
    filingId: '20000000-0000-4000-a000-000000000006',
    stage: 'BUSINESS_RULES',
    status: 'FAIL',
    errors: [
      {
        code: 'BR-TIN-001',
        message: 'Invalid TIN format for jurisdiction DE: expected 11 digits',
        path: '/CRSBody/ReportingGroup/AccountReport[3]/AccountHolder/TIN',
        severity: 'ERROR',
        recordIndex: 3,
      },
      {
        code: 'BR-BAL-002',
        message: 'Account balance is negative: -15230.50 EUR',
        path: '/CRSBody/ReportingGroup/AccountReport[7]/AccountBalance',
        severity: 'ERROR',
        recordIndex: 7,
      },
      {
        code: 'BR-MSG-003',
        message: 'Reporting period does not match MessageSpec: expected 2024, found 2023',
        path: '/CRSBody/ReportingGroup/MessageSpec/ReportingPeriod',
        severity: 'ERROR',
        recordIndex: 0,
      },
    ],
    warnings: [
      {
        code: 'BW-ADDR-001',
        message: 'Address field exceeds recommended length of 200 characters',
        path: '/CRSBody/ReportingGroup/AccountReport[5]/AccountHolder/Address/AddressFree',
        severity: 'WARNING',
        recordIndex: 5,
      },
    ],
    executedAt: '2024-10-05T16:35:05Z',
    ruleVersion: '1.0',
  },

  // ── Thames Capital filing 7 (FATCA VALIDATED) — all PASS ─────────
  ...allStagesPass(
    '20000000-0000-4000-a000-000000000007',
    '40000000-0000-4000-a000-00000000007',
    '2024-11-10T08:50:00Z',
  ),

  // ── Thames Capital filing 8 (FATCA TRANSMITTED) — all PASS ───────
  ...allStagesPass(
    '20000000-0000-4000-a000-000000000008',
    '40000000-0000-4000-a000-00000000008',
    '2024-12-05T13:20:00Z',
  ),

  // ── Schneider filing 11 (CRS VALIDATED) — all PASS ───────────────
  ...allStagesPass(
    '20000000-0000-4000-a000-000000000011',
    '40000000-0000-4000-a000-00000000011',
    '2024-11-18T07:35:00Z',
  ),
];
