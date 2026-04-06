import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../src/modules/database/entities/user.entity';
import {
  Organization,
  OrgType,
  EnrolmentStatus,
} from '../../src/modules/database/entities/organization.entity';

// ---------------------------------------------------------------------------
// Token & header helpers
// ---------------------------------------------------------------------------

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Perform a login via the public API and return the JWT token pair.
 */
export async function loginAsUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<TokenPair> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
  };
}

/**
 * Build an Authorization header object suitable for supertest `.set()`.
 */
export function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// ---------------------------------------------------------------------------
// Direct user creation (bypasses the API for speed)
// ---------------------------------------------------------------------------

export interface CreateTestUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
}

/**
 * Directly insert a user into the database via the TypeORM repository.
 * Returns the persisted entity together with the cleartext password so callers
 * can later authenticate through the API.
 */
export async function createTestUser(
  dataSource: DataSource,
  userData: CreateTestUserInput = {},
): Promise<User & { clearPassword: string }> {
  const userRepo: Repository<User> = dataSource.getRepository(User);
  const orgRepo: Repository<Organization> = dataSource.getRepository(Organization);

  // Ensure an organization exists for the user
  let orgId = userData.organizationId;
  if (!orgId) {
    const org = orgRepo.create({
      name: 'Test Organization',
      orgType: OrgType.FI,
      jurisdiction: 'GB',
      giin: null,
      enrolmentStatus: EnrolmentStatus.APPROVED,
    });
    const savedOrg = await orgRepo.save(org);
    orgId = savedOrg.id;
  }

  const clearPassword = userData.password ?? 'TestPassword123!';
  const passwordHash = await bcrypt.hash(clearPassword, 10);

  const user = userRepo.create({
    email: userData.email ?? `test-${Date.now()}@example.com`,
    passwordHash,
    firstName: userData.firstName ?? 'Test',
    lastName: userData.lastName ?? 'User',
    role: userData.role ?? UserRole.FI_USER,
    organizationId: orgId,
    isActive: userData.isActive ?? true,
    totpSecret: null,
  });

  const saved = await userRepo.save(user);
  return Object.assign(saved, { clearPassword });
}

// ---------------------------------------------------------------------------
// Pre-built role-specific token generators
// ---------------------------------------------------------------------------

/**
 * Create a user with the given role, then sign a JWT for that user directly
 * (without going through the login endpoint) for fast, isolated tests.
 */
async function generateTokenForRole(
  dataSource: DataSource,
  jwtService: JwtService,
  role: UserRole,
): Promise<{ token: string; user: User }> {
  const user = await createTestUser(dataSource, { role });

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    isTwoFactorAuthenticated: false,
  };

  const token = jwtService.sign(payload);
  return { token, user };
}

export async function tokenForFiUser(
  dataSource: DataSource,
  jwtService: JwtService,
) {
  return generateTokenForRole(dataSource, jwtService, UserRole.FI_USER);
}

export async function tokenForFiAdmin(
  dataSource: DataSource,
  jwtService: JwtService,
) {
  return generateTokenForRole(dataSource, jwtService, UserRole.FI_ADMIN);
}

export async function tokenForTaReviewer(
  dataSource: DataSource,
  jwtService: JwtService,
) {
  return generateTokenForRole(dataSource, jwtService, UserRole.TA_REVIEWER);
}

export async function tokenForTaApprover(
  dataSource: DataSource,
  jwtService: JwtService,
) {
  return generateTokenForRole(dataSource, jwtService, UserRole.TA_APPROVER);
}

export async function tokenForTaAdmin(
  dataSource: DataSource,
  jwtService: JwtService,
) {
  return generateTokenForRole(dataSource, jwtService, UserRole.TA_ADMIN);
}

export async function tokenForSystemAdmin(
  dataSource: DataSource,
  jwtService: JwtService,
) {
  return generateTokenForRole(dataSource, jwtService, UserRole.SYSTEM_ADMIN);
}
