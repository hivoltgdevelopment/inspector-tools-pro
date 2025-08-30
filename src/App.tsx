import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RequireRole from './components/RequireRole';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';

const InspectionForm = React.lazy(() => import('./components/InspectionForm'));
const SMSAuth = React.lazy(() => import('./components/SMSAuth'));
const ConsentAdmin = React.lazy(() => import('./components/ConsentAdmin'));
const ClientPortal = React.lazy(() => import('./components/ClientPortal'));
const NotAuthorized = React.lazy(() => import('./components/NotAuthorized'));
const PaymentResult = React.lazy(() => import('./components/PaymentResult'));
const OfflinePage = React.lazy(() => import('./components/OfflinePage'));

export default function App() {
  const [authed, setAuthed] = useState(false);
  const skipAuthEnv = import.meta.env.VITE_SKIP_AUTH === 'true';
  // Allow bypass in any environment for testing: query param or localStorage
  let skipAuth = skipAuthEnv;
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('auth');
    if (qp === 'off') skipAuth = true;
    const ls = localStorage.getItem('auth_off');
    if (ls === 'true') skipAuth = true;
  } catch (_e) {
    // ignore non-browser contexts
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session);
    };
    init();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!skipAuth && !authed) {
    return (
      <div className="p-4">
        <Suspense fallback={<div>Loading…</div>}>
          <SMSAuth />
        </Suspense>
      </div>
    );
  }

  // Use Vite base (e.g., '/inspector-tools/') so GH Pages subpath routing works
  const base = import.meta.env.BASE_URL || '/';
  return (
    <BrowserRouter basename={base}>
      <Toaster position="top-right" data-testid="toast-container" />
      <Suspense fallback={<div className="p-4">Loading…</div>}>
      <Routes>
        <Route
          path="/admin/consent"
          element={
            <RequireRole roles={['admin']} redirectTo="/not-authorized">
              <ConsentAdmin />
            </RequireRole>
          }
        />
        <Route
          path="/portal"
          element={
            <RequireRole roles={['client']} redirectTo="/not-authorized">
              <ClientPortal />
            </RequireRole>
          }
        />
        <Route
          path="/"
          element={
            <RequireRole roles={['inspector']} redirectTo="/not-authorized">
              <div className="p-4">
                <InspectionForm />
              </div>
            </RequireRole>
          }
        />
        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="/payment/success" element={<PaymentResult kind="success" />} />
        <Route path="/payment/cancel" element={<PaymentResult kind="cancel" />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
