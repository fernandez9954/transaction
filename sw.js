const CACHE_NAME = 's24-offline-cache';
const ASSETS = [
  './',
  './boa',
  './boa.html',
  './manifest.json',
  './css/styles.css',
  './js/theme.js',
  './js/template-data.js',
  './js/main.js',
  './img/template.png',
  './img/icon-192.png',
  './img/icon-512.png'
];

// 1. Install & take over immediately without waiting for tabs to close
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Claim clients immediately and purge all legacy versioned caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        );
      })
    ])
  );
});

// 3. Network-First with automatic cache updating
// Always pulls the latest changes when online; falls back to cache when offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});

// 4. Listen for Cloudflare scheduled reminders (Push notifications)
self.addEventListener('push', (e) => {
  const options = {
    body: "Don't forget to submit your S-24 record today!",
    icon: './img/icon-192.png',
    badge: './img/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: './' }
  };
  
  e.waitUntil(
    self.registration.showNotification('S24 Reminder', options)
  );
});

// 5. Open app when notification is clicked
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});