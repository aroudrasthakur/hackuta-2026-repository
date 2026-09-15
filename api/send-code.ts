import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomInt } from "node:crypto";
import * as storage from "./_lib/localStorage.ts";
import { isValidEmail, normalizeEmail } from "./_lib/validate.ts";
import { sendVerificationEmail } from "./_lib/mockEmail.ts";

const CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = req.body?.email;
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  const normalized = normalizeEmail(email);

  const cooldownKey = `register:cooldown:${normalized}`;
  const onCooldown = await storage.get(cooldownKey);
  if (onCooldown) {
    return res.status(429).json({ error: "Please wait a minute before requesting another code." });
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeKey = `register:code:${normalized}`;
  await storage.set(codeKey, JSON.stringify({ code, attempts: 0 }), { ex: CODE_TTL_SECONDS });
  await storage.set(cooldownKey, "1", { ex: RESEND_COOLDOWN_SECONDS });

  try {
    await sendVerificationEmail(normalized, code);
  } catch (err) {
    await storage.del(codeKey);
    await storage.del(cooldownKey);
    console.error("send-code: failed to send email", err);
    return res.status(502).json({ error: "Could not send the verification email. Please try again." });
  }

  return res.status(200).json({ ok: true });
}

