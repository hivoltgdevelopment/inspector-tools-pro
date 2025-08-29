import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Toaster, toast } from 'sonner';
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
  const [selected, setSelected] = useState<ConsentRecord | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ConsentRecord | null>(null);

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
    setSelected(rec);
  };

  const revoke = (rec: ConsentRecord) => {
    setConfirmRevoke(rec);
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    const { error } = await supabase
      .from('sms_consent')
      .update({ consent_given: false })
      .eq('id', confirmRevoke.id);
    if (error) {
      toast.error('Failed to revoke consent');
      return;
    }
    setRecords((prev) =>
      prev.map((r) =>
        r.id === confirmRevoke.id ? { ...r, consent_given: false } : r
      )
    );
    toast.success('Consent revoked');
    setConfirmRevoke(null);
  };

  const exportData = async () => {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-consent-data`;
    const response = await fetch(functionUrl, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) {
      toast.error('Failed to export consent data');
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
      <Toaster position="top-right" />
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
          onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'revoked')}
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
                    onClick={() => revoke(r)}
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
      {selected && (
        <Dialog.Root
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow focus:outline-none">
              <Dialog.Title className="font-bold mb-2">
                Consent Details
              </Dialog.Title>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Name:</span> {selected.full_name}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {selected.phone_number}
                </p>
                <p>
                  <span className="font-medium">Consent:</span>{' '}
                  {selected.consent_given ? 'yes' : 'no'}
                </p>
                <p>
                  <span className="font-medium">Created:</span> {selected.created_at}
                </p>
                {selected.ip_address && (
                  <p>
                    <span className="font-medium">IP:</span> {selected.ip_address}
                  </p>
                )}
                {selected.user_agent && (
                  <p>
                    <span className="font-medium">User Agent:</span> {selected.user_agent}
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Dialog.Close className="px-3 py-1 border rounded">
                  Close
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      {confirmRevoke && (
        <AlertDialog.Root
          open={!!confirmRevoke}
          onOpenChange={(open) => !open && setConfirmRevoke(null)}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow focus:outline-none">
              <AlertDialog.Title className="font-bold">
                Revoke Consent
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm">
                Are you sure you want to revoke consent for {confirmRevoke.full_name}?
              </AlertDialog.Description>
              <div className="mt-4 flex justify-end gap-2">
                <AlertDialog.Cancel className="px-3 py-1 border rounded">
                  Cancel
                </AlertDialog.Cancel>
                <AlertDialog.Action
                  onClick={handleRevoke}
                  className="px-3 py-1 border rounded bg-red-600 text-white"
                >
                  Revoke
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </div>
  );
}

