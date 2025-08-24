import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InspectionForm from './components/InspectionForm';
import SMSAuth from './components/SMSAuth';
import ConsentAdmin from './components/ConsentAdmin';
import ClientPortal from './components/ClientPortal';
import RequireRole from './components/RequireRole';
import { supabase } from './lib/supabase';

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

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/consent"
          element={
            <RequireRole roles={['admin']}>
              <ConsentAdmin />
            </RequireRole>
          }
        />
        <Route
          path="/portal"
          element={
            <RequireRole roles={['client']}>
              <ClientPortal />
            </RequireRole>
          }
        />
        <Route
          path="/"
          element={
            <RequireRole roles={['inspector']}>
              <div className="p-4">
                <InspectionForm />
              </div>
            </RequireRole>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
