import { test, expect } from '@playwright/test';

test.describe('Payment checkout (fake mode)', () => {
  test('navigates to success page when function returns url', async ({ page }) => {
    // Intercept the create-payment-session function to return a local success URL
    await page.route('**/functions/v1/create-payment-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/payment/success?mock=1' }),
      });
    });

    // Ensure at least one report renders regardless of auth/backend
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'r1', title: 'Report A' }]),
      });
    });

    // Ensure payments are enabled at first render and use demo reports
    await page.addInitScript(() => {
      localStorage.setItem('payments_enabled', 'true');
    });
    await page.goto('/portal?payments=true&demo=1');
    await page.getByText('Report A').waitFor({ state: 'visible', timeout: 20000 });
    await page.getByText('Pay invoice').first().click();

    await expect(page).toHaveURL(/\/payment\/success\?mock=1/);
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
