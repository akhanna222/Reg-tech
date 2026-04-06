import * as fs from 'fs';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import {
  Organization,
  OrgType,
  EnrolmentStatus,
} from '../../src/modules/database/entities/organization.entity';
import {
  Filing,
  FilingType,
  FilingStatus,
} from '../../src/modules/database/entities/filing.entity';
import { FilingDocument } from '../../src/modules/database/entities/filing-document.entity';

// ---------------------------------------------------------------------------
// XML fixture loader
// ---------------------------------------------------------------------------

const FIXTURES_XML_DIR = path.resolve(__dirname, '..', 'fixtures', 'xml');

/**
 * Read an XML fixture file from `test/fixtures/xml/` and return it as a Buffer
 * suitable for upload tests.
 */
export function loadXmlFixture(filename: string): Buffer {
  const filePath = path.join(FIXTURES_XML_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`XML fixture not found: ${filePath}`);
  }
  return fs.readFileSync(filePath);
}

// ---------------------------------------------------------------------------
// Entity factory helpers
// ---------------------------------------------------------------------------

export interface OrgOverrides {
  name?: string;
  orgType?: OrgType;
  jurisdiction?: string;
  giin?: string | null;
  enrolmentStatus?: EnrolmentStatus;
}

/**
 * Create and persist an Organization with sensible defaults.
 */
export async function createTestOrganization(
  repo: Repository<Organization>,
  overrides: OrgOverrides = {},
): Promise<Organization> {
  const org = repo.create({
    name: overrides.name ?? `Test FI ${Date.now()}`,
    orgType: overrides.orgType ?? OrgType.FI,
    jurisdiction: overrides.jurisdiction ?? 'GB',
    giin: overrides.giin !== undefined ? overrides.giin : null,
    enrolmentStatus: overrides.enrolmentStatus ?? EnrolmentStatus.APPROVED,
  });
  return repo.save(org);
}

export interface FilingOverrides {
  reportingPeriod?: string;
  filingType?: FilingType;
  status?: FilingStatus;
  submittedBy?: string | null;
  submittedAt?: Date | null;
}

/**
 * Create and persist a Filing linked to the given organization.
 */
export async function createTestFiling(
  repo: Repository<Filing>,
  orgId: string,
  overrides: FilingOverrides = {},
): Promise<Filing> {
  const filing = repo.create({
    organizationId: orgId,
    reportingPeriod: overrides.reportingPeriod ?? '2025',
    filingType: overrides.filingType ?? FilingType.CRS,
    status: overrides.status ?? FilingStatus.DRAFT,
    submittedBy: overrides.submittedBy ?? null,
    submittedAt: overrides.submittedAt ?? null,
  });
  return repo.save(filing);
}

export interface FilingDocumentOverrides {
  storageKey?: string;
  fileHash?: string;
  fileSize?: string;
  contentType?: string;
  uploadedBy?: string;
}

/**
 * Create and persist a FilingDocument for the specified filing.
 */
export async function createTestFilingDocument(
  repo: Repository<FilingDocument>,
  filingId: string,
  overrides: FilingDocumentOverrides = {},
): Promise<FilingDocument> {
  const doc = repo.create({
    filingId,
    storageKey:
      overrides.storageKey ?? `uploads/test/${filingId}/${Date.now()}.xml`,
    fileHash:
      overrides.fileHash ??
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSize: overrides.fileSize ?? '1024',
    contentType: overrides.contentType ?? 'application/xml',
    uploadedBy:
      overrides.uploadedBy ?? '00000000-0000-0000-0000-000000000000',
  });
  return repo.save(doc);
}

// ---------------------------------------------------------------------------
// Database cleanup
// ---------------------------------------------------------------------------

/**
 * Entity deletion order respects FK constraints.  Tables are truncated in
 * reverse-dependency order so that no FK violation occurs even when the DB
 * engine enforces constraints during TRUNCATE (as Postgres does by default
 * without CASCADE).
 */
const TRUNCATION_ORDER = [
  'validation_results',
  'filing_documents',
  'approval_actions',
  'transmission_packages',
  'inbound_transmissions',
  'audit_events',
  'notifications',
  'filings',
  'users',
  'organizations',
  'jurisdiction_rules',
];

/**
 * Truncate all application tables in the correct FK order.
 *
 * For Postgres the TRUNCATE ... CASCADE shorthand is used.  For SQLite
 * (in-memory test databases) rows are deleted table-by-table in dependency
 * order.
 */
export async function cleanupDatabase(dataSource: DataSource): Promise<void> {
  const dbType = dataSource.options.type;

  if (dbType === 'postgres') {
    const tableList = TRUNCATION_ORDER.map((t) => `"${t}"`).join(', ');
    await dataSource.query(`TRUNCATE TABLE ${tableList} CASCADE`);
  } else {
    // SQLite / better-sqlite3: DELETE in order
    for (const table of TRUNCATION_ORDER) {
      try {
        await dataSource.query(`DELETE FROM "${table}"`);
      } catch {
        // Table may not exist in lightweight test schemas -- ignore
      }
    }
  }
}
