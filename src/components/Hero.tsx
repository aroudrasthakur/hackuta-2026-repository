import {
  type CSSProperties,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Ship } from "./art/Ship";
import { CoastCliff } from "./art/CoastCliff";
import { Logo } from "./art/Logo";
import { HeroCountdown } from "./Countdown";

import { HERO_AMBIENT_STORM } from "../constants/heroWeather";
import { clamp01 } from "../utils/clamp";

/**
 * The WebGL atmosphere and water effects are decorative.
 *
 * CSS sky haze and SVG departure water provide fallbacks while these
 * chunks load and when motion is disabled.
 */
const HeroAtmosphere = lazy(() =>
  import("./HeroAtmosphere").then((module) => ({
    default: module.HeroAtmosphere,
  })),
);

const HeroWaves = lazy(() =>
  import("./HeroWaves").then((module) => ({
    default: module.HeroWaves,
  })),
);

type HeroProps = {
  motionEnabled: boolean;
};

type HeroStyle = CSSProperties & {
  "--storm": number;
  "--hero-exit": number;
};

type RainDrop = {
  left: string;
  delay: string;
  duration: string;
  opacity: number;
};

type HeroWordmarkProps = {
  motionEnabled: boolean;
  onComplete: () => void;
};

const HERO_WORDMARK = "HackUTA";

const TYPEWRITER_START_DELAY_MS = 420;
const TYPEWRITER_CHAR_DELAY_MS = 92;

/**
 * Rain configuration is static, so generate it once at module load
 * instead of recreating it whenever Hero renders.
 */
const RAIN_DROPS: readonly RainDrop[] = Array.from(
  { length: 34 },
  (_, index) => ({
    left: `${(index * 37 + 11) % 101}%`,
    delay: `${-((index * 0.37) % 3.8)}s`,
    duration: `${1.05 + (index % 7) * 0.08}s`,
    opacity: 0.16 + (index % 5) * 0.07,
  }),
);

/**
 * Animated HackUTA wordmark.
 *
 * When motion is disabled, the complete word is derived during render
 * rather than synchronously updating state inside an effect.
 */
