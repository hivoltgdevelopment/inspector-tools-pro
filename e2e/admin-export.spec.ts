import { test, expect } from '@playwright/test';
import {
  stubAuthUser,
  stubConsentList,
  stubConsentPatchSuccess,
  stubConsentPatchFail,
  stubExportCsv,
  stubExportFail,
  addDownloadCapture,
  waitForDownloadInfo,
  type DownloadInfo,
  gotoAdminConsent,
} from './utils';

test.describe('Consent Admin Export (happy path)', () => {
  test('loads records and exports CSV via stubbed function', async ({ page }) => {
    await stubAuthUser(page, { id: 'admin-user', email: 'admin@example.com' });
    await stubConsentList(page, [
      { id: 'c1', created_at: '2025-01-01T00:00:00Z', full_name: 'John Doe', phone_number: '+15555550123', consent_given: true, ip_address: '203.0.113.10', user_agent: 'Playwright' },
      { id: 'c2', created_at: '2025-01-02T00:00:00Z', full_name: 'Jane Roe', phone_number: '+15555559876', consent_given: false, ip_address: '203.0.113.11', user_agent: 'Playwright' },
    ]);
    const csv = [
      'id,full_name,phone_number,consent_given',
      'c1,John Doe,+15555550123,true',
      'c2,Jane Roe,+15555559876,false',
    ].join('\n');
    await stubExportCsv(page, csv);
    await addDownloadCapture(page);

    // Navigate with RBAC bypass for test determinism
    await gotoAdminConsent(page);
    await expect(page.getByRole('heading', { name: 'Consent Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Roe')).toBeVisible();

    // Trigger export
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const downloaded = await waitForDownloadInfo(page);

    expect(downloaded.downloadName).toBe('consent-data.csv');
    expect(downloaded.csv).toBe(csv);
  });
});

test.describe('Consent Admin negative and actions', () => {
  test('shows error toast when export fails', async ({ page }) => {
    // Seed auth and records
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-user' }) });
    });
    await page.route('**/rest/v1/sms_consent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'c1', created_at: '2025-01-01T00:00:00Z', full_name: 'John Doe', phone_number: '+15555550123', consent_given: true },
        ]),
      });
    });
    // Fail the export endpoint
    await stubExportFail(page);

    await gotoAdminConsent(page);
    await expect(page.getByRole('heading', { name: 'Consent Admin Dashboard' })).toBeVisible();
    await page.getByRole('button', { name: 'Export CSV' }).click();
    await expect(page.getByTestId('toast-container')).toBeVisible();
    await expect(page.getByTestId('toast-container').getByText('Failed to export consent data')).toBeVisible();
  });

  test('revokes consent and shows success toast', async ({ page }) => {
    // Single handler for GET and PATCH on sms_consent
    await stubConsentList(page, [
      { id: 'c1', created_at: '2025-01-01T00:00:00Z', full_name: 'John Doe', phone_number: '+15555550123', consent_given: true },
    ]);
    await stubConsentPatchSuccess(page, [{ id: 'c1', consent_given: false }]);
    await stubAuthUser(page, { id: 'admin-user' });

    await gotoAdminConsent(page);
    await expect(page.getByText('John Doe')).toBeVisible();
    // Open confirm dialog via Revoke action
    await page.getByRole('button', { name: 'Revoke' }).click();
    // Confirm revoke
    await page.getByRole('button', { name: 'Revoke' }).last().click();
    // Success toast and UI reflects revoked status
    await expect(page.getByTestId('toast-container')).toBeVisible();
    await expect(page.getByTestId('toast-container').getByText('Consent revoked')).toBeVisible();
    await expect(page.getByText('Revoked')).toBeVisible();
    // Revoke button should no longer be present for that row
    await expect(page.getByRole('button', { name: 'Revoke' })).toHaveCount(0);
  });

  test('revoke shows error toast when PATCH fails', async ({ page }) => {
    await stubConsentList(page, [
      { id: 'e1', created_at: '2025-01-01T00:00:00Z', full_name: 'Error Case', phone_number: '+15551111', consent_given: true },
    ]);
    await stubConsentPatchFail(page);
    await stubAuthUser(page, { id: 'admin-user' });

    await page.goto('/admin/consent?rbac=off');
    await page.getByTestId('revoke-e1').click();
    await page.getByRole('button', { name: 'Revoke' }).last().click();
    await expect(page.getByTestId('toast-container')).toBeVisible();
    await expect(page.getByTestId('toast-container').getByText('Failed to revoke consent')).toBeVisible();
    await expect(page.getByTestId('status-e1')).toHaveText('Active');
  });
});
