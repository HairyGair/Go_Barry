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

      // Create the breakdown record
      const breakdownData = {
        vehicle_id: vehicleInfo.vehicle_id,
        route_id: vehicleInfo.route_id,
        location: vehicleInfo.location,
        supervisor_badge: supervisorBadge,
        supervisor_name: supervisorName,
        wizard_type: wizardType,
        assessment_id: assessmentId,
        initial_notes: `${wizardType} assessment completed with ${severity} decision`
      };

      console.log(`[WIZARD-TRACKER] Creating breakdown record for ${wizardType} assessment:`, breakdownData);

      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/create`, {
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

        // Immediately record the decision
        await this.recordDecision(breakdownId, severity, decision, responses, supervisorBadge, supervisorName);

        return {
          breakdownId,
          severity,
          success: true
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

  // Record the assessment decision in the tracker
  async recordDecision(breakdownId, severity, decision, responses, supervisorBadge, supervisorName) {
    try {
      const decisionData = {
        event_type: 'decision',
        by_badge: supervisorBadge,
        by_name: supervisorName,
        notes: `Assessment decision: ${decision}`,
        metadata: {
          severity: severity,
          original_decision: decision,
          wizard_responses: responses,
          assessment_method: 'breakdown_guide_wizard'
        },
        severity: severity
      };

      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/${breakdownId}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(decisionData)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[WIZARD-TRACKER] Decision recorded for breakdown ${breakdownId}`);
      } else {
        console.error('[WIZARD-TRACKER] Failed to record decision:', result);
      }

      return result;

    } catch (error) {
      console.error('[WIZARD-TRACKER] Error recording decision:', error);
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