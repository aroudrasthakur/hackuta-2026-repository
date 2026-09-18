"use node";

import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM ?? user ?? "hello@hackuta.org";

  if (!host || !user || !password || !Number.isInteger(port)) {
    throw new Error("cPanel SMTP email delivery is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_SECURE !== "true",
    auth: { user, pass: password },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
  } catch {
    throw new Error("cPanel SMTP email delivery failed. Please try again.");
  }
}