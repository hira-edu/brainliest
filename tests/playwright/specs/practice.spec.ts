import { test, expect } from '@playwright/test';

const WAIT_FOR_EXPLANATION = 5000;

test.describe('Practice page', () => {
  test('renders session layout and generates AI explanation', async ({ page }) => {
    await page.goto('/practice/a-level-math');

    await expect(page.getByRole('heading', { name: 'A-Level Mathematics Mock Paper' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Session overview/i })).toBeVisible();

    await page.getByRole('radio', { name: 'A' }).click();
    await page.getByRole('button', { name: 'Generate explanation' }).click();

    const explanationCard = page.getByRole('heading', { name: 'AI explanation' });
    await expect(explanationCard).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
    await expect(page.getByText(/Great job/)).toBeVisible({ timeout: WAIT_FOR_EXPLANATION });
  });
});
