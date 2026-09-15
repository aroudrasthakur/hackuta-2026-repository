import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Temporary codes sent to emails (TTL: 10 minutes)
  verificationCodes: defineTable({
    email: v.string(),
    code: v.string(), // 6-digit code
    attempts: v.number(), // Track failed attempts
    expiresAt: v.number(), // Unix timestamp (ms)
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_expires", ["expiresAt"]),

  // Rate limiting cooldowns (TTL: 60 seconds)
  cooldowns: defineTable({
    email: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),

  // Submitted registrations
  registrations: defineTable({
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
    submittedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_submitted", ["submittedAt"]),
});
