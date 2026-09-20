import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "../../src/pages/HomePage";
import { renderWithRouter } from "./test-utils";

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

    renderWithRouter(<HomePage />);

    fireEvent(window, new HashChangeEvent("hashchange"));
    window.location.hash = "";
    document.body.removeChild(about);
  });
});

describe("RegisterPage", () => {
  it("renders the application step by default", async () => {
    const RegisterPage = (await import("../../src/pages/Register/RegisterPage")).default;
    renderWithRouter(<RegisterPage />, "/register");

    expect(screen.getByRole("heading", { name: "Tell us about yourself" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "HackUTA home" })).toHaveAttribute("href", "/");
  });
});
