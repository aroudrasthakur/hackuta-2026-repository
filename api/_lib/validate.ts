const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[0-9]{6}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

export function isValidCode(value: unknown): value is string {
  return typeof value === "string" && CODE_RE.test(value);
}

/** Normalizes an email for use as a storage key (case-insensitive, trimmed). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isNonEmptyString(value: unknown, maxLength = 200): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}
