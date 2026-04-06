/**
 * Organization seed data for the Reg-tech platform.
 *
 * 3 Tax Authorities + 6 Financial Institutions across IE, GB, DE.
 */

export interface OrganizationSeed {
  id: string;
  name: string;
  orgType: 'FI' | 'TAX_AUTHORITY';
  jurisdiction: string;
  giin: string | null;
  enrolmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const organizationSeeds: OrganizationSeed[] = [
  // ── Tax Authorities ──────────────────────────────────────────────
  {
    id: '00000000-0000-4000-a000-000000000001',
    name: 'Irish Revenue Commissioners',
    orgType: 'TAX_AUTHORITY',
    jurisdiction: 'IE',
    giin: null,
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    name: 'HM Revenue & Customs',
    orgType: 'TAX_AUTHORITY',
    jurisdiction: 'GB',
    giin: null,
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000003',
    name: 'Bundeszentralamt für Steuern',
    orgType: 'TAX_AUTHORITY',
    jurisdiction: 'DE',
    giin: null,
    enrolmentStatus: 'APPROVED',
  },

  // ── Financial Institutions ───────────────────────────────────────
  {
    id: '00000000-0000-4000-a000-000000000010',
    name: 'Celtic Financial Services',
    orgType: 'FI',
    jurisdiction: 'IE',
    giin: 'A1B2C3.00000.IE.001',
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000011',
    name: 'Dublin Investment Bank',
    orgType: 'FI',
    jurisdiction: 'IE',
    giin: 'D4E5F6.00000.IE.002',
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000012',
    name: 'Thames Capital Ltd',
    orgType: 'FI',
    jurisdiction: 'GB',
    giin: 'B2C3D4.00000.GB.001',
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000013',
    name: 'London Wealth Management',
    orgType: 'FI',
    jurisdiction: 'GB',
    giin: 'G7H8I9.00000.GB.002',
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000014',
    name: 'Schneider Finanzgruppe',
    orgType: 'FI',
    jurisdiction: 'DE',
    giin: 'J1K2L3.00000.DE.001',
    enrolmentStatus: 'APPROVED',
  },
  {
    id: '00000000-0000-4000-a000-000000000015',
    name: 'Emerald Trust Company',
    orgType: 'FI',
    jurisdiction: 'IE',
    giin: null,
    enrolmentStatus: 'PENDING',
  },
];

/** Lookup helper: resolve org id by name fragment. */
export function orgId(nameFragment: string): string {
  const org = organizationSeeds.find((o) =>
    o.name.toLowerCase().includes(nameFragment.toLowerCase()),
  );
  if (!org) throw new Error(`Organization not found: ${nameFragment}`);
  return org.id;
}
