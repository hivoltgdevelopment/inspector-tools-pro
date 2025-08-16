import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isValidPhone } from '@/lib/phone';

export default function SMSAuth() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<'phone' | 'otp' | 'success'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordConsentAndSend = async () => {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-sms-consent`;
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone, consent: true }),
    });
    if (!res.ok) {
      throw new Error('Failed to record consent');
    }
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      throw error;
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError('You must consent to receive SMS messages.');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number in E.164 format.');
      return;
    }
    setLoading(true);
    try {
      await recordConsentAndSend();
      setStage('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) {
        throw error;
      }
      setStage('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 space-y-4 max-w-sm">
      <h2 className="font-bold">SMS Authentication</h2>

      {stage === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-2">
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded p-2"
          />
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>I consent to receive SMS verification codes.</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>
      )}

      {stage === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-2">
          <input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {stage === 'success' && (
        <p className="text-green-600">Phone number verified!</p>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
