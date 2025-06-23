// Optimized alert processing with memory efficiency
import { processInChunks, memoizeWithExpiry, throttle } from './performance';

/**
 * Efficient alert deduplication using Set for O(1) lookups
 */
export const deduplicateAlerts = memoizeWithExpiry((alerts) => {
  const seen = new Set();
  const uniqueAlerts = [];
  
  for (const alert of alerts) {
    const key = `${alert.location}-${alert.title}-${alert.severity}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAlerts.push(alert);
    }
  }
  
  return uniqueAlerts;
}, 30000); // Cache for 30 seconds

/**
 * Process alerts in chunks to avoid memory spikes
 */
export const processAlerts = async (alerts, batchSize = 50) => {
  return processInChunks(alerts, batchSize, async (chunk) => {
    return chunk.map(alert => ({
      ...alert,
      // Only include essential fields to reduce memory
      id: alert.alertId || alert.id,
      title: alert.title || 'Traffic Alert',
      location: alert.location || 'Unknown',
      severity: alert.severity || 'medium',
      timestamp: alert.timestamp,
      coordinates: alert.coordinates,
      affectsRoutes: alert.affectsRoutes || [],
      source: alert.source,
      // Remove unused fields
      _raw: undefined,
      _metadata: undefined,
    }));
  });
};

/**
 * Efficient route matching with early exit
 */
export const findAffectedRoutes = (alert, routes) => {
  const affectedRoutes = [];
  const alertLower = alert.location?.toLowerCase() || '';
  
  for (const route of routes) {
    // Early exit if we've found enough matches
    if (affectedRoutes.length >= 10) break;
    
    const routeLower = route.description?.toLowerCase() || '';
    if (routeLower.includes(alertLower) || alertLower.includes(routeLower)) {
      affectedRoutes.push(route.routeId);
    }
  }
  
  return affectedRoutes;
};

/**
 * Throttled alert updates to prevent UI lag
 */
export const createAlertUpdater = (updateCallback, delay = 500) => {
  return throttle(updateCallback, delay);
};

/**
 * Memory-efficient alert filtering
 */
export const filterAlertsBySeverity = (alerts, severity) => {
  if (severity === 'all') return alerts;
  
  // Use filter with early return for efficiency
  return alerts.filter(alert => {
    if (!alert) return false;
    
    switch (severity) {
      case 'critical':
        return alert.severity === 'high' || alert.priority === 'IMMEDIATE';
      case 'high':
        return alert.severity === 'medium' || alert.priority === 'URGENT';
      case 'medium':
        return alert.severity === 'low' || alert.priority === 'MONITOR';
      default:
        return true;
    }
  });
};

/**
 * Optimize coordinate arrays for map rendering
 */
export const optimizeCoordinates = (alerts) => {
  return alerts.map(alert => {
    if (!alert.coordinates) return alert;
    
    // Ensure coordinates are numbers and limited precision
    const coords = Array.isArray(alert.coordinates) 
      ? alert.coordinates 
      : [alert.coordinates.lat || alert.coordinates.latitude, 
         alert.coordinates.lng || alert.coordinates.longitude];
    
    return {
      ...alert,
      coordinates: coords.map(c => 
        typeof c === 'number' ? parseFloat(c.toFixed(6)) : null
      ).filter(Boolean)
    };
  });
};

/**
 * Batch API calls for better performance
 */
export class BatchAPIClient {
  constructor(baseURL, batchSize = 10, delay = 100) {
    this.baseURL = baseURL;
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.processing = false;
  }
  
  async add(endpoint, params) {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpoint, params, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      try {
        const results = await Promise.all(
          batch.map(({ endpoint, params }) => 
            fetch(`${this.baseURL}${endpoint}`, params).then(r => r.json())
          )
        );
        
        batch.forEach((item, index) => {
          item.resolve(results[index]);
        });
      } catch (error) {
        batch.forEach(item => item.reject(error));
      }
      
      // Small delay between batches
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}

/**
 * Virtual scrolling helper for large alert lists
 */
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e) => setScrollTop(e.nativeEvent.contentOffset.y),
  };
};