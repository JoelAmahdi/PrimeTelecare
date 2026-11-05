import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './firebase';
import { registerServiceWorker } from './serviceWorkerRegistration';
import { initializeOfflineStorage } from './utils/offlineDb';

// Register Service Worker for offline PWA capabilities
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      if (registration.active?.scriptURL.includes('?update=')) {
        registration.unregister();
      }
    }
  }).then(() => {
    registerServiceWorker();
  });
} else {
  registerServiceWorker();
}

// Pre-seed and warm up IndexedDB for instant offline access
initializeOfflineStorage().catch((err) => {
  console.warn('Failed to pre-seed offline storage:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

