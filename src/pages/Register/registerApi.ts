import type { RegistrationPayload } from "../../../shared/registration/types";
import { validateResume } from "../../../shared/registration/resume";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

const SUBMIT_ERROR_MESSAGE = "We couldn't submit your application. Please try again.";

async function callConvexMutation<T>(
  mutation: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!CONVEX_URL) {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: mutation, args }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === "error") {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  return (data.value ?? data) as T;
}

async function callConvexAction<T>(action: string, args: Record<string, unknown>): Promise<T> {
  if (!CONVEX_URL) {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  const response = await fetch(`${CONVEX_URL}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: action, args }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === "error") {
    throw new Error(SUBMIT_ERROR_MESSAGE);
  }

  return (data.value ?? data) as T;
}

// Reuse a completed upload if submitting the application fails and is retried.
const uploadedResumes = new WeakMap<File, string>();

async function deleteResumeUpload(storageId: string) {
  await callConvexMutation<{ ok: true }>("registrations:deleteResumeUpload", { storageId }).catch(() => undefined);
}

async function submitRegistration(payload: RegistrationPayload, resume: File | null = null) {
  let resumeStorageId: string | undefined;
  let uploadedOnThisAttempt = false;
  if (resume) {
    const error = validateResume(resume);
    if (error) throw new Error(error);
    resumeStorageId = uploadedResumes.get(resume);
    if (!resumeStorageId) {
      const uploadUrl = await callConvexMutation<string>("registrations:generateResumeUploadUrl", {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
      });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: resume,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.storageId !== "string" || !data.storageId) {
        throw new Error(SUBMIT_ERROR_MESSAGE);
      }
      const storageId: string = data.storageId;
      resumeStorageId = storageId;
      uploadedOnThisAttempt = true;
      const verified = await callConvexAction<{ ok: boolean }>("registrations:verifyResumeUpload", { storageId });
      if (!verified.ok) throw new Error("Please select a PDF file.");
      uploadedResumes.set(resume, storageId);
    }
  }
  try {
    return await callConvexMutation<{ ok: true }>("registrations:register", {
      data: resumeStorageId ? { ...payload, resumeStorageId } : payload,
    });
  } catch (error) {
    if (resume && resumeStorageId && uploadedOnThisAttempt) {
      uploadedResumes.delete(resume);
      await deleteResumeUpload(resumeStorageId);
    }
    throw error;
  }
}

export { submitRegistration };
