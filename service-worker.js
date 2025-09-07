const CACHE_NAME = 'eis-static-v3';
const ASSET_PATHS = [
  './index.html',
  './equipment-inspection-app.html',
  './inspection-checklist-dynamic.html',
  './supervisor-dashboard.html',
  './mobile.css',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];
const ASSETS = ASSET_PATHS.map((p) => new URL(p, self.location).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(
      () => self.clients.claim()
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  // For navigations: network-first, fallback to cached doc or index.html
  if (isDoc) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req);
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resp.clone()));
        return resp;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        return caches.match(new URL('./index.html', self.location).toString());
      }
    })());
    return;
  }

  // For other GET requests: cache-first, then network, then cached
  if (req.method === 'GET') {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resp.clone()));
        return resp;
      } catch {
        return cached;
      }
    })());
  }
});
