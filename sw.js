// Service Worker - appProrrogas
// ✅ Mejora: Nombre congruente con la aplicación actual
const CACHE_NAME = 'prorrogas-v1';

// Solo archivos estáticos (el PWA shell)
const STATIC_ASSETS = [
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Instalación
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
});

// Activación
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    // Borrar historial / cachés viejos
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// Fetch inteligente
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // ❌ NO interceptar NADA de Apps Script
    if (url.hostname.includes('script.google.com')) {
        return;
    }

    // ❌ HTML siempre fresco directo de internet
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ✅ Cache con red fallback (Protegido)
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                // ✅ Mejora SUPER CRÍTICA: Impedir que se guarden en caché ERRORES 404 o caídas parciales
                // Solo si recibimos un éxito 200 guardamos la respuesta
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Guardar una copia sana en el caché antes de devolver el archivo al navegador
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
