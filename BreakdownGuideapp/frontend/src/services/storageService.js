/**
 * Storage Service for Go North East Breakdown Management System
 * Handles local storage for offline capability, caching, and user preferences
 */

class StorageService {
  constructor() {
    this.STORAGE_KEYS = {
      BREAKDOWN_DRAFT: 'gne_breakdown_draft',
      FREQUENT_ROUTES: 'gne_frequent_routes',
      CACHED_BREAKDOWNS: 'gne_cached_breakdowns',
      ACTIVITY_FEED: 'gne_activity_feed',
      USER_PREFERENCES: 'gne_user_preferences',
      RECENT_LOCATIONS: 'gne_recent_locations',
      RECENT_FLEET_NUMBERS: 'gne_recent_fleet',
      SESSION_DATA: 'gne_session_data',
      ROUTE_CACHE: 'gne_route_cache'
    };
    
    // Initialize storage if needed
    this.initializeStorage();
  }

  /**
   * Initialize storage with default values if empty
   */
  initializeStorage() {
    if (!this.getFrequentRoutes().length) {
      // Default frequent routes for Go North East
      const defaultRoutes = [
        { id: 'X10', name: 'X10 - Newcastle to Middlesbrough', count: 0 },
        { id: '21', name: '21 - Newcastle to Durham', count: 0 },
        { id: '56', name: '56 - Sunderland to Newcastle', count: 0 },
        { id: 'X1', name: 'X1 - Newcastle to Washington', count: 0 },
        { id: '309', name: '309 - Newcastle to Blyth', count: 0 },
        { id: '310', name: '310 - Newcastle to North Shields', count: 0 }
      ];
      localStorage.setItem(this.STORAGE_KEYS.FREQUENT_ROUTES, JSON.stringify(defaultRoutes));
    }
  }

  // ============================================
  // BREAKDOWN DRAFT MANAGEMENT
  // ============================================

  /**
   * Save breakdown draft (in case of connection loss)
   */
  saveDraft(breakdownData) {
    try {
      const draft = {
        ...breakdownData,
        savedAt: new Date().toISOString(),
        version: 1
      };
      localStorage.setItem(this.STORAGE_KEYS.BREAKDOWN_DRAFT, JSON.stringify(draft));
      return { success: true };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { success: false, error };
    }
  }

