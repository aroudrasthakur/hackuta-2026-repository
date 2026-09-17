import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "../../src/hooks/useCountdown";
import { useMotionPreference } from "../../src/hooks/useMotionPreference";

describe("useMotionPreference", () => {
  afterEach(() => {
    delete document.documentElement.dataset.motion;
  });

  it("reflects the current reduced-motion preference", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList);

    const { result } = renderHook(() => useMotionPreference());

    expect(result.current.motionEnabled).toBe(false);
    expect(document.documentElement.dataset.motion).toBe("off");
  });

  it("updates when the media query changes", () => {
    let listener: (() => void) | undefined;
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn((_event, callback) => {
        listener = callback as () => void;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList);

    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.motionEnabled).toBe(true);

    act(() => listener?.());
    expect(result.current.motionEnabled).toBe(true);
  });
});

describe("useCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down toward the target date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00-06:00"));

    const { result } = renderHook(() => useCountdown(new Date("2026-11-14T00:00:00-06:00")));

    expect(result.current.done).toBe(false);
    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBeTypeOf("number");
  });

  it("marks the countdown as done after the target passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-15T12:00:00-06:00"));

    const { result } = renderHook(() => useCountdown(new Date("2026-11-14T00:00:00-06:00")));

    expect(result.current.done).toBe(true);
    expect(result.current.days).toBe(0);
  });
});
