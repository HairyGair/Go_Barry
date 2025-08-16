// utils/alerts.js
// Alert utility functions

// Check if an alert affects a GTFS route
export function alertAffectsGTFSRoute(alert, route) {
  if (!alert || !route) return false;
  
  // Check if the alert explicitly lists affected routes
  if (alert.affectsRoutes && Array.isArray(alert.affectsRoutes)) {
    return alert.affectsRoutes.includes(route);
  }
  
  // Check if the alert location mentions the route
  const location = (alert.location || '').toLowerCase();
  const description = (alert.description || '').toLowerCase();
  const routeLower = route.toLowerCase();
  
  return location.includes(routeLower) || description.includes(routeLower);
}

// Classify alert type based on content
export function classifyAlert(alert) {
  if (!alert) return 'unknown';
  
  const text = `${alert.title || ''} ${alert.description || ''}`.toLowerCase();
  
  // Roadwork patterns
  if (text.includes('roadwork') || text.includes('construction') || 
      text.includes('road works') || text.includes('maintenance')) {
    return 'roadwork';
  }
  
  // Incident patterns
  if (text.includes('accident') || text.includes('breakdown') || 
      text.includes('collision') || text.includes('incident')) {
    return 'incident';
  }
  
  // Congestion patterns
  if (text.includes('congestion') || text.includes('slow traffic') || 
      text.includes('heavy traffic') || text.includes('delays')) {
    return 'congestion';
  }
  
  return alert.type || 'incident';
}

// Remove duplicate alerts based on location and description similarity
export function deduplicateAlerts(alerts) {
  if (!Array.isArray(alerts)) return [];
  
  const seen = new Set();
  const deduplicated = [];
  
  for (const alert of alerts) {
    // Create a simple key based on location and type
    const key = `${alert.location || 'unknown'}_${alert.type || 'incident'}`.toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(alert);
    }
  }
  
  return deduplicated;
}

export default {
  alertAffectsGTFSRoute,
  classifyAlert,
  deduplicateAlerts
};
