# Inspector Tools Pro

[![CI](https://github.com/hivoltgdevelopment/inspector-tools-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/hivoltgdevelopment/inspector-tools-pro/actions/workflows/ci.yml)

Inspector Tools Pro is a Progressive Web App designed for professional home-watch inspectors.
It supports voice-to-form entry (English and Spanish), dynamic prompts per property type,
photo and video capture with timestamp and geo-tag, and offline-ready storage so
inspections can be completed without a network connection.

## GitHub Pages Deployment

This app is configured for GitHub Pages deployment with the following features:

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- GitHub Actions workflow builds and deploys the app
- Uses relative paths for GitHub Pages compatibility

### Manual Deployment
```bash
# Build for GitHub Pages
npm run build:gh-pages

# Deploy (if you have gh-pages installed)
npm run deploy
```

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - No branch selection needed (GitHub Actions will handle deployment)

2. **Configure Actions Permissions**:
   - Go to Settings → Actions → General
   - Enable "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests

3. **First Deployment**:
   - Push code to `main` branch
   - GitHub Actions will automatically build and deploy
   - App will be available at `https://hivoltgdevelopment.github.io/inspector-tools`

### PWA Features
- Fully configured for app store deployment
- Works offline with service worker
- Installable on mobile devices
- All app store metadata included

### Development
```bash
npm install
npm run dev
```

#### Skipping SMS login during development

Create a `.env` file and set `VITE_SKIP_AUTH=true` to bypass the SMS authentication flow and render the protected screens directly.

To surface the placeholder payments UI, add `VITE_PAYMENTS_ENABLED=true` to your `.env` file.

### Build
```bash
npm run build        # Standard build
npm run build:gh-pages  # GitHub Pages build with relative paths
```

## Contributing

- Prereqs: Node.js 20+ and npm 9+
- Install deps: `npm ci`
- Lint: `npm run lint`
- Test: `npm test`

Notes:
- Tests run under Vitest with JSDOM; `.env.test` provides safe defaults for `VITE_*` vars.
- CI runs lint and tests on pushes/PRs to `main` via GitHub Actions: https://github.com/hivoltgdevelopment/inspector-tools-pro/actions

## Local Supabase Setup

Use these steps to get the app talking to Supabase in development.

1) Create a project
- Sign in at https://supabase.com/ and create a new project.
- Copy your Project URL and anon key.

2) Configure environment
- Create a `.env.local` in the repo root with:

  ```ini
  VITE_SUPABASE_URL=<your-project-url>
  VITE_SUPABASE_ANON_KEY=<your-anon-key>
  # Optional dev helpers
  VITE_SKIP_AUTH=true   # bypass SMS login in dev
  VITE_SKIP_RBAC=true   # bypass role checks in dev
  ```

3) Minimal schema
- Run the SQL below in the Supabase SQL editor.

  ```sql
  -- Consent records
  create extension if not exists pgcrypto;

  create table if not exists public.sms_consent (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    full_name text not null,
    phone_number text not null,
    consent_given boolean not null default true,
    ip_address text,
    user_agent text
  );

  -- Example client reports
  create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null,
    title text not null
  );

  -- Development-only RLS (relax policies while prototyping)
  alter table public.sms_consent enable row level security;
  alter table public.reports enable row level security;
  drop policy if exists "dev all on sms_consent" on public.sms_consent;
  drop policy if exists "dev all on reports" on public.reports;
  create policy "dev all on sms_consent" on public.sms_consent
    for all using (true) with check (true);
  create policy "dev all on reports" on public.reports
    for all using (true) with check (true);
  ```

4) Edge functions (HTTP endpoints)
- The UI calls two endpoints you can implement as Supabase Edge Functions:
  - `POST /functions/v1/save-sms-consent` — body: `{ name?: string, phone: string, consent: boolean }`; returns `200` on success.
  - `GET  /functions/v1/export-consent-data` — returns `text/csv` of `sms_consent`.
- For local dev, you can stub these with a simple server or return static responses until functions are ready.

5) Run the app
```bash
npm run dev
```

