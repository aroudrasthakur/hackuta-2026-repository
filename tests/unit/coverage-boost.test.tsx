import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as registerConstants from "../../src/pages/Register/constants";
import RegisterPage from "../../src/pages/Register/RegisterPage";
import { renderWithRouter } from "./test-utils";

vi.mock("../../src/pages/Register/registerApi", () => ({
  submitRegistration: vi.fn(),
}));

describe("register constants re-export", () => {
  it("re-exports shared registration constants", () => {
    expect(registerConstants.GENDERS.length).toBeGreaterThan(0);
    expect(registerConstants.MLH_CODE_OF_CONDUCT_URL).toContain("mlh.io");
  });
});

describe("RegisterPage success step", () => {
  it("shows the success state after a valid submission", async () => {
    const user = userEvent.setup();
    const { submitRegistration } = await import("../../src/pages/Register/registerApi");
    vi.mocked(submitRegistration).mockResolvedValue({ ok: true });

    renderWithRouter(<RegisterPage />, "/register");

    await user.type(screen.getByLabelText(/First name/), "Sam");
    await user.type(screen.getByLabelText(/Last name/), "Test");
    await user.type(screen.getByLabelText(/Phone number/), "5551234567");
    await user.type(screen.getByLabelText(/Age/i), "20");
    await user.type(screen.getByLabelText(/School \/ university/), "UT Arlington");
    await user.selectOptions(screen.getByLabelText(/Level of study/), "Undergraduate - Junior");
    await user.type(screen.getByLabelText(/Major \/ field of study/), "Computer Science");
    await user.type(screen.getByLabelText(/Expected graduation year/), "2026");
    await user.selectOptions(screen.getByLabelText(/^Gender/), "Male");
    await user.selectOptions(screen.getByLabelText(/T-shirt size/), "M");
    await user.click(screen.getByLabelText(/^Yes$/));
    await user.selectOptions(screen.getByLabelText(/How did you hear about HackUTA/), "Discord");
    await user.type(screen.getByLabelText(/Emergency contact name/), "Jane Test");
    await user.type(screen.getByLabelText(/Emergency contact phone/), "5559876543");
    await user.click(screen.getByLabelText(/MLH Code of Conduct/));
    await user.click(screen.getByLabelText(/authorize HackUTA to share my registration information/));
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "You're on the list!" })).toBeInTheDocument();
    });
  });
});
