import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeAnswers(data: Record<string, unknown>, email: string) {
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
    email,
  };

  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));
}

async function upsertRegistration(ctx: MutationCtx, data: Record<string, unknown>) {
  const email = typeof data.email === "string" ? normalizeEmail(data.email) : "";
  if (!email) throw new Error("A verified email address is required.");

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .first();
  if (!user?.verifiedAt) throw new Error("Verify your email before submitting your application.");

  const hackathonId = "hackuta-2026";
  const answers = normalizeAnswers(data, email);
  const existing = await ctx.db
    .query("registrations")
    .withIndex("by_user_hackathon", (q) => q.eq("userId", user._id).eq("hackathonId", hackathonId))
    .first();
  const now = Date.now();

  if (existing) {
    await ctx.db.patch(existing._id, {
      answers: answers as never,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    });
    return { registrationId: existing._id, isNew: false, ok: true as const };
  }

  const registrationId = await ctx.db.insert("registrations", {
    userId: user._id,
    hackathonId,
    status: "submitted",
    eligibilityStatus: "unreviewed",
    answers: answers as never,
    submittedAt: now,
    updatedAt: now,
  });

  return { registrationId, isNew: true, ok: true as const };
}

export const saveRegistration = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, { data }) => upsertRegistration(ctx, data as Record<string, unknown>),
});