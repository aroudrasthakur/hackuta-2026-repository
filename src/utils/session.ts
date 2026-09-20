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
    window.localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    // Ignore storage failures in restricted browsing modes.
  }
}

export function clearStoredEmail(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted browsing modes.
  }
}
