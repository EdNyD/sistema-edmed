// Service Worker - Sistema de Prórrogas UES
const CACHE_NAME = 'edmed-ues-v2';

// Al instalar: cachear solo la shell (index.html y assets locales)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
                './icon-192.png',
                './icon-512.png'
            ]);
        })
    );
    self.skipWaiting();
});

// Al activar: limpiar caches viejos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: servir desde cache si está disponible, si no desde la red
self.addEventListener('fetch', event => {
    // Solo cachear recursos locales (no la app de GAS)
    if (event.request.url.includes('script.google.com')) {
        return; // Dejar pasar sin interceptar
    }
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});

