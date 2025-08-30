import { test, expect } from '@playwright/test';
import { stubReports, stubCreatePaymentSessionSuccess, stubCreatePaymentSessionFail, setLocalStorage, gotoPortal } from './utils';

test.describe('Payment checkout (fake mode)', () => {
  test('navigates to success page when function returns url', async ({ page }) => {
    await stubCreatePaymentSessionSuccess(page, '/payment/success?mock=1');
    await stubReports(page, [{ id: 'r1', title: 'Report A' }]);

    // Ensure payments are enabled at first render and use demo reports
    await setLocalStorage(page, 'payments_enabled', 'true');
    await gotoPortal(page, { payments: true, demo: true });
    await page.getByRole('heading', { name: 'My Reports' }).waitFor();
    await page.getByRole('button', { name: 'Pay invoice' }).first().click();

    await expect(page).toHaveURL(/\/payment\/success\?mock=1/);
    await expect(page.getByText(/success/i)).toBeVisible();
  });

  test('shows toast error when session creation fails', async ({ page }) => {
    await stubCreatePaymentSessionFail(page);
    await stubReports(page, [{ id: 'r1', title: 'Report A' }]);
    await setLocalStorage(page, 'payments_enabled', 'true');
    await gotoPortal(page, { payments: true, demo: true });
    await page.getByRole('heading', { name: 'My Reports' }).waitFor();
    await page.getByRole('button', { name: 'Pay invoice' }).first().click();
    await expect(page.getByTestId('toast-container')).toBeVisible();
    await expect(page.getByTestId('toast-container').getByText('Failed to initiate checkout. Please try again later.')).toBeVisible();
  });

  test('hides pay button when payments disabled', async ({ page }) => {
    await stubReports(page, [{ id: 'r1', title: 'Report A' }]);
    // Explicitly disable
    await setLocalStorage(page, 'payments_enabled', 'false');
    await gotoPortal(page, { payments: false, demo: true });
    await page.getByRole('heading', { name: 'My Reports' }).waitFor();
    await expect(page.getByTestId('pay-button')).toHaveCount(0);
  });

  test('shows pay button per report when payments enabled', async ({ page }) => {
    await stubReports(page, [
      { id: 'r1', title: 'Roof Report' },
      { id: 'r2', title: 'Basement Report' },
    ]);
    await setLocalStorage(page, 'payments_enabled', 'true');
    await gotoPortal(page, { payments: true });
    await page.getByTestId('portal-heading').waitFor();
    // Each report item has its own pay-button
    await expect(page.getByTestId('report-item-r1').getByTestId('pay-button')).toBeVisible();
    await expect(page.getByTestId('report-item-r2').getByTestId('pay-button')).toBeVisible();
    // Total count equals number of items
    await expect(page.getByTestId('pay-button')).toHaveCount(2);
  });
});
