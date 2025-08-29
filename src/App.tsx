import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InspectionForm from './components/InspectionForm';
import SMSAuth from './components/SMSAuth';
import ConsentAdmin from './components/ConsentAdmin';
import ClientPortal from './components/ClientPortal';
import RequireRole from './components/RequireRole';
import { supabase } from './lib/supabase';
import NotAuthorized from './components/NotAuthorized';
import PaymentResult from './components/PaymentResult';
import OfflinePage from './components/OfflinePage';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

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
        <SMSAuth />
      </div>
    );
  }

  // Use Vite base (e.g., '/inspector-tools/') so GH Pages subpath routing works
  const base = import.meta.env.BASE_URL || '/';
  return (
    <BrowserRouter basename={base}>
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
    </BrowserRouter>
  );
}
