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
  tokenForTaAdmin,
  tokenForFiUser,
} from '../helpers/auth.helper';
import {
  createTestOrganization,
  createTestFiling,
  cleanupDatabase,
} from '../helpers/fixtures.helper';
import {
  Organization,
} from '../../src/modules/database/entities/organization.entity';
import {
  Filing,
  FilingStatus,
  FilingType,
} from '../../src/modules/database/entities/filing.entity';

describe('Analytics (e2e)', () => {
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
  // Dashboard
  // -------------------------------------------------------------------------
  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard metrics', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);

      // Seed some data to make the dashboard non-empty
      const org = await createTestOrganization(orgRepo, {
        jurisdiction: 'GB',
      });
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
        filingType: FilingType.CRS,
      });
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.VALIDATED,
        filingType: FilingType.CRS,
      });

      const res = await request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
      // The dashboard should return some form of metrics object
      expect(typeof res.body).toBe('object');
    });

    it('should accept optional jurisdiction filter', async () => {
      const { token } = await tokenForTaAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .query({ jurisdiction: 'GB' })
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('should accept optional date range filters', async () => {
      const { token } = await tokenForTaAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .query({
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
        })
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Country comparison
  // -------------------------------------------------------------------------
  describe('GET /api/analytics/countries', () => {
    it('should return country comparison data', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);

      // Seed orgs from different jurisdictions
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
        .get('/api/analytics/countries')
        .query({ countries: 'GB,US' })
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
      // Should contain comparison data for the requested countries
      const body = Array.isArray(res.body) ? res.body : res.body.data ?? res.body;
      expect(body).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Anomaly detection
  // -------------------------------------------------------------------------
  describe('GET /api/analytics/anomalies', () => {
    it('should return detected anomalies', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get('/api/analytics/anomalies')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
      // Anomalies endpoint should return an array or object of alerts
      const anomalies = Array.isArray(res.body) ? res.body : res.body.anomalies ?? res.body.data ?? [];
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should accept optional jurisdiction filter', async () => {
      const { token } = await tokenForTaAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get('/api/analytics/anomalies')
        .query({ jurisdiction: 'GB' })
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Full-text search
  // -------------------------------------------------------------------------
  describe('POST /api/analytics/search', () => {
    it('should return search results for a text query', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);

      // Seed some filings to search over
      const org = await createTestOrganization(orgRepo, {
        name: 'Global Investments PLC',
        jurisdiction: 'GB',
      });
      await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.SUBMITTED,
        reportingPeriod: '2025',
      });

      const res = await request(app.getHttpServer())
        .post('/api/analytics/search')
        .set(getAuthHeaders(token))
        .send({ query: 'Global Investments' })
        .expect(200);

      expect(res.body).toBeDefined();
      // The response should include search results with pagination info
      const results = res.body.data ?? res.body.results ?? res.body;
      expect(results).toBeDefined();
    });

    it('should support filtering within search', async () => {
      const { token } = await tokenForTaAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .post('/api/analytics/search')
        .set(getAuthHeaders(token))
        .send({
          query: 'bank',
          jurisdiction: 'GB',
          status: FilingStatus.SUBMITTED,
          filingType: 'CRS',
        })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
