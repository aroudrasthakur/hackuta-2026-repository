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

describe("submitRegistration", () => {
  it("uploads a new PDF after failed submission cleanup", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: "https://upload.example" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ storageId: "resume-id" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: { ok: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "error" }), { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: { ok: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: "https://upload.example" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ storageId: "resume-id-2" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: { ok: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: { ok: true } })));
    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    const resume = new File(["%PDF-1.7"], "resume.pdf", { type: "application/pdf" });
    await expect(submitRegistration(payload, resume)).rejects.toThrow();
    await expect(submitRegistration(payload, resume)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://upload.example", {
      method: "POST", headers: { "Content-Type": "application/pdf" }, body: resume,
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).args).toEqual({
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
    });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)).path).toBe("registrations:verifyResumeUpload");
    expect(JSON.parse(String(fetchMock.mock.calls[4]?.[1]?.body)).path).toBe("registrations:deleteResumeUpload");
    expect(JSON.parse(String(fetchMock.mock.calls[8]?.[1]?.body)).args.data.resumeStorageId).toBe("resume-id-2");
  });

  it("does not submit the application when uploading fails", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: "https://upload.example" })))
      .mockResolvedValueOnce(new Response("failed", { status: 500 }));
    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    await expect(submitRegistration(payload, new File(["%PDF-1.7"], "resume.pdf"))).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws a friendly error when Convex is not configured", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "");
    vi.resetModules();
    const { submitRegistration } = await import("../../src/pages/Register/registerApi");

    await expect(submitRegistration(payload)).rejects.toThrow(
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
    await expect(submitRegistration(payload)).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.convex.cloud/api/mutation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          path: "registrations:register",
          args: { data: payload },
        }),
      }),
    );
  });

  it("maps server failures to a friendly error", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "error" }), { status: 500 }),
    );

    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    await expect(submitRegistration(payload)).rejects.toThrow(
      "We couldn't submit your application. Please try again.",
    );
  });
});
