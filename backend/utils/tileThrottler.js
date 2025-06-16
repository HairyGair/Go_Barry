// utils/tileThrottler.js
// TomTom tile request throttling system for 50,000 daily tile requests

import { RequestThrottler } from './requestThrottler.js';

class TileThrottler extends RequestThrottler {
  constructor() {
    // Business hours: 6:00 AM - 12:15 AM (18.25 hours)
    const businessHours = {
      startHour: 6,
      startMinute: 0,
      endHour: 0,
      endMinute: 15
    };
    
    // 50,000 tiles per day, but concentrate during business hours
    // 70% during business hours (35,000), 30% for 24/7 systems (15,000)
    super(50000, 'TomTom-Tiles', businessHours);
    
    // Tile-specific properties
    this.tileCache = new Map();
    this.maxCacheSize = 1000; // Cache up to 1000 tiles
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Usage distribution
    this.businessHoursAllocation = 35000; // 70% during business hours
    this.backgroundAllocation = 15000;    // 30% for 24/7 systems
    
    // Calculate rates
    this.businessHourlyRate = Math.floor(this.businessHoursAllocation / this.operatingHours);
    this.backgroundHourlyRate = Math.floor(this.backgroundAllocation / 24);
    
    console.log(`🗺️ Tile throttler: 50,000 tiles/day`);
    console.log(`   📈 Business hours: ${this.businessHourlyRate} tiles/hour`);
    console.log(`   🌙 Background: ${this.backgroundHourlyRate} tiles/hour`);
  }
  
  // Check if tile is in cache
  getTileFromCache(tileKey) {
    if (this.tileCache.has(tileKey)) {
      this.cacheHits++;
      const cached = this.tileCache.get(tileKey);
      
      // Check if cache entry is still valid (1 hour for traffic, 24 hours for base maps)
      const maxAge = cached.type === 'traffic' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      if (Date.now() - cached.timestamp < maxAge) {
        return cached.data;
      } else {
        this.tileCache.delete(tileKey);
      }
    }
    
    this.cacheMisses++;
    return null;
  }
  
  // Add tile to cache
  addTileToCache(tileKey, tileData, tileType = 'base') {
    // Clean cache if too large
    if (this.tileCache.size >= this.maxCacheSize) {
      const oldestKey = this.tileCache.keys().next().value;
      this.tileCache.delete(oldestKey);
    }
    
    this.tileCache.set(tileKey, {
      data: tileData,
      type: tileType,
      timestamp: Date.now()
    });
  }
  
  // Generate tile cache key
  generateTileKey(layer, zoom, x, y, style = 'main') {
    return `${layer}_${zoom}_${x}_${y}_${style}`;
  }
  
  // Request tile with caching and throttling
  async requestTile(layer, zoom, x, y, style = 'main') {
    const tileKey = this.generateTileKey(layer, zoom, x, y, style);
    
    // Check cache first
    const cached = this.getTileFromCache(tileKey);
    if (cached) {
      console.log(`📦 Cache hit: ${tileKey}`);
      return cached;
    }
    
    // Make throttled request
    const context = `${layer}-tile-${zoom}/${x}/${y}`;
    
    try {
      const tileData = await this.makeRequest(async () => {
        const url = this.buildTileUrl(layer, zoom, x, y, style);
        console.log(`🗺️ Fetching tile: ${context}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Tile request failed: ${response.status}`);
        }
        
        return await response.blob();
      }, context);
      
      // Cache the tile
      const tileType = layer.includes('traffic') ? 'traffic' : 'base';
      this.addTileToCache(tileKey, tileData, tileType);
      
      return tileData;
      
    } catch (error) {
      console.error(`❌ Tile request failed for ${tileKey}:`, error);
      throw error;
    }
  }
  
  // Build TomTom tile URL
  buildTileUrl(layer, zoom, x, y, style = 'main') {
    const baseUrl = 'https://api.tomtom.com';
    const apiKey = process.env.TOMTOM_API_KEY;
    
    const layerMap = {
      'base': `/map/1/tile/basic/${style}/${zoom}/${x}/${y}.png`,
      'traffic-flow': `/traffic/map/4/tile/flow/${style}/${zoom}/${x}/${y}.png`,
      'traffic-incidents': `/traffic/map/4/tile/incidents/${style}/${zoom}/${x}/${y}.png`,
      'labels': `/map/1/tile/labels/${style}/${zoom}/${x}/${y}.png`,
      'hybrid': `/map/1/tile/hybrid/${style}/${zoom}/${x}/${y}.png`
    };
    
    const path = layerMap[layer] || layerMap['base'];
    return `${baseUrl}${path}?key=${apiKey}`;
  }
  
  // Calculate optimal zoom for viewport
  getOptimalZoom(viewportWidth, viewportHeight, boundingBox) {
    // Standard tile size is 256x256
    const tileSize = 256;
    
    // Calculate zoom needed to fit bounding box in viewport
    const latDiff = boundingBox.north - boundingBox.south;
    const lngDiff = boundingBox.east - boundingBox.west;
    
    // Rough calculation - could be more precise
    const latZoom = Math.floor(Math.log2(360 / latDiff));
    const lngZoom = Math.floor(Math.log2(360 / lngDiff));
    
    // Use the more restrictive zoom level and clamp to reasonable range
    const optimalZoom = Math.min(latZoom, lngZoom);
    return Math.max(8, Math.min(16, optimalZoom)); // Zoom 8-16 for Go North East area
  }
  
  // Get tile usage statistics
  getTileStats() {
    const status = this.getStatus();
    
    return {
      ...status,
      tileCache: {
        size: this.tileCache.size,
        maxSize: this.maxCacheSize,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.cacheHits > 0 ? Math.round((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100) : 0
      },
      usage: {
        businessHoursAllocation: this.businessHoursAllocation,
        backgroundAllocation: this.backgroundAllocation,
        businessHourlyRate: this.businessHourlyRate,
        backgroundHourlyRate: this.backgroundHourlyRate
      },
      recommendations: this.getUsageRecommendations()
    };
  }
  
  // Get usage recommendations
  getUsageRecommendations() {
    const utilizationRate = this.dailyCount / this.requestsPerDay;
    const recommendations = [];
    
    if (utilizationRate > 0.8) {
      recommendations.push('High usage detected - consider increasing cache duration');
    }
    
    if (this.tileCache.size === this.maxCacheSize) {
      recommendations.push('Cache is full - consider increasing cache size');
    }
    
    const hitRate = this.cacheHits / (this.cacheHits + this.cacheMisses || 1);
    if (hitRate < 0.5) {
      recommendations.push('Low cache hit rate - optimize tile request patterns');
    }
    
    if (this.requestQueue.length > 10) {
      recommendations.push('High queue length - requests may be delayed');
    }
    
    return recommendations;
  }
  
  // Clear cache manually
  clearCache() {
    this.tileCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('🗑️ Tile cache cleared');
  }
}

// Global tile throttler instance
const tileThrottler = new TileThrottler();

export { TileThrottler, tileThrottler };
