// Upload pending assessments when online
async function uploadPendingAssessments() {/**
 * Breakdown Guide Service Worker
 * Phase 2: PWA Implementation with Offline Support
 * 
 * Features:
 * - Offline-first caching for critical resources
 * - Background sync for assessment uploads
 * - Strategic caching for different content types
 * - Network resilience and fallbacks
 */

const CACHE_NAME = 'breakdown-guide-v2.1.0';
const OFFLINE_PAGE = '/breakdown-guide/offline.html';
const API_CACHE = 'breakdown-api-cache-v1';
const IMAGES_CACHE = 'breakdown-images-cache-v1';

// Resources to cache immediately (app shell)
const CRITICAL_RESOURCES = [
    '/breakdown-guide/',
    '/breakdown-guide/index.html',
    '/breakdown-guide/mobile-demo.html',
    '/breakdown-guide/offline.html',
    '/breakdown-guide/components/common/MobileEnhancements.js',
    '/breakdown-guide/components/MobileIntegration.js',
    '/breakdown-guide/components/wizards/MobileSteeringWizard.js',
    '/breakdown-guide/components/wizards/MobileBrakesWizard.js',
    '/breakdown-guide/components/wizards/MobileGeneralAssessmentWizard.js',
    '/breakdown-guide/styles/main.css',
    'https://unpkg.com/react@18/umd/react.development.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://cdn.tailwindcss.com'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/fleet/vehicles',
    '/api/supervisors/auth',
    '/api/breakdown/priorities'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources
            caches.open(CACHE_NAME).then(cache => {
                console.log('📦 Caching critical resources');
                return cache.addAll(CRITICAL_RESOURCES.map(url => new Request(url, {
                    cache: 'reload'
                })));
            }),
            
            // Pre-cache API data
            caches.open(API_CACHE).then(cache => {
                console.log('🌐 Pre-caching API data');
                return Promise.allSettled(
                    API_ENDPOINTS.map(endpoint => 
                        fetch(endpoint)
                            .then(response => response.ok ? cache.put(endpoint, response.clone()) : null)
                            .catch(err => console.log(`❌ Failed to cache ${endpoint}:`, err))
                    )
                );
            })
        ]).then(() => {
            console.log('✅ Service Worker installation complete');
            // Skip waiting to activate immediately
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== API_CACHE && 
                            cacheName !== IMAGES_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Claim all clients
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activated and ready');
        })
    );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension URLs
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests with appropriate strategies
    if (isAPIRequest(url)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isImageRequest(url)) {
        event.respondWith(handleImageRequest(request));
    } else if (isCriticalResource(url)) {
        event.respondWith(handleCriticalResource(request));
    } else {
        event.respondWith(handleGeneralRequest(request));
    }
});

// Background sync event - upload pending assessments and photos
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'assessment-upload') {
        event.waitUntil(uploadPendingAssessments());
    } else if (event.tag === 'breakdown-sync') {
        event.waitUntil(syncBreakdownData());
    } else if (event.tag === 'photo-upload') {
        event.waitUntil(uploadPendingPhotos());
    }
});