## Changelog

- See the changelog for recent changes and release notes: [CHANGELOG.md](CHANGELOG.md)

## Architecture (Overview)

```
[React (Vite)]
  |\
  | \__ Auth (Supabase Auth via supabase-js)
  |____ Data (tables: reports, sms_consent)
  |____ Edge Functions
          |__ save-sms-consent (record consent)
          |__ export-consent-data (CSV export)

[Offline Layer]
  |__ idb-keyval queues (files/forms)
  |__ flushes on 'online' → submits

[Payments]
  |__ optional UI flag (VITE_PAYMENTS_ENABLED)
  |__ stub endpoint: /functions/create-payment-session
```

## Edge Functions: Quick Test with curl

These examples assume your project URL is `https://YOUR-PROJECT.supabase.co`.

- Save SMS consent (dev stub using anon key)
  ```bash
  curl -i \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -d '{"name":"Jane Doe","phone":"+15551234567","consent":true}' \
    https://YOUR-PROJECT.supabase.co/functions/v1/save-sms-consent
  ```

- Export consent CSV (recommended: require a user JWT with admin role, not the anon key)
  ```bash
  # Obtain a user access token (e.g., via sign-in). Then:
  export USER_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  curl -i \
    -H "Authorization: Bearer $USER_JWT" \
    https://YOUR-PROJECT.supabase.co/functions/v1/export-consent-data
  ```

Security note: For production, do not authorize admin exports with the anon key. The function should validate a user JWT and ensure the requester has an admin role.

## RLS Policies for Production

Lock down tables and rely on Edge Functions (using the service role key) for privileged operations. Give clients the minimum needed direct access.

Replace the dev policies with the following:

```sql
-- Remove permissive dev policies
alter table public.sms_consent enable row level security;
alter table public.reports enable row level security;

drop policy if exists "dev all on sms_consent" on public.sms_consent;
drop policy if exists "dev all on reports" on public.reports;

-- sms_consent: no direct client access; use Edge Functions with service key
-- (With RLS on and no policies, all client operations are denied.)

-- reports: clients may read only their own rows
create policy "clients read own reports" on public.reports
  for select using (client_id = auth.uid());

-- Inserts/updates/deletes should be performed by backend using the service role
-- (Service role bypasses RLS.) Do not add broad write policies for clients unless required.
```

Implementation tip: The export function should verify admin status from the user JWT (e.g., a custom claim or a lookup) and reject non-admins. The save-consent function can accept public input but must sanitize and rate-limit; it should write using the service key, not trust the client to write directly.

## Supabase Functions

- Paths: `supabase/functions/save-sms-consent/`, `supabase/functions/export-consent-data/`, `supabase/functions/create-payment-session/`
- Env vars:
  - Edge Functions inject `SUPABASE_URL` and `SUPABASE_ANON_KEY` automatically.
  - Set the service role key as a custom secret (avoid `SUPABASE_*` prefix): `SERVICE_ROLE_KEY`.
- Deploy:
  - `supabase functions deploy save-sms-consent`
  - `supabase functions deploy export-consent-data`
  - `supabase functions deploy create-payment-session`
- Local serve (one at a time):
  - `supabase functions serve save-sms-consent`
  - `supabase functions serve export-consent-data`
  - `supabase functions serve create-payment-session`
- Notes:
  - Use the service role only in functions; never expose it to the client.
  - The export function requires an authenticated user JWT with `role=admin`.

### Payments (Stripe)

- The `create-payment-session` function integrates with Stripe using REST.
- Configure Function Secrets (Supabase → Functions → Secrets):
  - `STRIPE_SECRET_KEY` (required)
  - `STRIPE_MODE` = `payment` (default) or `subscription`
  - `STRIPE_PRICE_ID` (preferred) or `STRIPE_AMOUNT_CENTS` and optional `STRIPE_CURRENCY` (default `usd`)
  - `SUCCESS_URL` and `CANCEL_URL` (defaults point to example.com)
- After setting secrets, redeploy:
  - `supabase functions deploy create-payment-session`
