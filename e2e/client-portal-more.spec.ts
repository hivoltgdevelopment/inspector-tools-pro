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
  });
});

