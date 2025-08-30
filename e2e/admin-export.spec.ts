import { test, expect } from '@playwright/test';

type DownloadInfo = { csv?: string; downloadName?: string };
declare global {
  // Augment window in page context for type-safety in evaluate/waitForFunction
  interface Window { __downloadInfo?: DownloadInfo }
}

test.describe('Consent Admin Export (happy path)', () => {
  test('loads records and exports CSV via stubbed function', async ({ page }) => {
    // Intercept Supabase auth (defensive; app usually skips with VITE_SKIP_AUTH/VITE_SKIP_RBAC)
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'admin-user', email: 'admin@example.com' }),
      });
    });

    // Intercept REST fetch for consent records
    await page.route('**/rest/v1/sms_consent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'c1',
            created_at: '2025-01-01T00:00:00Z',
            full_name: 'John Doe',
            phone_number: '+15555550123',
            consent_given: true,
            ip_address: '203.0.113.10',
            user_agent: 'Playwright',
          },
          {
            id: 'c2',
            created_at: '2025-01-02T00:00:00Z',
            full_name: 'Jane Roe',
            phone_number: '+15555559876',
            consent_given: false,
            ip_address: '203.0.113.11',
            user_agent: 'Playwright',
          },
        ]),
      });
    });

    // Intercept the export Edge Function and return a CSV blob
    const csv = [
      'id,full_name,phone_number,consent_given',
      'c1,John Doe,+15555550123,true',
      'c2,Jane Roe,+15555559876,false',
    ].join('\n');

    await page.route('**/functions/v1/export-consent-data', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/csv' },
        body: csv,
      });
    });

    // Stub blob download to assert filename and content
    await page.addInitScript(() => {
      const w = window as unknown as { __downloadInfo: DownloadInfo };
      w.__downloadInfo = {};
      const origCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = (blob: Blob) => {
        void blob.text().then((t) => {
          (window as unknown as { __downloadInfo: DownloadInfo }).__downloadInfo.csv = t;
        });
        return origCreateObjectURL(blob);
      };
      const origCreateElement = document.createElement.bind(document);
      document.createElement = ((tagName: string) => {
        const el = origCreateElement(tagName) as HTMLElement;
        if (tagName.toLowerCase() === 'a') {
          const a = el as HTMLAnchorElement;
          const origClick = a.click.bind(a);
          a.click = () => {
            (window as unknown as { __downloadInfo: DownloadInfo }).__downloadInfo.downloadName = a.download;
            return origClick();
          };
        }
        return el;
      }) as typeof document.createElement;
    });

    // Navigate with RBAC bypass for test determinism
    await page.goto('/admin/consent?rbac=off');

    await expect(page.getByRole('heading', { name: 'Consent Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Roe')).toBeVisible();

    // Trigger export
    await page.getByRole('button', { name: 'Export CSV' }).click();

    // Assert stubbed download details captured in page context
    await page.waitForFunction(() => {
      const w = window as unknown as { __downloadInfo?: DownloadInfo };
      return !!w.__downloadInfo?.csv;
    });

    const downloaded = await page.evaluate<DownloadInfo>(() => {
      return (window as unknown as { __downloadInfo: DownloadInfo }).__downloadInfo;
    });

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
    await page.route('**/functions/v1/export-consent-data', async (route) => {
      await route.fulfill({ status: 500, headers: { 'content-type': 'text/plain' }, body: 'error' });
    });

    await page.goto('/admin/consent?rbac=off');
    await expect(page.getByRole('heading', { name: 'Consent Admin Dashboard' })).toBeVisible();
    await page.getByRole('button', { name: 'Export CSV' }).click();
    await expect(page.getByText('Failed to export consent data')).toBeVisible();
  });

  test('revokes consent and shows success toast', async ({ page }) => {
    // Single handler for GET and PATCH on sms_consent
    await page.route('**/rest/v1/sms_consent**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'c1', created_at: '2025-01-01T00:00:00Z', full_name: 'John Doe', phone_number: '+15555550123', consent_given: true },
          ]),
        });
        return;
      }
      if (method === 'PATCH') {
        // Return updated row
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'c1', consent_given: false },
          ]),
        });
        return;
      }
      // Fallback
      await route.continue();
    });
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-user' }) });
    });

    await page.goto('/admin/consent?rbac=off');
    await expect(page.getByText('John Doe')).toBeVisible();
    // Open confirm dialog via Revoke action
    await page.getByRole('button', { name: 'Revoke' }).click();
    // Confirm revoke
    await page.getByRole('button', { name: 'Revoke' }).last().click();
    // Success toast and UI reflects revoked status
    await expect(page.getByText('Consent revoked')).toBeVisible();
    await expect(page.getByText('Revoked')).toBeVisible();
    // Revoke button should no longer be present for that row
    await expect(page.getByRole('button', { name: 'Revoke' })).toHaveCount(0);
  });
});
