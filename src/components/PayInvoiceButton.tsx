import React, { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  reportId: string;
}

export default function PayInvoiceButton({ reportId }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ reportId }),
          signal: ctrl.signal,
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const { url } = await res.json();
      if (!url) {
        throw new Error('Missing checkout URL');
      }
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create payment session', err);
      toast.error('Failed to initiate checkout. Please try again later.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="mt-2 inline-block rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
    >
      {loading ? 'Processing…' : 'Pay invoice'}
    </button>
  );
}
