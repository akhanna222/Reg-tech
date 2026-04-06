import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  TestApp,
  createTestApp,
  closeTestApp,
} from '../helpers/test-app.helper';
import {
  createTestUser,
  getAuthHeaders,
  tokenForFiUser,
  tokenForFiAdmin,
  tokenForTaAdmin,
} from '../helpers/auth.helper';
import {
  createTestOrganization,
  createTestFiling,
  loadXmlFixture,
  cleanupDatabase,
} from '../helpers/fixtures.helper';
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
import { User, UserRole } from '../../src/modules/database/entities/user.entity';

describe('FI Portal (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let orgRepo: Repository<Organization>;
  let filingRepo: Repository<Filing>;
  let docRepo: Repository<FilingDocument>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    jwtService = testApp.module.get(JwtService);
    orgRepo = dataSource.getRepository(Organization);
    filingRepo = dataSource.getRepository(Filing);
    docRepo = dataSource.getRepository(FilingDocument);
    userRepo = dataSource.getRepository(User);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  afterEach(async () => {
    await cleanupDatabase(dataSource);
  });

  // -------------------------------------------------------------------------
  // Enrolment
  // -------------------------------------------------------------------------
  describe('POST /api/fi/enrol', () => {
    it('should submit an enrolment and return 201 with PENDING status', async () => {
      const { token } = await tokenForFiAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .post('/api/fi/enrol')
        .set(getAuthHeaders(token))
        .send({
          institutionName: 'Acme Bank Ltd',
          jurisdiction: 'GB',
          enrolmentType: 'CRS',
          contactEmail: 'compliance@acmebank.com',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.enrolmentStatus ?? res.body.status).toBe('PENDING');
    });
  });

  describe('GET /api/fi/enrolment/:id/status', () => {
    it('should return the current enrolment status', async () => {
      const org = await createTestOrganization(orgRepo, {
        enrolmentStatus: EnrolmentStatus.PENDING,
      });
      const { token } = await tokenForFiAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get(`/api/fi/enrolment/${org.id}/status`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toHaveProperty('enrolmentStatus');
    });
  });

  // -------------------------------------------------------------------------
  // Filings CRUD
  // -------------------------------------------------------------------------
  describe('POST /api/fi/filings', () => {
    it('should create a draft filing and return 201', async () => {
      const { token, user } = await tokenForFiUser(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .post('/api/fi/filings')
        .set(getAuthHeaders(token))
        .send({
          reportingPeriod: '2025',
          filingType: FilingType.CRS,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe(FilingStatus.DRAFT);
      expect(res.body.organizationId).toBe(user.organizationId);
    });
  });

  describe('GET /api/fi/filings', () => {
    it('should list filings for the authenticated user\'s organization', async () => {
      const { token, user } = await tokenForFiUser(dataSource, jwtService);

      // Seed two filings for the user's organization
      await createTestFiling(filingRepo, user.organizationId, {
        reportingPeriod: '2024',
      });
      await createTestFiling(filingRepo, user.organizationId, {
        reportingPeriod: '2025',
      });

      // Seed a filing for a different org to confirm isolation
      const otherOrg = await createTestOrganization(orgRepo, {
        name: 'Other Bank',
      });
      await createTestFiling(filingRepo, otherOrg.id);

      const res = await request(app.getHttpServer())
        .get('/api/fi/filings')
        .set(getAuthHeaders(token))
        .expect(200);

      // The response should only include filings for the user's org
      const filings = Array.isArray(res.body) ? res.body : res.body.data;
      expect(filings.length).toBeGreaterThanOrEqual(2);
      for (const f of filings) {
        expect(f.organizationId).toBe(user.organizationId);
      }
    });
  });

  describe('POST /api/fi/filings/upload', () => {
    it('should upload an XML file and return 201 with a document record', async () => {
      const { token, user } = await tokenForFiUser(dataSource, jwtService);
      const filing = await createTestFiling(filingRepo, user.organizationId);
      const xmlBuffer = loadXmlFixture('crs-valid-single-account.xml');

      const res = await request(app.getHttpServer())
        .post('/api/fi/filings/upload')
        .set(getAuthHeaders(token))
        .query({ filingId: filing.id })
        .attach('file', xmlBuffer, {
          filename: 'crs-valid-single-account.xml',
          contentType: 'application/xml',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.filingId).toBe(filing.id);
      expect(res.body).toHaveProperty('storageKey');
      expect(res.body).toHaveProperty('fileHash');
    });
  });

  // -------------------------------------------------------------------------
  // Filing submission
  // -------------------------------------------------------------------------
  describe('POST /api/fi/filings/:id/submit', () => {
    it('should submit a DRAFT filing and change status to SUBMITTED', async () => {
      const { token, user } = await tokenForFiUser(dataSource, jwtService);
      const filing = await createTestFiling(filingRepo, user.organizationId, {
        status: FilingStatus.DRAFT,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/fi/filings/${filing.id}/submit`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body.status).toBe(FilingStatus.SUBMITTED);
    });

    it('should reject submission if the filing is not in DRAFT status', async () => {
      const { token, user } = await tokenForFiUser(dataSource, jwtService);
      const filing = await createTestFiling(filingRepo, user.organizationId, {
        status: FilingStatus.SUBMITTED,
      });

      await request(app.getHttpServer())
        .post(`/api/fi/filings/${filing.id}/submit`)
        .set(getAuthHeaders(token))
        .expect(400);
    });
  });

  // -------------------------------------------------------------------------
  // Filing detail
  // -------------------------------------------------------------------------
  describe('GET /api/fi/filings/:id', () => {
    it('should return filing detail with validation results', async () => {
      const { token, user } = await tokenForFiUser(dataSource, jwtService);
      const filing = await createTestFiling(filingRepo, user.organizationId);

      const res = await request(app.getHttpServer())
        .get(`/api/fi/filings/${filing.id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toHaveProperty('id', filing.id);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('reportingPeriod');
    });
  });

  // -------------------------------------------------------------------------
  // RBAC
  // -------------------------------------------------------------------------
  describe('RBAC enforcement', () => {
    it('should allow FI_USER to access FI routes', async () => {
      const { token } = await tokenForFiUser(dataSource, jwtService);

      await request(app.getHttpServer())
        .get('/api/fi/filings')
        .set(getAuthHeaders(token))
        .expect(200);
    });

    it('should deny TA_ADMIN from accessing FI routes', async () => {
      const { token } = await tokenForTaAdmin(dataSource, jwtService);

      await request(app.getHttpServer())
        .get('/api/fi/filings')
        .set(getAuthHeaders(token))
        .expect(403);
    });
  });
});
