// backend/services/supabaseOptimizer.js
// Optimized Supabase operations for memory-constrained environment

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getFetch } from '../utils/fetchHelper.js';

// Load environment variables
dotenv.config();

console.log('✅ Initializing Supabase client...');

// Custom fetch implementation for Supabase
const customFetch = async (url, options = {}) => {
  const fetch = await getFetch();
  return fetch(url, options);
};

// Initialize Supabase client with auth disabled for reliability
let supabaseClient = null;

try {
  supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: customFetch,
        headers: {
          'X-Client-Info': 'go-barry-backend'
        }
      }
    }
  );
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Supabase init error:', error);
}

// Optimized batch operations to reduce memory usage
class SupabaseOptimizer {
  constructor() {
    this.batchQueue = [];
    this.batchTimer = null;
    this.BATCH_SIZE = 50;
    this.BATCH_DELAY = 1000; // 1 second
  }

  // Get Supabase client
  getClient() {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    return supabaseClient;
  }

  // Store alerts in batches to reduce memory
  async storeAlerts(alerts) {
    if (!supabaseClient) {
      console.log('⚠️ Supabase not available, skipping alert storage');
      return { success: false, error: 'Supabase not initialized' };
    }

    try {
      // Process in chunks to avoid memory issues
      const chunks = [];
      for (let i = 0; i < alerts.length; i += this.BATCH_SIZE) {
        chunks.push(alerts.slice(i, i + this.BATCH_SIZE));
      }

      let stored = 0;
      for (const chunk of chunks) {
        const { data, error } = await supabaseClient
          .from('traffic_alerts')
          .upsert(chunk, {
            onConflict: 'alert_hash',
            ignoreDuplicates: true
          });

        if (error) {
          console.error('❌ Supabase batch error:', error);
        } else {
          stored += chunk.length;
        }
      }

      console.log(`✅ Stored ${stored} alerts to Supabase`);
      return { success: true, stored };
    } catch (error) {
      console.error('❌ Supabase store error:', error);
      return { success: false, error: error.message };
    }
  }

  // Retrieve recent alerts with pagination
  async getRecentAlerts(limit = 100, offset = 0) {
    if (!supabaseClient) {
      return { success: false, error: 'Supabase not initialized', data: [] };
    }

    try {
      const { data, error } = await supabaseClient
        .from('traffic_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Supabase retrieve error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Store supervisor actions
  async logSupervisorAction(action) {
    if (!supabaseClient) {
      console.log('⚠️ Supabase not available, action not logged');
      return { success: false };
    }

    try {
      const { error } = await supabaseClient
        .from('supervisor_actions')
        .insert([action]);

      if (error) {
        console.error('❌ Supabase action log error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Supabase log error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get supervisor activity
  async getSupervisorActivity(supervisorId, limit = 50) {
    if (!supabaseClient) {
      return { success: false, data: [] };
    }

    try {
      const { data, error } = await supabaseClient
        .from('supervisor_actions')
        .select('*')
        .eq('supervisor_id', supervisorId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase activity error:', error);
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Supabase activity retrieve error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Clean up old alerts to save space
  async cleanupOldAlerts(daysToKeep = 7) {
    if (!supabaseClient) {
      return { success: false };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabaseClient
        .from('traffic_alerts')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('❌ Supabase cleanup error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Cleaned up alerts older than ${daysToKeep} days`);
      return { success: true };
    } catch (error) {
      console.error('❌ Supabase cleanup error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const supabaseOptimizer = new SupabaseOptimizer();

// Export for direct access if needed
export { supabaseClient };
