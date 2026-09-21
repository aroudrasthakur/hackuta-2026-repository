import { test, expect } from "./playwright-coverage";

test.describe("404 page", () => {
  test("shows the lost-page content for unknown routes", async ({ page }) => {
    await page.goto("/this-shore-is-not-on-the-map");

    await expect(page).toHaveTitle("404 · HackUTA 2026");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
    await expect(page.getByText("Off course")).toBeVisible();
    await expect(page.getByText("This shore is not on the map.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  });

  test("reveals illustration art after assets finish loading", async ({ page }) => {
    await page.goto("/missing-route");

    const lostPage = page.locator(".lost-page");
    await expect(lostPage).toHaveAttribute("data-art-ready", "true", { timeout: 10_000 });
    await expect(lostPage.locator(".lost-art-on-dark")).toHaveCount(4);

    for (const name of ["ground", "trees-left", "giant", "trees-right"]) {
      await expect(page.locator(`img.lost-art-on-dark[src="/images/${name}.webp"]`)).toBeVisible();
    }
  });

  test("handles client-side navigation to unknown routes", async ({ page }) => {
    await page.goto("/");
    await page.goto("/another-unknown-route");

    await expect(page).toHaveTitle("404 · HackUTA 2026");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
  });

  test("return home link navigates back to the landing page", async ({ page }) => {
    await page.goto("/nowhere");

    await page.getByRole("link", { name: "Return home" }).click();

    await expect(page).toHaveURL("/");
    // The hero title types itself in, so assert the stable accessible name.
    await expect(page.getByRole("heading", { level: 1, name: "HackUTA 26" })).toBeVisible();
  });
});
