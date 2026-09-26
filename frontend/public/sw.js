const CACHE_NAME = 'taskly-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  //console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        //console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS.filter(url => {
          // Only cache http/https URLs
          try {
            const testUrl = new URL(url, self.location.origin);
            return testUrl.protocol === 'http:' || testUrl.protocol === 'https:';
          } catch (e) {
            return false;
          }
        }));
      })
      .catch((error) => {
        //console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  //console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            //console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-http/https requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip chrome-extension and other unsupported schemes
  try {
    const url = new URL(event.request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return;
    }
  } catch (e) {
    return;
  }

  event.respondWith(
    cacheFirstStrategy(event.request)
  );
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  // Skip caching for unsupported schemes
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return fetch(request);
    }
  } catch (e) {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Additional check before caching
      try {
        const requestUrl = new URL(request.url);
        if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
        }
      } catch (cacheError) {
        //console.log('Failed to cache:', request.url, cacheError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    //console.log('Failed to fetch:', request.url);
    
    // Return a fallback response for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable</text></svg>',
        {
          headers: {
            'Content-Type': 'image/svg+xml'
          }
        }
      );
    }
    
    // For API requests, return a service unavailable response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Service temporarily unavailable',
            code: 'OFFLINE'
          }
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Sync offline data when connection is restored
    //console.log('Syncing offline data...');
    // Implementation would go here
  } catch (error) {
    //console.error('Sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: false,
      actions: []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});