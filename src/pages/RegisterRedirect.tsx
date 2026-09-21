import { useEffect } from "react";
import { REGISTER_URL } from "../constants/site";

/** Keeps pre-split /register links working now that registration is its own site. */
export default function RegisterRedirect() {
  useEffect(() => {
    window.location.replace(REGISTER_URL);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p>
        Taking you to the application form.{" "}
        <a href={REGISTER_URL}>Continue to {new URL(REGISTER_URL).host}</a> if nothing happens.
      </p>
    </main>
  );
}
