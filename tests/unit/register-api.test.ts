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

const session = { storageId: "resume-id", uploadToken: "upload-token" };

describe("uploadResume", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    { storageId: 42, uploadToken: "token" },
    { storageId: "", uploadToken: "token" },
    { storageId: "resume-id", uploadToken: "" },
    {},
  ])("rejects malformed upload responses (%j)", async (response) => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 201 }));
    const { uploadResume } = await import("../../src/pages/Register/registerApi");
    await expect(uploadResume(new File(["%PDF-1.7"], "resume.pdf"))).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid file before contacting the upload API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const { uploadResume } = await import("../../src/pages/Register/registerApi");
    await expect(uploadResume(new File(["text"], "resume.txt"))).rejects.toThrow("Please select a PDF");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not submit the application when uploading fails", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("failed", { status: 500 }));
    const { uploadResume } = await import("../../src/pages/Register/registerApi");
    await expect(uploadResume(new File(["%PDF-1.7"], "resume.pdf"))).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a server-issued upload session", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(session), { status: 201 }));
    const { uploadResume } = await import("../../src/pages/Register/registerApi");
    await expect(uploadResume(new File(["%PDF-1.7"], "resume.pdf"))).resolves.toEqual(session);
  });
});

describe("submitRegistration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("submits with an existing upload session", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: { ok: true } })),
    );
    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    await expect(submitRegistration(payload, "test-token", session)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.convex.cloud/api/mutation",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
        body: JSON.stringify({
          path: "registrations:register",
          args: {
            data: { ...payload, resumeStorageId: "resume-id" },
            resumeUploadToken: "upload-token",
          },
        }),
      }),
    );
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

describe("discardResumeUpload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("ignores cleanup failures", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const { discardResumeUpload } = await import("../../src/pages/Register/registerApi");
    await expect(discardResumeUpload("upload-token")).resolves.toBeUndefined();
  });

  it("requests server cleanup for a pending upload token", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://example.convex.cloud");
    vi.resetModules();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: { ok: true } })),
    );
    const { discardResumeUpload } = await import("../../src/pages/Register/registerApi");
    await discardResumeUpload("upload-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.convex.cloud/api/mutation",
      expect.objectContaining({
        body: JSON.stringify({
          path: "registrations:deleteResumeUpload",
          args: { uploadToken: "upload-token" },
        }),
      }),
    );
  });
});
