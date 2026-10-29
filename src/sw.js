/* Service Worker der Lern-Wiki-App.
   App-Hülle: wird beim Installieren komplett gespeichert. VERSION ist eine Prüfsumme über alle Dateien,
   die tools/build.mjs einsetzt; ändert sich etwas, installiert das Handy die neue Hülle im Hintergrund
   und die Seite bietet "Neu laden" an.
   Artikel von GitHub (raw.githubusercontent.com): eigener Speicher, der App-Updates überlebt.
   Erst aus dem Speicher, im Hintergrund frisch holen. */
const VERSION = '/*VERSION*/';
const SHELL = 'lernwiki-shell-' + VERSION;
const ARTICLES = 'lernwiki-artikel-v1';
const PRECACHE = /*PRECACHE*/[];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('lernwiki-shell-') && k !== SHELL).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

async function fromShell(req){
  const hit = await caches.match(req, { cacheName: SHELL, ignoreSearch: true });
  return hit || fetch(req);
}

async function staleWhileRevalidate(req){
  const cache = await caches.open(ARTICLES);
  const hit = await cache.match(req);
  const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
  if (hit) return hit;
  const r = await net;
  return r || new Response('', { status: 504, statusText: 'offline' });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') e.respondWith(caches.match('./index.html', { cacheName: SHELL }).then(r => r || fetch(req)));
    else e.respondWith(fromShell(req));
    return;
  }
  if (url.hostname === 'raw.githubusercontent.com') e.respondWith(staleWhileRevalidate(req));
});
