import { action, internalMutation, mutation } from "./_generated/server";
import { makeFunctionReference } from "convex/server";
import type { DataModelFromSchemaDefinition, GenericMutationCtx } from "convex/server";
import type schema from "./schema";
import { v } from "convex/values";
import { validateRegistrationPayload } from "../shared/registration/validation";
import type { RegistrationPayload } from "../shared/registration/types";
import { MAX_RESUME_BYTES } from "../shared/registration/resume";

type MutationCtx = GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>;
const RESUME_UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const MAX_RESUME_UPLOADS_PER_WINDOW = 5;
const RESUME_UPLOAD_EXPIRY_MS = 30 * 60 * 1000;
const PDF_MAGIC_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
const markResumeUploadVerifiedRef = makeFunctionReference<"internalMutation">(
  "registrations:markResumeUploadVerified",
);

export const generateResumeUploadUrl = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userKey = normalizeRegistrantKey(args.firstName, args.lastName, args.phone);
    const recentRequests = await ctx.db
      .query("resumeUploadRequests")
      .withIndex("by_user_createdAt", (q) => q.eq("userKey", userKey).gte("createdAt", now - RESUME_UPLOAD_WINDOW_MS))
      .collect();

    if (recentRequests.length >= MAX_RESUME_UPLOADS_PER_WINDOW) {
      throw new Error("Too many resume upload attempts. Please wait a few minutes and try again.");
    }

    await ctx.db.insert("resumeUploadRequests", {
      userKey,
      createdAt: now,
    });

    return ctx.storage.generateUploadUrl();
  },
});

function normalizeRegistrantKey(firstName: string, lastName: string, phone: string) {
  return `${firstName.toLowerCase().trim()}-${lastName.toLowerCase().trim()}-${phone.replace(/\D/g, "")}`;
}

async function upsertRegistration(
  ctx: MutationCtx,
  data: RegistrationPayload,
  status: "draft" | "submitted",
) {
  const userId = `mock-user:${normalizeRegistrantKey(data.firstName, data.lastName, data.phone)}`;
  const { hackathonId, resumeStorageId: rawStorageId, ...fields } = data;
  const resumeStorageId = rawStorageId ? ctx.db.system.normalizeId("_storage", rawStorageId) : undefined;
  if (rawStorageId) {
    const now = Date.now();
    const metadata = resumeStorageId ? await ctx.db.system.get(resumeStorageId) : null;
    const verification = resumeStorageId
      ? await ctx.db
        .query("verifiedResumeUploads")
        .withIndex("by_storage", (q) => q.eq("storageId", resumeStorageId))
        .first()
      : null;
    if (
      !metadata ||
      metadata.contentType !== "application/pdf" ||
      metadata.size === 0 ||
      metadata.size > MAX_RESUME_BYTES ||
      metadata._creationTime < now - RESUME_UPLOAD_EXPIRY_MS ||
      !verification ||
      verification.createdAt < now - RESUME_UPLOAD_EXPIRY_MS
    ) {
      throw new Error("Please upload a PDF resume of 5 MB or smaller.");
    }
    await ctx.db.delete(verification._id);
  }
  const answers = { ...fields, resumeStorageId: resumeStorageId ?? undefined };

  const existing = await ctx.db
    .query("registrations")
    .withIndex("by_user_hackathon", (q) => q.eq("userId", userId).eq("hackathonId", hackathonId))
    .first();

  if (existing) {
    const previousResume = existing.answers.resumeStorageId;
    await ctx.db.patch(existing._id, {
      answers,
      status,
      submittedAt: status === "submitted" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    if (previousResume && previousResume !== resumeStorageId) {
      await ctx.storage.delete(previousResume);
    }
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

export const deleteResumeUpload = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, { storageId }) => {
    const now = Date.now();
    const normalizedStorageId = ctx.db.system.normalizeId("_storage", storageId);
    if (!normalizedStorageId) return { ok: true as const };
    const verification = await ctx.db
      .query("verifiedResumeUploads")
      .withIndex("by_storage", (q) => q.eq("storageId", normalizedStorageId))
      .first();
    if (verification) {
      await ctx.db.delete(verification._id);
    }
    const metadata = await ctx.db.system.get(normalizedStorageId);
    if (
      metadata &&
      metadata.contentType === "application/pdf" &&
      metadata._creationTime >= now - RESUME_UPLOAD_EXPIRY_MS
    ) {
      await ctx.storage.delete(normalizedStorageId);
    }
    return { ok: true as const };
  },
});

export const verifyResumeUpload = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const file = await ctx.storage.get(storageId);
    if (!file) return { ok: false as const };
    const bytes = new Uint8Array(await file.slice(0, PDF_MAGIC_HEADER.length).arrayBuffer());
    const isPdf = PDF_MAGIC_HEADER.every((byte, index) => bytes[index] === byte);
    if (!isPdf) return { ok: false as const };
    await ctx.runMutation(markResumeUploadVerifiedRef, { storageId });
    return { ok: true as const };
  },
});

export const markResumeUploadVerified = internalMutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const existing = await ctx.db
      .query("verifiedResumeUploads")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { createdAt: Date.now() });
      return;
    }
    await ctx.db.insert("verifiedResumeUploads", {
      storageId,
      createdAt: Date.now(),
    });
  },
});
