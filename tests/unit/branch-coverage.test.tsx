import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { About } from "../../src/components/About";
import { Footer } from "../../src/components/Footer";
import { Schedule } from "../../src/components/Schedule";
import { Sponsors } from "../../src/components/Sponsors";
import { OracleEye } from "../../src/components/OracleEye";

vi.mock("../../src/constants/sponsors", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/constants/sponsors")>();
  return {
    ...actual,
    sponsors: [
      {
        name: "Acme Labs",
        image: "/images/acme.webp",
        tier: "gold" as const,
        link: "https://example.com/acme",
      },
    ],
  };
});

describe("Sponsors roster", () => {
  it("renders confirmed sponsor badges", () => {
    render(<Sponsors />);
    expect(screen.getByRole("link", { name: "Acme Labs" })).toHaveAttribute(
      "href",
      "https://example.com/acme",
    );
    expect(document.querySelector(".sponsor-tier--gold")).toBeTruthy();
  });
});

describe("Schedule keyboard shortcuts", () => {
  it("jumps to the first and last tabs", () => {
    render(<Schedule />);

    const dayOne = screen.getByRole("tab", { name: /Saturday, November 14/i });
    fireEvent.keyDown(dayOne, { key: "End" });
    expect(screen.getByRole("tab", { name: /Sunday, November 15/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: /Sunday, November 15/i }), {
      key: "Home",
    });
    expect(dayOne).toHaveAttribute("aria-selected", "true");
  });
});

describe("Footer navigation", () => {
  it("prevents default when in-page navigation succeeds", async () => {
    const user = userEvent.setup();
    const about = document.createElement("section");
    about.id = "about";
    document.body.appendChild(about);

    render(<Footer motionEnabled />);
    await user.click(screen.getByRole("link", { name: "Apply" }));

    expect(window.scrollTo).toHaveBeenCalled();
    document.body.removeChild(about);
  });
});

describe("About section", () => {
  it("renders the call-to-action content", () => {
    render(<About />);
    expect(screen.getByRole("link", { name: "Join Discord" })).toBeInTheDocument();
  });

});

describe("OracleEye motion", () => {
  it("renders with motion enabled", () => {
    render(<OracleEye motionEnabled />);
    expect(document.querySelector(".oracle-eye")).toBeTruthy();
  });
});
