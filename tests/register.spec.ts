import { test, expect } from "./playwright-coverage";

test.describe("registration", () => {
  test("loads the application form at /register", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit application" })).toBeVisible();
    await expect(page.locator("main.register-page")).toBeVisible();
  });

  test("shows field errors on empty submit and stays on the form", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.getByText("First name is required.")).toBeVisible();
    await expect(
      page.getByText("One or more of your answers is invalid. Please review the fields below."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "You're on the list!" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();
  });

  test("marks invalid fields with aria-invalid", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.locator("#firstName")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#firstName-error")).toContainText("First name is required.");
  });
});
