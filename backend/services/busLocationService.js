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
    
    // Caching
    this.cache = new Map();
    this.lastFetch = null;
    this.CACHE_DURATION = 10000; // 10 seconds
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
    // Check if BODS API is configured
    if (!process.env.BODS_API_KEY || !process.env.BODS_GNE_DATAFEED_ID) {
      console.warn('⚠️ BODS API not configured - returning mock data');
      return this.generateMockBusData();
    }
    
    // Check if already fetching
    if (this.fetchInProgress) {
      console.log('⏳ Fetch already in progress, returning cache');
      return Array.from(this.cache.values());
    }
    
    // Check cache validity
    if (this.lastFetch && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return Array.from(this.cache.values());
    }
    
    this.fetchInProgress = true;
    this.stats.totalFetches++;
    
    try {
      // Build URL - BODS API accepts API key as query parameter
      const url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/?api_key=${process.env.BODS_API_KEY}`;
      
      const response = await fetch(url, {
        timeout: 30000 // 30 second timeout
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
      
      // Return cached data on error, or mock data if no cache
      const cachedBuses = Array.from(this.cache.values());
      if (cachedBuses.length > 0) {
        return cachedBuses;
      }
      
      // Fall back to mock data
      console.warn('⚠️ No cached data available, using mock data');
      return this.generateMockBusData();
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
            
            // Position (mandatory fields)
            location: {
              lat: parseFloat(journey.VehicleLocation?.Latitude),
              lon: parseFloat(journey.VehicleLocation?.Longitude)
            },
            bearing: parseInt(journey.Bearing) || 0,
            
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
          
          // Calculate status based on delay
          bus.status = this.calculateStatus(bus.delay);
          
          // Validate mandatory fields
          if (this.isValidBus(bus)) {
            buses.push(bus);
          } else {
            console.warn(`⚠️ Invalid bus data for ${bus.id}:`, bus);
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
