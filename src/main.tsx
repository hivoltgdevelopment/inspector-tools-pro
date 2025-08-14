import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SMSConsentForm from './components/SMSConsentForm';
import ConsentAdmin from './components/ConsentAdmin';
import SMSAuth from './components/SMSAuth';

function App() {
  return (
    <div className="p-4 space-y-4">
      <SMSConsentForm />
      <ConsentAdmin />
      <SMSAuth />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
