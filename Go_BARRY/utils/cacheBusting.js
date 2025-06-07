// Frontend cache buster and sample data filter
// This ensures the frontend gets clean data and handles the updated API response

export const CACHE_BUSTING_CONFIG = {
  // Add timestamp to API calls to prevent caching of old sample data
  addCacheBuster: (url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}&no_cache=true`;
  },
  
  // Force refresh headers
  getFetchHeaders: () => ({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }),
};

// Frontend sample data filter as additional protection
export const frontendSampleFilter = (alerts) => {
  if (!Array.isArray(alerts)) return [];
  
  return alerts.filter(alert => {
    // Block any remaining sample data patterns
    if (alert.id && (
      alert.id.includes('barry_v3') ||
      alert.id.includes('sample') ||
      alert.id.includes('test') ||
      alert.id.includes('demo')
    )) {
      console.warn('🗑️ Frontend filtered sample alert:', alert.id);
      return false;
    }
    
    if (alert.source === 'go_barry_v3') {
      console.warn('🗑️ Frontend filtered sample source:', alert.source);
      return false;
    }
    
    if (alert.enhanced === true || alert.enhancedFeatures) {
      console.warn('🗑️ Frontend filtered enhanced sample:', alert.id);
      return false;
    }
    
    return true;
  });
};

// Enhanced fetch function with cache busting and filtering
export const fetchAlertsWithCacheBusting = async (baseUrl = '') => {
  const API_BASE_URL = baseUrl || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://go-barry.onrender.com');
  
  try {
    console.log('🔄 Fetching alerts with cache busting...');
    
    const url = CACHE_BUSTING_CONFIG.addCacheBusting(`${API_BASE_URL}/api/alerts-enhanced`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...CACHE_BUSTING_CONFIG.getFetchHeaders(),
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.alerts) {
      // Apply frontend filter as additional protection
      const filteredAlerts = frontendSampleFilter(data.alerts);
      
      console.log(`✅ Alerts fetched: ${data.alerts.length} → ${filteredAlerts.length} (filtered ${data.alerts.length - filteredAlerts.length} potential samples)`);
      
      return {
        ...data,
        alerts: filteredAlerts,
        metadata: {
          ...data.metadata,
          frontendFiltered: data.alerts.length - filteredAlerts.length,
          cacheBusted: true,
        }
      };
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    throw error;
  }
};

// Utility to clear all possible frontend caches
export const clearAllFrontendCaches = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    if (window.localStorage) {
      Object.keys(window.localStorage).forEach(key => {
        if (key.includes('barry') || key.includes('alert') || key.includes('cache')) {
          window.localStorage.removeItem(key);
        }
      });
    }
    
    // Clear sessionStorage
    if (window.sessionStorage) {
      Object.keys(window.sessionStorage).forEach(key => {
        if (key.includes('barry') || key.includes('alert') || key.includes('cache')) {
          window.sessionStorage.removeItem(key);
        }
      });
    }
    
    console.log('🧹 Frontend caches cleared');
  } catch (error) {
    console.warn('⚠️ Could not clear all caches:', error);
  }
};

export default {
  fetchAlertsWithCacheBusting,
  frontendSampleFilter,
  clearAllFrontendCaches,
  CACHE_BUSTING_CONFIG
};
