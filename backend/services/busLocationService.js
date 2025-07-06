import xml2js from 'xml2js';
import fetch from 'node-fetch';

class BusLocationService {
  constructor() {
    // Initialize parser with correct options for SIRI-VM
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
      attrkey: '$',
      charkey: '_'
    });
    
    // Caching optimized for live tracking accuracy
    this.cache = new Map();
    this.lastFetch = null;
    this.CACHE_DURATION = 15000; // 15 seconds for live accuracy balance
    this.fetchInProgress = false;
    
    // Stats tracking
    this.stats = {
      totalFetches: 0,
      successfulFetches: 0,
      failedFetches: 0,
      lastError: null,
      averageBusCount: 0
    };
  }

  // Extract the most accurate location from SIRI-VM data
  extractAccurateLocation(vehicleLocation, activity) {
    if (!vehicleLocation) {
      console.warn('⚠️ No vehicle location data');
      return { lat: 0, lon: 0 };
    }

    // Try different location formats for maximum accuracy
    let lat, lon;

    // Method 1: Direct coordinate fields (most common in SIRI-VM)
    if (vehicleLocation.Latitude && vehicleLocation.Longitude) {
      lat = parseFloat(vehicleLocation.Latitude.$?.value || vehicleLocation.Latitude);
      lon = parseFloat(vehicleLocation.Longitude.$?.value || vehicleLocation.Longitude);
    }
    
    // Method 2: Location coordinates (alternative format)
    else if (vehicleLocation.Coordinates) {
      const coords = vehicleLocation.Coordinates;
      lat = parseFloat(coords.Latitude?.$?.value || coords.Latitude);
      lon = parseFloat(coords.Longitude?.$?.value || coords.Longitude);
    }
    
    // Method 3: Activity-level location (fallback)
    else if (activity?.MonitoredVehicleJourney?.VehicleLocation) {
      const loc = activity.MonitoredVehicleJourney.VehicleLocation;
      lat = parseFloat(loc.Latitude?.$?.value || loc.Latitude);
      lon = parseFloat(loc.Longitude?.$?.value || loc.Longitude);
    }

    // Validate coordinates are within reasonable bounds for North East England
    const isValidLat = lat >= 54.0 && lat <= 56.0; // North East bounds
    const isValidLon = lon >= -3.0 && lon <= -0.5; // North East bounds

    if (!isValidLat || !isValidLon || isNaN(lat) || isNaN(lon)) {
      console.warn(`⚠️ Invalid coordinates: ${lat}, ${lon} - skipping bus`);
      return null; // Mark for filtering out
    }

    // Round to 6 decimal places for GPS accuracy (±0.11m)
    return {
      lat: Math.round(lat * 1000000) / 1000000,
      lon: Math.round(lon * 1000000) / 1000000
    };
  }

  // Extract bearing with validation
  extractBearing(journey) {
    let bearing = 0;
    
    // Try different bearing formats
    if (journey.Bearing !== undefined) {
      bearing = parseInt(journey.Bearing.$?.value || journey.Bearing);
    } else if (journey.VehicleLocation?.Bearing !== undefined) {
      bearing = parseInt(journey.VehicleLocation.Bearing.$?.value || journey.VehicleLocation.Bearing);
    }

    // Validate bearing (0-359 degrees)
    if (isNaN(bearing) || bearing < 0 || bearing >= 360) {
      bearing = 0; // Default to north if invalid
    }

    return bearing;
  }

  // Enhanced validation for live tracking accuracy
  isValidBusForLiveTracking(bus) {
    // Essential fields for live tracking
    if (!bus.id || !bus.location || !bus.operatorRef) {
      return false;
    }

    // Location validation
    if (!bus.location.lat || !bus.location.lon || 
        bus.location.lat === 0 || bus.location.lon === 0) {
      return false;
    }

    // North East England bounds check (stricter for live tracking)
    const isInNorthEast = 
      bus.location.lat >= 54.4 && bus.location.lat <= 55.8 &&
      bus.location.lon >= -2.2 && bus.location.lon <= -0.8;

    if (!isInNorthEast) {
      console.warn(`⚠️ Bus ${bus.id} outside North East bounds: ${bus.location.lat}, ${bus.location.lon}`);
      return false;
    }

    // Data freshness check - skip if data is too old
    if (bus.recordedAt) {
      const recordedTime = new Date(bus.recordedAt);
      const ageMinutes = (Date.now() - recordedTime.getTime()) / (1000 * 60);
      
      // Skip buses with location data older than 30 minutes
      if (ageMinutes > 30) {
        console.warn(`⚠️ Bus ${bus.id} data too old: ${ageMinutes.toFixed(1)} minutes`);
        return false;
      }
    }

    // Go North East operator check
    if (bus.operatorRef !== 'GNEL') {
      return false;
    }

    return true;
  }

  // Legacy validation method (keep for compatibility)
  isValidBus(bus) {
    return this.isValidBusForLiveTracking(bus);
  }

  // Generate mock bus data for development/testing
  generateMockBusData() {
    const routes = ['21', 'X21', '1', '56', '57', '58', 'Q3', '307', '27', 'X10'];
    const buses = [];
    
    // Newcastle/Gateshead area bounds
    const bounds = {
      north: 55.0184,
      south: 54.9045,
      east: -1.4876,
      west: -1.7297
    };
    
    const busCount = 20 + Math.floor(Math.random() * 10); // 20-30 buses
    
    for (let i = 0; i < busCount; i++) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lon = bounds.west + Math.random() * (bounds.east - bounds.west);
      const delayMinutes = Math.random() < 0.7 ? Math.floor(Math.random() * 10) : 0;
      const bearing = Math.floor(Math.random() * 360);
      
      buses.push({
        id: `mock-gne-${1000 + i}`,
        operatorRef: 'GNEL',
        lineRef: route,
        lineName: route,
        directionRef: Math.random() > 0.5 ? '1' : '2',
        directionName: Math.random() > 0.5 ? 'Inbound' : 'Outbound',
        destinationRef: `dest-${route}`,
        destinationName: `${route} ${Math.random() > 0.5 ? 'Newcastle' : 'Gateshead'}`,
        location: {
          lat: lat,
          lon: lon
        },
        bearing: bearing,
        blockRef: `block-${i}`,
        vehicleJourneyRef: `journey-${i}`,
        originRef: `origin-${route}`,
        originName: `${route} Start`,
        originAimedDeparture: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        delay: delayMinutes,
        status: delayMinutes > 5 ? 'delayed' : 'on-time',
        recordedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 300000).toISOString(), // Valid for 5 minutes
        occupancy: Math.random() < 0.5 ? 'seatsAvailable' : 'standingAvailable'
      });
    }
    
    // Update cache with mock data
    this.updateCache(buses);
    this.lastFetch = Date.now();
    
    console.log(`🎭 Generated ${buses.length} mock buses`);
    return buses;
  }

  async fetchBusLocations() {
    // Check if BODS API is configured - prioritize live data
    const hasBodsConfig = process.env.BODS_API_KEY && (process.env.BODS_GNE_DATAFEED_ID || process.env.BODS_API_URL);
    
    if (!hasBodsConfig) {
      console.warn('⚠️ BODS API not configured - cannot fetch live bus data');
      return []; // Return empty array instead of mock data
    }
    
    // Check if already fetching - return fresh cache if very recent
    if (this.fetchInProgress) {
      console.log('⏳ Fetch already in progress, returning cache');
      const cachedBuses = Array.from(this.cache.values());
      // Only return cache if it's less than 30 seconds old for live data
      const cacheAge = Date.now() - this.lastFetch;
      if (cacheAge < 30000 && cachedBuses.length > 0) {
        return cachedBuses;
      }
      // Otherwise wait briefly and try again for fresher data
      return cachedBuses;
    }
    
    // For live vehicle tracking, reduce cache time to prioritize accuracy
    const maxCacheAge = 15000; // 15 seconds for live tracking
    if (this.lastFetch && Date.now() - this.lastFetch < maxCacheAge) {
      const cachedBuses = Array.from(this.cache.values());
      if (cachedBuses.length > 0) {
        console.log(`🎯 Returning ${cachedBuses.length} buses from cache (${Math.round((Date.now() - this.lastFetch) / 1000)}s old)`);
        return cachedBuses;
      }
    }
    
    this.fetchInProgress = true;
    this.stats.totalFetches++;
    
    try {
      // Build URL with fallback for different BODS configurations
      let url;
      if (process.env.BODS_GNE_DATAFEED_ID) {
        // Use specific Go North East datafeed for highest accuracy
        url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/?api_key=${process.env.BODS_API_KEY}`;
        console.log('📡 Fetching from GNE-specific datafeed for maximum accuracy...');
      } else {
        // Fallback to general API with Go North East filter
        url = `${process.env.BODS_API_URL}datafeed/?api_key=${process.env.BODS_API_KEY}&operatorRef=GNEL&boundingBox=-2.5,54.5,-1.0,55.5`;
        console.log('📡 Fetching from general API with GNE filter...');
      }
      
      const response = await fetch(url, {
        timeout: 20000, // Reduced timeout for faster responses
        headers: {
          'User-Agent': 'Go-BARRY-LiveTracking/2.0',
          'Accept': 'application/xml, text/xml',
          'Accept-Encoding': 'gzip, deflate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`BODS API Error: ${response.status} ${response.statusText}`);
      }
      
      // Parse XML response
      const xml = await response.text();
      const data = await this.parser.parseStringPromise(xml);
      
      // Extract bus data
      const buses = this.extractBusData(data);
      
      // Update cache and stats
      this.updateCache(buses);
      this.lastFetch = Date.now();
      this.stats.successfulFetches++;
      this.stats.averageBusCount = 
        (this.stats.averageBusCount * (this.stats.successfulFetches - 1) + buses.length) 
        / this.stats.successfulFetches;
      
      console.log(`✅ Fetched ${buses.length} buses from BODS`);
      return buses;
      
    } catch (error) {
      this.stats.failedFetches++;
      this.stats.lastError = error.message;
      console.error('❌ BODS Fetch Error:', error.message);
      
      // Return cached data on error - NO MOCK DATA fallback for live system
      const cachedBuses = Array.from(this.cache.values());
      if (cachedBuses.length > 0) {
        console.warn(`⚠️ BODS API failed, returning ${cachedBuses.length} cached buses`);
        return cachedBuses;
      }
      
      // No fallback to mock data - return empty array if no live data available
      console.error('❌ No cached data available and BODS API failed - returning empty array');
      return [];
    } finally {
      this.fetchInProgress = false;
    }
  }

  extractBusData(siriData) {
    const buses = [];
    
    try {
      // Navigate SIRI-VM structure carefully
      const delivery = siriData?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery;
      if (!delivery) {
        console.warn('⚠️ No VehicleMonitoringDelivery in response');
        return buses;
      }
      
      // Handle single or multiple activities
      let vehicleActivities = delivery.VehicleActivity || [];
      if (!Array.isArray(vehicleActivities)) {
        vehicleActivities = [vehicleActivities];
      }
      
      // Process each vehicle
      vehicleActivities.forEach((activity, index) => {
        try {
          const journey = activity.MonitoredVehicleJourney;
          if (!journey) return;
          
          // Check if it's a Go North East bus - operator code is GNEL
          const operatorRef = journey.OperatorRef?.$?.value || journey.OperatorRef || '';
          const isGNE = operatorRef === 'GNEL';
          
          if (!isGNE) {
            // Skip non-GNE buses
            return;
          }
          
          // Extract bus data
          const bus = {
            // Unique identifier
            id: journey.VehicleRef?.$?.value || journey.VehicleRef || `unknown-${Date.now()}-${index}`,
            
            // Operator info
            operatorRef: operatorRef,
            
            // Service info
            lineRef: journey.LineRef?.$?.value || journey.LineRef || '',
            lineName: journey.PublishedLineName?.$?.value || journey.PublishedLineName || 'Unknown',
            directionRef: journey.DirectionRef?.$?.value || journey.DirectionRef || '0',
            directionName: journey.DirectionName?.$?.value || journey.DirectionName,
            
            // Destination
            destinationRef: journey.DestinationRef?.$?.value || journey.DestinationRef,
            destinationName: journey.DestinationName?.$?.value || journey.DestinationName || 'Unknown',
            
            // Position (mandatory fields) - Enhanced accuracy handling
            location: this.extractAccurateLocation(journey.VehicleLocation, activity),
            bearing: this.extractBearing(journey),
            
            // Journey references (for matching with timetables)
            blockRef: journey.BlockRef?.$?.value || journey.BlockRef,
            vehicleJourneyRef: journey.VehicleJourneyRef,
            
            // Origin info
            originRef: journey.OriginRef?.$?.value || journey.OriginRef,
            originName: journey.OriginName?.$?.value || journey.OriginName,
            originAimedDeparture: journey.OriginAimedDepartureTime,
            
            // Delay calculation
            delay: this.parseDelay(journey.Delay),
            
            // Status determination
            status: 'on-time', // Will calculate after
            
            // Metadata
            recordedAt: activity.RecordedAtTime,
            validUntil: activity.ValidUntilTime,
            
            // Optional fields
            occupancy: journey.Occupancy,
            vehicleFeatures: journey.VehicleFeatures
          };
          
          // Skip buses with invalid locations (null returned from extractAccurateLocation)
          if (!bus.location || bus.location === null) {
            return; // Invalid coordinates - skip this bus
          }
          
          // Calculate status based on delay
          bus.status = this.calculateStatus(bus.delay);
          
          // Enhanced validation for live tracking accuracy
          if (this.isValidBusForLiveTracking(bus)) {
            buses.push(bus);
          } else {
            console.warn(`⚠️ Invalid bus data for live tracking: ${bus.id}`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing vehicle ${index}:`, error.message);
        }
      });
      
    } catch (error) {
      console.error('❌ Bus extraction error:', error);
    }
    
    return buses;
  }

  // Parse SIRI delay format (ISO 8601 duration)
  parseDelay(delayString) {
    if (!delayString) return 0;
    
    // SIRI uses ISO 8601 duration format: PT5M30S = 5 minutes 30 seconds
    const match = delayString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  // Calculate status based on delay
  calculateStatus(delayMinutes) {
    if (delayMinutes > 10) return 'severely-delayed';
    if (delayMinutes > 5) return 'delayed';
    if (delayMinutes < -2) return 'early';
    return 'on-time';
  }

  // Validate bus has required fields
  isValidBus(bus) {
    // Check BODS mandatory fields
    return !!(
      bus.id &&
      bus.operatorRef === 'GNEL' &&  // Only Go North East
      bus.lineRef &&
      bus.location.lat &&
      bus.location.lon &&
      !isNaN(bus.location.lat) &&
      !isNaN(bus.location.lon) &&
      bus.location.lat >= 54.5 && bus.location.lat <= 55.5 &&  // Roughly North East England
      bus.location.lon >= -2.5 && bus.location.lon <= -1.2    // Extended westward for rural routes
    );
  }

  // Update cache
  updateCache(buses) {
    // Clear old cache
    this.cache.clear();
    
    // Add new buses
    buses.forEach(bus => {
      this.cache.set(bus.id, bus);
    });
    
    console.log(`📦 Cache updated with ${buses.length} buses`);
  }

  // Get service health status
  getHealth() {
    return {
      status: this.stats.failedFetches > 5 ? 'unhealthy' : 'healthy',
      stats: this.stats,
      cacheSize: this.cache.size,
      lastFetch: this.lastFetch ? new Date(this.lastFetch).toISOString() : null
    };
  }

  // Get specific bus by ID
  getBusById(vehicleId) {
    return this.cache.get(vehicleId);
  }

  // Get buses by line
  getBusesByLine(lineRef) {
    return Array.from(this.cache.values()).filter(bus => bus.lineRef === lineRef);
  }

  // API wrapper methods for compatibility
  async getBusLocations(forceRefresh = false) {
    try {
      if (forceRefresh) {
        this.lastFetch = null; // Force cache invalidation
      }
      
      const buses = await this.fetchBusLocations();
      return {
        success: true,
        data: buses,
        count: buses.length,
        cached: !forceRefresh && this.lastFetch && (Date.now() - this.lastFetch) < this.CACHE_DURATION,
        timestamp: this.lastFetch || Date.now(),
        dataSource: 'BODS API',
        dataQuality: 'live'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message,
        cached: false,
        timestamp: Date.now()
      };
    }
  }

  getStatistics() {
    const buses = Array.from(this.cache.values());
    const delayedBuses = buses.filter(bus => bus.delay > 5);
    const routeCounts = {};
    
    buses.forEach(bus => {
      if (bus.lineRef) {
        routeCounts[bus.lineRef] = (routeCounts[bus.lineRef] || 0) + 1;
      }
    });
    
    return {
      totalVehicles: buses.length,
      activeVehicles: buses.length, // All cached buses are considered active
      delayedVehicles: delayedBuses.length,
      uniqueRoutes: Object.keys(routeCounts).length,
      routeBreakdown: routeCounts,
      lastUpdate: this.lastFetch ? new Date(this.lastFetch).toISOString() : null,
      dataSource: 'BODS API',
      dataQuality: this.stats.successfulFetches > 0 ? 'live' : 'unavailable',
      apiHealth: this.getHealth()
    };
  }

  getConfiguration() {
    return {
      apiUrl: process.env.BODS_API_URL,
      datafeedId: process.env.BODS_GNE_DATAFEED_ID,
      updateInterval: this.CACHE_DURATION,
      operatorFilter: 'GONORTHEAST',
      maxBuses: 350,
      cacheEnabled: true,
      cacheDuration: this.CACHE_DURATION,
      isConfigured: !!(process.env.BODS_API_KEY && process.env.BODS_GNE_DATAFEED_ID)
    };
  }

  clearCache() {
    this.cache.clear();
    this.lastFetch = null;
    console.log('🧹 Bus location cache cleared');
  }

  // Initialize method for startup
  async initialize() {
    try {
      if (!process.env.BODS_API_KEY) {
        console.warn('⚠️ BODS_API_KEY not configured - bus locations unavailable');
        return { success: false, error: 'API key not configured' };
      }
      
      if (!process.env.BODS_GNE_DATAFEED_ID) {
        console.warn('⚠️ BODS_GNE_DATAFEED_ID not configured - using default');
      }
      
      // Do an initial fetch to test the connection
      const buses = await this.fetchBusLocations();
      console.log(`✅ Bus location service initialized with ${buses.length} buses`);
      
      return { success: true, busCount: buses.length };
    } catch (error) {
      console.error('❌ Bus location service initialization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Placeholder methods for API compatibility
  setDataSourcePreference(useSpecific) {
    // This service only uses BODS, so this is a no-op
    console.log(`ℹ️ Data source preference request ignored (BODS only)`);
  }

  getLastWebhookData() {
    // Webhooks not implemented yet
    return null;
  }

  async processBusDataWebhook(data) {
    // Webhook processing not implemented yet
    console.log('⚠️ Bus webhook processing not implemented');
    return { success: false, buses: [] };
  }
}

// Export singleton instance
export default new BusLocationService();
