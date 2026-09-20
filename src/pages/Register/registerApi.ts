import type { RegistrationPayload } from "../../../shared/registration/types";
import { validateResume } from "../../../shared/registration/resume";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL || CONVEX_URL?.replace(".convex.cloud", ".convex.site");

const SUBMIT_ERROR_MESSAGE = "We couldn't submit your application. Please try again.";

export type ResumeUploadSession = {
  storageId: string;
  uploadToken: string;
};

async function callConvexMutation<T>(
  mutation: string,
  args: Record<string, unknown>,
  authToken: string | null,
): Promise<T> {
  if (!CONVEX_URL || !authToken) {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ path: mutation, args }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === "error") {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  return (data.value ?? data) as T;
}

export async function uploadResume(file: File): Promise<ResumeUploadSession> {
  const error = validateResume(file);
  if (error) throw new Error(error);
  if (!CONVEX_SITE_URL) throw new Error(SUBMIT_ERROR_MESSAGE);

  const response = await fetch(`${CONVEX_SITE_URL}/resume-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: file,
  });
  const data = await response.json().catch(() => ({}));
  if (
    !response.ok ||
    typeof data.storageId !== "string" ||
    !data.storageId ||
    typeof data.uploadToken !== "string" ||
    !data.uploadToken
  ) {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  return { storageId: data.storageId, uploadToken: data.uploadToken };
}

export async function discardResumeUpload(uploadToken: string) {
  if (!CONVEX_URL) return;
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "registrations:deleteResumeUpload",
      args: { uploadToken },
    }),
  }).catch(() => undefined);
}

export async function submitRegistration(
  payload: RegistrationPayload,
  authToken: string | null,
  resumeSession: ResumeUploadSession | null = null,
) {
  return callConvexMutation<{ ok: true }>("registrations:register", {
    data: resumeSession ? { ...payload, resumeStorageId: resumeSession.storageId } : payload,
    ...(resumeSession ? { resumeUploadToken: resumeSession.uploadToken } : {}),
  }, authToken);
}
