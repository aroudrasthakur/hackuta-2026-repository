import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
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

describe("resume verification and lifecycle", () => {
  const register = makeFunctionReference<"mutation">("registrations:register");
  const verify = makeFunctionReference<"action">("registrations:verifyResumeUpload");
  const remove = makeFunctionReference<"mutation">("registrations:deleteResumeUpload");

  const createTest = () => convexTest(schema, modules);
  async function upload(t: ReturnType<typeof createTest>, contents = "%PDF-1.7", type = "application/pdf") {
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob([contents], { type })));
    // convex-test omits the upload endpoint's contentType metadata.
    await t.run((ctx) => (ctx.db.patch as unknown as (id: string, value: { contentType: string }) => Promise<void>)(storageId, { contentType: type }));
    return storageId;
  }

  it("keeps an attached resume on cleanup and allows idempotent resubmission after expiry", async () => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t);
    await t.action(verify, { storageId });
    const data = { ...validRegistrationData, resumeStorageId: storageId };
    await t.mutation(register, { data });
    await t.mutation(remove, { storageId });
    expect(await t.run((ctx) => ctx.db.system.get(storageId))).not.toBeNull();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000);
    await expect(t.mutation(register, { data })).resolves.toMatchObject({ ok: true, isNew: false });
    expect(await t.run((ctx) => ctx.db.query("registrations").collect())).toHaveLength(1);
  });

  it("does not let another application claim a submitted resume", async () => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t);
    await t.action(verify, { storageId });
    await t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } });
    await t.action(verify, { storageId });
    await expect(t.mutation(register, { data: { ...validRegistrationData, firstName: "Other", resumeStorageId: storageId } }))
      .rejects.toThrow("already attached");
    expect(await t.run((ctx) => ctx.db.system.get(storageId))).not.toBeNull();
  });

  it("deletes the old file when a resume is replaced or removed", async () => {
    const t = convexTest(schema, modules);
    const first = await upload(t);
    const second = await upload(t);
    for (const storageId of [first, second]) {
      await t.action(verify, { storageId });
      await t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } });
    }
    expect(await t.run((ctx) => ctx.db.system.get(first))).toBeNull();
    expect(await t.run((ctx) => ctx.db.system.get(second))).not.toBeNull();
    await t.mutation(register, { data: validRegistrationData });
    expect(await t.run((ctx) => ctx.db.system.get(second))).toBeNull();
  });

  it.each([true, false])("cleans up unattached uploads (verified=%s)", async (verified) => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t);
    if (verified) await t.action(verify, { storageId });
    await t.mutation(remove, { storageId });
    await t.mutation(remove, { storageId });
    expect(await t.run((ctx) => ctx.db.system.get(storageId))).toBeNull();
    expect(await t.run((ctx) => ctx.db.query("verifiedResumeUploads").collect())).toEqual([]);
    await expect(t.action(verify, { storageId })).resolves.toEqual({ ok: false });
  });

  it("rejects a renamed non-PDF and an upload without content verification", async () => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t, "not a PDF");
    await expect(t.action(verify, { storageId })).resolves.toEqual({ ok: false });
    await expect(t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } })).rejects.toThrow("Please upload");
  });

  it("handles malformed and missing storage references", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(remove, { storageId: "invalid-id" })).resolves.toEqual({ ok: true });
    await expect(t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: "invalid-id" } })).rejects.toThrow("Please upload");
    const storageId = await upload(t);
    await t.run((ctx) => ctx.storage.delete(storageId));
    await expect(t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } })).rejects.toThrow("Please upload");
  });

  it("rejects expired unattached uploads even after verification is refreshed", async () => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t);
    await t.action(verify, { storageId });
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000);
    await t.action(verify, { storageId });
    expect(await t.run((ctx) => ctx.db.query("verifiedResumeUploads").collect())).toHaveLength(1);
    await expect(t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } })).rejects.toThrow("Please upload");
    await t.mutation(remove, { storageId });
    expect(await t.run((ctx) => ctx.db.system.get(storageId))).not.toBeNull();
  });

  it("rejects stale verification for a recent file", async () => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t);
    await t.run((ctx) => ctx.db.insert("verifiedResumeUploads", { storageId, createdAt: Date.now() - 31 * 60 * 1000 }));
    await expect(t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } })).rejects.toThrow("Please upload");
  });

  it("does not delete non-PDF files through resume cleanup", async () => {
    const t = convexTest(schema, modules);
    const storageId = await upload(t, "%PDF-1.7", "text/plain");
    await t.action(verify, { storageId });
    await expect(t.mutation(register, { data: { ...validRegistrationData, resumeStorageId: storageId } })).rejects.toThrow("Please upload");
    await t.mutation(remove, { storageId });
    expect(await t.run((ctx) => ctx.db.system.get(storageId))).not.toBeNull();
  });

  it("allows another upload once the rate-limit window passes", async () => {
    const t = convexTest(schema, modules);
    const request = makeFunctionReference<"mutation">("registrations:generateResumeUploadUrl");
    const args = { firstName: "Sam", lastName: "Test", phone: "5551234567" };
    for (let i = 0; i < 5; i++) await t.mutation(request, args);
    await expect(t.mutation(request, { ...args, firstName: " SAM ", phone: "555-123-4567" })).rejects.toThrow("Too many");
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11 * 60 * 1000);
    await expect(t.mutation(request, args)).resolves.toEqual(expect.any(String));
  });
});
