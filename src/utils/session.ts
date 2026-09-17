// Placeholder client-side session marker for the profile flow. Not a security
// boundary — the actual "does this email have a registration" check happens
// server-side via Convex before granting access to the /you page.
const STORAGE_KEY = "hackuta:applicantEmail";

export function getStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredEmail(email: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, email);
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
}

export function clearStoredEmail(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
}
