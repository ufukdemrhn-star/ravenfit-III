// ════════════════════════════════════════════════════════════
//  sw.js — SERVICE WORKER (RavenFit2'de eksikti, şimdi var)
//  Uygulama kabuğunu önbelleğe alır → offline çalışır + kurulabilir PWA.
//  Yeni sürüm yayınlarken CACHE adındaki "v1"i artır (v2, v3...).
// ════════════════════════════════════════════════════════════

const CACHE = 'ravenfit3-skeleton-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './icon.png',
  './logo.png',
  './js/app.js',
  './js/state.js',
  './js/calc.js',
  './js/goals.js',
  './js/supplements.js',
  './js/profile.js',
  './js/ui.js',
  './js/selftest.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
