import { test, expect } from '@playwright/test';

test.describe('Static routes', () => {
  test('Not Authorized screen renders with actions', async ({ page }) => {
    await page.goto('/not-authorized');
    await expect(page.getByTestId('notauth-container')).toBeVisible();
    await expect(page.getByTestId('notauth-heading')).toHaveText('Not Authorized');
    await expect(page.getByTestId('notauth-portal-link')).toBeVisible();
    await expect(page.getByTestId('notauth-signout')).toBeVisible();
  });

  test('Payment result screens (success and cancel)', async ({ page }) => {
    await page.goto('/payment/success');
    await expect(page.getByTestId('payment-container')).toBeVisible();
    await expect(page.getByTestId('payment-heading')).toHaveText('Payment Successful');

    await page.goto('/payment/cancel');
    await expect(page.getByTestId('payment-heading')).toHaveText('Payment Canceled');
  });
});

