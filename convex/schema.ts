import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Shapes and indexes only. See docs/database-schema.md for mutation invariants.
// Convex supplies _id and _creationTime (the server-recorded creation timestamp).
export default defineSchema({
  users: defineTable({
    // Map the verified auth identity to this account; never use email as its ID.
    tokenIdentifier: v.string(),
    email: v.string(),
    emailVerifiedAt: v.optional(v.number()),
    displayName: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_tokenIdentifier', ['tokenIdentifier']),

  hackathons: defineTable({
    slug: v.string(),
    name: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    registrationOpensAt: v.number(),
    registrationClosesAt: v.number(),
  }).index('by_slug', ['slug']),

  registrations: defineTable({
    userId: v.id('users'),
    hackathonId: v.id('hackathons'),
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
    // Optional for draft saves; submission must validate required answers.
    answers: v.object({
      fullName: v.optional(v.string()),
      ageAtEvent: v.optional(v.number()),
      school: v.optional(v.string()),
      studentStatus: v.optional(v.union(
        v.literal('high_school'),
        v.literal('undergraduate'),
        v.literal('graduate'),
        v.literal('other'),
      )),
      resumeStorageId: v.optional(v.id('_storage')),
      dietaryRestrictions: v.optional(v.array(v.union(
        v.literal('vegetarian'),
        v.literal('vegan'),
        v.literal('halal'),
        v.literal('kosher'),
        v.literal('gluten_free'),
        v.literal('dairy_free'),
        v.literal('nut_free'),
        v.literal('other'),
      ))),
      dietaryNotes: v.optional(v.string()),
      shirtSize: v.optional(v.union(
        v.literal('XS'), v.literal('S'), v.literal('M'),
        v.literal('L'), v.literal('XL'), v.literal('2XL'),
        v.literal('3XL'), v.literal('none'),
      )),
      linkedinUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
    }),
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id('users')),
    checkedInAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_user_hackathon', ['userId', 'hackathonId'])
    .index('by_hackathon_status', ['hackathonId', 'status']),

  pointAccounts: defineTable({
    registrationId: v.id('registrations'),
    hackathonId: v.id('hackathons'),
    // Maintained summaries of the transaction deltas, initialized to zero.
    balance: v.number(),
    totalEarned: v.number(),
    updatedAt: v.number(),
  })
    .index('by_registration', ['registrationId'])
    .index('by_hackathon_totalEarned', ['hackathonId', 'totalEarned'])
    .index('by_hackathon_balance', ['hackathonId', 'balance']),

  pointTransactions: defineTable({
    pointAccountId: v.id('pointAccounts'),
    hackathonId: v.id('hackathons'),
    balanceDelta: v.number(),
    earnedDelta: v.number(),
    type: v.union(
      v.literal('award'),
      v.literal('purchase'),
      v.literal('refund'),
      v.literal('correction'),
      v.literal('reversal'),
    ),
    reason: v.string(),
    actorUserId: v.id('users'),
    // Reused for retries of one logical operation, scoped to this account.
    operationId: v.string(),
    // Server-derived activity/occurrence key for a once-per-person award.
    awardKey: v.optional(v.string()),
    // Original entry for refunds, corrections, or reversals.
    relatedTransactionId: v.optional(v.id('pointTransactions')),
  })
    .index('by_account', ['pointAccountId'])
    .index('by_account_operation', ['pointAccountId', 'operationId'])
    .index('by_account_award', ['pointAccountId', 'awardKey'])
    .index('by_relatedTransaction', ['relatedTransactionId'])
    .index('by_hackathon', ['hackathonId'])
    .index('by_hackathon_actor', ['hackathonId', 'actorUserId'])
    .index('by_hackathon_type', ['hackathonId', 'type']),

  staffAssignments: defineTable({
    userId: v.id('users'),
    hackathonId: v.id('hackathons'),
    role: v.union(v.literal('volunteer'), v.literal('organizer')),
    active: v.boolean(),
    assignedBy: v.id('users'),
    updatedAt: v.number(),
  })
    .index('by_user_hackathon', ['userId', 'hackathonId'])
    .index('by_hackathon', ['hackathonId']),
});
