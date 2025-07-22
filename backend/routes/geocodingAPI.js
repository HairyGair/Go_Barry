/*
 * Go Barry - Geocoding API Routes
 * Provides geocoding and reverse geocoding endpoints using Mapbox
 */

import express from 'express';
import fetch from 'node-fetch';

// Mapbox configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iZ29hOHJsMDB4djJtc2I5c2trbXA3dSJ9.1WxDF7rvXOycZyC5EwNS0A';
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const NORTH_EAST_BBOX = [-3.0, 54.0, -0.5, 56.0]; // [west, south, east, north]

const router = express.Router();

// Common North East locations for quick lookup
const knownLocations = {
  // Major roads
  'A1 NORTHBOUND': { lat: 54.978, lng: -1.617 },
  'A1 SOUTHBOUND': { lat: 54.978, lng: -1.617 },
  'A19 NORTHBOUND': { lat: 54.920, lng: -1.420 },
  'A19 SOUTHBOUND': { lat: 54.920, lng: -1.420 },
  'A167': { lat: 54.778, lng: -1.576 },
  'A1058 COAST ROAD': { lat: 55.008, lng: -1.486 },
  'A184 FELLING BYPASS': { lat: 54.963, lng: -1.568 },
  'A194': { lat: 54.940, lng: -1.440 },
  
  // Key locations
  'NEWCASTLE CITY CENTRE': { lat: 54.978, lng: -1.617 },
  'GATESHEAD TOWN CENTRE': { lat: 54.961, lng: -1.603 },
  'SUNDERLAND CITY CENTRE': { lat: 54.906, lng: -1.381 },
  'DURHAM CITY CENTRE': { lat: 54.777, lng: -1.576 },
  'NEWCASTLE AIRPORT': { lat: 55.038, lng: -1.692 },
  'METROCENTRE': { lat: 54.959, lng: -1.666 },
  'TEAM VALLEY': { lat: 54.927, lng: -1.571 },
  'COBALT BUSINESS PARK': { lat: 55.022, lng: -1.452 },
  'SILVERLINK': { lat: 55.010, lng: -1.481 },
  'ANGEL OF THE NORTH': { lat: 54.915, lng: -1.590 },
  
  // Bridges
  'TYNE BRIDGE': { lat: 54.968, lng: -1.608 },
  'HIGH LEVEL BRIDGE': { lat: 54.967, lng: -1.610 },
  'SWING BRIDGE': { lat: 54.969, lng: -1.607 },
  'REDHEUGH BRIDGE': { lat: 54.959, lng: -1.616 },
  'SCOTSWOOD BRIDGE': { lat: 54.966, lng: -1.673 }
};

