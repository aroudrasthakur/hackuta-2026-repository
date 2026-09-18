import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";
import { makeFunctionReference } from "convex/server";
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
  resumeStorageId: undefined,
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
  it("stores a PDF storage reference with the application", async () => {
    const t = convexTest(schema, modules);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["%PDF-1.7"], { type: "application/pdf" })));
    // convex-test's storeBlob omits contentType; emulate upload endpoint metadata.
    await t.run((ctx) => (ctx.db.patch as unknown as (id: string, value: { contentType: string }) => Promise<void>)(storageId, { contentType: "application/pdf" }));
    await t.action(makeFunctionReference<"action">("registrations:verifyResumeUpload"), { storageId });
    await t.mutation(makeFunctionReference<"mutation">("registrations:register"), { data: { ...validRegistrationData, resumeStorageId: storageId } });
    const registration = await t.run((ctx) => ctx.db.query("registrations").first());
    expect(registration?.answers.resumeStorageId).toBe(storageId);
  });

  it.each([
    ["application/pdf", "not a pdf"],
    ["application/pdf", ""],
    ["application/pdf", "x".repeat(5 * 1024 * 1024 + 1)],
  ])("rejects invalid stored file metadata (%s)", async (type, contents) => {
    const t = convexTest(schema, modules);
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob([contents], { type })));
    await t.run((ctx) => (ctx.db.patch as unknown as (id: string, value: { contentType: string }) => Promise<void>)(storageId, { contentType: type }));
    await expect(t.mutation(makeFunctionReference<"mutation">("registrations:register"), {
      data: { ...validRegistrationData, resumeStorageId: storageId },
    })).rejects.toThrow("Please upload a PDF resume");
  });

  it("rate limits resume upload URL generation", async () => {
    const t = convexTest(schema, modules);
    const args = { firstName: "Sam", lastName: "Test", phone: "5551234567" };

    for (let index = 0; index < 5; index += 1) {
      await expect(t.mutation(makeFunctionReference<"mutation">("registrations:generateResumeUploadUrl"), args)).resolves.toEqual(expect.any(String));
    }

    await expect(
      t.mutation(makeFunctionReference<"mutation">("registrations:generateResumeUploadUrl"), args),
    ).rejects.toThrow("Too many resume upload attempts");
  });

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
