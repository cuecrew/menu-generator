const CACHE = 'thali-v3';
const STATIC = [
  '/menu-generator/',
  '/menu-generator/index.html',
  '/menu-generator/manifest.json',
  '/menu-generator/src/components.jsx',
  '/menu-generator/src/screens.jsx',
  '/menu-generator/src/app.jsx',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Data files: network first, fall back to cache
  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // App shell: network first for HTML, cache first for everything else
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/menu-generator/index.html')));
    return;
  }

  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
