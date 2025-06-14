// backend/services/duplicateDetectionManager.js
// Intelligent duplicate detection across multiple traffic data sources

class DuplicateDetectionManager {
  constructor() {
    this.seenIncidents = new Map(); // Cache of processed incidents
    this.duplicateThresholds = {
      geographic: 100,        // 100 meters for same location
      textSimilarity: 0.7,    // 70% text similarity
      timeWindow: 900000,     // 15 minutes (900 seconds)
      coordinatePrecision: 4  // 4 decimal places (~11m precision)
    };
    this.mergeStrategies = {
      sourceReliability: {
        'national_highways': 1.0,    // Government data - highest reliability
        'tomtom': 0.9,              // Commercial API - high reliability
        'here': 0.85,               // Commercial API - high reliability  
        'streetmanager': 0.95,      // Official UK roadworks - very high
        'mapquest': 0.75,           // Commercial API - medium-high
        'manual_incidents': 0.8     // Manual entry - depends on supervisor
      }
    };
  }

  // Main duplicate detection and deduplication method
  processIncidents(incidents) {
    console.log(`🔍 Processing ${incidents.length} incidents for duplicates...`);
    
    const startTime = Date.now();
    const deduplicated = [];
    const duplicatesFound = [];
    const mergedIncidents = [];

    // First pass: group potential duplicates
    const potentialGroups = this.groupPotentialDuplicates(incidents);
    
    // Second pass: process each group
    for (const group of potentialGroups) {
      if (group.length === 1) {
        // No duplicates, add as-is
        deduplicated.push(this.enhanceIncident(group[0]));
      } else {
        // Multiple potential duplicates, merge them
        const merged = this.mergeIncidentGroup(group);
        deduplicated.push(merged);
        duplicatesFound.push(...group.slice(1)); // Track removed duplicates
        mergedIncidents.push({
          mergedIncident: merged,
          sourceIncidents: group,
          mergeReason: this.getMergeReason(group)
        });
      }
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Duplicate detection complete: ${incidents.length} → ${deduplicated.length} incidents`);
    console.log(`   📊 Found ${duplicatesFound.length} duplicates, created ${mergedIncidents.length} merged incidents`);
    console.log(`   ⏱️ Processing time: ${processingTime}ms`);

    return {
      deduplicated,
      duplicatesFound,
      mergedIncidents,
      stats: {
        original: incidents.length,
        final: deduplicated.length,
        duplicatesRemoved: duplicatesFound.length,
        mergedGroups: mergedIncidents.length,
        processingTime: `${processingTime}ms`,
        compressionRatio: `${((1 - deduplicated.length / incidents.length) * 100).toFixed(1)}%`
      }
    };
  }

  // Group incidents that are likely duplicates
  groupPotentialDuplicates(incidents) {
    const groups = [];
    const processed = new Set();

    for (let i = 0; i < incidents.length; i++) {
      if (processed.has(i)) continue;

      const group = [incidents[i]];
      processed.add(i);

      // Find all incidents that might be duplicates of this one
      for (let j = i + 1; j < incidents.length; j++) {
        if (processed.has(j)) continue;

        if (this.arePotentialDuplicates(incidents[i], incidents[j])) {
          group.push(incidents[j]);
          processed.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  // Check if two incidents are potential duplicates
  arePotentialDuplicates(incident1, incident2) {
    // Check geographic proximity
    const geoMatch = this.checkGeographicProximity(incident1, incident2);
    
    // Check text similarity
    const textMatch = this.checkTextSimilarity(incident1, incident2);
    
    // Check time proximity
    const timeMatch = this.checkTimeProximity(incident1, incident2);
    
    // Require at least 2 out of 3 matches for potential duplicate
    const matchCount = [geoMatch, textMatch, timeMatch].filter(Boolean).length;
    
    return matchCount >= 2;
  }

  // Check if incidents are geographically close
  checkGeographicProximity(incident1, incident2) {
    const coords1 = this.extractCoordinates(incident1);
    const coords2 = this.extractCoordinates(incident2);
    
    if (!coords1 || !coords2) return false;
    
    const distance = this.calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
    return distance <= this.duplicateThresholds.geographic;
  }

  // Extract coordinates from incident (handling different formats)
  extractCoordinates(incident) {
    // Handle different coordinate formats
    if (incident.coordinates && Array.isArray(incident.coordinates) && incident.coordinates.length === 2) {
      return { lat: incident.coordinates[0], lng: incident.coordinates[1] };
    }
    
    if (incident.geometry && incident.geometry.coordinates) {
      const coords = incident.geometry.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        return { lat: coords[1], lng: coords[0] }; // GeoJSON format [lng, lat]
      }
    }
    
    if (incident.lat && incident.lng) {
      return { lat: incident.lat, lng: incident.lng };
    }
    
    if (incident.latitude && incident.longitude) {
      return { lat: incident.latitude, lng: incident.longitude };
    }
    
    return null;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Check text similarity between incidents
  checkTextSimilarity(incident1, incident2) {
    const text1 = this.normalizeText(incident1.title || incident1.description || '');
    const text2 = this.normalizeText(incident2.title || incident2.description || '');
    
    if (text1.length === 0 || text2.length === 0) return false;
    
    const similarity = this.calculateTextSimilarity(text1, text2);
    return similarity >= this.duplicateThresholds.textSimilarity;
  }

  // Normalize text for comparison
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Calculate text similarity using Jaccard index
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' ').filter(w => w.length > 2));
    const words2 = new Set(text2.split(' ').filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Check if incidents are close in time
  checkTimeProximity(incident1, incident2) {
    const time1 = this.extractTimestamp(incident1);
    const time2 = this.extractTimestamp(incident2);
    
    if (!time1 || !time2) return true; // If no timestamps, assume time match
    
    const timeDiff = Math.abs(time1.getTime() - time2.getTime());
    return timeDiff <= this.duplicateThresholds.timeWindow;
  }

  // Extract timestamp from incident
  extractTimestamp(incident) {
    const timeFields = ['timestamp', 'createdAt', 'reportedAt', 'lastUpdated', 'created'];
    
    for (const field of timeFields) {
      if (incident[field]) {
        const date = new Date(incident[field]);
        if (!isNaN(date.getTime())) return date;
      }
    }
    
    return null;
  }

  // Merge a group of duplicate incidents into one
  mergeIncidentGroup(incidents) {
    // Sort by source reliability (highest first)
    const sortedIncidents = incidents.sort((a, b) => {
      const reliabilityA = this.mergeStrategies.sourceReliability[a.source] || 0.5;
      const reliabilityB = this.mergeStrategies.sourceReliability[b.source] || 0.5;
      return reliabilityB - reliabilityA;
    });

    const primary = sortedIncidents[0]; // Most reliable source as primary
    const merged = { ...primary };

    // Merge data from all sources
    merged.sources = incidents.map(inc => inc.source);
    merged.sourceData = incidents.map(inc => ({
      source: inc.source,
      originalId: inc.id,
      title: inc.title,
      coordinates: this.extractCoordinates(inc)
    }));

    // Use best available data for each field
    merged.title = this.selectBestTitle(incidents);
    merged.location = this.selectBestLocation(incidents);
    merged.description = this.selectBestDescription(incidents);
    merged.coordinates = this.selectBestCoordinates(incidents);
    merged.severity = this.selectBestSeverity(incidents);
    merged.affectsRoutes = this.mergeAffectedRoutes(incidents);

    // Add merge metadata
    merged.merged = true;
    merged.mergeTimestamp = new Date().toISOString();
    merged.mergeStrategy = 'reliability_based';
    merged.sourceReliabilities = incidents.map(inc => ({
      source: inc.source,
      reliability: this.mergeStrategies.sourceReliability[inc.source] || 0.5
    }));

    // Generate new ID based on merged sources
    merged.id = `merged-${incidents.map(inc => inc.source).sort().join('-')}-${Date.now()}`;

    return merged;
  }

  // Select best title from all incidents
  selectBestTitle(incidents) {
    // Prefer longer, more descriptive titles from reliable sources
    return incidents
      .filter(inc => inc.title && inc.title.trim().length > 0)
      .sort((a, b) => {
        const reliabilityDiff = (this.mergeStrategies.sourceReliability[b.source] || 0.5) - 
                               (this.mergeStrategies.sourceReliability[a.source] || 0.5);
        if (Math.abs(reliabilityDiff) > 0.1) return reliabilityDiff > 0 ? 1 : -1;
        return (b.title?.length || 0) - (a.title?.length || 0);
      })[0]?.title || 'Traffic Incident';
  }

  // Select best location from all incidents
  selectBestLocation(incidents) {
    return incidents
      .filter(inc => inc.location && inc.location.trim().length > 0)
      .sort((a, b) => {
        const reliabilityDiff = (this.mergeStrategies.sourceReliability[b.source] || 0.5) - 
                               (this.mergeStrategies.sourceReliability[a.source] || 0.5);
        if (Math.abs(reliabilityDiff) > 0.1) return reliabilityDiff > 0 ? 1 : -1;
        return (b.location?.length || 0) - (a.location?.length || 0);
      })[0]?.location || 'Location not specified';
  }

  // Select best description from all incidents
  selectBestDescription(incidents) {
    const descriptions = incidents
      .filter(inc => inc.description && inc.description.trim().length > 0)
      .sort((a, b) => {
        const reliabilityDiff = (this.mergeStrategies.sourceReliability[b.source] || 0.5) - 
                               (this.mergeStrategies.sourceReliability[a.source] || 0.5);
        if (Math.abs(reliabilityDiff) > 0.1) return reliabilityDiff > 0 ? 1 : -1;
        return (b.description?.length || 0) - (a.description?.length || 0);
      });

    if (descriptions.length === 0) return null;
    if (descriptions.length === 1) return descriptions[0].description;

    // Combine unique information from multiple descriptions
    const combinedDescription = descriptions[0].description;
    // Could add more sophisticated merging logic here
    return combinedDescription;
  }

  // Select best coordinates from all incidents
  selectBestCoordinates(incidents) {
    const coordsWithReliability = incidents
      .map(inc => ({
        coords: this.extractCoordinates(inc),
        reliability: this.mergeStrategies.sourceReliability[inc.source] || 0.5,
        source: inc.source
      }))
      .filter(item => item.coords)
      .sort((a, b) => b.reliability - a.reliability);

    if (coordsWithReliability.length === 0) return null;

    // Use most reliable coordinates
    const best = coordsWithReliability[0];
    return [best.coords.lat, best.coords.lng];
  }

  // Select best severity from all incidents
  selectBestSeverity(incidents) {
    const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    return incidents
      .filter(inc => inc.severity)
      .sort((a, b) => {
        const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        if (severityDiff !== 0) return severityDiff;
        
        const reliabilityDiff = (this.mergeStrategies.sourceReliability[b.source] || 0.5) - 
                               (this.mergeStrategies.sourceReliability[a.source] || 0.5);
        return reliabilityDiff;
      })[0]?.severity || 'Medium';
  }

  // Merge affected routes from all incidents
  mergeAffectedRoutes(incidents) {
    const allRoutes = new Set();
    
    incidents.forEach(inc => {
      if (inc.affectsRoutes && Array.isArray(inc.affectsRoutes)) {
        inc.affectsRoutes.forEach(route => allRoutes.add(route));
      }
    });
    
    return Array.from(allRoutes).sort();
  }

  // Get merge reason for logging
  getMergeReason(incidents) {
    const reasons = [];
    
    if (incidents.length > 1) {
      const geoProximity = this.checkGeographicProximity(incidents[0], incidents[1]);
      const textSimilarity = this.checkTextSimilarity(incidents[0], incidents[1]);
      const timeProximity = this.checkTimeProximity(incidents[0], incidents[1]);
      
      if (geoProximity) reasons.push('geographic proximity');
      if (textSimilarity) reasons.push('text similarity');
      if (timeProximity) reasons.push('time proximity');
    }
    
    return reasons.join(', ') || 'multiple criteria';
  }

  // Enhance individual incident (non-duplicate)
  enhanceIncident(incident) {
    return {
      ...incident,
      merged: false,
      processed: true,
      processingTimestamp: new Date().toISOString()
    };
  }

  // Get duplicate detection statistics
  getStatistics() {
    return {
      thresholds: this.duplicateThresholds,
      sourceReliabilities: this.mergeStrategies.sourceReliability,
      cacheSize: this.seenIncidents.size,
      lastReset: new Date().toISOString()
    };
  }

  // Clear cache (for testing or memory management)
  clearCache() {
    this.seenIncidents.clear();
    console.log('🧹 Duplicate detection cache cleared');
  }
}

// Create singleton instance
const duplicateDetectionManager = new DuplicateDetectionManager();

export default duplicateDetectionManager;
