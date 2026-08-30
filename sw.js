/* Service Worker – Anwesenheits-Dashboard
   Strategie:
   - Bedienungsanleitung.html: cache-first (offline-first) – ist via PRECACHE
     je Release gecacht und sofort auch ohne Netzverfügbarkeit einsehbar.
   - HTML/Navigation: network-first (Updates sofort sichtbar),
     Offline-Fallback auf Cache bzw. index.html
   - übrige gleiche-Origin-Assets: stale-while-revalidate (Cache zuerst, im Hintergrund aktualisieren)
   Bei einem Release CACHE_NAME zusammen mit den Cache-Bustern in index.html erhöhen. */

const CACHE_NAME = 'homeoffice-v2.26';

const PRECACHE = [
    './',
    'index.html',
    'style.css?v=2.28',
    'app.js?v=1.200',
    'feiertage.js?v=2.0',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'Bedienungsanleitung.html'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.all(PRECACHE.map(function (url) {
                return cache.add(new Request(url, { cache: 'reload' }));
            }));
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) {
                return k !== CACHE_NAME;
            }).map(function (k) {
                return caches.delete(k);
            }));
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (e) {
    const req = e.request;
    if (req.method !== 'GET') {
        return;
    }
    const url = new URL(req.url);
    // Bedienungsanleitung.html: cache-first (offline-first) – die gecachte
    // Version (via PRECACHE je Release) ist sofort auch ohne Netz verfügbar;
    // nur beim allerersten Öffnen ohne Cache-Hit wird das Netzwerk gefragt.
    if (url.pathname.endsWith('/Bedienungsanleitung.html')) {
        e.respondWith(
            caches.match(req).then(function (hit) {
                if (hit) return hit;
                return fetch(req).then(function (res) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(req, copy);
                    });
                    return res;
                });
            })
        );
        return;
    }
    if (req.mode === 'navigate' || req.destination === 'document') {
        e.respondWith(
            fetch(req).then(function (res) {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(req, copy);
                });
                return res;
            }).catch(function () {
                return caches.match(req).then(function (hit) {
                    return hit || caches.match('index.html');
                });
            })
        );
        return;
    }
    if (url.origin === self.location.origin) {
        e.respondWith(
            caches.match(req).then(function (hit) {
                const net = fetch(req).then(function (res) {
                    if (res && res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(req, copy);
                        });
                    }
                    return res;
                }).catch(function () {
                    return hit;
                });
                return hit || net;
            })
        );
    }
});
