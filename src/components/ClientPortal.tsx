import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
codex/continue-implementation-of-feature-nvnmmi
import PayInvoiceButton from './PayInvoiceButton';

import PayInvoiceButton from './PayInvoiceButton';

main
type Report = {
  id: string;
  title: string;
};

export default function ClientPortal() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
codex/continue-implementation-of-feature-nvnmmi
  const [query, setQuery] = useState('');
  const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

  const [query, setQuery] = useState('');
  const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

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

codex/continue-implementation-of-feature-nvnmmi

codex/continue-implementation-of-feature-7okmdd
main
  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="font-bold mb-4 text-xl">My Reports</h2>
      <input
        type="search"
        placeholder="Search reports..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 mb-4 w-full rounded"
      />
      <ul className="divide-y">
        {filtered.map((r) => (
          <li key={r.id} className="py-3 flex items-center justify-between">
            <span>{r.title}</span>
            {paymentsEnabled && <PayInvoiceButton reportId={r.id} />}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-600 mt-6">
        Inspection reports are provided for informational purposes only and do not
        constitute legal or financial advice.
      </p>
codex/continue-implementation-of-feature-nvnmmi
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
main
    </div>
  );
}
