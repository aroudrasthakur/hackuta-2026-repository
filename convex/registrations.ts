import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { registrationAnswers } from "./registrationAnswers";

/**
 * Submit a registration for a hackathon.
 * Assumes user already exists.
 */
export const submitRegistration = mutation({
  args: {
    userId: v.id("users"),
    hackathonId: v.id("hackathons"),
    answers: registrationAnswers,
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
    answers: registrationAnswers,
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
