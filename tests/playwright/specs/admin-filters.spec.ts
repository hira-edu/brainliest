import { expect, test } from '@playwright/test';

// Enable with RUN_ADMIN_FILTER_E2E=true and provide PLAYWRIGHT_ADMIN_EMAIL once
// the admin app can run alongside Chromium in CI/local environments.

const shouldRun = process.env.RUN_ADMIN_FILTER_E2E === 'true';
const describeAdmin = shouldRun ? test.describe : test.describe.skip;
const WAIT = 15_000;

describeAdmin('Admin filters', () => {
  test.beforeEach(async ({ context }) => {
    const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? 'umair.warraich@gmail.com';
    await context.setExtraHTTPHeaders({
      'x-admin-email': adminEmail,
    });
  });

  test('admin users filters update query string', async ({ page }) => {
    await page.goto('/users/admins');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: /search administrators/i }).fill('alice@example.com');
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page).toHaveURL(/search=alice%40example.com/);

    await page.getByRole('button', { name: /filter by role/i }).click();
    await page.getByRole('option', { name: /^Admin$/ }).click();
    await expect(page).toHaveURL(/role=ADMIN/);

    await page.getByRole('button', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /^Suspended$/ }).click();
    await expect(page).toHaveURL(/status=suspended/);
  });

  test('student filters capture subscription tier', async ({ page }) => {
    await page.goto('/users/students');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /^Active$/ }).click();
    await expect(page).toHaveURL(/status=active/);

    await page.getByRole('button', { name: /filter by subscription tier/i }).click();
    await page.getByRole('option', { name: /^Premium$/ }).click();
    await expect(page).toHaveURL(/subscription=premium/);
  });

  test('integration filters reflect environment and type', async ({ page }) => {
    await page.goto('/integrations/keys');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /filter by environment/i }).click();
    await page.getByRole('option', { name: /^Production$/ }).click();
    await expect(page).toHaveURL(/environment=production/);

    await page.getByRole('button', { name: /filter by integration type/i }).click();
    await page.getByRole('option', { name: /^Stripe$/ }).click();
    await expect(page).toHaveURL(/type=STRIPE/);
  });

  test('subject taxonomy filters cascade correctly', async ({ page }) => {
    await page.goto('/taxonomy/subjects');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /filter by difficulty/i }).click();
    await page.getByRole('option', { name: /^Expert$/ }).click();
    await expect(page).toHaveURL(/difficulty=EXPERT/);

    await page.getByRole('button', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /^Active$/ }).click();
    await expect(page).toHaveURL(/status=active/);
  });
});
