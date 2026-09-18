"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendEmail } from "./email";

export const register = action({
  args: { data: v.any() },
  handler: async (ctx, { data }): Promise<{
    registrationId: string;
    isNew: boolean;
    ok: true;
  }> => {
    const payload = data as Record<string, unknown>;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!email) throw new Error("A verified email address is required.");

    const result: {
      registrationId: string;
      isNew: boolean;
      ok: true;
    } = await ctx.runMutation(internal.registrationData.saveRegistration, {
      data: { ...payload, email },
    });
    await sendEmail(
      email,
      "Your HackUTA application was received",
      "Thanks for applying to HackUTA 2026. Your application has been received, and we will email you with acceptance decisions and next steps.",
    );
    return result;
  },
});
