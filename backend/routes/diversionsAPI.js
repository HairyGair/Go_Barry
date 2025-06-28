// backend/routes/diversionsAPI.js
// API endpoints for managing diversion patterns and historical learning

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Data file paths
const DIVERSIONS_FILE = path.join(__dirname, '../data/diversions.json');
const DIVERSION_HISTORY_FILE = path.join(__dirname, '../data/diversion-history.json');

// Ensure data files exist
async function ensureDataFiles() {
  try {
    await fs.access(DIVERSIONS_FILE);
  } catch {
    await fs.writeFile(DIVERSIONS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Created diversions.json');
  }
  
  try {
    await fs.access(DIVERSION_HISTORY_FILE);
  } catch {
    await fs.writeFile(DIVERSION_HISTORY_FILE, JSON.stringify([], null, 2));
    console.log('✅ Created diversion-history.json');
  }
}

// Initialize data files
ensureDataFiles();

// Store a new diversion pattern
router.post('/store', async (req, res) => {
  try {
    const { location, routes, diversion, message, alertType, createdBy, timestamp } = req.body;
    
    if (!location || !routes || !diversion) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: location, routes, diversion'
      });
    }
    
    // Load existing diversions
    const diversionsData = await fs.readFile(DIVERSIONS_FILE, 'utf8');
    const diversions = JSON.parse(diversionsData);
    
    // Create new diversion record
    const newDiversion = {
      id: `div-${Date.now()}`,
      location: location.trim(),
      routes: Array.isArray(routes) ? routes : [routes],
      diversion: diversion.trim(),
      message: message || '',
      alertType: alertType || 'road_closure',
      createdBy: createdBy || 'unknown',
      timestamp: timestamp || Date.now(),
      usageCount: 0,
      lastUsed: null,
      effectiveness: null // To be updated based on feedback
    };
    
    diversions.push(newDiversion);
    
    // Save updated diversions
    await fs.writeFile(DIVERSIONS_FILE, JSON.stringify(diversions, null, 2));
    
    console.log(`✅ Stored diversion pattern: ${location} -> ${diversion}`);
    
    res.json({
      success: true,
      diversion: newDiversion,
      message: 'Diversion pattern stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Error storing diversion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get diversion suggestions for a location
router.get('/suggest', async (req, res) => {
  try {
    const { location, alertType, routes } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location parameter required'
      });
    }
    
    // Load diversions
    const diversionsData = await fs.readFile(DIVERSIONS_FILE, 'utf8');
    const diversions = JSON.parse(diversionsData);
    
    // Find matching diversions
    const locationLower = location.toLowerCase();
    const suggestions = diversions.filter(div => {
      const divLocationLower = div.location.toLowerCase();
      
      // Exact location match
      if (divLocationLower.includes(locationLower) || locationLower.includes(divLocationLower)) {
        return true;
      }
      
      // Alert type match
      if (alertType && div.alertType === alertType) {
        return true;
      }
      
      // Route overlap
      if (routes) {
        const queryRoutes = Array.isArray(routes) ? routes : [routes];
        const hasRouteOverlap = div.routes.some(route => queryRoutes.includes(route));
        if (hasRouteOverlap) return true;
      }
      
      return false;
    });
    
    // Sort by relevance (usage count, recency, effectiveness)
    suggestions.sort((a, b) => {
      let scoreA = a.usageCount || 0;
      let scoreB = b.usageCount || 0;
      
      // Boost recent diversions
      const daysSinceA = a.lastUsed ? (Date.now() - a.lastUsed) / (1000 * 60 * 60 * 24) : 999;
      const daysSinceB = b.lastUsed ? (Date.now() - b.lastUsed) / (1000 * 60 * 60 * 24) : 999;
      
      if (daysSinceA < 7) scoreA += 5; // Boost if used in last week
      if (daysSinceB < 7) scoreB += 5;
      
      // Boost by effectiveness
      if (a.effectiveness) scoreA += a.effectiveness * 2;
      if (b.effectiveness) scoreB += b.effectiveness * 2;
      
      return scoreB - scoreA;
    });
    
    res.json({
      success: true,
      suggestions: suggestions.slice(0, 10), // Top 10 suggestions
      total: suggestions.length
    });
    
  } catch (error) {
    console.error('❌ Error getting diversion suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Track diversion usage
router.post('/track-usage', async (req, res) => {
  try {
    const { diversionId, effectiveness, feedback } = req.body;
    
    if (!diversionId) {
      return res.status(400).json({
        success: false,
        error: 'Diversion ID required'
      });
    }
    
    // Load diversions
    const diversionsData = await fs.readFile(DIVERSIONS_FILE, 'utf8');
    const diversions = JSON.parse(diversionsData);
    
    // Find and update diversion
    const diversionIndex = diversions.findIndex(div => div.id === diversionId);
    if (diversionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Diversion not found'
      });
    }
    
    // Update usage stats
    diversions[diversionIndex].usageCount = (diversions[diversionIndex].usageCount || 0) + 1;
    diversions[diversionIndex].lastUsed = Date.now();
    
    if (effectiveness !== undefined) {
      diversions[diversionIndex].effectiveness = effectiveness;
    }
    
    // Save updated diversions
    await fs.writeFile(DIVERSIONS_FILE, JSON.stringify(diversions, null, 2));
    
    // Record in history
    const historyData = await fs.readFile(DIVERSION_HISTORY_FILE, 'utf8');
    const history = JSON.parse(historyData);
    
    history.push({
      diversionId,
      timestamp: Date.now(),
      effectiveness,
      feedback: feedback || null
    });
    
    // Keep only last 1000 history records
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    await fs.writeFile(DIVERSION_HISTORY_FILE, JSON.stringify(history, null, 2));
    
    res.json({
      success: true,
      message: 'Diversion usage tracked'
    });
    
  } catch (error) {
    console.error('❌ Error tracking diversion usage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all stored diversions
router.get('/list', async (req, res) => {
  try {
    const diversionsData = await fs.readFile(DIVERSIONS_FILE, 'utf8');
    const diversions = JSON.parse(diversionsData);
    
    // Sort by usage and recency
    diversions.sort((a, b) => {
      const scoreA = (a.usageCount || 0) + (a.effectiveness || 0) * 2;
      const scoreB = (b.usageCount || 0) + (b.effectiveness || 0) * 2;
      return scoreB - scoreA;
    });
    
    res.json({
      success: true,
      diversions,
      total: diversions.length
    });
    
  } catch (error) {
    console.error('❌ Error listing diversions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get diversion analytics
router.get('/analytics', async (req, res) => {
  try {
    const diversionsData = await fs.readFile(DIVERSIONS_FILE, 'utf8');
    const diversions = JSON.parse(diversionsData);
    
    const historyData = await fs.readFile(DIVERSION_HISTORY_FILE, 'utf8');
    const history = JSON.parse(historyData);
    
    // Calculate analytics
    const totalDiversions = diversions.length;
    const totalUsages = history.length;
    const avgEffectiveness = diversions
      .filter(d => d.effectiveness !== null)
      .reduce((sum, d) => sum + d.effectiveness, 0) / 
      diversions.filter(d => d.effectiveness !== null).length || 0;
    
    // Most used locations
    const locationUsage = {};
    diversions.forEach(div => {
      locationUsage[div.location] = (locationUsage[div.location] || 0) + (div.usageCount || 0);
    });
    
    const topLocations = Object.entries(locationUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentActivity = history.filter(h => h.timestamp > thirtyDaysAgo);
    
    res.json({
      success: true,
      analytics: {
        totalDiversions,
        totalUsages,
        averageEffectiveness: Math.round(avgEffectiveness * 100) / 100,
        topLocations,
        recentActivity: recentActivity.length,
        lastWeekUsage: history.filter(h => h.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting diversion analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;