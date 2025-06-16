// services/tomtomTiles.js
// TomTom Map Tiles Service with throttling and caching

import axios from 'axios';
import { tileThrottler } from '../utils/requestThrottler.js';

class TomTomTileService {
  constructor() {
    this.tileCache = new Map();
    this.maxCacheSize = 500; // Cache up to 500 tiles in memory
    this.cacheTTL = 30 * 60 * 1000; // 30 minutes
    
    // Different tile servers for parallel loading (TomTom optimization)
    this.tileServers = [
      'a.api.tomtom.com',
      'b.api.tomtom.com', 
      'c.api.tomtom.com',
      'd.api.tomtom.com'
    ];
    
    this.serverIndex = 0;
    console.log(`🗺️ TomTom Tile Service initialized with ${this.maxCacheSize} tile cache`);
  }
  
  // Get next tile server for load balancing
  getNextTileServer() {
    const server = this.tileServers[this.serverIndex];
    this.serverIndex = (this.serverIndex + 1) % this.tileServers.length;
    return server;
  }
  
  // Generate cache key for tile
  getTileKey(layer, style, zoom, x, y, format) {
    return `${layer}-${style}-${zoom}-${x}-${y}.${format}`;
  }
  
  // Check if tile is in cache and still valid
  getCachedTile(cacheKey) {
    const cached = this.tileCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`💾 Cache hit: ${cacheKey}`);
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.tileCache.delete(cacheKey);
    }
    
    return null;
  }
  
  // Store tile in cache with LRU eviction
  cacheTile(cacheKey, data) {
    // Implement simple LRU by removing oldest entries
    if (this.tileCache.size >= this.maxCacheSize) {
      const firstKey = this.tileCache.keys().next().value;
      this.tileCache.delete(firstKey);
    }
    
    this.tileCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  // Request a single map tile with throttling
  async requestTile(layer = 'basic', style = 'main', zoom = 10, x, y, format = 'png') {
    const cacheKey = this.getTileKey(layer, style, zoom, x, y, format);
    
    // Check cache first
    const cached = this.getCachedTile(cacheKey);
    if (cached) {
      return { success: true, data: cached, source: 'cache' };
    }
    
    const context = `tile-${layer}-${zoom}-${x}-${y}`;
    
    try {
      const result = await tileThrottler.makeRequest(async () => {
        const server = this.getNextTileServer();
        const url = `https://${server}/map/1/tile/${layer}/${style}/${zoom}/${x}/${y}.${format}?key=${process.env.TOMTOM_API_KEY}`;
        
        console.log(`🗺️ Requesting tile: ${layer} ${zoom}/${x}/${y} from ${server}`);
        
        const response = await axios.get(url, {
          timeout: 10000,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Go-BARRY-Maps/3.0 (+https://gobarry.co.uk)'
          }
        });
        
        const base64 = Buffer.from(response.data).toString('base64');
        
        return {
          data: base64,
          contentType: response.headers['content-type'] || `image/${format}`,
          size: response.data.length
        };
      }, context);
      
      // Cache successful result
      this.cacheTile(cacheKey, result);
      
      return { 
        success: true, 
        data: result, 
        source: 'api',
        cached: true
      };
      
    } catch (error) {
      console.error(`❌ Tile request failed (${context}):`, error.message);
      return { 
        success: false, 
        error: error.message,
        source: 'api'
      };
    }
  }
  
  // Request traffic incident overlay tiles
  async requestTrafficIncidentTile(zoom, x, y, style = 'light', format = 'png') {
    const cacheKey = this.getTileKey('traffic-incidents', style, zoom, x, y, format);
    
    // Check cache first
    const cached = this.getCachedTile(cacheKey);
    if (cached) {
      return { success: true, data: cached, source: 'cache' };
    }
    
    const context = `traffic-tile-${zoom}-${x}-${y}`;
    
    try {
      const result = await tileThrottler.makeRequest(async () => {
        const server = this.getNextTileServer();
        const url = `https://${server}/maps/orbis/traffic/tile/incidents/${zoom}/${x}/${y}.${format}?apiVersion=1&key=${process.env.TOMTOM_API_KEY}&style=${style}`;
        
        console.log(`🚦 Requesting traffic tile: ${zoom}/${x}/${y} from ${server}`);
        
        const response = await axios.get(url, {
          timeout: 10000,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Go-BARRY-Traffic-Maps/3.0 (+https://gobarry.co.uk)'
          }
        });
        
        const base64 = Buffer.from(response.data).toString('base64');
        
        return {
          data: base64,
          contentType: response.headers['content-type'] || `image/${format}`,
          size: response.data.length
        };
      }, context);
      
      // Cache successful result
      this.cacheTile(cacheKey, result);
      
      return { 
        success: true, 
        data: result, 
        source: 'api',
        cached: true
      };
      
    } catch (error) {
      console.error(`❌ Traffic tile request failed (${context}):`, error.message);
      return { 
        success: false, 
        error: error.message,
        source: 'api'
      };
    }
  }
  
  // Get cache and throttling statistics
  getStats() {
    const throttleStatus = tileThrottler.getStatus();
    
    return {
      cache: {
        size: this.tileCache.size,
        maxSize: this.maxCacheSize,
        utilizationPercentage: Math.round((this.tileCache.size / this.maxCacheSize) * 100)
      },
      throttling: throttleStatus,
      servers: {
        available: this.tileServers.length,
        current: this.tileServers[this.serverIndex]
      },
      dailyUsage: {
        tilesUsed: throttleStatus.dailyCount,
        tilesRemaining: throttleStatus.remainingToday,
        utilizationPercentage: Math.round((throttleStatus.dailyCount / 50000) * 100)
      }
    };
  }
  
  // Clear expired cache entries
  cleanupCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.tileCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.tileCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired tiles from cache`);
    }
    
    return cleanedCount;
  }
}

// Export singleton instance
const tomtomTileService = new TomTomTileService();

// Periodic cache cleanup every 10 minutes
setInterval(() => {
  tomtomTileService.cleanupCache();
}, 10 * 60 * 1000);

export { tomtomTileService };
export default tomtomTileService;
