import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import InspectionForm from './components/InspectionForm';

function App() {
  return (
    <div className="p-4">
      <InspectionForm />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
