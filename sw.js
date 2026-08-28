/* Service Worker – Anwesenheits-Dashboard
   Strategie:
   - HTML/Navigation und Bedienungsanleitung.pdf (unversioniert!): network-first
     (Updates sofort sichtbar), Offline-Fallback auf Cache bzw. index.html
   - übrige gleiche-Origin-Assets: stale-while-revalidate (Cache zuerst, im Hintergrund aktualisieren)
   Bei einem Release CACHE_NAME zusammen mit den Cache-Bustern in index.html erhöhen. */

const CACHE_NAME = 'homeoffice-v1.44';

const PRECACHE = [
    './',
    'index.html',
    'style.css?v=1.76',
    'app.js?v=1.155',
    'feiertage.js?v=2.0',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'Bedienungsanleitung.html',
    'Bedienungsanleitung.pdf'
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
    // Das PDF ist als einziger Asset unversioniert und würde bei
    // stale-while-revalidate beim ersten Öffnen nach einem Release die
    // Vorversion zeigen - daher network-first wie die Navigation.
    if (req.mode === 'navigate' || req.destination === 'document'
        || url.pathname.endsWith('/Bedienungsanleitung.pdf')) {
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
