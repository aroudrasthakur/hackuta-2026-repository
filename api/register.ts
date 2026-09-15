import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as storage from "./_lib/localStorage.ts";
import { isNonEmptyString, isValidEmail, normalizeEmail } from "./_lib/validate.ts";
import { verifyToken } from "./_lib/token.ts";
import {
  DIETARY_OPTIONS,
  GENDERS,
  HEAR_ABOUT_OPTIONS,
  LEVELS_OF_STUDY,
  RACE_ETHNICITY_OPTIONS,
  TSHIRT_SIZES,
  type RegistrationPayload,
} from "../src/constants/application.ts";

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function isStringArraySubset(value: unknown, options: readonly string[]): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && options.includes(item))
  );
}

function validatePayload(body: unknown): { ok: true; data: RegistrationPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid request body." };
  const b = body as Record<string, unknown>;

  if (!isValidEmail(b.email)) return { ok: false, error: "Invalid email." };
  if (!isNonEmptyString(b.token, 500)) return { ok: false, error: "Missing verification token." };
  if (!isNonEmptyString(b.firstName, 100)) return { ok: false, error: "First name is required." };
  if (!isNonEmptyString(b.lastName, 100)) return { ok: false, error: "Last name is required." };
  if (!isNonEmptyString(b.phone, 30)) return { ok: false, error: "Phone number is required." };
  if (typeof b.age !== "number" || b.age < 18 || b.age > 120) {
    return { ok: false, error: "You must be 18 or older to apply." };
  }
  if (!isNonEmptyString(b.school, 200)) return { ok: false, error: "School is required." };
  if (!isOneOf(b.levelOfStudy, LEVELS_OF_STUDY)) return { ok: false, error: "Invalid level of study." };
  if (!isNonEmptyString(b.major, 150)) return { ok: false, error: "Major is required." };
  if (typeof b.graduationYear !== "number" || b.graduationYear < 2024 || b.graduationYear > 2035) {
    return { ok: false, error: "Invalid graduation year." };
  }
  if (!isOneOf(b.gender, GENDERS)) return { ok: false, error: "Invalid gender selection." };
  if (!isStringArraySubset(b.raceEthnicity, RACE_ETHNICITY_OPTIONS)) {
    return { ok: false, error: "Select at least one race/ethnicity option." };
  }
  if (!isStringArraySubset(b.dietaryRestrictions, DIETARY_OPTIONS)) {
    return { ok: false, error: "Select at least one dietary option." };
  }
  if (!isOneOf(b.tshirtSize, TSHIRT_SIZES)) return { ok: false, error: "Invalid T-shirt size." };
  if (typeof b.firstHackathon !== "boolean") return { ok: false, error: "Invalid response." };
  if (!isOneOf(b.hearAbout, HEAR_ABOUT_OPTIONS)) return { ok: false, error: "Invalid response." };
  if (!isNonEmptyString(b.emergencyContactName, 150)) {
    return { ok: false, error: "Emergency contact name is required." };
  }
  if (!isNonEmptyString(b.emergencyContactPhone, 30)) {
    return { ok: false, error: "Emergency contact phone is required." };
  }
  if (b.codeOfConductAgreed !== true) return { ok: false, error: "You must agree to the MLH Code of Conduct." };
  if (b.mlhDataSharingConsent !== true) return { ok: false, error: "You must agree to the MLH data sharing terms." };

  return {
    ok: true,
    data: {
      token: b.token as string,
      email: normalizeEmail(b.email as string),
      firstName: (b.firstName as string).trim(),
      lastName: (b.lastName as string).trim(),
      phone: (b.phone as string).trim(),
      age: b.age as number,
      school: (b.school as string).trim(),
      levelOfStudy: b.levelOfStudy as RegistrationPayload["levelOfStudy"],
      major: (b.major as string).trim(),
      graduationYear: b.graduationYear as number,
      gender: b.gender as RegistrationPayload["gender"],
      raceEthnicity: b.raceEthnicity as string[],
      dietaryRestrictions: b.dietaryRestrictions as string[],
      otherDietary: isNonEmptyString(b.otherDietary, 200) ? (b.otherDietary as string).trim() : "",
      tshirtSize: b.tshirtSize as RegistrationPayload["tshirtSize"],
      firstHackathon: b.firstHackathon as boolean,
      hearAbout: b.hearAbout as RegistrationPayload["hearAbout"],
      resumeUrl: isNonEmptyString(b.resumeUrl, 500) ? (b.resumeUrl as string).trim() : "",
      linkedin: isNonEmptyString(b.linkedin, 300) ? (b.linkedin as string).trim() : "",
      github: isNonEmptyString(b.github, 300) ? (b.github as string).trim() : "",
      portfolio: isNonEmptyString(b.portfolio, 300) ? (b.portfolio as string).trim() : "",
      accessibilityNeeds: isNonEmptyString(b.accessibilityNeeds, 500) ? (b.accessibilityNeeds as string).trim() : "",
      emergencyContactName: (b.emergencyContactName as string).trim(),
      emergencyContactPhone: (b.emergencyContactPhone as string).trim(),
      codeOfConductAgreed: true,
      mlhDataSharingConsent: true,
      mlhCommunicationsConsent: b.mlhCommunicationsConsent === true,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = validatePayload(req.body);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  const { data } = result;

  if (!verifyToken(data.token, data.email)) {
    return res.status(401).json({ error: "Your email verification expired. Please verify again." });
  }

  const registrationKey = `registration:${data.email}`;
  const existing = await storage.get(registrationKey);
  if (existing) {
    return res.status(409).json({ error: "This email has already submitted an application." });
  }

  const { token: _token, ...record } = data;
  await storage.set(registrationKey, { ...record, submittedAt: new Date().toISOString() });

  console.log("\n✅ Registration submitted:", data.email);

  return res.status(200).json({ ok: true });
}
