// backend/services/supabaseConnectionManager.js
// Comprehensive Supabase connection manager with pooling, retries, and health checks

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

class SupabaseConnectionManager {
  constructor() {
    this.config = {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      maxRetries: 3,
      retryDelay: 1000, // Base delay in ms
      healthCheckInterval: 60000, // 1 minute
      connectionTimeout: 10000, // 10 seconds
      maxConcurrentConnections: 20,
      connectionPoolSize: 10
    };

    this.pool = {
      active: 0,
      waiting: [],
      connections: new Map(),
      stats: {
        created: 0,
        reused: 0,
        errors: 0,
        retries: 0,
        healthChecks: 0
      }
    };

    this.healthStatus = {
      isHealthy: false,
      lastCheck: null,
      consecutiveFailures: 0,
      averageResponseTime: 0,
      uptime: 0
    };

    this.clients = {
      anon: null,
      service: null
    };

    this.healthCheckTimer = null;
    this.startTime = Date.now();

    console.log('🔗 Supabase Connection Manager initializing...');
  }

  /**
   * Initialize the connection manager
   */
  async initialize() {
    try {
      if (!this.config.url || !this.config.anonKey) {
        throw new Error('Missing required Supabase configuration (URL or ANON_KEY)');
      }

      // Create Supabase clients with optimized config
      this.clients.anon = createClient(this.config.url, this.config.anonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 2 } },
        global: {
          headers: {
            'X-Connection-Manager': 'go-barry-v1'
          }
        }
      });

      if (this.config.serviceKey) {
        this.clients.service = createClient(this.config.url, this.config.serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { params: { eventsPerSecond: 2 } },
          global: {
            headers: {
              'X-Connection-Manager': 'go-barry-service-v1'
            }
          }
        });
      }

      // Initialize connection pool
      await this.initializeConnectionPool();

      // Start health monitoring
      this.startHealthMonitoring();

      console.log('✅ Supabase Connection Manager initialized');
      console.log(`📊 Pool size: ${this.config.connectionPoolSize}, Max concurrent: ${this.config.maxConcurrentConnections}`);
      
      return true;
    } catch (error) {
      console.error('❌ Supabase Connection Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize connection pool with pre-warmed connections
   */
  async initializeConnectionPool() {
    console.log('🏊 Initializing connection pool...');
    
    for (let i = 0; i < Math.min(3, this.config.connectionPoolSize); i++) {
      try {
        const connection = await this.createConnection();
        this.pool.connections.set(`init-${i}`, connection);
        this.pool.stats.created++;
      } catch (error) {
        console.warn(`⚠️ Failed to pre-warm connection ${i}:`, error.message);
      }
    }
    
    console.log(`✅ Connection pool initialized with ${this.pool.connections.size} connections`);
  }

  /**
   * Create a new connection with health validation
   */
  async createConnection() {
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const startTime = Date.now();
    
    try {
      // Create axios instance with optimized settings
      const connection = axios.create({
        baseURL: `${this.config.url}/rest/v1`,
        timeout: this.config.connectionTimeout,
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${this.config.serviceKey || this.config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal', // Reduce response size
          'X-Connection-ID': connectionId
        },
        maxRedirects: 2,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });

      // Add request interceptor for monitoring
      connection.interceptors.request.use((config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      });

      // Add response interceptor for error handling and stats
      connection.interceptors.response.use(
        (response) => {
          const duration = Date.now() - response.config.metadata.startTime;
          this.updateResponseTimeStats(duration);
          return response;
        },
        (error) => {
          this.pool.stats.errors++;
          return Promise.reject(error);
        }
      );

      // Test the connection
      await this.validateConnection(connection);
      
      const connectionTime = Date.now() - startTime;
      console.log(`✅ Connection ${connectionId} created in ${connectionTime}ms`);
      
      return {
        id: connectionId,
        instance: connection,
        created: Date.now(),
        lastUsed: Date.now(),
        requestCount: 0,
        isHealthy: true
      };
      
    } catch (error) {
      console.error(`❌ Failed to create connection ${connectionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate connection with a simple query
   */
  async validateConnection(connection) {
    try {
      const response = await connection.get('/streetworks?limit=1');
      return response.status < 400;
    } catch (error) {
      // Try alternative health check
      try {
        const response = await connection.get('/supervisor_sessions?limit=1');
        return response.status < 400;
      } catch (fallbackError) {
        throw new Error(`Connection validation failed: ${error.message}`);
      }
    }
  }

  /**
   * Get a connection from the pool with retry logic
   */
  async getConnection() {
    const maxWaitTime = 30000; // 30 seconds max wait
    const startWait = Date.now();

    while (Date.now() - startWait < maxWaitTime) {
      // Check if we can create a new connection
      if (this.pool.active < this.config.maxConcurrentConnections) {
        // Try to reuse existing connection first
        const reusableConnection = this.findReusableConnection();
        if (reusableConnection) {
          this.pool.active++;
          reusableConnection.lastUsed = Date.now();
          reusableConnection.requestCount++;
          this.pool.stats.reused++;
          return reusableConnection;
        }

        // Create new connection if pool not full
        if (this.pool.connections.size < this.config.connectionPoolSize) {
          try {
            const newConnection = await this.createConnection();
            this.pool.connections.set(newConnection.id, newConnection);
            this.pool.active++;
            this.pool.stats.created++;
            return newConnection;
          } catch (error) {
            console.warn('⚠️ Failed to create new connection, trying existing ones:', error.message);
          }
        }
      }

      // Wait briefly before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Connection pool exhausted - no connections available');
  }

  /**
   * Find a reusable connection from the pool
   */
  findReusableConnection() {
    for (const [id, connection] of this.pool.connections) {
      const age = Date.now() - connection.lastUsed;
      const isOld = age > 300000; // 5 minutes old
      
      if (connection.isHealthy && !isOld && connection.requestCount < 100) {
        return connection;
      }
      
      // Remove old or unhealthy connections
      if (isOld || !connection.isHealthy) {
        this.pool.connections.delete(id);
        console.log(`🗑️ Removed ${isOld ? 'old' : 'unhealthy'} connection ${id}`);
      }
    }
    
    return null;
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connection) {
    if (connection && this.pool.active > 0) {
      this.pool.active--;
      connection.lastUsed = Date.now();
      
      // Process any waiting requests
      if (this.pool.waiting.length > 0) {
        const waitingRequest = this.pool.waiting.shift();
        waitingRequest.resolve(connection);
      }
    }
  }

  /**
   * Execute query with retry mechanism
   */
  async executeQuery(method, table, options = {}) {
    const {
      data = null,
      params = {},
      retries = this.config.maxRetries,
      customHeaders = {}
    } = options;

    let lastError;
    let connection;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        connection = await this.getConnection();
        
        const config = {
          headers: { ...customHeaders },
          params: { 
            ...params,
            'X-Request-ID': `req-${Date.now()}-${attempt}`
          }
        };

        let response;
        switch (method.toUpperCase()) {
          case 'GET':
            response = await connection.instance.get(`/${table}`, config);
            break;
          case 'POST':
            response = await connection.instance.post(`/${table}`, data, config);
            break;
          case 'PATCH':
            response = await connection.instance.patch(`/${table}`, data, config);
            break;
          case 'DELETE':
            response = await connection.instance.delete(`/${table}`, config);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        this.releaseConnection(connection);
        return {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers
        };

      } catch (error) {
        if (connection) {
          this.releaseConnection(connection);
        }
        
        lastError = error;
        this.pool.stats.errors++;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        if (attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.warn(`⚠️ Query attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          this.pool.stats.retries++;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      status: lastError?.response?.status || 500
    };
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    console.log(`💗 Health monitoring started (${this.config.healthCheckInterval}ms intervals)`);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = Date.now();
    
    try {
      this.pool.stats.healthChecks++;
      
      // Test basic connectivity
      const testConnection = await this.createConnection();
      const healthResponse = await testConnection.instance.get('/streetworks?limit=1');
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);
      
      // Update health status
      this.healthStatus = {
        isHealthy: true,
        lastCheck: new Date().toISOString(),
        consecutiveFailures: 0,
        averageResponseTime: this.healthStatus.averageResponseTime,
        uptime: Date.now() - this.startTime
      };
      
      // Clean up test connection
      this.pool.connections.delete(testConnection.id);
      
      // Clean up old connections
      await this.cleanupConnections();
      
      console.log(`💗 Health check passed (${responseTime}ms)`);
      
    } catch (error) {
      this.healthStatus.consecutiveFailures++;
      this.healthStatus.isHealthy = this.healthStatus.consecutiveFailures < 3;
      this.healthStatus.lastCheck = new Date().toISOString();
      
      console.error(`💔 Health check failed (${this.healthStatus.consecutiveFailures}/3):`, error.message);
      
      // Emergency pool reset if health is critical
      if (this.healthStatus.consecutiveFailures >= 5) {
        console.error('🚨 Critical health failure - resetting connection pool');
        await this.resetConnectionPool();
      }
    }
  }

  /**
   * Clean up old and unhealthy connections
   */
  async cleanupConnections() {
    const now = Date.now();
    const maxAge = 600000; // 10 minutes
    let cleaned = 0;
    
    for (const [id, connection] of this.pool.connections) {
      const age = now - connection.created;
      const inactive = now - connection.lastUsed;
      
      if (age > maxAge || inactive > maxAge || !connection.isHealthy) {
        this.pool.connections.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old/unhealthy connections`);
    }
  }

  /**
   * Reset the entire connection pool
   */
  async resetConnectionPool() {
    console.log('🔄 Resetting connection pool...');
    
    this.pool.connections.clear();
    this.pool.active = 0;
    this.pool.waiting = [];
    
    // Reinitialize
    await this.initializeConnectionPool();
    
    console.log('✅ Connection pool reset completed');
  }

  /**
   * Update response time statistics
   */
  updateResponseTimeStats(responseTime) {
    if (this.healthStatus.averageResponseTime === 0) {
      this.healthStatus.averageResponseTime = responseTime;
    } else {
      this.healthStatus.averageResponseTime = 
        (this.healthStatus.averageResponseTime + responseTime) / 2;
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      pool: {
        size: this.pool.connections.size,
        active: this.pool.active,
        waiting: this.pool.waiting.length,
        maxSize: this.config.connectionPoolSize,
        maxConcurrent: this.config.maxConcurrentConnections,
        stats: this.pool.stats
      },
      health: this.healthStatus,
      config: {
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay,
        connectionTimeout: this.config.connectionTimeout,
        healthCheckInterval: this.config.healthCheckInterval
      },
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      status: this.healthStatus.isHealthy ? 'healthy' : 'unhealthy',
      details: this.healthStatus,
      poolStatus: {
        connections: this.pool.connections.size,
        active: this.pool.active,
        utilization: ((this.pool.active / this.config.maxConcurrentConnections) * 100).toFixed(1) + '%'
      }
    };
  }

  /**
   * Shutdown the connection manager
   */
  async shutdown() {
    console.log('🚪 Shutting down Supabase Connection Manager...');
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.pool.connections.clear();
    this.pool.active = 0;
    this.pool.waiting = [];
    
    console.log('✅ Supabase Connection Manager shutdown completed');
  }
}

// Singleton instance
const supabaseConnectionManager = new SupabaseConnectionManager();

export default supabaseConnectionManager;
