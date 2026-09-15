// Use mock API for testing without Convex
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

async function callConvexMutation<T>(
  mutation: string,
  args: Record<string, unknown>
): Promise<T> {
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
}

async function sendVerificationCode(email: string) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.sendVerificationCode(email);
  }

  try {
    const result = await callConvexMutation<{ ok: true }>("sendCode", { email });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send code";
    throw new Error(message, { cause: error });
  }
}

async function verifyCode(email: string, code: string) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.verifyCode(email, code);
  }

  try {
    const result = await callConvexMutation<{ token: string }>("verifyCode", {
      email,
      code,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify code";
    throw new Error(message, { cause: error });
  }
}

async function submitRegistration(payload: Record<string, unknown>) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.submitRegistration(payload);
  }

  try {
    const result = await callConvexMutation<{ ok: true }>("register", payload);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit registration";
    throw new Error(message, { cause: error });
  }
}

export { sendVerificationCode, verifyCode, submitRegistration };
