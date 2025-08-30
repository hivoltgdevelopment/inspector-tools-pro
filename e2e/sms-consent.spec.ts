import { test, expect } from '@playwright/test';
import { stubSaveSmsConsentSuccess, stubOtpSuccess } from './utils';

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  if (process.env.E2E_SKIP_AUTH === 'true') {
    test.skip(true, 'Skipping auth tests under E2E_SKIP_AUTH');
  }
});

test.describe('SMS Consent (happy path via interception)', () => {
  test('records consent and advances to OTP stage', async ({ page }) => {
    await stubSaveSmsConsentSuccess(page);
    await stubOtpSuccess(page);

    await page.goto('/');
    await page.getByPlaceholder('Phone number').fill('+15551234567');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /send code/i }).click();

    // Should move to OTP stage (input appears)
    await expect(page.getByPlaceholder('Enter code')).toBeVisible();
  });
});
