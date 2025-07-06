#!/usr/bin/env node

/**
 * Try to trigger VACUUM operations via Supabase API
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

async function attemptVacuumOperations() {
  console.log('🔧 Attempting VACUUM operations via Supabase API...\n');
  
  try {
    // Try different SQL execution methods
    
    // Method 1: Use rpc to execute raw SQL
    console.log('📝 Trying RPC method...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: 'VACUUM FULL roadworks;'
    });
    
    if (rpcError) {
      console.log('❌ RPC method failed:', rpcError.message);
    } else {
      console.log('✅ RPC method worked!', rpcData);
      return;
    }
    
    // Method 2: Try using the REST API directly
    console.log('\n📝 Trying REST API method...');
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/vacuum_tables`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ REST API worked!', result);
      return;
    } else {
      console.log('❌ REST API failed:', response.status, response.statusText);
    }
    
    // Method 3: Try creating a stored procedure
    console.log('\n📝 Trying to create stored procedure...');
    const { data: procData, error: procError } = await supabase
      .from('pg_proc')
      .select('*')
      .limit(1);
    
    if (procError) {
      console.log('❌ Cannot access pg_proc:', procError.message);
    } else {
      console.log('✅ Can access system tables');
      
      // Try to create a function that runs VACUUM
      const { data: createFunc, error: createError } = await supabase.rpc('sql', {
        query: `
        CREATE OR REPLACE FUNCTION emergency_vacuum()
        RETURNS text AS $$
        BEGIN
          EXECUTE 'VACUUM FULL roadworks';
          EXECUTE 'VACUUM FULL supervisors';
          EXECUTE 'VACUUM FULL supervisor_sessions';
          EXECUTE 'VACUUM FULL message_templates';
          RETURN 'VACUUM FULL completed successfully';
        END;
        $$ LANGUAGE plpgsql;
        `
      });
      
      if (createError) {
        console.log('❌ Function creation failed:', createError.message);
      } else {
        console.log('✅ Function created, now executing...');
        
        const { data: execResult, error: execError } = await supabase.rpc('emergency_vacuum');
        
        if (execError) {
          console.log('❌ Function execution failed:', execError.message);
        } else {
          console.log('🎉 SUCCESS! VACUUM FULL completed via function!');
          console.log('Result:', execResult);
          
          // Check new database size
          const { data: sizeData } = await supabase.rpc('sql', {
            query: "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
          });
          
          console.log('📊 New database size:', sizeData);
          return;
        }
      }
    }
    
    console.log('\n❌ All methods failed. Database bloat cannot be fixed via API.');
    console.log('💡 Recommendation: Submit urgent support ticket to Supabase.');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

async function main() {
  console.log('🚀 Go BARRY - API VACUUM Attempt\n');
  await attemptVacuumOperations();
}

main().catch(console.error);