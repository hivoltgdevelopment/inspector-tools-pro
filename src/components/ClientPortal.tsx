import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PayInvoiceButton from './PayInvoiceButton';

type Report = {
  id: string;
  title: string;
};

export default function ClientPortal() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Prefer process.env so tests can override with vi.stubEnv; fall back to import.meta.env
  const paymentsFlag = (
    (typeof process !== 'undefined'
      ? (process as unknown as { env?: Record<string, string | undefined> }).env?.VITE_PAYMENTS_ENABLED
      : undefined) ?? import.meta.env.VITE_PAYMENTS_ENABLED
  );
  let paymentsEnabled = paymentsFlag === 'true';
  // Testing override: allow query param or localStorage in any environment
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('payments');
    if (qp === 'true') paymentsEnabled = true;
    if (qp === 'false') paymentsEnabled = false;
    const ls = localStorage.getItem('payments_enabled');
    if (ls === 'true') paymentsEnabled = true;
    if (ls === 'false') paymentsEnabled = false;
  } catch {}

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      let userId = userData.user?.id as string | undefined;

      // Dev-only overrides to help local/E2E testing without auth
      if (!userId) {
        try {
          const url = new URL(window.location.href);
          const qp = url.searchParams.get('client');
          const ls = localStorage.getItem('client_id') || undefined;
          userId = (qp || ls) || undefined;
          // Demo data mode: show placeholder reports without hitting API
          const demo = url.searchParams.get('demo') || localStorage.getItem('demo_reports');
          if (!userId && (demo === '1' || demo === 'true')) {
            setReports([
              { id: 'demo-1', title: 'Roof Report' },
              { id: 'demo-2', title: 'Basement Report' },
            ]);
            return;
          }
        } catch {}
      }

      if (!userId) {
        // No user available — avoid hitting the API with undefined filter
        setReports([]);
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select('id, title')
        .eq('client_id', userId);
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

  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="font-bold mb-4 text-xl">My Reports</h2>
      <input
        type="search"
        placeholder="Search reports..."
        aria-label="Search reports"
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
        Inspection reports are provided for informational purposes only and do
        not constitute legal or financial advice.
      </p>
    </div>
  );
}
