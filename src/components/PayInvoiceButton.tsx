import React from 'react';

interface Props {
  reportId: string;
}

export default function PayInvoiceButton({ reportId }: Props) {
  const handlePay = async () => {
    const res = await fetch('/functions/create-payment-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId }),
    });
    // TODO: redirect to returned checkout URL once implemented
    if (res.ok) {
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    }
  };

  return (
    <button
      onClick={handlePay}
      className="mt-2 inline-block rounded bg-blue-600 px-3 py-1 text-white"
    >
      Pay invoice
    </button>
  );
}