- Frontend toggle: enable payments UI via `VITE_PAYMENTS_ENABLED=true` in `.env.local` when ready.

Dev testing without Stripe
- You can exercise the full button → redirect flow without live Stripe by configuring the function to return a fake URL:
  - In Supabase Function Secrets for `create-payment-session` set:
    - `DEV_FAKE_CHECKOUT=true`
    - (optional) `DEV_CHECKOUT_URL=http://localhost:8080/payment/success?mock=1`
  - Redeploy the function. The app will navigate to the provided URL on “Pay invoice”.

Notes:
- If you see “You specified `payment` mode but passed a recurring price”, either:
  - Switch to a one‑time price (create a Price without a recurring interval), or
  - Set `STRIPE_MODE=subscription` and use a recurring `STRIPE_PRICE_ID`.

Windows users: see CLI install via Scoop in `docs/CLI_SETUP_WINDOWS.md`.

### Quick Tester Script (PowerShell)

- Run from repo root to exercise functions without manual curl quoting:
  - `pwsh scripts/test-functions.ps1 -Action save-consent`
  - Options: `-Action payment` or `-Action export -OutFile consent.csv`
  - Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`/`env.local` if not supplied.

## Storage (Media)

Set up a bucket to store photos/videos.

1) Create bucket
- Supabase Dashboard → Storage → Create bucket
- Name: `media`
- Access: choose Public (simpler) or Private (more secure)

2) Policies (if Private)
- Enable RLS on `storage.objects` and add a read policy for authenticated users on the `media` bucket:

  ```sql
  -- Allow authenticated users to read objects from the 'media' bucket
  create policy if not exists "auth read media"
  on storage.objects for select
  using (
    bucket_id = 'media' and auth.role() = 'authenticated'
  );

  -- Allow authenticated users to upload into the 'media' bucket
  create policy if not exists "auth upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media' and auth.role() = 'authenticated'
  );
  ```

3) CORS (optional)
- Storage → Settings → CORS: allow your app origin (e.g., `http://localhost:5173` and your prod origin) for `GET,PUT,POST` and headers `authorization,content-type`.

4) Client usage
- Public bucket: the app uses `getPublicUrl` (no auth needed); simplest for prototyping.
- Private bucket: use signed URLs. The app includes `uploadMedia(file, { signed: true, expiresInSeconds: 3600 })`, which calls `createSignedUrl` after upload. Ensure users are authenticated and the above policies exist.

5) Client-side compression (optional)
- Large images are compressed before upload by default in the inspection form (to ~1600px max side, ~80% quality).
- Utility: `compressImage(file, { maxWidth, maxHeight, quality })` in `src/lib/image.ts`.

Notes
- For stricter control, generate signed URLs via an Edge Function using the service role instead of the client.
- Thumbnails: consider a tiny client-side compression step before upload or an Edge Function to generate thumbnails server-side.

## Security

- Never commit real secrets. Keep real values only in `.env.local` (gitignored) or in Supabase Function Secrets.
- If a key leaks (e.g., pasted in an issue or commit):
  - Rotate in Supabase → Settings → API (regenerate anon/service keys).
  - Update local `.env.local` and Function Secrets with the new values.
  - Redeploy affected functions.

## Release

- See the release checklist: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)

### Version Tagging

When publishing a release:

1. Update `CHANGELOG.md`
   - Move items from “Unreleased” into a new version section like `## [vX.Y.Z] - YYYY-MM-DD`.
   - Summarize any additional changes.
2. Commit the changelog update
   ```bash
   git add CHANGELOG.md
   git commit -m "docs(changelog): release vX.Y.Z"
   ```
3. Create an annotated tag and push it
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
   Or push all tags:
   ```bash
   git push --follow-tags
   ```
4. Create a GitHub Release (UI or CLI)
   - UI: Draft a new release using tag `vX.Y.Z` and paste the changelog notes.
   - CLI (optional):
     ```bash
     gh release create vX.Y.Z --generate-notes --title "vX.Y.Z"
     ```
