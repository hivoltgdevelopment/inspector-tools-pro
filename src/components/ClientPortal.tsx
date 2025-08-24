import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

main
type Report = {
  id: string;
  title: string;
};

export default function ClientPortal() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);

  main
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('reports')
        .select('id, title')
        .eq('client_id', userData.user?.id);
      if (error) {
        setError(error.message);
      } else {
        setReports((data || []) as Report[]);
      }
    };
    load();
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">My Reports</h2>
      <ul className="list-disc pl-6">
        {reports.map((r) => (
codex/continue-implementation-of-feature-sphc6g
          <li key={r.id} className="mb-2">
            <div>{r.title}</div>
            {paymentsEnabled && <PayInvoiceButton reportId={r.id} />}
          </li>
          <li key={r.id}>{r.title}</li>
main
        ))}
      </ul>
    </div>
  );
}
