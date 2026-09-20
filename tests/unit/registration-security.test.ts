import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRegistrationAllowedOrigins,
  isOriginAllowed,
} from "../../convex/registrationSecurity";

describe("registrationSecurity", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects origins when the allowlist is empty", () => {
    vi.stubEnv("REGISTRATION_ALLOWED_ORIGINS", "");
    expect(getRegistrationAllowedOrigins()).toEqual([]);
    expect(isOriginAllowed("https://hackuta.org", [])).toBe(false);
    expect(isOriginAllowed(null, [])).toBe(false);
  });

  it("accepts only configured production origins", () => {
    vi.stubEnv("REGISTRATION_ALLOWED_ORIGINS", "https://hackuta.org, https://www.hackuta.org");
    const allowed = getRegistrationAllowedOrigins();
    expect(allowed).toEqual(["https://hackuta.org", "https://www.hackuta.org"]);
    expect(isOriginAllowed("https://hackuta.org", allowed)).toBe(true);
    expect(isOriginAllowed("https://evil.example", allowed)).toBe(false);
  });
});
