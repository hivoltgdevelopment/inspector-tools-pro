# Product Requirements Document (PRD) – Status Tracker

## Project: Inspector Tools Pro

### Date: August 23, 2025

---

## 1. Completion Status Overview
This section tracks progress against the original PRD. Marked for Cody to continue implementation.

### Phase 1 (MVP)
- [x] **Inspector dashboard with calendar & task list** – core UI scaffolded.
- [x] **Inspection form builder (dynamic fields, templates)** – working, needs more template variety.
- [x] **Media uploads (photos, video, audio notes)** – implemented, currently refining test coverage.
- [x] **Report generation (PDF/CSV/HTML export)** – functional, polish pending.
- [x] **Client portal for viewing completed reports** – basic version online.
- [~] **Authentication (email + magic link, optional MFA)** – Supabase auth complete; error state tests failing, needs Cody to resolve.
- [~] **Role-based permissions (admin, inspector, client)** – roles exist in schema; not enforced consistently in code.

### Advanced Modules (Phase 2+)
- [ ] **Voice-to-form transcription** – placeholder only, no backend integration.
- [ ] **AI-assisted damage detection (image analysis)** – not started.
- [ ] **Vendor coordination & scheduling** – database fields stubbed, UI and logic not built.
- [ ] **Payment integration (Stripe, Coinbase Commerce)** – libraries added, not wired to flows.
- [ ] **QR-code property access & visitor logs** – in concept only.
- [ ] **Integration with smart home devices** – not started.

### Cross-cutting Infrastructure
- [x] **Frontend React PWA setup** – complete.
- [x] **Supabase DB/Auth/Storage** – live, migrations running.
- [~] **CI/CD (GitHub Actions)** – configured, errors with workflow refs and proxy issues need Cody’s attention.
- [x] **Branding (Guardian palette, logo)** – complete.
- [ ] **Offline sync-on-connect mode** – not started.
- [x] **Dependency alignment for npm ci** – **resolved**; `package-lock.json` and `package.json` are in sync (see PRD_TRACKER.md).

---

## 2. Next Steps for Cody
1. **Fix failing unit tests:**
   - Mock `URL.createObjectURL` in test environment.
   - Update SMSConsentForm test assertion to match actual error message.
2. **Enforce role-based permissions** in all protected routes/components.
3. **Stabilize CI/CD workflows**:
   - Resolve `refs/tags/` error in GitHub Actions.
   - Fix proxy access for `git push origin HEAD:main`.
4. **Implement offline queue system** for media uploads (Supabase + local cache).
5. **Wire up payments** (Stripe & Coinbase Commerce) for vendor scheduling.
6. **Document disclaimers** in generated reports (align with Guardian Home Check liability wording).

---

## 3. Cody Implementation Notes
- Repo: `hivoltgdevelopment/inspector-tools-pro`
- All dev branches should merge through PRs with checks passing.
- Prioritize **finishing MVP to production-ready** before starting Phase 2 modules.
- Track open tasks as GitHub issues linked to this PRD tracker.

---

## 4. Legend
- [x] Complete
- [~] Partially complete / needs refinement
- [ ] Not started

