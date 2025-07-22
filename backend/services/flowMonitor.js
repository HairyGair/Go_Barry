// services/flowMonitor.js
// Real-time traffic flow monitoring service
import { monitorIncidentFlows, getFlowTrendIndicator } from './tomtomFlow.js';
import { ConvexHttpClient } from 'convex/browser';
import axios from 'axios';

// Initialize Convex client for syncing flow updates
const convexClient = process.env.CONVEX_URL ? 
  new ConvexHttpClient(process.env.CONVEX_URL) : null;

// Active incident tracking
const activeIncidents = new Map();
const flowHistory = new Map();

// Monitor configuration
const MONITOR_CONFIG = {
  checkInterval: 5 * 60 * 1000, // 5 minutes
  autoClearThreshold: 0.8, // 80% of free flow speed
  maxHistorySize: 12, // 1 hour of 5-min intervals
  criticalIncidentInterval: 2 * 60 * 1000 // 2 minutes for critical
};

// Flow monitoring manager
class FlowMonitorManager {
  constructor() {
    this.isRunning = false;
    this.monitorInterval = null;
    this.stats = {
      checksPerformed: 0,
      severityUpdates: 0,
      autoCleared: 0,
      lastCheck: null
    };
  }

  // Start monitoring active incidents
  start() {
    if (this.isRunning) {
      console.log('⚠️ Flow monitor already running');
      return;
    }

    console.log('🚀 Starting traffic flow monitor...');
    this.isRunning = true;
    
    // Initial check
    this.checkActiveIncidents();
    
    // Regular monitoring
    this.monitorInterval = setInterval(() => {
      this.checkActiveIncidents();
    }, MONITOR_CONFIG.checkInterval);
  }

  // Stop monitoring
  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Stopping traffic flow monitor');
    this.isRunning = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  // Add incident to monitoring
  addIncident(incident) {
    if (!incident.coordinates || incident.coordinates.length !== 2) {
      console.warn(`⚠️ Cannot monitor incident ${incident.id} - no valid coordinates`);
      return;
    }

    activeIncidents.set(incident.id, {
      ...incident,
      addedAt: Date.now(),
      lastChecked: null,
      flowHistory: []
    });

    console.log(`➕ Added incident ${incident.id} to flow monitoring`);
    
    // Check critical incidents more frequently
    if (incident.severity === 'Critical') {
      setTimeout(() => this.checkSingleIncident(incident.id), 30000); // 30s initial check
    }
  }

  // Remove incident from monitoring
  removeIncident(incidentId) {
    if (activeIncidents.delete(incidentId)) {
      flowHistory.delete(incidentId);
      console.log(`➖ Removed incident ${incidentId} from monitoring`);
    }
  }

  // Check all active incidents
  async checkActiveIncidents() {
    if (activeIncidents.size === 0) return;

    console.log(`🔍 Checking flow for ${activeIncidents.size} active incidents...`);
    this.stats.checksPerformed++;
    this.stats.lastCheck = new Date().toISOString();

    try {
      const incidents = Array.from(activeIncidents.values());
      const flowResults = await monitorIncidentFlows(incidents);

      // Process flow updates
      for (const update of flowResults.updates) {
        await this.processFlowUpdate(update);
      }

      console.log(`✅ Flow check complete: ${flowResults.successful}/${flowResults.processed} successful`);
      
      // Sync stats to Convex
      if (convexClient) {
        await this.syncToConvex();
      }

    } catch (error) {
      console.error('❌ Flow monitoring error:', error);
    }
  }

  // Check single incident (for critical updates)
  async checkSingleIncident(incidentId) {
    const incident = activeIncidents.get(incidentId);
    if (!incident) return;

    try {
      const flowResults = await monitorIncidentFlows([incident]);
      if (flowResults.updates.length > 0) {
        await this.processFlowUpdate(flowResults.updates[0]);
      }
    } catch (error) {
      console.error(`❌ Single incident flow check failed: ${incidentId}`, error);
    }
  }

