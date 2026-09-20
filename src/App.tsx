import { Header } from "./components/Header";
import CustomCursor from "./components/cursor/CustomCursor";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Schedule } from "./components/Schedule";
import { FAQ } from "./components/FAQ";
import { Sponsors } from "./components/Sponsors";
import { Footer } from "./components/Footer";
import { NotFound } from "./components/NotFound";
import { Auth } from "./components/Auth";
import { HeatWaveDefs } from "./components/art/HeatWave";
import { useMotionPreference } from "./hooks/useMotionPreference";
import { useEffect, useState } from "react";
import { scrollToSection } from "./utils/scrollToSection";

function currentRoute(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/index.html") return "home";
  if (path === "/login" || path === "/signup") return "auth";
  return "lost";
}

export default function App() {
  const { motionEnabled } = useMotionPreference();
  const [route, setRoute] = useState(() => currentRoute(window.location.pathname));

  useEffect(() => {
    const sync = () => setRoute(currentRoute(window.location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (route !== "home") return;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const scrollFromHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      requestAnimationFrame(() => {
        scrollToSection(id);
      });
    };

    scrollFromHash();
    window.addEventListener("hashchange", scrollFromHash);
    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, [route]);

  useEffect(() => {
    if (route !== "home") return;

    document.documentElement.dataset.revealReady = "true";
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main > section:not(.odyssey-call-section):not(#top):not(#sponsors) :is(h2, h3, p, a, li, article, img), footer :is(h2, h3, p, a, li, address, img)',
      ),
    ).filter(
      (item) =>
        !item.closest('[aria-hidden="true"]') &&
        !item.closest(".footer-bottom"),
    );

    items.forEach((item, index) => {
      item.classList.add("site-reveal-item");
      item.style.setProperty("--reveal-delay", `${(index % 5) * 0.06}s`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.toggleAttribute("data-reveal-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.revealReady;
    };
  }, [route]);

  if (route === "auth") {
    return (
      <>
        <CustomCursor />
        <Auth />
      </>
    );
  }

  if (route === "lost") {
    return (
      <>
        <CustomCursor />
        <NotFound />
      </>
    );
  }

  return (
    <>
      <HeatWaveDefs />
      <CustomCursor />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero motionEnabled={motionEnabled} />
        <About />
        <Schedule />
        <FAQ motionEnabled={motionEnabled} />
        <Sponsors />
      </main>
      <Footer motionEnabled={motionEnabled} />
    </>
  );
}
