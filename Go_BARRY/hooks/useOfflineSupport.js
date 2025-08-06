import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Hook for managing service worker and offline functionality
 * Provides offline state detection, background sync, and cache management
 */
export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [cachedDataAge, setCachedDataAge] = useState(null);

  // Register service worker
  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });

        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('New Service Worker activated');
              
              // Notify user of update
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'ROADWORKS_UPDATED') {
            console.log('Roadworks data updated via background sync');
            setLastSyncTime(new Date());
            setSyncPending(false);
            
            // Dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('roadworks-updated', {
              detail: event.data.data
            }));
          }
        });

        setIsServiceWorkerReady(true);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleOnline = () => {
      console.log('Connection restored');
      setIsOnline(true);
      
      // Trigger background sync when coming online
      if ('sync' in registration) {
        registration.sync.register('roadworks-sync').then(() => {
          setSyncPending(true);
        });
      }
    };

    const handleOffline = () => {
      console.log('Connection lost - offline mode');
      setIsOnline(false);
    };

    // Initial state
    setIsOnline(navigator.onLine);

    // Add listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor cache freshness
  useEffect(() => {
    if (!isServiceWorkerReady) return;

    const checkCacheAge = async () => {
      try {
        const cache = await caches.open('roadworks-api-v2');
        const keys = await cache.keys();
        
        if (keys.length > 0) {
          const response = await cache.match(keys[0]);
          if (response) {
            const cachedAt = response.headers.get('sw-cached-at');
            if (cachedAt) {
              const age = Date.now() - new Date(cachedAt).getTime();
              setCachedDataAge(age);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check cache age:', error);
      }
    };

    checkCacheAge();
    const interval = setInterval(checkCacheAge, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isServiceWorkerReady]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!isServiceWorkerReady) return false;

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, [isServiceWorkerReady]);

  // Manually trigger roadworks cache
  const cacheRoadworks = useCallback(async () => {
    if (!isServiceWorkerReady) return false;

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            setLastSyncTime(new Date());
          }
          resolve(event.data.success);
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CACHE_ROADWORKS' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to cache roadworks:', error);
      return false;
    }
  }, [isServiceWorkerReady]);

  // Force service worker update
  const updateServiceWorker = useCallback(async () => {
    if (!isServiceWorkerReady) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }, [isServiceWorkerReady]);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    if (Platform.OS !== 'web' || !('caches' in window)) {
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const stats = {};

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        
        stats[name] = {
          count: keys.length,
          urls: keys.map(req => req.url)
        };
      }

      return stats;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }, []);

  // Format cache age for display
  const formatCacheAge = useCallback((ageMs) => {
    if (!ageMs) return 'Unknown';
    
    const minutes = Math.floor(ageMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isServiceWorkerReady,
    syncPending,
    lastSyncTime,
    cachedDataAge,
    formattedCacheAge: formatCacheAge(cachedDataAge),
    clearCache,
    cacheRoadworks,
    updateServiceWorker,
    getCacheStats
  };
};

export default useOfflineSupport;