import { httpRouter, makeFunctionReference } from "convex/server";
import { httpAction } from "./_generated/server";
import { MAX_RESUME_BYTES } from "../shared/registration/resume";
import { validateResumePdfBytes } from "./pdfValidation";
import { getRegistrationAllowedOrigins, isOriginAllowed } from "./registrationSecurity";

const http = httpRouter();
const reserveResumeUploadRef = makeFunctionReference<"mutation">(
  "registrations:reserveResumeUpload",
);
const recordVerifiedResumeUploadRef = makeFunctionReference<"mutation">(
  "registrations:recordVerifiedResumeUpload",
);

const CONVEX_TEST_ORIGIN = "https://hackuta.test";

function requestOrigin(request: Request) {
  return request.headers.get("origin") ?? request.headers.get("x-test-origin");
}

function allowedOrigin(request: Request): string | undefined {
  const origin = requestOrigin(request);
  const allowed = getRegistrationAllowedOrigins();
  if (allowed.length > 0) {
    return isOriginAllowed(origin, allowed) ? origin : undefined;
  }
  // convex-test HTTP handlers do not inherit Vitest/CI process.env; allow the
  // dedicated unit-test origin only when production origins are not configured.
  return origin === CONVEX_TEST_ORIGIN ? origin : undefined;
}

function response(request: Request, body: unknown, status: number, origin?: string) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

async function requestRateKey(address: string | null) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address ?? "unknown-client"),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createCapabilityToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function clientAddress(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
) {
  try {
    const { ip } = await ctx.meta.getRequestMetadata();
    if (ip) return ip;
  } catch {
    // Older local test backends do not expose request metadata.
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",");
  return forwarded?.[forwarded.length - 1]?.trim() ?? null;
}

// Public registration upload endpoint. Defense in depth:
// - origin allowlist (REGISTRATION_ALLOWED_ORIGINS)
// - per-IP and global rate limits (reserveResumeUpload)
// - pdf-lib byte validation before storage (validateResumePdfBytes)
// - capability tokens required to attach storage to a registration
// - client discard + scheduled cleanup of unassociated blobs
const uploadResume = httpAction(async (ctx, request) => {
  const origin = allowedOrigin(request);
  if (!origin) {
    return response(request, { error: "Origin is not allowed." }, 403);
  }
  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/pdf") {
    return response(request, { error: "Please upload a PDF." }, 415, origin);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESUME_BYTES) {
    return response(request, { error: "The PDF is too large." }, 413, origin);
  }

  try {
    await ctx.runMutation(reserveResumeUploadRef, {
      requestKey: await requestRateKey(await clientAddress(ctx, request)),
    });
  } catch {
    return response(request, { error: "Too many uploads. Please try again later." }, 429, origin);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_RESUME_BYTES) {
    return response(request, { error: "The PDF must be between 1 byte and 5 MB." }, 413, origin);
  }

  try {
    await validateResumePdfBytes(bytes);
  } catch {
    return response(request, { error: "The file is not a valid PDF." }, 422, origin);
  }

  let storageId;
  try {
    storageId = await ctx.storage.store(new Blob([bytes], { type: "application/pdf" }));
    const uploadToken = createCapabilityToken();
    await ctx.runMutation(recordVerifiedResumeUploadRef, { uploadToken, storageId });
    return response(request, { storageId, uploadToken }, 201, origin);
  } catch {
    if (storageId) await ctx.storage.delete(storageId);
    return response(request, { error: "The resume could not be stored." }, 500, origin);
  }
});

http.route({ path: "/resume-upload", method: "POST", handler: uploadResume });
http.route({
  path: "/resume-upload",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const origin = allowedOrigin(request);
    if (!origin) return response(request, { error: "Origin is not allowed." }, 403);
    const result = response(request, null, 204, origin);
    result.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    result.headers.set("Access-Control-Allow-Headers", "Content-Type");
    result.headers.set("Access-Control-Max-Age", "600");
    return result;
  }),
});

export default http;
