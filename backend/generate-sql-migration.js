#!/usr/bin/env node

/**
 * Go BARRY - Generate SQL Migration Script
 * Creates SQL INSERT statements for manual execution in Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to escape SQL strings
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'boolean') return str ? 'true' : 'false';
  if (typeof str === 'number') return str.toString();
  if (Array.isArray(str)) return `'{${str.map(s => escapeSql(s).replace(/'/g, "''")).join(',')}}'`;
  if (typeof str === 'object') return `'${JSON.stringify(str).replace(/'/g, "''")}'`;
  return `'${str.toString().replace(/'/g, "''")}'`;
}

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

function generateSupervisorInserts() {
  console.log('👥 Generating supervisor SQL...');
  const supervisors = loadJsonFile('supervisors.json');
  if (!supervisors) return '';

  let sql = '-- Supervisors Data\n';
  const supervisorList = Object.values(supervisors);
  
  for (const supervisor of supervisorList) {
    sql += `INSERT INTO supervisors (id, name, badge, role, shift, permissions, active, created_at) VALUES (\n`;
    sql += `  ${escapeSql(supervisor.id)},\n`;
    sql += `  ${escapeSql(supervisor.name)},\n`;
    sql += `  ${escapeSql(supervisor.badge)},\n`;
    sql += `  ${escapeSql(supervisor.role)},\n`;
    sql += `  ${escapeSql(supervisor.shift)},\n`;
    sql += `  ${escapeSql(supervisor.permissions)},\n`;
    sql += `  ${supervisor.active},\n`;
    sql += `  ${escapeSql(supervisor.createdAt || new Date().toISOString())}\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  name = EXCLUDED.name,\n`;
    sql += `  badge = EXCLUDED.badge,\n`;
    sql += `  role = EXCLUDED.role,\n`;
    sql += `  shift = EXCLUDED.shift,\n`;
    sql += `  permissions = EXCLUDED.permissions,\n`;
    sql += `  active = EXCLUDED.active,\n`;
    sql += `  updated_at = NOW();\n\n`;
  }
  
  console.log(`✅ Generated SQL for ${supervisorList.length} supervisors`);
  return sql;
}

function generateTemplateInserts() {
  console.log('📝 Generating template SQL...');
  const data = loadJsonFile('message-templates.json');
  if (!data) return '';

  let sql = '-- Message Templates Data\n';
  
  // Categories first
  if (data.categories) {
    sql += '-- Template Categories\n';
    for (const category of data.categories) {
      sql += `INSERT INTO template_categories (id, name, color) VALUES (\n`;
      sql += `  ${escapeSql(category.id)},\n`;
      sql += `  ${escapeSql(category.name)},\n`;
      sql += `  ${escapeSql(category.color)}\n`;
      sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `  name = EXCLUDED.name,\n`;
      sql += `  color = EXCLUDED.color;\n\n`;
    }
  }

  // Templates
  if (data.templates) {
    sql += '-- Message Templates\n';
    for (const template of data.templates) {
      sql += `INSERT INTO message_templates (id, category, title, message, priority, variables, channels, auto_trigger, usage_count, last_used, created_by, created_at) VALUES (\n`;
      sql += `  ${escapeSql(template.id)},\n`;
      sql += `  ${escapeSql(template.category)},\n`;
      sql += `  ${escapeSql(template.title)},\n`;
      sql += `  ${escapeSql(template.message)},\n`;
      sql += `  ${escapeSql(template.priority)},\n`;
      sql += `  ${escapeSql(template.variables)},\n`;
      sql += `  ${escapeSql(template.channels)},\n`;
      sql += `  ${escapeSql(template.autoTrigger)},\n`;
      sql += `  ${template.usageCount || 0},\n`;
      sql += `  ${template.lastUsed ? escapeSql(template.lastUsed) : 'NULL'},\n`;
      sql += `  ${escapeSql(template.createdBy)},\n`;
      sql += `  ${escapeSql(template.createdAt || new Date().toISOString())}\n`;
      sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `  category = EXCLUDED.category,\n`;
      sql += `  title = EXCLUDED.title,\n`;
      sql += `  message = EXCLUDED.message,\n`;
      sql += `  priority = EXCLUDED.priority,\n`;
      sql += `  variables = EXCLUDED.variables,\n`;
      sql += `  channels = EXCLUDED.channels,\n`;
      sql += `  auto_trigger = EXCLUDED.auto_trigger,\n`;
      sql += `  updated_at = NOW();\n\n`;
    }
  }
  
  console.log(`✅ Generated SQL for ${data.categories?.length || 0} categories and ${data.templates?.length || 0} templates`);
  return sql;
}

function generateIncidentInserts() {
  console.log('🚨 Generating historical incidents SQL...');
  const incidents = loadJsonFile('historical-incidents.json');
  if (!incidents || !Array.isArray(incidents)) return '';

  let sql = '-- Historical Incidents Data\n';
  console.log(`Processing ${incidents.length} incidents...`);
  
  // Process in batches to avoid huge SQL files
  const batchSize = 25;
  for (let i = 0; i < incidents.length; i += batchSize) {
    const batch = incidents.slice(i, i + batchSize);
    sql += `-- Batch ${Math.floor(i/batchSize) + 1}: Incidents ${i + 1}-${Math.min(i + batchSize, incidents.length)}\n`;
    
    for (const incident of batch) {
      sql += `INSERT INTO historical_incidents (id, timestamp, title, description, location, coordinates, source, features, affected_routes, resolution_time_minutes, predicted_severity, predicted_impact, recorded_at) VALUES (\n`;
      sql += `  ${escapeSql(incident.id)},\n`;
      sql += `  ${escapeSql(incident.timestamp)},\n`;
      sql += `  ${escapeSql(incident.title)},\n`;
      sql += `  ${escapeSql(incident.description)},\n`;
      sql += `  ${escapeSql(incident.location)},\n`;
      sql += `  ${incident.coordinates ? `'{${incident.coordinates.join(',')}}'` : 'NULL'},\n`;
      sql += `  ${escapeSql(incident.source)},\n`;
      sql += `  ${escapeSql(incident.features)},\n`;
      sql += `  ${escapeSql(incident.affectedRoutes)},\n`;
      sql += `  ${incident.resolutionTimeMinutes || 'NULL'},\n`;
      sql += `  ${incident.predictedSeverity ? escapeSql(incident.predictedSeverity) : 'NULL'},\n`;
      sql += `  ${incident.predictedImpact ? escapeSql(incident.predictedImpact) : 'NULL'},\n`;
      sql += `  ${escapeSql(incident.recordedAt || incident.timestamp)}\n`;
      sql += `) ON CONFLICT (id) DO NOTHING;\n\n`;
    }
    sql += '\n';
  }
  
  console.log(`✅ Generated SQL for ${incidents.length} historical incidents`);
  return sql;
}

async function main() {
  console.log('🛠️  Generating SQL migration files...\n');

  try {
    // Create backup
    console.log('💾 Creating backups...');
    const backupDir = path.join(__dirname, 'data', 'pre-sql-migration-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filesToBackup = [
      'supervisors.json',
      'message-templates.json', 
      'historical-incidents.json'
    ];

    for (const file of filesToBackup) {
      try {
        const sourcePath = path.join(__dirname, 'data', file);
        const backupPath = path.join(backupDir, `${timestamp}-${file}`);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, backupPath);
          console.log(`✅ Backed up: ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error backing up ${file}:`, error.message);
      }
    }

    // Generate migration SQL
    let fullSql = `-- Go BARRY Database Migration SQL
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor

-- Start transaction
BEGIN;

`;

    fullSql += generateSupervisorInserts();
    fullSql += generateTemplateInserts();
    fullSql += generateIncidentInserts();
    
    fullSql += `
-- Commit transaction
COMMIT;

-- Verify data
SELECT 'supervisors' as table_name, count(*) as record_count FROM supervisors
UNION ALL
SELECT 'message_templates', count(*) FROM message_templates  
UNION ALL
SELECT 'template_categories', count(*) FROM template_categories
UNION ALL
SELECT 'historical_incidents', count(*) FROM historical_incidents;
`;

    // Write to file
    const sqlFilePath = path.join(__dirname, 'supabase-data-migration.sql');
    fs.writeFileSync(sqlFilePath, fullSql);

    console.log('\n🎉 SQL migration file generated successfully!');
    console.log(`📁 File: ${sqlFilePath}`);
    console.log(`📊 File size: ${(fs.statSync(sqlFilePath).size / 1024).toFixed(1)} KB`);
    
    console.log('\n📋 Next steps:');
    console.log('1. First run the schema: supabase-schema.sql');
    console.log('2. Then run the data: supabase-data-migration.sql');
    console.log('3. Both files can be executed in Supabase SQL Editor');

  } catch (error) {
    console.error('\n❌ SQL generation failed:', error);
    process.exit(1);
  }
}

main();
