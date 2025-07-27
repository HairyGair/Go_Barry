#!/usr/bin/env node
// backend/scripts/integrateSupervisorLogging.js
// Integration script to add comprehensive supervisor logging to existing API endpoints

import fs from 'fs/promises';
import path from 'path';

/**
 * Script to integrate comprehensive supervisor logging into existing API endpoints
 * 
 * This script:
 * 1. Backs up existing API files
 * 2. Adds import statements for enhanced logging
 * 3. Integrates logging calls into key endpoints
 * 4. Maintains backward compatibility
 */

const API_FILES_TO_UPDATE = [
  'routes/supervisorAPI.js',
  'routes/unifiedRoadworksAPI.js', 
  'routes/incidentAPI.js',
  'routes/emailAPI.js',
  'routes/adminAPI.js'
];

const LOGGING_IMPORTS = `
// Enhanced supervisor logging imports
import {
  enhancedSupervisorAuth,
  enhancedSupervisorLogout,
  enhancedAlertDismissal,
  enhancedRoadworkAction,
  enhancedIncidentCreation,
  enhancedCommunicationLogging,
  enhancedAdminAction,
  logScreenNavigation,
  logSettingsUpdate,
  logDataAccess,
  getSupervisorFromSession
} from '../patches/supervisorLoggingIntegration.js';
`;

async function backupFile(filePath) {
  try {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    console.log(`✅ Backed up ${filePath} to ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`❌ Failed to backup ${filePath}:`, error);
    throw error;
  }
}

async function addImportsToFile(filePath, imports) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if imports already exist
    if (content.includes('supervisorLoggingIntegration')) {
      console.log(`⚠️ Logging imports already exist in ${filePath}`);
      return false;
    }
    
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex === -1) {
      // No imports found, add at the beginning
      const newContent = imports + '\n' + content;
      await fs.writeFile(filePath, newContent);
    } else {
      // Add after the last import
      lines.splice(lastImportIndex + 1, 0, '', ...imports.trim().split('\n'));
      const newContent = lines.join('\n');
      await fs.writeFile(filePath, newContent);
    }
    
    console.log(`✅ Added logging imports to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add imports to ${filePath}:`, error);
    throw error;
  }
}

async function integrateSupervisorAPILogging(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Replace login endpoint
    if (content.includes("const result = await supervisorManager.authenticateSupervisor(supervisorId, badge);")) {
      content = content.replace(
        "const result = await supervisorManager.authenticateSupervisor(supervisorId, badge);",
        `// Enhanced login with comprehensive logging
    const result = await enhancedSupervisorAuth(
      supervisorManager.authenticateSupervisor,
      supervisorId,
      badge,
      req
    );`
      );
      updated = true;
      console.log('✅ Updated login endpoint in supervisorAPI.js');
    }
    
    // Replace logout endpoint
    if (content.includes("const result = await supervisorManager.signOutSupervisor(sessionId);")) {
      content = content.replace(
        "const result = await supervisorManager.signOutSupervisor(sessionId);",
        `// Enhanced logout with comprehensive logging
    const result = await enhancedSupervisorLogout(
      supervisorManager.signOutSupervisor,
      sessionId,
      req
    );`
      );
      updated = true;
      console.log('✅ Updated logout endpoint in supervisorAPI.js');
    }
    
    // Replace alert dismissal endpoint
    if (content.includes("const result = await supervisorManager.dismissAlert(alertId, sessionId, reason, notes);")) {
      content = content.replace(
        "const result = await supervisorManager.dismissAlert(alertId, sessionId, reason, notes);",
        `// Enhanced alert dismissal with comprehensive logging
    const result = await enhancedAlertDismissal(
      supervisorManager.dismissAlert,
      alertId,
      sessionId,
      reason,
      notes,
      req
    );`
      );
      updated = true;
      console.log('✅ Updated alert dismissal endpoint in supervisorAPI.js');
    }
    
    // Add navigation logging to GET endpoints
    const getEndpoints = [
      '/api/supervisor/active',
      '/api/supervisor/supervisors',
      '/api/supervisor/activity/recent'
    ];
    
    for (const endpoint of getEndpoints) {
      const pattern = new RegExp(`router\\.get\\('${endpoint.replace('/api/supervisor', '')}`, 'g');
      if (pattern.test(content)) {
        // Add navigation logging after successful response
        content = content.replace(
          /res\.json\({[\s\S]*?}\);/g,
          (match) => {
            if (match.includes('activeSupervisors') || match.includes('supervisors') || match.includes('activities')) {
              return `${match}
    
    // Log screen navigation
    const supervisorInfo = await getSupervisorFromSession(req.query?.sessionId);
    if (supervisorInfo) {
      await logScreenNavigation(supervisorInfo, '${endpoint}', {}, req);
    }`;
            }
            return match;
          }
        );
        updated = true;
      }
    }
    
    if (updated) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Integrated comprehensive logging into ${filePath}`);
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Failed to integrate logging into ${filePath}:`, error);
    throw error;
  }
}

