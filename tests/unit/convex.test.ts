import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";
import { MIN_GRADUATION_YEAR } from "../../shared/registration/constants";

const modules = import.meta.glob("../../convex/**/*.ts", { eager: false });

type ConvexTestClient = {
  mutation: (name: string, args: unknown) => Promise<{
    ok: boolean;
    isNew?: boolean;
    userId?: string;
    registrationId?: string;
  }>;
  query: (name: string, args: unknown) => Promise<unknown>;
  withIdentity: (identity: { tokenIdentifier: string; subject?: string; email?: string; name?: string }) => ConvexTestClient;
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

async function seedHackathon(t: ConvexTestClient) {
  await t.mutation("seed:seedHackathon", {});
}

describe("convex registrations", () => {
  it("creates and updates registrations", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "browser-one",
    }) as unknown as ConvexTestClient;
    await seedHackathon(t);

    const first = await t.mutation("registrations:register", {
      data: validRegistrationData,
    });
    expect(first.ok).toBe(true);
    expect(first.isNew).toBe(true);

    const second = await t.mutation("registrations:register", {
      data: validRegistrationData,
    });
    expect(second.isNew).toBe(false);

    const draft = await t.mutation("registrations:saveDraft", {
      data: { ...validRegistrationData, major: "Engineering" },
    });
    expect(draft.ok).toBe(true);
  });

  it("rejects invalid registration payloads", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "browser-one",
    }) as unknown as ConvexTestClient;
    await seedHackathon(t);

    await expect(
      t.mutation("registrations:register", {
        data: { ...validRegistrationData, age: -1 },
      }),
    ).rejects.toThrow("Invalid registration data.");
  });

  it("rejects registration for a missing hackathon", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "browser-one",
    }) as unknown as ConvexTestClient;

    await expect(
      t.mutation("registrations:register", { data: validRegistrationData }),
    ).rejects.toThrow("Hackathon not found.");
  });

  it("rejects unauthenticated registration", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    await expect(
      t.mutation("registrations:register", { data: validRegistrationData }),
    ).rejects.toThrow("Authentication required.");
  });

  it("reuses one user for repeated synchronization", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "browser-one",
    }) as unknown as ConvexTestClient;

    const first = await t.mutation("registrations:syncUser", {
      email: " Sam@Example.com ",
      displayName: "Sam Test",
    });
    const second = await t.mutation("registrations:syncUser", {
      email: "sam@example.com",
      displayName: "Sam Updated",
    });

    expect(first.userId).toBe(second.userId);
    await expect(t.query("queries:getCurrentUser", {})).resolves.toMatchObject({
      identityKey: "browser-one",
      email: "sam@example.com",
      displayName: "Sam Updated",
    });
  });

  it("rejects duplicate normalized emails", async () => {
    const base = convexTest(schema, modules);
    const t = base.withIdentity({
      tokenIdentifier: "browser-one",
    }) as unknown as ConvexTestClient;

    await t.mutation("registrations:syncUser", {
      email: "sam@example.com",
    });

    const duplicateUser = base.withIdentity({
      tokenIdentifier: "browser-two",
    }) as unknown as ConvexTestClient;
    await expect(
      duplicateUser.mutation("registrations:syncUser", {
        email: " SAM@EXAMPLE.COM ",
      }),
    ).rejects.toThrow("already associated");
  });

  it("rejects unauthenticated user synchronization", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    await expect(t.mutation("registrations:syncUser", {})).rejects.toThrow(
      "Authentication required.",
    );
  });
});

describe("convex queries", () => {
  it("returns null for missing records", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    await expect(t.query("queries:getHackathonBySlug", { slug: "missing" })).resolves.toBeNull();
    await expect(t.query("queries:getRegistrationsByUser", { userId: "missing" })).rejects.toThrow(
      "Authentication required.",
    );
  });

  it("seeds hackuta-2026 idempotently and finds it by slug", async () => {
    const t = convexTest(schema, modules) as unknown as ConvexTestClient;

    const first = await t.mutation("seed:seedHackathon", {});
    const second = await t.mutation("seed:seedHackathon", {});

    expect(first).toBe(second);
    await expect(
      t.query("queries:getHackathonBySlug", { slug: "hackuta-2026" }),
    ).resolves.toMatchObject({ slug: "hackuta-2026", name: "HackUTA 2026" });
  });

  it("only returns registrations for the authenticated user", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "provider-user",
      email: "sam@example.com",
    }) as unknown as ConvexTestClient;
    await seedHackathon(t);
    const synced = await t.mutation("registrations:syncUser", {});

    await expect(
      t.query("queries:getRegistrationsByUser", { userId: synced.userId }),
    ).resolves.toEqual([]);

    await expect(
      t.query("queries:getRegistrationsByUser", { userId: "different-user" }),
    ).rejects.toThrow("Not authorized");
  });

  it("returns the synchronized current user", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "provider-user",
      email: "sam@example.com",
      name: "Sam Test",
    }) as unknown as ConvexTestClient;
    await seedHackathon(t);

    await t.mutation("registrations:syncUser", {});

    await expect(t.query("queries:getCurrentUser", {})).resolves.toMatchObject({
      identityKey: "provider-user",
      email: "sam@example.com",
      displayName: "Sam Test",
    });
  });

  it("rejects a provider identity that has not been synchronized", async () => {
    const t = convexTest(schema, modules).withIdentity({
      tokenIdentifier: "unsynchronized-user",
    }) as unknown as ConvexTestClient;
    await seedHackathon(t);

    await expect(t.query("queries:getCurrentUser", {})).rejects.toThrow(
      "has not been synchronized",
    );
  });

  it("allows owned registration reads and rejects missing or foreign records", async () => {
    const base = convexTest(schema, modules);
    const t = base.withIdentity({
      tokenIdentifier: "provider-user",
    }) as unknown as ConvexTestClient;
    await seedHackathon(t);
    const user = await t.mutation("registrations:syncUser", {});
    const created = await t.mutation("registrations:register", {
      data: validRegistrationData,
    });

    await expect(
      t.query("queries:getRegistration", { registrationId: created.registrationId }),
    ).resolves.toMatchObject({ userId: user.userId });

    const foreignUser = base.withIdentity({
      tokenIdentifier: "foreign-user",
    }) as unknown as ConvexTestClient;
    await foreignUser.mutation("registrations:syncUser", {});
    await expect(
      foreignUser.query("queries:getRegistration", { registrationId: created.registrationId }),
    ).rejects.toThrow("Not authorized");

    await expect(
      t.query("queries:getRegistrationsByHackathon", { hackathonId: "hackuta-2026" }),
    ).rejects.toThrow("Admin authorization is not configured");
  });
});
