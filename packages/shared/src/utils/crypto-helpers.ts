import { createHash, randomUUID } from 'crypto';

/**
 * Compute SHA-256 hash of a buffer or string.
 */
export function computeFileHash(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a unique correlation ID (UUID v4) for request tracing.
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Compute a payload hash for audit logging.
 * Normalizes JSON payload before hashing for consistency.
 */
export function computePayloadHash(payload: unknown): string {
  const normalized = JSON.stringify(payload, Object.keys(payload as object).sort());
  return createHash('sha256').update(normalized).digest('hex');
}
