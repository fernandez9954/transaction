const CACHE_NAME = 's24-cache-v1';
const ASSETS = [
  './',
  './template.png',
  './manifest.json'
];

// 1. Cache assets on install for offline use
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Clean up old caches if we update the app
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. Serve files from cache when offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// 4. Listen for Cloudflare scheduled reminders (Push notifications)
self.addEventListener('push', (e) => {
  const options = {
    body: "Don't forget to submit your S-24 record today!",
    icon: './icon-192.png',
    badge: './icon-192.png',
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