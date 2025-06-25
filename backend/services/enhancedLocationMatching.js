// backend/services/enhancedLocationMatching.js
// Enhanced location matching with multiple validation layers and supervisor corrections

import enhancedGeocodingService from './enhancedGeocodingService.js';
import locationBoundariesService from './locationBoundaries.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedLocationMatchingService {
  constructor() {
    this.correctionsFile = path.join(__dirname, '../data/location-corrections.json');
    this.corrections = new Map();
    this.confidenceWeights = {
      geocoding: 0.3,
      boundary: 0.4,
      supervisor: 0.3
    };
    
    this.loadCorrections();
  }

  async loadCorrections() {
    try {
      const data = await fs.readFile(this.correctionsFile, 'utf8');
      const corrections = JSON.parse(data);
      
      corrections.forEach(correction => {
        const key = this.generateCorrectionKey(correction.originalLocation, correction.originalCoords);
        this.corrections.set(key, correction);
      });
      
      console.log(`📍 Loaded ${this.corrections.size} location corrections`);
    } catch (error) {
      console.log('📍 No existing location corrections found, starting fresh');
      this.corrections = new Map();
    }
  }

  async saveCorrections() {
    try {
      const corrections = Array.from(this.corrections.values());
      await fs.writeFile(
        this.correctionsFile, 
        JSON.stringify(corrections, null, 2),
        'utf8'
      );
      console.log(`✅ Saved ${corrections.length} location corrections`);
    } catch (error) {
      console.error('❌ Failed to save location corrections:', error);
    }
  }

  // Main method to enhance location accuracy
  async enhanceLocation(originalLocation, originalCoords, source = 'tomtom') {
    console.log(`🎯 Enhancing location: ${originalLocation} @ ${originalCoords}`);
    
    // Check for supervisor corrections first
    const correctionKey = this.generateCorrectionKey(originalLocation, originalCoords);
    const supervisorCorrection = this.corrections.get(correctionKey);
    
    if (supervisorCorrection) {
      console.log(`✅ Found supervisor correction for ${originalLocation}`);
      return {
        ...supervisorCorrection,
        source: 'supervisor_correction',
        confidence: 1.0
      };
    }

    // Step 1: Validate original coordinates with boundaries
    const boundaryValidation = await this.validateWithBoundaries(
      originalLocation, 
      originalCoords[0], 
      originalCoords[1]
    );

    // Step 2: Reverse geocode to get better location description
    const reverseGeocode = await this.reverseGeocodeEnhanced(
      originalCoords[0], 
      originalCoords[1]
    );

    // Step 3: If location description doesn't match coordinates, re-geocode
    let enhancedResult;
    if (!boundaryValidation.isValid && boundaryValidation.suggestedCorrection) {
      console.log(`⚠️ Location mismatch detected: ${originalLocation} is not in expected area`);
      
      // Try geocoding with the suggested correction
      const geocoded = await enhancedGeocodingService.geocodeLocation(
        boundaryValidation.suggestedCorrection
      );
      
      if (geocoded.success && geocoded.confidence > 0.7) {
        enhancedResult = {
          originalLocation,
          originalCoords,
          correctedLocation: boundaryValidation.suggestedCorrection,
          correctedCoords: geocoded.coordinates,
          confidence: geocoded.confidence,
          source: 'boundary_correction',
          boundaryInfo: boundaryValidation,
          reverseGeocoded: reverseGeocode
        };
      }
    }

    // Step 4: If no correction needed or correction failed, enhance with reverse geocoding
    if (!enhancedResult) {
      enhancedResult = {
        originalLocation,
        originalCoords,
        correctedLocation: reverseGeocode.formattedAddress || originalLocation,
        correctedCoords: originalCoords,
        confidence: this.calculateCombinedConfidence(boundaryValidation, reverseGeocode),
        source: 'enhanced_original',
        boundaryInfo: boundaryValidation,
        reverseGeocoded: reverseGeocode
      };
    }

    // Step 5: Check nearest known location for additional context
    const nearest = locationBoundariesService.getNearestLocation(
      enhancedResult.correctedCoords[0],
      enhancedResult.correctedCoords[1]
    );
    
    if (nearest && nearest.distance < 2) { // Within 2km
      enhancedResult.nearestKnownLocation = nearest;
    }

    return enhancedResult;
  }

  // Validate location with boundary service
  async validateWithBoundaries(description, lat, lon) {
    return locationBoundariesService.validateLocationDescription(description, lat, lon);
  }

  // Enhanced reverse geocoding with multiple attempts
  async reverseGeocodeEnhanced(lat, lon) {
    try {
      // Try Nominatim reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=16`,
        {
          headers: {
            'User-Agent': 'Go-BARRY-Traffic-Intelligence/3.0 (traffic@gobarry.co.uk)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Build a better formatted address focusing on key components
        const addr = data.address || {};
        const components = [];
        
        // Priority order for address components
        const priorityComponents = [
          addr.road,
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.village,
          addr.county,
          addr.postcode
        ];
        
        priorityComponents.forEach(component => {
          if (component) components.push(component);
        });

        return {
          success: true,
          formattedAddress: components.join(', '),
          detailedAddress: addr,
          displayName: data.display_name,
          confidence: 0.85
        };
      }
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error);
    }

    return {
      success: false,
      formattedAddress: null,
      confidence: 0
    };
  }

  // Calculate combined confidence score
  calculateCombinedConfidence(boundaryValidation, reverseGeocode) {
    let confidence = 0;
    
    if (boundaryValidation.isValid) {
      confidence += this.confidenceWeights.boundary * boundaryValidation.confidence;
    }
    
    if (reverseGeocode.success) {
      confidence += this.confidenceWeights.geocoding * reverseGeocode.confidence;
    }
    
    // Base confidence from original source
    confidence += this.confidenceWeights.supervisor * 0.5;
    
    return Math.min(confidence, 1.0);
  }

  // Add supervisor correction
  async addSupervisorCorrection(correction) {
    const {
      originalLocation,
      originalCoords,
      correctedLocation,
      correctedCoords,
      supervisorId,
      supervisorName,
      reason
    } = correction;

    const key = this.generateCorrectionKey(originalLocation, originalCoords);
    
    const correctionEntry = {
      id: `correction_${Date.now()}`,
      originalLocation,
      originalCoords,
      correctedLocation,
      correctedCoords,
      supervisorId,
      supervisorName,
      reason,
      timestamp: new Date().toISOString(),
      applied: 0
    };

    this.corrections.set(key, correctionEntry);
    await this.saveCorrections();

    console.log(`✅ Supervisor ${supervisorName} corrected location: ${originalLocation} → ${correctedLocation}`);
    
    return correctionEntry;
  }

  // Generate unique key for corrections
  generateCorrectionKey(location, coords) {
    const normalizedLocation = location.toLowerCase().trim().replace(/\s+/g, ' ');
    const coordsKey = `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`;
    return `${normalizedLocation}::${coordsKey}`;
  }

  // Get all corrections for review
  getAllCorrections() {
    return Array.from(this.corrections.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Remove a correction
  async removeCorrection(correctionId) {
    for (const [key, correction] of this.corrections.entries()) {
      if (correction.id === correctionId) {
        this.corrections.delete(key);
        await this.saveCorrections();
        return true;
      }
    }
    return false;
  }

  // Get statistics
  getStatistics() {
    const corrections = Array.from(this.corrections.values());
    const supervisorStats = {};
    
    corrections.forEach(correction => {
      if (!supervisorStats[correction.supervisorId]) {
        supervisorStats[correction.supervisorId] = {
          name: correction.supervisorName,
          count: 0,
          lastCorrection: null
        };
      }
      
      supervisorStats[correction.supervisorId].count++;
      
      const timestamp = new Date(correction.timestamp);
      if (!supervisorStats[correction.supervisorId].lastCorrection || 
          timestamp > new Date(supervisorStats[correction.supervisorId].lastCorrection)) {
        supervisorStats[correction.supervisorId].lastCorrection = correction.timestamp;
      }
    });

    return {
      totalCorrections: corrections.length,
      supervisorStats,
      boundaries: Object.keys(locationBoundariesService.getAllBoundaries()).length,
      confidenceWeights: this.confidenceWeights
    };
  }

  // Batch enhance multiple locations
  async batchEnhanceLocations(locations) {
    console.log(`🎯 Batch enhancing ${locations.length} locations...`);
    
    const results = await Promise.all(
      locations.map(loc => 
        this.enhanceLocation(loc.description, loc.coordinates, loc.source)
          .catch(error => ({
            error: error.message,
            originalLocation: loc.description,
            originalCoords: loc.coordinates
          }))
      )
    );

    const successful = results.filter(r => !r.error).length;
    console.log(`✅ Enhanced ${successful}/${locations.length} locations`);
    
    return results;
  }
}

// Create singleton instance
const enhancedLocationMatchingService = new EnhancedLocationMatchingService();

export default enhancedLocationMatchingService;
