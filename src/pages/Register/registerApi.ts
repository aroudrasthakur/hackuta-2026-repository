// Use mock API for testing without vercel dev
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

async function sendVerificationCode(email: string) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.sendVerificationCode(email);
  }
  return postJson<{ ok: true }>("/api/send-code", { email });
}

async function verifyCode(email: string, code: string) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.verifyCode(email, code);
  }
  return postJson<{ token: string }>("/api/verify-code", { email, code });
}

async function submitRegistration(payload: Record<string, unknown>) {
  if (USE_MOCK) {
    const mockApi = await import("./registerApi.mock");
    return mockApi.submitRegistration(payload);
  }
  return postJson<{ ok: true }>("/api/register", payload);
}

export { sendVerificationCode, verifyCode, submitRegistration };
