export function getRegistrationAllowedOrigins(): string[] {
  return (process.env.REGISTRATION_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | null, allowed: string[]): origin is string {
  if (allowed.length === 0 || !origin) return false;
  return allowed.includes(origin);
}
