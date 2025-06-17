// tile-cache-worker.js
// Service Worker for Go BARRY tile caching to reduce TomTom API costs

const CACHE_NAME = 'go-barry-tiles-v1';
const TILE_CACHE_EXPIRY = {
  baseTiles: 24 * 60 * 60 * 1000, // 24 hours
  trafficTiles: 5 * 60 * 1000,    // 5 minutes  
  infrastructureTiles: 60 * 60 * 1000, // 1 hour
  roadworksTiles: 2 * 60 * 60 * 1000   // 2 hours
};

// Install event
self.addEventListener('install', (event) => {
  console.log('📦 Go BARRY tile cache worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Go BARRY tile cache worker activated');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('go-barry-tiles-v') && cacheName !== CACHE_NAME) {
            console.log('🧹 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event with intelligent caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache TomTom API requests
  if (!url.hostname.includes('tomtom.com')) {
    return;
  }
  
  // Determine cache strategy based on tile type
  const cacheStrategy = getCacheStrategy(url.pathname);
  
  if (cacheStrategy) {
    event.respondWith(handleTileRequest(event.request, cacheStrategy));
  }
});

// Determine cache strategy based on URL pattern
function getCacheStrategy(pathname) {
  if (pathname.includes('/maps-sdk') || pathname.includes('/basic-main')) {
    return {
      strategy: 'cache-first',
      maxAge: TILE_CACHE_EXPIRY.baseTiles,
      name: 'base-tiles'
    };
  }
  
  if (pathname.includes('/traffic/map/4/tile/flow')) {
    return {
      strategy: 'network-first',
      maxAge: TILE_CACHE_EXPIRY.trafficTiles,
      name: 'traffic-flow'
    };
  }
  
  if (pathname.includes('/traffic/map/4/tile/incidents')) {
    return {
      strategy: 'network-first', 
      maxAge: TILE_CACHE_EXPIRY.trafficTiles,
      name: 'traffic-incidents'
    };
  }
  
  if (pathname.includes('/traffic/map/4/tile/roadworks')) {
    return {
      strategy: 'stale-while-revalidate',
      maxAge: TILE_CACHE_EXPIRY.roadworksTiles,
      name: 'roadworks'
    };
  }
  
  if (pathname.includes('/traffic/map/4/tile/speedcams')) {
    return {
      strategy: 'cache-first',
      maxAge: TILE_CACHE_EXPIRY.infrastructureTiles,
      name: 'speed-cameras'
    };
  }
  
  return null;
}

// Handle tile requests with appropriate caching strategy
async function handleTileRequest(request, cacheStrategy) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still valid
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('cached-date') || 0);
    const isExpired = Date.now() - cachedDate.getTime() > cacheStrategy.maxAge;
    
    if (!isExpired) {
      console.log(`📦 Serving ${cacheStrategy.name} tile from cache`);
      return cachedResponse;
    }
  }
  
  // Handle different cache strategies
  switch (cacheStrategy.strategy) {
    case 'cache-first':
      return handleCacheFirst(request, cache, cacheStrategy);
      
    case 'network-first':
      return handleNetworkFirst(request, cache, cacheStrategy);
      
    case 'stale-while-revalidate':
      return handleStaleWhileRevalidate(request, cache, cacheStrategy, cachedResponse);
      
    default:
      return fetch(request);
  }
}

// Cache-first strategy (for base tiles, speed cameras)
async function handleCacheFirst(request, cache, cacheStrategy) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log(`📦 Cache hit for ${cacheStrategy.name}`);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and add cache headers
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('cached-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
      console.log(`💾 Cached new ${cacheStrategy.name} tile`);
    }
    
    return networkResponse;
  } catch (error) {
    console.error(`❌ Network error for ${cacheStrategy.name}:`, error);
    return cachedResponse || new Response('Network error', { status: 504 });
  }
}

// Network-first strategy (for traffic flow, incidents)  
async function handleNetworkFirst(request, cache, cacheStrategy) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('cached-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
      console.log(`🔄 Updated ${cacheStrategy.name} tile cache`);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`⚠️ Network failed for ${cacheStrategy.name}, serving from cache`);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error', { status: 504 });
  }
}

// Stale-while-revalidate strategy (for roadworks)
async function handleStaleWhileRevalidate(request, cache, cacheStrategy, cachedResponse) {
  // Serve stale content immediately if available
  const responsePromise = cachedResponse || fetch(request);
  
  // Update cache in background
  fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers);
      headers.set('cached-date', new Date().toISOString());
      
      const cachedResponse = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
      console.log(`🔄 Background updated ${cacheStrategy.name} tile`);
    }
  }).catch(error => {
    console.warn(`⚠️ Background update failed for ${cacheStrategy.name}:`, error);
  });
  
  return responsePromise;
}

// Clean up old cache entries periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupOldCacheEntries();
  }
});

async function cleanupOldCacheEntries() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  let cleanedCount = 0;
  
  for (const request of requests) {
    const response = await cache.match(request);
    const cachedDate = new Date(response.headers.get('cached-date') || 0);
    const maxAge = getMaxAgeForRequest(request.url);
    
    if (Date.now() - cachedDate.getTime() > maxAge) {
      await cache.delete(request);
      cleanedCount++;
    }
  }
  
  console.log(`🧹 Cleaned ${cleanedCount} expired tiles from cache`);
}

function getMaxAgeForRequest(url) {
  const pathname = new URL(url).pathname;
  
  if (pathname.includes('/traffic/map/4/tile/flow') || pathname.includes('/incidents')) {
    return TILE_CACHE_EXPIRY.trafficTiles;
  }
  if (pathname.includes('/roadworks')) {
    return TILE_CACHE_EXPIRY.roadworksTiles;
  }
  if (pathname.includes('/speedcams')) {
    return TILE_CACHE_EXPIRY.infrastructureTiles;
  }
  
  return TILE_CACHE_EXPIRY.baseTiles;
}
