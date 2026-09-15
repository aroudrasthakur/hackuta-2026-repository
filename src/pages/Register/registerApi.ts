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

export function sendVerificationCode(email: string) {
  return postJson<{ ok: true }>("/api/send-code", { email });
}

export function verifyCode(email: string, code: string) {
  return postJson<{ token: string }>("/api/verify-code", { email, code });
}

export function submitRegistration(payload: Record<string, unknown>) {
  return postJson<{ ok: true }>("/api/register", payload);
}