  /**
   * Get saved draft
   */
  getDraft() {
    try {
      const draft = localStorage.getItem(this.STORAGE_KEYS.BREAKDOWN_DRAFT);
      if (!draft) return null;
      
      const parsed = JSON.parse(draft);
      
      // Check if draft is older than 24 hours
      const draftAge = Date.now() - new Date(parsed.savedAt).getTime();
      if (draftAge > 86400000) { // 24 hours in milliseconds
        this.clearDraft();
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  }

  /**
   * Clear saved draft
   */
  clearDraft() {
    localStorage.removeItem(this.STORAGE_KEYS.BREAKDOWN_DRAFT);
  }

  /**
   * Check if draft exists
   */
  hasDraft() {
    return this.getDraft() !== null;
  }

  // ============================================
  // FREQUENT ROUTES MANAGEMENT
  // ============================================

  /**
   * Update frequently used routes (for quick buttons)
   */
  updateFrequentRoutes(routeNumber, routeName = '') {
    try {
      let routes = this.getFrequentRoutes();
      
      // Find or create route entry
      const routeIndex = routes.findIndex(r => r.id === routeNumber);
      
      if (routeIndex >= 0) {
        routes[routeIndex].count++;
        routes[routeIndex].lastUsed = new Date().toISOString();
        if (routeName) routes[routeIndex].name = routeName;
      } else {
        routes.push({
          id: routeNumber,
          name: routeName || `Route ${routeNumber}`,
          count: 1,
          lastUsed: new Date().toISOString()
        });
      }
      
      // Sort by count (most used first) and keep top 12
      routes.sort((a, b) => b.count - a.count);
      routes = routes.slice(0, 12);
      
      localStorage.setItem(this.STORAGE_KEYS.FREQUENT_ROUTES, JSON.stringify(routes));
      return routes;
    } catch (error) {
      console.error('Error updating frequent routes:', error);
      return this.getFrequentRoutes();
    }
  }

  /**
   * Get frequently used routes
   */
  getFrequentRoutes() {
    try {
      const routes = localStorage.getItem(this.STORAGE_KEYS.FREQUENT_ROUTES);
      return routes ? JSON.parse(routes) : [];
    } catch (error) {
      console.error('Error getting frequent routes:', error);
      return [];
    }
  }

  /**
   * Get top N frequent routes for quick buttons
   */
  getTopRoutes(limit = 6) {
    const routes = this.getFrequentRoutes();
    return routes
      .filter(r => r.count > 0)
      .slice(0, limit)
      .map(r => r.id);
  }

  // ============================================
  // BREAKDOWN CACHE MANAGEMENT
  // ============================================

  /**
   * Cache breakdowns for offline access
   */
  cacheBreakdowns(breakdowns) {
    try {
      const cache = {
        data: breakdowns,
        cachedAt: new Date().toISOString(),
        count: breakdowns.length
      };
      localStorage.setItem(this.STORAGE_KEYS.CACHED_BREAKDOWNS, JSON.stringify(cache));
      return { success: true, count: breakdowns.length };
    } catch (error) {
      console.error('Error caching breakdowns:', error);
      // If storage is full, try to clear old data
      if (error.name === 'QuotaExceededError') {
        this.clearOldCache();
        try {
          localStorage.setItem(this.STORAGE_KEYS.CACHED_BREAKDOWNS, JSON.stringify(cache));
          return { success: true, count: breakdowns.length };
        } catch (retryError) {
          return { success: false, error: retryError };
        }
      }
      return { success: false, error };
    }
  }

  /**
   * Get cached breakdowns
   */
  getCachedBreakdowns() {
    try {
      const cache = localStorage.getItem(this.STORAGE_KEYS.CACHED_BREAKDOWNS);
      if (!cache) return [];
      
      const { data, cachedAt } = JSON.parse(cache);
      
      // Only use cache if less than 1 hour old
      const cacheAge = Date.now() - new Date(cachedAt).getTime();
      if (cacheAge > 3600000) { // 1 hour
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error getting cached breakdowns:', error);
      return [];
    }
  }

  // ============================================
  // ACTIVITY FEED MANAGEMENT
  // ============================================

  /**
   * Save activity feed items
   */
  saveActivityFeed(activities) {
    try {
      const feed = {
        items: activities,
        updatedAt: new Date().toISOString()
      };
      sessionStorage.setItem(this.STORAGE_KEYS.ACTIVITY_FEED, JSON.stringify(feed));
      return { success: true };
    } catch (error) {
      console.error('Error saving activity feed:', error);
      return { success: false, error };
    }
  }

  /**
   * Get activity feed items
   */
  getActivityFeed() {
    try {
      const feed = sessionStorage.getItem(this.STORAGE_KEYS.ACTIVITY_FEED);
      if (!feed) return [];
      
      const { items, updatedAt } = JSON.parse(feed);
      
      // Only use feed if less than 10 minutes old
      const feedAge = Date.now() - new Date(updatedAt).getTime();
      if (feedAge > 600000) { // 10 minutes
        return [];
      }
      
      return items;
    } catch (error) {
      console.error('Error getting activity feed:', error);
      return [];
    }
  }

  /**
   * Add item to activity feed
   */
  addActivityItem(item) {
    const feed = this.getActivityFeed();
    feed.unshift(item); // Add to beginning
    
    // Keep only last 50 items
    const trimmedFeed = feed.slice(0, 50);
    this.saveActivityFeed(trimmedFeed);
    
    return trimmedFeed;
  }

  // ============================================
  // RECENT LOCATIONS MANAGEMENT
  // ============================================

  /**
   * Save recent breakdown locations for quick selection
   */
  saveRecentLocation(location) {
    try {
      let locations = this.getRecentLocations();
      
      // Remove if exists and add to front
      locations = locations.filter(l => l.description !== location.description);
      locations.unshift({
        description: location.description,
        coordinates: location.coordinates,
        usedAt: new Date().toISOString()
      });
      
      // Keep only last 10
      locations = locations.slice(0, 10);
      
      localStorage.setItem(this.STORAGE_KEYS.RECENT_LOCATIONS, JSON.stringify(locations));
      return locations;
    } catch (error) {
      console.error('Error saving recent location:', error);
      return [];
    }
  }

  /**
   * Get recent locations
   */
  getRecentLocations() {
    try {
      const locations = localStorage.getItem(this.STORAGE_KEYS.RECENT_LOCATIONS);
      return locations ? JSON.parse(locations) : [];
    } catch (error) {
      console.error('Error getting recent locations:', error);
      return [];
    }
  }

  // ============================================
  // RECENT FLEET NUMBERS MANAGEMENT
  // ============================================

  /**
   * Save recently used fleet numbers
   */
  saveRecentFleetNumber(fleetNumber) {
    try {
      let fleetNumbers = this.getRecentFleetNumbers();
      
      // Remove if exists and add to front
      fleetNumbers = fleetNumbers.filter(f => f !== fleetNumber);
      fleetNumbers.unshift(fleetNumber);
      
      // Keep only last 20
      fleetNumbers = fleetNumbers.slice(0, 20);
      
      localStorage.setItem(this.STORAGE_KEYS.RECENT_FLEET_NUMBERS, JSON.stringify(fleetNumbers));
      return fleetNumbers;
    } catch (error) {
      console.error('Error saving recent fleet number:', error);
      return [];
    }
  }

  /**
   * Get recent fleet numbers
   */
  getRecentFleetNumbers() {
    try {
      const numbers = localStorage.getItem(this.STORAGE_KEYS.RECENT_FLEET_NUMBERS);
      return numbers ? JSON.parse(numbers) : [];
    } catch (error) {
      console.error('Error getting recent fleet numbers:', error);
      return [];
    }
  }

  // ============================================
  // USER PREFERENCES
  // ============================================

  /**
   * Save user preferences
   */
  savePreferences(preferences) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return this.getPreferences();
    }
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    try {
      const prefs = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        theme: 'light',
        soundEnabled: true,
        autoSaveDraft: true,
        defaultDepot: 'SDC',
        showNotifications: true,
        quickButtonsCount: 6
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {};
    }
  }

  // ============================================
  // ROUTE CACHE & GTFS DATA MANAGEMENT
  // ============================================

  /**
   * Cache processed GTFS route data
   */
  cacheRoutes(routes) {
    try {
      const cache = {
        data: routes,
        cachedAt: new Date().toISOString(),
        version: '1.5.4',
        count: routes.length
      };
      localStorage.setItem(this.STORAGE_KEYS.ROUTE_CACHE, JSON.stringify(cache));
      return { success: true, count: routes.length };
    } catch (error) {
      console.error('Error caching routes:', error);
      return { success: false, error };
    }
  }

  /**
   * Get cached routes
   */
  getCachedRoutes() {
    try {
      const cache = localStorage.getItem(this.STORAGE_KEYS.ROUTE_CACHE);
      if (!cache) return null;

      const { data, cachedAt } = JSON.parse(cache);

      // Routes don't change often, cache for 24 hours
      const cacheAge = Date.now() - new Date(cachedAt).getTime();
      if (cacheAge > 86400000) { // 24 hours
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached routes:', error);
      return null;
    }
  }

  /**
   * Save favourite routes for quick access
   */
  saveFavoriteRoutes(routes) {
    try {
      const favorites = {
        routes: routes.map(r => ({
          shortName: r.shortName || r.id,
          displayName: r.displayName || r.name,
          agency: r.agency,
          color: r.color,
          lastUsed: new Date().toISOString()
        })),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('gne_favorite_routes', JSON.stringify(favorites));
      return { success: true };
    } catch (error) {
      console.error('Error saving favourite routes:', error);
      return { success: false, error };
    }
  }

  /**
   * Get favourite routes
   */
  getFavoriteRoutes() {
    try {
      const favorites = localStorage.getItem('gne_favorite_routes');
      return favorites ? JSON.parse(favorites).routes : [];
    } catch (error) {
      console.error('Error getting favourite routes:', error);
      return [];
    }
  }

  /**
   * Add route to favorites
   */
  addFavoriteRoute(route) {
    const favorites = this.getFavoriteRoutes();
    const exists = favorites.find(f => f.shortName === route.shortName);

    if (!exists) {
      favorites.push({
        shortName: route.shortName,
        displayName: route.displayName || route.name,
        agency: route.agency,
        color: route.color,
        addedAt: new Date().toISOString()
      });
      this.saveFavoriteRoutes(favorites);
    }

    return favorites;
  }

  /**
   * Remove route from favorites
   */
  removeFavoriteRoute(shortName) {
    const favorites = this.getFavoriteRoutes();
    const filtered = favorites.filter(f => f.shortName !== shortName);
    this.saveFavoriteRoutes(filtered);
    return filtered;
  }

  /**
   * Track route usage for analytics
   */
  trackRouteUsage(routeShortName, context = 'general') {
    try {
      const key = 'gne_route_usage_analytics';
      const usage = JSON.parse(localStorage.getItem(key) || '{}');

      if (!usage[routeShortName]) {
        usage[routeShortName] = {
          count: 0,
          contexts: {},
          firstUsed: new Date().toISOString(),
          lastUsed: null
        };
      }

      usage[routeShortName].count++;
      usage[routeShortName].lastUsed = new Date().toISOString();
      usage[routeShortName].contexts[context] = (usage[routeShortName].contexts[context] || 0) + 1;

      localStorage.setItem(key, JSON.stringify(usage));

      // Update frequent routes as well
      this.updateFrequentRoutes(routeShortName);

      return usage[routeShortName];
    } catch (error) {
      console.error('Error tracking route usage:', error);
      return null;
    }
  }

  /**
   * Get route usage analytics
   */
  getRouteUsageAnalytics() {
    try {
      const usage = localStorage.getItem('gne_route_usage_analytics');
      return usage ? JSON.parse(usage) : {};
    } catch (error) {
      console.error('Error getting route usage analytics:', error);
      return {};
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Clear old cache data to free up space
   */
  clearOldCache() {
    // Clear data older than 7 days
    const keys = Object.values(this.STORAGE_KEYS);
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.cachedAt || parsed.savedAt || parsed.updatedAt) {
            const date = parsed.cachedAt || parsed.savedAt || parsed.updatedAt;
            const age = Date.now() - new Date(date).getTime();
            if (age > 604800000) { // 7 days
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        // Ignore parse errors
      }
    });
  }

  /**
   * Clear all stored data
   */
  clearAll() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Get storage usage info
   */
  getStorageInfo() {
    let totalSize = 0;
    const details = {};
    
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key);
      if (item) {
        const size = item.length * 2; // Approximate bytes (UTF-16)
        totalSize += size;
        details[name] = {
          size: size,
          sizeKB: (size / 1024).toFixed(2)
        };
      }
    });
    
    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      details
    };
  }

  /**
   * Export all data (for debugging or backup)
   */
  exportData() {
    const data = {};
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (item) {
        try {
          data[name] = JSON.parse(item);
        } catch {
          data[name] = item;
        }
      }
    });
    return data;
  }
}

// Create singleton instance
const storageService = new StorageService();

// Make it available globally for debugging in development
if (import.meta.env.DEV) {
  window.gneStorage = storageService;
}

export default storageService;