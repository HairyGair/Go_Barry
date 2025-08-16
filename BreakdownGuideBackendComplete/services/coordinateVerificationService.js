// backend/services/coordinateVerificationService.js
// Coordinate verification workflow for supervisor validation
import axios from 'axios';

/**
 * Verify coordinates for a roadwork
 * @param {string} roadworkId - Roadwork ID
 * @param {Array} coordinates - [lat, lng]
 * @param {Object} verification - Verification details
 * @returns {Object} Verification result
 */
export async function verifyRoadworkCoordinates(roadworkId, coordinates, verification) {
  const { verifiedBy, verificationMethod, notes, confidence } = verification;
  
  // Create verification record
  const verificationRecord = {
    roadworkId,
    verifiedCoordinates: coordinates,
    verifiedBy,
    verifiedAt: new Date().toISOString(),
    verificationMethod, // 'site_visit', 'local_knowledge', 'street_view', 'photo_evidence'
    confidence: confidence || 1.0, // 0-1 scale
    notes,
    previousCoordinates: verification.previousCoordinates,
    coordinateChange: calculateCoordinateChange(
      verification.previousCoordinates, 
      coordinates
    )
  };

  // Log verification
  console.log(`✅ Coordinates verified for ${roadworkId} by ${verifiedBy}`);
  console.log(`   Method: ${verificationMethod}, Confidence: ${confidence}`);
  
  // Update Supabase with verification
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      await updateSupabaseVerification(roadworkId, verificationRecord);
    } catch (error) {
      console.error('Failed to update Supabase:', error);
    }
  }
  
  return {
    success: true,
    verification: verificationRecord
  };
}

/**
 * Calculate distance between old and new coordinates
 * @param {Array} oldCoords - Previous [lat, lng]
 * @param {Array} newCoords - New [lat, lng]
 * @returns {Object} Change details
 */
function calculateCoordinateChange(oldCoords, newCoords) {
  if (!oldCoords || !newCoords) {
    return { distanceMeters: null, significant: false };
  }
  
  const [oldLat, oldLng] = oldCoords;
  const [newLat, newLng] = newCoords;
  
  // Haversine formula
  const R = 6371000; // Earth's radius in meters
  const φ1 = oldLat * Math.PI / 180;
  const φ2 = newLat * Math.PI / 180;
  const Δφ = (newLat - oldLat) * Math.PI / 180;
  const Δλ = (newLng - oldLng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return {
    distanceMeters: Math.round(distance),
    significant: distance > 50, // More than 50m is significant
    bearing: calculateBearing(oldLat, oldLng, newLat, newLng)
  };
}

/**
 * Calculate bearing between two points
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  const θ = Math.atan2(y, x);
  const bearing = (θ * 180 / Math.PI + 360) % 360;
  
  // Convert to compass direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  
  return {
    degrees: Math.round(bearing),
    compass: directions[index]
  };
}

/**
 * Update Supabase with verification data
 */
async function updateSupabaseVerification(roadworkId, verification) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  const updateData = {
    converted_coordinates: {
      lat: verification.verifiedCoordinates[0],
      lng: verification.verifiedCoordinates[1],
      accuracy: 'verified'
    },
    coordinate_metadata: {
      verified: true,
      verified_by: verification.verifiedBy,
      verified_at: verification.verifiedAt,
      verification_method: verification.verificationMethod,
      verification_confidence: verification.confidence,
      verification_notes: verification.notes
    }
  };
  
  const response = await axios.patch(
    `${supabaseUrl}/rest/v1/streetworks?id=eq.${roadworkId}`,
    updateData,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }
  );
  
  return response.data;
}

/**
 * Get verification history for a roadwork
 */
export async function getVerificationHistory(roadworkId) {
  // In a full implementation, this would query a verification_history table
  // For now, return mock data structure
  return {
    roadworkId,
    verifications: [
      {
        verifiedBy: 'AG003',
        verifiedAt: '2025-01-15T10:30:00Z',
        method: 'site_visit',
        confidence: 1.0,
        coordinates: [54.8438741, -1.3649645]
      }
    ]
  };
}

/**
 * Bulk verify multiple roadworks
 */
export async function bulkVerifyCoordinates(roadworkIds, verifiedBy, method) {
  const results = [];
  
  for (const id of roadworkIds) {
    // In practice, would need to fetch current coordinates
    const result = await verifyRoadworkCoordinates(
      id,
      null, // Would fetch actual coordinates
      {
        verifiedBy,
        verificationMethod: method,
        confidence: 0.8,
        notes: 'Bulk verification'
      }
    );
    results.push(result);
  }
  
  return {
    success: true,
    verified: results.length,
    results
  };
}

/**
 * Flag coordinates for review
 */
export async function flagCoordinatesForReview(roadworkId, reason, flaggedBy) {
  const flagRecord = {
    roadworkId,
    flaggedBy,
    flaggedAt: new Date().toISOString(),
    reason, // 'inaccurate', 'water_location', 'wrong_road', 'needs_verification'
    status: 'pending_review'
  };
  
  console.log(`🚩 Coordinates flagged for review: ${roadworkId}`);
  console.log(`   Reason: ${reason}, By: ${flaggedBy}`);
  
  // Update metadata to indicate review needed
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      await updateSupabaseFlag(roadworkId, flagRecord);
    } catch (error) {
      console.error('Failed to update flag:', error);
    }
  }
  
  return {
    success: true,
    flag: flagRecord
  };
}

async function updateSupabaseFlag(roadworkId, flag) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  const response = await axios.patch(
    `${supabaseUrl}/rest/v1/streetworks?id=eq.${roadworkId}`,
    {
      coordinate_metadata: {
        needs_review: true,
        review_reason: flag.reason,
        flagged_by: flag.flaggedBy,
        flagged_at: flag.flaggedAt
      }
    },
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

export default {
  verifyRoadworkCoordinates,
  getVerificationHistory,
  bulkVerifyCoordinates,
  flagCoordinatesForReview
};