// Push notification event (placeholder for future)
self.addEventListener('push', event => {
    console.log('📱 Push notification received:', event.data?.text());
    
    const options = {
        body: event.data?.text() || 'New breakdown alert',
        icon: '/breakdown-guide/icons/icon-192x192.png',
        badge: '/breakdown-guide/icons/badge-72x72.png',
        tag: 'breakdown-alert',
        actions: [
            {
                action: 'view',
                title: 'View Details',
                icon: '/breakdown-guide/icons/view-action.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/breakdown-guide/icons/dismiss-action.png'
            }
        ],
        data: {
            url: '/breakdown-guide/dashboard/',
            timestamp: Date.now()
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Breakdown Alert', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('👆 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Helper functions
function isAPIRequest(url) {
    return url.pathname.startsWith('/api/') || 
           url.hostname.includes('go-barry') ||
           url.pathname.includes('breakdown');
}

function isImageRequest(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
}

function isCriticalResource(url) {
    return CRITICAL_RESOURCES.some(resource => 
        url.pathname === new URL(resource, self.location).pathname
    );
}

// API Request Handler - Network first, cache fallback
async function handleAPIRequest(request) {
    const cache = await caches.open(API_CACHE);
    
    try {
        // Try network first for fresh data
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        // If network fails, try cache
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.log('🌐 Network failed, trying cache for:', request.url);
        
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cache, return offline response
        return new Response(JSON.stringify({
            error: 'Offline - data not available',
            offline: true,
            timestamp: Date.now()
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Image Request Handler - Cache first, network fallback
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGES_CACHE);
    
    // Try cache first for images
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.log('🖼️ Image failed to load:', request.url);
    }
    
    // Return placeholder image if available
    const placeholder = await cache.match('/breakdown-guide/icons/placeholder.png');
    if (placeholder) {
        return placeholder;
    }
    
    // Return SVG placeholder as last resort
    return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="#ccc"><rect width="100%" height="100%"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dy=".3em">Image Unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
    );
}

// Critical Resource Handler - Cache first
async function handleCriticalResource(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Always try cache first for critical resources
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // If not cached, fetch and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.log('💾 Critical resource failed:', request.url);
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
        const offlinePage = await cache.match(OFFLINE_PAGE);
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    return new Response('Resource unavailable offline', { status: 503 });
}

// General Request Handler - Network first
async function handleGeneralRequest(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            return networkResponse;
        }
    } catch (error) {
        console.log('🌐 General request failed:', request.url);
    }
    
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        const offlinePage = await cache.match(OFFLINE_PAGE);
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    return new Response('Content unavailable offline', { status: 503 });
}

// Upload pending photos when online
async function uploadPendingPhotos() {
    console.log('📤 Uploading pending photos...');
    
    try {
        // Get pending photos from IndexedDB
        const pendingPhotos = await getPendingPhotos();
        
        for (const photo of pendingPhotos) {
            try {
                const formData = new FormData();
                formData.append('photo', photo.blob, `${photo.id}.jpg`);
                formData.append('assessmentId', photo.assessmentId || '');
                formData.append('timestamp', photo.timestamp);
                formData.append('metadata', JSON.stringify(photo.metadata));
                
                const response = await fetch('/api/breakdown/photos', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    await markPhotoSynced(photo.id);
                    console.log('✅ Photo uploaded:', photo.id);
                } else {
                    console.log('❌ Photo upload failed:', photo.id);
                }
            } catch (error) {
                console.log('❌ Photo upload error:', error);
            }
        }
    } catch (error) {
        console.log('❌ Photo sync error:', error);
    }
}
    console.log('📤 Uploading pending assessments...');
    
    try {
        // Get pending assessments from IndexedDB
        const pendingAssessments = await getPendingAssessments();
        
        for (const assessment of pendingAssessments) {
            try {
                const response = await fetch('/api/breakdown/assessment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assessment.data)
                });
                
                if (response.ok) {
                    await removePendingAssessment(assessment.id);
                    console.log('✅ Assessment uploaded:', assessment.id);
                } else {
                    console.log('❌ Assessment upload failed:', assessment.id);
                }
            } catch (error) {
                console.log('❌ Assessment upload error:', error);
            }
        }
    } catch (error) {
        console.log('❌ Background sync error:', error);
    }
}

// Sync breakdown data
async function syncBreakdownData() {
    console.log('🔄 Syncing breakdown data...');
    
    try {
        // Sync latest breakdown data
        const response = await fetch('/api/breakdown/sync');
        if (response.ok) {
            const data = await response.json();
            
            // Update cache with fresh data
            const cache = await caches.open(API_CACHE);
            await cache.put('/api/breakdown/sync', new Response(JSON.stringify(data)));
            
            console.log('✅ Breakdown data synced');
        }
    } catch (error) {
        console.log('❌ Breakdown sync error:', error);
    }
}

// IndexedDB helpers (simplified - would use a proper DB library in production)
function getPendingAssessments() {
    return new Promise((resolve) => {
        // Placeholder - would use IndexedDB
        const stored = localStorage.getItem('pendingAssessments');
        resolve(stored ? JSON.parse(stored) : []);
    });
}

function removePendingAssessment(id) {
    return new Promise((resolve) => {
        // Placeholder - would use IndexedDB
        const stored = localStorage.getItem('pendingAssessments');
        const assessments = stored ? JSON.parse(stored) : [];
        const filtered = assessments.filter(a => a.id !== id);
        localStorage.setItem('pendingAssessments', JSON.stringify(filtered));
        resolve();
    });
}

// Photo sync helpers
function getPendingPhotos() {
    return new Promise((resolve) => {
        // Would use IndexedDB in production
        const stored = localStorage.getItem('pendingPhotos');
        resolve(stored ? JSON.parse(stored) : []);
    });
}

function markPhotoSynced(photoId) {
    return new Promise((resolve) => {
        // Would use IndexedDB in production
        const stored = localStorage.getItem('pendingPhotos');
        const photos = stored ? JSON.parse(stored) : [];
        const updated = photos.map(photo => 
            photo.id === photoId ? { ...photo, synced: true } : photo
        );
        localStorage.setItem('pendingPhotos', JSON.stringify(updated));
        resolve();
    });
}

console.log('🎯 Breakdown Guide Service Worker loaded');
