const CACHE_NAME = 'healthchain-v1.2.0';
const STATIC_CACHE = 'healthchain-static-v1.2.0';
const DYNAMIC_CACHE = 'healthchain-dynamic-v1.2.0';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bmax',
  '/monitoring', 
  '/first-aid',
  '/login',
  '/assets/main.js',
  '/assets/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/auth/verify',
  '/api/health/vitals',
  '/api/blockchain/stats',
  '/api/database/health'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache First
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.includes('/assets/')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAsset(request));
  } else {
    // Navigation requests - Network First with offline fallback
    event.respondWith(handleNavigationRequest(request));
  }
});

// Network First strategy for API requests
async function handleApiRequest(request) {
  const cacheName = DYNAMIC_CACHE;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for health APIs
    if (request.url.includes('/api/health/') || request.url.includes('/api/vitals/')) {
      return new Response(JSON.stringify({
        offline: true,
        message: 'Health data unavailable offline',
        cachedData: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache First strategy for images
async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder image for offline
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#6b7280">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Cache First for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First for navigation with offline page fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 Navigation offline, serving cached version');
    
    // Try to get cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to cached index.html for SPA routing
    const indexCache = await caches.match('/index.html');
    if (indexCache) {
      return indexCache;
    }
    
    // Ultimate fallback - offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HealthChain - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 40px; text-align: center; background: #f8fafc; }
          .container { max-width: 400px; margin: 0 auto; }
          .icon { font-size: 48px; margin-bottom: 20px; }
          h1 { color: #1e293b; margin-bottom: 10px; }
          p { color: #64748b; line-height: 1.6; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🏥</div>
          <h1>HealthChain Offline</h1>
          <p>You're currently offline. Please check your internet connection and try again.</p>
          <p>Cached health data may still be available in the app.</p>
          <a href="/" class="btn" onclick="window.location.reload()">Retry</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background Sync for health data
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'health-data-sync') {
    event.waitUntil(syncHealthData());
  }
});

async function syncHealthData() {
  try {
    // Get pending health data from IndexedDB
    const pendingData = await getPendingHealthData();
    
    for (const data of pendingData) {
      await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    
    console.log('✅ Health data synced successfully');
    await clearPendingHealthData();
  } catch (error) {
    console.error('❌ Failed to sync health data:', error);
  }
}

// Push notifications for health alerts
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New health update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { url: '/monitoring' }
  };
  
  event.waitUntil(
    self.registration.showNotification('HealthChain Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Utility functions for IndexedDB operations
async function getPendingHealthData() {
  // Implementation would use IndexedDB to get pending sync data
  return [];
}

async function clearPendingHealthData() {
  // Implementation would clear synced data from IndexedDB
  return true;
}

// Periodic background sync for health monitoring
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'health-check') {
    event.waitUntil(performHealthCheck());
  }
});

async function performHealthCheck() {
  try {
    const response = await fetch('/api/health/status');
    const data = await response.json();
    
    if (data.alerts && data.alerts.length > 0) {
      // Show notification for health alerts
      await self.registration.showNotification('Health Alert', {
        body: `${data.alerts.length} new health alerts require attention`,
        icon: '/icons/icon-192x192.png',
        tag: 'health-alert'
      });
    }
  } catch (error) {
    console.log('Background health check failed:', error);
  }
}

console.log('🏥 HealthChain Service Worker loaded successfully');
