#!/usr/bin/env node
// create-incidents-table.js
// Create the manual_incidents table in Supabase database

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Extract database connection details from Supabase URL
const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const [project, region] = dbUrl.split('.');

// Create PostgreSQL connection string
const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || 'your-db-password'}@db.${project}.supabase.co:5432/postgres`;

const { Client } = pg;

async function createIncidentsTable() {
  try {
    console.log('🔧 Creating manual_incidents table in Supabase...');
    
    // Read the SQL file
    const sqlContent = readFileSync(path.join(__dirname, 'create_incidents_table.sql'), 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      
      // Try alternative approach - execute each statement individually
      console.log('🔄 Trying alternative approach...');
      
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
          
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement.trim()
          });
          
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.error('❌ Statement error:', stmtError);
          }
        }
      }
    }
    
    // Test the table exists by trying to select from it
    console.log('🔍 Testing table creation...');
    const { data: testData, error: testError } = await supabase
      .from('manual_incidents')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table test failed:', testError);
      console.log('🔧 Attempting direct table creation...');
      
      // Direct table creation
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS manual_incidents (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          subtype TEXT,
          location TEXT NOT NULL,
          coordinates JSONB,
          description TEXT,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE,
          severity TEXT NOT NULL,
          notes TEXT,
          affected_routes TEXT[],
          status TEXT NOT NULL DEFAULT 'active',
          created_by TEXT NOT NULL,
          created_by_name TEXT NOT NULL,
          created_by_role TEXT NOT NULL,
          enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
          tomtom_features JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          source TEXT NOT NULL DEFAULT 'manual',
          retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });
      
      if (createError) {
        console.error('❌ Direct table creation failed:', createError);
        process.exit(1);
      }
    }
    
    console.log('✅ manual_incidents table created successfully');
    
    // Test inserting a sample incident
    console.log('🧪 Testing incident insertion...');
    const testIncident = {
      id: 'test_incident_' + Date.now(),
      type: 'Traffic Incident',
      location: 'Test Location',
      description: 'Test incident for table validation',
      start_time: new Date().toISOString(),
      severity: 'Medium',
      status: 'active',
      created_by: 'test',
      created_by_name: 'Test User',
      created_by_role: 'Supervisor',
      source: 'manual',
      affected_routes: ['1', '2']
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('manual_incidents')
      .insert([testIncident])
      .select();
    
    if (insertError) {
      console.error('❌ Test insertion failed:', insertError);
    } else {
      console.log('✅ Test incident inserted successfully');
      
      // Clean up test incident
      await supabase
        .from('manual_incidents')
        .delete()
        .eq('id', testIncident.id);
      
      console.log('🧹 Test incident cleaned up');
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create incidents table:', error);
    process.exit(1);
  }
}

// Run the script
createIncidentsTable().catch(console.error);