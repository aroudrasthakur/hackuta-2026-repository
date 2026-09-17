import { useCallback, useState } from "react";
import { Logo } from "../../components/art/Logo";
import { ApplicationForm } from "./ApplicationForm";
import { SuccessStep } from "./SuccessStep";

export type RegisterStep = "application" | "success";

export default function RegisterPage() {
  const [step, setStep] = useState<RegisterStep>("application");

  const handleSubmitted = useCallback(() => setStep("success"), []);

  return (
    <div className="register-page min-h-screen bg-(--color-night) text-(--color-light)">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
        <a href="/" aria-label="HackUTA home" className="mb-8 inline-flex">
          <Logo className="h-12 w-auto" variant="dark" layout="header" decorative />
        </a>
        <div className="w-full rounded-3xl border border-(--color-ocean)/40 bg-(--color-ink)/60 p-6 shadow-2xl backdrop-blur sm:p-10">
          {step === "application" && (
            <ApplicationForm onSubmitted={handleSubmitted} />
          )}
          {step === "success" && <SuccessStep />}
        </div>
      </div>
    </div>
  );
}
