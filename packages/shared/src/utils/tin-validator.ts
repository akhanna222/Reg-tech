import { TIN_FORMATS, validateTIN } from '../constants/tin-formats';

export interface TINValidationResult {
  valid: boolean;
  tin: string;
  jurisdiction: string;
  formatKnown: boolean;
  error?: string;
}

/**
 * Validate a TIN with detailed result.
 */
export function validateTINDetailed(tin: string, jurisdiction: string): TINValidationResult {
  const trimmed = tin.trim();

  if (!trimmed) {
    return {
      valid: false,
      tin: trimmed,
      jurisdiction,
      formatKnown: jurisdiction in TIN_FORMATS,
      error: 'TIN is empty',
    };
  }

  const formatKnown = jurisdiction in TIN_FORMATS;
  const valid = validateTIN(trimmed, jurisdiction);

  return {
    valid,
    tin: trimmed,
    jurisdiction,
    formatKnown,
    error: valid ? undefined : `TIN does not match expected format for jurisdiction ${jurisdiction}`,
  };
}

/**
 * Batch validate multiple TINs.
 */
export function validateTINBatch(
  entries: Array<{ tin: string; jurisdiction: string }>,
): TINValidationResult[] {
  return entries.map((e) => validateTINDetailed(e.tin, e.jurisdiction));
}
