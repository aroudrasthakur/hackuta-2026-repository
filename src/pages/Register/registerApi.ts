const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

type VerificationResponse = {
  ok: true;
  normalizedEmail: string;
};

type RegistrationResponse = {
  ok: true;
  registrationId: string;
  isNew: boolean;
};

async function callConvexMutation<T>(
  mutation: string,
  args: Record<string, unknown>,
  fallbackMessage: string,
  kind: "action" | "mutation" = "mutation",
): Promise<T> {
  try {
    if (!CONVEX_URL) {
      throw new Error("Convex not configured. Set VITE_CONVEX_URL in .env.local");
    }

    const response = await fetch(`${CONVEX_URL}/api/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: mutation, args }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status === "error") {
      throw new Error(
        data?.errorMessage ?? data?.message ?? data?.error ?? "Something went wrong. Please try again.",
      );
    }

    return (data.value ?? data) as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : fallbackMessage, { cause: error });
  }
}

async function requestVerificationCode(email: string) {
  return callConvexMutation<{ ok: true }>(
    "verification:requestCode",
    { email },
    "Failed to send verification code",
    "action",
  );
}

async function verifyEmailCode(email: string, code: string) {
  return callConvexMutation<VerificationResponse>(
    "verification:verifyCode",
    { email, code },
    "Failed to verify email",
    "action",
  );
}

async function submitRegistration(payload: Record<string, unknown>) {
  return callConvexMutation<RegistrationResponse>(
    "registrations:register",
    { data: payload },
    "Failed to submit registration",
    "action",
  );
}

export { requestVerificationCode, submitRegistration, verifyEmailCode };
