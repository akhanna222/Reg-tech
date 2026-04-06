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
  tokenForSystemAdmin,
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
} from '../../src/modules/database/entities/filing.entity';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../src/modules/database/entities/transmission-package.entity';

describe('Transmission (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let orgRepo: Repository<Organization>;
  let filingRepo: Repository<Filing>;
  let transmissionRepo: Repository<TransmissionPackage>;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    jwtService = testApp.module.get(JwtService);
    orgRepo = dataSource.getRepository(Organization);
    filingRepo = dataSource.getRepository(Filing);
    transmissionRepo = dataSource.getRepository(TransmissionPackage);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  afterEach(async () => {
    await cleanupDatabase(dataSource);
  });

  // -------------------------------------------------------------------------
  // CTS inbound
  // -------------------------------------------------------------------------
  describe('POST /api/cts/inbound', () => {
    it('should receive an inbound package and return 202', async () => {
      const { token } = await tokenForSystemAdmin(dataSource, jwtService);

      const packageContent = Buffer.from(
        '<CrsStatusMessage>OK</CrsStatusMessage>',
      ).toString('base64');

      const res = await request(app.getHttpServer())
        .post('/api/cts/inbound')
        .set(getAuthHeaders(token))
        .send({
          packageBase64: packageContent,
          sourceJurisdiction: 'DE',
        })
        .expect(202);

      expect(res.body).toHaveProperty('accepted', true);
      expect(res.body).toHaveProperty('jobId');
      expect(res.body.message).toContain('DE');
    });

    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/cts/inbound')
        .send({
          packageBase64: 'dGVzdA==',
          sourceJurisdiction: 'FR',
        })
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // Transmission status
  // -------------------------------------------------------------------------
  describe('GET /api/transmission/:id/status', () => {
    it('should return the transmission status', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.TRANSMITTED,
      });

      // Seed a transmission package directly
      const transmission = await transmissionRepo.save(
        transmissionRepo.create({
          filingId: filing.id,
          destination: 'GB',
          packageKey: `transmissions/${filing.id}/package.xml.enc`,
          signature: null,
          status: TransmissionStatus.DISPATCHED,
          dispatchedAt: new Date(),
          ackReceivedAt: null,
          ackPayload: null,
        }),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/transmission/${transmission.id}/status`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toHaveProperty('id', transmission.id);
      expect(res.body).toHaveProperty('filingId', filing.id);
      expect(res.body).toHaveProperty('destination', 'GB');
      expect(res.body).toHaveProperty('status', TransmissionStatus.DISPATCHED);
      expect(res.body).toHaveProperty('dispatchedAt');
    });

    it('should handle non-existent transmission ID gracefully', async () => {
      const { token } = await tokenForTaApprover(dataSource, jwtService);
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app.getHttpServer())
        .get(`/api/transmission/${fakeId}/status`)
        .set(getAuthHeaders(token))
        .expect(200); // Controller returns error object, not 404

      expect(res.body).toHaveProperty('error');
    });
  });

  // -------------------------------------------------------------------------
  // Inbound listing
  // -------------------------------------------------------------------------
  describe('GET /api/inbound', () => {
    it('should list inbound transmissions', async () => {
      const { token } = await tokenForTaReviewer(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get('/api/inbound')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should paginate inbound transmissions', async () => {
      const { token } = await tokenForTaAdmin(dataSource, jwtService);

      const res = await request(app.getHttpServer())
        .get('/api/inbound')
        .query({ page: 1, limit: 5 })
        .set(getAuthHeaders(token))
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
      expect(res.body).toHaveProperty('totalPages');
    });

    it('should deny access to unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/api/inbound')
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // ACK / NACK handling
  // -------------------------------------------------------------------------
  describe('POST /api/cts/ack/:transmissionId', () => {
    it('should process an ACK for a dispatched transmission', async () => {
      const { token } = await tokenForSystemAdmin(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.TRANSMITTED,
      });
      const transmission = await transmissionRepo.save(
        transmissionRepo.create({
          filingId: filing.id,
          destination: 'US',
          packageKey: `transmissions/${filing.id}/package.xml.enc`,
          status: TransmissionStatus.DISPATCHED,
          dispatchedAt: new Date(),
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/cts/ack/${transmission.id}`)
        .set(getAuthHeaders(token))
        .send({
          messageRefId: `MSG-${filing.id}`,
          status: 'ACCEPTED',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('POST /api/cts/nack/:transmissionId', () => {
    it('should process a NACK for a dispatched transmission', async () => {
      const { token } = await tokenForSystemAdmin(dataSource, jwtService);
      const org = await createTestOrganization(orgRepo);
      const filing = await createTestFiling(filingRepo, org.id, {
        status: FilingStatus.TRANSMITTED,
      });
      const transmission = await transmissionRepo.save(
        transmissionRepo.create({
          filingId: filing.id,
          destination: 'FR',
          packageKey: `transmissions/${filing.id}/package.xml.enc`,
          status: TransmissionStatus.DISPATCHED,
          dispatchedAt: new Date(),
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/cts/nack/${transmission.id}`)
        .set(getAuthHeaders(token))
        .send({
          messageRefId: `MSG-${filing.id}`,
          errorCode: 'SCHEMA_VALIDATION_FAILED',
          errorDescription: 'The submitted package failed XSD validation on the receiving end.',
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
