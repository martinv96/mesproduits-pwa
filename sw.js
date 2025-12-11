// ========== CONFIGURATION ========== 
const CACHE_NAME = 'mesproduits-v1'; 
const STATIC_CACHE = 'static-v1'; 
const DYNAMIC_CACHE = 'dynamic-v1'; 
const STATIC_ASSETS = [ 
'/', 
    '/index.html', 
    '/style.css', 
    '/app.js', 
    '/manifest.json', 
    '/icons/icon-192.png', 
    '/icons/icon-512.png' 
]; 
 
// ========== INSTALLATION ========== 
self.addEventListener('install', event => { 
    console.log('[SW] Installation...'); 
     
    event.waitUntil( 
        caches.open(STATIC_CACHE) 
            .then(cache => { 
                console.log('[SW] Mise en cache des assets statiques'); 
                return cache.addAll(STATIC_ASSETS); 
            }) 
            .then(() => self.skipWaiting()) // Active immédiatement 
    ); 
}); 
 
// ========== ACTIVATION ========== 
self.addEventListener('activate', event => { 
    console.log('[SW] Activation...'); 
     
    event.waitUntil( 
        caches.keys() 
            .then(cacheNames => { 
                return Promise.all( 
                    cacheNames 
                        .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE) 
                        .map(name => { 
                            console.log('[SW] Suppression ancien cache:', name); 
                            return caches.delete(name); 
                        }) 
                ); 
            }) 
            .then(() => self.clients.claim()) // Prend le contrôle immédiatement
    ); 
}); 
 
// ========== STRATÉGIE DE FETCH ========== 
self.addEventListener('fetch', event => { 
    const { request } = event; 
     
    // Stratégie Cache First pour les assets statiques 
    if (STATIC_ASSETS.includes(new URL(request.url).pathname)) { 
        event.respondWith(cacheFirst(request)); 
    } 
    // Stratégie Network First pour le reste 
    else { 
        event.respondWith(networkFirst(request)); 
    } 
}); 
 
// ========== STRATÉGIES DE CACHE ========== 
 
// Cache First : Cherche d'abord dans le cache 
async function cacheFirst(request) { 
    const cachedResponse = await caches.match(request); 
    return cachedResponse || fetch(request); 
} 
 
// Network First : Cherche d'abord sur le réseau 
async function networkFirst(request) { 
    const cache = await caches.open(DYNAMIC_CACHE); 
     
    try { 
        const networkResponse = await fetch(request); 
        cache.put(request, networkResponse.clone()); 
        return networkResponse; 
    } catch (error) { 
        const cachedResponse = await cache.match(request); 
        return cachedResponse || Response.error(); 
    } 
} 