/**
 * Clear Test Data Utility
 * Use this to clear old/corrupted breakdown data from localStorage
 */

export const clearAllBreakdownData = () => {
  console.log('🧹 Clearing all breakdown data from localStorage...');
  
  const keysToRemove = [];
  
  // Find all breakdown-related keys
  for (let key in localStorage) {
    if (key.startsWith('breakdown_') || 
        key.includes('sdc_') || 
        key === 'latest_breakdown_id' ||
        key === 'latestBreakdown') {
      keysToRemove.push(key);
    }
  }
  
  console.log(`🗑️ Found ${keysToRemove.length} keys to remove:`, keysToRemove);
  
  // Remove the keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
  });
  
  console.log('🎉 localStorage cleanup complete!');
  
  return keysToRemove.length;
};

export const clearSpecificBreakdown = (breakdownId) => {
  const key = `breakdown_${breakdownId}`;
  localStorage.removeItem(key);
  console.log(`✅ Removed specific breakdown: ${key}`);
};

export const listBreakdownData = () => {
  console.log('📋 Current breakdown data in localStorage:');
  
  const breakdownKeys = [];
  for (let key in localStorage) {
    if (key.startsWith('breakdown_')) {
      breakdownKeys.push(key);
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`🔍 ${key}:`, {
          breakdown_id: data.breakdown_id,
          fleet_no: data.fleet_no,
          fleet_number: data.fleet_number,
          created_at: data.created_at
        });
      } catch (error) {
        console.log(`❌ ${key}: Invalid JSON`);
      }
    }
  }
  
  if (breakdownKeys.length === 0) {
    console.log('✨ No breakdown data found in localStorage');
  }
  
  return breakdownKeys;
};

// Auto-clear function for corrupted data
export const clearCorruptedData = () => {
  console.log('🔧 Checking for corrupted breakdown data...');
  
  let clearedCount = 0;
  
  for (let key in localStorage) {
    if (key.startsWith('breakdown_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        
        // Check for invalid fleet numbers (like coordinates)
        const fleetFields = [data.fleet_no, data.fleet_number, data.fleetNumber];
        const hasInvalidFleetNumber = fleetFields.some(field => 
          field && typeof field === 'string' && 
          (field.length > 6 || field.includes('.') || !/^\d+$/.test(field))
        );
        
        if (hasInvalidFleetNumber) {
          console.log(`🗑️ Removing corrupted breakdown with invalid fleet number:`, key, fleetFields);
          localStorage.removeItem(key);
          clearedCount++;
        }
      } catch (error) {
        console.log(`🗑️ Removing breakdown with invalid JSON:`, key);
        localStorage.removeItem(key);
        clearedCount++;
      }
    }
  }
  
  console.log(`🎉 Cleared ${clearedCount} corrupted breakdown records`);
  return clearedCount;
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  window.clearAllBreakdownData = clearAllBreakdownData;
  window.clearSpecificBreakdown = clearSpecificBreakdown;
  window.listBreakdownData = listBreakdownData;
  window.clearCorruptedData = clearCorruptedData;
}

export default {
  clearAllBreakdownData,
  clearSpecificBreakdown,
  listBreakdownData,
  clearCorruptedData
};