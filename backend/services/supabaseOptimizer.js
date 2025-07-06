/**
 * Supabase Query Optimizer
 * Reduces egress usage through caching and query optimization
 */

import NodeCache from 'node-cache';

// Cache for 5 minutes by default, longer for static data
const queryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  maxKeys: 1000 // Limit cache size
});

export class SupabaseOptimizer {
  constructor() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalQueries = 0;
  }

  /**
   * Wrap Supabase queries with caching
   */
  async cachedQuery(cacheKey, queryFn, cacheTTL = 300) {
    this.totalQueries++;
    
    // Check cache first
    const cached = queryCache.get(cacheKey);
    if (cached) {
      this.cacheHits++;
      console.log(`🎯 Cache HIT: ${cacheKey} (${this.getCacheHitRate()}% hit rate)`);
      return cached;
    }

    // Execute query
    this.cacheMisses++;
    console.log(`🔍 Cache MISS: ${cacheKey} - executing query`);
    
    try {
      const result = await queryFn();
      
      // Cache successful results
      if (result && !result.error) {
        queryCache.set(cacheKey, result, cacheTTL);
        console.log(`💾 Cached: ${cacheKey} for ${cacheTTL}s`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Query failed for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Optimized queries with LIMIT and caching
   */
  async optimizedSelect(supabase, table, options = {}) {
    const {
      select = '*',
      limit = 100, // Default limit to prevent large downloads
      orderBy = null,
      filters = {},
      cacheTTL = 300,
      cacheKey = null
    } = options;

    // Generate cache key if not provided
    const key = cacheKey || `${table}_${JSON.stringify({ select, limit, orderBy, filters })}`;

    return this.cachedQuery(key, async () => {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else if (typeof value === 'object' && value.operator) {
          // Support for operators like { operator: 'gte', value: '2024-01-01' }
          query = query[value.operator](column, value.value);
        } else {
          query = query.eq(column, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        const { column, ascending = false } = orderBy;
        query = query.order(column, { ascending });
      }

      // Apply limit
      query = query.limit(limit);

      console.log(`📊 Executing optimized query: ${table} (limit: ${limit})`);
      return await query;
    }, cacheTTL);
  }

  /**
   * Get frequently used data with long caching
   */
  async getStaticData(supabase, table, cacheTTL = 3600) { // 1 hour cache
    return this.optimizedSelect(supabase, table, {
      limit: 50, // Small limit for static data
      cacheTTL,
      cacheKey: `static_${table}`
    });
  }

  /**
   * Get recent data with shorter caching
   */
  async getRecentData(supabase, table, dateColumn = 'created_at', hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.optimizedSelect(supabase, table, {
      filters: {
        [dateColumn]: { operator: 'gte', value: cutoffDate.toISOString() }
      },
      orderBy: { column: dateColumn, ascending: false },
      limit: 50,
      cacheTTL: 180, // 3 minutes for recent data
      cacheKey: `recent_${table}_${hours}h`
    });
  }

  /**
   * Count rows without downloading data
   */
  async getCount(supabase, table, filters = {}, cacheTTL = 600) {
    const cacheKey = `count_${table}_${JSON.stringify(filters)}`;
    
    return this.cachedQuery(cacheKey, async () => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      
      Object.entries(filters).forEach(([column, value]) => {
        query = query.eq(column, value);
      });

      console.log(`🔢 Executing count query: ${table}`);
      return await query;
    }, cacheTTL);
  }

  /**
   * Clear cache for specific table or pattern
   */
  clearCache(pattern = null) {
    if (pattern) {
      const keys = queryCache.keys().filter(key => key.includes(pattern));
      keys.forEach(key => queryCache.del(key));
      console.log(`🧹 Cleared ${keys.length} cache entries matching: ${pattern}`);
    } else {
      queryCache.flushAll();
      console.log('🧹 Cleared all cache entries');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.getCacheHitRate(),
      totalQueries: this.totalQueries,
      cacheSize: queryCache.getStats().keys,
      memory: queryCache.getStats()
    };
  }

  getCacheHitRate() {
    if (this.totalQueries === 0) return 0;
    return Math.round((this.cacheHits / this.totalQueries) * 100);
  }

  /**
   * Batch operations to reduce individual API calls
   */
  async batchSelect(supabase, queries) {
    const results = {};
    const promises = [];

    queries.forEach(({ key, table, options }) => {
      promises.push(
        this.optimizedSelect(supabase, table, options)
          .then(result => ({ key, result }))
          .catch(error => ({ key, error }))
      );
    });

    const batchResults = await Promise.allSettled(promises);
    
    batchResults.forEach(({ value }) => {
      if (value) {
        results[value.key] = value.result || value.error;
      }
    });

    console.log(`📦 Executed batch of ${queries.length} queries`);
    return results;
  }
}

// Export singleton instance
export const supabaseOptimizer = new SupabaseOptimizer();