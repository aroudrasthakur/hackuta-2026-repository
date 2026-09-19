import { useEffect, useRef } from "react";
import { OdysseyButton } from "../../components/OdysseyButton";
import { Link } from "react-router-dom";

export function SuccessStep() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-4 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-(family-name:--font-display) text-3xl text-(--color-light) outline-none"
      >
        You're on the list!
      </h1>
      <p className="max-w-sm text-sm text-(--color-mist)">
        Thanks for applying to HackUTA 2026. Keep an eye on your inbox — we'll email you with
        acceptance decisions and next steps as the event gets closer.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <OdysseyButton href="/profile">View application</OdysseyButton>
        <Link
          to="/"
          className="inline-flex items-center justify-center border border-(--color-ocean) px-5 py-3 text-sm uppercase tracking-[0.1em] text-(--color-sand)"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
