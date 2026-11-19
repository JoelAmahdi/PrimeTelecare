// Prime Telecare Service Worker for Offline Resilience
const CACHE_NAME = 'prime-telecare-cache-v6';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// Install Event - Precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial assets failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up all outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic caching with navigation fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests or browser extension schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Bypass API calls completely - NEVER cache API responses in Service Worker
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Bypass dev server internal assets, HMR, and vite requests
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/@id') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // Navigation requests: Network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached index.html for SPA routes
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) {
            return fallback;
          }
          return new Response(
            '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offline - Prime Telecare</title></head><body style="background:#022434;color:white;font-family:sans-serif;padding:32px;text-align:center;"><h2>You are currently offline</h2><p>Please check your internet connection.</p><button onclick="window.location.reload()" style="background:#77daa4;color:#022434;padding:12px 24px;border:none;border-radius:12px;font-weight:bold;margin-top:16px;cursor:pointer;">Retry Connection</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Static Assets (scripts, styles, images, fonts): Cache-first with background revalidation
  const isStaticAsset =
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('unsplash.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                // Do not cache HTML responses returned for missing JS/CSS assets
                const contentType = networkResponse.headers.get('content-type') || '';
                if ((url.pathname.endsWith('.js') && !contentType.includes('javascript')) ||
                    (url.pathname.endsWith('.css') && !contentType.includes('css'))) {
                  return;
                }
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch and store
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type') || '';
              if ((url.pathname.endsWith('.js') && !contentType.includes('javascript')) ||
                  (url.pathname.endsWith('.css') && !contentType.includes('css'))) {
                return networkResponse;
              }
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
          });
      })
    );
    return;
  }

  // Default Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// =========================================================================
// PUSH & PHONE SYSTEM NOTIFICATION HANDLING
// =========================================================================

// Handle Push Events from server
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    const text = event.data ? event.data.text() : 'You have a new telehealth update';
    data = { title: 'Prime Telecare', body: text };
  }

  const title = data.title || 'Prime Telecare Alert';
  const options = {
    body: data.body || 'New clinical update from Prime Telecare',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || `prime-notice-${Date.now()}`,
    data: data.data || { url: '/' },
    vibrate: data.vibrate || [200, 100, 200],
    requireInteraction: Boolean(data.requireInteraction),
    actions: data.actions || [],
    silent: Boolean(data.silent),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click & Action Buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const payload = event.notification.data || {};
  const targetUrl = payload.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing app window is open, focus it and dispatch notification action
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'PHONE_NOTIFICATION_CLICK',
            action,
            payload,
            tag: event.notification.tag,
          });
          return client;
        }
      }
      // 2. Otherwise open a new window to the target url
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl).then((newClient) => {
          if (newClient) {
            setTimeout(() => {
              newClient.postMessage({
                type: 'PHONE_NOTIFICATION_CLICK',
                action,
                payload,
                tag: event.notification.tag,
              });
            }, 1000);
          }
          return newClient;
        });
      }
    })
  );
});

// Handle Notification Close (dismissal)
self.addEventListener('notificationclose', (event) => {
  const payload = event.notification.data || {};
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({
        type: 'PHONE_NOTIFICATION_CLOSED',
        payload,
        tag: event.notification.tag,
      });
    }
  });
});
