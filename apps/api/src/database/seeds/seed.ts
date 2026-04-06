/**
 * Standalone database seed runner for the Reg-tech platform.
 *
 * Usage:
 *   npx ts-node src/database/seeds/seed.ts
 *
 * Requires DATABASE_URL environment variable (or .env file in the api root / repo root).
 */

import 'reflect-metadata';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ── Entities ───────────────────────────────────────────────────────
import { Organization } from '../../modules/database/entities/organization.entity';
import { User } from '../../modules/database/entities/user.entity';
import { Filing } from '../../modules/database/entities/filing.entity';
import { FilingDocument } from '../../modules/database/entities/filing-document.entity';
import { ValidationResult } from '../../modules/database/entities/validation-result.entity';
import { JurisdictionRule } from '../../modules/database/entities/jurisdiction-rule.entity';
import { ApprovalAction } from '../../modules/database/entities/approval-action.entity';
import { TransmissionPackage } from '../../modules/database/entities/transmission-package.entity';
import { InboundTransmission } from '../../modules/database/entities/inbound-transmission.entity';
import { AuditEvent } from '../../modules/database/entities/audit-event.entity';
import { Notification } from '../../modules/database/entities/notification.entity';

// ── Seed data ──────────────────────────────────────────────────────
import { organizationSeeds, orgId } from './data/organizations.seed';
import { userSeeds } from './data/users.seed';
import { filingSeeds, filingDocumentSeeds } from './data/filings.seed';
import { validationResultSeeds } from './data/validation-results.seed';
import { jurisdictionRuleSeeds } from './data/jurisdiction-rules.seed';
import {
  transmissionPackageSeeds,
  inboundTransmissionSeeds,
} from './data/transmissions.seed';
import { notificationSeeds } from './data/notifications.seed';
import { auditEventSeeds } from './data/audit-events.seed';

// ── Helpers ────────────────────────────────────────────────────────

/** Load dotenv from api root or repo root (best-effort). */
function loadEnv(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    const apiRoot = path.resolve(__dirname, '..', '..', '..');
    const repoRoot = path.resolve(apiRoot, '..', '..');
    dotenv.config({ path: path.join(apiRoot, '.env') });
    dotenv.config({ path: path.join(repoRoot, '.env') });
  } catch {
    // dotenv not installed — rely on environment variables
  }
}

/** Resolve a user email to its seeded UUID. */
function userId(email: string): string {
  const user = userSeeds.find((u) => u.email === email);
  if (!user) throw new Error(`User seed not found for email: ${email}`);
  return user.id;
}

// ── DataSource ─────────────────────────────────────────────────────

function createDataSource(): DataSource {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is required. Set it or create a .env file.',
    );
  }

  return new DataSource({
    type: 'postgres',
    url,
    entities: [
      Organization,
      User,
      Filing,
      FilingDocument,
      ValidationResult,
      JurisdictionRule,
      ApprovalAction,
      TransmissionPackage,
      InboundTransmission,
      AuditEvent,
      Notification,
    ],
    synchronize: false,
    logging: false,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });
}

// ── Seed functions (in dependency order) ───────────────────────────

const BCRYPT_ROUNDS = 10;
const SEED_PASSWORD = 'RegTech2024!';

async function seedOrganizations(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Organization);
  for (const org of organizationSeeds) {
    const exists = await repo.findOneBy({ id: org.id });
    if (!exists) {
      await repo.save(repo.create(org));
    }
  }
  console.log(`  [+] Organizations: ${organizationSeeds.length} records`);
}

async function seedUsers(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(User);
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  for (const u of userSeeds) {
    const exists = await repo.findOneBy({ id: u.id });
    if (!exists) {
      const orgIdValue = orgId(u.organizationName);
      await repo.save(
        repo.create({
          id: u.id,
          organizationId: orgIdValue,
          email: u.email,
          passwordHash,
          totpSecret: u.totpSecret,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as any,
          isActive: u.isActive,
        }),
      );
    }
  }
  console.log(`  [+] Users: ${userSeeds.length} records`);
}

async function seedFilings(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Filing);
  for (const f of filingSeeds) {
    const exists = await repo.findOneBy({ id: f.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: f.id,
          organizationId: orgId(f.organizationName),
          reportingPeriod: f.reportingPeriod,
          filingType: f.filingType as any,
          status: f.status as any,
          submittedBy: f.submittedByEmail ? userId(f.submittedByEmail) : null,
          submittedAt: f.submittedAt ? new Date(f.submittedAt) : null,
        }),
      );
    }
  }
  console.log(`  [+] Filings: ${filingSeeds.length} records`);
}

async function seedFilingDocuments(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(FilingDocument);
  for (const d of filingDocumentSeeds) {
    const exists = await repo.findOneBy({ id: d.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: d.id,
          filingId: d.filingId,
          storageKey: d.storageKey,
          fileHash: d.fileHash,
          fileSize: d.fileSize,
          contentType: d.contentType,
          uploadedBy: userId(d.uploadedByEmail),
        }),
      );
    }
  }
  console.log(`  [+] Filing Documents: ${filingDocumentSeeds.length} records`);
}

