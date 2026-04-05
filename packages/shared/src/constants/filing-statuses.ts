export const FilingStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
  TRANSMITTED: 'TRANSMITTED',
} as const;

export type FilingStatusType = (typeof FilingStatus)[keyof typeof FilingStatus];

/**
 * Valid filing status transitions.
 * Key = current status, Value = array of allowed next statuses.
 */
export const FILING_STATUS_TRANSITIONS: Record<FilingStatusType, FilingStatusType[]> = {
  [FilingStatus.DRAFT]: [FilingStatus.SUBMITTED],
  [FilingStatus.SUBMITTED]: [FilingStatus.VALIDATED, FilingStatus.REJECTED],
  [FilingStatus.VALIDATED]: [FilingStatus.TRANSMITTED, FilingStatus.REJECTED],
  [FilingStatus.REJECTED]: [FilingStatus.DRAFT],
  [FilingStatus.TRANSMITTED]: [],
};

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(from: FilingStatusType, to: FilingStatusType): boolean {
  const allowed = FILING_STATUS_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

/**
 * Status display metadata for UI rendering.
 */
export const FILING_STATUS_META: Record<
  FilingStatusType,
  { label: string; color: string; description: string }
> = {
  [FilingStatus.DRAFT]: {
    label: 'Draft',
    color: 'gray',
    description: 'Filing is being prepared and has not yet been submitted.',
  },
  [FilingStatus.SUBMITTED]: {
    label: 'Submitted',
    color: 'blue',
    description: 'Filing has been submitted and is awaiting validation.',
  },
  [FilingStatus.VALIDATED]: {
    label: 'Validated',
    color: 'green',
    description: 'Filing has passed all validation stages.',
  },
  [FilingStatus.REJECTED]: {
    label: 'Rejected',
    color: 'red',
    description: 'Filing failed validation. Review error report for details.',
  },
  [FilingStatus.TRANSMITTED]: {
    label: 'Transmitted',
    color: 'purple',
    description: 'Filing has been transmitted via OECD CTS.',
  },
};
