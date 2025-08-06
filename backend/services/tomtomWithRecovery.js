import axios from 'axios';
import { circuitBreakers } from './circuitBreaker.js';
import fallbackManager from './fallbackDataManager.js';

class TomTomServiceWithRecovery {
  constructor() {
    this.apiKey = process.env.TOMTOM_API_KEY;
    this.baseUrl = 'https://api.tomtom.com';
    this.circuitBreaker = circuitBreakers.tomtom;
  }

  async getTrafficIncidents(bbox, options = {}) {
    const endpoint = `traffic/incidents/${bbox}`;
    
    // Try cache first
    const cached = await fallbackManager.getCached('tomtom', endpoint);
    if (cached) return cached;
    
    // Execute with circuit breaker and fallback
    return this.circuitBreaker.execute(
      async () => {
        const response = await axios.get(
          `${this.baseUrl}/traffic/services/5/incidentDetails`,
          {
            params: {
              key: this.apiKey,
              bbox: bbox,
              fields: options.fields || '{incidents{type,geometry{coordinates},properties}}',
              language: 'en-GB',
              categoryFilter: options.categoryFilter || '0,1,2,3,4,5,6,7,8,9,10,11,14'
            },
            timeout: 10000
          }
        );
        
        const data = response.data;
        
        // Cache successful response
        await fallbackManager.cacheResponse('tomtom', endpoint, data);
        
        // Save as fallback for future outages
        await fallbackManager.saveFallback('tomtom', data, { 
          bbox, 
          timestamp: new Date().toISOString() 
        });
        
        return data;
      },
      async () => {
        // Fallback function
        console.log('[TomTom] Circuit open or request failed, using fallback');
        const fallbackData = await fallbackManager.getFallback('tomtom');
        return {
          ...fallbackData,
          fromFallback: true,
          fallbackTimestamp: new Date().toISOString()
        };
      }
    );
  }

  async getTrafficFlow(point, options = {}) {
    const endpoint = `traffic/flow/${point}`;
    
    return this.circuitBreaker.execute(
      async () => {
        const response = await axios.get(
          `${this.baseUrl}/traffic/services/4/flowSegmentData/absolute/10/json`,
          {
            params: {
              key: this.apiKey,
              point: point,
              unit: options.unit || 'KMPH',
              thickness: options.thickness || 10,
              openLr: false
            },
            timeout: 8000
          }
        );
        
        await fallbackManager.cacheResponse('tomtom', endpoint, response.data);
        return response.data;
      },
      async () => {
        // Return minimal flow data as fallback
        return {
          flowSegmentData: {
            currentSpeed: 45,
            freeFlowSpeed: 60,
            currentTravelTime: 120,
            freeFlowTravelTime: 100,
            confidence: 0.3,
            roadClosure: false
          },
          fromFallback: true
        };
      }
    );
  }

  // Health check endpoint for monitoring
  async healthCheck() {
    try {
      const status = this.circuitBreaker.getStatus();
      const testBbox = '-1.7,54.9,-1.5,55.0'; // Small Newcastle area
      
      if (status.state === 'OPEN') {
        return {
          healthy: false,
          status: 'Circuit breaker OPEN',
          ...status
        };
      }
      
      // Try a lightweight request
      await axios.get(
        `${this.baseUrl}/traffic/services/5/incidentDetails`,
        {
          params: {
            key: this.apiKey,
            bbox: testBbox,
            fields: '{incidents{type}}',
            categoryFilter: '0'
          },
          timeout: 5000
        }
      );
      
      return {
        healthy: true,
        status: 'Service operational',
        ...status
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'Service check failed',
        error: error.message,
        ...this.circuitBreaker.getStatus()
      };
    }
  }

  // Get service status without making API call
  getStatus() {
    return {
      service: 'TomTom',
      circuitBreaker: this.circuitBreaker.getStatus(),
      configured: !!this.apiKey
    };
  }
}

// Export singleton instance
const tomtomService = new TomTomServiceWithRecovery();
export default tomtomService;
