/**
 * Diversion Auto-Suggest Service
 * Provides intelligent diversion suggestions based on historical data and geographic analysis
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';
import enhancedGTFSMatcher from './enhancedGTFSMatcher.js';
import { calculateDistance, findNearbyLocations } from '../utils/geoUtils.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Generate diversion suggestions for a roadwork location
 * @param {Object} roadworkLocation - {lat, lng, description}
 * @param {Array} affectedRoutes - Array of route IDs
 * @param {Object} options - Additional options
 * @returns {Object} Diversion suggestions with confidence scores
 */
export async function suggestDiversions(roadworkLocation, affectedRoutes = [], options = {}) {
  try {
    console.log('🔍 Generating diversion suggestions for:', roadworkLocation.description);
    
    const suggestions = [];
    const { radius = 500, maxSuggestions = 5 } = options;
    
    // 1. Check for historical diversions at this location
    const historicalSuggestions = await getHistoricalDiversions(roadworkLocation, radius);
    suggestions.push(...historicalSuggestions);
    
    // 2. Generate geographic proximity suggestions
    const proximitySuggestions = await getProximityDiversions(roadworkLocation, affectedRoutes, radius);
    suggestions.push(...proximitySuggestions);
    
    // 3. Generate GTFS-based route diversions
    const gtfsSuggestions = await getGTFSBasedDiversions(roadworkLocation, affectedRoutes);
    suggestions.push(...gtfsSuggestions);
    
    // 4. Check for pattern-based suggestions (similar street types, etc.)
    const patternSuggestions = await getPatternBasedDiversions(roadworkLocation, affectedRoutes);
    suggestions.push(...patternSuggestions);
    
    // Sort by confidence score and deduplicate
    const rankedSuggestions = rankAndDeduplicate(suggestions, maxSuggestions);
    
    console.log(`✅ Generated ${rankedSuggestions.length} diversion suggestions`);
    
    return {
      success: true,
      location: roadworkLocation,
      affectedRoutes,
      suggestions: rankedSuggestions,
      metadata: {
        totalSuggestions: suggestions.length,
        historicalCount: historicalSuggestions.length,
        proximityCount: proximitySuggestions.length,
        gtfsCount: gtfsSuggestions.length,
        patternCount: patternSuggestions.length
      }
    };
    
  } catch (error) {
    console.error('Error generating diversion suggestions:', error);
    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
}

/**
 * Get historical diversion suggestions based on previous successful diversions
 */
async function getHistoricalDiversions(location, radius) {
  try {
    const suggestions = [];
    
    // Create location hash for exact matches
    const locationHash = hashLocation(location.lat, location.lng, 100); // 100m precision
    
    // Query diversion templates table
    const { data: exactTemplates, error: exactError } = await supabase
      .from('diversion_templates')
      .select('*')
      .eq('location_hash', locationHash)
      .order('success_rating', { ascending: false })
      .limit(3);
    
    if (exactError) throw exactError;
    
    // Add exact location matches with high confidence
    (exactTemplates || []).forEach(template => {
      suggestions.push({
        type: 'historical_exact',
        confidence: Math.min(0.95, template.success_rating || 0.7),
        title: `Proven Diversion - ${template.route_description}`,
        description: template.diversion_details?.description || 'Previously successful diversion',
        diversion: {
          route: template.diversion_route,
          instructions: template.diversion_details?.instructions,
          estimatedDelay: template.diversion_details?.estimated_delay || 'Unknown',
          affectedStops: template.diversion_details?.affected_stops || []
        },
        metadata: {
          templateId: template.id,
          usageCount: template.usage_count || 0,
          lastUsed: template.last_used,
          successRating: template.success_rating,
          createdBy: template.created_by
        },
        source: 'historical_template'
      });
    });
    
    // Query for nearby historical diversions (within radius)
    const { data: nearbyTemplates, error: nearbyError } = await supabase
      .from('diversion_templates')
      .select('*, location_data')
      .neq('location_hash', locationHash) // Exclude exact matches we already got
      .order('success_rating', { ascending: false })
      .limit(20); // Get more to filter by distance
    
    if (nearbyError) throw nearbyError;
    
    // Filter by distance and add nearby matches
    (nearbyTemplates || []).forEach(template => {
      if (template.location_data?.lat && template.location_data?.lng) {
        const distance = calculateDistance(
          location.lat, location.lng,
          template.location_data.lat, template.location_data.lng
        );
        
        if (distance <= radius) {
          const proximityFactor = Math.max(0.1, 1 - (distance / radius));
          const confidence = (template.success_rating || 0.6) * proximityFactor;
          
          suggestions.push({
            type: 'historical_nearby',
            confidence: Math.min(0.85, confidence),
            title: `Similar Location - ${template.route_description}`,
            description: `Successful diversion ${Math.round(distance)}m away: ${template.diversion_details?.description || 'Similar roadwork diversion'}`,
            diversion: {
              route: template.diversion_route,
              instructions: template.diversion_details?.instructions,
              estimatedDelay: template.diversion_details?.estimated_delay || 'Unknown',
              affectedStops: template.diversion_details?.affected_stops || []
            },
            metadata: {
              templateId: template.id,
              distance: Math.round(distance),
              usageCount: template.usage_count || 0,
              successRating: template.success_rating,
              proximityFactor
            },
            source: 'historical_nearby'
          });
        }
      }
    });
    
    return suggestions;
    
  } catch (error) {
    console.error('Error getting historical diversions:', error);
    return [];
  }
}

/**
 * Get diversion suggestions based on geographic proximity to alternative routes
 */
async function getProximityDiversions(location, affectedRoutes, radius) {
  try {
    const suggestions = [];
    
    // Find alternative routes that don't pass through the affected area
    const nearbyRoutes = await enhancedGTFSMatcher.findNearbyRoutes(
      location.lat, 
      location.lng, 
      { radius: radius * 2, excludeRoutes: affectedRoutes }
    );
    
    // Analyze each nearby route for diversion potential
    for (const route of nearbyRoutes.slice(0, 5)) { // Limit to top 5 routes
      if (route.distance > 100) { // Must be at least 100m away to be useful
        const diversionPotential = await analyzeDiversionPotential(route, location, affectedRoutes);
        
        if (diversionPotential.viable) {
          suggestions.push({
            type: 'geographic_proximity',
            confidence: diversionPotential.confidence,
            title: `Alternative Route - ${route.routeShortName || route.routeId}`,
            description: `Route ${route.routeShortName || route.routeId} runs ${Math.round(route.distance)}m away and could serve as diversion`,
            diversion: {
              route: `Via Route ${route.routeShortName || route.routeId} corridor`,
              instructions: diversionPotential.instructions,
              estimatedDelay: diversionPotential.estimatedDelay,
              affectedStops: diversionPotential.affectedStops
            },
            metadata: {
              alternativeRoute: route.routeId,
              distance: Math.round(route.distance),
              viabilityScore: diversionPotential.viabilityScore,
              roadType: diversionPotential.roadType
            },
            source: 'proximity_analysis'
          });
        }
      }
    }
    
    return suggestions;
    
  } catch (error) {
    console.error('Error getting proximity diversions:', error);
    return [];
  }
}

/**
 * Generate GTFS-based route diversions by analyzing affected route shapes
 */
async function getGTFSBasedDiversions(location, affectedRoutes) {
  try {
    const suggestions = [];
    
    for (const routeId of affectedRoutes.slice(0, 3)) { // Limit to prevent overload
      try {
        // Get route shape and analyze impact
        const routeAnalysis = await enhancedGTFSMatcher.analyzeRouteImpact(
          routeId, 
          location.lat, 
          location.lng, 
          { radius: 200 }
        );
        
        if (routeAnalysis.impacted) {
          const diversion = await calculateRouteDetour(routeAnalysis, location);
          
          if (diversion) {
            suggestions.push({
              type: 'gtfs_calculated',
              confidence: diversion.confidence,
              title: `Route ${routeId} Diversion`,
              description: diversion.description,
              diversion: {
                route: diversion.route,
                instructions: diversion.instructions,
                estimatedDelay: diversion.estimatedDelay,
                affectedStops: diversion.affectedStops,
                alternativeStops: diversion.alternativeStops
              },
              metadata: {
                routeId: routeId,
                impactedSegments: routeAnalysis.impactedSegments,
                detourLength: diversion.detourLength,
                stopCount: diversion.affectedStops?.length || 0
              },
              source: 'gtfs_analysis'
            });
          }
        }
      } catch (routeError) {
        console.warn(`Error analyzing route ${routeId}:`, routeError.message);
      }
    }
    
    return suggestions;
    
  } catch (error) {
    console.error('Error getting GTFS diversions:', error);
    return [];
  }
}

/**
 * Get pattern-based diversion suggestions using ML/heuristics
 */
async function getPatternBasedDiversions(location, affectedRoutes) {
  try {
    const suggestions = [];
    
    // Analyze location characteristics
    const locationCharacteristics = await analyzeLocationCharacteristics(location);
    
    // Find similar locations that have successful diversions
    const { data: similarDiversions, error } = await supabase
      .from('diversion_templates')
      .select('*')
      .contains('location_characteristics', locationCharacteristics)
      .order('success_rating', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    (similarDiversions || []).forEach(template => {
      const similarityScore = calculateSimilarityScore(
        locationCharacteristics, 
        template.location_characteristics
      );
      
      if (similarityScore > 0.6) {
        suggestions.push({
          type: 'pattern_based',
          confidence: similarityScore * (template.success_rating || 0.7),
          title: `Pattern Match - ${template.route_description}`,
          description: `Similar location characteristics suggest this diversion pattern`,
          diversion: {
            route: template.diversion_route,
            instructions: template.diversion_details?.instructions,
            estimatedDelay: template.diversion_details?.estimated_delay,
            affectedStops: template.diversion_details?.affected_stops || []
          },
          metadata: {
            templateId: template.id,
            similarityScore,
            matchedCharacteristics: Object.keys(locationCharacteristics).filter(
              key => template.location_characteristics?.[key] === locationCharacteristics[key]
            )
          },
          source: 'pattern_matching'
        });
      }
    });
    
    return suggestions;
    
  } catch (error) {
    console.error('Error getting pattern-based diversions:', error);
    return [];
  }
}

/**
 * Create a location hash for grouping similar locations
 */
function hashLocation(lat, lng, precision = 100) {
  // Round coordinates to create location clusters
  const factor = 1 / (precision / 111320); // Convert meters to degrees approximately
  const roundedLat = Math.round(lat * factor) / factor;
  const roundedLng = Math.round(lng * factor) / factor;
  return `${roundedLat.toFixed(6)},${roundedLng.toFixed(6)}`;
}

/**
 * Analyze diversion potential for a route
 */
async function analyzeDiversionPotential(route, location, affectedRoutes) {
  try {
    // Calculate viability based on multiple factors
    let viabilityScore = 0.5; // Base score
    
    // Distance factor (closer = better, but not too close)
    const distanceFactor = route.distance > 100 && route.distance < 1000 ? 
      Math.max(0.2, 1 - (route.distance / 1000)) : 0.1;
    viabilityScore += distanceFactor * 0.3;
    
    // Route frequency factor (more frequent = better for diversions)
    const frequencyFactor = route.frequency ? Math.min(1, route.frequency / 10) : 0.5;
    viabilityScore += frequencyFactor * 0.2;
    
    // Route capacity factor (larger vehicles = better for absorbing extra passengers)
    const capacityFactor = route.routeType === 'bus' ? 0.8 : 0.6;
    viabilityScore += capacityFactor * 0.2;
    
    // Parallel route factor (routes going in similar direction are better)
    const directionFactor = calculateDirectionSimilarity(route.direction, location);
    viabilityScore += directionFactor * 0.3;
    
    const confidence = Math.min(0.8, viabilityScore);
    const viable = confidence > 0.4;
    
    return {
      viable,
      confidence,
      viabilityScore,
      instructions: viable ? 
        `Passengers can use Route ${route.routeShortName || route.routeId} as alternative, ${Math.round(route.distance)}m walk required` :
        'Not suitable for diversion',
      estimatedDelay: viable ? `${Math.round(route.distance / 80)} minutes walking time` : 'N/A',
      affectedStops: [], // Would need more detailed analysis
      roadType: route.roadType || 'unknown'
    };
    
  } catch (error) {
    console.error('Error analyzing diversion potential:', error);
    return { viable: false, confidence: 0 };
  }
}

/**
 * Calculate route detour for GTFS-based suggestions
 */
async function calculateRouteDetour(routeAnalysis, location) {
  try {
    if (!routeAnalysis.impactedSegments || routeAnalysis.impactedSegments.length === 0) {
      return null;
    }
    
    // Find the best detour path around the roadwork
    const detour = await findOptimalDetour(routeAnalysis, location);
    
    if (!detour) return null;
    
    return {
      confidence: Math.min(0.75, detour.feasibilityScore),
      description: `Detour around ${location.description} adding approximately ${detour.additionalTime} minutes`,
      route: detour.routeDescription,
      instructions: detour.instructions,
      estimatedDelay: `${detour.additionalTime} minutes`,
      affectedStops: detour.affectedStops,
      alternativeStops: detour.alternativeStops,
      detourLength: detour.distanceKm
    };
    
  } catch (error) {
    console.error('Error calculating route detour:', error);
    return null;
  }
}

/**
 * Find optimal detour path (simplified implementation)
 */
async function findOptimalDetour(routeAnalysis, location) {
  try {
    // This is a simplified implementation
    // In production, this would use routing APIs like TomTom or HERE
    
    const affectedSegment = routeAnalysis.impactedSegments[0];
    const additionalDistance = affectedSegment.detourDistance || 1; // km
    const additionalTime = Math.round(additionalDistance * 2); // 2 minutes per km
    
    return {
      feasibilityScore: 0.7,
      routeDescription: `Detour via alternative roads around ${location.description}`,
      instructions: [
        `Continue normal route until ${affectedSegment.beforeStop}`,
        `Divert via alternative route avoiding roadwork area`,
        `Rejoin normal route at ${affectedSegment.afterStop}`
      ],
      additionalTime,
      distanceKm: additionalDistance,
      affectedStops: affectedSegment.skippedStops || [],
      alternativeStops: [] // Would need stop database lookup
    };
    
  } catch (error) {
    console.error('Error finding optimal detour:', error);
    return null;
  }
}

/**
 * Analyze location characteristics for pattern matching
 */
async function analyzeLocationCharacteristics(location) {
  // Extract characteristics that might influence diversion success
  const description = (location.description || '').toLowerCase();
  
  return {
    roadType: description.includes('motorway') || description.includes('m1') || description.includes('a1') ? 'major' :
              description.includes('high street') || description.includes('main') ? 'main' : 'local',
    areaType: description.includes('city centre') || description.includes('town centre') ? 'urban_centre' :
              description.includes('industrial') ? 'industrial' : 'residential',
    bridgeOrTunnel: description.includes('bridge') || description.includes('tunnel'),
    roundabout: description.includes('roundabout'),
    junction: description.includes('junction') || description.includes('interchange'),
    coordinates: {
      lat: Math.round(location.lat * 100) / 100, // Rounded for pattern matching
      lng: Math.round(location.lng * 100) / 100
    }
  };
}

/**
 * Calculate similarity score between location characteristics
 */
function calculateSimilarityScore(characteristics1, characteristics2) {
  if (!characteristics1 || !characteristics2) return 0;
  
  let matches = 0;
  let total = 0;
  
  // Compare each characteristic
  Object.keys(characteristics1).forEach(key => {
    if (key !== 'coordinates') {
      total++;
      if (characteristics1[key] === characteristics2[key]) {
        matches++;
      }
    }
  });
  
  return total > 0 ? matches / total : 0;
}

/**
 * Calculate direction similarity for routes
 */
function calculateDirectionSimilarity(routeDirection, location) {
  // Simplified implementation - would need more sophisticated analysis
  return 0.6; // Default moderate similarity
}

/**
 * Rank and deduplicate suggestions
 */
function rankAndDeduplicate(suggestions, maxSuggestions) {
  // Sort by confidence score (highest first)
  const sorted = suggestions.sort((a, b) => b.confidence - a.confidence);
  
  // Remove duplicates based on similar routes/instructions
  const unique = [];
  const seen = new Set();
  
  for (const suggestion of sorted) {
    const key = `${suggestion.type}-${suggestion.diversion.route}`;
    if (!seen.has(key) && unique.length < maxSuggestions) {
      seen.add(key);
      unique.push(suggestion);
    }
  }
  
  return unique;
}

/**
 * Save successful diversion as template for future use
 */
export async function saveDiversionTemplate(diversionData, supervisorInfo) {
  try {
    const template = {
      location_hash: hashLocation(diversionData.location.lat, diversionData.location.lng),
      location_data: diversionData.location,
      location_characteristics: await analyzeLocationCharacteristics(diversionData.location),
      route_description: diversionData.title || 'Custom Diversion',
      diversion_route: diversionData.route,
      diversion_details: {
        description: diversionData.description,
        instructions: diversionData.instructions,
        estimated_delay: diversionData.estimatedDelay,
        affected_stops: diversionData.affectedStops
      },
      affected_routes: diversionData.affectedRoutes || [],
      success_rating: 0.7, // Initial rating, will be updated based on feedback
      usage_count: 1,
      created_by: supervisorInfo.badge,
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('diversion_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Saved diversion template ${data.id}`);
    
    return { success: true, template: data };
    
  } catch (error) {
    console.error('Error saving diversion template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update template success rating based on supervisor feedback
 */
export async function updateTemplateRating(templateId, rating, supervisorInfo) {
  try {
    // Get current template to update usage stats
    const { data: template, error: fetchError } = await supabase
      .from('diversion_templates')
      .select('success_rating, usage_count')
      .eq('id', templateId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Calculate new weighted average rating
    const currentRating = template.success_rating || 0.7;
    const usageCount = template.usage_count || 1;
    const newRating = ((currentRating * usageCount) + rating) / (usageCount + 1);
    
    const { data, error } = await supabase
      .from('diversion_templates')
      .update({
        success_rating: newRating,
        usage_count: usageCount + 1,
        last_used: new Date().toISOString(),
        last_rated_by: supervisorInfo.badge
      })
      .eq('id', templateId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Updated template ${templateId} rating to ${newRating.toFixed(2)}`);
    
    return { success: true, template: data };
    
  } catch (error) {
    console.error('Error updating template rating:', error);
    return { success: false, error: error.message };
  }
}

export default {
  suggestDiversions,
  saveDiversionTemplate,
  updateTemplateRating
};