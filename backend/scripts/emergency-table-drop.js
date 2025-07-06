#!/usr/bin/env node

/**
 * EMERGENCY: Drop the 489MB streetmanager_notifications table immediately
 * 
 * This will reclaim 489MB (93% of database space) and fix the Supabase quota issue
 * Run this FIRST to prevent database from being paused again
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function emergencyTableDrop() {
  console.log('🚨 EMERGENCY TABLE DROP - Go BARRY Database Recovery\n');
  console.log('💥 This will DROP streetmanager_notifications table (489MB)');
  console.log('📉 Database size should drop from 510MB to ~21MB immediately\n');
  
  // Use anon key first, fallback to service key
  const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  try {
    console.log('⏰ Starting emergency drop procedure...\n');
    
    // Method 1: Try with SQL editor via REST API
    console.log('🔧 Method 1: REST API approach...');
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: 'DROP TABLE IF EXISTS streetmanager_notifications CASCADE;'
      })
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ REST API method worked!', result);
      
      // Verify table is gone
      const checkResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: "SELECT to_regclass('streetmanager_notifications') as table_exists;"
        })
      });
      
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        if (checkResult && checkResult[0]?.table_exists === null) {
          console.log('🎉 SUCCESS! Table completely removed!');
          console.log('📊 Database size should be dropping to ~21MB now');
          return;
        }
      }
    } else {
      console.log('❌ REST API failed:', response.status, response.statusText);
      console.log('Response:', await response.text());
    }
    
    // Method 2: Try RPC approach
    console.log('\n🔧 Method 2: RPC approach...');
    
    const { data: rpcData, error: rpcError } = await supabaseAnon.rpc('sql', {
      query: 'DROP TABLE IF EXISTS streetmanager_notifications CASCADE;'
    });
    
    if (rpcError) {
      console.log('❌ RPC method failed:', rpcError.message);
    } else {
      console.log('✅ RPC method worked!', rpcData);
      console.log('🎉 SUCCESS! Table dropped via RPC!');
      return;
    }
    
    // Method 3: Try simple table listing to see what's available
    console.log('\n🔧 Method 3: Checking available tables...');
    
    const { data: tables, error: tablesError } = await supabaseAnon
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('❌ Cannot access information_schema:', tablesError.message);
    } else {
      console.log('✅ Available tables:', tables?.map(t => t.table_name).join(', '));
      
      // Check if our problematic table is in the list
      const hasProblematicTable = tables?.some(t => t.table_name === 'streetmanager_notifications');
      if (hasProblematicTable) {
        console.log('⚠️ streetmanager_notifications table still exists');
        console.log('💡 MANUAL ACTION REQUIRED:');
        console.log('   1. Go to Supabase SQL Editor');
        console.log('   2. Run: DROP TABLE streetmanager_notifications CASCADE;');
        console.log('   3. This will immediately free 489MB');
      } else {
        console.log('🎉 Table not found in listing - may already be dropped!');
      }
    }
    
    console.log('\n📋 EMERGENCY SUMMARY:');
    console.log('🎯 Goal: Remove 489MB streetmanager_notifications table');
    console.log('📊 Expected result: Database size 510MB → ~21MB');
    console.log('⚠️ If methods above failed, manual SQL Editor action required');
    
  } catch (error) {
    console.error('❌ Emergency procedure failed:', error);
    console.log('\n💡 FALLBACK PLAN:');
    console.log('1. Log into Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Run: DROP TABLE streetmanager_notifications CASCADE;');
    console.log('4. Confirm 489MB space is reclaimed');
  }
}

// Run emergency procedure
emergencyTableDrop().catch(console.error);