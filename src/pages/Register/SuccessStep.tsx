export function SuccessStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <h1 className="font-(family-name:--font-display) text-3xl text-(--color-light)">
        You're on the list!
      </h1>
      <p className="max-w-sm text-sm text-(--color-mist)">
        Thanks for applying to HackUTA 2026. Keep an eye on your inbox — we'll email you with
        acceptance decisions and next steps as the event gets closer.
      </p>
      <a
        href="/"
        className="mt-2 rounded-full bg-(--color-sand) px-6 py-3 font-semibold text-(--color-ink) transition hover:opacity-90"
      >
        Back to home
      </a>
    </div>
  );
}
