import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FallbackDataManager {
  constructor() {
    this.fallbackDir = path.join(__dirname, '../data/fallback');
    this.cacheDir = path.join(__dirname, '../data/cache');
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    this.initialized = false;
    // Don't initialize on construction - wait for first use
  }

  async init() {
    if (this.initialized) return;
    // Ensure directories exist
    await fs.mkdir(this.fallbackDir, { recursive: true });
    await fs.mkdir(this.cacheDir, { recursive: true });
    this.initialized = true;
  }

  async saveFallback(service, data, metadata = {}) {
    await this.init(); // Ensure initialized
    const timestamp = Date.now();
    const filename = `${service}_${timestamp}.json`;
    const filepath = path.join(this.fallbackDir, filename);
    
    const fallbackData = {
      service,
      timestamp,
      metadata,
      data
    };
    
    await fs.writeFile(filepath, JSON.stringify(fallbackData, null, 2));
    
    // Also update the latest fallback
    const latestPath = path.join(this.fallbackDir, `${service}_latest.json`);
    await fs.writeFile(latestPath, JSON.stringify(fallbackData, null, 2));
    
    return filepath;
  }

  async getFallback(service, maxAge = this.maxAge) {
    try {
      const latestPath = path.join(this.fallbackDir, `${service}_latest.json`);
      const content = await fs.readFile(latestPath, 'utf-8');
      const fallbackData = JSON.parse(content);
      
      // Check if data is too old
      if (Date.now() - fallbackData.timestamp > maxAge) {
        console.log(`[FallbackManager] Fallback data for ${service} is stale`);
        return this.getStaticFallback(service);
      }
      
      return fallbackData.data;
    } catch (error) {
      console.log(`[FallbackManager] No fallback found for ${service}, using static`);
      return this.getStaticFallback(service);
    }
  }

  async getStaticFallback(service) {
    // Return static fallback data based on service
    const staticFallbacks = {
      tomtom: {
        incidents: [],
        flowSegmentData: {
          currentSpeed: 50,
          freeFlowSpeed: 60,
          confidence: 0.5
        },
        message: 'Using static fallback data - service temporarily unavailable'
      },
      streetManager: {
        works: [],
        lastUpdate: new Date().toISOString(),
        message: 'Street Manager data temporarily unavailable'
      },
      nationalHighways: {
        events: [],
        roadworks: [],
        message: 'National Highways data temporarily unavailable'
      },
      weather: {
        temperature: 10,
        conditions: 'Unknown',
        wind: { speed: 0, direction: 'N' },
        message: 'Weather data temporarily unavailable'
      }
    };
    
    return staticFallbacks[service] || { 
      error: true, 
      message: `No fallback available for ${service}` 
    };
  }

  async cacheResponse(service, endpoint, data) {
    const cacheKey = `${service}_${endpoint.replace(/[^a-z0-9]/gi, '_')}`;
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    
    const cacheData = {
      service,
      endpoint,
      timestamp: Date.now(),
      data
    };
    
    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    return cachePath;
  }

  async getCached(service, endpoint, maxAge = 5 * 60 * 1000) { // 5 minutes default
    const cacheKey = `${service}_${endpoint.replace(/[^a-z0-9]/gi, '_')}`;
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    
    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const cacheData = JSON.parse(content);
      
      if (Date.now() - cacheData.timestamp <= maxAge) {
        console.log(`[FallbackManager] Using cached data for ${service}:${endpoint}`);
        return { cached: true, ...cacheData.data };
      }
    } catch (error) {
      // Cache miss or error
    }
    
    return null;
  }

  async cleanOldFallbacks() {
    const files = await fs.readdir(this.fallbackDir);
    const now = Date.now();
    
    for (const file of files) {
      if (file.includes('_latest.json')) continue;
      
      const filepath = path.join(this.fallbackDir, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) { // 7 days
        await fs.unlink(filepath);
        console.log(`[FallbackManager] Deleted old fallback: ${file}`);
      }
    }
  }
}

// Singleton instance
const fallbackManager = new FallbackDataManager();

// Don't start cleanup interval on module load - wait for first use
// This prevents memory allocation at startup

export default fallbackManager;
