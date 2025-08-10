// Enhanced Service Worker for Go BARRY Breakdown Guide
// Version: 3.0.0 - Modern PWA with offline breakdown assessments

const CACHE_NAME = 'go-barry-breakdown-v3';
const BREAKDOWN_DATA_CACHE = 'breakdown-assessments-v1';
const FLEET_DATA_CACHE = 'fleet-database-v1';
const OFFLINE_CACHE = 'offline-pages-v1';

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  fleetData: 24 * 60 * 60 * 1000, // 24 hours
  assessments: 7 * 24 * 60 * 60 * 1000, // 7 days  
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  api: 60 * 60 * 1000 // 1 hour
};

// Critical assets for offline functionality
const CRITICAL_ASSETS = [
  '/breakdown-guide/index.html',
  '/breakdown-guide/index-modern.html',
  '/breakdown-guide/styles/main.css',
  '/gne-fleet-database.json',
  '/breakdown-guide/App.js',
  '/gobarry-logo.png'
];

// Wizard components for offline use
const WIZARD_ASSETS = [
  '/breakdown-guide/components/wizards/SteeringWizard.js',
  '/breakdown-guide/components/wizards/BrakesWizard.js',
  '/breakdown-guide/components/wizards/ABSLightWizard.js',
  '/breakdown-guide/components/wizards/BatteryWizard.js',
  '/breakdown-guide/components/wizards/DoorsWizard.js',
  '/breakdown-guide/components/wizards/NonStarterWizard.js'
];

// Core services for offline operation
const CORE_SERVICES = [
  '/breakdown-guide/supervisorBreakdownLogger.js',
  '/breakdown-guide/breakdown-analytics.js',
  '/breakdown-guide/services/fleetDatabase.js',
  '/breakdown-guide/components/SupervisorLogin.js',
  '/breakdown-guide/components/EnhancedFleetSelectionModal.js'
];

// Install event - Cache critical assets
self.addEventListener('install', (event) => {
  console.log('Installing Enhanced Service Worker v3.0');
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([...CRITICAL_ASSETS, ...WIZARD_ASSETS, ...CORE_SERVICES]);
      }),
      
      // Cache fleet database
      caches.open(FLEET_DATA_CACHE).then((cache) => {
        return cache.add('/gne-fleet-database.json');
      }),
      
      // Create offline assessment storage
      caches.open(BREAKDOWN_DATA_CACHE).then(() => {
        console.log('Breakdown data cache initialized');
      })
    ]).then(() => {
      console.log('All critical assets cached successfully');
      self.skipWaiting(); // Activate immediately
    }).catch((error) => {
      console.error('Failed to cache critical assets:', error);
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Activating Enhanced Service Worker v3.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== BREAKDOWN_DATA_CACHE && 
                cacheName !== FLEET_DATA_CACHE &&
                cacheName !== OFFLINE_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and ready');
      
      // Notify all clients about activation
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: '3.0',
            features: ['offline-assessments', 'background-sync', 'fleet-caching']
          });
        });
      });
    })
  );
});

// Fetch event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle different types of requests
  if (url.pathname.startsWith('/breakdown-guide/')) {
    event.respondWith(handleBreakdownGuideRequest(event.request));
  } else if (url.pathname === '/gne-fleet-database.json') {
    event.respondWith(handleFleetDatabaseRequest(event.request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  } else {
    event.respondWith(handleStaticAssetRequest(event.request));
  }
});

