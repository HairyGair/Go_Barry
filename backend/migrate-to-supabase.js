#!/usr/bin/env node

/**
 * Go BARRY - Supabase Migration Script
 * Migrates data from JSON files to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Table schemas
const schemas = {
  supervisors: `
    CREATE TABLE IF NOT EXISTS supervisors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      badge TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      shift TEXT NOT NULL,
      permissions TEXT[] NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_supervisors_badge ON supervisors(badge);
    CREATE INDEX IF NOT EXISTS idx_supervisors_active ON supervisors(active);
  `,

  dismissed_alerts: `
    CREATE TABLE IF NOT EXISTS dismissed_alerts (
      id TEXT PRIMARY KEY,
      supervisor_id TEXT REFERENCES supervisors(id),
      supervisor_badge TEXT NOT NULL,
      reason TEXT,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      alert_hash TEXT,
      alert_data JSONB
    );
    
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_supervisor ON dismissed_alerts(supervisor_id);
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_timestamp ON dismissed_alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_hash ON dismissed_alerts(alert_hash);
  `,

  major_events: `
    CREATE TABLE IF NOT EXISTS major_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      affected_routes TEXT[],
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_major_events_status ON major_events(status);
    CREATE INDEX IF NOT EXISTS idx_major_events_start_time ON major_events(start_time);
  `,

  message_templates: `
    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL,
      variables TEXT[],
      channels TEXT[],
      auto_trigger JSONB,
      usage_count INTEGER DEFAULT 0,
      last_used TIMESTAMP WITH TIME ZONE,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
    CREATE INDEX IF NOT EXISTS idx_message_templates_priority ON message_templates(priority);
  `,

  template_categories: `
    CREATE TABLE IF NOT EXISTS template_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  supervisor_sessions: `
    CREATE TABLE IF NOT EXISTS supervisor_sessions (
      id TEXT PRIMARY KEY,
      supervisor_id TEXT REFERENCES supervisors(id),
      badge TEXT NOT NULL,
      login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      active BOOLEAN DEFAULT true
    );
    
    CREATE INDEX IF NOT EXISTS idx_supervisor_sessions_supervisor ON supervisor_sessions(supervisor_id);
    CREATE INDEX IF NOT EXISTS idx_supervisor_sessions_active ON supervisor_sessions(active);
  `,

  historical_incidents: `
    CREATE TABLE IF NOT EXISTS historical_incidents (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      coordinates FLOAT[],
      source TEXT NOT NULL,
      features JSONB,
      affected_routes TEXT[],
      resolution_time_minutes INTEGER,
      predicted_severity TEXT,
      predicted_impact TEXT,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_historical_incidents_timestamp ON historical_incidents(timestamp);
    CREATE INDEX IF NOT EXISTS idx_historical_incidents_source ON historical_incidents(source);
    CREATE INDEX IF NOT EXISTS idx_historical_incidents_location ON historical_incidents(location);
  `
};

async function loadJsonFile(filename) {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`⚠️  Could not load ${filename}:`, error.message);
    return null;
  }
}

async function createTables() {
  console.log('🔨 Creating Supabase tables...');
  console.log('⚠️  Note: You may need to run the SQL schemas manually in Supabase Dashboard');
  console.log('📋 SQL Schema saved to: supabase-schema.sql\n');
  
  // Save all schemas to a file for manual execution
  let fullSchema = '-- Go BARRY Supabase Database Schema\n-- Run this in Supabase SQL Editor\n\n';
  
  for (const [tableName, schema] of Object.entries(schemas)) {
    fullSchema += `-- Table: ${tableName}\n${schema}\n\n`;
    console.log(`📝 Added ${tableName} schema to supabase-schema.sql`);
  }
  
  fs.writeFileSync(path.join(__dirname, 'supabase-schema.sql'), fullSchema);
  console.log('✅ Schema file created successfully');
}

async function migrateSupervisors() {
  console.log('\n👥 Migrating supervisors...');
  
  const supervisors = await loadJsonFile('supervisors.json');
  if (!supervisors) return;

  const supervisorList = Object.values(supervisors);
  
  for (const supervisor of supervisorList) {
    const { error } = await supabase
      .from('supervisors')
      .upsert({
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge,
        role: supervisor.role,
        shift: supervisor.shift,
        permissions: supervisor.permissions,
        active: supervisor.active,
        created_at: supervisor.createdAt || new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Error migrating supervisor ${supervisor.badge}:`, error);
    } else {
      console.log(`✅ Migrated supervisor: ${supervisor.badge} - ${supervisor.name}`);
    }
  }
}

async function migrateMessageTemplates() {
  console.log('\n📝 Migrating message templates...');
  
  const data = await loadJsonFile('message-templates.json');
  if (!data) return;

  // Migrate categories first
  if (data.categories) {
    for (const category of data.categories) {
      const { error } = await supabase
        .from('template_categories')
        .upsert(category);

      if (error) {
        console.error(`❌ Error migrating category ${category.id}:`, error);
      } else {
        console.log(`✅ Migrated category: ${category.name}`);
      }
    }
  }

  // Migrate templates
  if (data.templates) {
    for (const template of data.templates) {
      const { error } = await supabase
        .from('message_templates')
        .upsert({
          id: template.id,
          category: template.category,
          title: template.title,
          message: template.message,
          priority: template.priority,
          variables: template.variables,
          channels: template.channels,
          auto_trigger: template.autoTrigger,
          usage_count: template.usageCount || 0,
          last_used: template.lastUsed,
          created_by: template.createdBy,
          created_at: template.createdAt || new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error migrating template ${template.id}:`, error);
      } else {
        console.log(`✅ Migrated template: ${template.title}`);
      }
    }
  }
}

async function migrateHistoricalIncidents() {
  console.log('\n🚨 Migrating historical incidents...');
  
  const incidents = await loadJsonFile('historical-incidents.json');
  if (!incidents || !Array.isArray(incidents)) return;

  console.log(`Found ${incidents.length} incidents to migrate...`);
  
  // Batch insert for performance
  const batchSize = 50;
  for (let i = 0; i < incidents.length; i += batchSize) {
    const batch = incidents.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('historical_incidents')
      .upsert(batch.map(incident => ({
        id: incident.id,
        timestamp: incident.timestamp,
        title: incident.title,
        description: incident.description,
        location: incident.location,
        coordinates: incident.coordinates,
        source: incident.source,
        features: incident.features,
        affected_routes: incident.affectedRoutes,
        resolution_time_minutes: incident.resolutionTimeMinutes,
        predicted_severity: incident.predictedSeverity,
        predicted_impact: incident.predictedImpact,
        recorded_at: incident.recordedAt || incident.timestamp
      })));

    if (error) {
      console.error(`❌ Error migrating incident batch ${i}-${i + batch.length}:`, error);
    } else {
      console.log(`✅ Migrated incident batch: ${i + 1}-${Math.min(i + batchSize, incidents.length)} of ${incidents.length}`);
    }
  }
}

async function createBackups() {
  console.log('\n💾 Creating backups of JSON files...');
  
  const backupDir = path.join(__dirname, 'data', 'pre-migration-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filesToBackup = [
    'supervisors.json',
    'message-templates.json', 
    'historical-incidents.json',
    'dismissed-alerts.json',
    'major-events.json',
    'supervisor-sessions.json'
  ];

  for (const file of filesToBackup) {
    try {
      const sourcePath = path.join(__dirname, 'data', file);
      const backupPath = path.join(backupDir, `${Date.now()}-${file}`);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`✅ Backed up: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error backing up ${file}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting Supabase migration...\n');
  
  try {
    // Test connection
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('_test_table_that_doesnt_exist')
      .select('*')
      .limit(1);
    
    // We expect this to fail with "does not exist" - that means connection works
    if (error && (error.message.includes('does not exist') || error.message.includes('relation'))) {
      console.log('✅ Supabase connection successful\n');
    } else if (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    } else {
      console.log('✅ Supabase connection successful\n');
    }

    // Create backups
    await createBackups();

    // Create tables
    await createTables();

    // Migrate data
    await migrateSupervisors();
    await migrateMessageTemplates();
    await migrateHistoricalIncidents();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update backend services to use Supabase');
    console.log('2. Test all functionality');
    console.log('3. Remove JSON file dependencies');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
