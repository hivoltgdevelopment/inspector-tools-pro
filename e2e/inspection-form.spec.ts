import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Inspection Form (offline submit)', () => {
  test('queues offline submission and clears media list', async ({ page, context }) => {
    // This route is gated by RequireRole. Run dev with VITE_SKIP_AUTH=true to bypass SMS login.
    await page.goto('/');
    await page.getByLabel('Property address').waitFor({ state: 'visible', timeout: 20000 });

    // Emulate offline
    await context.setOffline(true);
    await page.addInitScript(() => {
      // Ensure window.navigator.onLine reflects offline in the app
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        configurable: true,
      });
      window.dispatchEvent(new Event('offline'));
    });

    // Fill minimal required fields
    await page.getByLabel('Property address').fill('123 Desert Vista Dr');

    // Upload one file
    const fixture = path.join(process.cwd(), 'e2e', 'fixtures', 'offline.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixture);
    await expect(page.getByText('offline.png')).toBeVisible();

    // Submit while offline
    await page.getByRole('button', { name: /submit inspection/i }).click();

    // Media list should clear after offline submit
    await expect(page.getByText('offline.png')).toHaveCount(0);
  });
});
