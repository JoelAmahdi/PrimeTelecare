// Service Worker Registration for Prime Telecare Offline Resilience

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // We must register the SW even in dev so the browser updates to the latest sw.js
  // (which contains the bypass logic for Vite). The new sw.js will call skipWaiting.
  // We can unregister it after registering if we really want to, but it's better
  // to just let it update.
  const isDev = Boolean((import.meta as any).env?.DEV);
  
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered successfully with scope:', registration.scope);

        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[SW] New content available; please refresh.');
              } else {
                console.log('[SW] Content is cached for offline use.');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
