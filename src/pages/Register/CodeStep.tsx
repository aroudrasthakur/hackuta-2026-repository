import { useState, type FormEvent } from "react";
import { sendVerificationCode, verifyCode } from "./registerApi";

export function CodeStep({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await verifyCode(email, code);
      onVerified(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await sendVerificationCode(email);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl text-(--color-light)">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-(--color-mist)">
          We sent a 6-digit code to <span className="text-(--color-sand)">{email}</span>. Enter it
          below to continue.
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-(--color-sand)">Verification code</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="rounded-xl border border-(--color-ocean)/50 bg-(--color-night) px-4 py-3 text-center text-2xl tracking-[0.5em] text-(--color-light) outline-none focus:border-(--color-sand)"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {resent && !error && <p className="text-sm text-(--color-mist)">A new code is on its way.</p>}
      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="rounded-full bg-(--color-sand) px-6 py-3 font-semibold text-(--color-ink) transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Verifying…" : "Verify code"}
      </button>
      <div className="flex items-center justify-between text-sm text-(--color-mist)">
        <button type="button" onClick={onBack} className="underline underline-offset-4">
          Use a different email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="underline underline-offset-4 disabled:opacity-60"
        >
          {resending ? "Resending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
