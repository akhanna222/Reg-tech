/**
 * Notification seed data.
 *
 * userEmail is resolved to a userId at seed-time.
 */

export interface NotificationSeed {
  id: string;
  userEmail: string;
  type: string;
  title: string;
  body: string | null;
  resourceType: string | null;
  resourceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationSeeds: NotificationSeed[] = [
  // ── Filing submission confirmations ──────────────────────────────
  {
    id: '70000000-0000-4000-a000-000000000001',
    userEmail: 'compliance@celticfs.ie',
    type: 'FILING_SUBMITTED',
    title: 'Filing submitted successfully',
    body: 'Your CRS filing for reporting period 2024 has been submitted and is awaiting validation.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000002',
    isRead: true,
    createdAt: '2024-11-15T10:31:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000002',
    userEmail: 'compliance@celticfs.ie',
    type: 'FILING_SUBMITTED',
    title: 'Filing submitted successfully',
    body: 'Your CRS filing for reporting period 2024 has been submitted and is awaiting validation.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000003',
    isRead: true,
    createdAt: '2024-12-01T09:01:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000003',
    userEmail: 'compliance@dublinib.ie',
    type: 'FILING_SUBMITTED',
    title: 'Filing submitted successfully',
    body: 'Your CRS filing for reporting period 2024 has been submitted and is awaiting validation.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000005',
    isRead: false,
    createdAt: '2024-11-20T11:01:00Z',
  },

  // ── Validation results ───────────────────────────────────────────
  {
    id: '70000000-0000-4000-a000-000000000004',
    userEmail: 'compliance@celticfs.ie',
    type: 'VALIDATION_PASSED',
    title: 'Validation passed',
    body: 'All validation stages passed for your CRS filing (period 2024). The filing is ready for transmission.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000002',
    isRead: true,
    createdAt: '2024-11-15T10:36:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000005',
    userEmail: 'filing@dublinib.ie',
    type: 'VALIDATION_FAILED',
    title: 'Validation failed',
    body: 'Business rules validation failed for your CRS filing (period 2024). 3 errors found including invalid TIN format and negative account balance. Please correct and resubmit.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000006',
    isRead: false,
    createdAt: '2024-10-05T16:36:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000006',
    userEmail: 'compliance@thamescap.co.uk',
    type: 'VALIDATION_PASSED',
    title: 'Validation passed',
    body: 'All validation stages passed for your FATCA filing (period 2024). The filing is ready for transmission.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000007',
    isRead: true,
    createdAt: '2024-11-10T08:51:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000007',
    userEmail: 'compliance@schneider-finanz.de',
    type: 'VALIDATION_PASSED',
    title: 'Validation passed',
    body: 'All validation stages passed for your CRS filing (period 2024). The filing is ready for transmission.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000011',
    isRead: false,
    createdAt: '2024-11-18T07:36:00Z',
  },

  // ── Enrolment approval ──────────────────────────────────────────
  {
    id: '70000000-0000-4000-a000-000000000008',
    userEmail: 'compliance@celticfs.ie',
    type: 'ENROLMENT_APPROVED',
    title: 'Organisation enrolment approved',
    body: 'Celtic Financial Services has been approved for CRS/FATCA reporting on the platform.',
    resourceType: 'ORGANIZATION',
    resourceId: '00000000-0000-4000-a000-000000000010',
    isRead: true,
    createdAt: '2024-06-01T09:00:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000009',
    userEmail: 'compliance@thamescap.co.uk',
    type: 'ENROLMENT_APPROVED',
    title: 'Organisation enrolment approved',
    body: 'Thames Capital Ltd has been approved for CRS/FATCA reporting on the platform.',
    resourceType: 'ORGANIZATION',
    resourceId: '00000000-0000-4000-a000-000000000012',
    isRead: true,
    createdAt: '2024-05-20T14:00:00Z',
  },

  // ── Transmission success ─────────────────────────────────────────
  {
    id: '70000000-0000-4000-a000-000000000010',
    userEmail: 'compliance@celticfs.ie',
    type: 'TRANSMISSION_ACK',
    title: 'Transmission acknowledged',
    body: 'Your CRS filing for period 2024 has been successfully transmitted to DE and acknowledged. 145 records accepted, 0 rejected.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000003',
    isRead: true,
    createdAt: '2024-12-16T10:31:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000011',
    userEmail: 'compliance@thamescap.co.uk',
    type: 'TRANSMISSION_ACK',
    title: 'Transmission acknowledged',
    body: 'Your FATCA filing for period 2024 has been successfully transmitted to US and acknowledged. 87 records accepted, 0 rejected.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000008',
    isRead: false,
    createdAt: '2024-12-11T16:46:00Z',
  },

  // ── TA notifications ─────────────────────────────────────────────
  {
    id: '70000000-0000-4000-a000-000000000012',
    userEmail: 'reviewer@revenue.ie',
    type: 'NEW_SUBMISSION',
    title: 'New filing awaiting review',
    body: 'Dublin Investment Bank has submitted a CRS filing for period 2024 that requires review.',
    resourceType: 'FILING',
    resourceId: '20000000-0000-4000-a000-000000000005',
    isRead: false,
    createdAt: '2024-11-20T11:02:00Z',
  },
  {
    id: '70000000-0000-4000-a000-000000000013',
    userEmail: 'admin@revenue.ie',
    type: 'INBOUND_TRANSMISSION',
    title: 'Inbound transmission received',
    body: 'An inbound CRS transmission from DE has been received and successfully ingested.',
    resourceType: 'INBOUND_TRANSMISSION',
    resourceId: '60000000-0000-4000-a000-000000000010',
    isRead: true,
    createdAt: '2024-12-20T06:13:00Z',
  },
];
