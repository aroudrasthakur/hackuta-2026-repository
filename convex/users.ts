import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or get a user by email.
 * Used during registration flow to establish a user account.
 */
export const getOrCreateUser = mutation({
  args: { 
    email: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { email, displayName }) => {
    const normalized = email.toLowerCase().trim();

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("Invalid email address");
    }

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", normalized))
      .first();

    if (existing) {
      return { userId: existing._id, isNew: false };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: normalized,
      email: normalized,
      displayName: displayName?.trim() || undefined,
      updatedAt: Date.now(),
    });

    console.log(`✓ Created user: ${normalized}`);
    return { userId, isNew: true };
  },
});
