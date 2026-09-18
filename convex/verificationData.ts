import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createChallenge = internalMutation({
  args: {
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    lastSentAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailVerificationChallenges")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const challenge = {
      email: args.email,
      codeHash: args.codeHash,
      expiresAt: args.expiresAt,
      attempts: 0,
      lastSentAt: args.lastSentAt,
      consumedAt: undefined,
    };

    if (existing) {
      await ctx.db.replace(existing._id, challenge);
      return existing._id;
    }

    return ctx.db.insert("emailVerificationChallenges", challenge);
  },
});

export const getChallenge = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) =>
    ctx.db
      .query("emailVerificationChallenges")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first(),
});

export const recordFailedAttempt = internalMutation({
  args: { challengeId: v.id("emailVerificationChallenges") },
  handler: async (ctx, { challengeId }) => {
    const challenge = await ctx.db.get(challengeId);
    if (challenge) {
      await ctx.db.patch(challengeId, { attempts: challenge.attempts + 1 });
    }
  },
});

export const consumeChallengeAndVerifyUser = internalMutation({
  args: {
    challengeId: v.id("emailVerificationChallenges"),
    email: v.string(),
    verifiedAt: v.number(),
  },
  handler: async (ctx, { challengeId, email, verifiedAt }) => {
    const challenge = await ctx.db.get(challengeId);
    if (!challenge || challenge.consumedAt !== undefined) {
      throw new Error("Verification code has already been used.");
    }

    await ctx.db.patch(challengeId, { consumedAt: verifiedAt });

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { verifiedAt });
    } else {
      await ctx.db.insert("users", {
        email,
        createdAt: verifiedAt,
        verifiedAt,
      });
    }

    return { ok: true as const, normalizedEmail: email };
  },
});