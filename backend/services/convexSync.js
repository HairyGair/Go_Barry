// backend/services/convexSync.js
// Sync alerts from backend to Convex for real-time updates

import fetch from 'node-fetch';
import busLocationService from './busLocationService.js';

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

  async syncEvents(events) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Transform events to match Convex schema
      const convexEvents = events.map(event => ({
        eventId: event.id || event.eventId || `event_${Date.now()}_${Math.random()}`,
        venue: event.venue || 'Unknown Venue',
        event: event.event || 'Unknown Event',
        time: event.time || '',
        date: event.date || new Date().toISOString().split('T')[0],
        severity: event.severity || 'medium',
        status: event.status || 'active',
        expectedAttendance: event.expectedAttendance,
        affectedRoutes: event.affectedRoutes || [],
        description: event.description,
        alertMessage: event.alertMessage,
        isActive: event.isActive !== false, // Default to true
        createdBy: 'system',
      }));

      // Sync each event individually to handle upserts
      let syncedCount = 0;
      for (const event of convexEvents) {
        try {
          await this.callConvexFunction('sync:upsertEvent', event);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to sync event ${event.eventId}:`, error.message);
        }
      }

      console.log(`✅ Synced ${syncedCount}/${convexEvents.length} events to Convex`);
      return { success: true, count: syncedCount };
    } catch (error) {
      console.error('❌ Convex events sync error:', error);
      return { success: false, error: error.message };
    }
  }

  async syncSingleAlert(alert) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Transform single alert to match Convex schema
      const convexAlert = {
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
      };

      // Insert single alert
      const result = await this.callConvexFunction('alerts:batchInsertAlerts', {
        alerts: [convexAlert]
      });

      console.log(`✅ Synced single alert ${convexAlert.alertId} to Convex`);
      return { success: true, alert: convexAlert, result };
    } catch (error) {
      console.error('❌ Convex single alert sync error:', error);
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

  // Sync StreetManager roadworks to Convex
  async syncStreetManagerRoadworks(roadworks) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Filter high-impact roadworks
      const highImpactWorks = roadworks.filter(work => {
        const impactScore = work.details?.impactScore || 0;
        const affectedRoutes = work.affectsRoutes?.length || 0;
        const severity = work.severity || 'low';
        
        return impactScore > 50 || affectedRoutes > 2 || 
               ['high', 'critical'].includes(severity);
      });

      if (highImpactWorks.length === 0) {
        console.log('ℹ️ No high-impact StreetManager roadworks to sync');
        return { success: true, count: 0 };
      }

      // Transform to Convex alert format with enhanced details
      const convexAlerts = highImpactWorks.map(work => ({
        alertId: work.id || `streetmanager_${work.workReferenceNumber || Date.now()}`,
        title: work.title || `StreetManager: ${work.location}`,
        description: work.description || work.details?.description || '',
        location: work.location,
        coordinates: work.coordinates,
        severity: work.severity || 'medium',
        status: 'active',
        source: 'StreetManager',
        timestamp: work.timestamp || Date.now(),
        affectsRoutes: work.affectsRoutes || [],
        routeFrequencies: work.routeFrequencies || null,
        
        // StreetManager-specific details
        metadata: {
          workType: work.details?.workType,
          trafficManagement: work.details?.trafficManagement,
          impactScore: work.details?.impactScore,
          predictedDelay: work.details?.predictedDelay,
          plannedDuration: work.details?.duration,
          isEmergency: work.details?.isEmergency,
          hasNightWork: work.details?.hasNightWork,
          affectedRouteNames: work.details?.affectedRoutes,
          totalPassengerImpact: work.details?.totalPassengerImpact,
          startDate: work.details?.startDate,
          endDate: work.details?.endDate,
          promoter: work.details?.promoter,
          workReferenceNumber: work.workReferenceNumber
        }
      }));

      // Sync to Convex
      const result = await this.callConvexFunction('alerts:batchInsertAlerts', {
        alerts: convexAlerts
      });

      console.log(`🚧 Synced ${convexAlerts.length} high-impact StreetManager roadworks to Convex`);
      
      // Log critical roadworks for supervisor attention
      const criticalWorks = convexAlerts.filter(a => a.severity === 'critical');
      if (criticalWorks.length > 0) {
        console.log(`⚠️ ${criticalWorks.length} CRITICAL roadworks require immediate attention:`);
        criticalWorks.forEach(work => {
          console.log(`  - ${work.location}: ${work.affectsRoutes.join(', ')}`);
        });
      }

      return { 
        success: true, 
        count: convexAlerts.length,
        criticalCount: criticalWorks.length,
        result 
      };
    } catch (error) {
      console.error('❌ StreetManager sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync a single high-priority StreetManager roadwork immediately
  async syncUrgentRoadwork(roadwork) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Create enhanced alert for urgent roadwork
      const urgentAlert = {
        alertId: `urgent_${roadwork.workReferenceNumber || Date.now()}`,
        title: `🚨 URGENT: ${roadwork.title || roadwork.location}`,
        description: `${roadwork.description}\n\n⚠️ IMMEDIATE ACTION REQUIRED`,
        location: roadwork.location,
        coordinates: roadwork.coordinates,
        severity: 'critical',
        status: 'active',
        source: 'StreetManager-Urgent',
        timestamp: Date.now(),
        affectsRoutes: roadwork.affectsRoutes || [],
        routeFrequencies: roadwork.routeFrequencies || null,
        
        metadata: {
          ...roadwork.details,
          urgentReason: roadwork.urgentReason || 'High impact on multiple critical routes',
          supervisorAction: 'CREATE_DIVERSION_PLAN',
          notificationSent: true
        }
      };

      // Sync immediately
      const result = await this.callConvexFunction('alerts:batchInsertAlerts', {
        alerts: [urgentAlert]
      });

      console.log(`🚨 URGENT StreetManager roadwork synced: ${roadwork.location}`);
      console.log(`   Affects routes: ${roadwork.affectsRoutes?.join(', ')}`);
      console.log(`   Impact score: ${roadwork.details?.impactScore}`);

      return { success: true, alert: urgentAlert, result };
    } catch (error) {
      console.error('❌ Urgent roadwork sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync bus locations to Convex
  async syncBusLocations() {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }

    try {
      // Fetch latest bus data from BODS
      console.log('🚌 Fetching bus locations for Convex sync...');
      const buses = await busLocationService.fetchBusLocations();
      
      if (buses.length === 0) {
        console.warn('⚠️ No buses to sync');
        return { success: true, count: 0 };
      }
      
      // Filter and prepare data for Convex (only GNE buses)
      const busesToSync = buses
        .filter(bus => {
          // Match Go North East operator code
          const ref = bus.operatorRef || '';
          return ref === 'GNEL';
        })
        .slice(0, 350) // Limit to 350 for performance
        .map(bus => {
          // Transform to match Convex schema exactly
          return {
            id: bus.id,
            operatorRef: bus.operatorRef || 'GNEL',
            lineRef: bus.lineRef || '',
            lineName: bus.lineName || bus.lineRef || '',
            directionRef: bus.directionRef || '0',
            directionName: bus.directionName,
            destinationRef: bus.destinationRef,
            destinationName: bus.destinationName || 'Unknown',
            location: {
              lat: bus.location?.lat || 0,
              lon: bus.location?.lon || 0
            },
            bearing: bus.bearing || 0,
            blockRef: bus.blockRef,
            vehicleJourneyRef: bus.vehicleJourneyRef,
            originRef: bus.originRef,
            originName: bus.originName,
            originAimedDeparture: bus.originAimedDeparture,
            delay: bus.delay || 0,
            status: bus.status || 'on-time',
            recordedAt: bus.recordedAt || new Date().toISOString(),
            validUntil: bus.validUntil,
            occupancy: bus.occupancy
          };
        });
      
      // Call the Convex mutation
      const result = await this.callConvexFunction('buses:updateBusLocations', {
        buses: busesToSync,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Synced ${busesToSync.length} bus locations to Convex`);
      return { success: true, count: busesToSync.length, result };
      
    } catch (error) {
      console.error('❌ Bus sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Main sync method that calls all sync operations
  async sync() {
    console.log('🔄 Starting Convex sync...');
    
    try {
      // Sync bus locations
      await this.syncBusLocations();
      
      console.log('✅ Convex sync complete');
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
  }

  // Start periodic sync
  startPeriodicSync(interval = 30000) {
    console.log(`🔄 Starting periodic Convex sync every ${interval}ms`);
    
    // Initial sync
    this.sync();
    
    // Schedule periodic syncs
    setInterval(() => {
      this.sync();
    }, interval);
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
export default convexSync;

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
