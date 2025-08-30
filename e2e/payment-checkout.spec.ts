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
    await page.getByRole('heading', { name: 'My Reports' }).waitFor();
    await page.getByRole('button', { name: 'Pay invoice' }).first().click();

    await expect(page).toHaveURL(/\/payment\/success\?mock=1/);
    await expect(page.getByText(/success/i)).toBeVisible();
  });

  test('shows toast error when session creation fails', async ({ page }) => {
    await page.route('**/functions/v1/create-payment-session', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) });
    });
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'r1', title: 'Report A' }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('payments_enabled', 'true');
    });
    await page.goto('/portal?payments=true&demo=1');
    await page.getByRole('heading', { name: 'My Reports' }).waitFor();
    await page.getByRole('button', { name: 'Pay invoice' }).first().click();
    await expect(page.getByText('Failed to initiate checkout. Please try again later.')).toBeVisible();
  });

  test('hides pay button when payments disabled', async ({ page }) => {
    await page.route('**/rest/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'r1', title: 'Report A' }]) });
    });
    // Explicitly disable
    await page.addInitScript(() => {
      localStorage.setItem('payments_enabled', 'false');
    });
    await page.goto('/portal?payments=false&demo=1');
    await page.getByRole('heading', { name: 'My Reports' }).waitFor();
    await expect(page.getByTestId('pay-button')).toHaveCount(0);
  });

  test('shows pay button per report when payments enabled', async ({ page }) => {
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
    await page.addInitScript(() => {
      localStorage.setItem('payments_enabled', 'true');
    });
    await page.goto('/portal?payments=true');
    await page.getByTestId('portal-heading').waitFor();
    // Each report item has its own pay-button
    await expect(page.getByTestId('report-item-r1').getByTestId('pay-button')).toBeVisible();
    await expect(page.getByTestId('report-item-r2').getByTestId('pay-button')).toBeVisible();
    // Total count equals number of items
    await expect(page.getByTestId('pay-button')).toHaveCount(2);
  });
});
