// Backend service to sync disruptions from various sources to Convex
import fetch from 'node-fetch';

class DisruptionSyncService {
  constructor() {
    this.convexUrl = process.env.CONVEX_URL;
    this.isEnabled = this.convexUrl && this.convexUrl !== '';
    this.syncInterval = null;
    
    if (this.isEnabled) {
      console.log('✅ Disruption sync service enabled');
    } else {
      console.log('⚠️ Disruption sync disabled - no CONVEX_URL');
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

  // Convert existing alert format to disruption format
  convertAlertToDisruption(alert) {
    // Map severity
    const severityMap = {
      'Critical': 'critical',
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };

    // Determine type based on source and description
    let type = 'incident';
    if (alert.source === 'nationalHighways' || alert.source === 'streetManager') {
      type = 'roadwork';
    } else if (alert.type === 'EVENT') {
      type = 'event';
    } else if (alert.description?.toLowerCase().includes('weather')) {
      type = 'weather';
    } else if (alert.description?.toLowerCase().includes('breakdown')) {
      type = 'breakdown';
    }

    // Parse coordinates
    let coordinates = { lat: 0, lng: 0 };
    if (alert.coordinates) {
      coordinates = {
        lat: alert.coordinates.latitude || alert.coordinates.lat || 0,
        lng: alert.coordinates.longitude || alert.coordinates.lng || 0
      };
    }

    return {
      type,
      status: alert.expired ? 'cleared' : 'active',
      severity: severityMap[alert.severity] || 'medium',
      location: {
        description: alert.location || '',
        coordinates,
        road: alert.road || undefined,
        junction: alert.junction || undefined,
        postcode: alert.postcode || undefined
      },
      startTime: new Date(alert.startTime || alert.timestamp).getTime(),
      endTime: alert.endTime ? new Date(alert.endTime).getTime() : undefined,
      affectedRoutes: alert.affectedRoutes || [],
      estimatedDelay: alert.delay || undefined,
      title: alert.title || alert.description?.substring(0, 100) || 'Unknown Disruption',
      description: alert.description || '',
      source: alert.source || 'unknown',
      sourceId: alert.id || alert.alertId || undefined
    };
  }

  // Sync alerts from existing sources
  async syncFromAlerts(alerts) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }
    
    console.log(`📊 Syncing ${alerts.length} alerts as disruptions to Convex`);
    
    let synced = 0;
    let failed = 0;
    
    for (const alert of alerts) {
      try {
        const disruption = this.convertAlertToDisruption(alert);
        
        // Create disruption without checking for duplicates (let Convex handle it)
        await this.callConvexFunction('disruptions:createDisruption', disruption);
        synced++;
      } catch (error) {
        console.error('❌ Error syncing disruption:', error.message);
        failed++;
      }
    }
    
    console.log(`✅ Disruption sync complete: ${synced} synced, ${failed} failed`);
    return { success: true, synced, failed };
  }

  // Sync roadworks specifically
  async syncRoadworks(roadworks) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }
    
    console.log(`🚧 Syncing ${roadworks.length} roadworks as disruptions`);
    
    let synced = 0;
    let failed = 0;
    
    for (const roadwork of roadworks) {
      try {
        const disruption = {
          type: 'roadwork',
          status: roadwork.status === 'completed' ? 'cleared' : 
                  roadwork.status === 'planned' ? 'planned' : 'active',
          severity: roadwork.priority?.toLowerCase() || 'medium',
          location: {
            description: roadwork.location || '',
            coordinates: {
              lat: roadwork.latitude || 0,
              lng: roadwork.longitude || 0
            },
            road: roadwork.road || undefined
          },
          startTime: new Date(roadwork.startDate).getTime(),
          endTime: roadwork.endDate ? new Date(roadwork.endDate).getTime() : undefined,
          affectedRoutes: roadwork.affectedRoutes || [],
          title: roadwork.title || roadwork.description?.substring(0, 100) || 'Roadwork',
          description: roadwork.description || '',
          source: 'roadworks',
          sourceId: roadwork.id || roadwork._id
        };

        await this.callConvexFunction('disruptions:createDisruption', disruption);
        synced++;
      } catch (error) {
        console.error('❌ Error syncing roadwork:', error.message);
        failed++;
      }
    }
    
    console.log(`✅ Roadwork sync complete: ${synced} synced, ${failed} failed`);
    return { success: true, synced, failed };
  }

  // Sync events
  async syncEvents(events) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }
    
    console.log(`🎪 Syncing ${events.length} events as disruptions`);
    
    let synced = 0;
    let failed = 0;
    
    for (const event of events) {
      try {
        const disruption = {
          type: 'event',
          status: event.status === 'active' ? 'active' : 'planned',
          severity: event.severity?.toLowerCase() || 'medium',
          location: {
            description: `${event.venue} - ${event.location}`,
            coordinates: {
              lat: event.latitude || 0,
              lng: event.longitude || 0
            }
          },
          startTime: new Date(event.date + ' ' + event.time).getTime(),
          endTime: event.endTime ? new Date(event.endTime).getTime() : undefined,
          affectedRoutes: event.affectedRoutes || [],
          title: event.event,
          description: `${event.type} at ${event.venue}. Expected attendance: ${event.expectedAttendance || 'Unknown'}`,
          source: 'events',
          sourceId: event.eventId
        };

        await this.callConvexFunction('disruptions:createDisruption', disruption);
        synced++;
      } catch (error) {
        console.error('❌ Error syncing event:', error.message);
        failed++;
      }
    }
    
    console.log(`✅ Event sync complete: ${synced} synced, ${failed} failed`);
    return { success: true, synced, failed };
  }

  // Main sync function to be called from alert processing
  async syncAll(data) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex not configured' };
    }
    
    const results = {
      alerts: { synced: 0, failed: 0 },
      roadworks: { synced: 0, failed: 0 },
      events: { synced: 0, failed: 0 },
      total: { synced: 0, failed: 0 }
    };
    
    try {
      if (data.alerts) {
        const alertResult = await this.syncFromAlerts(data.alerts);
        results.alerts = { synced: alertResult.synced, failed: alertResult.failed };
      }
      
      if (data.roadworks) {
        const roadworkResult = await this.syncRoadworks(data.roadworks);
        results.roadworks = { synced: roadworkResult.synced, failed: roadworkResult.failed };
      }
      
      if (data.events) {
        const eventResult = await this.syncEvents(data.events);
        results.events = { synced: eventResult.synced, failed: eventResult.failed };
      }

      // Calculate totals
      results.total.synced = results.alerts.synced + results.roadworks.synced + results.events.synced;
      results.total.failed = results.alerts.failed + results.roadworks.failed + results.events.failed;
      
      console.log(`✅ Disruption sync completed: ${results.total.synced} synced, ${results.total.failed} failed`);
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error in disruption sync:', error);
      return { success: false, error: error.message, results };
    }
  }

  // Start periodic sync
  startPeriodicSync(intervalMs = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      console.log('⏰ Running periodic disruption sync');
      // This will be called with fresh data from the main sync process
    }, intervalMs);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const disruptionSync = new DisruptionSyncService();
