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

// Reuse a completed upload if submitting the application fails and is retried.
const uploadedResumes = new WeakMap<File, string>();

async function submitRegistration(payload: RegistrationPayload, resume: File | null = null) {
  let resumeStorageId: string | undefined;
  if (resume) {
    const error = validateResume(resume);
    if (error) throw new Error(error);
    resumeStorageId = uploadedResumes.get(resume);
    if (!resumeStorageId) {
      const uploadUrl = await callConvexMutation<string>("registrations:generateResumeUploadUrl", {});
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
      uploadedResumes.set(resume, storageId);
    }
  }
  return callConvexMutation<{ ok: true }>("registrations:register", {
    data: resumeStorageId ? { ...payload, resumeStorageId } : payload,
  });
}

export { submitRegistration };
