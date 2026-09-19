import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

async function requireAuthenticatedUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_identity_key", (q) => q.eq("identityKey", identity.tokenIdentifier))
    .first();
  if (!user) {
    throw new Error("Authenticated user has not been synchronized.");
  }
  return user;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => requireAuthenticatedUser(ctx),
});

/**
 * Get all registrations for a user.
 */
export const getRegistrationsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await requireAuthenticatedUser(ctx);
    if (user._id !== userId) {
      throw new Error("Not authorized to access this user's registrations.");
    }
    return await ctx.db
      .query("registrations")
      .withIndex("by_user_hackathon", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Get a specific registration.
 */
export const getRegistration = query({
  args: { registrationId: v.id("registrations") },
  handler: async (ctx, { registrationId }) => {
    const user = await requireAuthenticatedUser(ctx);
    const registration = await ctx.db.get(registrationId);
    if (!registration || registration.userId !== user._id) {
      throw new Error("Not authorized to access this registration.");
    }
    return registration;
  },
});

/**
 * Get all registrations for a hackathon (admin view).
 */
export const getRegistrationsByHackathon = query({
  args: { hackathonId: v.string() },
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    throw new Error("Admin authorization is not configured.");
  },
});

/**
 * Get a hackathon by slug.
 */
export const getHackathonBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("hackathons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first() || null;
  },
});
