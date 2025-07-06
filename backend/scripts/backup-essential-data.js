#!/usr/bin/env node

/**
 * Backup Essential Data Script
 * Exports critical data before database reset
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function backupEssentialData() {
  console.log('💾 Backing up essential Go BARRY data...\n');
  
  const backup = {
    timestamp: new Date().toISOString(),
    data: {}
  };
  
  try {
    // Backup supervisors (critical)
    const { data: supervisors, error: supervisorsError } = await supabase
      .from('supervisors')
      .select('*');
    
    if (!supervisorsError) {
      backup.data.supervisors = supervisors;
      console.log(`✅ Backed up ${supervisors.length} supervisors`);
    }
    
    // Backup message templates (important)
    const { data: templates, error: templatesError } = await supabase
      .from('message_templates')
      .select('*');
    
    if (!templatesError) {
      backup.data.message_templates = templates;
      console.log(`✅ Backed up ${templates.length} message templates`);
    }
    
    // Backup recent roadworks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: roadworks, error: roadworksError } = await supabase
      .from('roadworks')
      .select('*')
      .gte('last_updated', thirtyDaysAgo.toISOString());
    
    if (!roadworksError) {
      backup.data.roadworks = roadworks;
      console.log(`✅ Backed up ${roadworks.length} recent roadworks`);
    }
    
    // Save backup to file
    const backupFileName = `go-barry-backup-${new Date().toISOString().split('T')[0]}.json`;
    writeFileSync(backupFileName, JSON.stringify(backup, null, 2));
    
    console.log(`\n💾 Backup saved to: ${backupFileName}`);
    console.log('📊 Backup summary:');
    console.log(`   Supervisors: ${backup.data.supervisors?.length || 0}`);
    console.log(`   Templates: ${backup.data.message_templates?.length || 0}`);
    console.log(`   Roadworks: ${backup.data.roadworks?.length || 0}`);
    
    return backupFileName;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function main() {
  await backupEssentialData();
  
  console.log('\n🎯 Next steps:');
  console.log('1. Keep this backup file safe');
  console.log('2. Try VACUUM FULL first (vacuum-database.sql)');
  console.log('3. If vacuum fails, consider database reset + restore');
  console.log('4. Contact Supabase support about bloat issue');
}

main().catch(console.error);