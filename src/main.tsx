import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';
import { initTelemetry, attachGlobalErrorHandlers } from './lib/telemetry';

// Optional accessibility audit in development
if (import.meta.env.DEV && import.meta.env.VITE_A11Y_AUDIT === 'true') {
  import('./dev/a11y');
}

// Initialize telemetry (no‑op unless explicitly enabled via env)
const envRelease = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_RELEASE;
void initTelemetry({ environment: import.meta.env.MODE, release: envRelease });
attachGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    <App />
  </React.StrictMode>
);
