// init-supabase-supervisor-sessions.js
// Script to initialize the supervisor_sessions table in Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function initializeSupabaseTable() {
  console.log('🔧 Initializing Supabase supervisor_sessions table...\n');
  
  try {
    // Test if table exists by querying it
    const { data, error } = await supabase
      .from('supervisor_sessions')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Table does not exist. Please run the SQL script in Supabase:\n');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and run the contents of create-supervisor-sessions-table.sql');
      console.log('4. Then run this script again\n');
      return;
    }
    
    if (error) {
      console.error('❌ Error checking table:', error);
      return;
    }
    
    console.log('✅ Table exists!');
    
    // Clean up any stale sessions (optional)
    console.log('\n🧹 Cleaning up stale sessions...');
    const { error: cleanupError } = await supabase
      .from('supervisor_sessions')
      .update({ 
        active: false,
        timeout_reason: 'System restart cleanup',
        updated_at: new Date().toISOString()
      })
      .eq('active', true);
    
    if (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError);
    } else {
      console.log('✅ Cleaned up any stale sessions');
    }
    
    // Check current sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('supervisor_sessions')
      .select('*')
      .order('last_activity', { ascending: false })
      .limit(10);
    
    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
    } else {
      console.log(`\n📊 Recent sessions (${sessions.length} found):`);
      sessions.forEach(session => {
        console.log(`- ${session.supervisor_name} (${session.supervisor_badge}) - Active: ${session.active} - Last: ${new Date(session.last_activity).toLocaleString()}`);
      });
    }
    
    console.log('\n✅ Supabase supervisor_sessions table is ready for use!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the initialization
initializeSupabaseTable().then(() => {
  console.log('\n✅ Initialization complete');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Initialization failed:', error);
  process.exit(1);
});