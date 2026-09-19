import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { validateRegistrationPayload } from "../shared/registration/validation";
import type { RegistrationPayload } from "../shared/registration/types";

function normalizeEmail(email: string | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

async function requireIdentity(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required.");
  }
  return identity;
}

async function upsertUser(
  ctx: MutationCtx,
  identityKey: string,
  email: string | undefined,
  displayName: string | undefined,
  userId: string | undefined = undefined,
) {
  const normalizedIdentityKey = identityKey.trim();
  if (!normalizedIdentityKey) {
    throw new Error("A user identity is required.");
  }

  const normalizedEmail = normalizeEmail(email);
  let existing = await ctx.db
    .query("users")
    .withIndex("by_identity_key", (q) => q.eq("identityKey", normalizedIdentityKey))
    .first();
  if (!existing && userId) {
    existing = await ctx.db.get(userId as never);
  }

  if (normalizedEmail) {
    const emailOwner = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (emailOwner && (!existing || emailOwner._id !== existing._id)) {
      throw new Error("That email address is already associated with another user.");
    }
  }

  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, {
      email: normalizedEmail,
      displayName: displayName?.trim() || undefined,
      updatedAt: now,
    });
    return existing._id;
  }

  return ctx.db.insert("users", {
    identityKey: normalizedIdentityKey,
    email: normalizedEmail,
    displayName: displayName?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  });
}

async function upsertRegistration(
  ctx: MutationCtx,
  data: RegistrationPayload,
  status: "draft" | "submitted",
) {
  const identity = await requireIdentity(ctx);
  const identityKey = identity.tokenIdentifier;
  const userId = await upsertUser(
    ctx,
    identity?.tokenIdentifier ?? identityKey,
    identity?.email,
    identity?.name ?? `${data.firstName} ${data.lastName}`,
    identity.subject,
  );
  const { hackathonId, ...answers } = data;
  const hackathon = await ctx.db
    .query("hackathons")
    .withIndex("by_slug", (q) => q.eq("slug", hackathonId))
    .first();
  if (!hackathon) {
    throw new Error("Hackathon not found.");
  }

  const existing = await ctx.db
    .query("registrations")
    .withIndex("by_user_hackathon", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("hackathonId"), hackathonId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      answers,
      status,
      submittedAt: status === "submitted" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return { registrationId: existing._id, isNew: false, ok: true as const };
  }

  const registrationId = await ctx.db.insert("registrations", {
    userId,
    hackathonId,
    status,
    eligibilityStatus: "unreviewed",
    answers,
    submittedAt: status === "submitted" ? Date.now() : undefined,
    updatedAt: Date.now(),
  });

  return { registrationId, isNew: true, ok: true as const };
}

function parseRegistrationData(data: unknown): RegistrationPayload {
  const result = validateRegistrationPayload(data);

  if (!result.success) {
    throw new Error("Invalid registration data.");
  }

  return result.payload;
}

export const register = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) =>
    upsertRegistration(ctx, parseRegistrationData(data), "submitted"),
});

export const submitRegistration = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) =>
    upsertRegistration(ctx, parseRegistrationData(data), "submitted"),
});

export const saveDraft = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) =>
    upsertRegistration(ctx, parseRegistrationData(data), "draft"),
});

export const syncUser = mutation({
  args: {
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { email, displayName }) => {
    const identity = await requireIdentity(ctx);
    const userId = await upsertUser(
      ctx,
      identity.tokenIdentifier,
      identity.email ?? email,
      identity.name ?? displayName,
      identity.subject,
    );
    return { userId, ok: true as const };
  },
});
