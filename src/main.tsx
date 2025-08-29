import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';

// Optional accessibility audit in development
if (import.meta.env.DEV && import.meta.env.VITE_A11Y_AUDIT === 'true') {
  import('./dev/a11y');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    <App />
  </React.StrictMode>
);
