// backend/services/alertCategorizer.js
// Categorize traffic alerts into roadworks vs incidents

export function categorizeAlert(alert) {
  const title = (alert.title || '').toLowerCase();
  const description = (alert.description || '').toLowerCase();
  const type = (alert.type || '').toLowerCase();
  const category = (alert.category || '').toLowerCase();
  
  // Check for roadwork indicators
  const roadworkIndicators = [
    'roadwork', 'road work', 'road works', 'construction',
    'maintenance', 'resurfacing', 'repairs', 'closure',
    'closed', 'blocked', 'obstruction', 'lane closure',
    'bridge work', 'utility work', 'gas work', 'water main'
  ];
  
  // Check for incident indicators
  const incidentIndicators = [
    'accident', 'collision', 'crash', 'incident',
    'breakdown', 'broken down', 'traffic', 'congestion',
    'delay', 'slow', 'queue', 'hazard', 'debris',
    'vehicle fire', 'spillage', 'emergency'
  ];
  
  // Check icon category for TomTom alerts
  if (alert.iconCategory) {
    // TomTom icon categories:
    // 6, 7, 10, 11 = roadworks
    // 1, 2, 4, 5, 9, 14 = incidents
    if ([6, 7, 10, 11].includes(alert.iconCategory)) {
      return 'roadwork';
    }
    if ([1, 2, 4, 5, 9, 14].includes(alert.iconCategory)) {
      return 'incident';
    }
  }
  
  // Check explicit type/category
  if (type === 'roadwork' || category === 'roadwork') {
    return 'roadwork';
  }
  if (type === 'incident' || category === 'incident') {
    return 'incident';
  }
  
  // Check text content
  const combinedText = `${title} ${description}`.toLowerCase();
  
  const hasRoadworkIndicator = roadworkIndicators.some(indicator => 
    combinedText.includes(indicator)
  );
  
  const hasIncidentIndicator = incidentIndicators.some(indicator => 
    combinedText.includes(indicator)
  );
  
  // If both or neither, use priority rules
  if (hasRoadworkIndicator && !hasIncidentIndicator) {
    return 'roadwork';
  }
  if (hasIncidentIndicator && !hasRoadworkIndicator) {
    return 'incident';
  }
  
  // Default based on source
  if (alert.source === 'national_highways' && combinedText.includes('planned')) {
    return 'roadwork';
  }
  
  // Default to incident for congestion/traffic
  return 'incident';
}

export function enhanceAlertWithCategory(alert) {
  const alertCategory = categorizeAlert(alert);
  return {
    ...alert,
    alertCategory, // Add explicit category
    isRoadwork: alertCategory === 'roadwork',
    isIncident: alertCategory === 'incident'
  };
}
