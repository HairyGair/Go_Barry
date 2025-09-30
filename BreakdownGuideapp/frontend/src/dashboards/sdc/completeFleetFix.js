// Complete fix for fleet number data flow
// This ensures fleet numbers are captured and passed to SDC Dashboard correctly

// ============================================
// STEP 1: CAPTURE FLEET NUMBER IN VEHICLE SELECTION
// ============================================
// In FleetSelectionModal.jsx, when a vehicle is selected:

export const fixFleetSelection = () => {
  // Find the vehicle selection handler in FleetSelectionModal
  // It should look something like this:
  const handleVehicleSelect = (vehicle) => {
    // CRITICAL: Store the vehicle data properly
    const vehicleData = {
      fleetNumber: vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no,
      fleet_number: vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no,
      fleet_no: vehicle.fleetNumber || vehicle.fleet_number || vehicle.fleet_no,
      registration: vehicle.regNo || vehicle.registration,
      depot: vehicle.depot,
      type: vehicle.vehicleType || vehicle.type,
      selected_at: new Date().toISOString()
    };
    
    // Store in multiple locations to ensure availability
    sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicleData));
    sessionStorage.setItem('selectedFleetNumber', vehicleData.fleetNumber);
    localStorage.setItem('lastSelectedVehicle', JSON.stringify(vehicleData));
    localStorage.setItem('lastFleetNumber', vehicleData.fleetNumber);
    
    console.log('✅ Fleet number stored:', vehicleData.fleetNumber);
  };
};

// ============================================
// STEP 2: PASS FLEET NUMBER TO ASSESSMENT
// ============================================
// When starting/completing an assessment:

export const fixAssessmentCompletion = () => {
  // In your wizard completion handler:
  const handleWizardComplete = (decision, notes) => {
    // Get the stored vehicle data
    const storedVehicle = JSON.parse(sessionStorage.getItem('selectedVehicle') || '{}');
    const fleetNumber = storedVehicle.fleetNumber || 
                       sessionStorage.getItem('selectedFleetNumber') ||
                       localStorage.getItem('lastFleetNumber') ||
                       'Unknown';
    
    // Build complete breakdown data
    const breakdownData = {
      breakdown_id: `BD-${Date.now()}`,
      
      // CRITICAL: Include all fleet fields
      fleet_no: fleetNumber,
      fleet_number: fleetNumber,
      fleetNumber: fleetNumber,
      
      // Include vehicle object for compatibility
      vehicle: {
        fleetNumber: fleetNumber,
        fleet_number: fleetNumber,
        fleet_no: fleetNumber,
        registration: storedVehicle.registration,
        depot: storedVehicle.depot
      },
      
      // Other data
      location: sessionStorage.getItem('currentLocation') || 'Unknown',
      issue_type: 'Steering', // Use actual wizard type
      severity: decision,
      wizard_decision: decision,
      supervisor_name: 'Anthony Gair', // Get from login
      created_at: new Date().toISOString()
    };
    
    // Store locally for SDC Dashboard
    localStorage.setItem(`breakdown_${breakdownData.breakdown_id}`, JSON.stringify(breakdownData));
    localStorage.setItem('latestBreakdown', JSON.stringify(breakdownData));
    
    console.log('✅ Breakdown created with fleet:', fleetNumber);
    
    // Send to backend
    sendToBackend(breakdownData);
  };
};

// ============================================
// STEP 3: FIX SDC DASHBOARD DATA FETCHING
// ============================================
// In SDCDashboard.jsx fetchBreakdowns function:

export const fixSDCDashboardFetch = () => {
  const fetchBreakdowns = async () => {
    try {
      // Try backend first
      const response = await fetch('/api/sdc/live');
      let breakdowns = [];
      
      if (response.ok) {
        const data = await response.json();
        breakdowns = data.breakdowns || [];
      }
      
      // If no backend data or missing fleet numbers, check local storage
      if (breakdowns.length === 0 || breakdowns.some(b => !b.fleet_no)) {
        // Get breakdowns from local storage
        const localBreakdowns = [];
        
        for (let key in localStorage) {
          if (key.startsWith('breakdown_')) {
            try {
              const breakdown = JSON.parse(localStorage.getItem(key));
              localBreakdowns.push(breakdown);
            } catch (e) {
              console.error('Error parsing breakdown:', e);
            }
          }
        }
        
        // Merge with backend data (local takes priority for fleet numbers)
        breakdowns = breakdowns.map(backendBreakdown => {
          const localMatch = localBreakdowns.find(
            local => local.breakdown_id === backendBreakdown.breakdown_id
          );
          
          if (localMatch && localMatch.fleet_no && !backendBreakdown.fleet_no) {
            return { ...backendBreakdown, ...localMatch };
          }
          
          return backendBreakdown;
        });
        
        // Add any local-only breakdowns
        localBreakdowns.forEach(local => {
          if (!breakdowns.find(b => b.breakdown_id === local.breakdown_id)) {
            breakdowns.push(local);
          }
        });
      }
      
      // Ensure all breakdowns have fleet numbers
      breakdowns = breakdowns.map(breakdown => ({
        ...breakdown,
        fleet_no: breakdown.fleet_no || 
                 breakdown.fleet_number || 
                 breakdown.vehicle?.fleetNumber ||
                 'Unknown'
      }));
      
      console.log('📊 Breakdowns with fleet numbers:', breakdowns);
      
      return breakdowns;
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      return [];
    }
  };
};

