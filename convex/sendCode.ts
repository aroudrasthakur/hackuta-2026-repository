import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const sendCode = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.toLowerCase().trim();

    // Check if email is valid
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("Invalid email address");
    }

    // Check cooldown (1 request per 60 seconds)
    const cooldown = await ctx.db
      .query("cooldowns")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (cooldown) {
      throw new Error(
        "Too many requests. Please wait 60 seconds before requesting a new code."
      );
    }

    // Generate 6-digit code
    const code = Math.random().toString().slice(2, 8).padStart(6, "0");
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Store code
    await ctx.db.insert("verificationCodes", {
      email: normalized,
      code,
      attempts: 0,
      expiresAt,
      createdAt: now,
    });

    // Set cooldown
    await ctx.db.insert("cooldowns", {
      email: normalized,
      expiresAt: now + 60 * 1000, // 60 seconds
    });

    // Log to console (for local dev)
    console.log(
      `\n${"━".repeat(60)}\n📧 VERIFICATION EMAIL\n${"━".repeat(60)}\nTo: ${normalized}\nCode: ${code}\n${"━".repeat(60)}\n`
    );

    return { ok: true };
  },
});
