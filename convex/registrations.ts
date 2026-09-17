import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { validateRegistrationPayload } from "../shared/registration/validation";
import type { RegistrationPayload } from "../shared/registration/types";

async function upsertRegistration(
  ctx: MutationCtx,
  data: RegistrationPayload,
  status: "draft" | "submitted",
) {
  const userId = `mock-user:${data.firstName.toLowerCase()}-${data.lastName.toLowerCase()}-${data.phone.replace(/\D/g, "")}`;
  const hackathonId = data.hackathonId;

  const existing = await ctx.db
    .query("registrations")
    .withIndex("by_user_hackathon", (q) => q.eq("userId", userId).eq("hackathonId", hackathonId))
    .first();

  const { hackathonId, ...answers } = data;

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
