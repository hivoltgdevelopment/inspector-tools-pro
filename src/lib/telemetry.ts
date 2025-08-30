// Minimal, env‑gated telemetry wrapper.
// - If VITE_SENTRY_DSN is provided, attempts a dynamic import of @sentry/browser.
// - Otherwise acts as a no‑op logger.
// - Also exposes a simple window error hook for unhandled exceptions in production.

type Level = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

type SentryModule = {
  init: (opts: Record<string, unknown>) => void;
  Breadcrumbs: new (opts?: Record<string, unknown>) => unknown;
  captureException: (e: unknown, ctx?: { extra?: Record<string, unknown> }) => void;
  captureMessage: (m: string, opts?: { level?: string; extra?: Record<string, unknown> }) => void;
};

let enabled = false;
let sentry: SentryModule | null = null;

export async function initTelemetry(opts?: { environment?: string; release?: string }) {
  const env = import.meta.env as unknown as Record<string, string | boolean | undefined>;
  const dsn = env.VITE_SENTRY_DSN as string | undefined;
  const allow = env.VITE_TELEMETRY_ENABLED === 'true';
  enabled = Boolean(dsn && allow);
  if (!enabled) return;
  try {
    // Lazy import so the SDK is only pulled when configured.
    // If the package is not installed, this will throw and we fallback to no‑op.
    const mod = (await import(/* @vite-ignore */ '@sentry/browser')) as unknown as SentryModule;
    sentry = mod;
    mod.init({
      dsn,
      environment: opts?.environment || (env.MODE as string | undefined),
      release: opts?.release,
      integrations: [new mod.Breadcrumbs({ console: false })],
      tracesSampleRate: 0,
    });
  } catch (_) {
    // Package not available; keep no‑op behavior
    enabled = false;
    sentry = null;
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!enabled || !sentry) {
    if (import.meta.env.DEV) {
      console.debug('[telemetry] exception (noop):', error, context || '');
    }
    return;
  }
  try {
    sentry.captureException(error, { extra: context });
  } catch {
    // ignore
  }
}

export function captureMessage(message: string, level: Level = 'info', context?: Record<string, unknown>) {
  if (!enabled || !sentry) {
    if (import.meta.env.DEV) {
      console.debug('[telemetry] message (noop):', level, message, context || '');
    }
    return;
  }
  try {
    sentry.captureMessage(message, { level, extra: context });
  } catch {
    // ignore
  }
}

// Attach basic global listeners (caller may opt‑in from main.tsx)
export function attachGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    captureException(e.error || e.message || 'window.error');
  });
  window.addEventListener('unhandledrejection', (e) => {
    captureException((e as PromiseRejectionEvent).reason || 'unhandledrejection');
  });
}
