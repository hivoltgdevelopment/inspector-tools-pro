# PRD Tracker

## Blocking Infrastructure Tasks

### npm ci dependency mismatch ✅
- **Owner:** Cody
- **Status:** Resolved — `package-lock.json` and `package.json` are in sync.

### Test Stability + Harness ✅
- **Owner:** Cody
- **Status:** Resolved — 18/18 unit tests green. Toast UI mocked; SpeechRecognition + crypto UUID polyfills added; env flag precedence fixed for tests.

---

## Current Engineering Workstream (Active)

1) E2E Tests (Playwright)
- [x] Scaffold Playwright + scripts
- [x] SMSAuth validation (consent + phone format)
- [x] InspectionForm offline submission clears media
 - [x] SMSConsent happy path (intercept `POST /functions/v1/save-sms-consent` ⇒ 200)
 - [x] Client Portal list + search (intercept Supabase REST for `reports`)

2) Offline Queue Persistence
- [ ] Replace in‑memory upload queue with `idb-keyval`
- [ ] Add retry/backoff with jitter + max attempts
- [ ] Auto‑flush on `online` and on app start; unit tests

3) Payments Backend Hardening
- [ ] Validate inputs; normalize errors from Stripe session creation
- [ ] Secrets presence checks; test stubs/mocks

Notes:
- Dev bypass: set `VITE_SKIP_AUTH=true` and `VITE_SKIP_RBAC=true` to run E2E locally.
- E2E specs live in `e2e/` with a small README.

