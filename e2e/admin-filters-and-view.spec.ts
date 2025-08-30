import { test, expect } from '@playwright/test';

test.describe('Consent Admin filters + view modal', () => {
  test('filters by search and status, and shows view modal details', async ({ page }) => {
    // Seed table
    await page.route('**/rest/v1/sms_consent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'a1', created_at: '2025-01-01T00:00:00Z', full_name: 'Alice Active', phone_number: '+15550001', consent_given: true, ip_address: '198.51.100.1', user_agent: 'UA' },
          { id: 'b2', created_at: '2025-01-02T00:00:00Z', full_name: 'Bob Revoked', phone_number: '+15550002', consent_given: false },
        ]),
      });
    });
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin' }) });
    });

    await page.goto('/admin/consent?rbac=off');
    await expect(page.getByTestId('consent-heading')).toBeVisible();

    // Search filter
    await page.getByTestId('search-input').fill('alice');
    await expect(page.getByText('Alice Active')).toBeVisible();
    await expect(page.getByText('Bob Revoked')).toHaveCount(0);

    // Clear search and filter by status: revoked
    await page.getByTestId('search-input').fill('');
    await page.getByTestId('status-filter').selectOption('revoked');
    await expect(page.getByText('Bob Revoked')).toBeVisible();
    await expect(page.getByText('Alice Active')).toHaveCount(0);

    // Switch to all then open view modal for Bob
    await page.getByTestId('status-filter').selectOption('all');
    await page.getByTestId('view-b2').click();
    // Verify some details in dialog
    await expect(page.getByText('Consent Details')).toBeVisible();
    await expect(page.getByText('Bob Revoked')).toBeVisible();
    await expect(page.getByText('+15550002')).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('Consent Details')).toHaveCount(0);
  });
});

