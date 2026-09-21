import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { Logo } from "./art/Logo";

import { PRIMARY_NAV_LINKS } from "../constants/navigation";
import { REGISTER_URL } from "../constants/site";

import { scrollToSection } from "../utils/scrollToSection";
import { clamp01 } from "../utils/clamp";

type HeaderTheme = "clay" | "dark";

const DEFAULT_HEADER_HEIGHT = 84;
const READING_LINE_OFFSET = 65;
const MLH_FADE_DISTANCE = 500;
const MLH_DISABLE_THRESHOLD = 0.95;
const DESKTOP_BREAKPOINT = 768;

function getSectionTheme(value: string | undefined): HeaderTheme | null {
  if (value === "clay" || value === "dark") {
    return value;
  }

  return null;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<HeaderTheme>("clay");
  const [active, setActive] = useState("");
  const [badgeInactive, setBadgeInactive] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const header = headerRef.current;

    if (!header) {
      return;
    }

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main > section"),
    );

    const headerInner = header.querySelector<HTMLElement>(".header-inner");

    let frame: number | null = null;

    const update = () => {
      frame = null;

      const headerHeight = headerInner?.clientHeight ?? DEFAULT_HEADER_HEIGHT;

      const readingLine = headerHeight + READING_LINE_OFFSET;

      /**
       * Read each section's geometry only once per frame.
       */
      const sectionRects = sections.map((section) => ({
        section,
        rect: section.getBoundingClientRect(),
      }));

      /**
       * Section considered active for navigation.
       */
      const current = sectionRects.find(
        ({ rect }) => rect.top <= readingLine && rect.bottom > readingLine,
      );

      /**
       * Section physically underneath the header.
       *
       * This controls whether the header needs its light
       * or dark visual treatment.
       */
      const headerLine = headerHeight / 2;

      const behindHeader = sectionRects.find(
        ({ rect }) => rect.top <= headerLine && rect.bottom > headerLine,
      );

      const sectionTheme = getSectionTheme(behindHeader?.section.dataset.theme);

      const nextTheme: HeaderTheme =
        sectionTheme ?? (window.scrollY < headerHeight ? "clay" : "dark");

      setTheme(nextTheme);

      setActive(current?.section.id ?? "");

      /**
       * Fade the MLH badge over the first 500px
       * of scrolling.
       */
      const fade = clamp01(window.scrollY / MLH_FADE_DISTANCE);

      document.documentElement.style.setProperty(
        "--mlh-badge-fade",
        String(fade),
      );

      /**
       * Once effectively invisible, prevent the badge
       * from becoming an invisible mouse or keyboard target.
       */
      setBadgeInactive(fade > MLH_DISABLE_THRESHOLD);
    };

    const requestUpdate = () => {
      if (frame !== null) {
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    /**
     * Section dimensions can change after images,
     * fonts, or responsive content finish loading.
     */
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(requestUpdate)
        : null;

    if (headerInner) {
      resizeObserver?.observe(headerInner);
    }

    for (const section of sections) {
      resizeObserver?.observe(section);
    }

    /**
     * Schedule the first measurement instead of
     * synchronously updating React state inside
     * the effect body.
     */
    requestUpdate();

    window.addEventListener("scroll", requestUpdate, {
      passive: true,
    });

    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      resizeObserver?.disconnect();

      window.removeEventListener("scroll", requestUpdate);

      window.removeEventListener("resize", requestUpdate);

      document.documentElement.style.removeProperty("--mlh-badge-fade");
    };
  }, []);

  /**
   * Mobile navigation interactions.
   *
   * Escape closes the menu and returns focus to
   * the toggle button.
   *
   * Pointer interaction outside the header also
   * closes the menu.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);

      menuButtonRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!headerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    window.addEventListener("pointerdown", handlePointerDown);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      window.removeEventListener("pointerdown", handlePointerDown);

      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  /**
   * Handle same-page navigation.
   *
   * scrollToSection returns true when custom scrolling
   * successfully handles the navigation. Otherwise the
   * normal anchor behavior remains available as fallback.
   */
  const navigate = useCallback(
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (scrollToSection(id)) {
        event.preventDefault();
      }

      /**
       * Always close mobile navigation after
       * selecting a destination.
       */
      setOpen(false);
    },
    [],
  );

  const badgeUnavailable = open || badgeInactive;

  return (
    <>
      <a
        id="mlh-trust-badge"
        className="header-mlh-badge"
        href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=gray"
        target="_blank"
        rel="noopener noreferrer"
        aria-hidden={badgeUnavailable ? true : undefined}
        tabIndex={badgeUnavailable ? -1 : undefined}
        hidden={open}
        style={{
          pointerEvents: badgeInactive ? "none" : undefined,
        }}
      >
        <img
          src="/images/mlh-trust-badge-2027-gray.svg"
          alt="Major League Hacking"
          width={393}
          height={688}
          decoding="async"
          loading="lazy"
        />
      </a>

      <header
        ref={headerRef}
        className="site-header"
        data-theme={theme}
        data-open={open}
      >
        <div className="header-inner">
          <div className="header-mobile-stack">
            <a
              href="#top"
              className="header-brand"
              aria-label="HackUTA home"
              onClick={navigate("top")}
            >
              <Logo
                className="site-logo"
                variant={theme === "dark" ? "dark" : "light"}
                layout="header"
                decorative
              />
            </a>

            <button
              ref={menuButtonRef}
              className="menu-toggle"
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen((current) => !current)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>

          <nav
            aria-label="Main navigation"
            className="header-pill-nav items-center uppercase"
          >
            {PRIMARY_NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={active === link.id ? "location" : undefined}
                onClick={navigate(link.id)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="mobile-navigation"
          hidden={!open}
        >
          {PRIMARY_NAV_LINKS.map((link, index) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? "location" : undefined}
              onClick={navigate(link.id)}
            >
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              {link.label}

              <span className="mobile-nav-arrow" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" focusable="false">
                  <path
                    d="M3 13L13 3M13 3H6M13 3V10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          ))}
          <a href={REGISTER_URL}>
            <span>0{PRIMARY_NAV_LINKS.length + 1}</span>
            Apply
            <span className="mobile-nav-arrow" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 13L13 3M13 3H6M13 3V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        </nav>
      </header>
    </>
  );
}
