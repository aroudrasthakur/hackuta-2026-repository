import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { About } from "../../src/components/About";
import { HeroCountdown } from "../../src/components/Countdown";
import { FAQ } from "../../src/components/FAQ";
import { Footer } from "../../src/components/Footer";
import { Header } from "../../src/components/Header";
import { Hero } from "../../src/components/Hero";
import { OdysseyButton } from "../../src/components/OdysseyButton";
import { Schedule } from "../../src/components/Schedule";
import { Sponsors } from "../../src/components/Sponsors";
import { REGISTER_URL } from "../../src/constants/site";
import { CoastCliff } from "../../src/components/art/CoastCliff";
import { HeatWaveDefs } from "../../src/components/art/HeatWave";
import { Logo } from "../../src/components/art/Logo";
import { OliveBranch } from "../../src/components/art/OliveBranch";
import { Ship } from "../../src/components/art/Ship";
import { ThemeArt } from "../../src/components/art/ThemeArt";
import { renderWithRouter } from "./test-utils";

vi.mock("../../src/components/HeroAtmosphere", () => ({
  HeroAtmosphere: () => <div data-testid="hero-atmosphere" />,
}));

vi.mock("../../src/components/HeroWaves", () => ({
  HeroWaves: () => <div data-testid="hero-waves" />,
}));

vi.mock("../../src/components/OracleEye", () => ({
  OracleEye: () => <div data-testid="oracle-eye" />,
}));

describe("OdysseyButton", () => {
  it("renders external, internal, hash, and disabled variants", () => {
    const { rerender } = renderWithRouter(
      <OdysseyButton href="https://example.com">External</OdysseyButton>,
    );
    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute("href", "https://example.com");

    rerender(<OdysseyButton href="/sponsors">Sponsors</OdysseyButton>);
    expect(screen.getByRole("link", { name: "Sponsors" })).toHaveAttribute("href", "/sponsors");

    rerender(<OdysseyButton href="#about">About</OdysseyButton>);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");

    rerender(
      <OdysseyButton href="/sponsors" inactive>
        Disabled link
      </OdysseyButton>,
    );
    expect(screen.getByRole("button", { name: "Disabled link" })).toBeDisabled();
  });

  it("renders submit buttons", () => {
    render(<OdysseyButton type="submit">Submit</OdysseyButton>);
    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute("type", "submit");
  });
});

describe("art components", () => {
  it("renders decorative assets", () => {
    const { container: heatWaveContainer } = render(<HeatWaveDefs />);
    expect(heatWaveContainer.querySelector("svg")).toBeTruthy();

    const { container: themeContainer } = render(<ThemeArt name="cave" className="extra" />);
    expect(themeContainer.querySelector(".theme-art-cave")).toBeTruthy();

    const { container: logoContainer } = render(<Logo variant="dark" layout="footer" decorative />);
    expect(logoContainer.querySelector("img[aria-hidden='true']")).toBeTruthy();

    render(<Ship tone="clay" rowing={false} />);
    expect(document.querySelector('[data-rowing="false"]')).toBeTruthy();

    const { container: coastContainer } = render(<CoastCliff priority />);
    expect(coastContainer.querySelector("img")).toHaveAttribute("loading", "eager");

    render(<OliveBranch className="branch" />);
    expect(document.querySelector(".branch")).toBeTruthy();
  });
});

describe("HeroCountdown", () => {
  it("renders active and completed countdown states", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00-06:00"));
    const { unmount } = render(<HeroCountdown />);
    expect(screen.getByRole("timer")).toBeInTheDocument();

    unmount();
    vi.setSystemTime(new Date("2026-11-15T12:00:00-06:00"));
    render(<HeroCountdown />);
    expect(screen.getByText("We've set sail")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("Hero", () => {
  it("renders the hero heading", () => {
    render(<Hero motionEnabled={false} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("HackUTA");
  });

  it("links Apply to the registration site", () => {
    render(<Hero motionEnabled={false} />);
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", REGISTER_URL);
  });
});

describe("About", () => {
  it("renders perks and the Discord link", () => {
    render(<About />);
    expect(
      screen.getByRole("heading", { name: "Are you ready to begin your odyssey?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join Discord" }).getAttribute("href")).toContain("discord.gg");
  });
});

describe("Schedule", () => {
  it("switches tabs and supports keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<Schedule />);

    const dayOne = screen.getByRole("tab", { name: /Saturday, November 14/i });
    const dayTwo = screen.getByRole("tab", { name: /Sunday, November 15/i });

    await user.click(dayTwo);
    expect(dayTwo).toHaveAttribute("aria-selected", "true");

    await user.click(dayOne);
    fireEvent.keyDown(dayOne, { key: "ArrowRight" });
    expect(dayTwo).toHaveAttribute("aria-selected", "true");
  });
});

describe("FAQ", () => {
  it("expands answers and renders contact copy", () => {
    render(<FAQ motionEnabled={false} />);

    const question = screen.getByText("What if I've never been to a hackathon?", { exact: true });
    fireEvent.click(question);
    expect(screen.getByText(/No experience required/)).toBeVisible();
    expect(screen.getAllByRole("link", { name: "hello@hackuta.org" })[0]).toHaveAttribute(
      "href",
      "mailto:hello@hackuta.org",
    );
  });
});

describe("Sponsors", () => {
  it("renders the empty roster state", () => {
    render(<Sponsors />);
    expect(screen.getByText("Sponsors announced soon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Become a sponsor" }).getAttribute("href")).toContain(
      "mailto:sponsor@hackuta.org",
    );
  });
});

describe("Header and Footer", () => {
  it("renders primary navigation and footer links", () => {
    renderWithRouter(<Header />);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");

    render(<Footer motionEnabled={false} />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/hackuta",
    );
  });
});