// ============================================
// STEP 4: DEBUG HELPER
// ============================================
// Run this in browser console to check what's stored:

export const debugFleetData = () => {
  console.log('=== FLEET DATA DEBUG ===');
  
  // Check session storage
  console.log('\n📦 Session Storage:');
  const selectedVehicle = sessionStorage.getItem('selectedVehicle');
  const selectedFleetNumber = sessionStorage.getItem('selectedFleetNumber');
  console.log('selectedVehicle:', selectedVehicle ? JSON.parse(selectedVehicle) : 'NOT FOUND');
  console.log('selectedFleetNumber:', selectedFleetNumber || 'NOT FOUND');
  
  // Check local storage
  console.log('\n💾 Local Storage:');
  const lastVehicle = localStorage.getItem('lastSelectedVehicle');
  const lastFleetNumber = localStorage.getItem('lastFleetNumber');
  console.log('lastSelectedVehicle:', lastVehicle ? JSON.parse(lastVehicle) : 'NOT FOUND');
  console.log('lastFleetNumber:', lastFleetNumber || 'NOT FOUND');
  
  // Check breakdown data
  console.log('\n📋 Stored Breakdowns:');
  let breakdownCount = 0;
  for (let key in localStorage) {
    if (key.startsWith('breakdown_')) {
      breakdownCount++;
      const breakdown = JSON.parse(localStorage.getItem(key));
      console.log(`${key}:`, {
        fleet_no: breakdown.fleet_no || 'MISSING',
        fleet_number: breakdown.fleet_number || 'MISSING',
        vehicle: breakdown.vehicle || 'MISSING'
      });
    }
  }
  console.log(`Total breakdowns in storage: ${breakdownCount}`);
  
  console.log('\n❓ Diagnosis:');
  if (!selectedVehicle && !selectedFleetNumber) {
    console.log('❌ No vehicle selected - fleet selection not storing data');
  } else if (!lastFleetNumber) {
    console.log('⚠️ Vehicle selected but not persisted to localStorage');
  } else if (breakdownCount === 0) {
    console.log('⚠️ No breakdowns stored - assessments not completing properly');
  } else {
    console.log('✅ Data flow appears to be working');
  }
  
  console.log('========================\n');
};

// ============================================
// STEP 5: MANUAL FIX FOR TESTING
// ============================================
// Run this in console to manually set a fleet number:

export const manualSetFleet = (fleetNumber) => {
  const vehicleData = {
    fleetNumber: fleetNumber,
    fleet_number: fleetNumber,
    fleet_no: fleetNumber,
    registration: 'TEST REG',
    depot: 'Washington',
    type: 'Test Vehicle',
    selected_at: new Date().toISOString()
  };
  
  sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicleData));
  sessionStorage.setItem('selectedFleetNumber', fleetNumber);
  localStorage.setItem('lastSelectedVehicle', JSON.stringify(vehicleData));
  localStorage.setItem('lastFleetNumber', fleetNumber);
  
  console.log(`✅ Manually set fleet number to: ${fleetNumber}`);
  console.log('Refresh the SDC Dashboard to see the change');
};

// ============================================
// EXPORT FOR USE
// ============================================
window.fleetFix = {
  debug: debugFleetData,
  setFleet: manualSetFleet,
  fixSelection: fixFleetSelection,
  fixCompletion: fixAssessmentCompletion,
  fixDashboard: fixSDCDashboardFetch
};

console.log(`
🔧 Fleet Number Fix Loaded!
==========================
Run these in console:

1. Debug current state:
   fleetFix.debug()

2. Manually set fleet for testing:
   fleetFix.setFleet('5401')

3. Check if fixes are needed:
   - If debug shows no vehicle: Fix FleetSelectionModal
   - If debug shows no breakdowns: Fix assessment completion
   - If SDC shows "Unknown": Fix dashboard data fetching
`);

export default {
  fixFleetSelection,
  fixAssessmentCompletion,
  fixSDCDashboardFetch,
  debugFleetData,
  manualSetFleet
};
