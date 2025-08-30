import { test, expect } from '@playwright/test';
import { gotoHome } from './utils';
import { join } from 'path';

test.describe('Inspection Form (offline submit)', () => {
  test('queues offline submission and clears media list', async ({ page, context }) => {
    // This route is gated by RequireRole. Run dev with VITE_SKIP_AUTH=true to bypass SMS login.
    await gotoHome(page, { rbacOff: true });
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
    const fixture = join(process.cwd(), 'e2e', 'fixtures', 'offline.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixture);
    await expect(page.getByText('offline.png')).toBeVisible();

    // Submit while offline
    await page.getByRole('button', { name: /submit inspection/i }).click();

    // Media list should clear after offline submit
    await expect(page.getByText('offline.png')).toHaveCount(0);
  });

  test('flushes queued items after reconnect and shows toast', async ({ page, context }) => {
    await gotoHome(page, { rbacOff: true });
    await page.getByLabel('Property address').waitFor({ state: 'visible', timeout: 20000 });

    // Go offline
    await context.setOffline(true);
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    await page.getByLabel('Property address').fill('456 Canyon Rd');
    // Attach two files to simulate multi-item queue
    const fixture = join(process.cwd(), 'e2e', 'fixtures', 'offline.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([fixture, fixture]);
    // Install a test hook to count submissions
    await page.addInitScript(() => {
      const w = window as unknown as { __submitCounts?: Record<string, number>; __onSubmitted?: (id: string, mode: 'online'|'flush'|'offline') => void };
      w.__submitCounts = { online: 0, flush: 0, offline: 0 };
      w.__onSubmitted = (_id, mode) => {
        const s = (window as unknown as { __submitCounts: Record<string, number> }).__submitCounts;
        s[mode] = (s[mode] ?? 0) + 1;
      };
    });
    await page.getByRole('button', { name: /submit inspection/i }).click();

    // Go back online; app should toast and attempt to flush
    await context.setOffline(false);
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // Toast should be rendered in the global container
    await expect(page.getByTestId('toast-container')).toBeVisible();
    await expect(page.getByTestId('toast-container').getByText('Back online. Syncing queued items…')).toBeVisible();
    // Wait for two flush submissions
    await page.waitForFunction(() => {
      const w = window as unknown as { __submitCounts?: Record<string, number> };
      return !!w.__submitCounts && w.__submitCounts.flush >= 2;
    });
  });
});
