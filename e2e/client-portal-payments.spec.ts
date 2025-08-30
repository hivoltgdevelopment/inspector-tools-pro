import { test, expect } from '@playwright/test';

test.describe('Client Portal payments toggle (dev override)', () => {
  test('shows/hides Pay invoice via query param override', async ({ page }) => {
    // Intercept auth user and reports
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1' }),
      });
    });
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'r1', title: 'Report A' }]),
      });
    });

    // Provide a client id via query param to bypass auth in dev
    await page.goto('/portal?payments=true&client=test');
    await expect(page.getByRole('heading', { name: 'My Reports' })).toBeVisible();
    await expect(page.getByText('Pay invoice')).toBeVisible();

    await page.goto('/portal?payments=false&client=test');
    await expect(page.getByText('Report A')).toBeVisible();
    await expect(page.getByText('Pay invoice')).toHaveCount(0);
  });
});
