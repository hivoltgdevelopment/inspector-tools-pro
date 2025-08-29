import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  kind: 'success' | 'cancel';
};

export default function PaymentResult({ kind }: Props) {
  const isSuccess = kind === 'success';
  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow text-center space-y-4">
      <h1 className="text-2xl font-bold">
        {isSuccess ? 'Payment Successful' : 'Payment Canceled'}
      </h1>
      <p className="text-gray-700">
        {isSuccess
          ? 'Thank you! Your payment has been processed.'
          : 'Your payment was canceled. You can try again at any time.'}
      </p>
      <div>
        <Link to="/portal" className="px-4 py-2 rounded bg-blue-600 text-white">
          Go to Client Portal
        </Link>
      </div>
    </div>
  );
}

