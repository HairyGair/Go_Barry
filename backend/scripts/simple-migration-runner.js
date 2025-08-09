/*
 * Simple Migration Runner using axios
 * Runs the breakdown tracker migration directly
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://haountnghecfrsoniubq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3ODE0OSwiZXhwIjoyMDYzMjU0MTQ5fQ.k2Ni4hNfyqzJl3AHHQF1mDdRJ7g5s1o5qTlrxmCsvaY';

async function executeSql(sql) {
  try {
    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/rpc/sql`,
      { query: sql },
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runMigration() {
  console.log('🚀 Starting Breakdown Tracker migration...');
  
  // Read the SQL file
  const sqlPath = join(__dirname, '../migrations/create_breakdown_tracker.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  
  console.log('📖 Migration file loaded');
  
  // Execute the entire SQL as one transaction
  const result = await executeSql(sql);
  
  if (result.success) {
    console.log('✅ Migration executed successfully!');
    
    // Test the setup
    console.log('\n🔍 Testing the setup...');
    
    // Test get_active_breakdowns function
    const testResult = await executeSql('SELECT * FROM get_active_breakdowns()');
    if (testResult.success) {
      console.log(`✅ Function test passed: found ${testResult.data.length} active breakdowns`);
    } else {
      console.log('⚠️ Function test failed:', testResult.error);
    }
    
    console.log('\n🎉 Breakdown Tracker is ready!');
    console.log('📊 You can now start using the breakdown tracking system.');
    
  } else {
    console.error('❌ Migration failed:', result.error);
    
    // Try individual table creation
    console.log('\n🔄 Trying basic table creation...');
    
    const basicSql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS breakdowns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id TEXT NOT NULL,
        depot_id TEXT,
        route_id TEXT,
        location TEXT,
        supervisor_badge TEXT NOT NULL,
        severity TEXT DEFAULT 'PENDING',
        status TEXT NOT NULL DEFAULT 'received',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS breakdown_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        breakdown_id UUID NOT NULL REFERENCES breakdowns(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        by_badge TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    const basicResult = await executeSql(basicSql);
    if (basicResult.success) {
      console.log('✅ Basic tables created successfully!');
    } else {
      console.error('❌ Basic table creation failed:', basicResult.error);
    }
  }
}

runMigration();