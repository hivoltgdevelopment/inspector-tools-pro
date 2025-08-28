import React, { useState } from 'react';
import { isValidPhone } from '@/lib/phone';

export default function SMSConsentForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!consent) {
      setError('You must explicitly consent to receive SMS messages.');
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number in E.164 format.');
      return;
    }

    setLoading(true);
    const record = {
      name,
      phone,
      consent: true,
      timestamp: new Date().toISOString(),
    };

    // Persist locally for audit trail
    try {
      const existing = JSON.parse(localStorage.getItem('sms_consent_records') || '[]');
      existing.push(record);
      localStorage.setItem('sms_consent_records', JSON.stringify(existing));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to store consent locally.';
      setError(message);
    }

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-sms-consent`;
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ name, phone, consent: true }),
      });
      if (!res.ok) {
        throw new Error('Failed to save consent.');
      }
      setSuccess('Consent recorded successfully.');
      setName('');
      setPhone('');
      setConsent(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save consent.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 space-y-4 max-w-sm">
      <h2 className="font-bold">SMS Consent Form</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="consent-name" className="sr-only">Full name</label>
        <input
          id="consent-name"
          type="text"
          placeholder="Full name"
          aria-label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <label htmlFor="consent-phone" className="sr-only">Phone number</label>
        <input
          id="consent-phone"
          type="tel"
          placeholder="Phone number"
          aria-label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>I agree to receive SMS messages from Inspector Tools Pro.</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
      {success && <p aria-live="polite" className="text-green-600 text-sm">{success}</p>}
      </div>
  );
}
