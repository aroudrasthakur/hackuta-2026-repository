import { afterEach, describe, expect, it, vi } from "vitest";
import { contentSecurityPolicy } from "../../security/csp";
import { clamp01 } from "../../src/utils/clamp";
import { scrollToSection } from "../../src/utils/scrollToSection";

describe("clamp01", () => {
  it("clamps values between 0 and 1", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(2)).toBe(1);
  });
});

describe("scrollToSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("returns false when the section is missing", () => {
    expect(scrollToSection("missing")).toBe(false);
  });

  it("scrolls immediately when reduced motion is preferred", () => {
    const target = document.createElement("section");
    target.id = "about";
    document.body.appendChild(target);

    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList);

    const scrollSpy = vi.spyOn(window, "scrollTo");
    const pushStateSpy = vi.spyOn(history, "pushState");

    expect(scrollToSection("about")).toBe(true);
    expect(scrollSpy).toHaveBeenCalled();
    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#about");
  });

  it("runs the smooth-scroll settle callback", () => {
    const target = document.createElement("section");
    target.id = "faq";
    document.body.appendChild(target);
    target.getBoundingClientRect = () =>
      ({
        top: 0.75,
        left: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
      }) as DOMRect;

    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList);

    scrollToSection("faq");
    window.dispatchEvent(new Event("scrollend"));

    expect(history.state).toBeNull();
  });

  it("registers scroll listeners for smooth scrolling", () => {
    const target = document.createElement("section");
    target.id = "schedule";
    document.body.appendChild(target);

    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList);

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    expect(scrollToSection("schedule")).toBe(true);
    expect(addEventListenerSpy).toHaveBeenCalledWith("scrollend", expect.any(Function), expect.any(Object));
  });
});

describe("contentSecurityPolicy", () => {
  it("includes the core directives", () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("script-src 'self'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("upgrade-insecure-requests");
  });
});
