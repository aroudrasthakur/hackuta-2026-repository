"use node";

import { createHash, randomInt } from "node:crypto";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { sendEmail } from "./email";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export const requestCode = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }

    const now = Date.now();
    const existing = await ctx.runQuery(internal.verificationData.getChallenge, {
      email: normalizedEmail,
    });
    if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      throw new Error("Please wait before requesting another code.");
    }

    const code = String(randomInt(100000, 1000000));
    await ctx.runMutation(internal.verificationData.createChallenge, {
      email: normalizedEmail,
      codeHash: hashCode(normalizedEmail, code),
      expiresAt: now + CODE_TTL_MS,
      lastSentAt: now,
    });
    await sendEmail(
      normalizedEmail,
      "Your HackUTA verification code",
      `Your HackUTA verification code is ${code}. It expires in 10 minutes.`,
    );
    return { ok: true as const };
  },
});

export const verifyCode = action({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email, code }): Promise<{
    ok: true;
    normalizedEmail: string;
  }> => {
    const normalizedEmail = normalizeEmail(email);
    const challenge: Doc<"emailVerificationChallenges"> | null = await ctx.runQuery(
      internal.verificationData.getChallenge,
      {
      email: normalizedEmail,
      },
    );
    const now = Date.now();
    if (!challenge || challenge.consumedAt !== undefined || challenge.expiresAt <= now) {
      throw new Error("That verification code has expired or is invalid.");
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many attempts. Request a new code.");
    }
    if (hashCode(normalizedEmail, code.trim()) !== challenge.codeHash) {
      await ctx.runMutation(internal.verificationData.recordFailedAttempt, {
        challengeId: challenge._id,
      });
      throw new Error("That verification code is not valid.");
    }

    const result: { ok: true; normalizedEmail: string } = await ctx.runMutation(
      internal.verificationData.consumeChallengeAndVerifyUser,
      {
      challengeId: challenge._id,
      email: normalizedEmail,
      verifiedAt: now,
      },
    );
    return result;
  },
});