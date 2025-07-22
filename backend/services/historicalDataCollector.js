// Historical Data Collection Service
// Automatically captures incidents, roadworks, and events for analysis

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class HistoricalDataCollector {
  constructor() {
    this.batchSize = 10;
    this.pendingData = [];
  }

  // Capture incident data
  async captureIncident(incident) {
    try {
      const historicalData = {
        disruption_id: incident.id || `INC-${Date.now()}`,
        type: 'incident',
        title: incident.description || 'Traffic Incident',
        description: incident.details || incident.description,
        severity: incident.severity || 5,
        location_lat: incident.location?.lat || incident.latitude,
        location_lng: incident.location?.lng || incident.longitude,
        location_description: incident.location_description || incident.address,
        affected_routes: incident.affected_routes || [],
        start_time: incident.created_at || new Date(),
        end_time: incident.resolved_at || null,
        duration_minutes: incident.duration || null,
        created_by: incident.supervisor_badge || 'SYSTEM',
        source: incident.source || 'manual'
      };

      await this.saveToDatabase(historicalData);
      console.log(`✅ Captured incident: ${historicalData.disruption_id}`);
    } catch (error) {
      console.error('❌ Error capturing incident:', error);
    }
  }

  // Capture roadwork data
  async captureRoadwork(roadwork) {
    try {
      const historicalData = {
        disruption_id: roadwork.id || `RW-${Date.now()}`,
        type: 'roadwork',
        title: roadwork.title || roadwork.description,
        description: roadwork.details || roadwork.description,
        severity: this.mapPriorityToSeverity(roadwork.priority),
        location_lat: roadwork.location?.lat,
        location_lng: roadwork.location?.lng,
        location_description: roadwork.location_description,
        affected_routes: roadwork.affected_routes || [],
        start_time: roadwork.start_date || roadwork.created_at,
        end_time: roadwork.end_date || null,
        duration_minutes: this.calculateDuration(roadwork.start_date, roadwork.end_date),
        created_by: roadwork.created_by || 'SYSTEM',
        source: roadwork.source || 'streetmanager'
      };

      await this.saveToDatabase(historicalData);
      console.log(`✅ Captured roadwork: ${historicalData.disruption_id}`);
    } catch (error) {
      console.error('❌ Error capturing roadwork:', error);
    }
  }

  // Capture event data
  async captureEvent(event) {
    try {
      const historicalData = {
        disruption_id: event.eventId || `EVT-${Date.now()}`,
        type: 'event',
        title: event.event || 'Major Event',
        description: `${event.event} at ${event.venue}`,
        severity: event.severity || 5,
        location_lat: event.location?.lat,
        location_lng: event.location?.lng,
        location_description: event.venue,
        affected_routes: event.affectedRoutes || [],
        start_time: new Date(event.dateTime),
        end_time: event.endTime ? new Date(event.endTime) : null,
        duration_minutes: event.duration || 180, // Default 3 hours
        created_by: 'SYSTEM',
        source: 'eventmonitor'
      };

      await this.saveToDatabase(historicalData);
      console.log(`✅ Captured event: ${historicalData.disruption_id}`);
    } catch (error) {
      console.error('❌ Error capturing event:', error);
    }
  }

  // Save to Supabase
  async saveToDatabase(data) {
    // Calculate duration if not provided
    if (!data.duration_minutes && data.end_time) {
      data.duration_minutes = this.calculateDuration(data.start_time, data.end_time);
    }

    const { error } = await supabase
      .from('historical_disruptions')
      .upsert(data, { onConflict: 'disruption_id' });

    if (error) {
      throw error;
    }
  }

  // Batch capture for alerts
  async captureAlerts(alerts) {
    const capturePromises = alerts.map(alert => {
      const captureData = {
        disruption_id: alert.id,
        type: 'incident',
        title: alert.description,
        description: alert.details || alert.description,
        severity: alert.severity || 5,
        location_lat: alert.location?.coordinates?.[1],
        location_lng: alert.location?.coordinates?.[0],
        location_description: alert.location?.description,
        affected_routes: alert.matched_routes || [],
        start_time: new Date(alert.timestamp || alert.created_at),
        source: alert.source || 'tomtom'
      };
      
      return this.saveToDatabase(captureData);
    });

    await Promise.allSettled(capturePromises);
    console.log(`✅ Captured ${alerts.length} alerts to historical data`);
  }

  // Utility functions
  mapPriorityToSeverity(priority) {
    const mapping = {
      'Critical': 9,
      'High': 7,
      'Medium': 5,
      'Low': 3,
      'Planned': 2
    };
    return mapping[priority] || 5;
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60)); // Minutes
  }

  // Update incident when resolved
  async updateIncidentResolution(incidentId, endTime, handledBy) {
    try {
      const end = new Date(endTime);
      const { data: incident } = await supabase
        .from('historical_disruptions')
        .select('start_time, handled_by')
        .eq('disruption_id', incidentId)
        .single();

      if (incident) {
        const duration = this.calculateDuration(incident.start_time, end);
        const handlers = incident.handled_by || [];
        if (handledBy && !handlers.includes(handledBy)) {
          handlers.push(handledBy);
        }

        await supabase
          .from('historical_disruptions')
          .update({
            end_time: end,
            duration_minutes: duration,
            handled_by: handlers
          })
          .eq('disruption_id', incidentId);

        console.log(`✅ Updated resolution for: ${incidentId}`);
      }
    } catch (error) {
      console.error('❌ Error updating resolution:', error);
    }
  }
}

// Create singleton instance
const historicalCollector = new HistoricalDataCollector();

export default historicalCollector;
