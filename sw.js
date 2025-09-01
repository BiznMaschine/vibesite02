/**
 * Service Worker for KMU Software Audit Website
 * Provides caching for improved performance
 */

const CACHE_NAME = 'kmu-audit-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/main.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip external requests (except fonts)
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== location.origin && 
        !requestUrl.hostname.includes('fonts.googleapis.com') && 
        !requestUrl.hostname.includes('fonts.gstatic.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                if (response) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return response;
                }
                
                return fetch(event.request).then(function(response) {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(function() {
                // Fallback for offline
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for forms (future feature)
self.addEventListener('sync', function(event) {
    if (event.tag === 'contact-form') {
        event.waitUntil(
            // Handle offline form submissions
            console.log('Background sync: Contact form')
        );
    }
});

// Push notifications (future feature)
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/assets/icon-192x192.png',
                badge: '/assets/badge-72x72.png',
                tag: 'audit-notification'
            })
        );
    }
});

console.log('Service Worker: Registered successfully for KMU Software Audit Website');