import { mutation } from "./_generated/server";
import type { DataModelFromSchemaDefinition, GenericMutationCtx } from "convex/server";
import type schema from "./schema";
import { v } from "convex/values";
import { validateRegistrationPayload } from "../shared/registration/validation";
import type { RegistrationPayload } from "../shared/registration/types";
import { MAX_RESUME_BYTES } from "../shared/registration/resume";

type MutationCtx = GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>;

// Uses the same temporary, unauthenticated pipeline as registration submission.
export const generateResumeUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

async function upsertRegistration(
  ctx: MutationCtx,
  data: RegistrationPayload,
  status: "draft" | "submitted",
) {
  const userId = `mock-user:${data.firstName.toLowerCase()}-${data.lastName.toLowerCase()}-${data.phone.replace(/\D/g, "")}`;
  const { hackathonId, resumeStorageId: rawStorageId, ...fields } = data;
  const resumeStorageId = rawStorageId ? ctx.db.system.normalizeId("_storage", rawStorageId) : undefined;
  if (rawStorageId) {
    const metadata = resumeStorageId ? await ctx.db.system.get(resumeStorageId) : null;
    if (!metadata || metadata.contentType !== "application/pdf" || metadata.size === 0 || metadata.size > MAX_RESUME_BYTES) {
      throw new Error("Please upload a PDF resume of 5 MB or smaller.");
    }
  }
  const answers = { ...fields, resumeStorageId: resumeStorageId ?? undefined };

  const existing = await ctx.db
    .query("registrations")
    .withIndex("by_user_hackathon", (q) => q.eq("userId", userId).eq("hackathonId", hackathonId))
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
