import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as storage from "./_lib/localStorage.ts";
import { isValidCode, isValidEmail, normalizeEmail } from "./_lib/validate.ts";
import { issueVerifiedToken } from "./_lib/token.ts";

const MAX_ATTEMPTS = 5;

interface StoredCode {
  code: string;
  attempts: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code } = req.body ?? {};
  if (!isValidEmail(email) || !isValidCode(code)) {
    return res.status(400).json({ error: "Please enter the 6-digit code sent to your email." });
  }
  const normalized = normalizeEmail(email);

  const codeKey = `register:code:${normalized}`;
  const stored = await storage.get<StoredCode>(codeKey);

  if (!stored) {
    return res.status(400).json({ error: "That code has expired. Request a new one." });
  }
  if (stored.attempts >= MAX_ATTEMPTS) {
    await storage.del(codeKey);
    return res.status(429).json({ error: "Too many attempts. Request a new code." });
  }
  if (stored.code !== code) {
    await storage.set(codeKey, JSON.stringify({ code: stored.code, attempts: stored.attempts + 1 }), {
      keepTtl: true,
    });
    return res.status(400).json({ error: "That code is incorrect." });
  }

  await storage.del(codeKey);
  const token = issueVerifiedToken(normalized);
  return res.status(200).json({ token });
}
