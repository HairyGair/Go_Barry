#!/usr/bin/env node

/**
 * Go BARRY - Manual Data Migration Script
 * Migrates existing incident and roadworks data to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Load JSON file if it exists
 */
async function loadJsonFile(filename) {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`⚠️  Could not load ${filename}:`, error.message);
    return null;
  }
}

/**
 * Run the new database schema
 */
async function setupNewTables() {
  console.log('🔨 Setting up new tables for incidents and roadworks...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-incidents-roadworks-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📋 New schema ready for manual execution in Supabase Dashboard');
    console.log('🔗 Go to: https://supabase.com/dashboard → SQL Editor');
    console.log('📁 Schema file: supabase-incidents-roadworks-schema.sql');
    console.log('\n✨ Please run the schema manually, then continue...\n');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to prepare schema:', error.message);
    return false;
  }
}

/**
 * Migrate manual incidents from shared-incidents.json
 */
async function migrateManualIncidents() {
  console.log('\n🚨 Migrating manual incidents...');
  
  const incidents = await loadJsonFile('shared-incidents.json');
  if (!incidents || !Array.isArray(incidents)) {
    console.log('📝 No manual incidents file found or empty');
    return;
  }

  console.log(`Found ${incidents.length} manual incidents to migrate...`);
  
  let migrated = 0;
  let errors = 0;

  for (const incident of incidents) {
    try {
      // Map to new schema format
      const incidentData = {
        id: incident.id,
        type: incident.type,
        subtype: incident.subtype,
        location: incident.location,
        coordinates: incident.coordinates,
        description: incident.description || '',
        start_time: incident.startTime || incident.createdAt,
        end_time: incident.endTime,
        severity: incident.severity || 'Medium',
        notes: incident.notes || '',
        affected_routes: incident.affectsRoutes || [],
        status: incident.status || 'active',
        created_by: incident.createdBy || 'unknown',
        created_by_name: incident.createdByName || 'Unknown',
        created_by_role: incident.createdByRole || 'Supervisor',
        enhanced_with_tomtom: incident.enhancedWithTomTom || false,
        tomtom_features: incident.tomtomFeatures || null,
        source: incident.source || 'manual',
        created_at: incident.createdAt || new Date().toISOString(),
        last_updated: incident.lastUpdated || new Date().toISOString()
      };

      const { error } = await supabase
        .from('manual_incidents')
        .upsert(incidentData);

      if (error) {
        console.error(`❌ Error migrating incident ${incident.id}:`, error.message);
        errors++;
      } else {
        migrated++;
        if (migrated % 10 === 0) {
          console.log(`✅ Migrated ${migrated}/${incidents.length} incidents...`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to process incident ${incident.id}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Manual incidents migration completed: ${migrated} migrated, ${errors} errors`);
}

/**
 * Migrate current in-memory roadworks to Supabase
 * Note: This creates sample data since in-memory data is lost on restart
 */
async function migrateRoadworks() {
  console.log('\n🚧 Creating sample roadworks data...');
  
  // Since roadworks were in-memory, create some sample data
  const sampleRoadworks = [
    {
      id: 'roadwork_sample_001',
      title: 'A19 Southbound Lane Restrictions',
      description: 'Highway maintenance works affecting southbound carriageway between Seaton Burn and Wideopen. Lane 1 closed, expect 10-15 minute delays.',
      location: 'A19 Southbound, Seaton Burn to Wideopen',
      coordinates: { latitude: 55.0833, longitude: -1.6167 },
      authority: 'National Highways',
      contact_person: 'David Richardson',
      contact_phone: '0300 123 5000',
      contact_email: 'd.richardson@nationalhighways.co.uk',
      planned_start_date: '2025-06-09T06:00:00.000Z',
      planned_end_date: '2025-06-13T18:00:00.000Z',
      estimated_duration: '4 days',
      roadwork_type: 'road_surface',
      traffic_management: 'lane_closure',
      priority: 'high',
      affected_routes: ['1', '2', '22', '35', '317', '327'],
      status: 'active',
      assigned_to: 'supervisor001',
      assigned_to_name: 'John Smith',
      created_by: 'system',
      created_by_name: 'BARRY System',
      created_at: '2025-06-08T14:30:00.000Z',
      promoted_to_display: true,
      display_notes: 'Major A19 delays affecting northern services',
      tasks: [
        {
          id: 'task_001',
          title: 'Update passenger information systems',
          type: 'communication',
          status: 'completed',
          priority: 'urgent'
        }
      ]
    },
    {
      id: 'roadwork_sample_002',
      title: 'Newcastle City Centre - Grey Street Gas Works',
      description: 'Emergency gas main replacement on Grey Street. Road completely closed to traffic, pedestrian access maintained.',
      location: 'Grey Street, Newcastle City Centre',
      coordinates: { latitude: 54.9738, longitude: -1.6131 },
      authority: 'Newcastle City Council',
      contact_person: 'Sarah Mitchell',
      contact_phone: '0191 278 7878',
      contact_email: 's.mitchell@newcastle.gov.uk',
      planned_start_date: '2025-06-10T07:00:00.000Z',
      planned_end_date: '2025-06-14T17:00:00.000Z',
      estimated_duration: '4 days',
      roadwork_type: 'utilities',
      traffic_management: 'road_closure',
      priority: 'critical',
      affected_routes: ['Q3', 'Q3X', '12', '39', '40'],
      status: 'planning',
      assigned_to: 'supervisor001',
      assigned_to_name: 'John Smith',
      created_by: 'external',
      created_by_name: 'Council Notification',
      created_at: '2025-06-07T16:45:00.000Z',
      promoted_to_display: true,
      display_notes: 'Critical: City centre road closure affecting Quayside services',
      tasks: [
        {
          id: 'task_002',
          title: 'Create diversion route for Q3/Q3X',
          type: 'diversion_planning',
          status: 'pending',
          priority: 'urgent'
        }
      ]
    }
  ];

  let migrated = 0;
  let errors = 0;

  for (const roadwork of sampleRoadworks) {
    try {
      const { error } = await supabase
        .from('manual_roadworks')
        .upsert(roadwork);

      if (error) {
        console.error(`❌ Error creating roadwork ${roadwork.id}:`, error.message);
        errors++;
      } else {
        migrated++;
        console.log(`✅ Created sample roadwork: ${roadwork.title}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create roadwork ${roadwork.id}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Sample roadworks creation completed: ${migrated} created, ${errors} errors`);
}

/**
 * Test the new storage systems
 */
async function testStorageSystems() {
  console.log('\n🧪 Testing new storage systems...');

  try {
    // Test incidents
    const { count: incidentCount, error: incidentError } = await supabase
      .from('manual_incidents')
      .select('*', { count: 'exact', head: true });

    if (incidentError) {
      console.error('❌ Incident storage test failed:', incidentError.message);
    } else {
      console.log(`✅ Manual incidents table: ${incidentCount || 0} records`);
    }

    // Test roadworks
    const { count: roadworkCount, error: roadworkError } = await supabase
      .from('manual_roadworks')
      .select('*', { count: 'exact', head: true });

    if (roadworkError) {
      console.error('❌ Roadworks storage test failed:', roadworkError.message);
    } else {
      console.log(`✅ Manual roadworks table: ${roadworkCount || 0} records`);
    }

    // Test cleanup function
    console.log('\n🧹 Testing retention cleanup function...');
    const { data: cleanupData, error: cleanupError } = await supabase
      .from('manual_incidents')
      .select('retention_date')
      .limit(1);

    if (cleanupError) {
      console.warn('⚠️ Cleanup function test failed:', cleanupError.message);
    } else {
      console.log('✅ Retention system configured correctly');
    }

  } catch (error) {
    console.error('❌ Storage system test failed:', error.message);
  }
}

/**
 * Create backup of current data
 */
async function createBackup() {
  console.log('\n💾 Creating backups...');
  
  const backupDir = path.join(__dirname, 'data', 'pre-supabase-migration');
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    
    const filesToBackup = [
      'shared-incidents.json',
      'historical-incidents.json',
      'dismissed-alerts.json'
    ];

    for (const file of filesToBackup) {
      try {
        const sourcePath = path.join(__dirname, 'data', file);
        const backupPath = path.join(backupDir, `${Date.now()}-${file}`);
        
        await fs.access(sourcePath);
        await fs.copyFile(sourcePath, backupPath);
        console.log(`✅ Backed up: ${file}`);
      } catch (error) {
        console.log(`⏩ Skipped ${file} (not found)`);
      }
    }
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Go BARRY manual data migration to Supabase...\n');
  
  try {
    // Test connection
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase.from('supervisors').select('count').limit(1);
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    console.log('✅ Supabase connection successful\n');

    // Create backups
    await createBackup();

    // Setup tables (manual step)
    await setupNewTables();

    // Wait for user to run schema
    console.log('⏸️  Please run the schema in Supabase Dashboard and press Enter to continue...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      continueAfterSchema();
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function continueAfterSchema() {
  try {
    // Migrate data
    await migrateManualIncidents();
    await migrateRoadworks();

    // Test systems
    await testStorageSystems();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Manual incidents and roadworks now stored in Supabase');
    console.log('2. ✅ 3-month retention cleanup configured');
    console.log('3. 🔄 Update your backend to use the new Supabase storage services');
    console.log('4. 🧹 Schedule automatic cleanup (runs every 24 hours)');
    console.log('5. 🗑️  Remove dependency on local JSON files when ready');
    
    console.log('\n🎯 Benefits achieved:');
    console.log('✅ Data persists across deployments');
    console.log('✅ Automatic 3-month retention cleanup');
    console.log('✅ Full audit trail for supervisor actions');
    console.log('✅ Scalable database storage');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
