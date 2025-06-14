// backend/services/enhancedGeocodingService.js
// Enhanced geocoding with multiple sources, caching, and UK-specific optimizations

import timeBasedPollingManager from './timeBasedPollingManager.js';

class EnhancedGeocodingService {
  constructor() {
    this.cache = new Map(); // Location cache to avoid repeated calls
    this.confidenceThresholds = {
      high: 0.9,      // 90%+ confidence
      medium: 0.7,    // 70%+ confidence  
      low: 0.5        // 50%+ confidence
    };
    
    this.ukBounds = {
      north: 60.861,   // Shetland Islands
      south: 49.864,   // Lizard Point
      east: 1.768,     // Norfolk
      west: -8.649     // Northern Ireland
    };
    
    this.geocodingAPIs = {
      nominatim: {
        name: 'OpenStreetMap Nominatim',
        url: 'https://nominatim.openstreetmap.org/search',
        reliability: 0.85,
        rateLimited: false,
        lastCall: 0,
        minimumInterval: 1000 // 1 second between calls (respectful)
      },
      here: {
        name: 'HERE Geocoding',
        url: 'https://geocode.search.hereapi.com/v1/geocode',
        reliability: 0.9,
        rateLimited: true,
        lastCall: 0,
        minimumInterval: 90000 // 1.5 minutes (same as HERE traffic)
      }
    };
    
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.maxCacheSize = 10000; // Maximum cached locations
  }

