// services/incidentEnhancementService.js
// Enhance incidents with confidence-scored route matching
import { enhancedRouteMatchWithConfidence } from './enhancedRouteConfidence.js';

/**
 * Enhance an incident with detailed route matching
 */
export async function enhanceIncidentWithRouteConfidence(incident) {
  try {
    // Get coordinates
    const coords = incident.coordinates || incident.location?.coordinates;
    if (!coords || coords.length < 2) {
      console.warn('No coordinates for incident enhancement');
      return incident;
    }

    const [lat, lng] = coords;
    
    // Perform enhanced route matching
    const routeResults = await enhancedRouteMatchWithConfidence(
      lat, 
      lng, 
      incident.location || incident.title,
      {
        radius: 300,
        timestamp: new Date(incident.startTime || incident.createdAt),
        includeInactive: false
      }
    );

    // Extract high-confidence routes
    const highConfidenceRoutes = routeResults.matches
      .filter(m => m.confidence >= 0.7)
      .map(m => ({
        route: m.route,
        confidence: m.confidence,
        matchType: m.matchType,
        distance: m.distance
      }));

    const mediumConfidenceRoutes = routeResults.matches
      .filter(m => m.confidence >= 0.5 && m.confidence < 0.7)
      .map(m => ({
        route: m.route,
        confidence: m.confidence,
        matchType: m.matchType,
        distance: m.distance
      }));

    // Enhance the incident
    const enhanced = {
      ...incident,
      routeMatching: {
        method: 'Enhanced Confidence Scoring',
        timestamp: new Date().toISOString(),
        highConfidence: highConfidenceRoutes,
        mediumConfidence: mediumConfidenceRoutes,
        allMatches: routeResults.matches,
        summary: {
          totalMatches: routeResults.matches.length,
          highConfidenceCount: highConfidenceRoutes.length,
          averageConfidence: calculateAverageConfidence(routeResults.matches)
        }
      },
      multiModalImpacts: routeResults.multiModalImpacts,
      serviceContext: {
        serviceType: routeResults.serviceType,
        activeRoutesAtTime: routeResults.activeRoutesCount
      },
      // Update main affected routes with high confidence ones
      affectsRoutes: highConfidenceRoutes.map(r => r.route),
      // Keep all matches for reference
      allPossibleRoutes: routeResults.matches.map(m => ({
        route: m.route,
        confidence: `${Math.round(m.confidence * 100)}%`
      }))
    };

    // Add severity adjustment based on multi-modal impacts
    if (routeResults.multiModalImpacts.hasMultiModalImpact) {
      enhanced.severityFactors = enhanced.severityFactors || [];
      enhanced.severityFactors.push({
        factor: 'multi_modal_impact',
        description: 'Affects metro/ferry connections',
        severityIncrease: 1,
        details: {
          metroStations: routeResults.multiModalImpacts.metro.length,
          ferryTerminals: routeResults.multiModalImpacts.ferry.length,
          interchanges: routeResults.multiModalImpacts.interchanges.length
        }
      });
    }

    return enhanced;
  } catch (error) {
    console.error('Error enhancing incident with route confidence:', error);
    return incident; // Return original if enhancement fails
  }
}

/**
 * Create a route impact summary for display
 */
export function createRouteImpactSummary(incident) {
  if (!incident.routeMatching) {
    return {
      summary: 'No route matching data available',
      details: []
    };
  }

  const { highConfidence, mediumConfidence, multiModalImpacts } = incident.routeMatching;
  
  const summary = [];
  
  // High confidence routes
  if (highConfidence && highConfidence.length > 0) {
    summary.push({
      level: 'high',
      text: `Definitely affects: ${highConfidence.map(r => r.route).join(', ')}`,
      routes: highConfidence
    });
  }

  // Medium confidence routes
  if (mediumConfidence && mediumConfidence.length > 0) {
    summary.push({
      level: 'medium',
      text: `Likely affects: ${mediumConfidence.map(r => r.route).join(', ')}`,
      routes: mediumConfidence
    });
  }

  // Multi-modal impacts
  if (incident.multiModalImpacts?.hasMultiModalImpact) {
    const impacts = [];
    if (incident.multiModalImpacts.metro.length > 0) {
      impacts.push(`${incident.multiModalImpacts.metro.length} Metro stations`);
    }
    if (incident.multiModalImpacts.ferry.length > 0) {
      impacts.push(`${incident.multiModalImpacts.ferry.length} Ferry terminals`);
    }
    if (incident.multiModalImpacts.interchanges.length > 0) {
      impacts.push(`${incident.multiModalImpacts.interchanges.length} Bus interchanges`);
    }
    
    summary.push({
      level: 'multi_modal',
      text: `Multi-modal impact: ${impacts.join(', ')}`,
      cascadingRoutes: incident.multiModalImpacts.cascadingRoutes
    });
  }

  return {
    summary: summary.map(s => s.text).join(' | '),
    details: summary,
    hasHighConfidence: highConfidence && highConfidence.length > 0,
    hasMultiModalImpact: incident.multiModalImpacts?.hasMultiModalImpact || false
  };
}

// Helper function
function calculateAverageConfidence(matches) {
  if (!matches || matches.length === 0) return 0;
  const sum = matches.reduce((acc, m) => acc + m.confidence, 0);
  return sum / matches.length;
}

export default {
  enhanceIncidentWithRouteConfidence,
  createRouteImpactSummary
};
