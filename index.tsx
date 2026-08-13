import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getLegacyHashRedirect } from './routing/legacyHashRedirect';

const legacyRedirect = getLegacyHashRedirect(window.location.href);
if (legacyRedirect) window.history.replaceState(null, '', legacyRedirect);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
