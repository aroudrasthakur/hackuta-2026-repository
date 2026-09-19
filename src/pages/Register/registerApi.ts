import type { RegistrationPayload } from "../../../shared/registration/types";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

const SUBMIT_ERROR_MESSAGE = "We couldn't submit your application. Please try again.";

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

async function submitRegistration(payload: RegistrationPayload, authToken: string | null) {
  return callConvexMutation<{ ok: true }>("registrations:register", {
    data: payload,
  }, authToken);
}

export { submitRegistration };
