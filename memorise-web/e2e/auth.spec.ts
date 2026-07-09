/**
 * U1 auth end-to-end happy paths (TST-1..3). Authored in Code Generation; the Playwright runner,
 * dependency (@playwright/test), and a seeded local Supabase are wired up and EXECUTED in the
 * Build & Test stage. Kept out of the Vitest/tsc/eslint gates until then.
 *
 * Assumes the web app runs at baseURL and a local Supabase is available. Uses a per-run unique
 * email so reruns don't collide.
 */
import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e+${Date.now()}@example.com`;
}
const PASSWORD = "e2e-passw0rd";

test("signup signs the user in and lands on the authenticated placeholder", async ({ page }) => {
  await page.goto("/signup");
  await page.getByTestId("signup-email-input").fill(uniqueEmail());
  await page.getByTestId("signup-password-input").fill(PASSWORD);
  await page.getByTestId("signup-submit-button").click();
  await expect(page.getByTestId("authed-placeholder-title")).toBeVisible();
});

test("unauthenticated access to a protected route redirects to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("login then logout returns to /login", async ({ page }) => {
  const email = uniqueEmail();
  // Arrange: create the account (also signs in).
  await page.goto("/signup");
  await page.getByTestId("signup-email-input").fill(email);
  await page.getByTestId("signup-password-input").fill(PASSWORD);
  await page.getByTestId("signup-submit-button").click();
  await expect(page.getByTestId("authed-placeholder-title")).toBeVisible();

  // Act: log out.
  await page.getByTestId("logout-button").click();
  await expect(page).toHaveURL(/\/login/);

  // Act: log back in.
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-password-input").fill(PASSWORD);
  await page.getByTestId("login-submit-button").click();
  await expect(page.getByTestId("authed-placeholder-title")).toBeVisible();
});
