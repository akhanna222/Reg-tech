export enum TransmissionStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  ACK = 'ACK',
  NACK = 'NACK',
  ERROR = 'ERROR',
}

export interface TransmissionPackage {
  id: string;
  filingId: string;
  destination: string;
  packageKey: string;
  signature: string;
  status: TransmissionStatus;
  dispatchedAt: string | null;
  ackReceivedAt: string | null;
  ackPayload: string | null;
}

export type IngestionStatus =
  | 'RECEIVED'
  | 'VERIFIED'
  | 'DECRYPTED'
  | 'VALIDATED'
  | 'INGESTED'
  | 'ERROR';

export interface InboundTransmission {
  id: string;
  sourceJurisdiction: string;
  packageKey: string;
  signatureValid: boolean;
  decryptionOk: boolean;
  structuralValid: boolean;
  ingestionStatus: IngestionStatus;
  errorDetails: string | null;
  receivedAt: string;
  processedAt: string | null;
}