// Geocode endpoint
router.get('/geocode', async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location parameter is required'
      });
    }

    console.log('📍 Geocoding request for:', location);

    // Check known locations first
    const upperLocation = location.toUpperCase().trim();
    for (const [key, coords] of Object.entries(knownLocations)) {
      if (upperLocation.includes(key)) {
        console.log('✅ Found in known locations:', key);
        return res.json({
          success: true,
          coordinates: coords,
          display_name: location,
          confidence: 90,
          source: 'known_locations'
        });
      }
    }

    // Try Mapbox geocoding first
    try {
      const searchQuery = encodeURIComponent(location);
      const bbox = NORTH_EAST_BBOX.join(',');
      
      const mapboxUrl = `${MAPBOX_GEOCODING_URL}/${searchQuery}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=gb&` +
        `bbox=${bbox}&` +
        `limit=5&` +
        `types=place,postcode,address,poi,neighborhood,locality`;
      
      const response = await fetch(mapboxUrl, { timeout: 5000 });

      if (response.ok) {
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // Find the best match within North East bounds
          const validFeatures = data.features.filter(feature => {
            const [lng, lat] = feature.center;
            return lat >= NORTH_EAST_BBOX[1] && lat <= NORTH_EAST_BBOX[3] &&
                   lng >= NORTH_EAST_BBOX[0] && lng <= NORTH_EAST_BBOX[2];
          });

          const bestMatch = validFeatures[0] || data.features[0];
          const [lng, lat] = bestMatch.center;
          
          // Calculate confidence
          let confidence = Math.round(bestMatch.relevance * 100);
          if (!validFeatures.length) {
            confidence = Math.max(confidence - 30, 10);
          }
          
          console.log(`✅ Mapbox geocoding successful: ${bestMatch.place_name}`);
          
          return res.json({
            success: true,
            coordinates: {
              lat: lat,
              lng: lng
            },
            display_name: bestMatch.place_name,
            confidence: confidence,
            source: 'mapbox',
            place_type: bestMatch.place_type[0],
            context: bestMatch.context
          });
        }
      }
    } catch (error) {
      console.error('Mapbox geocoding error:', error);
    }

    // Fallback to Nominatim
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', North East England, UK')}&format=json&limit=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Go-Barry-Traffic-System'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          console.log('✅ Nominatim geocoding successful (fallback)');
          
          return res.json({
            success: true,
            coordinates: {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            },
            display_name: result.display_name,
            confidence: 50,
            source: 'nominatim'
          });
        }
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
    }

    // Fallback response
    console.log('⚠️ Geocoding failed, returning approximate location');
    return res.json({
      success: true,
      coordinates: {
        lat: 54.978,
        lng: -1.617
      },
      display_name: location + ' (approximate)',
      confidence: 10,
      source: 'fallback'
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reverse geocode endpoint
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Lat and lng parameters are required'
      });
    }

    console.log('📍 Reverse geocoding request for:', lat, lng);

    // Try Mapbox reverse geocoding first
    try {
      const mapboxUrl = `${MAPBOX_GEOCODING_URL}/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=place,postcode,address,poi,neighborhood,locality&` +
        `limit=1`;
      
      const response = await fetch(mapboxUrl, { timeout: 5000 });

      if (response.ok) {
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          console.log('✅ Mapbox reverse geocoding successful');
          
          // Format the place name for UK context
          const parts = feature.place_name.split(',').map(p => p.trim());
          const relevantParts = parts.filter(part => 
            !part.includes('United Kingdom') && 
            !part.includes('England')
          ).slice(0, 3);
          
          return res.json({
            success: true,
            location: relevantParts.join(', '),
            full_address: feature.place_name,
            source: 'mapbox',
            place_type: feature.place_type[0]
          });
        }
      }
    } catch (error) {
      console.error('Mapbox reverse geocoding error:', error);
    }

    // Fallback to Nominatim
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Go-Barry-Traffic-System'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.display_name) {
          console.log('✅ Nominatim reverse geocoding successful (fallback)');
          
          // Simplify the display name for UK addresses
          const parts = data.display_name.split(',');
          const relevantParts = parts.slice(0, 3).map(p => p.trim());
          const simplifiedName = relevantParts.join(', ');
          
          return res.json({
            success: true,
            location: simplifiedName,
            full_address: data.display_name,
            source: 'nominatim'
          });
        }
      }
    } catch (error) {
      console.error('Nominatim reverse geocoding error:', error);
    }

    // Fallback response
    console.log('⚠️ Reverse geocoding failed, returning coordinates');
    return res.json({
      success: true,
      location: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`,
      source: 'fallback'
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Location search endpoint for autocomplete
router.get('/search-locations', async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        locations: []
      });
    }

    console.log('🔍 Location search for:', query);

    // Try Mapbox search
    try {
      const searchQuery = encodeURIComponent(query);
      const bbox = NORTH_EAST_BBOX.join(',');
      
      const mapboxUrl = `${MAPBOX_GEOCODING_URL}/${searchQuery}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=gb&` +
        `bbox=${bbox}&` +
        `limit=${limit}&` +
        `types=place,postcode,address,poi,neighborhood,locality&` +
        `autocomplete=true`;
      
      const response = await fetch(mapboxUrl, { timeout: 5000 });

      if (response.ok) {
        const data = await response.json();
        
        if (data.features) {
          const locations = data.features.map(feature => ({
            id: feature.id,
            name: feature.text,
            display_name: feature.place_name,
            coordinates: {
              lat: feature.center[1],
              lng: feature.center[0]
            },
            type: feature.place_type[0],
            relevance: feature.relevance
          }));
          
          console.log(`✅ Found ${locations.length} locations`);
          
          return res.json({
            success: true,
            locations,
            source: 'mapbox'
          });
        }
      }
    } catch (error) {
      console.error('Mapbox search error:', error);
    }

    // Fallback to empty results
    return res.json({
      success: true,
      locations: [],
      source: 'none'
    });

  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      locations: []
    });
  }
});

export default router;
