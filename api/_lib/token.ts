import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes to finish the application

function getSecret(): string {
  const secret = process.env.REGISTRATION_TOKEN_SECRET;
  if (!secret) throw new Error("Missing REGISTRATION_TOKEN_SECRET environment variable");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Issues a signed, time-limited token proving `email` completed verification. */
export function issueVerifiedToken(email: string): string {
  const payload = `${email}.${Date.now() + TOKEN_TTL_MS}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

/** Verifies a token and returns the email it was issued for, or null if invalid/expired. */
export function verifyToken(token: unknown, expectedEmail: string): boolean {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const lastDot = token.lastIndexOf(".");
  const encoded = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expectedSignature = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const [email, expiresAtRaw] = payload.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!email || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return email === expectedEmail;
}
