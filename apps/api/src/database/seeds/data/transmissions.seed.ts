/**
 * Transmission package and inbound transmission seed data.
 */

export interface TransmissionPackageSeed {
  id: string;
  filingId: string;
  destination: string;
  packageKey: string;
  signature: string | null;
  status: 'PENDING' | 'DISPATCHED' | 'ACK' | 'NACK' | 'ERROR';
  dispatchedAt: string | null;
  ackReceivedAt: string | null;
  ackPayload: Record<string, unknown> | null;
}

export interface InboundTransmissionSeed {
  id: string;
  sourceJurisdiction: string;
  packageKey: string;
  signatureValid: boolean | null;
  decryptionOk: boolean | null;
  structuralValid: boolean | null;
  ingestionStatus: 'RECEIVED' | 'VERIFIED' | 'DECRYPTED' | 'VALIDATED' | 'INGESTED' | 'ERROR';
  errorDetails: Record<string, unknown> | null;
  receivedAt: string;
  processedAt: string | null;
}

export const transmissionPackageSeeds: TransmissionPackageSeed[] = [
  // Celtic FS 2024 CRS -> DE (filing 3)
  {
    id: '60000000-0000-4000-a000-000000000001',
    filingId: '20000000-0000-4000-a000-000000000003',
    destination: 'DE',
    packageKey: 'transmissions/outbound/2024/IE-DE-CRS-20241215-001.xml.enc',
    signature: 'MEUCIQC7xK9nR3mFp2v8TqJb5A0dYz1wXe+kL2hN4gM6oP9sBgIgVt3uW7yR2sQ4xF8jH0kD5aL9nP6mC1bE3vA4wG8iJ=',
    status: 'ACK',
    dispatchedAt: '2024-12-15T08:00:00Z',
    ackReceivedAt: '2024-12-16T10:30:00Z',
    ackPayload: {
      messageRefId: 'IE-DE-CRS-20241215-001',
      status: 'Accepted',
      timestamp: '2024-12-16T10:30:00Z',
      warnings: [],
      acceptedRecords: 145,
      rejectedRecords: 0,
    },
  },
  // Celtic FS 2023 CRS -> DE (filing 4)
  {
    id: '60000000-0000-4000-a000-000000000002',
    filingId: '20000000-0000-4000-a000-000000000004',
    destination: 'DE',
    packageKey: 'transmissions/outbound/2023/IE-DE-CRS-20240320-001.xml.enc',
    signature: 'MEQCIHr5tN2wK8aJ4vB6xD0fG3iL5mO7qS9uW1yA3cE5gI8KAIGAZZ+bD4hF6jH8lN0pR2tV4xB6dA8fC0eG2iK4mO6q=',
    status: 'ACK',
    dispatchedAt: '2024-03-20T09:00:00Z',
    ackReceivedAt: '2024-03-21T14:15:00Z',
    ackPayload: {
      messageRefId: 'IE-DE-CRS-20240320-001',
      status: 'Accepted',
      timestamp: '2024-03-21T14:15:00Z',
      warnings: [],
      acceptedRecords: 112,
      rejectedRecords: 0,
    },
  },
  // Thames Capital 2024 FATCA -> US (filing 8)
  {
    id: '60000000-0000-4000-a000-000000000003',
    filingId: '20000000-0000-4000-a000-000000000008',
    destination: 'US',
    packageKey: 'transmissions/outbound/2024/GB-US-FATCA-20241210-001.xml.enc',
    signature: 'MEYCIQDp3sU7wL9bK1eH4jN6rT8vZ0xB2dF5hJ7lP9nR1tV3XAIHAMY+cE5gI8kM0oQ2sW4yA6bD8fH0jL2nP4rT6vX=',
    status: 'ACK',
    dispatchedAt: '2024-12-10T11:00:00Z',
    ackReceivedAt: '2024-12-11T16:45:00Z',
    ackPayload: {
      messageRefId: 'GB-US-FATCA-20241210-001',
      status: 'Accepted',
      timestamp: '2024-12-11T16:45:00Z',
      warnings: [
        {
          code: 'WARN-001',
          message: 'TIN format advisory: 2 records use ITIN format',
        },
      ],
      acceptedRecords: 87,
      rejectedRecords: 0,
    },
  },
];

export const inboundTransmissionSeeds: InboundTransmissionSeed[] = [
  {
    id: '60000000-0000-4000-a000-000000000010',
    sourceJurisdiction: 'DE',
    packageKey: 'transmissions/inbound/2024/DE-IE-CRS-20241220-001.xml.enc',
    signatureValid: true,
    decryptionOk: true,
    structuralValid: true,
    ingestionStatus: 'INGESTED',
    errorDetails: null,
    receivedAt: '2024-12-20T06:00:00Z',
    processedAt: '2024-12-20T06:12:34Z',
  },
];