function HeroWordmark({ motionEnabled, onComplete }: HeroWordmarkProps) {
  const [length, setLength] = useState(() =>
    motionEnabled ? 0 : HERO_WORDMARK.length,
  );

  const completedRef = useRef(!motionEnabled);

  /**
   * If motion becomes disabled midway through typing, immediately
   * render the full word without modifying React state.
   */
  const visibleLength = motionEnabled ? length : HERO_WORDMARK.length;

  useEffect(() => {
    if (!motionEnabled) {
      return;
    }

    /**
     * Signal completion exactly once.
     */
    if (length >= HERO_WORDMARK.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }

      return;
    }

    const delay =
      length === 0 ? TYPEWRITER_START_DELAY_MS : TYPEWRITER_CHAR_DELAY_MS;

    const timer = window.setTimeout(() => {
      setLength((currentLength) =>
        Math.min(currentLength + 1, HERO_WORDMARK.length),
      );
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [length, motionEnabled, onComplete]);

  const typing = motionEnabled && visibleLength < HERO_WORDMARK.length;

  return (
    <span className="od-hero-wordmark" aria-hidden="true">
      {HERO_WORDMARK.slice(0, visibleLength)}

      {typing ? (
        <span className="od-hero-wordmark-cursor" aria-hidden="true">
          |
        </span>
      ) : null}
    </span>
  );
}

export function Hero({ motionEnabled }: HeroProps) {
  /**
   * Storm intensity is normalized before being exposed to CSS
   * or passed into GPU effects.
   */
  const storm = motionEnabled ? clamp01(HERO_AMBIENT_STORM) : 0;

  const heroStyle: HeroStyle = {
    "--storm": storm,
    "--hero-exit": 0,
  };

  const heroRef = useRef<HTMLElement>(null);

  /**
   * showYear only tracks completion of the animated intro.
   *
   * When motion is disabled, visibility is derived directly rather
   * than synchronized through an effect.
   */
  const [showYear, setShowYear] = useState(() => !motionEnabled);

  const yearVisible = !motionEnabled || showYear;

  const handleWordmarkComplete = useCallback(() => {
    setShowYear(true);
  }, []);

  /**
   * Calculate how far the hero has exited the viewport.
   *
   * Scroll and resize events only schedule work. Layout is read once
   * on the next animation frame, preventing excessive synchronous
   * layout calculations during scrolling.
   */
  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    let frame: number | null = null;

    const apply = () => {
      frame = null;

      const rect = hero.getBoundingClientRect();

      if (
        !Number.isFinite(rect.top) ||
        !Number.isFinite(rect.height) ||
        rect.height <= 0
      ) {
        return;
      }

      const exit = clamp01(-rect.top / (rect.height * 0.55));

      hero.style.setProperty("--hero-exit", String(exit));
    };

    /**
     * Only allow one pending RAF update at a time.
     */
    const scheduleUpdate = () => {
      if (frame !== null) {
        return;
      }

      frame = window.requestAnimationFrame(apply);
    };

    /**
     * Hero dimensions may change due to responsive layout,
     * font loading, image sizing, or viewport changes.
     */
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleUpdate)
        : null;

    resizeObserver?.observe(hero);

    /**
     * Set the initial exit value immediately.
     */
    apply();

    window.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });

    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      resizeObserver?.disconnect();

      window.removeEventListener("scroll", scheduleUpdate);

      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="top"
      className="od-hero"
      data-animated={motionEnabled}
      data-motion={motionEnabled}
      style={heroStyle}
      aria-labelledby="hero-title"
    >
      <div className="od-hero-stage">
        {/*
         * Decorative shader atmosphere.
         *
         * Completely skip loading and initializing WebGL when
         * motion is disabled.
         */}
        {motionEnabled ? (
          <Suspense fallback={null}>
            <HeroAtmosphere motionEnabled={motionEnabled} storm={storm} />
          </Suspense>
        ) : null}

        {/* Left lightning bolt */}
        <div className="od-lightning od-lightning-left" aria-hidden="true">
          <svg viewBox="0 0 120 330" focusable="false">
            <path d="m75 4-43 118 38-9-34 90 33-13-25 132 69-173-39 13 34-77-37 9Z" />
          </svg>
        </div>

        {/* Right lightning bolt */}
        <div className="od-lightning od-lightning-right" aria-hidden="true">
          <svg viewBox="0 0 120 330" focusable="false">
            <path d="m75 4-43 118 38-9-34 90 33-13-25 132 69-173-39 13 34-77-37 9Z" />
          </svg>
        </div>

        <div className="od-lightning-wash" aria-hidden="true" />

        {/* Left coastline */}
        <div className="od-hero-coast od-hero-coast-left" aria-hidden="true">
          <CoastCliff priority />
        </div>

        {/* Right coastline */}
        <div className="od-hero-coast od-hero-coast-right" aria-hidden="true">
          <CoastCliff />
        </div>

        {/* Decorative rain */}
        {motionEnabled ? (
          <div className="od-rain" aria-hidden="true">
            {RAIN_DROPS.map((drop, index) => (
              <i
                key={index}
                style={{
                  left: drop.left,
                  animationDelay: drop.delay,
                  animationDuration: drop.duration,
                  opacity: drop.opacity,
                }}
              />
            ))}
          </div>
        ) : null}

        {/* Main hero content */}
        <div className="od-hero-copy relative z-10 mx-auto">
          <div className="od-hero-copy-logo">
            <Logo className="od-hero-logo" layout="hero" priority decorative />
          </div>

          <div className="od-hero-copy-text">
            <p className="od-hero-date uppercase">
              <span>November 14–15, 2026</span>
            </p>

            {/*
             * A stable aria-label prevents assistive technologies
             * from receiving every intermediate typewriter state.
             */}
            <h1
              id="hero-title"
              className="od-hero-title flex items-end gap-2"
              aria-label="HackUTA 26"
            >
              <HeroWordmark
                motionEnabled={motionEnabled}
                onComplete={handleWordmarkComplete}
              />

              <span
                className="od-hero-year font-semibold"
                data-visible={yearVisible}
                aria-hidden="true"
              >
                26
              </span>
            </h1>

            <div className="od-hero-coming-soon">
              <span className="od-hero-coming-soon-mark" aria-hidden="true" />

              <span>Coming soon</span>
            </div>

            <HeroCountdown />
          </div>
        </div>

        {/* Odyssey ship */}
        <div className="od-hero-boat" aria-hidden="true">
          <div className="od-hero-boat-bob">
            <Ship className="od-hero-ship" rowing={motionEnabled} tone="ink" />
          </div>
        </div>

        {/*
         * WebGL water.
         *
         * The static SVG departure water below remains as the
         * graceful fallback.
         */}
        {motionEnabled ? (
          <Suspense fallback={null}>
            <HeroWaves motionEnabled={motionEnabled} storm={storm} />
          </Suspense>
        ) : null}

        {/* Static departure water */}
        <div className="od-departure-water" aria-hidden="true">
          <svg
            viewBox="0 0 3200 120"
            preserveAspectRatio="none"
            focusable="false"
          >
            <g className="od-wave-surface">
              <path
                d="M-400 27Q-300 2-200 27T0 27T200 27T400 27T600 27T800 27T1000 27T1200 27T1400 27T1600 27T1800 27T2000 27T2200 27T2400 27T2600 27T2800 27T3000 27T3200 27T3400 27v130H-400Z"
                fill="currentColor"
              />

              <path
                d="M-400 27Q-300 2-200 27T0 27T200 27T400 27T600 27T800 27T1000 27T1200 27T1400 27T1600 27T1800 27T2000 27T2200 27T2400 27T2600 27T2800 27T3000 27T3200 27T3400 27"
                stroke="var(--clay)"
                strokeWidth="2"
              />
            </g>

            <g className="od-wave-ripple">
              <path
                d="M-400 52Q-300 34-200 52T0 52T200 52T400 52T600 52T800 52T1000 52T1200 52T1400 52T1600 52T1800 52T2000 52T2200 52T2400 52T2600 52T2800 52T3000 52T3200 52T3400 52"
                stroke="var(--clay)"
                strokeWidth="1"
                opacity=".55"
              />
            </g>

            <g className="od-wave-depth">
              <path
                d="M-400 74Q-300 58-200 74T0 74T200 74T400 74T600 74T800 74T1000 74T1200 74T1400 74T1600 74T1800 74T2000 74T2200 74T2400 74T2600 74T2800 74T3000 74T3200 74T3400 74"
                stroke="var(--clay)"
                strokeWidth="1"
                opacity=".35"
              />
            </g>
          </svg>
        </div>

        {/* Hero footer */}
        <div className="od-hero-foot absolute inset-x-0 bottom-0 z-20 flex items-center">
          <span>
            Arlington, Texas <span aria-hidden="true">/</span> 2026
          </span>
        </div>
      </div>
    </section>
  );
}
