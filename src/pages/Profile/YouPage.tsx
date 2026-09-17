import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../components/art/Logo";
import { OdysseyButton } from "../../components/OdysseyButton";
import { clearStoredEmail, getStoredEmail } from "../../utils/session";

export default function YouPage() {
  const email = getStoredEmail();
  const navigate = useNavigate();

  const signOut = () => {
    clearStoredEmail();
    navigate("/");
  };

  return (
    <main className="you-page flex min-h-screen flex-col items-center bg-(--color-night) px-6 py-12 text-(--color-light) sm:py-16">
      <Link to="/" aria-label="HackUTA home" className="mb-8 inline-flex">
        <Logo className="h-12 w-auto" variant="dark" layout="header" decorative />
      </Link>

      <div className="w-full max-w-2xl rounded-3xl border border-(--color-ocean)/40 bg-(--color-ink)/60 p-6 text-center shadow-2xl backdrop-blur sm:p-10">
        <h1 className="font-(family-name:--font-display) text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-(--color-mist)">
          {email ? `Signed in as ${email}. ` : ""}
          Your application is on file — profile details are coming soon.
        </p>

        <OdysseyButton href="/" className="mt-6">
          Back home
        </OdysseyButton>

        <button
          type="button"
          onClick={signOut}
          className="mt-4 block w-full text-xs text-(--color-mist) underline"
        >
          Not you? Sign out
        </button>
      </div>
    </main>
  );
}
