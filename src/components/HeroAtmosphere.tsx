import {
  Dithering,
  type PaperShaderElement,
} from "@paper-design/shaders-react";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

type HeroAtmosphereHandle = {
  update: (progress: number, storm: number) => void;
};

type HeroAtmosphereProps = {
  motionEnabled: boolean;
  storm: number;
};

type AtmosphereState = {
  progress: number;
  storm: number;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export const HeroAtmosphere = forwardRef<
  HeroAtmosphereHandle,
  HeroAtmosphereProps
>(function HeroAtmosphere({ motionEnabled, storm }, ref) {
  const shaderRef = useRef<PaperShaderElement>(null);

  const stateRef = useRef<AtmosphereState>({
    progress: 0,
    storm: clamp01(storm),
  });

  /**
   * Update shader properties directly without causing
   * React renders during continuous interaction.
   */
  const update = useCallback(
    (nextProgress: number, nextStorm: number) => {
      const progress = clamp01(nextProgress);
      const storm = clamp01(nextStorm);

      stateRef.current = {
        progress,
        storm,
      };

      const shader = shaderRef.current?.paperShaderMount;

      if (!shader) {
        return;
      }

      shader.setSpeed(motionEnabled ? 0.07 + storm * 0.31 : 0);

      shader.setUniforms({
        u_pxSize: 6 - storm * 2.4,

        u_offsetX: (progress - 0.5) * 0.12,

        u_scale: 0.72 - storm * 0.08,
      });
    },
    [motionEnabled],
  );

  /**
   * Allow the hero controller to update the atmosphere
   * without passing rapidly changing values through React.
   */
  useImperativeHandle(
    ref,
    () => ({
      update,
    }),
    [update],
  );

  /**
   * Detect shader initialization and WebGL context state.
   */
  useEffect(() => {
    const element = shaderRef.current;

    if (!element) {
      return;
    }

    const hero = element.closest<HTMLElement>(".od-hero");

    let canvas: HTMLCanvasElement | null = null;

    const hideRenderer = () => {
      element.dataset.renderer = "pending";

      hero?.removeAttribute("data-weather-renderer");
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();

      hideRenderer();
    };

    const markReady = () => {
      const nextCanvas = element.querySelector<HTMLCanvasElement>("canvas");

      const shader = element.paperShaderMount;

      if (!shader || !nextCanvas) {
        return false;
      }

      bindCanvas(nextCanvas);

      element.dataset.renderer = "webgl";

      hero?.setAttribute("data-weather-renderer", "paper-webgl");

      update(stateRef.current.progress, stateRef.current.storm);

      return true;
    };

    const handleContextRestored = () => {
      markReady();
    };

    const bindCanvas = (nextCanvas: HTMLCanvasElement) => {
      if (canvas === nextCanvas) {
        return;
      }

      canvas?.removeEventListener("webglcontextlost", handleContextLost);

      canvas?.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );

      canvas = nextCanvas;

      canvas.addEventListener("webglcontextlost", handleContextLost);

      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    };

    /*
     * The shader may already be initialized by the time
     * this effect runs.
     */
    if (markReady()) {
      return () => {
        canvas?.removeEventListener("webglcontextlost", handleContextLost);

        canvas?.removeEventListener(
          "webglcontextrestored",
          handleContextRestored,
        );

        hideRenderer();
      };
    }

    /*
     * Otherwise watch for Paper Shader inserting its canvas
     * instead of polling every animation frame.
     */
    const observer = new MutationObserver(() => {
      if (markReady()) {
        observer.disconnect();
      }
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      canvas?.removeEventListener("webglcontextlost", handleContextLost);

      canvas?.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );

      hideRenderer();
    };
  }, [update]);

  /**
   * Keep shader intensity synchronized with the React prop.
   */
  useEffect(() => {
    update(stateRef.current.progress, storm);
  }, [storm, update]);

  return (
    <Dithering
      ref={shaderRef}
      className="od-weather-shader"
      data-renderer="pending"
      colorBack="#d8cbb8"
      colorFront="#305873"
      shape="warp"
      type="8x8"
      size={6}
      speed={motionEnabled ? 0.07 : 0}
      frame={1260}
      scale={0.72}
      rotation={4}
      offsetY={-0.12}
      width="100%"
      height="100%"
      minPixelRatio={1}
      maxPixelCount={1_200_000}
      aria-hidden="true"
    />
  );
});
