// backend/services/convexSync.js
// Sync alerts from backend to Convex for real-time updates

import fetch from 'node-fetch';

class ConvexSyncService {
  constructor() {
    this.convexUrl = process.env.CONVEX_URL;
    this.isEnabled = this.convexUrl && this.convexUrl !== '';
    
    if (this.isEnabled) {
      console.log('✅ Convex sync service enabled (URL: ' + this.convexUrl + ')');
    } else {
      console.log('⚠️ Convex sync disabled - no CONVEX_URL in environment');
    }
  }

  async callConvexFunction(functionPath, args) {
    if (!this.isEnabled) {
      throw new Error('Convex not configured');
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: functionPath,
          args: args,
          format: 'json'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Convex error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Unknown Convex error');
      }

      return result.value;
    } catch (error) {
      console.error(`❌ Convex API call failed for ${functionPath}:`, error.message);
      throw error;
    }
  }

  async syncAlerts(alerts) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Transform alerts to match Convex schema
      const convexAlerts = alerts.map(alert => ({
        alertId: alert.id || alert.alertId || `alert_${Date.now()}_${Math.random()}`,
        title: alert.title || 'Traffic Incident',
        description: alert.description,
        location: alert.location || 'Unknown Location',
        coordinates: alert.coordinates,
        severity: alert.severity || 'medium',
        status: alert.status || 'active',
        source: alert.source || 'unknown',
        timestamp: alert.timestamp || Date.now(),
        affectsRoutes: alert.affectsRoutes || [],
        routeFrequencies: alert.routeFrequencies || null,
      }));

      // Call the Convex mutation directly
      const result = await this.callConvexFunction('alerts:batchInsertAlerts', {
        alerts: convexAlerts
      });

      console.log(`✅ Synced ${convexAlerts.length} alerts to Convex`);
      return { success: true, count: convexAlerts.length, result };
    } catch (error) {
      console.error('❌ Convex sync error:', error);
      return { success: false, error: error.message };
    }
  }

  async syncSupervisorAction(action) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // For now, just log - implement when supervisor actions are migrated
      console.log('📝 Syncing supervisor action to Convex:', action.action);
      
      // Example of how to sync supervisor actions:
      // const result = await this.callConvexFunction('supervisorActions:create', {
      //   action: action.action,
      //   supervisorId: action.supervisorId,
      //   // ... other fields
      // });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Convex action sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Test connection to Convex
  async testConnection() {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Try to fetch sync state
      const response = await fetch(`${this.convexUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'sync:getSyncState',
          args: {},
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Convex connection test successful');
      return { success: true, data: result.value };
    } catch (error) {
      console.error('❌ Convex connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const convexSync = new ConvexSyncService();

// Test connection on startup
if (convexSync.isEnabled) {
  setTimeout(() => {
    convexSync.testConnection().then(result => {
      if (result.success) {
        console.log('🎯 Convex backend sync ready!');
      } else {
        console.log('⚠️ Convex connection issue:', result.error);
      }
    });
  }, 2000);
}
