# Release Checklist

A concise, production-minded checklist for staging and production releases.

## Staging Prep
- Branch/tag: create `release/x.y.z` from `main`; bump version in `package.json`.
- CI: ensure lint/tests pass on PR; verify `.github/workflows/ci.yml` succeeds.

## Supabase Setup
- Environment: create staging project; note `SUPABASE_URL`, rotate keys.
- Function Secrets: set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Schema: apply “Minimal schema” and “RLS Policies for Production” from `README.md`.
- Roles: ensure admins have `user_metadata.role = 'admin'`.

## Edge Functions
- Deploy: `supabase functions deploy save-sms-consent`
- Deploy: `supabase functions deploy export-consent-data`
- Deploy: `supabase functions deploy create-payment-session` (stub)
- Test auth: curl endpoints; export must require admin JWT.
- Logs: verify inserts/reads; anon denied on restricted tables.

## App Config
- Env vars (staging host):
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_PAYMENTS_ENABLED` (leave empty unless live processor is ready)
  - Do NOT set `VITE_SKIP_AUTH` or `VITE_SKIP_RBAC` in staging/prod
- Build: `npm ci && npm run build`; preview with `npm run preview`.

## Payments
- Current: `create-payment-session` returns a mock URL.
- Decision: keep `VITE_PAYMENTS_ENABLED` empty in prod until real processor is integrated.

## Quality Checks
- Auth: sign in via SMS, verify portal and inspector routes.
- Offline: submit while offline → toast shows queue; back online → auto-flush runs.
- Consent: submit SMS consent → row appears in `sms_consent`.
- Export: as admin, GET CSV from `export-consent-data`.

## Security
- Ensure service role is only set as Function Secret, never in frontend envs.
- Verify RLS denies direct writes to `sms_consent` for anon users.
- Review function input validation and headers.

## Release
- Merge PR: squash/merge `release/x.y.z` → `main`.
- Tag: `git tag vx.y.z && git push --tags`.
- Deploy app: via hosting/CD (GitHub Pages workflow is configured).

## Post-Release
- Monitor: Supabase function logs; frontend error tracker (if configured).
- KPIs: auth success rate, consent submission success, queue flush success.

## Rollback
- App: redeploy previous tag `vx.y.(z-1)` or revert PR.
- Functions: redeploy previous versions (`supabase functions list`).
- Keys: if compromise suspected, rotate anon/service keys and redeploy.

