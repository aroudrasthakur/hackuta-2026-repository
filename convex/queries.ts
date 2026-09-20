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
 * Find the current applicant's registration by email. This is a lightweight
 * fallback while the real auth provider is still being wired up.
 */
export const getRegistrationByEmail = query({
  args: { email: v.string(), hackathonId: v.string() },
  handler: async (ctx, { email, hackathonId }) => {
    const normalized = email.toLowerCase().trim();

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_hackathon_status", (q) => q.eq("hackathonId", hackathonId))
      .collect();

    const registration = registrations.find((item) =>
      item.answers.email?.toLowerCase() === normalized,
    );

    if (!registration) {
      return null;
    }

    return {
      firstName: registration.answers.firstName,
      lastName: registration.answers.lastName,
      hackathonId: registration.hackathonId,
      status: registration.status,
      eligibilityStatus: registration.eligibilityStatus,
      submittedAt: registration.submittedAt ?? null,
      reviewedAt: registration.reviewedAt ?? null,
      updatedAt: registration.updatedAt,
    };
  },
});

/**
 * Return the signed-in user's profile status without accepting a client-owned
 * user id. The identity subject is the ownership boundary.
 */
export const getMyProfile = query({
  args: { hackathonId: v.string() },
  handler: async (ctx, { hackathonId }) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_user_hackathon", (q) =>
        q.eq("userId", identity.subject).eq("hackathonId", hackathonId),
      )
      .first();

    if (!registration) {
      return null;
    }

    return {
      firstName: registration.answers.firstName,
      lastName: registration.answers.lastName,
      hackathonId: registration.hackathonId,
      status: registration.status,
      eligibilityStatus: registration.eligibilityStatus,
      submittedAt: registration.submittedAt ?? null,
      reviewedAt: registration.reviewedAt ?? null,
      updatedAt: registration.updatedAt,
    };
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
