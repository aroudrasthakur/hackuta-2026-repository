import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user by email (for login/auth flow).
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.toLowerCase().trim();
    
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first() || null;
  },
});

/**
 * Get all registrations for a user.
 */
export const getRegistrationsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("registrations")
      .withIndex("by_user_hackathon", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Get a specific registration.
 */
export const getRegistration = query({
  args: { registrationId: v.id("registrations") },
  handler: async (ctx, { registrationId }) => {
    return await ctx.db.get(registrationId);
  },
});

/**
 * Get all registrations for a hackathon (admin view).
 */
export const getRegistrationsByHackathon = query({
  args: { hackathonId: v.string() },
  handler: async (ctx, { hackathonId }) => {
    return await ctx.db
      .query("registrations")
      .withIndex("by_hackathon_status", (q) => q.eq("hackathonId", hackathonId))
      .collect();
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
