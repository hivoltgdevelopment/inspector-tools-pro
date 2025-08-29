import React from 'react';

export default function OfflinePage() {
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h1 className="text-2xl font-bold">You’re offline</h1>
      <p className="text-gray-700">
        Some features may be unavailable without an internet connection. Any submissions you make will be queued and automatically sent when you reconnect.
      </p>
      <ul className="list-disc pl-5 text-gray-700">
        <li>Continue capturing photos and writing notes.</li>
        <li>Your uploads will sync when you’re back online.</li>
        <li>You can revisit this page at <code>/offline</code>.</li>
      </ul>
    </div>
  );
}

