import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ConsentRecord = {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  consent_given: boolean;
  ip_address?: string;
  user_agent?: string;
};

export default function ConsentAdmin() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('sms_consent')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setRecords(data as ConsentRecord[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      status === 'all'
        ? true
        : status === 'active'
        ? r.consent_given
        : !r.consent_given;
    return matchesSearch && matchesStatus;
  });

  const viewRecord = (rec: ConsentRecord) => {
    alert(
      `Name: ${rec.full_name}\nPhone: ${rec.phone_number}\nConsent: ${
        rec.consent_given ? 'yes' : 'no'
      }\nCreated: ${rec.created_at}\nIP: ${rec.ip_address || ''}\nUser Agent: ${
        rec.user_agent || ''
      }`
    );
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke consent for this record?')) return;
    const { error } = await supabase
      .from('sms_consent')
      .update({ consent_given: false })
      .eq('id', id);
    if (error) {
      alert('Failed to revoke consent');
      return;
    }
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, consent_given: false } : r))
    );
  };

  const exportData = async () => {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-consent-data`;
    const response = await fetch(functionUrl, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) {
      alert('Failed to export consent data');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consent-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-4">Consent Admin Dashboard</h2>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <button
          onClick={exportData}
          className="border rounded px-3 py-1 bg-blue-500 text-white"
        >
          Export CSV
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Phone</th>
            <th className="py-2">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b last:border-b-0">
              <td className="py-2">{r.full_name}</td>
              <td className="py-2">{r.phone_number}</td>
              <td className="py-2">
                {r.consent_given ? 'Active' : 'Revoked'}
              </td>
              <td className="py-2 flex gap-2">
                <button
                  onClick={() => viewRecord(r)}
                  className="text-blue-600 underline"
                >
                  View
                </button>
                {r.consent_given && (
                  <button
                    onClick={() => revoke(r.id)}
                    className="text-red-600 underline"
                  >
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-muted-foreground">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

