// backend/supabase-sync.js
// Script to sync traffic data from APIs to SupaBase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fetchComprehensiveTrafficData } from './fetch-comprehensive-traffic.js';

dotenv.config();

// SupaBase configuration - use service role key for write access
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key, not anon key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SupaBase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

// Create SupaBase client with service role for write access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Enhanced route mapping (from your existing backend)
const ENHANCED_LOCATION_ROUTE_MAPPING = {
  'a1': ['X9', 'X10', '10', '11', '21', 'X21', '43', '44', '45'],
  'a19': ['X7', 'X8', '19', '35', '36', '1', '2', '308', '309'],
  'a167': ['21', '22', 'X21', '50', '6', '7'],
  'a1058': ['1', '2', '308', '309', '311', '317'],
  'a184': ['25', '28', '29', '93', '94'],
  'a690': ['61', '62', '63', '64', '65'],
  'a69': ['X84', 'X85', '602', '685'],
  'a183': ['16', '18', '20', '61', '62'],
  'newcastle': ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
  'gateshead': ['21', '25', '28', '29', '53', '54', '56'],
  'sunderland': ['16', '18', '20', '61', '62', '63', '64', '65'],
  'durham': ['21', '22', 'X21', '50', '6', '7', '13', '14'],
  'tyne tunnel': ['1', '2', '308', '309', '311'],
  'coast road': ['1', '2', '308', '309', '311', '317'],
  'central motorway': ['Q1', 'Q2', 'Q3', 'QUAYSIDE']
};

