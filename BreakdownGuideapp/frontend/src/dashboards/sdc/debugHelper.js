// Debug helper to identify missing data in breakdowns
// Add this to your SDCDashboard to see what's actually coming through

export const debugBreakdownData = (breakdowns) => {
  console.log('🔍 === BREAKDOWN DATA DEBUG ===');
  
  breakdowns.forEach((breakdown, index) => {
    console.log(`\n📋 Breakdown #${index + 1}:`, {
      breakdown_id: breakdown.breakdown_id || 'MISSING',
      fleet_no: breakdown.fleet_no || 'MISSING',
      fleet_number: breakdown.fleet_number || 'MISSING',
      vehicle: breakdown.vehicle || 'MISSING',
      location: breakdown.location || 'MISSING',
      issue_type: breakdown.issue_type || 'MISSING',
      issue_category: breakdown.issue_category || 'MISSING',
      wizard_type: breakdown.wizard_type || 'MISSING',
      supervisor_name: breakdown.supervisor_name || 'MISSING',
      created_at: breakdown.created_at || 'MISSING',
      
      // Check all possible fleet fields
      all_fleet_fields: {
        fleet_no: breakdown.fleet_no,
        fleet_number: breakdown.fleet_number,
        fleetNo: breakdown.fleetNo,
        fleetNumber: breakdown.fleetNumber,
        vehicle_fleet: breakdown.vehicle?.fleet_number,
        vehicle_fleetNumber: breakdown.vehicle?.fleetNumber,
      },
      
      // Check session/local storage
      storage_check: {
        selectedVehicle: sessionStorage.getItem('selectedVehicle'),
        currentVehicle: sessionStorage.getItem('currentVehicle'),
        lastFleetNumber: localStorage.getItem('lastFleetNumber'),
      }
    });
  });
  
  console.log('\n❓ Key Questions:');
  console.log('1. Are fleet numbers coming from backend? Check "all_fleet_fields" above');
  console.log('2. Is vehicle data stored in session? Check "storage_check" above');
  console.log('3. Are assessments capturing fleet data? If all MISSING, they are not!');
  console.log('==========================\n');
};

// Function to check what's in session/local storage
export const checkStoredVehicleData = () => {
  console.log('🚗 === STORED VEHICLE DATA ===');
  
  // Check sessionStorage
  console.log('\n📦 SessionStorage:');
  for (let key in sessionStorage) {
    if (key.includes('vehicle') || key.includes('fleet') || key.includes('Vehicle')) {
      const value = sessionStorage.getItem(key);
      console.log(`  ${key}:`, value);
    }
  }
  
  // Check localStorage
  console.log('\n💾 LocalStorage:');
  for (let key in localStorage) {
    if (key.includes('vehicle') || key.includes('fleet') || key.includes('Vehicle') || key.includes('breakdown')) {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        console.log(`  ${key}:`, parsed);
      } catch {
        console.log(`  ${key}:`, value);
      }
    }
  }
  
  console.log('==========================\n');
};

// Function to manually set vehicle data (for testing)
export const setTestVehicleData = (fleetNumber) => {
  const testVehicle = {
    fleetNumber: fleetNumber,
    fleet_number: fleetNumber,
    registration: 'NK64 FNX',
    depot: 'Washington',
    type: 'Single Decker',
    selected_at: new Date().toISOString()
  };
  
  sessionStorage.setItem('selectedVehicle', JSON.stringify(testVehicle));
  sessionStorage.setItem('selectedFleetNumber', fleetNumber);
  localStorage.setItem('lastFleetNumber', fleetNumber);
  
  console.log(`✅ Test vehicle ${fleetNumber} set in storage`);
};

export default {
  debugBreakdownData,
  checkStoredVehicleData,
  setTestVehicleData
};
