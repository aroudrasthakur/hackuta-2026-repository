// Use mock API for testing without Convex
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

async function callConvexMutation<T>(
  mutation: string,
  args: Record<string, unknown>,
  fallbackMessage: string,
): Promise<T> {
  try {
    if (!CONVEX_URL) {
      throw new Error("Convex not configured. Set VITE_CONVEX_URL in .env.local");
    }

    const response = await fetch(`${CONVEX_URL}/api/mutation/${mutation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message ?? data?.error ?? "Something went wrong. Please try again.");
    }

    return data as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : fallbackMessage, { cause: error });
  }
}

async function sendVerificationCode(email: string) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.sendVerificationCode(email);
  }

  return callConvexMutation<{ ok: true }>("sendCode", { email }, "Failed to send code");
}

async function verifyCode(email: string, code: string) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.verifyCode(email, code);
  }

  return callConvexMutation<{ token: string }>("verifyCode", { email, code }, "Failed to verify code");
}

async function submitRegistration(payload: Record<string, unknown>) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.submitRegistration(payload);
  }

  return callConvexMutation<{ ok: true }>("register", payload, "Failed to submit registration");
}

export { sendVerificationCode, verifyCode, submitRegistration };
