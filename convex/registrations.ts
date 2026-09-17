import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

function normalizeAnswers(data: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    age: typeof data.age === "number" ? data.age : undefined,
    school: data.school,
    levelOfStudy: data.levelOfStudy,
    major: data.major,
    graduationYear: typeof data.graduationYear === "number" ? data.graduationYear : undefined,
    gender: data.gender,
    raceEthnicity: Array.isArray(data.raceEthnicity) ? data.raceEthnicity : undefined,
    dietaryRestrictions: Array.isArray(data.dietaryRestrictions) ? data.dietaryRestrictions : undefined,
    otherDietary: data.otherDietary,
    tshirtSize: data.tshirtSize,
    firstHackathon: typeof data.firstHackathon === "boolean" ? data.firstHackathon : undefined,
    hearAbout: data.hearAbout,
    resumeUrl: data.resumeUrl,
    linkedin: data.linkedin,
    github: data.github,
    portfolio: data.portfolio,
    accessibilityNeeds: data.accessibilityNeeds,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    codeOfConductAgreed: typeof data.codeOfConductAgreed === "boolean" ? data.codeOfConductAgreed : undefined,
    mlhDataSharingConsent: typeof data.mlhDataSharingConsent === "boolean" ? data.mlhDataSharingConsent : undefined,
    mlhCommunicationsConsent: typeof data.mlhCommunicationsConsent === "boolean" ? data.mlhCommunicationsConsent : undefined,
    email: data.email,
  };

  return Object.fromEntries(
    Object.entries(result).filter(([, value]) => value !== undefined),
  );
}

async function upsertRegistration(
  ctx: MutationCtx,
  data: Record<string, unknown>,
  status: "draft" | "submitted",
) {
  const payload = data ?? {};
  const userId = typeof payload.userId === "string" ? payload.userId : `mock-user:${String(payload.email ?? "anonymous")}`;
  const hackathonId = typeof payload.hackathonId === "string" ? payload.hackathonId : "hackuta-2026";
  const answers = normalizeAnswers(payload);

  const existing = await ctx.db
    .query("registrations")
    .withIndex("by_user_hackathon", (q) => q.eq("userId", userId).eq("hackathonId", hackathonId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      answers: answers as never,
      status,
      submittedAt: status === "submitted" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return { registrationId: existing._id, isNew: false, ok: true };
  }

  const registrationId = await ctx.db.insert("registrations", {
    userId,
    hackathonId,
    status,
    eligibilityStatus: "unreviewed",
    answers: answers as never,
    submittedAt: status === "submitted" ? Date.now() : undefined,
    updatedAt: Date.now(),
  });

  return { registrationId, isNew: true, ok: true };
}

export const register = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) => upsertRegistration(ctx, data as Record<string, unknown>, "submitted"),
});

export const submitRegistration = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) => upsertRegistration(ctx, data as Record<string, unknown>, "submitted"),
});

export const saveDraft = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) => upsertRegistration(ctx, data as Record<string, unknown>, "draft"),
});
