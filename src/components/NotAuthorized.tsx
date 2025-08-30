import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function NotAuthorized() {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow text-center space-y-4" data-testid="notauth-container">
      <h1 className="text-2xl font-bold" data-testid="notauth-heading">Not Authorized</h1>
      <p className="text-gray-700">
        You don’t have permission to access this page with your current role.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/portal"
          className="px-4 py-2 rounded bg-blue-600 text-white"
          data-testid="notauth-portal-link"
        >
          Go to Client Portal
        </Link>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded border"
          data-testid="notauth-signout"
        >
          Sign out
        </button>
      </div>
      <p className="text-xs text-gray-500">
        If you think this is a mistake, contact your administrator.
      </p>
    </div>
  );
}
