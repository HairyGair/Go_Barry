// Roadworks Service Layer
// Separates business logic from HTTP handling

import ApiResponse from '../../utils/ApiResponse.js';
import cacheManager, { CacheStrategies } from '../cacheManager.js';
import requestPoolManager from '../requestPoolManager.js';
import config from '../../config/index.js';

class RoadworksService {
  constructor() {
    this.repository = null; // Will be injected
    this.pageSize = config.limits.roadworksPageSize;
  }

  setRepository(repository) {
    this.repository = repository;
  }

  async getUnifiedRoadworks(options = {}) {
    const {
      page = 1,
      limit = this.pageSize,
      days = 90,
      bbox = null,
      severity = null,
      status = null
    } = options;

    // Generate cache key
    const cacheKey = cacheManager.generateKey('roadworks:unified', options);
    
    // Try cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return ApiResponse.cached(cached.value, {
        timestamp: new Date().toISOString(),
        expiry: new Date(Date.now() + CacheStrategies.MEDIUM.ttl * 1000).toISOString()
      });
    }

    // Use request pool for heavy operation
    const result = await requestPoolManager.execute('roadworks', async () => {
      // Fetch from repository
      const roadworks = await this.repository.getUnifiedRoadworks({
        page,
        limit,
        days,
        bbox,
        severity,
        status
      });

      // Process and enhance data
      const enhanced = await this.enhanceRoadworks(roadworks.data);
      
      return {
        roadworks: enhanced,
        total: roadworks.total
      };
    });

    // Cache the result
    await cacheManager.set(cacheKey, result, CacheStrategies.MEDIUM.ttl);

    // Return paginated response
    return ApiResponse.paginated(
      result.roadworks,
      page,
      limit,
      result.total
    );
  }

  async enhanceRoadworks(roadworks) {
    // Add route matching, impact analysis, etc.
    return Promise.all(roadworks.map(async (work) => {
      // Enhancement logic here
      return {
        ...work,
        enhanced: true,
        processedAt: new Date().toISOString()
      };
    }));
  }

  async createRoadwork(data) {
    // Validate input
    const validation = this.validateRoadwork(data);
    if (!validation.valid) {
      throw new Error(`Invalid roadwork data: ${validation.errors.join(', ')}`);
    }

    // Save to repository
    const created = await this.repository.createRoadwork(data);
    
    // Clear related caches
    await this.clearRoadworksCache();
    
    return ApiResponse.success(created, {
      action: 'created'
    });
  }

  async updateRoadwork(id, updates) {
    const existing = await this.repository.getRoadworkById(id);
    if (!existing) {
      throw new Error('Roadwork not found');
    }

    const updated = await this.repository.updateRoadwork(id, updates);
    
    // Clear caches
    await this.clearRoadworksCache();
    
    return ApiResponse.success(updated, {
      action: 'updated'
    });
  }

  validateRoadwork(data) {
    const errors = [];
    
    if (!data.location) errors.push('Location is required');
    if (!data.description) errors.push('Description is required');
    if (!data.startDate) errors.push('Start date is required');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async clearRoadworksCache() {
    const keys = await cacheManager.memoryCache.keys();
    const roadworkKeys = keys.filter(k => k.startsWith('roadworks:'));
    
    for (const key of roadworkKeys) {
      await cacheManager.delete(key);
    }
  }

  async getStatistics() {
    const stats = await this.repository.getStatistics();
    
    return ApiResponse.success({
      ...stats,
      cacheStats: cacheManager.getStats(),
      poolStats: requestPoolManager.getMetrics()
    });
  }
}

// Singleton instance
const roadworksService = new RoadworksService();
export default roadworksService;
