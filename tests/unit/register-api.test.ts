import { afterEach, describe, expect, it, vi } from "vitest";
import { MIN_GRADUATION_YEAR } from "../../shared/registration/constants";
import type { RegistrationPayload } from "../../shared/registration/types";

const payload: RegistrationPayload = {
  firstName: "Sam",
  lastName: "Test",
  phone: "5551234567",
  age: 20,
  school: "UT Arlington",
  levelOfStudy: "Undergraduate - Junior",
  major: "Computer Science",
  graduationYear: MIN_GRADUATION_YEAR,
  gender: "Male",
  raceEthnicity: [],
  dietaryRestrictions: [],
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

describe("submitRegistration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws a friendly error when Convex is not configured", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "");
    vi.resetModules();
    const { submitRegistration } = await import("../../src/pages/Register/registerApi");

    await expect(submitRegistration(payload, null)).rejects.toThrow(
      "We couldn't submit your application. Please try again.",
    );
  });

  it("submits a valid payload to Convex", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "success", value: { ok: true } }), { status: 200 }),
    );

    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    await expect(submitRegistration(payload, "test-token")).resolves.toEqual({ ok: true });

    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://example.convex.cloud/api/mutation");
    expect(request).toEqual(expect.objectContaining({ method: "POST" }));

    const body = JSON.parse(String(request?.body)) as {
      path: string;
      args: { data: RegistrationPayload };
    };
    expect(body.path).toBe("registrations:register");
    expect(body.args.data).toEqual(payload);
    expect(request?.headers).toEqual(expect.objectContaining({ Authorization: "Bearer test-token" }));
  });

  it("maps server failures to a friendly error", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "error" }), { status: 500 }),
    );

    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    await expect(submitRegistration(payload, "test-token")).rejects.toThrow(
      "We couldn't submit your application. Please try again.",
    );
  });
});
