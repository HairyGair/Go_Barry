/*
 * Wizard Tracker Integration Helper
 * Connects assessment wizards to the breakdown tracker system
 * Automatically creates breakdown records when assessments result in STOP/AMBER decisions
 */

class WizardTrackerIntegration {
  constructor() {
    this.apiBase = window.CONFIG?.API_BASE || 'https://go-barry.onrender.com';
  }

  // Map wizard decisions to tracker severity levels
  mapDecisionToSeverity(decision, wizardType) {
    // Handle various decision formats from different wizards
    const decisionUpper = (decision || '').toUpperCase();
    
    // Direct mappings
    if (decisionUpper === 'STOP' || decisionUpper.includes('STOP')) {
      return 'STOP';
    }
    if (decisionUpper === 'AMBER' || decisionUpper.includes('AMBER')) {
      return 'AMBER';
    }
    if (decisionUpper === 'CONTINUE' || decisionUpper.includes('CONTINUE')) {
      return 'CONTINUE';
    }
    
    // Handle specific wizard decision formats
    if (decisionUpper.includes('CHANGEOVER') || decisionUpper.includes('REPLACE')) {
      return 'AMBER';
    }
    if (decisionUpper.includes('ENGINEERING') || decisionUpper.includes('ENGINEER')) {
      return 'STOP';
    }
    if (decisionUpper.includes('SERVICE') || decisionUpper.includes('OPERATION')) {
      return 'CONTINUE';
    }
    
    // Default based on criticality
    return 'PENDING';
  }

  // Extract vehicle information from current context
  getVehicleInfo() {
    // Try to get from existing breakdown logger
    if (window.SupervisorBreakdownLogger?.currentAssessment?.vehicleReg) {
      return {
        vehicle_id: window.SupervisorBreakdownLogger.currentAssessment.vehicleReg,
        location: window.SupervisorBreakdownLogger.currentAssessment.location
      };
    }

    // Try to get from form inputs if available
    const vehicleInput = document.getElementById('vehicle-reg') || document.getElementById('vehicleId');
    const locationInput = document.getElementById('location');
    const routeInput = document.getElementById('route') || document.getElementById('service');

    return {
      vehicle_id: vehicleInput?.value || 'UNKNOWN',
      route_id: routeInput?.value || null,
      location: locationInput?.value || 'Assessment Location'
    };
  }

  // Get supervisor information
  getSupervisorInfo() {
    const supervisorBadge = localStorage.getItem('supervisorBadge') ||
                           window.supervisorSession?.supervisorId ||
                           'UNKNOWN';

    const supervisorName = localStorage.getItem('supervisorName') ||
                          window.supervisorSession?.name ||
                          supervisorBadge;

    return { supervisorBadge, supervisorName };
  }

  // Map wizard type to issue category
  getIssueCategoryFromWizard(wizardType) {
    const categoryMap = {
      'SteeringWizard': 'Steering System',
      'BrakesWizard': 'Braking System',
      'BatteryWizard': 'Electrical System',
      'CoolingSystemWizard': 'Engine Cooling',
      'GearboxWizard': 'Transmission',
      'ExteriorLightsWizard': 'Lighting System',
      'InteriorLightsWizard': 'Interior Systems',
      'DoorsWizard': 'Door Systems',
      'WheelchairRampWizard': 'Accessibility Equipment',
      'PunctureWizard': 'Wheel/Tire Issues',
      'SuspensionWizard': 'Suspension System',
      'ExcessiveSmokeWizard': 'Engine Issues',
      'NonStarterWizard': 'Starting System',
      'CuttingOutFuelWizard': 'Fuel System',
      'OilWarningLightWizard': 'Engine Lubrication',
      'WarningLightsWizard': 'Dashboard Warning Systems',
      'WipersScreenwashWizard': 'Windscreen Systems',
      'DemistersHeatersWizard': 'Climate Control',
      'ABSLightWizard': 'ABS System',
      'DestinationDisplayWizard': 'Passenger Information Systems',
      'BuzzersWizard': 'Audio Systems',
      'default': 'General Assessment'
    };

    return categoryMap[wizardType] || categoryMap['default'];
  }

