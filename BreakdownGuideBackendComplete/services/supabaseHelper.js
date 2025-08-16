// backend/services/supabaseHelper.js
// Enhanced Supabase helper with connection pooling and reliability features

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import supabaseService from './supabaseService.js';
import supabaseConnectionManager from './supabaseConnectionManager.js';

// Load environment variables
dotenv.config();

let supabaseClient = null;
let isEnhancedModeEnabled = false;

/**
 * Get Supabase client - now with enhanced connection management
 */
export async function getSupabaseClient(useEnhancedMode = true) {
  // Use enhanced service if available and requested
  if (useEnhancedMode && !supabaseService.isInitialized) {
    try {
      await supabaseService.initialize();
      isEnhancedModeEnabled = true;
      console.log('✅ Enhanced Supabase service activated');
      return {
        enhanced: true,
        service: supabaseService,
        connectionManager: supabaseConnectionManager
      };
    } catch (error) {
      console.warn('⚠️ Enhanced mode failed, falling back to basic client:', error.message);
    }
  }
  
  if (isEnhancedModeEnabled) {
    return {
      enhanced: true,
      service: supabaseService,
      connectionManager: supabaseConnectionManager
    };
  }

  // Fallback to basic client
  if (supabaseClient) {
    return { enhanced: false, client: supabaseClient };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase environment variables missing!');
    console.error('❌ SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('❌ SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    return null;
  }

  try {
    console.log('🔍 Creating basic Supabase client...');
    
    const options = {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      }
    };
    
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      options
    );
    
    console.log('✅ Basic Supabase client created successfully');
    return { enhanced: false, client: supabaseClient };
    
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Enhanced query function with automatic retry and connection pooling
 */
export async function executeSupabaseQuery(operation, table, options = {}) {
  try {
    const supabase = await getSupabaseClient(true);
    
    if (supabase?.enhanced) {
      // Use enhanced service with connection pooling
      switch (operation) {
        case 'select':
          return await supabase.service.select(table, options);
        case 'insert':
          return await supabase.service.insert(table, options.data, options);
        case 'update':
          return await supabase.service.update(table, options.data, options.filters, options);
        case 'delete':
          return await supabase.service.delete(table, options.filters, options);
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } else if (supabase?.client) {
      // Fallback to basic client
      console.warn('⚠️ Using basic Supabase client (no connection pooling)');
      let query = supabase.client.from(table);
      
      switch (operation) {
        case 'select':
          if (options.columns) query = query.select(options.columns);
          if (options.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          if (options.order) query = query.order(options.order.column, { ascending: options.order.ascending });
          if (options.limit) query = query.limit(options.limit);
          if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
          
          const { data, error } = await query;
          return { success: !error, data, error: error?.message };
          
        case 'insert':
          const { data: insertData, error: insertError } = await query.insert(options.data);
          return { success: !insertError, data: insertData, error: insertError?.message };
          
        case 'update':
          let updateQuery = query.update(options.data);
          Object.entries(options.filters || {}).forEach(([key, value]) => {
            updateQuery = updateQuery.eq(key, value);
          });
          const { data: updateData, error: updateError } = await updateQuery;
          return { success: !updateError, data: updateData, error: updateError?.message };
          
        case 'delete':
          let deleteQuery = query.delete();
          Object.entries(options.filters || {}).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value);
          });
          const { data: deleteData, error: deleteError } = await deleteQuery;
          return { success: !deleteError, data: deleteData, error: deleteError?.message };
      }
    }
    
    throw new Error('No Supabase client available');
  } catch (error) {
    console.error(`❌ Supabase ${operation} error (${table}):`, error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Backward compatibility - get streetworks with enhanced reliability
 */
export async function getStreetworks(options = {}) {
  return await executeSupabaseQuery('select', 'streetworks', options);
}

/**
 * Backward compatibility - get supervisor sessions
 */
export async function getSupervisorSessions(options = {}) {
  return await executeSupabaseQuery('select', 'supervisor_sessions', options);
}

/**
 * Get connection health and statistics
 */
export async function getConnectionHealth() {
  try {
    const supabase = await getSupabaseClient(true);
    
    if (supabase?.enhanced) {
      return supabase.service.getHealth();
    } else {
      // Basic health check
      const testResult = await executeSupabaseQuery('select', 'streetworks', { limit: 1 });
      return {
        service: { status: 'basic-mode' },
        connectionManager: {
          status: testResult.success ? 'healthy' : 'unhealthy',
          details: { error: testResult.error }
        }
      };
    }
  } catch (error) {
    return {
      service: { status: 'error' },
      connectionManager: {
        status: 'unhealthy',
        details: { error: error.message }
      }
    };
  }
}

/**
 * Get connection statistics
 */
export async function getConnectionStats() {
  try {
    const supabase = await getSupabaseClient(true);
    
    if (supabase?.enhanced) {
      return supabase.service.getStats();
    } else {
      return {
        service: { initialized: true, mode: 'basic' },
        connectionManager: { mode: 'basic-client' }
      };
    }
  } catch (error) {
    return {
      service: { initialized: false, error: error.message },
      connectionManager: { error: error.message }
    };
  }
}

/**
 * Test Supabase connection with enhanced diagnostics
 */
export async function testSupabaseConnection() {
  try {
    const supabase = await getSupabaseClient(true);
    
    if (supabase?.enhanced) {
      return await supabase.service.testConnection();
    } else if (supabase?.client) {
      // Basic client test
      const { count, error } = await supabase.client
        .from('streetworks')
        .select('*', { count: 'exact', head: true });
        
      return {
        success: !error,
        error: error?.message,
        count,
        mode: 'basic'
      };
    }
    
    return { success: false, error: 'No client available' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
