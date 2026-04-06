import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TestApp, createTestApp, closeTestApp } from '../helpers/test-app.helper';
import {
  createTestUser,
  loginAsUser,
  getAuthHeaders,
} from '../helpers/auth.helper';
import {
  createTestOrganization,
  cleanupDatabase,
} from '../helpers/fixtures.helper';
import { User, UserRole } from '../../src/modules/database/entities/user.entity';
import {
  Organization,
  OrgType,
  EnrolmentStatus,
} from '../../src/modules/database/entities/organization.entity';

describe('Auth (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let jwtService: JwtService;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    jwtService = testApp.module.get(JwtService);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  afterEach(async () => {
    await cleanupDatabase(dataSource);
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/register
  // -------------------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('should create a user in an approved organization and return 201', async () => {
      const org = await createTestOrganization(orgRepo, {
        enrolmentStatus: EnrolmentStatus.APPROVED,
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!!',
          firstName: 'Jane',
          lastName: 'Doe',
          organizationId: org.id,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('newuser@example.com');
      expect(res.body.firstName).toBe('Jane');
      expect(res.body.role).toBe(UserRole.FI_USER);
      // Sensitive fields must never be returned
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('totpSecret');
    });

    it('should reject registration when the organization is not approved', async () => {
      const org = await createTestOrganization(orgRepo, {
        enrolmentStatus: EnrolmentStatus.PENDING,
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'blocked@example.com',
          password: 'SecurePass123!!',
          firstName: 'Block',
          lastName: 'User',
          organizationId: org.id,
        })
        .expect(403);

      expect(res.body.message).toMatch(/approved/i);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/login
  // -------------------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('should return tokens for valid credentials', async () => {
      const user = await createTestUser(dataSource, {
        email: 'login@example.com',
        password: 'CorrectHorse12!',
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.clearPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
      expect(typeof res.body.tokens.accessToken).toBe('string');
      expect(res.body.tokens.accessToken.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(user.email);
    });

    it('should return 401 for an invalid password', async () => {
      const user = await createTestUser(dataSource, {
        email: 'wrongpw@example.com',
        password: 'RightPassword1!',
      });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword99!',
        })
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/refresh
  // -------------------------------------------------------------------------
  describe('POST /api/auth/refresh', () => {
    it('should return a new access token for a valid refresh token', async () => {
      const user = await createTestUser(dataSource, {
        email: 'refresh@example.com',
        password: 'RefreshMe1234!',
      });

      const tokens = await loginAsUser(
        app,
        user.email,
        user.clearPassword,
      );

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for an expired or invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'this.is.not.a.valid.jwt' })
        .expect(401);
    });
  });
});
