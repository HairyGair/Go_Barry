// backend/services/optimizedDatabaseService.js
// Memory-optimized database service with pagination and selective field loading

import { createClient } from '@supabase/supabase-js';

/**
 * Optimized Database Service for 2GB RAM constraint
 * Implements pagination, field selection, and query optimization
 */
class OptimizedDatabaseService {
  constructor() {
    this.supabase = null;
    this.queryCache = new Map();
    this.maxCacheSize = 100;
    this.connectionPool = new Set();
    this.queryStats = {
      totalQueries: 0,
      cachedQueries: 0,
      optimizedQueries: 0,
      avgQueryTime: 0
    };
    
    this.initializeConnection();
  }

  /**
   * Initialize Supabase connection
   */
  initializeConnection() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });

      console.log('✅ Optimized Database Service initialized');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
  }

  /**
   * Execute optimized paginated query with field selection
   */
  async executeOptimizedQuery(options = {}) {
    const {
      table,
      select_fields = '*',
      filters = {},
      sorting = [],
      pagination = { page: 0, limit: 100 },
      use_cache = true,
      cache_ttl = 300000 // 5 minutes
    } = options;

    const startTime = Date.now();
    this.queryStats.totalQueries++;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(table, select_fields, filters, sorting, pagination);
      
      // Check cache first
      if (use_cache && this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cache_ttl) {
          this.queryStats.cachedQueries++;
          console.log(`💾 Cache hit for ${table} query`);
          return {
            success: true,
            data: cached.data,
            metadata: cached.metadata,
            fromCache: true
          };
        } else {
          this.queryCache.delete(cacheKey);
        }
      }

      if (!this.supabase) {
        throw new Error('Database not initialized');
      }

      // Build query with optimizations
      let query = this.supabase.from(table);

      // Apply field selection to reduce memory usage
      if (select_fields && select_fields !== '*') {
        const fields = Array.isArray(select_fields) ? select_fields.join(',') : select_fields;
        query = query.select(fields);
      } else {
        query = query.select('*');
      }

      // Apply filters efficiently
      for (const [field, condition] of Object.entries(filters)) {
        if (condition === null || condition === undefined) continue;
        
        if (typeof condition === 'object' && condition.operator) {
          const { operator, value } = condition;
          switch (operator) {
            case 'eq':
              query = query.eq(field, value);
              break;
            case 'neq':
              query = query.neq(field, value);
              break;
            case 'gt':
              query = query.gt(field, value);
              break;
            case 'gte':
              query = query.gte(field, value);
              break;
            case 'lt':
              query = query.lt(field, value);
              break;
            case 'lte':
              query = query.lte(field, value);
              break;
            case 'like':
              query = query.like(field, value);
              break;
            case 'ilike':
              query = query.ilike(field, value);
              break;
            case 'in':
              query = query.in(field, Array.isArray(value) ? value : [value]);
              break;
            case 'not_in':
              query = query.not(field, 'in', Array.isArray(value) ? value : [value]);
              break;
            case 'is_null':
              query = query.is(field, null);
              break;
            case 'not_null':
              query = query.not(field, 'is', null);
              break;
          }
        } else {
          // Simple equality filter
          query = query.eq(field, condition);
        }
      }

      // Apply sorting
      if (sorting.length > 0) {
        for (const sort of sorting) {
          const { field, ascending = true } = sort;
          query = query.order(field, { ascending });
        }
      }

      // Apply pagination
      const { page = 0, limit = 100 } = pagination;
      const offset = page * limit;
      
      // Limit maximum page size to prevent memory issues
      const safeLimit = Math.min(limit, 1000);
      query = query.range(offset, offset + safeLimit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database query error: ${error.message}`);
      }

      // Prepare metadata
      const metadata = {
        table,
        totalRows: count,
        returnedRows: data ? data.length : 0,
        page: page,
        limit: safeLimit,
        hasMore: data && data.length === safeLimit,
        queryTime: Date.now() - startTime,
        fromCache: false
      };

      const result = {
        success: true,
        data: data || [],
        metadata
      };

      // Cache result if enabled
      if (use_cache && data && data.length > 0) {
        // Clean cache if too large
        if (this.queryCache.size >= this.maxCacheSize) {
          const oldestKey = this.queryCache.keys().next().value;
          this.queryCache.delete(oldestKey);
        }
        
        this.queryCache.set(cacheKey, {
          data: data,
          metadata,
          timestamp: Date.now()
        });
      }

      // Update statistics
      this.queryStats.optimizedQueries++;
      this.queryStats.avgQueryTime = (this.queryStats.avgQueryTime + metadata.queryTime) / 2;

      console.log(`🔍 Optimized query executed: ${table} (${metadata.queryTime}ms, ${metadata.returnedRows} rows)`);

      return result;

    } catch (error) {
      console.error(`❌ Database query error for ${table}:`, error);
      return {
        success: false,
        error: error.message,
        data: [],
        metadata: {
          table,
          queryTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }

  /**
   * Stream large datasets with memory-efficient pagination
   */
  async *streamQuery(options = {}) {
    const {
      table,
      select_fields = '*',
      filters = {},
      sorting = [],
      page_size = 100,
      max_pages = 100
    } = options;

    let currentPage = 0;
    let hasMore = true;

    console.log(`🌊 Starting stream query for ${table}...`);

    while (hasMore && currentPage < max_pages) {
      try {
        const result = await this.executeOptimizedQuery({
          table,
          select_fields,
          filters,
          sorting,
          pagination: { page: currentPage, limit: page_size },
          use_cache: false // Don't cache streaming queries
        });

        if (!result.success || !result.data || result.data.length === 0) {
          break;
        }

        // Yield page data
        yield {
          page: currentPage,
          data: result.data,
          metadata: result.metadata
        };

        // Check if there are more pages
        hasMore = result.metadata.hasMore;
        currentPage++;

        // Small delay to prevent overwhelming the database
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

      } catch (error) {
        console.error(`❌ Stream query error on page ${currentPage}:`, error);
        break;
      }
    }

    console.log(`✅ Stream query completed: ${currentPage} pages processed`);
  }

  /**
   * Execute aggregation queries with memory optimization
   */
  async executeAggregationQuery(options = {}) {
    const {
      table,
      aggregations = [],
      group_by = [],
      filters = {},
      having = {},
      use_cache = true
    } = options;

    try {
      // Build aggregation query
      const aggregationFields = aggregations.map(agg => {
        const { function: func, field, alias } = agg;
        if (alias) {
          return `${func}(${field}) as ${alias}`;
        }
        return `${func}(${field})`;
      }).join(',');

      const groupFields = group_by.length > 0 ? group_by.join(',') : '';
      const selectFields = groupFields ? `${groupFields},${aggregationFields}` : aggregationFields;

      // Use the optimized query method
      const result = await this.executeOptimizedQuery({
        table,
        select_fields: selectFields,
        filters,
        use_cache
      });

      return result;

    } catch (error) {
      console.error(`❌ Aggregation query error for ${table}:`, error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Batch insert with memory optimization
   */
  async batchInsert(table, records, options = {}) {
    const {
      batch_size = 100,
      on_conflict = 'error' // error, ignore, merge
    } = options;

    if (!Array.isArray(records) || records.length === 0) {
      return { success: true, inserted: 0 };
    }

    const startTime = Date.now();
    let totalInserted = 0;
    
    console.log(`📥 Starting batch insert to ${table}: ${records.length} records`);

    try {
      // Process records in batches to prevent memory issues
      for (let i = 0; i < records.length; i += batch_size) {
        const batch = records.slice(i, i + batch_size);
        
        let query = this.supabase.from(table).insert(batch);
        
        // Handle conflict resolution
        if (on_conflict === 'ignore') {
          query = query.onConflict().ignore();
        } else if (on_conflict === 'merge') {
          query = query.onConflict().merge();
        }

        const { data, error } = await query;

        if (error) {
          console.error(`❌ Batch insert error (batch ${Math.floor(i/batch_size) + 1}):`, error);
          
          if (on_conflict === 'error') {
            throw error;
          }
          // Continue with next batch if ignore/merge mode
        } else {
          totalInserted += batch.length;
        }

        // Clear batch reference for GC
        batch.length = 0;

        // Small delay between batches
        if (i + batch_size < records.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Batch insert completed: ${totalInserted} records in ${duration}ms`);

      return {
        success: true,
        inserted: totalInserted,
        duration
      };

    } catch (error) {
      console.error(`❌ Batch insert failed for ${table}:`, error);
      return {
        success: false,
        error: error.message,
        inserted: totalInserted
      };
    }
  }

  /**
   * Generate cache key for query caching
   */
  generateCacheKey(table, fields, filters, sorting, pagination) {
    const keyData = {
      table,
      fields: typeof fields === 'string' ? fields : JSON.stringify(fields),
      filters: JSON.stringify(filters),
      sorting: JSON.stringify(sorting),
      pagination: JSON.stringify(pagination)
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 50);
  }

  /**
   * Clear query cache
   */
  clearCache() {
    const cacheSize = this.queryCache.size;
    this.queryCache.clear();
    console.log(`🗑️ Cleared ${cacheSize} cached queries`);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      queries: this.queryStats,
      cache: {
        size: this.queryCache.size,
        maxSize: this.maxCacheSize
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      },
      connection: {
        initialized: !!this.supabase
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('🧹 Cleaning up OptimizedDatabaseService...');
    
    this.clearCache();
    this.connectionPool.clear();
    
    if (this.supabase) {
      // Supabase client doesn't have explicit cleanup method
      this.supabase = null;
    }
    
    console.log('✅ OptimizedDatabaseService cleanup complete');
  }
}

// Singleton instance
const optimizedDb = new OptimizedDatabaseService();

// Convenience functions for common operations

/**
 * Get roadworks with optimization
 */
export const getRoadworksOptimized = async (options = {}) => {
  return await optimizedDb.executeOptimizedQuery({
    table: 'streetworks',
    ...options
  });
};

/**
 * Get incidents with optimization
 */
export const getIncidentsOptimized = async (options = {}) => {
  return await optimizedDb.executeOptimizedQuery({
    table: 'incidents',
    ...options
  });
};

/**
 * Get supervisors with optimization
 */
export const getSupervisorsOptimized = async (options = {}) => {
  return await optimizedDb.executeOptimizedQuery({
    table: 'supervisors',
    ...options
  });
};

/**
 * Stream large datasets
 */
export const streamData = async function* (table, options = {}) {
  yield* optimizedDb.streamQuery({ table, ...options });
};

export default optimizedDb;