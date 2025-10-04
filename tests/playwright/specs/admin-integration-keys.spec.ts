import { expect, test } from '@playwright/test';

// Enable with RUN_ADMIN_INTEGRATIONS_E2E=true and provide PLAYWRIGHT_ADMIN_EMAIL
// when a browser-capable environment (Next.js server + Chromium) is available.

const shouldRun = process.env.RUN_ADMIN_INTEGRATIONS_E2E === 'true';
const describeIntegrations = shouldRun ? test.describe : test.describe.skip;
const WAIT = 15_000;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describeIntegrations('Admin integration keys', () => {
  test.beforeEach(async ({ context }) => {
    const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? 'umair.warraich@gmail.com';
    await context.setExtraHTTPHeaders({
      'x-admin-email': adminEmail,
    });
  });

  test('supports creating and deleting an integration key via modals', async ({ page }) => {
    const keyName = `Playwright Key ${Date.now()}`;

    await page.goto('/integrations/keys');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /create key/i }).click();

    const createDialog = page.getByRole('dialog', { name: /create integration key/i });
    await expect(createDialog).toBeVisible();

    await createDialog.getByPlaceholder('e.g. OpenAI Production').fill(keyName);

    await createDialog.getByRole('button', { name: /select provider/i }).click();
    await page.getByRole('option', { name: /^OpenAI$/ }).click();

    await createDialog.getByRole('button', { name: /select environment/i }).click();
    await page.getByRole('option', { name: /^Production$/ }).click();

    await createDialog.getByPlaceholder('Optional context for operators').fill('Generated during Playwright coverage');

    await createDialog.getByRole('button', { name: /^create key$/i }).click();

    await expect(createDialog.getByText(/integration key created successfully/i)).toBeVisible({ timeout: WAIT });
    await expect(createDialog.getByText(/Copy the secret above/i)).toBeVisible();

    await createDialog.getByRole('button', { name: /close/i }).click();
    await expect(createDialog).not.toBeVisible();

    const rowMatcher = new RegExp(escapeRegExp(keyName));
    const keyRow = page.getByRole('row', { name: rowMatcher });
    await expect(keyRow).toBeVisible({ timeout: WAIT });

    await keyRow.getByRole('button', { name: /integration key actions/i }).click();
    await page.getByRole('menuitem', { name: /delete key/i }).click();

    const deleteDialog = page.getByRole('dialog', { name: new RegExp(`delete ${escapeRegExp(keyName)}`, 'i') });
    await expect(deleteDialog).toBeVisible();

    await deleteDialog
      .getByPlaceholder('Explain why this key is being removed (optional)')
      .fill('Cleanup after automated coverage');

    await deleteDialog.getByRole('button', { name: /^delete key$/i }).click();

    await expect(deleteDialog).not.toBeVisible({ timeout: WAIT });
    await expect(page.getByRole('row', { name: rowMatcher })).toHaveCount(0, { timeout: WAIT });
  });
});
