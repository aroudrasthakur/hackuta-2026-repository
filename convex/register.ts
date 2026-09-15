import { mutation } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

export const register = mutation({
  args: {
    token: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    age: v.number(),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    school: v.string(),
    levelOfStudy: v.string(),
    major: v.string(),
    graduationYear: v.number(),
    gender: v.string(),
    raceEthnicity: v.array(v.string()),
    dietaryRestrictions: v.array(v.string()),
    tshirtSize: v.string(),
    firstHackathon: v.boolean(),
    hearAbout: v.string(),
    resumeUrl: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    portfolio: v.optional(v.string()),
    accessibilityNeeds: v.optional(v.string()),
    codeOfConductAgreed: v.boolean(),
    mlhDataSharingConsent: v.boolean(),
    mlhCommunicationsConsent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();

    // Verify token signature
    const secret = process.env.REGISTRATION_TOKEN_SECRET;
    if (!secret) {
      throw new Error("Missing REGISTRATION_TOKEN_SECRET env var");
    }

    const [payload, signature] = args.token.split(".");
    if (!payload || !signature) {
      throw new Error("Invalid token format");
    }

    const expectedSignature = crypto
      .createHmac("sha256", Buffer.from(secret, "hex"))
      .update(payload)
      .digest("base64url");

    // Timing-safe comparison
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      throw new Error("Invalid token signature");
    }

    // Check token expiration and email match
    const [email, expiresAtStr] = payload.split(".");
    if (email !== normalized) {
      throw new Error("Token email does not match submission email");
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (expiresAt < Date.now()) {
      throw new Error("Verification token has expired. Please start over.");
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (existing) {
      throw new Error(
        "An account with this email already exists. Please contact support."
      );
    }

    // Validate required fields
    if (!args.firstName?.trim()) throw new Error("First name is required");
    if (!args.lastName?.trim()) throw new Error("Last name is required");
    if (args.age < 18) throw new Error("You must be 18 or older");
    if (args.graduationYear < 2024 || args.graduationYear > 2035) {
      throw new Error("Invalid graduation year");
    }
    if (!args.codeOfConductAgreed) {
      throw new Error("You must agree to the Code of Conduct");
    }
    if (!args.mlhDataSharingConsent) {
      throw new Error("You must agree to MLH data sharing");
    }

    // Store registration
    const registrationId = await ctx.db.insert("registrations", {
      email: normalized,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      phone: args.phone.trim(),
      age: args.age,
      emergencyContactName: args.emergencyContactName.trim(),
      emergencyContactPhone: args.emergencyContactPhone.trim(),
      school: args.school.trim(),
      levelOfStudy: args.levelOfStudy,
      major: args.major.trim(),
      graduationYear: args.graduationYear,
      gender: args.gender,
      raceEthnicity: args.raceEthnicity,
      dietaryRestrictions: args.dietaryRestrictions,
      tshirtSize: args.tshirtSize,
      firstHackathon: args.firstHackathon,
      hearAbout: args.hearAbout,
      resumeUrl: args.resumeUrl,
      linkedin: args.linkedin,
      github: args.github,
      portfolio: args.portfolio,
      accessibilityNeeds: args.accessibilityNeeds,
      codeOfConductAgreed: args.codeOfConductAgreed,
      mlhDataSharingConsent: args.mlhDataSharingConsent,
      mlhCommunicationsConsent: args.mlhCommunicationsConsent,
      submittedAt: Date.now(),
    });

    console.log(`✓ Registration submitted: ${normalized}`);

    return { ok: true, registrationId };
  },
});
