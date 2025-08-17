import React, { useEffect, useState } from 'react';
import InspectionForm from './components/InspectionForm';
import SMSAuth from './components/SMSAuth';
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

  if (skipAuth || authed) {
    return (
      <div className="p-4">
        <InspectionForm />
      </div>
    );
  }

  return (
    <div className="p-4">
      <SMSAuth />
    </div>
  );
}
