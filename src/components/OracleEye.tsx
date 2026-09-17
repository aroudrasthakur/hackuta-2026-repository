import { useCallback, useEffect, useId, useRef, useState } from "react";

const EYE_CENTER = { x: 110, y: 58 } as const;
const CENTERED_OFFSET = { x: 0, y: 0 } as const;

const MAX_PUPIL_OFFSET = 14;
const FOLLOW_EASING = 0.14;
const ANIMATION_EPSILON = 0.01;

const EYE_MESSAGE = "Odysseus had eyes like Athena's";

type Point = {
  x: number;
  y: number;
};

interface OracleEyeProps {
  motionEnabled: boolean;
}

function isFinitePoint(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/**
 * Converts browser coordinates into the SVG's internal coordinate system.
 *
 * getScreenCTM accounts for SVG scaling, transformations,
 * and preserveAspectRatio behavior.
 */
function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point | null {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return null;
  }

  const matrix = svg.getScreenCTM();

  if (!matrix) {
    return null;
  }

  const point = new DOMPoint(clientX, clientY).matrixTransform(
    matrix.inverse(),
  );

  const result: Point = {
    x: point.x,
    y: point.y,
  };

  return isFinitePoint(result) ? result : null;
}

/**
 * Restricts eye movement to MAX_PUPIL_OFFSET.
 */
function clampPupilOffset(dx: number, dy: number): Point {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return { ...CENTERED_OFFSET };
  }

  const distance = Math.hypot(dx, dy);

  if (distance === 0 || distance <= MAX_PUPIL_OFFSET) {
    return {
      x: dx,
      y: dy,
    };
  }

  const scale = MAX_PUPIL_OFFSET / distance;

  return {
    x: dx * scale,
    y: dy * scale,
  };
}

export function OracleEye({ motionEnabled }: OracleEyeProps) {
  const messageId = useId();

  const svgRef = useRef<SVGSVGElement>(null);
  const irisTrackRef = useRef<SVGGElement>(null);

  /**
   * Desired pupil position based on cursor position.
   */
  const targetRef = useRef<Point>({
    ...CENTERED_OFFSET,
  });

  /**
   * Current rendered pupil position.
   */
  const currentRef = useRef<Point>({
    ...CENTERED_OFFSET,
  });

  /**
   * Animation-related values remain in refs so pointer movement
   * does not cause React renders.
   */
  const isHoveredRef = useRef(false);
  const motionEnabledRef = useRef(motionEnabled);

  const rafRef = useRef<number | null>(null);

  /**
   * React state is only used for actual UI changes.
   */
  const [isHovered, setIsHovered] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  /**
   * Apply the pupil position directly to the SVG.
   *
   * This avoids React re-rendering on every animation frame.
   */
  const applyIrisTransform = useCallback((offset: Point) => {
    const iris = irisTrackRef.current;

    if (!iris || !isFinitePoint(offset)) {
      return;
    }

    iris.setAttribute("transform", `translate(${offset.x} ${offset.y})`);
  }, []);

  /**
   * Starts the animation loop if one is not already running.
   *
   * The nested function declaration avoids the React Hooks
   * immutability warning caused by a self-referencing useCallback.
   */
  const scheduleAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      return;
    }

    function tick() {
      rafRef.current = null;

      const trackedTarget = targetRef.current;

      const target =
        isHoveredRef.current || !isFinitePoint(trackedTarget)
          ? CENTERED_OFFSET
          : trackedTarget;

      const current = currentRef.current;

      /**
       * Recover gracefully if invalid values somehow enter the state.
       */
      if (!isFinitePoint(current)) {
        current.x = 0;
        current.y = 0;
      }

      /**
       * Reduced-motion mode:
       * update immediately without easing.
       */
      if (!motionEnabledRef.current) {
        current.x = target.x;
        current.y = target.y;

        applyIrisTransform(current);

        return;
      }

      const dx = target.x - current.x;
      const dy = target.y - current.y;

      /**
       * Stop RAF once close enough to the target.
       *
       * This prevents an animation loop from running continuously
       * while nothing is changing.
       */
      if (
        Math.abs(dx) <= ANIMATION_EPSILON &&
        Math.abs(dy) <= ANIMATION_EPSILON
      ) {
        current.x = target.x;
        current.y = target.y;

        applyIrisTransform(current);

        return;
      }

      current.x += dx * FOLLOW_EASING;
      current.y += dy * FOLLOW_EASING;

      applyIrisTransform(current);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [applyIrisTransform]);

  /**
   * Keep reduced-motion preference synchronized without making
   * the RAF callback depend directly on React state.
   */
  useEffect(() => {
    motionEnabledRef.current = motionEnabled;

    scheduleAnimation();
  }, [motionEnabled, scheduleAnimation]);

  /**
   * Global pointer tracking allows the eye to follow the cursor
   * anywhere on the page.
   */
  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current;

      if (!svg) {
        return;
      }

      const point = clientToSvg(svg, event.clientX, event.clientY);

      if (!point) {
        return;
      }

      targetRef.current = clampPupilOffset(
        point.x - EYE_CENTER.x,
        point.y - EYE_CENTER.y,
      );

      scheduleAnimation();
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [scheduleAnimation]);

  /**
   * Cancel any active animation when this component unmounts.
   */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  function handlePointerEnter() {
    isHoveredRef.current = true;

    setIsHovered(true);

    scheduleAnimation();
  }

  function handlePointerLeave() {
    isHoveredRef.current = false;

    setIsHovered(false);

    scheduleAnimation();
  }

  function handleClick() {
    setShowMessage((open) => !open);
  }

  return (
    <div
      className="oracle-eye-wrap"
      data-message-open={showMessage || undefined}
    >
      <button
        type="button"
        className="oracle-eye-button"
        data-closed={isHovered || undefined}
        aria-label={
          showMessage
            ? "Hide the Oracle's message"
            : "Reveal the Oracle's message"
        }
        aria-expanded={showMessage}
        aria-controls={messageId}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <svg
          ref={svgRef}
          className="oracle-eye"
          viewBox="0 0 220 116"
          fill="none"
          aria-hidden="true"
        >
          <g className="oracle-eye-iris">
            <g ref={irisTrackRef} className="oracle-eye-iris-track">
              <circle cx="110" cy="58" r="25" />

              <circle cx="110" cy="58" r="7" className="oracle-eye-pupil" />
            </g>
          </g>

          <path
            className="oracle-eye-lashes--top"
            d="M110 0v15M35 13l12 18M185 13l-12 18"
          />

          <path d="M110 101v15M35 103l12-18M185 103l-12-18" />

          <path
            className="oracle-eye-outline"
            d="M8 58c27-31 61-47 102-47s75 16 102 47c-27 31-61 47-102 47S35 89 8 58Z"
          />

          <g className="oracle-eye-lid">
            <path
              d="M8 58c27-31 61-47 102-47s75 16 102 47"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
      </button>

      <p
        id={messageId}
        className="oracle-eye-message"
        role="status"
        aria-live="polite"
        aria-hidden={!showMessage}
      >
        {EYE_MESSAGE}
      </p>
    </div>
  );
}
