import { action, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  return normalized;
}

function randomDigits(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String((values[0] % 900_000) + 100_000);
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export const createCode = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("emailVerifications")
      .withIndex("by_email", (query) => query.eq("email", email))
      .order("desc")
      .first();

    if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      throw new Error("Please wait one minute before requesting another code.");
    }

    const code = randomDigits();
    const codeHash = await hashCode(code);
    const values = {
      codeHash,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      verifiedAt: undefined,
      verificationId: undefined,
    };

    const verificationId = existing
      ? existing._id
      : await ctx.db.insert("emailVerifications", { email, ...values });

    if (existing) {
      await ctx.db.patch(existing._id, values);
    }

    return { code, verificationId };
  },
});

export const deleteCode = internalMutation({
  args: { verificationId: v.id("emailVerifications") },
  handler: async (ctx, { verificationId }) => {
    await ctx.db.delete(verificationId);
  },
});

export const sendVerificationCode = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = normalizeEmail(email);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
      throw new Error("Email verification is not configured. Set RESEND_API_KEY and RESEND_FROM in Convex.");
    }

    const { code, verificationId } = await ctx.runMutation(internal.emailVerification.createCode, {
      email: normalizedEmail,
    });

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [normalizedEmail],
          subject: `${code} is your HackUTA 2026 verification code`,
          text: `Your HackUTA 2026 verification code is ${code}. It expires in 10 minutes.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Email provider rejected the request.");
      }
    } catch (error) {
      await ctx.runMutation(internal.emailVerification.deleteCode, { verificationId });
      throw error;
    }

    return { ok: true };
  },
});

export const verifyCode = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email, code }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Enter the six-digit verification code.");
    }

    const verification = await ctx.db
      .query("emailVerifications")
      .withIndex("by_email", (query) => query.eq("email", normalizedEmail))
      .order("desc")
      .first();

    if (!verification || verification.expiresAt < Date.now()) {
      throw new Error("That code has expired. Request a new one.");
    }
    if (verification.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many incorrect attempts. Request a new code.");
    }

    const codeHash = await hashCode(code);
    if (codeHash !== verification.codeHash) {
      await ctx.db.patch(verification._id, { attempts: verification.attempts + 1 });
      throw new Error("That code is incorrect.");
    }

    const verificationId = randomToken();
    await ctx.db.patch(verification._id, { verificationId, verifiedAt: Date.now() });
    return { verificationId };
  },
});