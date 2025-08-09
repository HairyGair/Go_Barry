// GO BARRY to Breakdown Analytics Integration
// Add this to the breakdown-guide components

window.BreakdownAnalytics = {
  // API endpoint - update this based on your deployment
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api/breakdown-analytics'
    : '/api/breakdown-analytics',
  
  // Map wizard types to breakdown categories
  wizardCategoryMap: {
    'brakes': 'Brake System',
    'steering': 'Steering',
    'abs_light': 'Brake System',
    'oil_warning': 'Oil System',
    'loose_wheel_nuts': 'Wheels',
    'puncture': 'Tires',
    'broken_windows': 'Other',
    'wing_mirrors': 'Other',
    'cutting_out_fuel': 'Engine',
    'road_traffic_incidents': 'Other',
    'tracerit_helper': 'Other',
    'repeat_defects': 'Other',
    'interior_lights': 'Electrical',
    'exterior_lights': 'Electrical',
    'wheelchair_ramp': 'Ramp',
    'destination_display': 'Electrical',
    'battery': 'Battery',
    'cooling_system': 'Cooling System',
    'demisters_heaters': 'Climate',
    'doors': 'Doors',
    'non_starter': 'Engine',
    'gear_selection': 'Transmission',
    'gearbox': 'Transmission',
    'buzzers': 'Other',
    'warning_lights': 'Warning Lights',
    'excessive_smoke': 'Engine',
    'suspension': 'Suspension',
    'wipers_screenwash': 'Wipers',
    'low_water': 'Cooling System',
    'speedo': 'Other',
    'interior_exterior_damage': 'Other'
  },
  
  // Detect depot from fleet number (adjust based on your numbering system)
  detectDepot: function(fleetNumber) {
    const num = parseInt(fleetNumber);
    if (isNaN(num)) return 'Unknown';
    
    if (num >= 6000 && num < 6500) return 'Washington';
    if (num >= 5000 && num < 5500) return 'Consett';
    if (num >= 4000 && num < 4500) return 'Hexham';
    if (num >= 3000 && num < 3500) return 'Riverside';
    if (num >= 700 && num < 800) return 'Hexham'; // Solos
    
    return 'Unknown';
  },
  
  // Extract symptoms from wizard responses
  extractSymptoms: function(responses, wizardType) {
    const symptoms = [];
    
    // Generic symptom extraction
    if (responses.symptoms) {
      symptoms.push(...responses.symptoms);
    }
    
    // Wizard-specific extraction
    switch(wizardType) {
      case 'brakes':
        if (responses.pedalSinks === 'yes') symptoms.push('Brake pedal sinks to floor');
        if (responses.delayedResponse === 'yes') symptoms.push('Delayed braking response');
        if (responses.unusualNoises === 'yes') symptoms.push('Unusual brake noises');
        if (responses.visibleLeaks === 'yes') symptoms.push('Visible brake fluid leak');
        if (responses.brakesGrabbing === 'yes') symptoms.push('Brakes grabbing/shuddering');
        if (responses.warningLight === 'yes') symptoms.push('Brake warning light on');
        break;
        
      case 'cooling_system':
        if (responses.temperature) symptoms.push(`Temperature: ${responses.temperature}°C`);
        if (responses.waterBuzzer === 'yes') symptoms.push('Water buzzer sounding');
        if (responses.leaksPresent === 'yes') symptoms.push('Coolant leak detected');
        break;
        
      case 'steering':
        if (responses.excessivePlay === 'yes') symptoms.push('Excessive steering play');
        if (responses.difficultyTurning === 'yes') symptoms.push('Difficulty steering');
        if (responses.vehiclePulling === 'yes') symptoms.push('Vehicle pulling to side');
        if (responses.steeringNoises === 'yes') symptoms.push('Steering noises');
        break;
        
      // Add more wizard-specific extractions as needed
    }
    
    return symptoms;
  },
  
  // Send breakdown event to analytics API
  recordBreakdown: async function(wizardType, responses, decision) {
    try {
      // Build the breakdown event data
      const breakdownData = {
        // Vehicle info
        fleet_number: responses.fleetNumber || responses.vehicleNumber,
        depot: responses.depot || this.detectDepot(responses.fleetNumber),
        
        // Breakdown details
        breakdown_category: this.wizardCategoryMap[wizardType] || 'Other',
        specific_issue: responses.specificIssue || responses.issueDescription || wizardType,
        symptoms: this.extractSymptoms(responses, wizardType),
        severity: decision, // 'STOP', 'AMBER', 'CONTINUE'
        
        // Operational impact
        vehicle_off_road: decision === 'STOP',
        changeover_required: responses.changeoverRequired || decision === 'AMBER',
        service_disrupted: responses.serviceDisrupted || false,
        passengers_affected: parseInt(responses.passengersOnBoard) || 0,
        
        // Context
        reported_by: responses.supervisorName || responses.reportedBy || 'GO BARRY User',
        route: responses.routeNumber || responses.route,
        location: responses.location,
        
        // Source tracking
        source: 'GO_BARRY',
        barry_wizard_used: wizardType,
        
        // Tranzaura reference if created
        tranzaura_ref: responses.tranzauraRef
      };
      
      // Send to API
      const response = await fetch(this.API_URL + '/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(breakdownData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Breakdown recorded:', result);
      
      // Store the event ID for reference
      if (result.eventId) {
        sessionStorage.setItem('lastBreakdownEventId', result.eventId);
      }
      
      return result;
      
    } catch (error) {
      console.error('Failed to record breakdown:', error);
      
      // Store locally for later sync if API is unavailable
      this.storeOffline(wizardType, responses, decision);
      
      return {
        success: false,
        error: error.message,
        offline: true
      };
    }
  },
  
  // Store breakdown data offline for later sync
  storeOffline: function(wizardType, responses, decision) {
    try {
      const offlineBreakdowns = JSON.parse(localStorage.getItem('offlineBreakdowns') || '[]');
      
      offlineBreakdowns.push({
        wizardType,
        responses,
        decision,
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      localStorage.setItem('offlineBreakdowns', JSON.stringify(offlineBreakdowns));
      console.log('Breakdown stored offline for later sync');
      
    } catch (error) {
      console.error('Failed to store offline:', error);
    }
  },
  
  // Sync offline breakdowns when connection is restored
  syncOfflineBreakdowns: async function() {
    try {
      const offlineBreakdowns = JSON.parse(localStorage.getItem('offlineBreakdowns') || '[]');
      const unsyncedBreakdowns = offlineBreakdowns.filter(b => !b.synced);
      
      if (unsyncedBreakdowns.length === 0) {
        return { success: true, synced: 0 };
      }
      
      console.log(`Syncing ${unsyncedBreakdowns.length} offline breakdowns...`);
      
      let syncedCount = 0;
      for (const breakdown of unsyncedBreakdowns) {
        const result = await this.recordBreakdown(
          breakdown.wizardType,
          breakdown.responses,
          breakdown.decision
        );
        
        if (result.success) {
          breakdown.synced = true;
          syncedCount++;
        }
      }
      
      // Update local storage
      localStorage.setItem('offlineBreakdowns', JSON.stringify(offlineBreakdowns));
      
      return {
        success: true,
        synced: syncedCount,
        remaining: unsyncedBreakdowns.length - syncedCount
      };
      
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Check for patterns after recording
  checkPatterns: async function(fleetNumber, depot) {
    try {
      const response = await fetch(this.API_URL + '/pattern-alerts?status=active&depot=' + depot);
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        // Filter for relevant patterns
        const relevantPatterns = result.data.filter(pattern => 
          pattern.affected_depot === depot ||
          (pattern.affected_vehicles && pattern.affected_vehicles.includes(fleetNumber))
        );
        
        return relevantPatterns;
      }
      
      return [];
      
    } catch (error) {
      console.error('Failed to check patterns:', error);
      return [];
    }
  }
};

// Auto-sync offline breakdowns when page loads
window.addEventListener('load', () => {
  // Check for offline breakdowns after a delay
  setTimeout(() => {
    window.BreakdownAnalytics.syncOfflineBreakdowns()
      .then(result => {
        if (result.synced > 0) {
          console.log(`✅ Synced ${result.synced} offline breakdowns`);
        }
      })
      .catch(console.error);
  }, 5000);
});