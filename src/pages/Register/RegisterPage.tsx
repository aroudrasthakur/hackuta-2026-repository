import { useCallback, useState } from "react";
import { Logo } from "../../components/art/Logo";
import { EmailStep } from "./EmailStep";
import { CodeStep } from "./CodeStep";
import { ApplicationForm } from "./ApplicationForm";
import { SuccessStep } from "./SuccessStep";

export type RegisterStep = "email" | "code" | "application" | "success";

export default function RegisterPage() {
  const [step, setStep] = useState<RegisterStep>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const handleEmailSent = useCallback((sentEmail: string) => {
    setEmail(sentEmail);
    setStep("code");
  }, []);

  const handleVerified = useCallback((verifiedToken: string) => {
    setToken(verifiedToken);
    setStep("application");
  }, []);

  const handleSubmitted = useCallback(() => setStep("success"), []);

  return (
    <div className="register-page min-h-screen bg-(--color-night) text-(--color-light)">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
        <a href="/" aria-label="HackUTA home" className="mb-8 inline-flex">
          <Logo className="h-12 w-auto" variant="dark" layout="header" decorative />
        </a>
        <div className="w-full rounded-3xl border border-(--color-ocean)/40 bg-(--color-ink)/60 p-6 shadow-2xl backdrop-blur sm:p-10">
          {step === "email" && <EmailStep onSent={handleEmailSent} />}
          {step === "code" && (
            <CodeStep email={email} onVerified={handleVerified} onBack={() => setStep("email")} />
          )}
          {step === "application" && (
            <ApplicationForm email={email} token={token} onSubmitted={handleSubmitted} />
          )}
          {step === "success" && <SuccessStep />}
        </div>
      </div>
    </div>
  );
}
