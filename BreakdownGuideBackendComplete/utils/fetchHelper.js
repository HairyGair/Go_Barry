// Helper to provide a working fetch implementation for Supabase
// Works around node-fetch v3 ESM compatibility issues

import https from 'https';

let fetchImplementation = null;

export async function getFetch() {
  if (fetchImplementation) {
    return fetchImplementation;
  }

  // Try to use node-fetch first
  try {
    const nodeFetch = await import('node-fetch');
    console.log('✅ Loaded node-fetch successfully');
    
    // Create an HTTPS agent that's more forgiving of SSL issues
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      keepAlive: true,
      timeout: 30000
    });
    
    // Create a wrapper that handles node-fetch v3's Response object
    fetchImplementation = async (url, options = {}) => {
      try {
        // Add the agent for HTTPS requests
        if (url.startsWith('https://')) {
          options.agent = httpsAgent;
        }
        
        const response = await nodeFetch.default(url, options);
        
        // Ensure the response has all expected methods
        if (!response.clone) {
          response.clone = function() {
            console.warn('⚠️ Response.clone() called but not fully supported');
            return response;
          };
        }
        
        return response;
      } catch (error) {
        console.error('❌ node-fetch request failed:', error.message);
        if (error.code) {
          console.error('❌ Error code:', error.code);
        }
        if (error.cause) {
          console.error('❌ Error cause:', error.cause);
        }
        throw error;
      }
    };
    
    return fetchImplementation;
  } catch (e) {
    console.warn('⚠️ node-fetch not available, using native fetch');
    fetchImplementation = globalThis.fetch || fetch;
    return fetchImplementation;
  }
}

// Test the fetch implementation
export async function testFetch() {
  try {
    const fetchFn = await getFetch();
    console.log('🧪 Testing fetch implementation...');
    
    // Test a simple HTTPS request
    const response = await fetchFn('https://api.github.com', {
      method: 'GET',
      headers: {
        'User-Agent': 'Go-BARRY-Backend'
      }
    });
    
    if (response.ok) {
      console.log('✅ Fetch test successful:', response.status, response.statusText);
      return true;
    } else {
      console.error('❌ Fetch test failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Fetch test error:', error.message);
    return false;
  }
}
