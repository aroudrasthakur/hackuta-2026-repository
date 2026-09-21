import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "../../src/pages/HomePage";
import RegisterRedirect from "../../src/pages/RegisterRedirect";
import { REGISTER_URL } from "../../src/constants/site";

vi.mock("../../src/components/cursor/CustomCursor", () => ({
  default: () => null,
}));

vi.mock("../../src/components/HeroAtmosphere", () => ({
  HeroAtmosphere: () => null,
}));

vi.mock("../../src/components/HeroWaves", () => ({
  HeroWaves: () => null,
}));

describe("HomePage", () => {
  it("handles hash navigation callbacks", async () => {
    const about = document.createElement("section");
    about.id = "about";
    document.body.appendChild(about);
    window.location.hash = "#about";

    render(<HomePage />);

    fireEvent(window, new HashChangeEvent("hashchange"));
    window.location.hash = "";
    document.body.removeChild(about);
  });
});

describe("RegisterRedirect", () => {
  it("sends visitors to the registration site and offers a manual link", () => {
    const replace = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace,
    } as unknown as Location);

    render(<RegisterRedirect />);

    expect(replace).toHaveBeenCalledWith(REGISTER_URL);
    expect(screen.getByRole("link", { name: /Continue to/ })).toHaveAttribute(
      "href",
      REGISTER_URL,
    );
  });
});
