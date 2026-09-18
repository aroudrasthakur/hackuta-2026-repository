import { useState, type FormEvent } from "react";
import { requestVerificationCode, submitRegistration, verifyEmailCode } from "./registerApi";
import type { RegistrationPayload } from "./ApplicationForm";

const inputClass =
  "rounded-xl border border-(--color-ocean)/50 bg-(--color-night) px-4 py-3 text-(--color-light) outline-none focus:border-(--color-sand)";
const labelClass = "flex flex-col gap-1.5 text-sm";
const legendClass = "text-(--color-sand)";

export function VerificationStep({
  application,
  onSubmitted,
}: {
  application: RegistrationPayload;
  onSubmitted: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await verifyEmailCode(application.email, code.trim());
      await submitRegistration(application);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not verify your email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await requestVerificationCode(application.email);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send another code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl text-(--color-light)">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-(--color-mist)">
          We sent a verification code to <strong className="text-(--color-light)">{application.email}</strong>.
        </p>
      </div>

      <label className={labelClass} htmlFor="verificationCode">
        <span className={legendClass}>Verification code</span>
        <input
          id="verificationCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className={inputClass}
          placeholder="Enter the code from your email"
          autoFocus
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !code.trim()}
        className="rounded-full bg-(--color-sand) px-6 py-3 font-semibold text-(--color-ink) transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Verifying…" : "Verify and submit application"}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={submitting || resending}
          className="text-(--color-sand) underline underline-offset-4 transition hover:opacity-80 disabled:opacity-60"
        >
          {resending ? "Sending…" : "Send a new code"}
        </button>
      </div>
    </form>
  );
}
