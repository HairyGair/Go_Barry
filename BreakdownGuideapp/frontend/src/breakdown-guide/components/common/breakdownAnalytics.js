// GO BARRY to Breakdown Analytics Integration
// Add this to the breakdown-guide components

window.BreakdownAnalytics = {
  // API endpoint - update this based on your deployment
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api/breakdown-analytics'
    : '/api/breakdown-analytics',
  
  // Fleet database cache
  fleetDatabase: null,
  
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
    'incident_report_helper': 'Other',
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
  
  // Load fleet database from backend API
  loadFleetDatabase: async function() {
    try {
      // Get API URL from environment or use production default
      const apiUrl = import.meta?.env?.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

      const response = await fetch(`${apiUrl}/api/fleet`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const fleetList = await response.json();

      // Transform flat array into keyed object for easier lookup by fleet number
      this.fleetDatabase = {};
      fleetList.forEach(vehicle => {
        this.fleetDatabase[vehicle.fleet_no.toString()] = {
          fleetNo: vehicle.fleet_no.toString(),
          registration: vehicle.registration || 'N/A',
          depot: vehicle.depot || 'Unknown',
          vehicleType: vehicle.vehicle_type || 'Unknown',
          isActive: vehicle.is_active !== 0
        };
      });

      console.log(`✅ Fleet database loaded: ${fleetList.length} vehicles from API`);
      return this.fleetDatabase;
    } catch (error) {
      console.error('Failed to load fleet database from API:', error);
      return null;
    }
  },

  // Get fleet information by fleet number
  getFleetInfo: function(fleetNumber) {
    if (!this.fleetDatabase) {
      console.warn('Fleet database not loaded');
      return null;
    }
    
    const fleetInfo = this.fleetDatabase[fleetNumber];
    if (!fleetInfo) {
      console.warn(`Fleet number ${fleetNumber} not found in database`);
      return null;
    }
    
    return fleetInfo;
  },

  // Enhanced depot detection using fleet database
  detectDepot: function(fleetNumber) {
    // Try to get depot from fleet database first
    const fleetInfo = this.getFleetInfo(fleetNumber);
    if (fleetInfo && fleetInfo.depot) {
      return fleetInfo.depot;
    }
    
    // Fallback to number-based detection
    const num = parseInt(fleetNumber);
    if (isNaN(num)) return 'Unknown';
    
    if (num >= 6900 && num <= 6999) return 'Percy Main';
    if (num >= 6070 && num <= 6080) return 'Consett';
    if (num >= 6000 && num < 6070) return 'Washington';
    if (num >= 5420 && num <= 5430) return 'Percy Main';
    if (num >= 5300 && num <= 5309) return 'Riverside';
    if (num >= 5000 && num < 5500) return 'Consett';
    if (num >= 4000 && num < 4500) return 'Hexham';
    if (num >= 3000 && num < 3500) return 'Riverside';
    if (num >= 700 && num < 800) return 'Hexham'; // Solos
    
    return 'Unknown';
  },

  // Get bus type from fleet database
  getBusType: function(fleetNumber) {
    const fleetInfo = this.getFleetInfo(fleetNumber);
    return fleetInfo ? fleetInfo.busType : 'Unknown';
  },

  // Get registration number from fleet database
  getRegistration: function(fleetNumber) {
    const fleetInfo = this.getFleetInfo(fleetNumber);
    return fleetInfo ? fleetInfo.registration : 'Unknown';
  },

  // Get vehicle capacity
  getCapacity: function(fleetNumber) {
    const fleetInfo = this.getFleetInfo(fleetNumber);
    return fleetInfo ? fleetInfo.capacity : null;
  },

  // Get year of manufacture
  getYearOfManufacture: function(fleetNumber) {
    const fleetInfo = this.getFleetInfo(fleetNumber);
    return fleetInfo ? fleetInfo.yearOfManufacture : null;
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
        registration: this.getRegistration(responses.fleetNumber),
        bus_type: this.getBusType(responses.fleetNumber),
        depot: responses.depot || this.detectDepot(responses.fleetNumber),
        capacity: this.getCapacity(responses.fleetNumber),
        year_of_manufacture: this.getYearOfManufacture(responses.fleetNumber),
        
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
        
        // Defect reporting reference if created
        defect_report_ref: responses.defectReportRef
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
  // Load fleet database first
  window.BreakdownAnalytics.loadFleetDatabase()
    .then(() => {
      console.log('Fleet database ready for breakdown guide');
    })
    .catch(console.error);

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