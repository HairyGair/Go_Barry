// backend/utils/databaseHealthCheck.js
// Database connectivity health check utility

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class DatabaseHealthCheck {
  constructor() {
    // Debug environment variables
    console.log('🔍 Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
    console.log('🔍 Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      this.supabase = null;
      this.isHealthy = false;
      return;
    }
    
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    this.lastCheck = null;
    this.isHealthy = false;
  }

  async checkSupabaseConnection() {
    console.log('🏥 Checking Supabase database connection...');
    
    if (!this.supabase) {
      return {
        healthy: false,
        error: 'Supabase client not initialized - check environment variables',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Test basic connectivity with a simple query
      const { data, error } = await Promise.race([
        this.supabase.from('streetmanager_summaries').select('id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);

      if (error) {
        console.error('❌ Supabase connection error:', error.message);
        this.isHealthy = false;
        return { 
          healthy: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      console.log('✅ Supabase connection healthy');
      this.isHealthy = true;
      this.lastCheck = Date.now();
      
      return { 
        healthy: true, 
        timestamp: new Date().toISOString(),
        tablesAccessible: true
      };

    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      this.isHealthy = false;
      
      return { 
        healthy: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkCriticalTables() {
    console.log('🗄️ Checking critical table access...');
    
    const tables = [
      'streetmanager_summaries',
      'roadworks', 
      'manual_incidents'
    ];

    const results = {};

    for (const table of tables) {
      try {
        const { error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);

        results[table] = {
          accessible: !error,
          error: error?.message
        };

        if (error) {
          console.warn(`⚠️ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} accessible`);
        }

      } catch (error) {
        results[table] = {
          accessible: false,
          error: error.message
        };
        console.error(`❌ Error checking table ${table}:`, error.message);
      }
    }

    return results;
  }

  getHealthStatus() {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastCheck,
      checkAge: this.lastCheck ? Date.now() - this.lastCheck : null
    };
  }
}

export default new DatabaseHealthCheck();