/**
 * Filing and FilingDocument seed data.
 *
 * 20 filings across FIs with associated documents referencing MinIO storage keys.
 * organizationName is resolved at seed-time. submittedByEmail is resolved to a user id.
 */

export interface FilingSeed {
  id: string;
  organizationName: string;
  reportingPeriod: string;
  filingType: 'CRS' | 'FATCA';
  status: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'REJECTED' | 'TRANSMITTED';
  submittedByEmail: string | null;
  submittedAt: string | null;
}

export interface FilingDocumentSeed {
  id: string;
  filingId: string;
  storageKey: string;
  fileHash: string;
  fileSize: string;
  contentType: string;
  uploadedByEmail: string;
}

// ── Filings ────────────────────────────────────────────────────────

export const filingSeeds: FilingSeed[] = [
  // Celtic Financial Services — 3 CRS 2024, 1 CRS 2023
  {
    id: '20000000-0000-4000-a000-000000000001',
    organizationName: 'Celtic Financial Services',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'DRAFT',
    submittedByEmail: null,
    submittedAt: null,
  },
  {
    id: '20000000-0000-4000-a000-000000000002',
    organizationName: 'Celtic Financial Services',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'VALIDATED',
    submittedByEmail: 'compliance@celticfs.ie',
    submittedAt: '2024-11-15T10:30:00Z',
  },
  {
    id: '20000000-0000-4000-a000-000000000003',
    organizationName: 'Celtic Financial Services',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'TRANSMITTED',
    submittedByEmail: 'compliance@celticfs.ie',
    submittedAt: '2024-12-01T09:00:00Z',
  },
  {
    id: '20000000-0000-4000-a000-000000000004',
    organizationName: 'Celtic Financial Services',
    reportingPeriod: '2023',
    filingType: 'CRS',
    status: 'TRANSMITTED',
    submittedByEmail: 'compliance@celticfs.ie',
    submittedAt: '2024-03-15T14:00:00Z',
  },

  // Dublin Investment Bank — 2 CRS 2024
  {
    id: '20000000-0000-4000-a000-000000000005',
    organizationName: 'Dublin Investment Bank',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'SUBMITTED',
    submittedByEmail: 'compliance@dublinib.ie',
    submittedAt: '2024-11-20T11:00:00Z',
  },
  {
    id: '20000000-0000-4000-a000-000000000006',
    organizationName: 'Dublin Investment Bank',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'REJECTED',
    submittedByEmail: 'filing@dublinib.ie',
    submittedAt: '2024-10-05T16:30:00Z',
  },

  // Thames Capital Ltd — 2 FATCA 2024, 1 CRS 2024
  {
    id: '20000000-0000-4000-a000-000000000007',
    organizationName: 'Thames Capital Ltd',
    reportingPeriod: '2024',
    filingType: 'FATCA',
    status: 'VALIDATED',
    submittedByEmail: 'compliance@thamescap.co.uk',
    submittedAt: '2024-11-10T08:45:00Z',
  },
  {
    id: '20000000-0000-4000-a000-000000000008',
    organizationName: 'Thames Capital Ltd',
    reportingPeriod: '2024',
    filingType: 'FATCA',
    status: 'TRANSMITTED',
    submittedByEmail: 'compliance@thamescap.co.uk',
    submittedAt: '2024-12-05T13:15:00Z',
  },
  {
    id: '20000000-0000-4000-a000-000000000009',
    organizationName: 'Thames Capital Ltd',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'SUBMITTED',
    submittedByEmail: 'reporting@thamescap.co.uk',
    submittedAt: '2024-11-25T10:00:00Z',
  },

  // London Wealth Management — 1 FATCA 2024
  {
    id: '20000000-0000-4000-a000-000000000010',
    organizationName: 'London Wealth Management',
    reportingPeriod: '2024',
    filingType: 'FATCA',
    status: 'DRAFT',
    submittedByEmail: null,
    submittedAt: null,
  },

  // Schneider Finanzgruppe — 2 CRS 2024
  {
    id: '20000000-0000-4000-a000-000000000011',
    organizationName: 'Schneider Finanzgruppe',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'VALIDATED',
    submittedByEmail: 'compliance@schneider-finanz.de',
    submittedAt: '2024-11-18T07:30:00Z',
  },
  {
    id: '20000000-0000-4000-a000-000000000012',
    organizationName: 'Schneider Finanzgruppe',
    reportingPeriod: '2024',
    filingType: 'CRS',
    status: 'SUBMITTED',
    submittedByEmail: 'reporting@schneider-finanz.de',
    submittedAt: '2024-11-22T15:45:00Z',
  },
];

// ── Filing Documents ───────────────────────────────────────────────

