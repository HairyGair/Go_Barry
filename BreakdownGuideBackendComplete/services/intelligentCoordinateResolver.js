// backend/services/intelligentCoordinateResolver.js
// Intelligent coordinate resolution with multiple strategies
import axios from 'axios';
import { oneNetworkService } from './oneNetworkServiceLight.js'; // Use lightweight version
import { coordinateFallbackProcessor } from '../utils/coordinateFallbackProcessor.js';
import { nominatimRateLimiter, googleRateLimiter, postcodeRateLimiter } from '../utils/rateLimiter.js';

class IntelligentCoordinateResolver {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.postcodeCache = new Map();
    this.junctionDatabase = this.loadJunctionDatabase();
    this.landmarkDatabase = this.loadLandmarkDatabase();
  }

  /**
   * Resolve coordinates using multiple intelligent strategies
   */
  async resolveCoordinates(roadwork) {
    console.log(`🔍 Attempting intelligent coordinate resolution for ${roadwork.sm_reference || roadwork.id}`);
    
    const strategies = [
      // Priority 1: Check one.network using permit reference
      () => this.strategyOneNetwork(roadwork),
      
      // Priority 2: Extract from detailed location description
      () => this.strategyParseDescription(roadwork),
      
      // Priority 3: Use junction database
      () => this.strategyJunctionLookup(roadwork),
      
      // Priority 4: Postcode extraction and lookup
      () => this.strategyPostcodeLookup(roadwork),
      
      // Priority 5: Landmark recognition
      () => this.strategyLandmarkLookup(roadwork),
      
      // Priority 6: Smart geocoding with context
      () => this.strategySmartGeocode(roadwork),
      
      // Priority 7: Neighboring roadworks inference
      () => this.strategyNeighborInference(roadwork),
      
      // Priority 8: Historical data lookup
      () => this.strategyHistoricalLookup(roadwork)
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result && result.coordinates) {
          console.log(`✅ Coordinates resolved using ${result.strategy}`);
          return {
            ...roadwork,
            coordinates: result.coordinates,
            coordinateSource: result.source,
            coordinateAccuracy: result.accuracy,
            coordinateStrategy: result.strategy,
            coordinateConfidence: result.confidence
          };
        }
      } catch (error) {
        console.error(`Strategy failed: ${error.message}`);
        continue;
      }
    }

    // If all strategies fail, return with detailed failure info
    return {
      ...roadwork,
      coordinates: null,
      coordinateSource: 'unresolved',
      coordinateResolutionAttempted: true,
      resolutionSuggestions: this.generateResolutionSuggestions(roadwork)
    };
  }

  /**
   * Strategy 1: Query one.network using permit reference
   */
  async strategyOneNetwork(roadwork) {
    if (!roadwork.sm_permit_reference) return null;

    const result = await oneNetworkService.searchByPermitReference(roadwork.sm_permit_reference);
    if (result) {
      return {
        coordinates: [result.lat, result.lng],
        source: 'one_network',
        accuracy: 'high',
        strategy: 'one_network_lookup',
        confidence: 0.95
      };
    }
    return null;
  }

  /**
   * Strategy 2: Parse detailed location descriptions
   */
  strategyParseDescription(roadwork) {
    const description = roadwork.sm_location_description || roadwork.location_description;
    if (!description) return null;

    // Pattern 1: "A1 northbound between J65 and J66"
    const junctionPattern = /between\s+J(\d+)\s+and\s+J(\d+)/i;
    const junctionMatch = description.match(junctionPattern);
    if (junctionMatch) {
      const road = this.extractRoadName(description);
      const j1 = parseInt(junctionMatch[1]);
      const j2 = parseInt(junctionMatch[2]);
      const coords = this.getJunctionMidpoint(road, j1, j2);
      if (coords) {
        return {
          coordinates: coords,
          source: 'junction_midpoint',
          accuracy: 'high',
          strategy: 'junction_parsing',
          confidence: 0.9
        };
      }
    }

    // Pattern 2: "500m north of Tesco Extra, Team Valley"
    const distancePattern = /(\d+)m?\s+(north|south|east|west)\s+of\s+(.+?)(?:,|$)/i;
    const distanceMatch = description.match(distancePattern);
    if (distanceMatch) {
      const distance = parseInt(distanceMatch[1]);
      const direction = distanceMatch[2];
      const landmark = distanceMatch[3];
      const landmarkCoords = this.findLandmarkCoordinates(landmark);
      if (landmarkCoords) {
        const adjustedCoords = this.adjustCoordinatesByDistance(
          landmarkCoords, 
          distance, 
          direction
        );
        return {
          coordinates: adjustedCoords,
          source: 'landmark_offset',
          accuracy: 'medium',
          strategy: 'distance_from_landmark',
          confidence: 0.7
        };
      }
    }

    return null;
  }

  /**
   * Strategy 3: Junction database lookup
   */
  strategyJunctionLookup(roadwork) {
    const description = roadwork.sm_location_description || '';
    
    // Extract junction references
    const junctionPattern = /J(\d+)[A-Z]?\s*(?:of\s+)?([A-Z]\d+)/gi;
    const matches = [...description.matchAll(junctionPattern)];
    
    for (const match of matches) {
      const junctionNum = match[1];
      const road = match[2];
      const coords = this.lookupJunction(road, junctionNum);
      if (coords) {
        return {
          coordinates: coords,
          source: 'junction_database',
          accuracy: 'high',
          strategy: 'junction_lookup',
          confidence: 0.85
        };
      }
    }
    
    return null;
  }

  /**
   * Strategy 4: Postcode extraction and lookup
   */
  async strategyPostcodeLookup(roadwork) {
    const text = `${roadwork.sm_location_description} ${roadwork.sm_street_name} ${roadwork.sm_area_name}`;
    
    // UK postcode pattern
    const postcodePattern = /([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})/gi;
    const matches = text.match(postcodePattern);
    
    if (matches && matches.length > 0) {
      for (const postcode of matches) {
        const coords = await this.geocodePostcode(postcode);
        if (coords) {
          return {
            coordinates: coords,
            source: 'postcode_geocode',
            accuracy: 'medium',
            strategy: 'postcode_extraction',
            confidence: 0.75
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Strategy 5: Landmark database lookup
   */
  strategyLandmarkLookup(roadwork) {
    const landmarks = this.extractLandmarks(roadwork);
    
    for (const landmark of landmarks) {
      const coords = this.landmarkDatabase.get(landmark.toLowerCase());
      if (coords) {
        return {
          coordinates: coords,
          source: 'landmark_database',
          accuracy: 'medium',
          strategy: 'landmark_recognition',
          confidence: 0.7
        };
      }
    }
    
    return null;
  }

  /**
   * Strategy 6: Smart geocoding with enhanced context
   */
  async strategySmartGeocode(roadwork) {
    // Build intelligent query
    const queryParts = [];
    
    // Add street name with common abbreviations expanded
    if (roadwork.sm_street_name) {
      const expanded = this.expandStreetAbbreviations(roadwork.sm_street_name);
      queryParts.push(expanded);
    }
    
    // Add area context
    if (roadwork.sm_area_name) {
      queryParts.push(roadwork.sm_area_name);
    }
    
    // Add nearest known location
    const nearestKnown = this.findNearestKnownLocation(roadwork);
    if (nearestKnown) {
      queryParts.push(`near ${nearestKnown}`);
    }
    
    // Try geocoding with enhanced query
    const query = queryParts.join(', ') + ', UK';
    const result = await this.enhancedGeocode(query);
    
    if (result) {
      return {
        coordinates: result.coordinates,
        source: 'smart_geocode',
        accuracy: result.accuracy,
        strategy: 'enhanced_geocoding',
        confidence: result.confidence
      };
    }
    
    return null;
  }

  /**
   * Strategy 7: Infer from neighboring roadworks
   */
  async strategyNeighborInference(roadwork) {
    // This would look at other roadworks in the same area
    // and infer likely coordinates based on patterns
    return null; // Placeholder for now
  }

  /**
   * Strategy 8: Historical roadwork data
   */
  async strategyHistoricalLookup(roadwork) {
    // Check if we've seen similar roadworks before
    const historicalKey = this.generateHistoricalKey(roadwork);
    const historical = await this.queryHistoricalDatabase(historicalKey);
    
    if (historical) {
      return {
        coordinates: historical.coordinates,
        source: 'historical_data',
        accuracy: 'medium',
        strategy: 'historical_lookup',
        confidence: 0.6
      };
    }
    
    return null;
  }

  // Helper methods

  loadJunctionDatabase() {
    // Major junction coordinates for North East England
    return new Map([
      ['A1:J65', [54.914598, -1.584782]],
      ['A1:J66', [54.932145, -1.581234]],
      ['A1:J67', [54.961234, -1.578901]],
      ['A19:TYNE_TUNNEL', [54.989234, -1.453211]],
      ['A19:SILVERLINK', [55.012344, -1.455672]],
      ['A167:GATESHEAD', [54.958765, -1.603421]],
      // Add more junctions as needed
    ]);
  }

  loadLandmarkDatabase() {
    // Major landmarks in the region
    return new Map([
      ['metro centre', [54.958951, -1.665891]],
      ['team valley', [54.929871, -1.602341]],
      ['quayside', [54.970123, -1.607891]],
      ['monument metro', [54.973456, -1.613211]],
      ['central station', [54.968234, -1.617123]],
      ['tyne tunnel', [54.989234, -1.453211]],
      ['angel of the north', [54.914598, -1.589762]],
      // Add more landmarks
    ]);
  }

  expandStreetAbbreviations(street) {
    const abbreviations = {
      'St': 'Street',
      'Rd': 'Road',
      'Ave': 'Avenue',
      'Ln': 'Lane',
      'Cl': 'Close',
      'Dr': 'Drive',
      'Pk': 'Park',
      'Sq': 'Square'
    };
    
    let expanded = street;
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const pattern = new RegExp(`\\b${abbr}\\b`, 'gi');
      expanded = expanded.replace(pattern, full);
    }
    
    return expanded;
  }

  async geocodePostcode(postcode) {
    // Use postcodes.io for UK postcode geocoding
    return postcodeRateLimiter.throttle(async () => {
      try {
        const response = await axios.get(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
          { timeout: 3000 }
        );
        
        if (response.data.status === 200 && response.data.result) {
          return [
            response.data.result.latitude,
            response.data.result.longitude
          ];
        }
      } catch (error) {
        console.error(`Postcode lookup failed for ${postcode}:`, error.message);
      }
      return null;
    });
  }

  adjustCoordinatesByDistance(coords, distanceMeters, direction) {
    const [lat, lng] = coords;
    const earthRadius = 6371000; // meters
    
    // Rough approximation for small distances
    const latAdjust = (distanceMeters / earthRadius) * (180 / Math.PI);
    const lngAdjust = (distanceMeters / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    
    switch (direction.toLowerCase()) {
      case 'north': return [lat + latAdjust, lng];
      case 'south': return [lat - latAdjust, lng];
      case 'east': return [lat, lng + lngAdjust];
      case 'west': return [lat, lng - lngAdjust];
      default: return coords;
    }
  }

  async enhancedGeocode(query) {
    // Try multiple geocoding services
    const services = [
      () => this.geocodeWithNominatim(query),
      () => this.geocodeWithMapbox(query),
      () => this.geocodeWithGoogle(query)
    ];
    
    for (const service of services) {
      try {
        const result = await service();
        if (result) return result;
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  async geocodeWithNominatim(query) {
    return nominatimRateLimiter.throttle(async () => {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            limit: 1,
            countrycodes: 'gb',
            addressdetails: 1,
            extratags: 1
          },
          headers: {
            'User-Agent': 'Go-BARRY-Traffic-System/1.0'
          },
          timeout: 5000
        });

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          return {
            coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
            accuracy: this.assessAccuracy(result),
            confidence: parseFloat(result.importance || 0.5)
          };
        }
      } catch (error) {
        if (!error.message.includes('timeout')) {
          console.error('Nominatim error:', error.message);
        }
      }
      return null;
    }, 1); // Lower priority for Nominatim
  }

  async geocodeWithMapbox(query) {
    if (!process.env.MAPBOX_API_KEY) return null;
    
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: process.env.MAPBOX_API_KEY,
            country: 'GB',
            limit: 1
          },
          timeout: 3000
        }
      );
      
      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return {
          coordinates: [feature.center[1], feature.center[0]], // lng,lat to lat,lng
          accuracy: 'medium',
          confidence: feature.relevance || 0.7
        };
      }
    } catch (error) {
      console.error('Mapbox error:', error.message);
    }
    return null;
  }

  async geocodeWithGoogle(query) {
    if (!process.env.GOOGLE_API_KEY) return null;
    
    return googleRateLimiter.throttle(async () => {
      try {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/geocode/json',
          {
            params: {
              address: query,
              region: 'uk',
              key: process.env.GOOGLE_API_KEY
            },
            timeout: 3000
          }
        );
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const location = result.geometry.location;
          return {
            coordinates: [location.lat, location.lng],
            accuracy: this.googleAccuracyToLevel(result.geometry.location_type),
            confidence: 0.85
          };
        }
      } catch (error) {
        if (!error.message.includes('timeout')) {
          console.error('Google geocoding error:', error.message);
        }
      }
      return null;
    }, 3); // Higher priority for Google
  }

  assessAccuracy(nominatimResult) {
    const type = nominatimResult.type;
    const importance = nominatimResult.importance || 0;
    
    if (type === 'road' || type === 'highway') return 'high';
    if (type === 'suburb' || type === 'neighbourhood') return 'medium';
    if (importance > 0.7) return 'high';
    if (importance > 0.5) return 'medium';
    return 'low';
  }

  googleAccuracyToLevel(locationType) {
    const mapping = {
      'ROOFTOP': 'high',
      'RANGE_INTERPOLATED': 'high',
      'GEOMETRIC_CENTER': 'medium',
      'APPROXIMATE': 'low'
    };
    return mapping[locationType] || 'medium';
  }

  generateResolutionSuggestions(roadwork) {
    const suggestions = [];
    
    // Primary suggestion: Check one.network
    if (roadwork.sm_permit_reference) {
      suggestions.push({
        priority: 1,
        action: 'search_one_network',
        description: 'Search one.network with permit reference',
        url: `https://one.network/search?query=${encodeURIComponent(roadwork.sm_permit_reference)}`,
        automated: true
      });
    }
    
    // Check original notification
    suggestions.push({
      priority: 2,
      action: 'check_original_notification',
      description: 'Review original Street Manager notification for coordinates',
      reference: roadwork.sm_works_reference || roadwork.sm_permit_reference
    });
    
    // Contact promoter
    if (roadwork.sm_promoter_organisation) {
      suggestions.push({
        priority: 3,
        action: 'contact_promoter',
        description: `Contact ${roadwork.sm_promoter_organisation} for exact location`,
        phone: roadwork.sm_promoter_contact
      });
    }
    
    // Manual coordinate entry
    suggestions.push({
      priority: 4,
      action: 'manual_coordinate_entry',
      description: 'Manually enter coordinates after site verification',
      fields: ['latitude', 'longitude']
    });
    
    return suggestions;
  }

  extractLandmarks(roadwork) {
    const text = `${roadwork.sm_location_description} ${roadwork.sm_street_name}`.toLowerCase();
    const landmarks = [];
    
    // Check against known landmarks
    for (const [landmark, coords] of this.landmarkDatabase) {
      if (text.includes(landmark)) {
        landmarks.push(landmark);
      }
    }
    
    return landmarks;
  }

  findNearestKnownLocation(roadwork) {
    // This would find the nearest location we have coordinates for
    // based on the highway authority area
    const authority = roadwork.sm_highway_authority;
    
    const knownLocations = {
      'NEWCASTLE CITY COUNCIL': 'Newcastle city centre',
      'GATESHEAD COUNCIL': 'Gateshead town centre',
      'SUNDERLAND CITY COUNCIL': 'Sunderland city centre'
    };
    
    return knownLocations[authority] || null;
  }

  getJunctionMidpoint(road, j1, j2) {
    const key1 = `${road}:J${j1}`;
    const key2 = `${road}:J${j2}`;
    
    const coords1 = this.junctionDatabase.get(key1);
    const coords2 = this.junctionDatabase.get(key2);
    
    if (coords1 && coords2) {
      return [
        (coords1[0] + coords2[0]) / 2,
        (coords1[1] + coords2[1]) / 2
      ];
    }
    
    return null;
  }

  lookupJunction(road, junctionNum) {
    const key = `${road}:J${junctionNum}`;
    return this.junctionDatabase.get(key) || null;
  }

  extractRoadName(description) {
    const roadPattern = /\b([AM]\d+)\b/;
    const match = description.match(roadPattern);
    return match ? match[1] : null;
  }

  findLandmarkCoordinates(landmark) {
    return this.landmarkDatabase.get(landmark.toLowerCase()) || null;
  }

  generateHistoricalKey(roadwork) {
    // Create a key based on location attributes
    const parts = [
      roadwork.sm_street_name,
      roadwork.sm_town,
      roadwork.sm_highway_authority
    ].filter(Boolean).map(p => p.toLowerCase().replace(/\s+/g, '_'));
    
    return parts.join(':');
  }

  async queryHistoricalDatabase(key) {
    // This would query a database of previously resolved coordinates
    // For now, return null
    return null;
  }
}

export const intelligentCoordinateResolver = new IntelligentCoordinateResolver();
