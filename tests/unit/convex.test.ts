import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";
import { MIN_GRADUATION_YEAR } from "../../shared/registration/constants";

const modules = import.meta.glob("../../convex/**/*.ts", { eager: false });

type ConvexTestClient = {
  mutation: (name: string, args: unknown) => Promise<{ ok: boolean; isNew?: boolean }>;
  query: (name: string, args: unknown) => Promise<unknown>;
};

const validRegistrationData = {
  firstName: "Sam",
  lastName: "Test",
  phone: "5551234567",
  age: 20,
  school: "UT Arlington",
  levelOfStudy: "Undergraduate - Junior",
  major: "Computer Science",
  graduationYear: MIN_GRADUATION_YEAR,
  gender: "Male",
  raceEthnicity: [] as string[],
  dietaryRestrictions: [] as string[],
  otherDietary: "",
  tshirtSize: "M",
  firstHackathon: true,
  hearAbout: "Discord",
  resumeUrl: undefined,
  linkedin: undefined,
  github: undefined,
  portfolio: undefined,
  accessibilityNeeds: "",
  emergencyContactName: "Jane Test",
  emergencyContactPhone: "5559876543",
  codeOfConductAgreed: true,
  mlhDataSharingConsent: true,
  mlhCommunicationsConsent: false,
  hackathonId: "hackuta-2026",
};

describe("convex registrations", () => {
  it("creates and updates registrations", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    const first = await t.mutation("registrations:register", { data: validRegistrationData });
    expect(first.ok).toBe(true);
    expect(first.isNew).toBe(true);

    const second = await t.mutation("registrations:register", { data: validRegistrationData });
    expect(second.isNew).toBe(false);

    const draft = await t.mutation("registrations:saveDraft", {
      data: { ...validRegistrationData, major: "Engineering" },
    });
    expect(draft.ok).toBe(true);
  });

  it("rejects invalid registration payloads", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    await expect(
      t.mutation("registrations:register", {
        data: { ...validRegistrationData, age: -1 },
      }),
    ).rejects.toThrow("Invalid registration data.");
  });
});

describe("convex queries", () => {
  it("returns null for missing records", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    await expect(t.query("queries:getUserByEmail", { email: "missing@example.com" })).resolves.toBeNull();
    await expect(t.query("queries:getHackathonBySlug", { slug: "missing" })).resolves.toBeNull();
    await expect(t.query("queries:getRegistrationsByUser", { userId: "missing" })).resolves.toEqual([]);
  });
});
