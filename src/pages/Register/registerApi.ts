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

    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: mutation, args }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status === "error") {
      throw new Error(data?.message ?? data?.error ?? "Something went wrong. Please try again.");
    }

    return (data.value ?? data) as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : fallbackMessage, { cause: error });
  }
}

async function submitRegistration(payload: Record<string, unknown>) {
  return callConvexMutation<{ ok: true }>(
    "registrations:register",
    { data: payload },
    "Failed to submit registration",
  );
}

export { submitRegistration };
