// utils/convexDebug.js
// Debugging utility for Convex errors

export const convexDebug = {
  // Wrap localStorage operations with error handling
  safeLocalStorage: {
    getItem(key) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return null;
        }
        const value = window.localStorage.getItem(key);
        // Check for invalid values
        if (value === 'undefined' || value === 'null' || value === null) {
          return null;
        }
        return value;
      } catch (error) {
        console.warn(`[ConvexDebug] localStorage.getItem error for key '${key}':`, error);
        return null;
      }
    },
    
    setItem(key, value) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return false;
        }
        // Don't store invalid values
        if (value === undefined || value === null) {
          return false;
        }
        window.localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn(`[ConvexDebug] localStorage.setItem error for key '${key}':`, error);
        return false;
      }
    },
    
    removeItem(key) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return false;
        }
        window.localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn(`[ConvexDebug] localStorage.removeItem error for key '${key}':`, error);
        return false;
      }
    }
  },
  
  // Ensure arrays are always arrays
  ensureArray(value, defaultValue = []) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value === undefined || value === null) {
      return defaultValue;
    }
    console.warn('[ConvexDebug] Non-array value provided to ensureArray:', value);
    return defaultValue;
  },
  
  // Safe length check
  safeLength(value) {
    try {
      if (Array.isArray(value)) {
        return value.length;
      }
      if (typeof value === 'string') {
        return value.length;
      }
      if (value && typeof value.length === 'number') {
        return value.length;
      }
      return 0;
    } catch (error) {
      console.warn('[ConvexDebug] Error accessing length:', error);
      return 0;
    }
  },
  
  // Log Convex query errors
  logQueryError(queryName, error) {
    console.error(`[ConvexDebug] Query '${queryName}' failed:`, error);
    
    // Check if it's a deployment issue
    if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
      console.warn(`[ConvexDebug] ${queryName} might not be deployed. Run 'npx convex deploy' to update.`);
    }
  },
  
  // Check if Convex is properly connected
  checkConnection(api) {
    if (!api) {
      console.error('[ConvexDebug] Convex API not loaded - check imports');
      return false;
    }
    
    // Check if common functions exist
    const requiredFunctions = [
      'alerts.getActiveAlerts',
      'supervisors.getActiveSupervisors',
      'sync.getSyncState'
    ];
    
    let allGood = true;
    requiredFunctions.forEach(funcPath => {
      const parts = funcPath.split('.');
      let current = api;
      
      for (const part of parts) {
        if (!current || !current[part]) {
          console.error(`[ConvexDebug] Missing function: api.${funcPath}`);
          allGood = false;
          break;
        }
        current = current[part];
      }
    });
    
    return allGood;
  }
};

export default convexDebug;