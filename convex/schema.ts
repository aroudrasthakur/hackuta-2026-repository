import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { registrationAnswers } from './registrationAnswers';

// Temporarily simplified schema to support the application-data pipeline without the
// auth/provider layer that is blocked by the email integration.
export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index('email', ['email']),

  hackathons: defineTable({
    slug: v.string(),
    name: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    registrationOpensAt: v.number(),
    registrationClosesAt: v.number(),
  }).index('by_slug', ['slug']),

  registrations: defineTable({
    userId: v.string(),
    hackathonId: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('submitted'),
      v.literal('accepted'),
      v.literal('waitlisted'),
      v.literal('rejected'),
      v.literal('withdrawn'),
    ),
    eligibilityStatus: v.union(
      v.literal('unreviewed'),
      v.literal('eligible'),
      v.literal('ineligible'),
    ),
    answers: registrationAnswers,
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    checkedInAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_user_hackathon', ['userId', 'hackathonId'])
    .index('by_hackathon_status', ['hackathonId', 'status']),
});
