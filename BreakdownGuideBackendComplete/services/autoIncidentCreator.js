// services/autoIncidentCreator.js
// Automatic Incident Creation from Traffic Intelligence Alerts
import { createIncident } from './enhancedIncidentManager.js';
import { trafficIntelligence } from './unifiedTrafficIntelligence.js';

// Thresholds for automatic incident creation
const AUTO_INCIDENT_THRESHOLDS = {
  INTELLIGENCE_SCORE: 75, // Must have high intelligence score
  ROUTE_IMPACT: 'high', // Must impact high-frequency routes
  CONGESTION_LEVEL: 60, // Severe congestion threshold
  DURATION_MINUTES: 15, // Must persist for at least 15 minutes
  CLASSIFICATIONS: ['CRITICAL', 'HIGH'], // National Highways classifications that auto-create
  TOMTOM_CATEGORIES: [1, 7, 10, 11] // TomTom categories that auto-create (accidents, roadworks, closures)
};

// Route priority mapping for incident severity
const ROUTE_PRIORITY_MAPPING = {
  // Critical routes - immediate incident creation
  'critical': ['1', '2', '10', '21', '22', 'Q3', 'X21'],
  // High priority routes - create for major issues
  'high': ['27', '28', '307', '309', '56', '57', '58', 'X25'],
  // Medium priority routes - create for severe issues only
  'medium': ['6', '7', '16', '18', '20', '43', '44', '45']
};

export class AutoIncidentCreator {
  constructor() {
    this.processedAlerts = new Set(); // Track which alerts we've processed
    this.pendingIncidents = new Map(); // Track pending incidents by alert ID
    this.incidentHistory = new Map(); // Track created incidents
    this.monitoring = false;
  }

