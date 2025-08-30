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

## Utilities

Shared helpers in `e2e/utils.ts` reduce duplication:

- Navigation
  - `gotoHome(page, { rbacOff?: boolean })`
  - `gotoPortal(page, { payments?: boolean; client?: string; demo?: boolean; rbacOff?: boolean })`
  - `gotoAdminConsent(page, { rbacOff?: boolean })`
  - `gotoNotAuthorized(page)`
  - `gotoPaymentResult(page, kind: 'success' | 'cancel')`

- API stubs
  - `stubAuthUser(page, user)`
  - `stubReports(page, reports)`, `stubReportsFail(page, status)`
  - `stubConsentList(page, records)`, `stubConsentPatchSuccess(page, updated)`, `stubConsentPatchFail(page, status)`
  - `stubExportCsv(page, csv)`, `stubExportFail(page, status)`
  - `stubCreatePaymentSessionSuccess(page, url)`, `stubCreatePaymentSessionFail(page, status)`
  - `stubSaveSmsConsentSuccess(page)`, `stubOtpSuccess(page)`
  - `setLocalStorage(page, key, value)`

- CSV download capture (for export tests)
  - `addDownloadCapture(page)`: wraps blob URL + anchor click
  - `waitForDownloadInfo(page)`: returns `{ csv?: string; downloadName?: string }`

### Examples

Navigation

```ts
import { gotoHome, gotoPortal, gotoAdminConsent, gotoNotAuthorized, gotoPaymentResult } from './utils';

await gotoHome(page, { rbacOff: true });
await gotoPortal(page, { payments: true, client: 'test', demo: true });
await gotoAdminConsent(page); // defaults rbac=off
await gotoNotAuthorized(page);
await gotoPaymentResult(page, 'success');
```

Stubbing APIs

```ts
import {
  stubAuthUser,
  stubReports, stubReportsFail,
  stubConsentList, stubConsentPatchSuccess, stubConsentPatchFail,
  stubExportCsv, stubExportFail,
  stubCreatePaymentSessionSuccess, stubCreatePaymentSessionFail,
  stubSaveSmsConsentSuccess, stubOtpSuccess,
  setLocalStorage,
} from './utils';

await stubAuthUser(page, { id: 'u1', email: 'user@example.com' });
await stubReports(page, [{ id: 'r1', title: 'Roof' }]);
await stubReportsFail(page, 500);
await stubConsentList(page, [{ id: 'c1', full_name: 'Alice', phone_number: '+1555', consent_given: true }]);
await stubConsentPatchSuccess(page, [{ id: 'c1', consent_given: false }]);
await stubConsentPatchFail(page, 500);
await stubExportCsv(page, 'id,name\n1,Alice');
await stubExportFail(page);
await stubCreatePaymentSessionSuccess(page, '/payment/success');
await stubCreatePaymentSessionFail(page);
await stubSaveSmsConsentSuccess(page);
await stubOtpSuccess(page);
await setLocalStorage(page, 'payments_enabled', 'true');
```

CSV download capture

```ts
import { addDownloadCapture, waitForDownloadInfo } from './utils';

await addDownloadCapture(page);
// trigger export → link click in app
const info = await waitForDownloadInfo(page);
expect(info.downloadName).toBe('consent-data.csv');
expect(info.csv?.startsWith('id,')).toBeTruthy();
```

### Test Hooks

For some flows, the app exposes a no-op test hook you can opt into from E2E to count submits:

```ts
// In your test, before the action that triggers submission:
await page.addInitScript(() => {
  (window as unknown as { __submitCounts?: Record<string, number>; __onSubmitted?: (id: string, mode: 'online'|'flush'|'offline') => void }).__submitCounts = { online: 0, flush: 0, offline: 0 } as any;
  (window as unknown as { __submitCounts?: Record<string, number>; __onSubmitted?: (id: string, mode: 'online'|'flush'|'offline') => void }).__onSubmitted = (_id, mode) => {
    const w = window as unknown as { __submitCounts: Record<string, number> };
    w.__submitCounts[mode] = (w.__submitCounts[mode] ?? 0) + 1;
  };
});

// Later, assert on counts
await page.waitForFunction(() => {
  const w = window as unknown as { __submitCounts?: Record<string, number> };
  return !!w.__submitCounts && w.__submitCounts.flush >= 2; // for multi-item flush
});
```

The hook only fires if the test defines `window.__onSubmitted` and has no effect in production.