  // Generate issue description based on wizard type and responses
  generateIssueDescription(wizardType, decision, responses) {
    const wizardName = wizardType.replace('Wizard', '');
    const responseSummary = this.summarizeResponses(responses);

    let description = `${wizardName} assessment completed with ${decision} decision.`;

    if (responseSummary) {
      description += ` Key findings: ${responseSummary}`;
    }

    return description;
  }

  // Summarize wizard responses for issue description
  summarizeResponses(responses) {
    if (!responses || typeof responses !== 'object') {
      return '';
    }

    const summary = [];

    // Extract key information from responses
    Object.entries(responses).forEach(([key, value]) => {
      if (key.toLowerCase().includes('symptom') && value) {
        summary.push(value);
      } else if (key.toLowerCase().includes('problem') && value) {
        summary.push(value);
      } else if (key.toLowerCase().includes('issue') && value) {
        summary.push(value);
      } else if (value === true || value === 'yes') {
        summary.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
      }
    });

    return summary.slice(0, 3).join(', '); // Limit to first 3 key findings
  }

  // Determine if engineering is required based on wizard type and responses
  requiresEngineering(wizardType, responses) {
    // Critical systems that typically require engineering
    const engineeringWizards = [
      'SteeringWizard',
      'BrakesWizard',
      'SuspensionWizard',
      'GearboxWizard',
      'CoolingSystemWizard',
      'ExcessiveSmokeWizard'
    ];

    if (engineeringWizards.includes(wizardType)) {
      return true;
    }

    // Check responses for engineering indicators
    if (responses && typeof responses === 'object') {
      const responseValues = Object.values(responses);
      const responseKeys = Object.keys(responses);

      // Look for indicators that suggest engineering is needed
      for (let i = 0; i < responseKeys.length; i++) {
        const key = responseKeys[i].toLowerCase();
        const value = responseValues[i];

        if ((key.includes('severe') || key.includes('major') || key.includes('complete')) && value) {
          return true;
        }

        if (typeof value === 'string' && value.toLowerCase().includes('engineering')) {
          return true;
        }
      }
    }

    return false;
  }