  /**
   * Start monitoring traffic alerts for automatic incident creation
   */
  async startMonitoring() {
    if (this.monitoring) {
      console.log('⚠️ Auto incident creator already monitoring');
      return;
    }

    this.monitoring = true;
    console.log('🤖 Starting automatic incident creation monitoring...');

    // Check for incidents every 2 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForAutoIncidents();
      } catch (error) {
        console.error('❌ Auto incident monitoring error:', error.message);
      }
    }, 2 * 60 * 1000);

    // Initial check
    await this.checkForAutoIncidents();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitoring = false;
    console.log('🛑 Stopped automatic incident creation monitoring');
  }

  /**
   * Check traffic intelligence for alerts that should become incidents
   */
  async checkForAutoIncidents() {
    try {
      console.log('🔍 Checking traffic intelligence for auto-incident creation...');

      // Get latest traffic intelligence
      const intelligence = await trafficIntelligence.getTrafficIntelligence();
      if (!intelligence.success) {
        console.log('⚠️ No traffic intelligence available for auto-incident check');
        return;
      }

      const alerts = intelligence.data;
      const autoIncidents = [];

      for (const alert of alerts) {
        // Skip if already processed
        if (this.processedAlerts.has(alert.id)) {
          continue;
        }

        // Check if alert qualifies for automatic incident creation
        const qualification = this.evaluateAlertForIncident(alert);
        if (qualification.shouldCreate) {
          console.log(`🚨 Alert ${alert.id} qualifies for auto-incident: ${qualification.reason}`);
          
          const incident = await this.createIncidentFromAlert(alert, qualification);
          if (incident) {
            autoIncidents.push(incident);
            this.processedAlerts.add(alert.id);
            this.incidentHistory.set(alert.id, {
              incidentId: incident.id,
              alertId: alert.id,
              createdAt: new Date().toISOString(),
              qualification: qualification
            });
          }
        } else {
          // Mark as processed to avoid re-evaluation
          this.processedAlerts.add(alert.id);
        }
      }

      if (autoIncidents.length > 0) {
        console.log(`✅ Created ${autoIncidents.length} automatic incidents from traffic alerts`);
      } else {
        console.log('ℹ️ No alerts qualified for automatic incident creation');
      }

      return autoIncidents;

    } catch (error) {
      console.error('❌ Auto incident check failed:', error.message);
      return [];
    }
  }

  /**
   * Evaluate if an alert should automatically become an incident
   */
  evaluateAlertForIncident(alert) {
    const reasons = [];
    let score = 0;

    // Intelligence score check
    if (alert.intelligenceScore >= AUTO_INCIDENT_THRESHOLDS.INTELLIGENCE_SCORE) {
      score += 30;
      reasons.push(`High intelligence score (${alert.intelligenceScore})`);
    }

    // Route impact check
    if (alert.routeImpact?.level === AUTO_INCIDENT_THRESHOLDS.ROUTE_IMPACT) {
      score += 25;
      reasons.push(`High route impact (${alert.routeImpact.totalRoutes} routes)`);
    }

    // Critical route check
    const affectedRoutes = alert.affectsRoutes || [];
    const criticalRoutes = ROUTE_PRIORITY_MAPPING.critical;
    const hasCriticalRoute = affectedRoutes.some(route => criticalRoutes.includes(route));
    if (hasCriticalRoute) {
      score += 25;
      reasons.push(`Affects critical routes: ${affectedRoutes.filter(r => criticalRoutes.includes(r)).join(', ')}`);
    }

    // Congestion level check
    if (alert.congestionLevel >= AUTO_INCIDENT_THRESHOLDS.CONGESTION_LEVEL) {
      score += 20;
      reasons.push(`Severe congestion (${alert.congestionLevel}% speed reduction)`);
    }

    // National Highways classification check
    if (AUTO_INCIDENT_THRESHOLDS.CLASSIFICATIONS.includes(alert.classification)) {
      score += 30;
      reasons.push(`Critical classification: ${alert.classification}`);
    }

    // TomTom category check
    if (AUTO_INCIDENT_THRESHOLDS.TOMTOM_CATEGORIES.includes(alert.iconCategory)) {
      score += 25;
      reasons.push(`High-impact TomTom category: ${alert.iconCategory}`);
    }

    // Status check - red alerts get priority
    if (alert.status === 'red') {
      score += 15;
      reasons.push('Red status alert');
    }

    // Time context - rush hour incidents are more critical
    if (alert.timeContext?.rushHour) {
      score += 10;
      reasons.push('Rush hour timing');
    }

    // Road priority check
    if (alert.roadPriority === 'critical') {
      score += 15;
      reasons.push(`Critical road: ${alert.location}`);
    }

    // Decision logic
    const shouldCreate = score >= 50; // Minimum score for auto-creation
    const qualification = {
      shouldCreate: shouldCreate,
      score: score,
      reason: reasons.join('; '),
      priority: this.determinePriority(alert, score),
      autoCreated: true
    };

    if (shouldCreate) {
      console.log(`✅ Alert ${alert.id} qualifies for auto-incident (score: ${score}/100)`);
      console.log(`   Reasons: ${qualification.reason}`);
    }

    return qualification;
  }

  /**
   * Determine incident priority based on alert and score
   */
  determinePriority(alert, score) {
    if (score >= 80) return 'Critical';
    if (score >= 65) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  }

  /**
   * Create incident from traffic alert
   */
  async createIncidentFromAlert(alert, qualification) {
    try {
      const incidentData = {
        title: this.generateIncidentTitle(alert),
        description: this.generateIncidentDescription(alert, qualification),
        location: alert.location,
        coordinates: alert.coordinates,
        priority: qualification.priority,
        severity: alert.severity,
        status: 'Active',
        type: this.mapAlertTypeToIncidentType(alert.type),
        affectedRoutes: alert.affectsRoutes || [],
        
        // Source tracking
        sourceAlert: {
          id: alert.id,
          source: alert.source,
          intelligenceScore: alert.intelligenceScore,
          autoCreated: true
        },
        
        // Traffic specific data
        trafficData: {
          congestionLevel: alert.congestionLevel,
          currentSpeed: alert.currentSpeed,
          freeFlowSpeed: alert.freeFlowSpeed,
          delayMinutes: alert.delayMinutes,
          classification: alert.classification,
          roadPriority: alert.roadPriority
        },
        
        // Auto-creation metadata
        autoCreated: true,
        autoCreationScore: qualification.score,
        autoCreationReason: qualification.reason,
        
        // Timestamps
        detectedAt: alert.lastUpdated || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'Auto Incident Creator'
      };

      console.log(`🤖 Creating automatic incident: ${incidentData.title}`);
      
      const incident = await createIncident(incidentData);
      
      if (incident) {
        console.log(`✅ Auto-created incident ${incident.id} from alert ${alert.id}`);
        
        // Log the creation for audit trail
        console.log(`📋 Incident Details:
   Title: ${incidentData.title}
   Priority: ${incidentData.priority}
   Affected Routes: ${incidentData.affectedRoutes.join(', ')}
   Score: ${qualification.score}/100
   Reason: ${qualification.reason}`);
      }
      
      return incident;
      
    } catch (error) {
      console.error(`❌ Failed to create incident from alert ${alert.id}:`, error.message);
      return null;
    }
  }

  /**
   * Generate incident title from alert
   */
  generateIncidentTitle(alert) {
    const titleParts = [];
    
    // Add type prefix
    switch (alert.type) {
      case 'congestion':
        titleParts.push('🚦 Traffic Congestion');
        break;
      case 'incident':
        titleParts.push('🚨 Traffic Incident');
        break;
      case 'roadwork':
        titleParts.push('🚧 Roadworks');
        break;
      default:
        titleParts.push('⚠️ Traffic Alert');
    }
    
    // Add location
    if (alert.location) {
      titleParts.push('-', alert.location);
    }
    
    // Add severity indicator for high-impact alerts
    if (alert.intelligenceScore >= 90) {
      titleParts.push('(CRITICAL)');
    } else if (alert.intelligenceScore >= 75) {
      titleParts.push('(HIGH IMPACT)');
    }
    
    return titleParts.join(' ').substring(0, 100); // Limit title length
  }

  /**
   * Generate incident description from alert
   */
  generateIncidentDescription(alert, qualification) {
    const parts = [];
    
    // Auto-creation notice
    parts.push('🤖 AUTOMATICALLY CREATED from traffic intelligence alert');
    parts.push('');
    
    // Alert description
    if (alert.description) {
      parts.push('📋 DESCRIPTION:');
      parts.push(alert.description);
      parts.push('');
    }
    
    // Traffic details
    if (alert.congestionLevel) {
      parts.push('🚦 TRAFFIC DETAILS:');
      parts.push(`• Congestion Level: ${alert.congestionLevel}% speed reduction`);
      if (alert.currentSpeed && alert.freeFlowSpeed) {
        parts.push(`• Current Speed: ${alert.currentSpeed} km/h (Normal: ${alert.freeFlowSpeed} km/h)`);
      }
      if (alert.delayMinutes) {
        parts.push(`• Estimated Delay: ${alert.delayMinutes} min/km`);
      }
      parts.push('');
    }
    
    // Route impact
    if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
      parts.push('🚌 AFFECTED ROUTES:');
      parts.push(`• ${alert.affectsRoutes.join(', ')}`);
      if (alert.routeImpact) {
        parts.push(`• Impact Level: ${alert.routeImpact.level}`);
        if (alert.routeImpact.highFrequency?.length > 0) {
          parts.push(`• High Frequency Routes: ${alert.routeImpact.highFrequency.join(', ')}`);
        }
      }
      parts.push('');
    }
    
    // Intelligence details
    parts.push('🧠 INTELLIGENCE ANALYSIS:');
    parts.push(`• Intelligence Score: ${alert.intelligenceScore}/100`);
    parts.push(`• Auto-Creation Score: ${qualification.score}/100`);
    parts.push(`• Priority: ${qualification.priority}`);
    parts.push(`• Source: ${alert.source}`);
    if (alert.classification) {
      parts.push(`• Classification: ${alert.classification}`);
    }
    parts.push('');
    
    // Auto-creation reasoning
    parts.push('🎯 AUTO-CREATION CRITERIA:');
    parts.push(qualification.reason);
    parts.push('');
    
    // Time context
    if (alert.timeContext) {
      parts.push('⏰ TIME CONTEXT:');
      parts.push(`• Time of Day: ${alert.timeContext.timeOfDay}`);
      parts.push(`• Day Type: ${alert.timeContext.dayType}`);
      if (alert.timeContext.rushHour) {
        parts.push('• ⚠️ RUSH HOUR - High impact expected');
      }
      parts.push('');
    }
    
    // Source information
    parts.push('📊 SOURCE DATA:');
    parts.push(`• Alert ID: ${alert.id}`);
    parts.push(`• Source: ${alert.source}`);
    parts.push(`• Detected: ${new Date(alert.lastUpdated).toLocaleString('en-GB')}`);
    parts.push(`• Created: ${new Date().toLocaleString('en-GB')}`);
    
    return parts.join('\n');
  }

  /**
   * Map alert type to incident type
   */
  mapAlertTypeToIncidentType(alertType) {
    const mapping = {
      'congestion': 'Traffic Congestion',
      'incident': 'Traffic Incident',
      'roadwork': 'Planned Roadworks',
      'weather': 'Weather Related'
    };
    
    return mapping[alertType] || 'Traffic Alert';
  }

  /**
   * Get statistics about auto-created incidents
   */
  getStatistics() {
    const history = Array.from(this.incidentHistory.values());
    
    return {
      totalAutoCreated: history.length,
      averageScore: history.reduce((sum, h) => sum + h.qualification.score, 0) / (history.length || 1),
      byPriority: {
        Critical: history.filter(h => h.qualification.priority === 'Critical').length,
        High: history.filter(h => h.qualification.priority === 'High').length,
        Medium: history.filter(h => h.qualification.priority === 'Medium').length,
        Low: history.filter(h => h.qualification.priority === 'Low').length
      },
      recentIncidents: history.slice(-10),
      monitoring: this.monitoring,
      processedAlerts: this.processedAlerts.size
    };
  }

  /**
   * Clear processed alerts cache (for testing)
   */
  clearProcessedAlerts() {
    this.processedAlerts.clear();
    console.log('🗑️ Cleared processed alerts cache');
  }

  /**
   * Manual check for specific alert
   */
  async evaluateSpecificAlert(alertId) {
    try {
      const intelligence = await trafficIntelligence.getTrafficIntelligence();
      if (!intelligence.success) return null;
      
      const alert = intelligence.data.find(a => a.id === alertId);
      if (!alert) return null;
      
      return this.evaluateAlertForIncident(alert);
    } catch (error) {
      console.error('❌ Failed to evaluate specific alert:', error.message);
      return null;
    }
  }
}

// Export singleton instance
export const autoIncidentCreator = new AutoIncidentCreator();
export default autoIncidentCreator;