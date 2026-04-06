export enum EnrolmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type OrgType = 'FI' | 'TAX_AUTHORITY';

export interface Organization {
  id: string;
  name: string;
  orgType: OrgType;
  jurisdiction: string;
  giin: string;
  enrolmentStatus: EnrolmentStatus;
  createdAt: string;
}

export interface EnrolmentRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  jurisdiction: string;
  giin: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  status: EnrolmentStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}