async function integrateRoadworksAPILogging(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Replace roadwork dismissal
    if (content.includes("const result = await unifiedRoadworksManager.dismissRoadwork(")) {
      content = content.replace(
        /const result = await unifiedRoadworksManager\.dismissRoadwork\((.*?)\);/,
        `// Enhanced roadwork dismissal with comprehensive logging
    const result = await enhancedRoadworkAction(
      unifiedRoadworksManager.dismissRoadwork,
      'roadwork_dismissed',
      id,
      supervisorToken,
      { reason },
      req
    );`
      );
      updated = true;
      console.log('✅ Updated roadwork dismissal in unifiedRoadworksAPI.js');
    }
    
    // Replace roadwork acknowledgment
    if (content.includes("const result = await unifiedRoadworksManager.acknowledgeRoadwork(")) {
      content = content.replace(
        /const result = await unifiedRoadworksManager\.acknowledgeRoadwork\((.*?)\);/,
        `// Enhanced roadwork acknowledgment with comprehensive logging
    const result = await enhancedRoadworkAction(
      unifiedRoadworksManager.acknowledgeRoadwork,
      'roadwork_acknowledged',
      id,
      supervisorToken,
      { note },
      req
    );`
      );
      updated = true;
      console.log('✅ Updated roadwork acknowledgment in unifiedRoadworksAPI.js');
    }
    
    if (updated) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Integrated roadworks logging into ${filePath}`);
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Failed to integrate roadworks logging into ${filePath}:`, error);
    throw error;
  }
}

async function integrateIncidentAPILogging(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Add incident creation logging
    if (content.includes("// Store in memory") && content.includes("inMemoryIncidents.push(incident);")) {
      content = content.replace(
        "inMemoryIncidents.push(incident);",
        `inMemoryIncidents.push(incident);
    
    // Enhanced incident creation logging
    await enhancedIncidentCreation(
      () => ({ success: true, incident }),
      incident,
      req
    );`
      );
      updated = true;
      console.log('✅ Updated incident creation in incidentAPI.js');
    }
    
    if (updated) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Integrated incident logging into ${filePath}`);
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Failed to integrate incident logging into ${filePath}:`, error);
    throw error;
  }
}

async function updateMainIndexFile() {
  try {
    const indexPath = 'index.js';
    const content = await fs.readFile(indexPath, 'utf8');
    
    // Check if middleware is already added
    if (content.includes('supervisorLoggingMiddleware')) {
      console.log('⚠️ Supervisor logging middleware already integrated in index.js');
      return false;
    }
    
    // Add import
    const newContent = content.replace(
      /import.*from.*express.*;\n/,
      `$&import supervisorLoggingMiddleware from './middleware/supervisorLoggingMiddleware.js';\n`
    );
    
    // Add middleware before routes
    const updatedContent = newContent.replace(
      /app\.use\('\/api',.*\);/,
      `// Enhanced supervisor action logging middleware
app.use(supervisorLoggingMiddleware({
  enablePerformanceTracking: true,
  skipPaths: ['/health', '/metrics', '/api/health'],
  maxLogLevel: 'info'
}));

$&`
    );
    
    await fs.writeFile(indexPath, updatedContent);
    console.log('✅ Added supervisor logging middleware to index.js');
    return true;
  } catch (error) {
    console.error('❌ Failed to update index.js:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting comprehensive supervisor logging integration...\n');
  
  try {
    // Update main index file first
    await updateMainIndexFile();
    
    // Process each API file
    for (const apiFile of API_FILES_TO_UPDATE) {
      const filePath = path.resolve(apiFile);
      
      console.log(`\n📁 Processing ${apiFile}...`);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log(`⚠️ File ${apiFile} not found, skipping...`);
        continue;
      }
      
      // Backup original file
      await backupFile(filePath);
      
      // Add imports
      await addImportsToFile(filePath, LOGGING_IMPORTS);
      
      // Integrate specific logging based on file type
      if (apiFile.includes('supervisorAPI.js')) {
        await integrateSupervisorAPILogging(filePath);
      } else if (apiFile.includes('unifiedRoadworksAPI.js')) {
        await integrateRoadworksAPILogging(filePath);
      } else if (apiFile.includes('incidentAPI.js')) {
        await integrateIncidentAPILogging(filePath);
      }
      
      console.log(`✅ Completed integration for ${apiFile}`);
    }
    
    console.log('\n🎉 Comprehensive supervisor logging integration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your Go BARRY backend server');
    console.log('2. Test supervisor login/logout actions');
    console.log('3. Verify logging in Supabase activity_logs table');
    console.log('4. Monitor performance and memory usage');
    console.log('5. Check console logs for "📝 Activity logged" messages');
    
  } catch (error) {
    console.error('\n❌ Integration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check file permissions');
    console.log('2. Verify backup files were created');
    console.log('3. Restore from backups if needed');
    console.log('4. Review error messages above');
    process.exit(1);
  }
}

// Run the integration script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as integrateSupervisorLogging };