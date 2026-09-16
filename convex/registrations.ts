import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Submit a registration for a hackathon.
 * Assumes user already exists.
 */
export const submitRegistration = mutation({
  args: {
    userId: v.id("users"),
    hackathonId: v.id("hackathons"),
    answers: v.object({
      fullName: v.optional(v.string()),
      ageAtEvent: v.optional(v.number()),
      school: v.optional(v.string()),
      studentStatus: v.optional(v.union(
        v.literal("high_school"),
        v.literal("undergraduate"),
        v.literal("graduate"),
        v.literal("other"),
      )),
      resumeStorageId: v.optional(v.id("_storage")),
      dietaryRestrictions: v.optional(v.array(v.union(
        v.literal("vegetarian"),
        v.literal("vegan"),
        v.literal("halal"),
        v.literal("kosher"),
        v.literal("gluten_free"),
        v.literal("dairy_free"),
        v.literal("nut_free"),
        v.literal("other"),
      ))),
      dietaryNotes: v.optional(v.string()),
      shirtSize: v.optional(v.union(
        v.literal("XS"), v.literal("S"), v.literal("M"),
        v.literal("L"), v.literal("XL"), v.literal("2XL"),
        v.literal("3XL"), v.literal("none"),
      )),
      linkedinUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, hackathonId, answers }) => {
    // Check for duplicate submission
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user_hackathon", (q) => 
        q.eq("userId", userId).eq("hackathonId", hackathonId)
      )
      .first();

    if (existing && existing.status !== "draft") {
      throw new Error("You have already submitted a registration for this hackathon");
    }

    if (existing) {
      // Update existing draft
      await ctx.db.patch(existing._id, {
        answers,
        status: "submitted",
        submittedAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`✓ Updated registration for user ${userId}`);
      return { registrationId: existing._id, isNew: false };
    }

    // Create new registration
    const registrationId = await ctx.db.insert("registrations", {
      userId,
      hackathonId,
      status: "submitted",
      eligibilityStatus: "unreviewed",
      answers,
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`✓ Created registration ${registrationId} for user ${userId}`);
    return { registrationId, isNew: true };
  },
});

/**
 * Save a draft registration (optional autosave feature).
 */
export const saveDraft = mutation({
  args: {
    userId: v.id("users"),
    hackathonId: v.id("hackathons"),
    answers: v.object({
      fullName: v.optional(v.string()),
      ageAtEvent: v.optional(v.number()),
      school: v.optional(v.string()),
      studentStatus: v.optional(v.union(
        v.literal("high_school"),
        v.literal("undergraduate"),
        v.literal("graduate"),
        v.literal("other"),
      )),
      resumeStorageId: v.optional(v.id("_storage")),
      dietaryRestrictions: v.optional(v.array(v.union(
        v.literal("vegetarian"),
        v.literal("vegan"),
        v.literal("halal"),
        v.literal("kosher"),
        v.literal("gluten_free"),
        v.literal("dairy_free"),
        v.literal("nut_free"),
        v.literal("other"),
      ))),
      dietaryNotes: v.optional(v.string()),
      shirtSize: v.optional(v.union(
        v.literal("XS"), v.literal("S"), v.literal("M"),
        v.literal("L"), v.literal("XL"), v.literal("2XL"),
        v.literal("3XL"), v.literal("none"),
      )),
      linkedinUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, hackathonId, answers }) => {
    // Check if draft exists
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user_hackathon", (q) => 
        q.eq("userId", userId).eq("hackathonId", hackathonId)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        answers,
        updatedAt: Date.now(),
      });
      return { registrationId: existing._id, isNew: false };
    }

    // Create new draft
    const registrationId = await ctx.db.insert("registrations", {
      userId,
      hackathonId,
      status: "draft",
      eligibilityStatus: "unreviewed",
      answers,
      updatedAt: Date.now(),
    });

    return { registrationId, isNew: true };
  },
});
