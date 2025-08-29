import { test, expect } from '@playwright/test';

test.describe('Payment checkout (fake mode)', () => {
  test('navigates to success page when function returns url', async ({ page }) => {
    // Use demo mode to show placeholder reports and force payments UI
    // Intercept the create-payment-session function to return a local success URL
    await page.route('**/functions/v1/create-payment-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/payment/success?mock=1' }),
      });
    });

    await page.goto('/portal?payments=true&demo=1');
    await page.getByText('Pay invoice').first().click();

    await expect(page).toHaveURL(/\/payment\/success\?mock=1/);
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});

