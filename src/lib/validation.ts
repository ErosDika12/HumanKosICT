/**
 * Shared input bounds (Phase 8 security/privacy review: "rate limits or
 * bounded inputs on public actions"). Pure, no `server-only` — every
 * data-access module that accepts free text from a signed-in member calls
 * this before writing to the database, so an oversized payload (e.g. a
 * multi-megabyte "reason" string) is rejected uniformly, not per call site.
 */
export class ValidationError extends Error {}

export const MAX_SHORT_TEXT = 500; // report reasons, connection-request messages, need descriptions
export const MAX_LONG_TEXT = 5000; // bios, community/activity descriptions, recommendation notes

export function assertBoundedText(value: string, max: number, fieldName: string): void {
  if (value.length > max) {
    throw new ValidationError(`${fieldName} must be ${max} characters or fewer (got ${value.length}).`);
  }
}
