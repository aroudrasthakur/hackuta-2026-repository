import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../components/art/Logo";

type Profile = {
  firstName: string;
  lastName: string;
  hackathonId: string;
  status: "draft" | "submitted" | "accepted" | "waitlisted" | "rejected" | "withdrawn";
  eligibilityStatus: "unreviewed" | "eligible" | "ineligible";
  submittedAt: number | null;
  reviewedAt: number | null;
  updatedAt: number;
};

const STATUS_COPY: Record<Profile["status"], { label: string; detail: string }> = {
  draft: { label: "Draft", detail: "Your application is saved but has not been submitted." },
  submitted: { label: "Under review", detail: "Your application is in the review queue." },
  accepted: { label: "Accepted", detail: "You are in. We will send the next steps by email." },
  waitlisted: { label: "Waitlisted", detail: "We will contact you if a place becomes available." },
  rejected: { label: "Not selected", detail: "Thank you for taking the time to apply." },
  withdrawn: { label: "Withdrawn", detail: "This application is no longer active." },
};

const ELIGIBILITY_COPY: Record<Profile["eligibilityStatus"], string> = {
  unreviewed: "Eligibility review pending",
  eligible: "Eligibility confirmed",
  ineligible: "Eligibility requirements not met",
};

function formatDate(timestamp: number | null) {
  if (!timestamp) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error" | "auth">("loading");
  const navigate = useNavigate();

  const signOut = () => {
    setProfile(null);
    setState("auth");
    navigate("/register", { replace: true });
  };

  useEffect(() => {
    let active = true;

    const controller = new AbortController();

    fetch("/api/profile", {
      signal: controller.signal,
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.status === 401) {
          setState("auth");
          return null;
        }

        if (!response.ok) throw new Error("Profile unavailable");
        return (await response.json()) as Profile | null;
      })
      .then((data) => {
        if (!active) return;
        if (!data) {
          setState("empty");
          return;
        }
        setProfile(data);
        setState("ready");
      })
      .catch((error) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        setState("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const status = profile ? STATUS_COPY[profile.status] : null;

  return (
    <main className="min-h-screen bg-(--color-night) text-(--color-light)">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10 sm:py-12">
        <header className="flex items-center justify-between gap-6">
          <Link to="/" aria-label="HackUTA home" className="inline-flex">
            <Logo className="h-10 w-auto" variant="dark" layout="header" decorative />
          </Link>
          <Link
            to="/"
            className="text-sm uppercase tracking-[0.12em] text-(--color-sand) underline decoration-(--color-ocean) underline-offset-8"
          >
            Home
          </Link>
        </header>

        <section className="grid flex-1 content-center gap-8 py-16 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-(--color-sand)">Applicant portal</p>
            <h1 className="max-w-xl font-(family-name:--font-display) text-5xl leading-[0.95] text-(--color-light) sm:text-7xl">
              Your HackUTA journey
            </h1>
            <p className="mt-6 max-w-md text-lg text-(--color-mist)">
              This is your private application record. We will update it here as decisions are made.
            </p>
          </div>

          <div className="border border-(--color-ocean)/60 bg-(--color-ink)/55 p-6 shadow-2xl backdrop-blur sm:p-10">
            {state === "loading" && <p className="text-(--color-mist)">Loading your application...</p>}
            {state === "auth" && (
              <div role="alert">
                <h2 className="font-(family-name:--font-display) text-3xl">Sign in required</h2>
                <p className="mt-3 text-(--color-mist)">Please sign in with the account used for your application.</p>
                <Link
                  to="/register"
                  className="mt-6 inline-flex items-center justify-center border border-(--color-ocean) px-5 py-3 text-sm uppercase tracking-[0.1em] text-(--color-sand)"
                >
                  Go to application
                </Link>
              </div>
            )}
            {state === "error" && (
              <div role="alert">
                <h2 className="font-(family-name:--font-display) text-3xl">We could not load your profile</h2>
                <p className="mt-3 text-(--color-mist)">Please try again in a moment.</p>
              </div>
            )}
            {state === "empty" && (
              <div>
                <h2 className="font-(family-name:--font-display) text-3xl">No application found</h2>
                <p className="mt-3 text-(--color-mist)">We could not find an application for this account.</p>
              </div>
            )}
            {state === "ready" && profile && status && (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-(--color-ocean)/50 pb-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-(--color-mist)">Applicant</p>
                    <h2 className="mt-2 font-(family-name:--font-display) text-4xl">{profile.firstName} {profile.lastName}</h2>
                  </div>
                  <span className="border border-(--color-sand)/70 px-3 py-2 text-sm uppercase tracking-[0.12em] text-(--color-sand)">
                    {status.label}
                  </span>
                </div>
                <p className="mt-6 text-xl text-(--color-light)">{status.detail}</p>
                <dl className="mt-8 grid gap-5 border-t border-(--color-ocean)/50 pt-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-(--color-mist)">Application submitted</dt>
                    <dd className="mt-1 text-(--color-light)">{formatDate(profile.submittedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-(--color-mist)">Eligibility</dt>
                    <dd className="mt-1 text-(--color-light)">{ELIGIBILITY_COPY[profile.eligibilityStatus]}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-(--color-mist)">Last updated</dt>
                    <dd className="mt-1 text-(--color-light)">{formatDate(profile.updatedAt)}</dd>
                  </div>
                </dl>
                <p className="mt-8 border-l-2 border-(--color-sand) pl-4 text-sm text-(--color-mist)">
                  This page is view only. Questions about your application? Reply to the HackUTA email you received.
                </p>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-8 text-sm uppercase tracking-[0.12em] text-(--color-sand) underline decoration-(--color-ocean) underline-offset-8"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}