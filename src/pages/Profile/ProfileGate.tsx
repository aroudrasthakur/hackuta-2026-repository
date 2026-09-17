import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getRegistrationByEmail } from "../Register/registerApi";
import { HACKATHON_ID } from "../../../shared/registration/constants";
import { clearStoredEmail, getStoredEmail } from "../../utils/session";

type GateState = "checking" | "signed-in" | "signed-out";

/**
 * Entry point for the "Profile" nav link. Not a real auth gate — it just
 * checks whether the locally-remembered email has a submitted registration.
 */
export default function ProfileGate() {
  const [state, setState] = useState<GateState>(() =>
    getStoredEmail() ? "checking" : "signed-out",
  );

  useEffect(() => {
    const email = getStoredEmail();

    if (!email) {
      return;
    }

    let cancelled = false;

    getRegistrationByEmail(email, HACKATHON_ID)
      .then((registration) => {
        if (cancelled) return;
        if (registration) {
          setState("signed-in");
        } else {
          clearStoredEmail();
          setState("signed-out");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState("signed-out");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-(--color-night) text-(--color-light)">
        <p className="text-sm text-(--color-mist)">Checking your application…</p>
      </main>
    );
  }

  return <Navigate to={state === "signed-in" ? "/you" : "/register"} replace />;
}
