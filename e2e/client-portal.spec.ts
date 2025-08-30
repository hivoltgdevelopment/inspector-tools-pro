import { test, expect } from '@playwright/test';

test.describe('Client Portal (list + search)', () => {
  test('lists reports and filters by search', async ({ page }) => {
    // Intercept Supabase auth user lookup and return a fake user id
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000123',
          email: 'client@example.com',
        }),
      });
    });

    // Intercept reports REST query and return mock rows
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

    // Provide a client id via query param to bypass auth in dev
    await page.goto('/portal?client=test');

    await expect(page.getByRole('heading', { name: 'My Reports' })).toBeVisible();
    await expect(page.getByText('Roof Report')).toBeVisible();
    await expect(page.getByText('Basement Report')).toBeVisible();

    await page.getByPlaceholder('Search reports...').fill('base');
    await expect(page.getByText('Roof Report')).toHaveCount(0);
    await expect(page.getByText('Basement Report')).toBeVisible();
  });
});
