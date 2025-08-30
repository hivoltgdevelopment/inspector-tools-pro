import { test, expect } from '@playwright/test';

test.describe('Static routes', () => {
  test('Not Authorized screen renders with actions', async ({ page }) => {
    await page.goto('/not-authorized');
    await expect(page.getByTestId('notauth-container')).toBeVisible();
    await expect(page.getByTestId('notauth-heading')).toHaveText('Not Authorized');
    await expect(page.getByTestId('notauth-portal-link')).toBeVisible();
    await expect(page.getByTestId('notauth-signout')).toBeVisible();

    // Navigate to client portal via link
    await page.getByTestId('notauth-portal-link').click();
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByTestId('portal-heading')).toBeVisible();
  });

  test('Payment result screens (success and cancel)', async ({ page }) => {
    await page.goto('/payment/success');
    await expect(page.getByTestId('payment-container')).toBeVisible();
    await expect(page.getByTestId('payment-heading')).toHaveText('Payment Successful');
    await expect(page.getByTestId('payment-back-home')).toBeVisible();
    await expect(page.getByTestId('payment-portal-link')).toBeVisible();

    // Back home navigates to root
    await page.getByTestId('payment-back-home').click();
    await expect(page).toHaveURL(/\/$/);
    // Go to cancel page and click portal link
    await page.goto('/payment/cancel');
    
    await expect(page.getByTestId('payment-heading')).toHaveText('Payment Canceled');
    await expect(page.getByTestId('payment-back-home')).toBeVisible();
    await expect(page.getByTestId('payment-portal-link')).toBeVisible();

    await page.getByTestId('payment-portal-link').click();
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByTestId('portal-heading')).toBeVisible();
  });
});
