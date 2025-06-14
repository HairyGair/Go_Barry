// backend/utils/alertDeduplication.js
// Advanced Alert Deduplication and Age Management

import crypto from 'crypto';

// Generate consistent hash for alert identification
export function generateAlertHash(alert) {
  // Create a consistent identifier based on location and content
  const locationKey = alert.location ? alert.location.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const titleKey = alert.title ? alert.title.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const descriptionKey = alert.description ? alert.description.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  
  // Use coordinates if available for more precise deduplication
  let coordKey = '';
  if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
    const lat = Math.round(alert.coordinates[0] * 1000) / 1000; // Round to ~100m precision
    const lng = Math.round(alert.coordinates[1] * 1000) / 1000;
    coordKey = `${lat}-${lng}`;
  }
  
  // For TomTom alerts with identical locations, use source-specific deduplication
  let sourceKey = alert.source || 'unknown';
  
  // AGGRESSIVE DEDUPLICATION: If location is very specific (like "Westerhope, Newcastle upon Tyne")
  // and from same source, consider it the same incident regardless of title variations
  if (locationKey.length > 15 && (titleKey.includes('traffic') || titleKey.includes('road') || titleKey.includes('incident'))) {
    // Use only location + source for highly specific locations
    const hashInput = `${locationKey}-${sourceKey}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }
  
  // Standard hash for other cases
  const hashInput = `${locationKey}-${titleKey}-${descriptionKey}-${coordKey}-${sourceKey}`;
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

// Check if alert is too old and should be expired
export function isAlertExpired(alert, maxAgeHours = 4) {
  if (!alert.timestamp && !alert.lastUpdated && !alert.startDate) {
    // If no timestamp, assume it's new
    return false;
  }
  
  const alertTime = new Date(alert.timestamp || alert.lastUpdated || alert.startDate);
  const now = new Date();
  const ageHours = (now - alertTime) / (1000 * 60 * 60);
  
  // Different expiry rules based on severity
  let maxAge = maxAgeHours;
  if (alert.severity === 'Low') {
    maxAge = 2; // Low severity expires after 2 hours
  } else if (alert.severity === 'High') {
    maxAge = 8; // High severity lasts longer
  }
  
  return ageHours > maxAge;
}

// Advanced deduplication with time-based logic
export function deduplicateAlerts(alerts, requestId) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return [];
  }
  
  console.log(`🔍 [${requestId}] Advanced deduplication starting with ${alerts.length} alerts`);
  
  const alertMap = new Map();
  const now = new Date();
  
  for (const alert of alerts) {
    if (!alert || typeof alert !== 'object') continue;
    
    // Skip test alerts
    const alertId = (alert.id || '').toString().toLowerCase();
    const title = (alert.title || '').toString().toLowerCase();
    if (alertId.includes('test') || title.includes('test')) {
      console.log(`🗑️ [${requestId}] Skipping test alert: ${alertId}`);
      continue;
    }
    
    // Check if alert is expired
    if (isAlertExpired(alert)) {
      console.log(`⏰ [${requestId}] Expired alert: ${alert.location} (age > limit)`);
      continue;
    }
    
    // Generate consistent hash
    const hash = generateAlertHash(alert);
    
    if (alertMap.has(hash)) {
      // Duplicate found - choose the best one
      const existing = alertMap.get(hash);
      
      // Preference: newer timestamp, higher severity, better source
      const sourcePreference = { 
        tomtom: 4, 
        here: 3, 
        national_highways: 2, 
        mapquest: 1,
        manual_incident: 5 // Manual incidents have highest priority
      };
      
      const currentPref = sourcePreference[alert.source] || 0;
      const existingPref = sourcePreference[existing.source] || 0;
      
      // Compare timestamps
      const currentTime = new Date(alert.timestamp || alert.lastUpdated || alert.startDate || now);
      const existingTime = new Date(existing.timestamp || existing.lastUpdated || existing.startDate || now);
      
      // Keep the better alert
      if (currentPref > existingPref || 
          (currentPref === existingPref && currentTime > existingTime)) {
        alertMap.set(hash, alert);
        console.log(`🔄 [${requestId}] Replaced duplicate: ${alert.location} (better source/time)`);
      } else {
        console.log(`🔄 [${requestId}] Kept existing: ${existing.location} (better quality)`);
      }
    } else {
      alertMap.set(hash, alert);
    }
  }
  
  const deduplicated = Array.from(alertMap.values());
  
  console.log(`✅ [${requestId}] Advanced deduplication: ${alerts.length} → ${deduplicated.length} alerts`);
  
  return deduplicated;
}

// Clean up old dismissed alerts (run periodically)
export function cleanupExpiredDismissals(dismissedAlerts, maxAgeHours = 48) {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [alertId, dismissal] of dismissedAlerts.entries()) {
    if (dismissal.dismissedAt) {
      const dismissalTime = new Date(dismissal.dismissedAt);
      const ageHours = (now - dismissalTime) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        dismissedAlerts.delete(alertId);
        cleanedCount++;
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired dismissals (older than ${maxAgeHours}h)`);
  }
  
  return cleanedCount;
}

// Smart location-based deduplication for similar locations
export function isLocationSimilar(location1, location2, threshold = 0.8) {
  if (!location1 || !location2) return false;
  
  const loc1 = location1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const loc2 = location2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  // Simple similarity check based on common words
  const words1 = new Set(loc1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(loc2.split(' ').filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const similarity = intersection.size / union.size;
  return similarity >= threshold;
}

export default {
  generateAlertHash,
  isAlertExpired,
  deduplicateAlerts,
  cleanupExpiredDismissals,
  isLocationSimilar
};
