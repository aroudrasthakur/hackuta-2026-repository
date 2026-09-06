import { LandingBackground } from "@/components/layout/landing-background";
import { Navbar } from "@/components/layout/navbar";

export default function Home() {
  return (
    <div className="relative min-h-dvh">
      <LandingBackground />
      <Navbar />

      {/* Hero, countdown, and sponsors sections will mount here */}
      <main className="relative z-10 min-h-dvh pt-24" />
    </div>
  );
}
