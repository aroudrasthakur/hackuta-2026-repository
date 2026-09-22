import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "../../security/csp";
import { permissionsPolicy, referrerPolicy } from "../../security/headers";
import vercelConfig from "../../vercel.json" with { type: "json" };

function deployedHeader(key: string) {
  return vercelConfig.headers
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === key)?.value;
}

describe("contentSecurityPolicy", () => {
  it("restricts scripts and external assets to an explicit allowlist", () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("script-src 'self'");
    expect(contentSecurityPolicy).toContain("script-src-attr 'none'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("require-trusted-types-for 'script'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  });
});

describe("response security headers", () => {
  it("keeps vercel.json aligned with the shared header definitions", () => {
    expect(deployedHeader("Content-Security-Policy")).toBe(contentSecurityPolicy);
    expect(deployedHeader("Permissions-Policy")).toBe(permissionsPolicy);
    expect(deployedHeader("Referrer-Policy")).toBe(referrerPolicy);
  });
});