  // Process flow update for an incident
  async processFlowUpdate(update) {
    const incident = activeIncidents.get(update.incidentId);
    if (!incident) return;

    // Update incident data
    incident.lastChecked = Date.now();
    incident.currentSpeed = update.currentSpeed;
    incident.speedRatio = update.speedRatio;
    incident.flowTrend = update.trend;

    // Add to history
    const history = flowHistory.get(update.incidentId) || [];
    history.push({
      timestamp: update.timestamp,
      speed: update.currentSpeed,
      severity: update.newSeverity
    });
    
    // Limit history size
    if (history.length > MONITOR_CONFIG.maxHistorySize) {
      history.shift();
    }
    flowHistory.set(update.incidentId, history);

    // Check for severity change
    if (update.previousSeverity !== update.newSeverity) {
      console.log(`🔄 Severity change for ${update.incidentId}: ${update.previousSeverity} → ${update.newSeverity}`);
      incident.severity = update.newSeverity;
      incident.severityChangedAt = Date.now();
      this.stats.severityUpdates++;
      
      // Emit severity change event
      await this.emitSeverityChange(incident, update);
    }

    // Check for auto-clear condition
    if (update.shouldAutoClear && incident.severity !== 'Low') {
      console.log(`🟢 Auto-clearing incident ${update.incidentId} - traffic flow normalized`);
      incident.severity = 'Low';
      incident.status = 'clearing';
      incident.autoClearedAt = Date.now();
      this.stats.autoCleared++;
      
      // Schedule removal after grace period
      setTimeout(() => {
        this.removeIncident(update.incidentId);
      }, 10 * 60 * 1000); // 10 minutes
    }

    // Update incident in active map
    activeIncidents.set(update.incidentId, incident);
  }

  // Emit severity change event
  async emitSeverityChange(incident, update) {
    const changeEvent = {
      type: 'flow_severity_change',
      incidentId: incident.id,
      location: incident.location,
      previousSeverity: update.previousSeverity,
      newSeverity: update.newSeverity,
      currentSpeed: update.currentSpeed,
      speedRatio: update.speedRatio,
      trend: update.trend,
      timestamp: new Date().toISOString()
    };

    // Log for now - can integrate with notification system
    console.log('📢 Flow severity change:', changeEvent);
    
    // Sync to Convex if available
    if (convexClient) {
      try {
        // Update flow data in Convex
        await convexClient.mutation("flowMonitoring:updateFlowData", {
          alertId: incident.id,
          flowData: {
            currentSpeed: update.currentSpeed,
            freeFlowSpeed: update.freeFlowSpeed || 50,
            speedRatio: update.speedRatio,
            trend: update.trend,
            trendArrow: getFlowTrendIndicator(update.currentSpeed, update.previousSpeed || update.currentSpeed),
            severity: update.newSeverity,
            roadClosure: update.roadClosure || false,
            shouldAutoClear: update.shouldAutoClear || false
          }
        });
      } catch (error) {
        console.error('❌ Failed to sync flow data:', error);
      }
    }
  }

  // Get flow trend for display
  getIncidentFlowInfo(incidentId) {
    const incident = activeIncidents.get(incidentId);
    if (!incident) return null;

    const history = flowHistory.get(incidentId) || [];
    const previousSpeed = history.length > 1 ? history[history.length - 2].speed : null;
    
    return {
      currentSpeed: incident.currentSpeed,
      speedRatio: incident.speedRatio,
      trend: incident.flowTrend,
      trendArrow: getFlowTrendIndicator(incident.currentSpeed, previousSpeed),
      lastChecked: incident.lastChecked,
      history: history.slice(-6) // Last 30 minutes
    };
  }

  // Sync monitoring data to Convex
  async syncToConvex() {
    if (!convexClient) return;

    try {
      // Sync monitoring stats
      await convexClient.mutation("flowMonitoring:updateFlowMonitoringStats", {
        stats: {
          ...this.stats,
          activeIncidents: activeIncidents.size,
          isRunning: this.isRunning
        }
      });
    } catch (error) {
      console.error('❌ Failed to sync monitoring stats:', error);
    }
  }

  // Get monitoring statistics
  getStats() {
    return {
      ...this.stats,
      activeIncidents: activeIncidents.size,
      isRunning: this.isRunning
    };
  }
}

// Create singleton instance
const flowMonitor = new FlowMonitorManager();

// Export monitor instance
export { flowMonitor };
export default flowMonitor;