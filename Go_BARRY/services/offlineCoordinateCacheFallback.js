// Fallback offlineCoordinateCache implementation
// This is a safe no-op implementation that prevents errors

const noop = () => Promise.resolve({ success: false, reason: 'Module not loaded' });

const fallbackCache = {
  cacheOfflineCoordinates: noop,
  getOfflineCoordinates: () => Promise.resolve({ success: true, data: [] }),
  searchOfflineCoordinates: () => Promise.resolve([]),
  clearOfflineCache: noop,
  getCacheStats: () => Promise.resolve({ exists: false, count: 0, sizeKB: 0 }),
  syncOfflineCache: noop
};

export default fallbackCache;
