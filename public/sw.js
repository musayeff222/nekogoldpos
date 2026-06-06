self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Active fetch handler passes requests through elegantly to keep app performance fast and dynamic.
  event.respondWith(fetch(event.request));
});
