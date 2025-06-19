// Go_BARRY/utils/apiConfig.js
// Centralized API configuration and utilities

// Force production URL - prevent any localhost usage
const PRODUCTION_API_URL = 'https://go-barry.onrender.com';

// Debug function to check current configuration
export const debugApiConfig = () => {
  console.log('🔍 API Configuration Debug:');
  console.log('- PRODUCTION_API_URL:', PRODUCTION_API_URL);
  console.log('- Current location:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  console.log('- Environment:', process.env.NODE_ENV || 'unknown');
  console.log('- Expo public API URL:', process.env.EXPO_PUBLIC_API_BASE_URL || 'not set');
  
  // Check for any localhost references
  const possibleLocalUrls = [
    'localhost:3001',
    'localhost:3000', 
    '127.0.0.1:3001',
    'http://localhost'
  ];
  
  console.log('🚨 Checking for localhost references...');
  possibleLocalUrls.forEach(url => {
    if (typeof window !== 'undefined') {
      const scripts = Array.from(document.scripts);
      const hasLocalhost = scripts.some(script => script.src && script.src.includes(url));
      if (hasLocalhost) {
        console.warn(`⚠️ Found localhost reference: ${url}`);
      }
    }
  });
};

// Enhanced fetch wrapper that ALWAYS uses production URL
export const safeFetch = async (endpoint, options = {}) => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${PRODUCTION_API_URL}${cleanEndpoint}`;
  
  console.log(`🌐 Safe API call: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Safe API call failed for ${endpoint}:`, error.message);
    throw error;
  }
};

// Get the production API URL
export const getApiUrl = (endpoint = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${PRODUCTION_API_URL}${cleanEndpoint}`;
};

// Validate that no localhost URLs are being used
export const validateApiUrls = () => {
  const warnings = [];
  
  // Check common patterns that might use localhost
  const dangerousPatterns = [
    'localhost:3001',
    'localhost:3000',
    '127.0.0.1:3001',
    'http://localhost'
  ];
  
  if (typeof window !== 'undefined') {
    // Check if any fetch calls are going to localhost
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string') {
        dangerousPatterns.forEach(pattern => {
          if (url.includes(pattern)) {
            console.error(`🚨 LOCALHOST DETECTED: ${url}`);
            warnings.push(`Localhost call detected: ${url}`);
          }
        });
      }
      return originalFetch.call(this, url, options);
    };
  }
  
  return warnings;
};

// Initialize debugging
if (typeof window !== 'undefined') {
  // Run debug on page load
  window.addEventListener('load', () => {
    debugApiConfig();
    validateApiUrls();
  });
}

export default {
  PRODUCTION_API_URL,
  debugApiConfig,
  safeFetch,
  getApiUrl,
  validateApiUrls
};