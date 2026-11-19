importScripts('db.js');

const CACHE = 'studio-shell-v2';
const SHELL = ['./', 'index.html', 'db.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Images shared into the app from Android's share sheet.
  if (e.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      const form = await e.request.formData();
      for (const f of form.getAll('images')) {
        if (f && f.type && f.type.startsWith('image/')) await addImage(f);
      }
      return Response.redirect('./?view=gallery', 303);
    })());
    return;
  }

  // App shell: cache first, only for our own files.
  if (e.request.method === 'GET' && url.origin === location.origin) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || fetch(e.request)));
  }
});
