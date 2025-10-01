// Enhanced Supabase Configuration for Go BARRY Breakdown Management
// Production-ready with connection pooling, error handling, and retry logic

import { createClient } from '@supabase/supabase-js';

class SupabaseConfig {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    this.client = null;
    this.serviceClient = null;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.isInitialized = false;
    
    this.validateEnvironment();
  }

  validateEnvironment() {
    const missing = [];
    if (!this.supabaseUrl) missing.push('SUPABASE_URL');
    if (!this.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
    
    if (missing.length > 0) {
      console.error('❌ Missing required Supabase environment variables:', missing.join(', '));
      console.error('📝 Please check your .env file contains:');
      console.error('   SUPABASE_URL=https://your-project.supabase.co');
      console.error('   SUPABASE_ANON_KEY=your-anon-key');
      
      // Don't exit in production, allow degraded operation
      if (process.env.NODE_ENV === 'development') {
        process.exit(1);
      }
    }
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Create anon client for general operations
      if (this.supabaseUrl && this.supabaseAnonKey) {
        this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'X-Client-Info': 'go-barry-breakdown-v1'
            }
          },
          realtime: {
            params: {
              eventsPerSecond: 2
            }
          }
        });
        console.log('✅ Supabase anon client initialized');
      }

      // Create service client for admin operations
      if (this.supabaseUrl && this.supabaseServiceKey) {
        this.serviceClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'X-Client-Info': 'go-barry-breakdown-service-v1'
            }
          }
        });
        console.log('✅ Supabase service client initialized');
      }

      // Test connection
      const connectionTest = await this.testConnection();
      if (connectionTest) {
        this.isInitialized = true;
        console.log('🎉 Supabase configuration completed successfully');
        return true;
      } else {
        console.warn('⚠️ Supabase connection test failed, continuing with degraded functionality');
        return false;
      }
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error.message);
      return false;
    }
  }

  async testConnection() {
    if (!this.client) {
      console.log('⚠️ No Supabase client available for connection test');
      return false;
    }

    try {
      // Test basic connectivity
      const { data, error } = await this.client
        .from('breakdowns')
        .select('count')
        .limit(1);

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.message.includes('relation "breakdowns" does not exist')) {
          console.log('📋 Breakdowns table not found - may need to run migrations');
          return false;
        }
        
        console.error('🔍 Connection test error:', error.message);
        return false;
      }

      console.log('✅ Supabase connection test successful');
      this.connectionAttempts = 0; // Reset counter on success
      return true;
    } catch (err) {
      this.connectionAttempts++;
      console.error(`❌ Connection test attempt ${this.connectionAttempts}/${this.maxRetries} failed:`, err.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Retrying connection in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.testConnection();
      }
      
      return false;
    }
  }

  getClient() {
    if (!this.client) {
      console.warn('⚠️ Supabase client not initialized');
      return null;
    }
    return this.client;
  }

  getServiceClient() {
    if (!this.serviceClient) {
      console.warn('⚠️ Supabase service client not initialized');
      return this.client; // Fallback to anon client
    }
    return this.serviceClient;
  }

  async executeQuery(queryFn, retries = 2) {
    const client = this.getClient();
    if (!client) {
      throw new Error('No Supabase client available');
    }

    try {
      const result = await queryFn(client);
      return result;
    } catch (error) {
      if (retries > 0 && (error.message.includes('timeout') || error.message.includes('network'))) {
        console.log(`🔄 Retrying query (${retries} attempts remaining)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.executeQuery(queryFn, retries - 1);
      }
      throw error;
    }
  }

  // Health check for monitoring
  async getHealthStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      initialized: this.isInitialized,
      clientAvailable: !!this.client,
      serviceClientAvailable: !!this.serviceClient,
      connectionAttempts: this.connectionAttempts
    };

    if (this.client) {
      try {
        const startTime = Date.now();
        const { data, error } = await this.client
          .from('breakdowns')
          .select('count')
          .limit(1);
        
        const responseTime = Date.now() - startTime;
        
        status.connectionTest = {
          success: !error,
          responseTime: `${responseTime}ms`,
          error: error?.message || null
        };
      } catch (err) {
        status.connectionTest = {
          success: false,
          error: err.message
        };
      }
    }

    return status;
  }
}

// Create singleton instance
const supabaseConfig = new SupabaseConfig();

// Initialize on module load
supabaseConfig.initialize().catch(err => {
  console.error('Failed to initialize Supabase on module load:', err.message);
});

// Export both the configured client and the config instance
export default supabaseConfig.getClient();
export const supabaseService = supabaseConfig.getServiceClient();
export const supabaseHealth = () => supabaseConfig.getHealthStatus();
export const testConnection = () => supabaseConfig.testConnection();
export { supabaseConfig };