// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 🔥 WAKE UP THE PWA ENGINE
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Start the service worker immediately so it caches the app
registerSW({ immediate: true });

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
