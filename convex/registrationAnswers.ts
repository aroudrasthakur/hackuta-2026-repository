import { v } from "convex/values";

export const registrationAnswers = v.object({
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
});
