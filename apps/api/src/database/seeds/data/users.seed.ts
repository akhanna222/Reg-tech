/**
 * User seed data for the Reg-tech platform.
 *
 * organizationName is resolved to an id at seed-time via orgId().
 * All passwords = "RegTech2024!" (hashed by the runner).
 */

export interface UserSeed {
  id: string;
  organizationName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'FI_USER' | 'FI_ADMIN' | 'TA_REVIEWER' | 'TA_APPROVER' | 'TA_ADMIN' | 'SYSTEM_ADMIN';
  isActive: boolean;
  totpSecret: string | null;
}

export const userSeeds: UserSeed[] = [
  // ── Irish Revenue Commissioners ──────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000001',
    organizationName: 'Irish Revenue Commissioners',
    email: 'admin@revenue.ie',
    firstName: 'Siobhan',
    lastName: 'Murphy',
    role: 'TA_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000002',
    organizationName: 'Irish Revenue Commissioners',
    email: 'reviewer@revenue.ie',
    firstName: 'Padraig',
    lastName: 'O\'Brien',
    role: 'TA_REVIEWER',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000003',
    organizationName: 'Irish Revenue Commissioners',
    email: 'approver@revenue.ie',
    firstName: 'Aisling',
    lastName: 'Byrne',
    role: 'TA_APPROVER',
    isActive: true,
    totpSecret: null,
  },

  // ── HM Revenue & Customs ────────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000004',
    organizationName: 'HM Revenue & Customs',
    email: 'admin@hmrc.gov.uk',
    firstName: 'James',
    lastName: 'Whitfield',
    role: 'TA_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000005',
    organizationName: 'HM Revenue & Customs',
    email: 'reviewer@hmrc.gov.uk',
    firstName: 'Emma',
    lastName: 'Clarke',
    role: 'TA_REVIEWER',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000006',
    organizationName: 'HM Revenue & Customs',
    email: 'approver@hmrc.gov.uk',
    firstName: 'Oliver',
    lastName: 'Grant',
    role: 'TA_APPROVER',
    isActive: true,
    totpSecret: null,
  },

  // ── Bundeszentralamt für Steuern ─────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000007',
    organizationName: 'Bundeszentralamt für Steuern',
    email: 'admin@bzst.de',
    firstName: 'Hans',
    lastName: 'Müller',
    role: 'TA_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000008',
    organizationName: 'Bundeszentralamt für Steuern',
    email: 'reviewer@bzst.de',
    firstName: 'Katrin',
    lastName: 'Weber',
    role: 'TA_REVIEWER',
    isActive: true,
    totpSecret: null,
  },

  // ── Celtic Financial Services ────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000010',
    organizationName: 'Celtic Financial Services',
    email: 'compliance@celticfs.ie',
    firstName: 'Ciaran',
    lastName: 'Doyle',
    role: 'FI_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000011',
    organizationName: 'Celtic Financial Services',
    email: 'analyst@celticfs.ie',
    firstName: 'Niamh',
    lastName: 'Kelly',
    role: 'FI_USER',
    isActive: true,
    totpSecret: null,
  },

  // ── Dublin Investment Bank ───────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000012',
    organizationName: 'Dublin Investment Bank',
    email: 'compliance@dublinib.ie',
    firstName: 'Declan',
    lastName: 'Walsh',
    role: 'FI_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000013',
    organizationName: 'Dublin Investment Bank',
    email: 'filing@dublinib.ie',
    firstName: 'Roisin',
    lastName: 'Fitzgerald',
    role: 'FI_USER',
    isActive: true,
    totpSecret: null,
  },

  // ── Thames Capital Ltd ───────────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000014',
    organizationName: 'Thames Capital Ltd',
    email: 'compliance@thamescap.co.uk',
    firstName: 'Charlotte',
    lastName: 'Hughes',
    role: 'FI_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000015',
    organizationName: 'Thames Capital Ltd',
    email: 'reporting@thamescap.co.uk',
    firstName: 'William',
    lastName: 'Davies',
    role: 'FI_USER',
    isActive: true,
    totpSecret: null,
  },

  // ── London Wealth Management ─────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000016',
    organizationName: 'London Wealth Management',
    email: 'compliance@londonwm.co.uk',
    firstName: 'Sophie',
    lastName: 'Taylor',
    role: 'FI_ADMIN',
    isActive: true,
    totpSecret: null,
  },

  // ── Schneider Finanzgruppe ───────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000017',
    organizationName: 'Schneider Finanzgruppe',
    email: 'compliance@schneider-finanz.de',
    firstName: 'Stefan',
    lastName: 'Schneider',
    role: 'FI_ADMIN',
    isActive: true,
    totpSecret: null,
  },
  {
    id: '10000000-0000-4000-a000-000000000018',
    organizationName: 'Schneider Finanzgruppe',
    email: 'reporting@schneider-finanz.de',
    firstName: 'Anna',
    lastName: 'Fischer',
    role: 'FI_USER',
    isActive: true,
    totpSecret: null,
  },

  // ── System Admin ─────────────────────────────────────────────────
  {
    id: '10000000-0000-4000-a000-000000000099',
    organizationName: 'Irish Revenue Commissioners', // system admin attached to primary TA
    email: 'sysadmin@regtech.platform',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'SYSTEM_ADMIN',
    isActive: true,
    totpSecret: null,
  },
];
