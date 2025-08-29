import { test, expect } from '@playwright/test';

test.describe('SMS Consent (happy path via interception)', () => {
  test('records consent and advances to OTP stage', async ({ page }) => {
    // Intercept Edge Function that records consent
    await page.route('**/functions/v1/save-sms-consent', async (route) => {
      // Basic validation of body shape for sanity
      try {
        const req = route.request();
        const body = req.postDataJSON() as any;
        if (!body || !body.phone) {
          return route.fulfill({ status: 400 });
        }
      } catch {}
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    // Intercept Supabase OTP request
    await page.route('**/auth/v1/otp**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/');
    await page.getByPlaceholder('Phone number').fill('+15551234567');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /send code/i }).click();

    // Should move to OTP stage (input appears)
    await expect(page.getByPlaceholder('Enter code')).toBeVisible();
  });
});

