"use client";

import { WaveBackground } from "@redesigner/wave.js";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

type HeroWavesHandle = {
  update: (storm: number) => void;
};

type HeroWavesProps = {
  motionEnabled: boolean;
  storm: number;
};

const MIN_STORM = 0;
const MAX_STORM = 1;

function clampStorm(storm: number) {
  if (!Number.isFinite(storm)) {
    return MIN_STORM;
  }

  return Math.min(MAX_STORM, Math.max(MIN_STORM, storm));
}

export const HeroWaves = forwardRef<HeroWavesHandle, HeroWavesProps>(
  function HeroWaves({ motionEnabled, storm }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const waveRef = useRef<WaveBackground | null>(null);
    const stormRef = useRef(clampStorm(storm));

    /**
     * Updates wave characteristics without causing a React render.
     */
    const update = useCallback((nextStorm: number) => {
      const normalizedStorm = clampStorm(nextStorm);

      stormRef.current = normalizedStorm;

      const wave = waveRef.current;

      if (!wave) {
        return;
      }

      wave.setParam("speed", 0.2 + normalizedStorm * 0.5);

      wave.setParam("amplitude", 0.026 + normalizedStorm * 0.09);

      wave.setParam("frequency", 7.2 - normalizedStorm * 1.2);

      wave.setParam("randomness", 0.2 + normalizedStorm * 0.48);

      wave.setParam("thicknessRandom", 0.12 + normalizedStorm * 0.42);
    }, []);

    /**
     * Expose the imperative update API to the parent.
     */
    useImperativeHandle(
      ref,
      () => ({
        update,
      }),
      [update],
    );

    /**
     * Create and destroy the wave renderer.
     *
     * Changing motionEnabled recreates the renderer because the
     * renderer mode is selected during construction.
     */
    useEffect(() => {
      const host = hostRef.current;

      if (!host) {
        return;
      }

      const wave = new WaveBackground(host, {
        renderer: motionEnabled ? "auto" : "none",

        colors: ["#102f46", "#1a3a52", "#305873", "#637d8d"],

        colorOpacities: [1, 1, 0.88, 0.62],

        waveCount: 12,

        speed: 0.2,
        amplitude: 0.026,
        frequency: 7.2,

        opacity: 0.92,

        thickness: 2,
        blur: 1,
        concentration: 2.8,

        randomness: 0.2,
        thicknessRandom: 0.12,

        verticalOffset: 0.22,

        splitFill: true,

        pixelRatio: Math.min(window.devicePixelRatio, 1.5),

        maxFPS: 45,
      });

      waveRef.current = wave;

      const hero = host.closest<HTMLElement>(".od-hero");

      const setRendererState = () => {
        host.dataset.renderer = wave.renderMode;

        hero?.setAttribute("data-water-renderer", wave.renderMode);
      };

      const hideRenderer = () => {
        host.dataset.renderer = "pending";

        hero?.removeAttribute("data-water-renderer");
      };

      /*
       * Expose the renderer state to CSS / surrounding UI.
       */
      setRendererState();

      /*
       * Apply the most recently requested storm intensity.
       */
      update(stormRef.current);

      const canvas = host.querySelector<HTMLCanvasElement>("canvas");

      const handleContextLost = (event: Event) => {
        event.preventDefault();

        hideRenderer();
      };

      const handleContextRestored = () => {
        setRendererState();

        update(stormRef.current);
      };

      canvas?.addEventListener("webglcontextlost", handleContextLost);

      canvas?.addEventListener("webglcontextrestored", handleContextRestored);

      return () => {
        waveRef.current = null;

        canvas?.removeEventListener("webglcontextlost", handleContextLost);

        canvas?.removeEventListener(
          "webglcontextrestored",
          handleContextRestored,
        );

        hideRenderer();

        wave.destroy();
      };
    }, [motionEnabled, update]);

    /**
     * Update the existing renderer when storm changes.
     *
     * This intentionally does not recreate WaveBackground.
     */
    useEffect(() => {
      update(storm);
    }, [storm, update]);

    return (
      <div
        ref={hostRef}
        className="od-webgl-water"
        data-renderer="pending"
        aria-hidden="true"
      />
    );
  },
);

HeroWaves.displayName = "HeroWaves";
