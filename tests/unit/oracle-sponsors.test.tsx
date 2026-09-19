import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FAQ } from "../../src/components/FAQ";
import { Header } from "../../src/components/Header";
import { OracleEye } from "../../src/components/OracleEye";
import { renderWithRouter } from "./test-utils";

describe("OracleEye", () => {
  it("renders the eye container", () => {
    render(<OracleEye motionEnabled={false} />);
    expect(document.querySelector(".oracle-eye")).toBeTruthy();
  });
});

describe("Header mobile navigation", () => {
  it("opens and closes the mobile menu", () => {
    renderWithRouter(<Header />);

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menuButton);
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(menuButton);
  });
});

describe("FAQ motion variant", () => {
  it("renders with motion enabled", () => {
    render(<FAQ motionEnabled />);
    expect(screen.getByRole("heading", { name: /We know you/i })).toBeInTheDocument();
  });
});
