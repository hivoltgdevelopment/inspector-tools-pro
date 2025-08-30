# End-to-End (E2E) Tests

This project includes Playwright tests to validate core flows in a real browser.

## Prereqs

- Node 18+ (or 20+ recommended)
- Install Playwright and browsers (one-time):
  ```bash
  npm i -D @playwright/test
  npx playwright install
  ```

## Running

1) Start the dev server (in one terminal):
   ```bash
   # Ensure app is reachable without login and role checks for E2E
   # Add these in .env.local (recommended) or run inline:
   VITE_SKIP_AUTH=true VITE_SKIP_RBAC=true npm run dev
   ```

   The dev server runs at http://localhost:8080 (see vite.config.ts).

2) Run E2E tests (in another terminal):
   ```bash
   npm run test:e2e
   # or headed/interactive
   npm run test:e2e:headed
   npm run test:e2e:ui
   ```

You can set a custom base URL for tests via `E2E_BASE_URL`:
```bash
E2E_BASE_URL=http://localhost:5173 npm run test:e2e
```

## Included Specs

- `sms-auth.spec.ts`
  - Validates consent requirement and phone format (no network calls required).
- `sms-consent.spec.ts`
  - Intercepts `POST /functions/v1/save-sms-consent` and `POST /auth/v1/otp` to simulate a happy path advancing to OTP stage.
- `inspection-form.spec.ts`
  - Emulates offline, uploads a file, and verifies that submitting offline clears the media list.
- `client-portal.spec.ts`
  - Intercepts Supabase auth + REST calls; lists and filters mock reports.

- `client-portal-payments.spec.ts`
  - Uses a dev-only override to toggle payments visibility without a rebuild:
    - `?payments=true|false` or `localStorage.setItem('payments_enabled', 'true|false')`

- `admin-export.spec.ts`
  - Intercepts Supabase auth and `GET /rest/v1/sms_consent` to seed the admin table.
  - Intercepts `GET /functions/v1/export-consent-data` and fulfills with a CSV string.
  - Stubs the blob download by wrapping `URL.createObjectURL` and `<a>.click()` to assert
    both the filename (`consent-data.csv`) and CSV content.
  - Navigates to `/admin/consent?rbac=off` to bypass RBAC checks for the test run.
  - Also includes negative-path and actions:
    - Export failure (500) shows a toast error.
    - Revoke flow confirms, calls PATCH on `sms_consent`, and shows a success toast with UI update.

- `routes-basic.spec.ts`
  - Covers static routes:
    - `/not-authorized` (renders heading and actions)
    - `/payment/success` and `/payment/cancel` (verify headings)

## Notes

- For networked flows (e.g., Supabase Auth or Functions), prefer unit/integration tests or add Playwright route interception/mocking as needed.
- These specs intentionally avoid network dependencies to stay fast and deterministic.
