// Service Worker Registration for Prime Telecare Offline Resilience

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker.ready.catch(() => null);
  }
  return swRegistrationPromise;
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Wire up incoming messages from Service Worker (e.g. phone notification clicks & actions)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'PHONE_NOTIFICATION_CLICK') {
      window.dispatchEvent(
        new CustomEvent('phone-notification-clicked', {
          detail: {
            action: event.data.action,
            payload: event.data.payload,
            tag: event.data.tag,
          },
        })
      );
    } else if (event.data.type === 'PHONE_NOTIFICATION_CLOSED') {
      window.dispatchEvent(
        new CustomEvent('phone-notification-closed', {
          detail: {
            payload: event.data.payload,
            tag: event.data.tag,
          },
        })
      );
    }
  });

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
