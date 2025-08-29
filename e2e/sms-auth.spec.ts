import { test, expect } from '@playwright/test';

test.describe('SMS Authentication (validation only)', () => {
  test('requires consent and E.164 phone format', async ({ page }) => {
    await page.goto('/');

    // Fill an invalid number and try to send without consent
    await page.getByPlaceholder('Phone number').fill('555-1234');
    await page.getByRole('button', { name: /send code/i }).click();

    // Should show inline error about consent first
    await expect(page.getByRole('alert')).toHaveText(
      /you must consent to receive sms messages\./i
    );

    // Now enable consent and try again; should hit phone format validation
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /send code/i }).click();

    await expect(page.getByRole('alert')).toHaveText(
      /please enter a valid phone number/i
    );
  });
});

