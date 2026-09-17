import { useState, type FormEvent } from "react";
import { sendVerificationCode } from "./registerApi";

export function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await sendVerificationCode(normalizedEmail);
      onSent(normalizedEmail);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send a verification code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl text-(--color-light)">Verify your email</h1>
        <p className="mt-2 text-sm text-(--color-mist)">We will send a six-digit code before you can apply.</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-(--color-sand)">Email address</span>
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-xl border border-(--color-ocean)/50 bg-(--color-night) px-4 py-3 text-(--color-light) outline-none focus:border-(--color-sand)"
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded-full bg-(--color-sand) px-6 py-3 font-semibold text-(--color-ink) transition hover:opacity-90 disabled:opacity-60">
        {submitting ? "Sending code..." : "Send verification code"}
      </button>
    </form>
  );
}