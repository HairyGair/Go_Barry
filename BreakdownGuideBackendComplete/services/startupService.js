// backend/services/startupService.js
// Go BARRY startup service for data retention and system initialization

import dataRetentionService from './dataRetentionService.js';
import supabaseIncidentStorage from './supabaseIncidentStorage.js';
import supabaseRoadworksStorage from './supabaseRoadworksStorage.js';

/**
 * Initialize Go BARRY system on startup
 */
export async function initializeGoBarrySystem() {
  console.log('🚀 Initializing Go BARRY system...');

  try {
    // Initialize storage systems
    console.log('📊 Initializing storage systems...');
    
    const incidentStorageOK = await supabaseIncidentStorage.initializeStorage();
    const roadworksStorageOK = await supabaseRoadworksStorage.initializeStorage();

    if (!incidentStorageOK) {
      console.warn('⚠️ Incident storage initialization failed');
    }

    if (!roadworksStorageOK) {
      console.warn('⚠️ Roadworks storage initialization failed');
    }

    // Start data retention service
    console.log('🧹 Starting data retention service...');
    dataRetentionService.scheduleRetentionCleanup();

    // Run initial cleanup after 30 seconds (allow system to start first)
    setTimeout(async () => {
      console.log('🧹 Running initial data retention cleanup...');
      const results = await dataRetentionService.runDataRetentionCleanup();
      
      if (results.success) {
        console.log(`✅ Initial cleanup completed: ${results.totalDeleted} old records removed`);
      } else {
        console.warn('⚠️ Initial cleanup had issues:', results.errors);
      }
    }, 30000);

    console.log('✅ Go BARRY system initialization completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Go BARRY system initialization failed:', error);
    return false;
  }
}

/**
 * Get system health status including retention information
 */
export async function getSystemHealth() {
  try {
    // Get retention status
    const retentionStatus = await dataRetentionService.getRetentionStatus();
    
    // Get storage system status
    const storageStatus = {
      incidents: {
        available: false,
        error: null
      },
      roadworks: {
        available: false,
        error: null
      }
    };

    try {
      await supabaseIncidentStorage.initializeStorage();
      storageStatus.incidents.available = true;
    } catch (error) {
      storageStatus.incidents.error = error.message;
    }

    try {
      await supabaseRoadworksStorage.initializeStorage();
      storageStatus.roadworks.available = true;
    } catch (error) {
      storageStatus.roadworks.error = error.message;
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      storage: storageStatus,
      retention: retentionStatus,
      dataRetentionEnabled: true,
      retentionPeriod: '3 months'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Manual data cleanup trigger (for admin use)
 */
export async function triggerManualCleanup() {
  console.log('🧹 Manual data cleanup triggered...');
  
  try {
    const results = await dataRetentionService.runDataRetentionCleanup();
    
    console.log(`✅ Manual cleanup completed: ${results.totalDeleted} records deleted`);
    return results;

  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
    return {
      success: false,
      error: error.message,
      totalDeleted: 0
    };
  }
}

export default {
  initializeGoBarrySystem,
  getSystemHealth,
  triggerManualCleanup
};
