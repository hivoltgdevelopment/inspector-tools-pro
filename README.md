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
