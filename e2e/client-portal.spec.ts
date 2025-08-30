import { test, expect } from '@playwright/test';
import { stubAuthUser, stubReports } from './utils';

test.describe('Client Portal (list + search)', () => {
  test('lists reports and filters by search', async ({ page }) => {
    await stubAuthUser(page, { id: '00000000-0000-0000-0000-000000000123', email: 'client@example.com' });
    await stubReports(page, [
      { id: 'r1', title: 'Roof Report' },
      { id: 'r2', title: 'Basement Report' },
    ]);

    // Provide a client id via query param to bypass auth in dev
    await page.goto('/portal?client=test');

    await expect(page.getByTestId('portal-heading')).toBeVisible();
    await expect(page.getByTestId('report-item-r1')).toBeVisible();
    await expect(page.getByTestId('report-item-r2')).toBeVisible();

    await page.getByTestId('portal-search').fill('base');
    await expect(page.getByTestId('report-item-r1')).toHaveCount(0);
    await expect(page.getByTestId('report-item-r2')).toBeVisible();
  });
});
