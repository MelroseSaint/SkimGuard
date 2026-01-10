import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

// Register service worker if available (mock implementation for this environment)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // In a real build, this would point to sw.js
    console.log('Service Worker registration skipped for this demo environment.');
  });
}