  // Main geocoding method with multiple sources and caching
  async geocodeLocation(location, sourceHint = null) {
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid location provided',
        confidence: 0
      };
    }

    const normalizedLocation = this.normalizeLocationString(location);
    const cacheKey = this.generateCacheKey(normalizedLocation);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log(`📍 Geocoding cache hit for: ${normalizedLocation}`);
      return cached;
    }

    console.log(`🌍 Geocoding location: ${normalizedLocation}`);
    
    try {
      // Try multiple geocoding sources
      const results = await this.tryMultipleGeocodingSources(normalizedLocation, sourceHint);
      
      if (results.length === 0) {
        return {
          success: false,
          error: 'No geocoding results found',
          confidence: 0,
          originalLocation: location
        };
      }

      // Select best result and calculate confidence
      const bestResult = this.selectBestGeocodingResult(results);
      const enhancedResult = this.enhanceGeocodingResult(bestResult, normalizedLocation);
      
      // Cache the result
      this.cacheResult(cacheKey, enhancedResult);
      
      console.log(`✅ Geocoded "${normalizedLocation}" → ${enhancedResult.coordinates} (confidence: ${enhancedResult.confidence})`);
      
      return enhancedResult;
      
    } catch (error) {
      console.error(`❌ Geocoding failed for "${normalizedLocation}":`, error.message);
      return {
        success: false,
        error: error.message,
        confidence: 0,
        originalLocation: location
      };
    }
  }

  // Try multiple geocoding sources in order of preference
  async tryMultipleGeocodingSources(location, sourceHint) {
    const results = [];
    const sources = Object.keys(this.geocodingAPIs);
    
    // Prioritize source hint if provided
    if (sourceHint && this.geocodingAPIs[sourceHint]) {
      sources.unshift(sourceHint);
    }

    for (const source of sources) {
      try {
        const result = await this.geocodeWithSource(location, source);
        if (result) {
          results.push({ ...result, source });
        }
      } catch (error) {
        console.warn(`⚠️ Geocoding failed with ${source}:`, error.message);
      }
      
      // Stop if we have a high-confidence result
      if (results.length > 0 && results[results.length - 1].confidence >= this.confidenceThresholds.high) {
        break;
      }
    }

    return results;
  }

  // Geocode with specific source
  async geocodeWithSource(location, source) {
    const api = this.geocodingAPIs[source];
    if (!api) return null;

    // Check rate limiting
    if (api.rateLimited) {
      const pollCheck = timeBasedPollingManager.canPollSource('geocoding_' + source);
      if (!pollCheck.allowed) {
        console.log(`⏳ Geocoding source ${source} rate limited: ${pollCheck.reason}`);
        return null;
      }
    } else {
      // Basic rate limiting for free services
      const now = Date.now();
      if (now - api.lastCall < api.minimumInterval) {
        return null;
      }
      api.lastCall = now;
    }

    try {
      let result;
      
      if (source === 'nominatim') {
        result = await this.geocodeWithNominatim(location);
      } else if (source === 'here') {
        result = await this.geocodeWithHERE(location);
      }
      
      if (api.rateLimited) {
        timeBasedPollingManager.recordPoll('geocoding_' + source, true);
      }
      
      return result;
      
    } catch (error) {
      if (api.rateLimited) {
        timeBasedPollingManager.recordPoll('geocoding_' + source, false);
      }
      throw error;
    }
  }

  // Geocode with OpenStreetMap Nominatim (free, reliable)
  async geocodeWithNominatim(location) {
    const ukEnhancedLocation = this.enhanceLocationForUK(location);
    const params = new URLSearchParams({
      q: ukEnhancedLocation,
      format: 'json',
      countrycodes: 'gb',
      limit: '5',
      'accept-language': 'en',
      addressdetails: '1',
      bounded: '1',
      viewbox: `${this.ukBounds.west},${this.ukBounds.south},${this.ukBounds.east},${this.ukBounds.north}`
    });

    const response = await fetch(`${this.geocodingAPIs.nominatim.url}?${params}`, {
      headers: {
        'User-Agent': 'Go-BARRY-Traffic-Intelligence/3.0 (traffic@gobarry.co.uk)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.length === 0) return null;

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      confidence: this.calculateNominatimConfidence(result, location),
      components: result.address || {},
      source: 'nominatim'
    };
  }

  // Geocode with HERE API (paid, high accuracy)
  async geocodeWithHERE(location) {
    if (!process.env.HERE_API_KEY) {
      throw new Error('HERE API key not available');
    }

    const ukEnhancedLocation = this.enhanceLocationForUK(location);
    const params = new URLSearchParams({
      q: ukEnhancedLocation,
      'in': 'countryCode:GBR',
      limit: '5',
      apiKey: process.env.HERE_API_KEY
    });

    const response = await fetch(`${this.geocodingAPIs.here.url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HERE API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) return null;

    const result = data.items[0];
    return {
      latitude: result.position.lat,
      longitude: result.position.lng,
      formattedAddress: result.title,
      confidence: this.calculateHEREConfidence(result, location),
      components: result.address || {},
      source: 'here'
    };
  }

  // Enhance location string for UK geocoding
  enhanceLocationForUK(location) {
    let enhanced = location.trim();
    
    // Add common UK suffixes if missing
    const ukSuffixes = [', UK', ', United Kingdom', ', England', ', Scotland', ', Wales', ', Northern Ireland'];
    const hasUKSuffix = ukSuffixes.some(suffix => enhanced.toLowerCase().includes(suffix.toLowerCase()));
    
    if (!hasUKSuffix) {
      enhanced += ', UK';
    }

    // Enhance common road names
    enhanced = enhanced
      .replace(/\bA(\d+)\b/g, 'A$1 road')  // A1 → A1 road
      .replace(/\bM(\d+)\b/g, 'M$1 motorway')  // M25 → M25 motorway
      .replace(/\bB(\d+)\b/g, 'B$1 road');  // B1234 → B1234 road

    return enhanced;
  }

  // Calculate confidence for Nominatim results
  calculateNominatimConfidence(result, originalLocation) {
    let confidence = 0.7; // Base confidence for Nominatim
    
    // Boost confidence based on result type
    if (result.class === 'highway') confidence += 0.1;
    if (result.class === 'place') confidence += 0.05;
    
    // Boost if within UK bounds
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (this.isWithinUKBounds(lat, lon)) confidence += 0.1;
    
    // Boost based on address detail completeness
    if (result.address) {
      const addressFields = ['road', 'city', 'postcode', 'county'];
      const fieldsPresent = addressFields.filter(field => result.address[field]).length;
      confidence += (fieldsPresent / addressFields.length) * 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  // Calculate confidence for HERE results
  calculateHEREConfidence(result, originalLocation) {
    let confidence = 0.8; // Base confidence for HERE (commercial service)
    
    // Boost based on result scoring
    if (result.scoring && result.scoring.queryScore) {
      confidence += result.scoring.queryScore * 0.2;
    }
    
    // Boost if exact match type
    if (result.resultType === 'houseNumber') confidence += 0.1;
    if (result.resultType === 'street') confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  // Check if coordinates are within UK bounds
  isWithinUKBounds(lat, lon) {
    return lat >= this.ukBounds.south && 
           lat <= this.ukBounds.north && 
           lon >= this.ukBounds.west && 
           lon <= this.ukBounds.east;
  }

  // Select best result from multiple geocoding attempts
  selectBestGeocodingResult(results) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];

    // Sort by confidence and source reliability
    return results.sort((a, b) => {
      const aScore = a.confidence * (this.geocodingAPIs[a.source]?.reliability || 0.5);
      const bScore = b.confidence * (this.geocodingAPIs[b.source]?.reliability || 0.5);
      return bScore - aScore;
    })[0];
  }

  // Enhance final geocoding result
  enhanceGeocodingResult(result, originalLocation) {
    if (!result) {
      return {
        success: false,
        error: 'No valid geocoding result',
        confidence: 0
      };
    }

    return {
      success: true,
      coordinates: [result.latitude, result.longitude],
      formattedAddress: result.formattedAddress,
      confidence: result.confidence,
      confidenceLevel: this.getConfidenceLevel(result.confidence),
      source: result.source,
      components: result.components,
      withinUKBounds: this.isWithinUKBounds(result.latitude, result.longitude),
      originalLocation,
      geocodingTimestamp: new Date().toISOString()
    };
  }

  // Get confidence level description
  getConfidenceLevel(confidence) {
    if (confidence >= this.confidenceThresholds.high) return 'high';
    if (confidence >= this.confidenceThresholds.medium) return 'medium';
    if (confidence >= this.confidenceThresholds.low) return 'low';
    return 'very_low';
  }

  // Normalize location string for consistent caching
  normalizeLocationString(location) {
    return location
      .toLowerCase()
      .trim()
      .replace(/[^\w\s,.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Generate cache key
  generateCacheKey(normalizedLocation) {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < normalizedLocation.length; i++) {
      const char = normalizedLocation.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `geocode_${hash}`;
  }

  // Get cached result if valid
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(cacheKey);
      return null;
    }

    return { ...cached.result, fromCache: true };
  }

  // Cache geocoding result
  cacheResult(cacheKey, result) {
    // Manage cache size
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entries (FIFO)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      result: { ...result, fromCache: false },
      timestamp: Date.now()
    });
  }

  // Batch geocode multiple locations efficiently
  async batchGeocode(locations, sourceHint = null) {
    console.log(`🌍 Batch geocoding ${locations.length} locations...`);
    
    const results = [];
    const batchSize = 5; // Process in small batches to respect rate limits
    
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      const batchPromises = batch.map(location => this.geocodeLocation(location, sourceHint));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Batch geocoding failed',
            originalLocation: batch[index],
            confidence: 0
          });
        }
      });
      
      // Brief pause between batches to respect rate limits
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Batch geocoding complete: ${results.filter(r => r.success).length}/${locations.length} successful`);
    
    return results;
  }

  // Get geocoding service statistics
  getStatistics() {
    const cacheStats = {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };

    const apiStats = Object.entries(this.geocodingAPIs).map(([name, api]) => ({
      name: api.name,
      reliability: api.reliability,
      rateLimited: api.rateLimited,
      lastCall: api.lastCall ? new Date(api.lastCall).toISOString() : null
    }));

    return {
      cache: cacheStats,
      apis: apiStats,
      thresholds: this.confidenceThresholds,
      ukBounds: this.ukBounds
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Geocoding cache cleared');
  }
}

// Create singleton instance
const enhancedGeocodingService = new EnhancedGeocodingService();

export default enhancedGeocodingService;
