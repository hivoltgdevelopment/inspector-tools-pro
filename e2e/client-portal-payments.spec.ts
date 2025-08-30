import { test, expect } from '@playwright/test';
import { stubAuthUser, stubReports } from './utils';

test.describe('Client Portal payments toggle (dev override)', () => {
  test('shows/hides Pay invoice via query param override', async ({ page }) => {
    await stubAuthUser(page, { id: 'u1' });
    await stubReports(page, [{ id: 'r1', title: 'Report A' }]);

    // Provide a client id via query param to bypass auth in dev
    await page.goto('/portal?payments=true&client=test');
    await expect(page.getByTestId('portal-heading')).toBeVisible();
    await expect(page.getByTestId('pay-button')).toBeVisible();

    await page.goto('/portal?payments=false&client=test');
    await expect(page.getByTestId('report-item-r1')).toBeVisible();
    await expect(page.getByTestId('pay-button')).toHaveCount(0);
  });
});
