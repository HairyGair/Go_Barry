// backend/services/sharedIncidentStorage.js
// Persistent shared storage for manual incidents that all supervisors can see

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the shared incidents file
const INCIDENTS_FILE = path.join(__dirname, '../data/shared-incidents.json');

// In-memory cache for performance
let incidentsCache = null;
let lastModified = null;

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, '../data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    console.log('📁 Created data directory for shared incidents');
  }
}

/**
 * Load incidents from file with caching
 */
async function loadIncidentsFromFile() {
  try {
    await ensureDataDirectory();
    
    // Check if file exists
    try {
      const stats = await fs.stat(INCIDENTS_FILE);
      
      // If cache is still valid, return it
      if (incidentsCache && lastModified && stats.mtime <= lastModified) {
        return incidentsCache;
      }
      
      lastModified = stats.mtime;
    } catch {
      // File doesn't exist, return empty array
      incidentsCache = [];
      return incidentsCache;
    }
    
    // Read and parse the file
    const data = await fs.readFile(INCIDENTS_FILE, 'utf-8');
    incidentsCache = JSON.parse(data);
    
    console.log(`📖 Loaded ${incidentsCache.length} shared incidents from file`);
    return incidentsCache;
    
  } catch (error) {
    console.error('❌ Failed to load incidents from file:', error.message);
    // Return empty array on error to prevent crashes
    incidentsCache = [];
    return incidentsCache;
  }
}

/**
 * Save incidents to file
 */
async function saveIncidentsToFile(incidents) {
  try {
    await ensureDataDirectory();
    
    // Write to temporary file first, then rename (atomic operation)
    const tempFile = INCIDENTS_FILE + '.tmp';
    const data = JSON.stringify(incidents, null, 2);
    
    await fs.writeFile(tempFile, data, 'utf-8');
    await fs.rename(tempFile, INCIDENTS_FILE);
    
    // Update cache
    incidentsCache = [...incidents];
    lastModified = new Date();
    
    console.log(`💾 Saved ${incidents.length} shared incidents to file`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save incidents to file:', error.message);
    return false;
  }
}

/**
 * Get all incidents (loads from file if needed)
 */
export async function getAllIncidents() {
  return await loadIncidentsFromFile();
}

/**
 * Add a new incident
 */
export async function addIncident(incident) {
  try {
    const incidents = await loadIncidentsFromFile();
    
    // Ensure incident has required fields
    const newIncident = {
      id: incident.id || `incident_${Date.now()}`,
      ...incident,
      createdAt: incident.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: incident.status || 'active'
    };
    
    incidents.push(newIncident);
    
    const saved = await saveIncidentsToFile(incidents);
    if (saved) {
      console.log(`✅ Added shared incident: ${newIncident.id} (${newIncident.location})`);
      return newIncident;
    } else {
      throw new Error('Failed to save incident to file');
    }
    
  } catch (error) {
    console.error('❌ Failed to add incident:', error.message);
    throw error;
  }
}

/**
 * Update an existing incident
 */
export async function updateIncident(id, updates) {
  try {
    const incidents = await loadIncidentsFromFile();
    const index = incidents.findIndex(inc => inc.id === id);
    
    if (index === -1) {
      return null;
    }
    
    // Update the incident
    incidents[index] = {
      ...incidents[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    const saved = await saveIncidentsToFile(incidents);
    if (saved) {
      console.log(`✅ Updated shared incident: ${id}`);
      return incidents[index];
    } else {
      throw new Error('Failed to save updated incident to file');
    }
    
  } catch (error) {
    console.error('❌ Failed to update incident:', error.message);
    throw error;
  }
}

/**
 * Delete an incident
 */
export async function deleteIncident(id) {
  try {
    const incidents = await loadIncidentsFromFile();
    const index = incidents.findIndex(inc => inc.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const deletedIncident = incidents.splice(index, 1)[0];
    
    const saved = await saveIncidentsToFile(incidents);
    if (saved) {
      console.log(`✅ Deleted shared incident: ${id}`);
      return deletedIncident;
    } else {
      throw new Error('Failed to save after deleting incident');
    }
    
  } catch (error) {
    console.error('❌ Failed to delete incident:', error.message);
    throw error;
  }
}

/**
 * Get a specific incident by ID
 */
export async function getIncidentById(id) {
  try {
    const incidents = await loadIncidentsFromFile();
    return incidents.find(inc => inc.id === id) || null;
  } catch (error) {
    console.error('❌ Failed to get incident by ID:', error.message);
    return null;
  }
}

/**
 * Get incident statistics
 */
export async function getIncidentStats() {
  try {
    const incidents = await loadIncidentsFromFile();
    
    const stats = {
      total: incidents.length,
      active: incidents.filter(inc => inc.status === 'active').length,
      monitoring: incidents.filter(inc => inc.status === 'monitoring').length,
      resolved: incidents.filter(inc => inc.status === 'resolved').length,
      byType: {},
      bySeverity: {},
      recentCount: 0
    };
    
    // Count by type and severity
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    incidents.forEach(incident => {
      // Count by type
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[incident.severity || 'Unknown'] = (stats.bySeverity[incident.severity || 'Unknown'] || 0) + 1;
      
      // Count recent incidents
      if (new Date(incident.createdAt) > oneDayAgo) {
        stats.recentCount++;
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('❌ Failed to get incident stats:', error.message);
    return {
      total: 0,
      active: 0,
      monitoring: 0,
      resolved: 0,
      byType: {},
      bySeverity: {},
      recentCount: 0
    };
  }
}

/**
 * Clear the cache (useful for testing or forcing reload)
 */
export function clearCache() {
  incidentsCache = null;
  lastModified = null;
  console.log('🔄 Cleared shared incidents cache');
}

/**
 * Initialize the storage system
 */
export async function initializeStorage() {
  try {
    await ensureDataDirectory();
    const incidents = await loadIncidentsFromFile();
    console.log(`🚀 Shared incident storage initialized with ${incidents.length} incidents`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize shared incident storage:', error.message);
    return false;
  }
}

export default {
  getAllIncidents,
  addIncident,
  updateIncident,
  deleteIncident,
  getIncidentById,
  getIncidentStats,
  clearCache,
  initializeStorage
};
