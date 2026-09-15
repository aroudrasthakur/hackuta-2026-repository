import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY environment variable");
  client = new Resend(key);
  return client;
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? "HackUTA <register@hackuta.org>";
  const resend = getClient();
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${code} is your HackUTA verification code`,
    text: `Your HackUTA 2026 verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>Your HackUTA 2026 verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
  if (error) throw new Error(`Failed to send verification email: ${error.message}`);
}
