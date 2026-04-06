export enum UserRole {
  FI_USER = 'FI_USER',
  FI_ADMIN = 'FI_ADMIN',
  TA_REVIEWER = 'TA_REVIEWER',
  TA_APPROVER = 'TA_APPROVER',
  TA_ADMIN = 'TA_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: UserRole;
  isActive: boolean;
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  requiresTwoFactor: boolean;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  iat: number;
  exp: number;
}
