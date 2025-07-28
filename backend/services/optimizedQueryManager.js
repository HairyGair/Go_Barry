// backend/services/optimizedQueryManager.js
// Memory-optimized database query manager for 2GB constraint

import { createClient } from '@supabase/supabase-js';
import memoryMonitor from './memoryMonitor.js';

/**
 * Optimized Query Manager for memory-efficient database operations
 * Designed for Go Barry's 2GB RAM constraint on Render.com
 */
class OptimizedQueryManager {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.client = null;
    this.queryCache = new Map();
    this.maxCacheSize = 50;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.connectionPool = {
      active: 0,
      max: 5 // Limit concurrent connections
    };
    this.queryStats = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      memoryOptimizedQueries: 0
    };
    
    this.initializeClient();
  }

  /**
   * Initialize Supabase client with memory-optimized settings
   */
  initializeClient() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return;
    }

    this.client = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        persistSession: false // Disable session persistence to save memory
      },
      global: {
        headers: {
          'X-Client-Info': 'go-barry-optimized'
        }
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Optimized Query Manager initialized');
  }

  /**
   * Memory-optimized query with automatic batching and caching
   */
  async optimizedQuery(table, options = {}) {
    const startTime = Date.now();
    const queryId = `query_${++this.queryStats.totalQueries}`;
    
    try {
      // Ensure client is available
      if (!this.client) {
        throw new Error('Database client not initialized');
      }

      // Apply memory-conscious defaults
      const queryOptions = this.applyMemoryDefaults(options);
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(table, queryOptions);
      
      // Check cache first
      if (queryOptions.useCache && this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          this.queryStats.cachedQueries++;
          console.log(`📦 Cache hit for ${table} query (${Date.now() - startTime}ms)`);
          return cached.data;
        } else {
          this.queryCache.delete(cacheKey);
        }
      }

      // Check connection pool
      if (this.connectionPool.active >= this.connectionPool.max) {
        console.warn(`⏳ Query queued - connection pool full (${this.connectionPool.active}/${this.connectionPool.max})`);
        await this.waitForConnection();
      }

      this.connectionPool.active++;

      // Build optimized query
      let query = this.client.from(table);
      
      // Apply filters
      if (queryOptions.filters) {
        for (const [column, value] of Object.entries(queryOptions.filters)) {
          if (Array.isArray(value)) {
            query = query.in(column, value);
          } else if (typeof value === 'object' && value.operator) {
            query = query.filter(column, value.operator, value.value);
          } else {
            query = query.eq(column, value);
          }
        }
      }

      // Apply text search
      if (queryOptions.textSearch) {
        query = query.textSearch(queryOptions.textSearch.column, queryOptions.textSearch.query);
      }

      // Apply range filters
      if (queryOptions.range) {
        for (const [column, range] of Object.entries(queryOptions.range)) {
          if (range.gte !== undefined) query = query.gte(column, range.gte);
          if (range.lte !== undefined) query = query.lte(column, range.lte);
          if (range.gt !== undefined) query = query.gt(column, range.gt);
          if (range.lt !== undefined) query = query.lt(column, range.lt);
        }
      }

      // Apply ordering
      if (queryOptions.orderBy) {
        const ascending = queryOptions.order !== 'desc';
        query = query.order(queryOptions.orderBy, { ascending });
      }

      // Apply pagination with memory limits
      const limit = Math.min(queryOptions.limit || 100, 1000); // Max 1000 records
      const offset = queryOptions.offset || 0;
      
      query = query.range(offset, offset + limit - 1);

      // Select specific fields to reduce memory usage
      if (queryOptions.select) {
        query = query.select(queryOptions.select);
      }

      // Execute query with timeout
      const { data, error, count } = await Promise.race([
        query,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 30000)
        )
      ]);

      this.connectionPool.active--;

      if (error) {
        console.error(`❌ Query error for ${table}:`, error);
        throw error;
      }

      const queryTime = Date.now() - startTime;
      
      // Track slow queries
      if (queryTime > 1000) {
        this.queryStats.slowQueries++;
        console.warn(`🐌 Slow query for ${table}: ${queryTime}ms`);
      }

      // Cache successful results
      if (queryOptions.useCache && data) {
        this.cacheResult(cacheKey, data, count);
      }

      const result = {
        data: data || [],
        count: count || data?.length || 0,
        metadata: {
          queryTime,
          fromCache: false,
          table,
          queryId
        }
      };

      this.queryStats.memoryOptimizedQueries++;
      console.log(`✅ Query ${queryId} completed: ${data?.length || 0} records in ${queryTime}ms`);

      return result;

    } catch (error) {
      this.connectionPool.active = Math.max(0, this.connectionPool.active - 1);
      console.error(`❌ Optimized query error for ${table}:`, error);
      throw error;
    }
  }

  /**
   * Streaming query for large datasets
   */
  async *streamingQuery(table, options = {}) {
    const batchSize = Math.min(options.batchSize || 100, 500);
    let offset = 0;
    let hasMore = true;
    let batchCount = 0;
    const maxBatches = options.maxBatches || 100; // Prevent infinite streaming

    console.log(`🌊 Starting streaming query for ${table} (batch size: ${batchSize})`);

    while (hasMore && batchCount < maxBatches) {
      try {
        const batchOptions = {
          ...options,
          limit: batchSize,
          offset,
          useCache: false // Don't cache streaming results
        };

        const result = await this.optimizedQuery(table, batchOptions);
        const batch = result.data;

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        yield {
          batch,
          batchNumber: ++batchCount,
          batchSize: batch.length,
          offset,
          hasMore: batch.length === batchSize
        };

        offset += batchSize;
        hasMore = batch.length === batchSize;

        // Clean up batch memory
        batch.length = 0;

        // Yield control and allow garbage collection
        await new Promise(resolve => setImmediate(resolve));

        // Force garbage collection every 10 batches
        if (batchCount % 10 === 0 && global.gc) {
          global.gc();
        }

      } catch (error) {
        console.error(`❌ Streaming query error at batch ${batchCount}:`, error);
        throw error;
      }
    }

    console.log(`✅ Streaming query completed: ${batchCount} batches processed`);
  }

  /**
   * Bulk insert with memory optimization
   */
  async optimizedBulkInsert(table, records, options = {}) {
    const batchSize = Math.min(options.batchSize || 100, 500);
    const results = [];
    let processed = 0;

    console.log(`📦 Bulk inserting ${records.length} records into ${table} (batch size: ${batchSize})`);

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        if (this.connectionPool.active >= this.connectionPool.max) {
          await this.waitForConnection();
        }

        this.connectionPool.active++;

        const { data, error } = await this.client
          .from(table)
          .insert(batch)
          .select();

        this.connectionPool.active--;

        if (error) {
          console.error(`❌ Bulk insert error for batch ${Math.floor(i / batchSize) + 1}:`, error);
          throw error;
        }

        results.push(...(data || []));
        processed += batch.length;

        // Clean up batch
        batch.length = 0;

        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${processed}/${records.length} records`);

        // Yield control between batches
        await new Promise(resolve => setImmediate(resolve));

      } catch (error) {
        this.connectionPool.active = Math.max(0, this.connectionPool.active - 1);
        console.error(`❌ Bulk insert error:`, error);
        throw error;
      }
    }

    return {
      success: true,
      inserted: results.length,
      data: results
    };
  }

  /**
   * Memory-conscious upsert operation
   */
  async optimizedUpsert(table, records, conflictColumns, options = {}) {
    const batchSize = Math.min(options.batchSize || 50, 200); // Smaller batches for upserts
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const { data, error } = await this.client
          .from(table)
          .upsert(batch, {
            onConflict: conflictColumns,
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;

        results.push(...(data || []));
        batch.length = 0;

        // Yield control
        await new Promise(resolve => setImmediate(resolve));

      } catch (error) {
        console.error(`❌ Upsert error:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Apply memory-conscious defaults to query options
   */
  applyMemoryDefaults(options) {
    return {
      limit: 100,
      offset: 0,
      orderBy: 'created_at',
      order: 'desc',
      useCache: true,
      select: '*',
      ...options,
      // Enforce memory limits
      limit: Math.min(options.limit || 100, 1000)
    };
  }

  /**
   * Generate cache key for query
   */
  generateCacheKey(table, options) {
    const keyObject = {
      table,
      filters: options.filters,
      orderBy: options.orderBy,
      order: options.order,
      limit: options.limit,
      offset: options.offset,
      select: options.select
    };
    
    return Buffer.from(JSON.stringify(keyObject)).toString('base64').substring(0, 50);
  }

  /**
   * Cache query result
   */
  cacheResult(key, data, count) {
    // Prevent cache from growing too large
    if (this.queryCache.size >= this.maxCacheSize) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      count,
      timestamp: Date.now()
    });
  }

  /**
   * Wait for available connection
   */
  async waitForConnection() {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.connectionPool.active < this.connectionPool.max) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
    console.log('🧹 Query cache cleared');
  }

  /**
   * Get query statistics
   */
  getStats() {
    return {
      ...this.queryStats,
      cacheSize: this.queryCache.size,
      activeConnections: this.connectionPool.active,
      cacheHitRate: this.queryStats.totalQueries > 0 
        ? Math.round((this.queryStats.cachedQueries / this.queryStats.totalQueries) * 100) 
        : 0
    };
  }

  /**
   * Emergency cleanup
   */
  emergencyCleanup() {
    console.log('🚨 OptimizedQueryManager: Emergency cleanup initiated');
    
    // Clear cache
    this.clearCache();
    
    // Reset connection pool
    this.connectionPool.active = 0;
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    console.log('✅ OptimizedQueryManager: Emergency cleanup completed');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.optimizedQuery('supervisors', {
        limit: 1,
        select: 'id',
        useCache: false
      });
      
      return {
        healthy: true,
        connectionActive: this.connectionPool.active < this.connectionPool.max,
        cacheSize: this.queryCache.size,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        stats: this.getStats()
      };
    }
  }
}

// Create singleton instance
const optimizedQueryManager = new OptimizedQueryManager();

// Register with memory monitor
memoryMonitor.registerCleanupCallback((type) => {
  if (type === 'emergency' || type === 'emergency_shutdown') {
    optimizedQueryManager.emergencyCleanup();
  }
});

export default optimizedQueryManager;
export { OptimizedQueryManager };