class SupaBaseSync {
  constructor() {
    this.syncStats = {
      totalProcessed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  // Helper functions from your existing backend
  matchRoutes(location, streetName = '', description = '') {
    const routes = new Set();
    const text = `${location} ${streetName} ${description}`.toLowerCase();
    
    for (const [pattern, routeList] of Object.entries(ENHANCED_LOCATION_ROUTE_MAPPING)) {
      if (text.includes(pattern.toLowerCase())) {
        routeList.forEach(route => routes.add(route));
      }
    }
    
    const roadPattern = /\b(a\d+(?:\([m]\))?|b\d+|m\d+)\b/gi;
    let match;
    while ((match = roadPattern.exec(text)) !== null) {
      const road = match[1].toLowerCase();
      if (ENHANCED_LOCATION_ROUTE_MAPPING[road]) {
        ENHANCED_LOCATION_ROUTE_MAPPING[road].forEach(route => routes.add(route));
      }
    }
    
    return Array.from(routes).sort();
  }

  isInNorthEast(location, description = '') {
    const text = `${location} ${description}`.toUpperCase();
    const northEastKeywords = [
      'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
      'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 
      'NORTHUMBERLAND', 'TYNE', 'WEAR', 'HEXHAM', 'CRAMLINGTON',
      'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
      'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY',
      'METRO CENTRE', 'BLAYDON', 'CONSETT', 'STANLEY', 'HOUGHTON'
    ];
    
    return northEastKeywords.some(keyword => text.includes(keyword));
  }

  classifyAlert(alert) {
    const now = new Date();
    let status = 'green';
    let startDate = null;
    let endDate = null;
    
    try {
      const startFields = [
        'startDate', 'start_date', 'overallStartTime', 'proposed_start_date', 
        'actual_start_date_time', 'startTime', 'entryTime'
      ];
      
      const endFields = [
        'endDate', 'end_date', 'overallEndTime', 'proposed_end_date', 
        'actual_end_date_time', 'endTime', 'estimatedClearTime'
      ];
      
      for (const field of startFields) {
        if (alert[field]) {
          startDate = new Date(alert[field]);
          if (!isNaN(startDate.getTime())) break;
        }
      }
      
      for (const field of endFields) {
        if (alert[field]) {
          endDate = new Date(alert[field]);
          if (!isNaN(endDate.getTime())) break;
        }
      }
      
      if (alert.type === 'congestion') {
        if (alert.congestionLevel >= 8 || alert.jamFactor >= 0.7) {
          status = 'red';
        } else if (alert.congestionLevel >= 5 || alert.jamFactor >= 0.4) {
          status = 'amber';
        } else {
          status = 'green';
        }
      } else if (alert.type === 'incident') {
        if (alert.roadClosed || alert.severity === 'High') {
          status = 'red';
        } else {
          status = 'amber';
        }
      } else {
        if (startDate && endDate) {
          if (startDate <= now && endDate >= now) {
            status = 'red';
          } else if (startDate > now) {
            const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) {
              status = 'amber';
            }
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Alert classification error:', error.message);
    }
    
    return { status, startDate, endDate };
  }

  // Transform alert data for SupaBase
  transformAlertForSupaBase(alert) {
    const classification = this.classifyAlert(alert);
    const routes = this.matchRoutes(
      alert.location || '',
      alert.street || '',
      alert.description || ''
    );

    return {
      external_id: alert.id || `${alert.source}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: alert.title || alert.description || 'Traffic Alert',
      description: alert.description || 'No description available',
      location: alert.location || 'Location not specified',
      authority: alert.authority || 'Unknown Authority',
      type: alert.type || 'roadwork',
      severity: alert.severity || 'Low',
      status: classification.status,
      source: alert.source || 'unknown',
      affects_routes: routes,
      start_date: classification.startDate?.toISOString(),
      end_date: classification.endDate?.toISOString(),
      
      // Traffic-specific fields
      congestion_level: alert.congestionLevel,
      current_speed: alert.currentSpeed,
      free_flow_speed: alert.freeFlowSpeed,
      jam_factor: alert.jamFactor,
      delay_minutes: alert.delayMinutes,
      incident_type: alert.incidentType,
      road_closed: alert.roadClosed || false,
      estimated_clear_time: alert.estimatedClearTime ? new Date(alert.estimatedClearTime).toISOString() : null,
      
      // Metadata
      confidence: alert.confidence,
      data_source: alert.dataSource,
      raw_data: alert,
      last_updated: new Date().toISOString()
    };
  }

  // Upsert alert to SupaBase
  async upsertAlert(alertData) {
    try {
      const { data, error } = await supabase
        .from('traffic_alerts')
        .upsert(alertData, {
          onConflict: 'external_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SupaBase upsert error:', error);
        this.syncStats.errors++;
        return { success: false, error };
      }

      this.syncStats.inserted++;
      return { success: true, data };
    } catch (error) {
      console.error('❌ SupaBase upsert exception:', error);
      this.syncStats.errors++;
      return { success: false, error: error.message };
    }
  }

  // Clean up old completed alerts
  async cleanupOldAlerts() {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_old_alerts');

      if (error) {
        console.error('❌ Cleanup error:', error);
        return { success: false, error };
      }

      console.log(`🧹 Cleaned up ${data} old alerts`);
      return { success: true, deletedCount: data };
    } catch (error) {
      console.error('❌ Cleanup exception:', error);
      return { success: false, error: error.message };
    }
  }

  // Main sync function
  async syncTrafficData() {
    console.log('🚀 Starting SupaBase sync...');
    const startTime = Date.now();

    try {
      // Reset stats
      this.syncStats = {
        totalProcessed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 0
      };

      // Fetch comprehensive traffic data using your existing system
      console.log('📊 Fetching traffic data from all sources...');
      const trafficResult = await fetchComprehensiveTrafficData();

      if (!trafficResult.success) {
        throw new Error(`Failed to fetch traffic data: ${trafficResult.error}`);
      }

      const alerts = trafficResult.alerts || [];
      console.log(`📋 Processing ${alerts.length} alerts...`);

      // Filter for North East only
      const northEastAlerts = alerts.filter(alert => 
        this.isInNorthEast(alert.location || '', alert.description || '')
      );

      console.log(`🎯 ${northEastAlerts.length} alerts are relevant to North East`);

      // Process each alert
      for (const alert of northEastAlerts) {
        this.syncStats.totalProcessed++;
        
        try {
          const transformedAlert = this.transformAlertForSupaBase(alert);
          const result = await this.upsertAlert(transformedAlert);
          
          if (result.success) {
            console.log(`✅ Synced: ${transformedAlert.title}`);
          } else {
            console.error(`❌ Failed to sync: ${transformedAlert.title}`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error processing alert:`, error);
          this.syncStats.errors++;
        }
      }

      // Clean up old alerts
      await this.cleanupOldAlerts();

      const processingTime = Date.now() - startTime;
      
      const summary = {
        success: true,
        duration: `${processingTime}ms`,
        stats: this.syncStats,
        timestamp: new Date().toISOString()
      };

      console.log('✅ Sync completed:', summary);
      return summary;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      const summary = {
        success: false,
        error: error.message,
        duration: `${processingTime}ms`,
        stats: this.syncStats,
        timestamp: new Date().toISOString()
      };

      console.error('❌ Sync failed:', summary);
      return summary;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('traffic_alerts')
        .select('count')
        .limit(1);

      return {
        supabase: {
          status: error ? 'error' : 'healthy',
          connected: !error,
          error: error?.message
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        supabase: {
          status: 'error',
          connected: false,
          error: error.message
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create sync instance
const syncService = new SupaBaseSync();

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'sync':
      syncService.syncTrafficData()
        .then(result => {
          console.log('Sync result:', result);
          process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
          console.error('Sync error:', error);
          process.exit(1);
        });
      break;

    case 'health':
      syncService.healthCheck()
        .then(result => {
          console.log('Health check:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Health check error:', error);
          process.exit(1);
        });
      break;

    case 'cleanup':
      syncService.cleanupOldAlerts()
        .then(result => {
          console.log('Cleanup result:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Cleanup error:', error);
          process.exit(1);
        });
      break;

    default:
      console.log(`
🚦 SupaBase Sync for BARRY Traffic Alerts

Usage:
  node supabase-sync.js sync     - Sync traffic data to SupaBase
  node supabase-sync.js health   - Check SupaBase connection
  node supabase-sync.js cleanup  - Clean up old alerts

Environment variables required:
  SUPABASE_URL           - Your SupaBase project URL
  SUPABASE_SERVICE_KEY   - Your SupaBase service role key
  NATIONAL_HIGHWAYS_API_KEY - National Highways API key
  HERE_API_KEY          - HERE Traffic API key
  MAPQUEST_API_KEY      - MapQuest API key
      `);
      process.exit(0);
  }
}

export { SupaBaseSync, syncService };