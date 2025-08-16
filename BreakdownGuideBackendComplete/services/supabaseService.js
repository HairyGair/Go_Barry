// backend/services/supabaseService.js
// Enhanced Supabase service using the connection manager

import supabaseConnectionManager from './supabaseConnectionManager.js';

class SupabaseService {
  constructor() {
    this.connectionManager = supabaseConnectionManager;
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      await this.connectionManager.initialize();
      this.isInitialized = true;
      
      console.log('✅ Enhanced Supabase Service initialized with connection pooling');
      return true;
    } catch (error) {
      console.error('❌ Supabase Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query with automatic retries and connection pooling
   */
  async select(table, options = {}) {
    const {
      columns = '*',
      filters = {},
      order = null,
      limit = null,
      offset = null,
      single = false
    } = options;

    try {
      const params = { select: columns };
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params[`${key}`] = `eq.${value}`;
        }
      });
      
      // Add ordering
      if (order) {
        params.order = typeof order === 'string' ? order : `${order.column}.${order.ascending ? 'asc' : 'desc'}`;
      }
      
      // Add pagination
      if (limit) params.limit = limit;
      if (offset) params.offset = offset;
      
      const result = await this.connectionManager.executeQuery('GET', table, { params });
      
      if (result.success) {
        let data = result.data;
        if (single && Array.isArray(data)) {
          data = data.length > 0 ? data[0] : null;
        }
        
        return {
          success: true,
          data,
          count: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0)
        };
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Supabase select error (${table}):`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Execute an INSERT query
   */
  async insert(table, data, options = {}) {
    const { returning = true, onConflict = null } = options;
    
    try {
      const headers = {};
      if (returning) headers.Prefer = 'return=representation';
      if (onConflict) headers.Prefer += `,resolution=${onConflict}`;
      
      const result = await this.connectionManager.executeQuery('POST', table, {
        data,
        customHeaders: headers
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Supabase insert error (${table}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute an UPDATE query
   */
  async update(table, data, filters = {}, options = {}) {
    const { returning = true } = options;
    
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params[`${key}`] = `eq.${value}`;
        }
      });
      
      const headers = {};
      if (returning) headers.Prefer = 'return=representation';
      
      const result = await this.connectionManager.executeQuery('PATCH', table, {
        data,
        params,
        customHeaders: headers
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Supabase update error (${table}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a DELETE query
   */
  async delete(table, filters = {}, options = {}) {
    const { returning = false } = options;
    
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params[`${key}`] = `eq.${value}`;
        }
      });
      
      const headers = {};
      if (returning) headers.Prefer = 'return=representation';
      
      const result = await this.connectionManager.executeQuery('DELETE', table, {
        params,
        customHeaders: headers
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Supabase delete error (${table}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute an UPSERT operation
   */
  async upsert(table, data, options = {}) {
    const { onConflict = 'id', returning = true } = options;
    
    return this.insert(table, data, {
      returning,
      onConflict: `merge-duplicates`
    });
  }

  /**
   * Get streetworks data with enhanced error handling
   */
  async getStreetworks(options = {}) {
    const {
      limit = 50,
      offset = 0,
      dateFrom = null,
      dateTo = null,
      status = null,
      source = null
    } = options;

    try {
      const filters = {};
      if (status) filters.status = status;
      if (source) filters.source = source;
      
      const result = await this.select('streetworks', {
        filters,
        limit,
        offset,
        order: 'created_at.desc'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching streetworks:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get supervisor sessions with connection pooling
   */
  async getSupervisorSessions(options = {}) {
    const { active = true, supervisorId = null } = options;
    
    try {
      const filters = {};
      if (active) filters.is_active = true;
      if (supervisorId) filters.supervisor_id = supervisorId;
      
      const result = await this.select('supervisor_sessions', {
        filters,
        order: 'created_at.desc'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching supervisor sessions:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Store supervisor action with enhanced reliability
   */
  async logSupervisorAction(actionData) {
    try {
      const result = await this.insert('supervisor_actions', {
        ...actionData,
        created_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error logging supervisor action:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch operations with connection pooling
   */
  async batch(operations) {
    const results = [];
    
    for (const operation of operations) {
      const { method, table, data, filters, options } = operation;
      
      let result;
      switch (method.toLowerCase()) {
        case 'select':
          result = await this.select(table, { ...filters, ...options });
          break;
        case 'insert':
          result = await this.insert(table, data, options);
          break;
        case 'update':
          result = await this.update(table, data, filters, options);
          break;
        case 'delete':
          result = await this.delete(table, filters, options);
          break;
        default:
          result = { success: false, error: `Unknown method: ${method}` };
      }
      
      results.push(result);
    }
    
    return {
      success: results.every(r => r.success),
      results,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    };
  }

  /**
   * Raw SQL query execution (if needed)
   */
  async rawQuery(sql, params = []) {
    try {
      console.warn('⚠️ Raw SQL query executed:', sql);
      
      const result = await this.connectionManager.executeQuery('POST', 'rpc/execute_sql', {
        data: { sql, params }
      });
      
      return result;
    } catch (error) {
      console.error('❌ Raw SQL query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      service: {
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      },
      connectionManager: this.connectionManager.getStats()
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      service: {
        status: this.isInitialized ? 'ready' : 'not-initialized'
      },
      connectionManager: this.connectionManager.getHealth()
    };
  }

  /**
   * Get the raw Supabase client for direct access
   * Returns the service client if available, otherwise the anon client
   */
  async getClient() {
    try {
      // Ensure initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Return service client if available, otherwise anon client
      if (this.connectionManager.clients.service) {
        return this.connectionManager.clients.service;
      }
      
      if (this.connectionManager.clients.anon) {
        return this.connectionManager.clients.anon;
      }

      // If no clients available, try to reinitialize
      await this.connectionManager.initialize();
      
      if (this.connectionManager.clients.service) {
        return this.connectionManager.clients.service;
      }
      
      if (this.connectionManager.clients.anon) {
        return this.connectionManager.clients.anon;
      }

      throw new Error('No Supabase client available');
    } catch (error) {
      console.error('❌ Error getting Supabase client:', error);
      return null;
    }
  }

  /**
   * Test connection with comprehensive diagnostics
   */
  async testConnection() {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      const result = await this.select('streetworks', { limit: 1 });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: result.success,
        responseTime,
        error: result.error || null,
        details: {
          connectionManager: this.connectionManager.getHealth(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: -1
      };
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    await this.connectionManager.shutdown();
    this.isInitialized = false;
    console.log('✅ Supabase Service shutdown completed');
  }
}

// Singleton instance
const supabaseService = new SupabaseService();

export default supabaseService;