// Handle breakdown guide requests with fallback strategy
async function handleBreakdownGuideRequest(request) {
  try {
    // Try network first for HTML pages (to get updates)
    if (request.destination === 'document') {
      try {
        const networkResponse = await fetch(request, {
          cache: 'no-cache'
        });
        
        if (networkResponse.ok) {
          // Cache the updated version
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }
      } catch (networkError) {
        console.log('Network failed, trying cache for:', request.url);
      }
    }
    
    // Try cache first for other assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is fresh enough
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < CACHE_DURATIONS.static) {
          return cachedResponse;
        }
      }
    }
    
    // Try network if cache miss or stale
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = networkResponse.clone();
      
      // Add timestamp to cached response
      responseToCache.headers.append('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
      
      return networkResponse;
    }
    
    // Return cached version if network failed
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response(
      createOfflineFallback(request.url),
      {
        headers: {
          'Content-Type': 'text/html',
          'SW-Fallback': 'offline-page'
        }
      }
    );
    
  } catch (error) {
    console.error('Request failed:', request.url, error);
    
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Service Unavailable', { 
      status: 503,
      statusText: 'Service Worker Error'
    });
  }
}

// Handle fleet database requests with long-term caching
async function handleFleetDatabaseRequest(request) {
  try {
    // Try cache first (fleet data doesn't change often)
    const cachedResponse = await caches.match(request, {
      cacheName: FLEET_DATA_CACHE
    });
    
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATIONS.fleetData) {
        // Background update for next time
        fetch(request).then((response) => {
          if (response.ok) {
            const cache = caches.open(FLEET_DATA_CACHE);
            cache.then((c) => {
              const responseToCache = response.clone();
              responseToCache.headers.append('sw-cache-time', Date.now().toString());
              c.put(request, responseToCache);
            });
          }
        }).catch(() => {}); // Ignore background update errors
        
        return cachedResponse;
      }
    }
    
    // Fetch fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(FLEET_DATA_CACHE);
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
      
      return networkResponse;
    }
    
    // Return cached version if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error('Fleet database unavailable');
    
  } catch (error) {
    console.error('Fleet database request failed:', error);
    
    // Return minimal fleet data for offline operation
    return new Response(
      JSON.stringify({
        fleet: [],
        metadata: { 
          offline: true, 
          message: 'Limited offline functionality' 
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'SW-Fallback': 'offline-data'
        }
      }
    );
  }
}

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Different strategies for different APIs
  if (url.pathname.includes('/breakdown-')) {
    return handleBreakdownApiRequest(request);
  } else {
    return handleGenericApiRequest(request);
  }
}

// Handle breakdown-specific API requests
async function handleBreakdownApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Don't cache POST requests, but cache GET requests briefly
      if (request.method === 'GET') {
        const cache = await caches.open(CACHE_NAME);
        const responseToCache = networkResponse.clone();
        responseToCache.headers.append('sw-cache-time', Date.now().toString());
        cache.put(request, responseToCache);
      }
      
      return networkResponse;
    }
    
    throw new Error(`API returned ${networkResponse.status}`);
    
  } catch (error) {
    console.log('API request failed, checking for cached response:', request.url);
    
    // For GET requests, try to return cached data
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For offline POST requests (assessments), store for later sync
    if (request.method === 'POST') {
      return handleOfflineAssessment(request);
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: 'Service temporarily unavailable', 
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle offline assessment storage
async function handleOfflineAssessment(request) {
  try {
    const assessmentData = await request.json();
    
    // Store assessment for later sync
    const offlineAssessment = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: assessmentData,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    // Store in IndexedDB via cache API workaround
    const cache = await caches.open(BREAKDOWN_DATA_CACHE);
    const response = new Response(JSON.stringify(offlineAssessment));
    await cache.put(
      new Request(`/offline-assessments/${offlineAssessment.id}`),
      response
    );
    
    // Notify client about offline storage
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'ASSESSMENT_STORED_OFFLINE',
        assessmentId: offlineAssessment.id,
        data: assessmentData
      });
    });
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        offline: true,
        message: 'Assessment saved offline. Will sync when connection is restored.',
        assessmentId: offlineAssessment.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Failed to store offline assessment:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to save assessment offline',
        offline: true
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle generic API requests
async function handleGenericApiRequest(request) {
  // Network-first strategy with short-term caching
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Try cached version for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static asset requests
async function handleStaticAssetRequest(request) {
  // Cache-first strategy for static assets
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    return new Response('Resource not available offline', { 
      status: 404 
    });
  }
}

