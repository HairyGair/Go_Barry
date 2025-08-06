// Service Worker for Go BARRY App - Enhanced Offline Support
// Version: 2.0.0

const CACHE_NAME = 'go-barry-v2';
const ROADWORKS_CACHE = 'roadworks-api-v2';
const IMAGE_CACHE = 'images-v2';

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  roadworks: 30 * 60 * 1000, // 30 minutes
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  static: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Priority URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// API endpoints to cache
const API_ROUTES = [
  '/api/roadworks/unified',
  '/api/roadworks/search',
  '/api/alerts-enhanced',
  '/api/incidents'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { mode: 'no-cors' })))
        .catch(err => {
          console.warn('[SW] Failed to cache some static assets:', err);
        });
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== ROADWORKS_CACHE && name !== IMAGE_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle image requests
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isRoadworksApi = url.pathname.includes('/roadworks');
  const cacheName = isRoadworksApi ? ROADWORKS_CACHE : CACHE_NAME;
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      
      // Cache the response with timestamp
      const cache = await caches.open(cacheName);
      const cacheResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: new Headers(responseToCache.headers)
      });
      
      // Add custom headers for cache management
      cacheResponse.headers.set('sw-cached-at', new Date().toISOString());
      cacheResponse.headers.set('sw-cache-duration', CACHE_DURATIONS.roadworks.toString());
      
      await cache.put(request, cacheResponse);
      
      // If roadworks data, also update IndexedDB for better offline support
      if (isRoadworksApi && networkResponse.ok) {
        const data = await networkResponse.clone().json();
        await updateIndexedDB('roadworks', data);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, checking cache:', error);
    
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const cacheDuration = parseInt(cachedResponse.headers.get('sw-cache-duration') || '0');
      
      if (cachedAt && cacheDuration) {
        const age = Date.now() - new Date(cachedAt).getTime();
        
        if (age < cacheDuration) {
          console.log('[SW] Serving fresh cached response');
          
          // Clone and modify response to indicate it's from cache
          const response = new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: new Headers(cachedResponse.headers)
          });
          response.headers.set('X-SW-Cache', 'HIT');
          response.headers.set('X-SW-Cache-Age', age.toString());
          
          return response;
        }
      }
      
      console.log('[SW] Serving stale cached response');
      // Return stale cache but trigger background update
      triggerBackgroundSync(request.url);
      
      const response = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: new Headers(cachedResponse.headers)
      });
      response.headers.set('X-SW-Cache', 'STALE');
      
      return response;
    }
    
    // No cache available, try IndexedDB for roadworks
    if (isRoadworksApi) {
      const offlineData = await getFromIndexedDB('roadworks');
      if (offlineData) {
        console.log('[SW] Serving from IndexedDB');
        return new Response(JSON.stringify(offlineData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-SW-Cache': 'OFFLINE-DB'
          }
        });
      }
    }
    
    // Return offline fallback
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline - No cached data available',
      offline: true
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-SW-Cache': 'MISS'
      }
    });
  }
}

// Handle image requests with long-term caching
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Check cache first for images
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image if available
    return new Response('', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Handle static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first for static assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return app shell for navigation requests
    if (request.mode === 'navigate') {
      const appShell = await cache.match('/index.html');
      if (appShell) {
        return appShell;
      }
    }
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// IndexedDB operations for better offline support
const DB_NAME = 'GoBarryOffline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('roadworks')) {
        db.createObjectStore('roadworks', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function updateIndexedDB(store, data) {
  try {
    const db = await openDB();
    const transaction = db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);
    
    // Store with timestamp
    const dataWithMeta = {
      id: 'latest',
      data: data,
      timestamp: new Date().toISOString()
    };
    
    await objectStore.put(dataWithMeta);
  } catch (error) {
    console.error('[SW] IndexedDB update failed:', error);
  }
}

async function getFromIndexedDB(store) {
  try {
    const db = await openDB();
    const transaction = db.transaction([store], 'readonly');
    const objectStore = transaction.objectStore(store);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.get('latest');
      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] IndexedDB read failed:', error);
    return null;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'roadworks-sync') {
    event.waitUntil(syncRoadworks());
  }
});

async function syncRoadworks() {
  try {
    // Get queued actions from IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['sync-queue'], 'readonly');
    const objectStore = transaction.objectStore('sync-queue');
    
    const allRequests = await new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Process each queued request
    for (const queuedRequest of allRequests) {
      try {
        const response = await fetch(queuedRequest.url, {
          method: queuedRequest.method,
          headers: queuedRequest.headers,
          body: queuedRequest.body
        });
        
        if (response.ok) {
          // Remove from queue on success
          const deleteTransaction = db.transaction(['sync-queue'], 'readwrite');
          await deleteTransaction.objectStore('sync-queue').delete(queuedRequest.id);
        }
      } catch (error) {
        console.error('[SW] Sync failed for request:', error);
      }
    }
    
    // Refresh roadworks data
    const response = await fetch('/api/roadworks/unified?limit=50');
    if (response.ok) {
      const data = await response.json();
      await updateIndexedDB('roadworks', data);
      
      // Notify clients of update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'ROADWORKS_UPDATED',
          data: data
        });
      });
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Trigger background sync
function triggerBackgroundSync(url) {
  if ('sync' in self.registration) {
    self.registration.sync.register('roadworks-sync').catch(err => {
      console.error('[SW] Background sync registration failed:', err);
    });
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'CACHE_ROADWORKS') {
    event.waitUntil(
      fetch('/api/roadworks/unified?limit=50').then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch roadworks');
      }).then(data => {
        return updateIndexedDB('roadworks', data);
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }
});

console.log('[SW] Service Worker loaded');