async function seedValidationResults(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(ValidationResult);
  for (const vr of validationResultSeeds) {
    const exists = await repo.findOneBy({ id: vr.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: vr.id,
          filingId: vr.filingId,
          stage: vr.stage as any,
          status: vr.status as any,
          errors: vr.errors,
          warnings: vr.warnings,
          executedAt: new Date(vr.executedAt),
          ruleVersion: vr.ruleVersion,
        }),
      );
    }
  }
  console.log(`  [+] Validation Results: ${validationResultSeeds.length} records`);
}

async function seedJurisdictionRules(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(JurisdictionRule);
  for (const jr of jurisdictionRuleSeeds) {
    const exists = await repo.findOneBy({ id: jr.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: jr.id,
          jurisdiction: jr.jurisdiction,
          ruleName: jr.ruleName,
          ruleDefinition: jr.ruleDefinition,
          version: jr.version,
          effectiveFrom: jr.effectiveFrom,
          effectiveTo: jr.effectiveTo,
          isActive: jr.isActive,
          createdBy: userId(jr.createdByEmail),
        }),
      );
    }
  }
  console.log(`  [+] Jurisdiction Rules: ${jurisdictionRuleSeeds.length} records`);
}

async function seedTransmissionPackages(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(TransmissionPackage);
  for (const tp of transmissionPackageSeeds) {
    const exists = await repo.findOneBy({ id: tp.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: tp.id,
          filingId: tp.filingId,
          destination: tp.destination,
          packageKey: tp.packageKey,
          signature: tp.signature,
          status: tp.status as any,
          dispatchedAt: tp.dispatchedAt ? new Date(tp.dispatchedAt) : null,
          ackReceivedAt: tp.ackReceivedAt ? new Date(tp.ackReceivedAt) : null,
          ackPayload: tp.ackPayload,
        }),
      );
    }
  }
  console.log(`  [+] Transmission Packages: ${transmissionPackageSeeds.length} records`);
}

async function seedInboundTransmissions(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(InboundTransmission);
  for (const it of inboundTransmissionSeeds) {
    const exists = await repo.findOneBy({ id: it.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: it.id,
          sourceJurisdiction: it.sourceJurisdiction,
          packageKey: it.packageKey,
          signatureValid: it.signatureValid,
          decryptionOk: it.decryptionOk,
          structuralValid: it.structuralValid,
          ingestionStatus: it.ingestionStatus as any,
          errorDetails: it.errorDetails,
          receivedAt: new Date(it.receivedAt),
          processedAt: it.processedAt ? new Date(it.processedAt) : null,
        }),
      );
    }
  }
  console.log(`  [+] Inbound Transmissions: ${inboundTransmissionSeeds.length} records`);
}

async function seedNotifications(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Notification);
  for (const n of notificationSeeds) {
    const exists = await repo.findOneBy({ id: n.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: n.id,
          userId: userId(n.userEmail),
          type: n.type,
          title: n.title,
          body: n.body,
          resourceType: n.resourceType,
          resourceId: n.resourceId,
          isRead: n.isRead,
          createdAt: new Date(n.createdAt),
        }),
      );
    }
  }
  console.log(`  [+] Notifications: ${notificationSeeds.length} records`);
}

async function seedAuditEvents(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(AuditEvent);
  for (const ae of auditEventSeeds) {
    const exists = await repo.findOneBy({ id: ae.id });
    if (!exists) {
      await repo.save(
        repo.create({
          id: ae.id,
          actorId: ae.actorEmail ? userId(ae.actorEmail) : null,
          actorRole: ae.actorRole,
          action: ae.action,
          resourceType: ae.resourceType,
          resourceId: ae.resourceId,
          jurisdiction: ae.jurisdiction,
          ipAddress: ae.ipAddress,
          payloadHash: ae.payloadHash,
          metadata: ae.metadata,
          createdAt: new Date(ae.createdAt),
        }),
      );
    }
  }
  console.log(`  [+] Audit Events: ${auditEventSeeds.length} records`);
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  console.log('=== Reg-tech Database Seeder ===\n');
  console.log('Connecting to database...');

  const ds = createDataSource();

  try {
    await ds.initialize();
    console.log('Connected.\n');

    console.log('Seeding data (idempotent — existing records are skipped):');

    // Run seeders in dependency order
    await seedOrganizations(ds);
    await seedUsers(ds);
    await seedFilings(ds);
    await seedFilingDocuments(ds);
    await seedValidationResults(ds);
    await seedJurisdictionRules(ds);
    await seedTransmissionPackages(ds);
    await seedInboundTransmissions(ds);
    await seedNotifications(ds);
    await seedAuditEvents(ds);

    console.log('\nSeeding complete.');
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
      console.log('Database connection closed.');
    }
  }
}

main();
