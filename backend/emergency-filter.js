// Emergency sample data removal patch
// Add this to the top of routes/api-improved.js

// EMERGENCY: Force remove all sample data patterns
function forceRemoveSampleData(alerts) {
  if (!Array.isArray(alerts)) return [];
  
  const filtered = alerts.filter(alert => {
    if (!alert || typeof alert !== 'object') return false;
    
    const id = (alert.id || '').toString().toLowerCase();
    const source = (alert.source || '').toString().toLowerCase();
    const title = (alert.title || '').toString().toLowerCase();
    
    // AGGRESSIVE: Remove ALL sample patterns
    const isSampleData = (
      id.includes('barry') ||
      id.includes('sample') ||
      id.includes('test') ||
      id.includes('demo') ||
      id.includes('v3') ||
      source.includes('barry') ||
      source.includes('v3') ||
      source === 'go_barry_v3' ||
      alert.enhanced === true ||
      title.includes('sample') ||
      title.includes('test')
    );
    
    if (isSampleData) {
      console.log(`🗑️ EMERGENCY: Removed sample alert: ${id} (source: ${source})`);
      return false;
    }
    
    return true;
  });
  
  console.log(`🚨 EMERGENCY FILTER: ${alerts.length} → ${filtered.length} alerts`);
  return filtered;
}

export { forceRemoveSampleData };