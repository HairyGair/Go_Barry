// backend/services/snapToRoadService.js
// Google Roads API integration for street-level coordinate accuracy
import axios from 'axios';

const GOOGLE_ROADS_API_KEY = process.env.GOOGLE_ROADS_API_KEY || process.env.GOOGLE_API_KEY;
const ROADS_API_BASE_URL = 'https://roads.googleapis.com/v1';

/**
 * Snap coordinates to the nearest road
 * @param {Array} coordinates - Array of [lat, lng] pairs
 * @param {Object} options - Snap options
 * @returns {Object} Snapped coordinates result
 */
export async function snapToRoad(coordinates, options = {}) {
  if (!GOOGLE_ROADS_API_KEY) {
    console.warn('⚠️ Google Roads API key not configured');
    return {
      success: false,
      error: 'Google Roads API key not configured',
      originalCoordinates: coordinates
    };
  }

  // Convert coordinates to path string
  const path = coordinates
    .map(([lat, lng]) => `${lat},${lng}`)
    .join('|');

  try {
    const response = await axios.get(`${ROADS_API_BASE_URL}/snapToRoads`, {
      params: {
        path: path,
        key: GOOGLE_ROADS_API_KEY,
        interpolate: options.interpolate !== false, // Default true
      },
      timeout: 5000
    });

    if (response.data.snappedPoints) {
      const snappedCoordinates = response.data.snappedPoints.map(point => ({
        location: {
          lat: point.location.latitude,
          lng: point.location.longitude
        },
        originalIndex: point.originalIndex,
        placeId: point.placeId
      }));

      return {
        success: true,
        snappedPoints: snappedCoordinates,
        originalCoordinates: coordinates,
        confidence: calculateSnapConfidence(coordinates, snappedCoordinates)
      };
    }

    return {
      success: false,
      error: 'No snapped points returned',
      originalCoordinates: coordinates
    };
  } catch (error) {
    console.error('❌ Snap to road error:', error.message);
    return {
      success: false,
      error: error.message,
      originalCoordinates: coordinates
    };
  }
}

/**
 * Get nearest roads for a coordinate
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters
 * @returns {Object} Nearest roads result
 */
export async function getNearestRoads(lat, lng, radius = 50) {
  if (!GOOGLE_ROADS_API_KEY) {
    return {
      success: false,
      error: 'Google Roads API key not configured'
    };
  }

  try {
    const response = await axios.get(`${ROADS_API_BASE_URL}/nearestRoads`, {
      params: {
        points: `${lat},${lng}`,
        key: GOOGLE_ROADS_API_KEY,
        radius: radius
      },
      timeout: 5000
    });

    if (response.data.snappedPoints) {
      const roads = response.data.snappedPoints.map(point => ({
        location: {
          lat: point.location.latitude,
          lng: point.location.longitude
        },
        placeId: point.placeId,
        distance: calculateDistance(lat, lng, point.location.latitude, point.location.longitude)
      }));

      // Sort by distance
      roads.sort((a, b) => a.distance - b.distance);

      return {
        success: true,
        nearestRoads: roads,
        closestRoad: roads[0]
      };
    }

    return {
      success: false,
      error: 'No roads found nearby'
    };
  } catch (error) {
    console.error('❌ Nearest roads error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process roadwork with road snapping
 * @param {Object} roadwork - Roadwork with coordinates
 * @param {Object} options - Processing options
 * @returns {Object} Roadwork with snapped coordinates
 */
export async function snapRoadworkToRoad(roadwork, options = {}) {
  if (!roadwork.coordinates || !Array.isArray(roadwork.coordinates)) {
    return roadwork;
  }

  // For single point
  if (roadwork.coordinatePoints === 1) {
    const [lat, lng] = roadwork.coordinates;
    const nearestResult = await getNearestRoads(lat, lng);

    if (nearestResult.success && nearestResult.closestRoad) {
      const snappedLat = nearestResult.closestRoad.location.lat;
      const snappedLng = nearestResult.closestRoad.location.lng;
      const snapDistance = nearestResult.closestRoad.distance;

      // Only snap if within reasonable distance (100m)
      if (snapDistance < 100) {
        return {
          ...roadwork,
          coordinates: [snappedLat, snappedLng],
          originalCoordinatesBeforeSnap: roadwork.coordinates,
          coordinateSource: roadwork.coordinateSource + '_snapped',
          snapToRoadApplied: true,
          snapDistance: Math.round(snapDistance),
          roadPlaceId: nearestResult.closestRoad.placeId
        };
      }
    }
  }
  
  // For linestring with multiple points
  if (roadwork.allCoordinatePoints && roadwork.allCoordinatePoints.length > 1) {
    const coordinatePairs = roadwork.allCoordinatePoints.map(point => 
      [parseFloat(point[0]), parseFloat(point[1])]
    );
    
    const snapResult = await snapToRoad(coordinatePairs, options);
    
    if (snapResult.success) {
      // Update the representative point
      const representativeIndex = Math.floor(snapResult.snappedPoints.length / 2);
      const snappedRepresentative = snapResult.snappedPoints[representativeIndex];
      
      return {
        ...roadwork,
        coordinates: [
          snappedRepresentative.location.lat,
          snappedRepresentative.location.lng
        ],
        allCoordinatePointsSnapped: snapResult.snappedPoints.map(p => [
          p.location.lat.toFixed(7),
          p.location.lng.toFixed(7)
        ]),
        originalCoordinatesBeforeSnap: roadwork.coordinates,
        coordinateSource: roadwork.coordinateSource + '_snapped',
        snapToRoadApplied: true,
        snapConfidence: snapResult.confidence
      };
    }
  }

  return roadwork;
}

/**
 * Calculate confidence score for snapping
 * Based on average distance moved
 */
function calculateSnapConfidence(original, snapped) {
  let totalDistance = 0;
  let count = 0;

  snapped.forEach((point, index) => {
    if (point.originalIndex !== undefined && original[point.originalIndex]) {
      const [origLat, origLng] = original[point.originalIndex];
      const distance = calculateDistance(
        origLat, origLng,
        point.location.lat, point.location.lng
      );
      totalDistance += distance;
      count++;
    }
  });

  const avgDistance = count > 0 ? totalDistance / count : 0;
  
  // Confidence based on average snap distance
  if (avgDistance < 10) return 1.0;  // Very high confidence
  if (avgDistance < 25) return 0.9;  // High confidence
  if (avgDistance < 50) return 0.7;  // Medium confidence
  if (avgDistance < 100) return 0.5; // Low confidence
  return 0.3; // Very low confidence
}

/**
 * Simple distance calculation
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export default {
  snapToRoad,
  getNearestRoads,
  snapRoadworkToRoad
};
