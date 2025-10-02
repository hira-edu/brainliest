import { test, expect } from '@playwright/test';

const base = '/demo';

const expectHeadingVisible = async (page: any, text: string) => {
  await expect(page.getByRole('heading', { level: 1, name: text })).toBeVisible();
};

test.describe('Composite demos', () => {
  test('modal demo opens and closes', async ({ page }) => {
    await page.goto(`${base}/composites/modal`);
    await expectHeadingVisible(page, 'Modal');

    await page.getByRole('button', { name: 'Invite teammates' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('dialog demo supports confirmation flow', async ({ page }) => {
    await page.goto(`${base}/composites/dialog`);
    await expectHeadingVisible(page, 'Dialog');

    await page.getByRole('button', { name: 'Archive session' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('dropdown demo reveals menu items', async ({ page }) => {
    await page.goto(`${base}/composites/dropdown`);
    await expectHeadingVisible(page, 'Dropdown');

    await page.getByRole('button', { name: 'Workspace actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Invite teammates' })).toBeVisible();
  });

  test('pagination demo advances page summary', async ({ page }) => {
    await page.goto(`${base}/composites/pagination`);
    await expectHeadingVisible(page, 'Pagination');

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Showing page 2 of 18.')).toBeVisible();
  });

  test('searchable select filters options', async ({ page }) => {
    await page.goto(`${base}/composites/searchable-select`);
    await expectHeadingVisible(page, 'Searchable Select');

    await page.getByRole('button', { name: /Search options/i }).click();
    await page.getByRole('combobox', { name: /Search options/i }).fill('Security');
    await page.getByRole('option', { name: 'Security+' }).click();
    await expect(page.getByText('Selected: security+')).toBeVisible();
  });

  test('command palette executes command', async ({ page }) => {
    await page.goto(`${base}/composites/command-palette`);
    await expectHeadingVisible(page, 'Command Palette');

    await page.getByRole('button', { name: 'Open command palette' }).click();
    await page.getByPlaceholder('Search commands').fill('analytics');
    await page.getByRole('option', { name: 'View analytics' }).click();
    await expect(page.getByText('Executed: View analytics')).toBeVisible();
  });

  test('tabs demo switches panels', async ({ page }) => {
    await page.goto(`${base}/composites/tabs`);
    await expectHeadingVisible(page, 'Tabs');

    await page.getByRole('tab', { name: 'Practice' }).click();
    await expect(page.getByText('Active practice sets with remaining questions and due dates.')).toBeVisible();

    await page.getByRole('tab', { name: 'Analytics' }).click();
    await expect(page.getByText('Performance charts, weak topics, and recommended next steps.')).toBeVisible();
  });

  test('accordion demo reveals answer', async ({ page }) => {
    await page.goto(`${base}/composites/accordion`);
    await expectHeadingVisible(page, 'Accordion');

    const trigger = page.getByRole('button', { name: 'How are exam questions sourced?' });
    const answer = page.getByText(/We curate official practice items/);

    // Default accordion state keeps the first panel expanded. Toggle closed then open to validate interaction.
    await trigger.click();
    await trigger.click();
    await expect(answer).toBeVisible();
  });

  test('popover demo displays contextual content', async ({ page }) => {
    await page.goto(`${base}/composites/popover`);
    await expectHeadingVisible(page, 'Popover');

    await page.getByRole('button', { name: 'View assignment' }).click();
    await expect(page.getByText('Data Structures Quiz')).toBeVisible();
  });

  test('tooltip demo shows hover text', async ({ page }) => {
    await page.goto(`${base}/composites/tooltip`);
    await expectHeadingVisible(page, 'Tooltip');

    await page.getByRole('button', { name: 'Top tooltip' }).hover();
    await expect(page.getByRole('tooltip')).toContainText('Generate AI explanation');
  });

  test('toast demo emits notification', async ({ page }) => {
    await page.goto(`${base}/feedback/toast`);
    await expectHeadingVisible(page, 'Toast');

    await page.getByRole('button', { name: 'Trigger toast' }).click();
    await expect(page.getByRole('status')).toContainText('Settings updated');
  });
});
