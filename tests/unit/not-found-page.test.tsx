import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import NotFoundPage from "../../src/pages/NotFoundPage";

const ART_NAMES = ["ground", "trees-left", "giant", "trees-right"];

const nativeComplete = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  "complete",
);

/**
 * happy-dom never fetches images, so `complete` is true from the start. Pin it
 * so tests can choose between the cached-image path and the load-event path.
 */
function stubImageComplete(value: boolean) {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => value,
  });
}

function darkArt(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLImageElement>("img.lost-art-on-dark"));
}

function preloadHrefs() {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]'),
  ).map((link) => link.getAttribute("href"));
}

describe("NotFoundPage", () => {
  beforeEach(() => {
    stubImageComplete(false);
  });

  afterEach(() => {
    if (nativeComplete) {
      Object.defineProperty(HTMLImageElement.prototype, "complete", nativeComplete);
    }
    document.title = "";
  });

  it("renders the lost-shore copy and a home link", () => {
    const { container, getByRole, getByText } = render(<NotFoundPage />);

    expect(getByRole("heading", { level: 1 })).toHaveTextContent("404");
    expect(getByText("Off course")).toBeInTheDocument();
    expect(getByText("This shore is not on the map.")).toBeInTheDocument();
    expect(getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
    expect(darkArt(container)).toHaveLength(ART_NAMES.length);
  });

  it("sets the document title while mounted and restores it on unmount", () => {
    document.title = "HackUTA 2026";

    const { unmount } = render(<NotFoundPage />);
    expect(document.title).toBe("404 · HackUTA 2026");

    unmount();
    expect(document.title).toBe("HackUTA 2026");
  });

  it("preloads the illustration art and cleans the links up on unmount", () => {
    const { unmount } = render(<NotFoundPage />);

    expect(preloadHrefs()).toEqual(ART_NAMES.map((name) => `/images/${name}.webp`));

    unmount();
    expect(preloadHrefs()).toEqual([]);
  });

  it("keeps art hidden until every illustration settles", () => {
    const { container } = render(<NotFoundPage />);
    const page = container.querySelector(".lost-page");
    const images = darkArt(container);

    expect(page).toHaveAttribute("data-art-ready", "false");

    images.slice(0, -1).forEach((image) => fireEvent.load(image));
    expect(page).toHaveAttribute("data-art-ready", "false");

    fireEvent.error(images[images.length - 1]!);
    expect(page).toHaveAttribute("data-art-ready", "true");
  });

  it("counts each illustration once even if it fires load repeatedly", () => {
    const { container } = render(<NotFoundPage />);
    const page = container.querySelector(".lost-page");
    const [first] = darkArt(container);

    fireEvent.load(first!);
    fireEvent.load(first!);
    fireEvent.load(first!);
    fireEvent.load(first!);

    expect(page).toHaveAttribute("data-art-ready", "false");
  });

  it("reveals art immediately when the images are already cached", () => {
    stubImageComplete(true);

    const { container } = render(<NotFoundPage />);

    expect(container.querySelector(".lost-page")).toHaveAttribute("data-art-ready", "true");
  });
});