// Create offline fallback HTML
function createOfflineFallback(requestUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Go North East - Offline</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 20px; background: #f3f4f6; min-height: 100vh;
                display: flex; align-items: center; justify-content: center;
            }
            .container { 
                max-width: 400px; background: white; padding: 40px 30px; 
                border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;
            }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .logo .go { color: #1a2b5a; }
            .logo .ne { color: #ce0e2d; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #374151; margin-bottom: 16px; font-size: 20px; }
            p { color: #6b7280; line-height: 1.5; margin-bottom: 20px; }
            .retry-btn {
                background: #ce0e2d; color: white; border: none; padding: 12px 24px;
                border-radius: 6px; cursor: pointer; font-size: 16px; margin: 8px;
            }
            .retry-btn:hover { background: #b91c1c; }
            .secondary-btn {
                background: #f3f4f6; color: #374151; border: none; padding: 12px 24px;
                border-radius: 6px; cursor: pointer; font-size: 16px; margin: 8px;
            }
            .secondary-btn:hover { background: #e5e7eb; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="go">Go</span><span class="ne">NorthEast</span>
            </div>
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>The breakdown guide is available offline with limited functionality. You can still complete assessments and they'll sync when connection is restored.</p>
            <div>
                <button class="retry-btn" onclick="window.location.reload()">
                    Try Again
                </button>
                <button class="secondary-btn" onclick="window.location.href='/breakdown-guide/'">
                    Go to Breakdown Guide
                </button>
            </div>
        </div>
        
        <script>
            // Check for connection and auto-reload
            let retryCount = 0;
            function checkConnection() {
                if (navigator.onLine && retryCount < 3) {
                    retryCount++;
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }
            
            window.addEventListener('online', checkConnection);
            
            // Try to load breakdown guide in offline mode
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    // Check if breakdown guide is cached
                    caches.match('/breakdown-guide/index.html').then((response) => {
                        if (response) {
                            document.querySelector('.secondary-btn').style.display = 'inline-block';
                        }
                    });
                });
            }
        </script>
    </body>
    </html>
  `;
}

// Background sync for offline assessments
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-assessments') {
    event.waitUntil(syncOfflineAssessments());
  }
});

// Sync offline assessments when connection is restored
async function syncOfflineAssessments() {
  try {
    const cache = await caches.open(BREAKDOWN_DATA_CACHE);
    const requests = await cache.keys();
    
    const offlineAssessments = requests.filter(req => 
      req.url.includes('/offline-assessments/')
    );
    
    for (const request of offlineAssessments) {
      try {
        const response = await cache.match(request);
        const assessment = await response.json();
        
        if (!assessment.synced) {
          // Try to sync the assessment
          const syncResponse = await fetch(assessment.url, {
            method: assessment.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assessment.data)
          });
          
          if (syncResponse.ok) {
            // Mark as synced and notify client
            assessment.synced = true;
            await cache.put(request, new Response(JSON.stringify(assessment)));
            
            const clients = await self.clients.matchAll();
            clients.forEach((client) => {
              client.postMessage({
                type: 'ASSESSMENT_SYNCED',
                assessmentId: assessment.id,
                success: true
              });
            });
            
            console.log('Synced offline assessment:', assessment.id);
          }
        }
      } catch (syncError) {
        console.error('Failed to sync assessment:', syncError);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then((info) => {
        event.ports[0].postMessage(info);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'FORCE_SYNC':
      syncOfflineAssessments().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// Get cache information
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {
    version: '3.0',
    caches: cacheNames,
    totalSize: 0,
    offlineAssessments: 0
  };
  
  try {
    const cache = await caches.open(BREAKDOWN_DATA_CACHE);
    const requests = await cache.keys();
    info.offlineAssessments = requests.filter(req => 
      req.url.includes('/offline-assessments/')
    ).length;
  } catch (error) {
    console.error('Error getting cache info:', error);
  }
  
  return info;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('All caches cleared');
}