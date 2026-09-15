import { mutation } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

export const verifyCode = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email, code }) => {
    const normalized = email.toLowerCase().trim();

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Invalid code format");
    }

    // Find code
    const stored = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (!stored) {
      throw new Error("That code has expired. Request a new one.");
    }

    // Check expiration
    if (stored.expiresAt < Date.now()) {
      await ctx.db.delete(stored._id);
      throw new Error("That code has expired. Request a new one.");
    }

    // Check max attempts
    if (stored.attempts >= 5) {
      await ctx.db.delete(stored._id);
      throw new Error(
        "Too many incorrect attempts. Request a new code."
      );
    }

    // Verify code
    if (stored.code !== code) {
      await ctx.db.patch(stored._id, {
        attempts: stored.attempts + 1,
      });
      throw new Error("That code is incorrect.");
    }

    // Code is valid - delete it
    await ctx.db.delete(stored._id);

    // Generate verification token (valid for 30 minutes)
    const secret = process.env.REGISTRATION_TOKEN_SECRET;
    if (!secret) {
      throw new Error("Missing REGISTRATION_TOKEN_SECRET env var");
    }

    const expiresAt = Date.now() + 30 * 60 * 1000;
    const payload = `${normalized}.${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", Buffer.from(secret, "hex"))
      .update(payload)
      .digest("base64url");

    const token = `${payload}.${signature}`;

    console.log(`✓ Verified: ${normalized}`);

    return { token };
  },
});
