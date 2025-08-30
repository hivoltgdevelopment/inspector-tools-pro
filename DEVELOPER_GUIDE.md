# Inspector Tools Pro - SMS Consent System Developer Guide

## Overview
This guide provides detailed instructions for developers working with the SMS consent management system in Inspector Tools Pro. The system ensures Twilio compliance and maintains audit trails for SMS marketing consent.

## System Architecture

### Frontend Components
- `SMSConsentForm.tsx` - User-facing consent collection form
- `ConsentAdmin.tsx` - Admin dashboard for managing consent records
- `SMSAuth.tsx` - SMS authentication with consent integration

### Backend Functions
- `save-sms-consent` - Supabase Edge Function for storing consent data
- `export-consent-data` - Supabase Edge Function for CSV export (Twilio compliant)

### Database
- `sms_consent` table - Stores all consent records with metadata

## What You Can Safely Modify

### Styling & UI
✅ **Safe to Change:**
- CSS classes and Tailwind styling
- Form layout and visual design
- Button colors and typography
- Loading states and animations

### Form Fields
✅ **Safe to Add:**
- Additional optional fields (company, preferences)
- Custom validation messages
- Form submission feedback

### Admin Interface
✅ **Safe to Customize:**
- Search and filter options
- Pagination settings
- Display columns and formatting
- Export filename format

## What Must NOT Be Changed

### Core Consent Data
❌ **DO NOT MODIFY:**
- Required fields: name, phone, consent status
- Timestamp format and timezone handling
- IP address and user agent capture
- Consent checkbox validation logic

### Database Schema
❌ **CRITICAL - DO NOT CHANGE:**
```sql
-- These fields are required for Twilio compliance
- created_at (timestamp)
- full_name (text)
- phone_number (text) 
- consent_given (boolean)
- ip_address (text)
- user_agent (text)
```

### Export Function
❌ **DO NOT MODIFY:**
- CSV headers and field order
- Consent=true filtering logic
- Timestamp format in exports
- File naming convention for audits

## Security Requirements

### Authentication
- Admin interface requires proper authentication
- Use Supabase RLS policies for data protection
- Implement session management

### Data Protection
- Store consent records securely
- Use HTTPS for all consent-related pages
- Implement proper input sanitization
- Log access to consent records

### Privacy Compliance
- Include privacy policy links
- Implement data retention policies
- Provide opt-out mechanisms
- Maintain audit trails

## Configuration Settings

### Environment Variables
```typescript
// These should be configured in Supabase secrets
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

### Business Settings
Update these in your application:
- Business name for exports
- Toll-free number display
- Privacy policy URL
- Terms of service URL

## Testing Checklist

### Before Production
- [ ] Test consent form submission
- [ ] Verify data appears in admin dashboard
- [ ] Test CSV export functionality
- [ ] Confirm only "consent=true" records export
- [ ] Validate timestamp accuracy
- [ ] Test search and filter functions
- [ ] Verify mobile responsiveness
- [ ] Check privacy policy links
- [ ] Test opt-out functionality

### Security Audit
- [ ] Admin authentication works
- [ ] RLS policies prevent unauthorized access
- [ ] Input validation prevents injection
- [ ] HTTPS enforced on all pages
- [ ] Session management secure

## Integration Points

### SMS Authentication
The consent system integrates with SMS auth:
```typescript
// Link to consent form from SMS auth
<Link to="/sms-consent">Complete SMS Consent</Link>
```

### User Dashboard
Access consent admin via Settings:
```typescript
// Admin tab in Settings component
<TabsContent value="consent-admin">
  <ConsentAdmin />
</TabsContent>
```

## Maintenance

### Regular Tasks
- Monitor consent record growth
- Export records for compliance audits
- Review and update privacy policies
- Clean up old test data

### Backup Strategy
- Regular database backups
- Export consent data monthly
- Store exports in secure location
- Document retention periods

## Troubleshooting

### Common Issues
1. **Form not submitting**: Check network connectivity and function deployment
2. **Export empty**: Verify consent records exist with consent_given=true
3. **Admin access denied**: Check authentication and RLS policies
4. **Missing timestamps**: Ensure timezone handling in edge functions

### Support Resources
- Supabase documentation for edge functions
- Twilio compliance guidelines
- React component debugging
- Database query optimization

## Compliance Notes

### Twilio Requirements
- Maintain proof of consent for all SMS recipients
- Include opt-out instructions in messages
- Provide audit trail for regulatory review
- Store consent with timestamp and IP

### TCPA Compliance
- Clear consent language required
- Opt-in must be explicit (checkbox)
- Provide easy opt-out mechanism
- Maintain detailed records

This system is designed to meet Twilio and TCPA compliance requirements. Any modifications should preserve these compliance features.

---

## End-to-end (E2E) tests quickstart

We use Playwright for browser E2E tests. See `e2e/README.md` for full details.

Common commands:

- `npm run test:e2e` — run headless E2E (starts `npm run preview` automatically via config)
- `npm run test:e2e:headed` — run headed
- `npm run test:e2e:ui` — run Playwright UI mode

Pre-flight checks (faster CI parity):

- `npm run check` — runs ESLint, TypeScript typecheck, and `playwright test --list` to catch syntax/import errors without running browsers.
  - Add this as a local pre-commit or pre-push hook if desired (e.g., via Husky).

### Git hooks (Husky)

We include a lightweight Husky setup to run `npm run check` on pre-commit.

Setup (one-time after `npm i`):

```bash
npm run prepare
```

This creates `.husky/_` internals. The repo already contains `.husky/pre-commit` which runs `npm run check`.

Notes:
- Keep `check` fast (no full browser runs). For full E2E, run targeted specs locally.

We also ship a `pre-push` hook that runs the same quick check. You can remove or adjust hooks to fit your workflow.

Helpers and patterns:

- Navigation helpers (from `e2e/utils.ts`):
  - `gotoHome(page, { rbacOff?: boolean })`
  - `gotoPortal(page, { payments?: boolean; client?: string; demo?: boolean; rbacOff?: boolean })`
  - `gotoAdminConsent(page, { rbacOff?: boolean })`
  - `gotoNotAuthorized(page)`, `gotoPaymentResult(page, 'success' | 'cancel')`

- API stubs:
  - Auth: `stubAuthUser(page, { id, email })`
  - Reports: `stubReports(page, [...])`, `stubReportsFail(page)`
  - Admin consent: `stubConsentList(...)`, `stubConsentPatchSuccess(...)`, `stubConsentPatchFail(...)`
  - Export: `stubExportCsv(...)`, `stubExportFail(...)`
  - Payments: `stubCreatePaymentSessionSuccess(...)`, `stubCreatePaymentSessionFail(...)`
  - SMS: `stubSaveSmsConsentSuccess(...)`, `stubOtpSuccess(...)`
  - Local storage: `setLocalStorage(page, key, value)`

- CSV export capture:
  - `addDownloadCapture(page)` + `waitForDownloadInfo(page)` → `{ csv, downloadName }`

- Toast assertions:
  - Use the global container: `page.getByTestId('toast-container').getByText('message')`

- Optional test hook for offline submissions:
  - In tests, define `window.__onSubmitted = (id, mode) => { ... }` to count `'online'|'flush'|'offline'` events
