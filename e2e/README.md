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

## Notes

- For networked flows (e.g., Supabase Auth or Functions), prefer unit/integration tests or add Playwright route interception/mocking as needed.
- These specs intentionally avoid network dependencies to stay fast and deterministic.