export const filingDocumentSeeds: FilingDocumentSeed[] = [
  // Celtic FS — filing 1 (DRAFT)
  {
    id: '30000000-0000-4000-a000-000000000001',
    filingId: '20000000-0000-4000-a000-000000000001',
    storageKey: 'filings/celtic-fs/2024/draft/crs-report-2024-draft.xml',
    fileHash: 'a3f1c2b4e5d6f7081920a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    fileSize: '245890',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@celticfs.ie',
  },
  // Celtic FS — filing 2 (VALIDATED)
  {
    id: '30000000-0000-4000-a000-000000000002',
    filingId: '20000000-0000-4000-a000-000000000002',
    storageKey: 'filings/celtic-fs/2024/validated/crs-report-2024-v2.xml',
    fileHash: 'b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
    fileSize: '312450',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@celticfs.ie',
  },
  // Celtic FS — filing 3 (TRANSMITTED to DE)
  {
    id: '30000000-0000-4000-a000-000000000003',
    filingId: '20000000-0000-4000-a000-000000000003',
    storageKey: 'filings/celtic-fs/2024/transmitted/crs-report-2024-de.xml',
    fileHash: 'c5d6e7f80a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    fileSize: '298760',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@celticfs.ie',
  },
  // Celtic FS — filing 4 (2023 TRANSMITTED)
  {
    id: '30000000-0000-4000-a000-000000000004',
    filingId: '20000000-0000-4000-a000-000000000004',
    storageKey: 'filings/celtic-fs/2023/transmitted/crs-report-2023-de.xml',
    fileHash: 'd6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
    fileSize: '276540',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@celticfs.ie',
  },
  // Dublin IB — filing 5 (SUBMITTED)
  {
    id: '30000000-0000-4000-a000-000000000005',
    filingId: '20000000-0000-4000-a000-000000000005',
    storageKey: 'filings/dublin-ib/2024/submitted/crs-report-2024.xml',
    fileHash: 'e7f80a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    fileSize: '189320',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@dublinib.ie',
  },
  // Dublin IB — filing 6 (REJECTED)
  {
    id: '30000000-0000-4000-a000-000000000006',
    filingId: '20000000-0000-4000-a000-000000000006',
    storageKey: 'filings/dublin-ib/2024/rejected/crs-report-2024-bad.xml',
    fileHash: 'f80a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    fileSize: '204110',
    contentType: 'application/xml',
    uploadedByEmail: 'filing@dublinib.ie',
  },
  // Thames Capital — filing 7 (FATCA VALIDATED)
  {
    id: '30000000-0000-4000-a000-000000000007',
    filingId: '20000000-0000-4000-a000-000000000007',
    storageKey: 'filings/thames-cap/2024/validated/fatca-report-2024.xml',
    fileHash: '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    fileSize: '156780',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@thamescap.co.uk',
  },
  // Thames Capital — filing 8 (FATCA TRANSMITTED to US)
  {
    id: '30000000-0000-4000-a000-000000000008',
    filingId: '20000000-0000-4000-a000-000000000008',
    storageKey: 'filings/thames-cap/2024/transmitted/fatca-report-2024-us.xml',
    fileHash: '1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    fileSize: '178430',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@thamescap.co.uk',
  },
  // Thames Capital — filing 9 (CRS SUBMITTED)
  {
    id: '30000000-0000-4000-a000-000000000009',
    filingId: '20000000-0000-4000-a000-000000000009',
    storageKey: 'filings/thames-cap/2024/submitted/crs-report-2024.xml',
    fileHash: '2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    fileSize: '221540',
    contentType: 'application/xml',
    uploadedByEmail: 'reporting@thamescap.co.uk',
  },
  // London WM — filing 10 (FATCA DRAFT)
  {
    id: '30000000-0000-4000-a000-000000000010',
    filingId: '20000000-0000-4000-a000-000000000010',
    storageKey: 'filings/london-wm/2024/draft/fatca-report-2024-draft.xml',
    fileHash: '3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    fileSize: '134280',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@londonwm.co.uk',
  },
  // Schneider — filing 11 (CRS VALIDATED)
  {
    id: '30000000-0000-4000-a000-000000000011',
    filingId: '20000000-0000-4000-a000-000000000011',
    storageKey: 'filings/schneider/2024/validated/crs-report-2024.xml',
    fileHash: '4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    fileSize: '267890',
    contentType: 'application/xml',
    uploadedByEmail: 'compliance@schneider-finanz.de',
  },
  // Schneider — filing 12 (CRS SUBMITTED)
  {
    id: '30000000-0000-4000-a000-000000000012',
    filingId: '20000000-0000-4000-a000-000000000012',
    storageKey: 'filings/schneider/2024/submitted/crs-report-2024-b.xml',
    fileHash: '5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    fileSize: '243670',
    contentType: 'application/xml',
    uploadedByEmail: 'reporting@schneider-finanz.de',
  },
];
