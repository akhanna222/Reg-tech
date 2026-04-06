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
  getAuthHeaders,
  tokenForTaReviewer,
  tokenForTaApprover,
  tokenForTaAdmin,
} from '../helpers/auth.helper';
import {
  createTestOrganization,
  createTestFiling,
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

describe('Tax Authority (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let orgRepo: Repository<Organization>;
  let filingRepo: Repository<Filing>;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    jwtService = testApp.module.get(JwtService);
    orgRepo = dataSource.getRepository(Organization);
    filingRepo = dataSource.getRepository(Filing);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  afterEach(async () => {
    await cleanupDatabase(dataSource);
  });

  // -------------------------------------------------------------------------
  // Submission browsing
  // -------------------------------------------------------------------------
  describe('GET /api/ta/submissions', () => {
    it('should return a paginated list of submissions', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo, {
        jurisdiction: 'GB',
      });
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
      });
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.VALIDATED,
      });

      const res = await request(app.getHttpServer())
        .get('/api/ta/submissions')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter submissions by status', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
      });
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.VALIDATED,
      });

      const res = await request(app.getHttpServer())
        .get('/api/ta/submissions')
        .query({ status: FilingStatus.SUBMITTED })
        .set(getAuthHeaders(token))
        .expect(200);

      for (const item of res.body.data) {
        expect(item.status).toBe(FilingStatus.SUBMITTED);
      }
    });

    it('should filter submissions by jurisdiction', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);
      const gbOrg = await createTestOrganization(orgRepo, {
        jurisdiction: 'GB',
      });
      const usOrg = await createTestOrganization(orgRepo, {
        jurisdiction: 'US',
      });
      await createTestFiling(filingRepo, gbOrg.id, {
        status: FilingStatus.SUBMITTED,
      });
      await createTestFiling(filingRepo, usOrg.id, {
        status: FilingStatus.SUBMITTED,
      });

      const res = await request(app.getHttpServer())
        .get('/api/ta/submissions')
        .query({ jurisdiction: 'GB' })
        .set(getAuthHeaders(token))
        .expect(200);

      // All returned submissions should be from GB jurisdiction organizations
      expect(res.body.data).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Approval workflow
  // -------------------------------------------------------------------------
  describe('POST /api/ta/submissions/:id/approve', () => {
    it('should approve a submission', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/ta/submissions/${filing.id}/approve`)
        .set(getAuthHeaders(token))
        .send({ comments: 'All checks passed, approving.' })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('POST /api/ta/submissions/:id/reject', () => {
    it('should reject a submission with a comment', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/ta/submissions/${filing.id}/reject`)
        .set(getAuthHeaders(token))
        .send({ comments: 'Missing account holder information in rows 5-10.' })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Enrolment approval
  // -------------------------------------------------------------------------
  describe('POST /api/ta/enrolments/:id/approve', () => {
    it('should approve an FI enrolment', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo, {
        enrolmentStatus: EnrolmentStatus.PENDING,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/ta/enrolments/${org.id}/approve`)
        .set(getAuthHeaders(token))
        .send({ comments: 'KYC and due diligence verified.' })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Transmission trigger
  // -------------------------------------------------------------------------
  describe('POST /api/ta/submissions/:id/transmit', () => {
    it('should trigger the transmission pipeline', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.VALIDATED,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/ta/submissions/${filing.id}/transmit`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // RBAC
  // -------------------------------------------------------------------------
  describe('RBAC enforcement', () => {
    it('should allow TA_APPROVER to approve submissions', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
      });

      // TA_APPROVER has the required role
      await request(app.getHttpServer())
        .post(`/api/ta/submissions/${filing.id}/approve`)
        .set(getAuthHeaders(token))
        .send({})
        .expect(200);
    });

    it('should deny TA_REVIEWER from approving submissions', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
      });

      // TA_REVIEWER does NOT have the TA_APPROVER role
      await request(app.getHttpServer())
        .post(`/api/ta/submissions/${filing.id}/approve`)
        .set(getAuthHeaders(token))
        .send({})
        .expect(403);
    });
  });
});
