export enum FilingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  TRANSMITTED = 'TRANSMITTED',
}

export enum FilingType {
  CRS = 'CRS',
  FATCA = 'FATCA',
}

export interface Filing {
  id: string;
  organizationId: string;
  reportingPeriod: string;
  filingType: FilingType;
  status: FilingStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FilingDocument {
  id: string;
  filingId: string;
  storageKey: string;
  fileHash: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: string;
}
