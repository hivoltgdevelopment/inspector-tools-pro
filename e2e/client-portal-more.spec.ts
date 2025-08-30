import { test, expect } from '@playwright/test';

test.describe('Client Portal extended flows', () => {
  test('shows error when reports fetch fails', async ({ page }) => {
    // Ensure fetch path triggers via client query param
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) });
    });
    await page.goto('/portal?client=test');
    await expect(page.getByTestId('portal-error')).toBeVisible();
  });

  test('search filters down to zero items (demo mode)', async ({ page }) => {
    // Use demo mode to bypass network and seed 2 demo reports
    await page.goto('/portal?demo=1');
    await expect(page.getByTestId('portal-heading')).toBeVisible();
    await page.getByTestId('portal-search').fill('zzzzzz');
    await expect(page.locator('[data-testid="portal-list"] li')).toHaveCount(0);
    await expect(page.getByTestId('portal-empty')).toBeVisible();
  });

  test('lists reports via REST and filters (success path)', async ({ page }) => {
    // Intercept with 2 reports
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'r1', title: 'Roof Report' },
          { id: 'r2', title: 'Basement Report' },
        ]),
      });
    });
    await page.goto('/portal?client=test');
    await expect(page.getByTestId('portal-heading')).toBeVisible();
    await expect(page.getByTestId('report-item-r1')).toBeVisible();
    await expect(page.getByTestId('report-item-r2')).toBeVisible();

    await page.getByTestId('portal-search').fill('base');
    await expect(page.getByTestId('report-item-r1')).toHaveCount(0);
    await expect(page.getByTestId('report-item-r2')).toBeVisible();
  });

  test('empty REST response shows empty state', async ({ page }) => {
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.goto('/portal?client=test');
    await expect(page.getByTestId('portal-heading')).toBeVisible();
    await expect(page.locator('[data-testid="portal-list"] li')).toHaveCount(0);
    await expect(page.getByTestId('portal-empty')).toBeVisible();
  });

  test('query param overrides localStorage (true wins over false)', async ({ page }) => {
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'r1', title: 'A' }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('payments_enabled', 'false');
    });
    await page.goto('/portal?payments=true&client=test');
    await expect(page.getByTestId('report-item-r1').getByTestId('pay-button')).toBeVisible();
  });

  test('query param overrides localStorage (false wins over true)', async ({ page }) => {
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'r1', title: 'A' }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('payments_enabled', 'true');
    });
    await page.goto('/portal?payments=false&client=test');
    await expect(page.getByTestId('pay-button')).toHaveCount(0);
  });
});
