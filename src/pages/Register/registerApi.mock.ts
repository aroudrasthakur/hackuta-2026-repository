// Mock API for testing without vercel dev
// This file is used when VITE_USE_MOCK_API is set

const mockCodes = new Map<string, string>();

export function sendVerificationCode(email: string) {
  return new Promise<{ ok: true }>((resolve) => {
    setTimeout(() => {
      const code = Math.random().toString().slice(2, 8);
      mockCodes.set(email.toLowerCase(), code);
      console.log(
        `\n${"━".repeat(60)}\n📧 MOCK EMAIL\n${"━".repeat(60)}\nTo: ${email}\nCode: ${code}\n${"━".repeat(60)}\n`,
      );
      resolve({ ok: true });
    }, 500);
  });
}

export function verifyCode(email: string, code: string) {
  return new Promise<{ token: string }>((resolve, reject) => {
    setTimeout(() => {
      const stored = mockCodes.get(email.toLowerCase());
      if (!stored) {
        reject(new Error("That code has expired. Request a new one."));
        return;
      }
      if (stored !== code) {
        reject(new Error("That code is incorrect."));
        return;
      }
      mockCodes.delete(email.toLowerCase());
      const token = `mock_token_${email}_${Date.now()}`;
      console.log(`✓ Verified: ${email}`);
      resolve({ token });
    }, 300);
  });
}


export function submitRegistration(payload: Record<string, unknown>) {
  return new Promise<{ ok: true }>((resolve) => {
    setTimeout(() => {
      console.log(`✓ Registration submitted:`, payload.email);
      resolve({ ok: true });
    }, 800);
  });
}
