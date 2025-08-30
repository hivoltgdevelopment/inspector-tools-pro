# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and the project adheres to Semantic Versioning where applicable.

## [Unreleased] - 2025-08-29

### Changed
- Tests: switched to `React.act` instead of `react-dom/test-utils` `act` to remove deprecation warnings.
- ClientPortal: payments flag now prefers `process.env.VITE_PAYMENTS_ENABLED` (works with `vi.stubEnv`) with `import.meta.env` fallback.
- Test assertions: simplified SMS test queries after mocking toasts; direct `screen.findByText`/`findByRole('alert')` without container scoping.
- Vite PWA config: resolved manifest merge markers and kept current `devOptions` (service worker disabled in dev).

### Added
- Test harness polyfills/mocks:
  - `crypto.randomUUID` and `crypto.getRandomValues` for environments missing them.
  - Minimal `SpeechRecognition`/`webkitSpeechRecognition` mock.
- `CHANGELOG.md` to document changes going forward.

### Fixed
- Resolved merge conflicts across multiple files (components, tests, and config).
- Stabilized tests by mocking `sonner` (toasts) to avoid DOM collisions with inline messages.
- Tightened typing in `src/offline/queue.ts` (`meta?: Record<string, unknown}`).

### Affected Files (high level)
- `src/components/ClientPortal.tsx`
- `src/components/SMSConsentForm.tsx`
- `src/offline/queue.ts`
- `test/setupTests.ts`
- `test/SMSAuth.test.tsx`
- `test/SMSConsentForm.test.tsx`
- `test/InspectionForm.test.tsx`
- `vite.config.ts`

---

Tip: When preparing a release, copy the Unreleased section under a new version header and date it, then summarize any additional changes.

