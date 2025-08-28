## Supabase CLI on Windows (Scoop)

Quick steps to install and use the Supabase CLI with Scoop.

### Install

- Allow scripts (once):
  - PowerShell (admin or current user): `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- Install Scoop:
  - `iwr -useb get.scoop.sh | iex`
- Add Supabase bucket and install:
  - `scoop bucket add supabase https://github.com/supabase/scoop-bucket`
  - `scoop install supabase`
- Verify:
  - `supabase --version`

### Link Your Project

- Find your project ref in Supabase → Settings → General
- Link: `supabase link --project-ref <your-project-ref>`

### Function Secrets

- Edge Functions automatically provide `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Set the service role key with a custom name (not starting with `SUPABASE_`):
  - `supabase secrets set SERVICE_ROLE_KEY=<your-service-role-key>`
- List/verify: `supabase secrets list`

Note: If you try to set a secret beginning with `SUPABASE_`, the CLI will reject it: “Env name cannot start with SUPABASE_”. That’s expected.

### Deploy Functions

- `supabase functions deploy save-sms-consent`
- `supabase functions deploy export-consent-data`
- `supabase functions deploy create-payment-session`

### Serve Functions Locally (optional)

Create a local env file (not committed): `supabase/functions/.env.local`

```
SERVICE_ROLE_KEY=...
# SUPABASE_URL and SUPABASE_ANON_KEY are provided automatically in the cloud,
# but for local serve you may also set them here if needed:
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
```

Serve one function:

- `supabase functions serve save-sms-consent --env-file supabase/functions/.env.local`
- `supabase functions serve export-consent-data --env-file supabase/functions/.env.local`
- `supabase functions serve create-payment-session --env-file supabase/functions/.env.local`

### Update / Uninstall

- Update: `scoop update supabase`
- Uninstall: `scoop uninstall supabase`