  // Create breakdown record after wizard completion
  async createBreakdownFromWizard(wizardType, decision, responses = {}, assessmentId = null) {
    try {
      const severity = this.mapDecisionToSeverity(decision, wizardType);

      // Only create tracker records for STOP and AMBER decisions
      // CONTINUE decisions don't need breakdown tracking
      if (severity === 'CONTINUE') {
        console.log(`[WIZARD-TRACKER] ${wizardType} assessment resulted in CONTINUE - no tracker record needed`);
        return null;
      }

      const vehicleInfo = this.getVehicleInfo();
      const { supervisorBadge, supervisorName } = this.getSupervisorInfo();

      // Determine issue category and description based on wizard type
      const issueCategory = this.getIssueCategoryFromWizard(wizardType);
      const issueDescription = this.generateIssueDescription(wizardType, decision, responses);

      // Create the breakdown record using new API
      const breakdownData = {
        // Wizard information
        wizard_type: wizardType,
        wizard_decision: severity,
        wizard_assessment_data: {
          responses,
          assessment_id: assessmentId,
          completed_at: new Date().toISOString(),
          original_decision: decision
        },

        // Vehicle and location
        fleet_number: vehicleInfo.vehicle_id,
        location: vehicleInfo.location,
        location_coords: vehicleInfo.location_coords || null,
        w3w_location: vehicleInfo.w3w_location || null,

        // Supervisor information
        supervisor_badge: supervisorBadge,
        supervisor_name: supervisorName,

        // Issue details
        issue_category: issueCategory,
        issue_description: issueDescription,
        severity: severity,

        // Additional context
        priority_level: severity === 'STOP' ? 1 : (severity === 'AMBER' ? 2 : 3),
        engineering_required: severity === 'STOP' || this.requiresEngineering(wizardType, responses),
        replacement_vehicle_required: severity === 'STOP'
      };

      console.log(`[WIZARD-TRACKER] Creating breakdown record for ${wizardType} assessment:`, breakdownData);

      const response = await fetch(`${this.apiBase}/api/breakdowns/from-wizard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(breakdownData)
      });

      const result = await response.json();

      if (result.success) {
        const breakdownId = result.breakdown_id;
        console.log(`[WIZARD-TRACKER] Breakdown record created: ${breakdownId}`);

        return {
          breakdownId,
          severity,
          success: true,
          breakdown: result.breakdown
        };
      } else {
        console.error('[WIZARD-TRACKER] Failed to create breakdown record:', result);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('[WIZARD-TRACKER] Error creating breakdown from wizard:', error);
      return { success: false, error: error.message };
    }
  }


  // Enhanced completion handler that integrates with existing logging
  async handleWizardCompletion(wizardType, decision, responses, assessmentId, originalOnComplete) {
    try {
      // Always call original completion first (existing logging, etc.)
      if (typeof originalOnComplete === 'function') {
        await originalOnComplete();
      }

      // Then create breakdown tracker record if needed
      const trackerResult = await this.createBreakdownFromWizard(
        wizardType,
        decision,
        responses,
        assessmentId
      );

      if (trackerResult?.success) {
        // Show success message to supervisor
        this.showTrackerNotification(
          `✅ Breakdown logged - ID: ${trackerResult.breakdownId}`,
          'success'
        );

        // Update UI to show tracker status
        this.updateTrackerUI(trackerResult.breakdownId, trackerResult.severity);

        return trackerResult;
      } else if (trackerResult?.error) {
        // Log error but don't block user workflow
        console.warn('[WIZARD-TRACKER] Tracker logging failed but assessment completed:', trackerResult.error);

        this.showTrackerNotification(
          '⚠️ Assessment completed but breakdown tracking failed',
          'warning'
        );
      }

      return trackerResult;

    } catch (error) {
      console.error('[WIZARD-TRACKER] Error in wizard completion:', error);
      // Don't block the user - assessment is still valid
      return { success: false, error: error.message };
    }
  }

  // Show notification to user
  showTrackerNotification(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `tracker-notification ${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      maxWidth: '300px',
      background: type === 'success' ? '#10B981' : 
                 type === 'warning' ? '#F59E0B' : 
                 type === 'error' ? '#EF4444' : '#6B7280',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Update tracker UI if visible
  updateTrackerUI(breakdownId, severity) {
    // Try to refresh the breakdown tracker if it's visible
    if (window.breakdownTracker && typeof window.breakdownTracker.loadActiveBreakdowns === 'function') {
      setTimeout(() => {
        window.breakdownTracker.loadActiveBreakdowns();
      }, 1000); // Give the backend time to process
    }

    // Update any visible active breakdowns displays
    const trackerContainer = document.getElementById('breakdown-tracker-container');
    if (trackerContainer && trackerContainer.style.display !== 'none') {
      // Show a temporary indicator
      const indicator = document.createElement('div');
      indicator.className = 'new-breakdown-indicator';
      indicator.innerHTML = `<span style="color: #10B981;">✅ New ${severity} breakdown logged</span>`;
      indicator.style.cssText = `
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 10px 0;
        font-size: 14px;
        animation: fadeInOut 3s ease forwards;
      `;

      // Add CSS animation
      if (!document.getElementById('tracker-animations')) {
        const style = document.createElement('style');
        style.id = 'tracker-animations';
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `;
        document.head.appendChild(style);
      }

      trackerContainer.prepend(indicator);

      // Remove after animation
      setTimeout(() => indicator.remove(), 3000);
    }
  }
}

// Create global instance
const wizardTrackerIntegration = new WizardTrackerIntegration();

// Make it globally available
window.WizardTrackerIntegration = WizardTrackerIntegration;
window.wizardTrackerIntegration = wizardTrackerIntegration;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WizardTrackerIntegration;
}