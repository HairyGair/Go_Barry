// backend/services/supabaseHelper.js
// Helper to create Supabase client with proper fetch implementation

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let supabaseClient = null;

export async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase environment variables missing!');
    console.error('❌ SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('❌ SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    return null;
  }

  try {
    console.log('🔍 Creating Supabase client...');
    
    // For Node.js 18+ with native fetch issues, we need to disable fetch
    // and let Supabase use its own cross-fetch polyfill
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

    // Don't specify fetch - let Supabase handle it
    // This avoids issues with Node.js native fetch
    
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      options
    );
    
    console.log('✅ Supabase client created successfully');
    
    // Test the connection
    try {
      const { data, error } = await supabaseClient
        .from('streetworks')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('❌ Supabase test query failed:', error);
      } else {
        console.log('✅ Supabase connection verified');
      }
    } catch (testError) {
      console.error('❌ Supabase connection test error:', testError);
    }
    
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
}

// Export a function to test the connection
export async function testSupabaseConnection() {
  const client = await getSupabaseClient();
  if (!client) {
    return { success: false, error: 'No client available' };
  }
  
  try {
    const { count, error } = await client
      .from('streetworks')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, count };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
