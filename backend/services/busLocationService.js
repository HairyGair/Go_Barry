import xml2js from 'xml2js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class BusLocationService {
  constructor() {
    // Initialize parser with correct options
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
      attrkey: '$',
      charkey: '_'
    });
    
    // Setup caching
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

  // Main fetch method with error handling
  async fetchBusLocations() {
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
      // Make API request with query parameter auth
      const url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/?api_key=${process.env.BODS_API_KEY}`;
      const response = await fetch(url, {
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`BODS API Error: ${response.status} ${response.statusText}`);
      }
      
      // Parse response
      const xml = await response.text();
      const data = await this.parser.parseStringPromise(xml);
      
      // Extract and process bus data
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
      
      // Return cached data on error
      return Array.from(this.cache.values());
    } finally {
      this.fetchInProgress = false;
    }
  }

  // Extract bus data from SIRI-VM XML
  extractBusData(siriData) {
    const buses = [];
    
    try {
      // Navigate SIRI-VM structure
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
          
          // Extract bus data (fixing based on actual XML structure)
          const bus = {
            // Unique identifier
            id: journey.VehicleRef || `unknown-${Date.now()}-${index}`,
            
            // Operator info - GNEL not GONORTHEAST
            operatorRef: journey.OperatorRef || 'GNEL',
            
            // Service info
            lineRef: journey.LineRef || '',
            lineName: journey.PublishedLineName || journey.LineRef || 'Unknown',
            directionRef: journey.DirectionRef || '0',
            directionName: journey.DirectionName,
            
            // Destination - handle underscore format
            destinationRef: journey.DestinationRef,
            destinationName: this.formatDestinationName(journey.DestinationName || 'Unknown'),
            
            // Position (mandatory fields)
            location: {
              lat: parseFloat(journey.VehicleLocation?.Latitude),
              lon: parseFloat(journey.VehicleLocation?.Longitude)
            },
            bearing: parseInt(journey.Bearing) || 0,
            
            // Journey references
            blockRef: journey.BlockRef,
            vehicleJourneyRef: journey.VehicleJourneyRef,
            
            // Timing info
            originRef: journey.OriginRef,
            originName: journey.OriginName,
            originAimedDeparture: journey.OriginAimedDepartureTime,
            
            // Delay calculation - check different possible fields
            delay: this.parseDelay(journey),
            
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

  // Format destination names (remove underscores, fix casing)
  formatDestinationName(name) {
    if (!name) return 'Unknown';
    
    // Replace underscores with spaces
    let formatted = name.replace(/_/g, ' ');
    
    // Remove trailing stand indicators
    formatted = formatted.replace(/\s+Stand\s+[A-Z]\s*$/i, '');
    
    // Proper case
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted;
  }

  // Parse delay from various possible fields
  parseDelay(journey) {
    // Check for Delay field in ISO 8601 duration format
    if (journey.Delay) {
      // SIRI uses ISO 8601 duration format: PT5M30S = 5 minutes 30 seconds
      const match = journey.Delay.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        return hours * 60 + minutes + Math.round(seconds / 60);
      }
    }
    
    // Check for ProgressStatus
    if (journey.ProgressStatus) {
      // Some BODS feeds use ProgressStatus instead
      if (journey.ProgressStatus === 'early') return -2;
      if (journey.ProgressStatus === 'onTime') return 0;
      if (journey.ProgressStatus === 'delayed') return 5;
    }
    
    // Check for calculated delay from aimed vs expected times
    if (journey.AimedDepartureTime && journey.ExpectedDepartureTime) {
      const aimed = new Date(journey.AimedDepartureTime);
      const expected = new Date(journey.ExpectedDepartureTime);
      const delayMs = expected - aimed;
      return Math.round(delayMs / 60000); // Convert to minutes
    }
    
    // Default to on-time if no delay info
    return 0;
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
    // Check mandatory fields
    return !!(
      bus.id &&
      bus.operatorRef &&
      bus.lineRef &&
      bus.location.lat &&
      bus.location.lon &&
      !isNaN(bus.location.lat) &&
      !isNaN(bus.location.lon) &&
      bus.location.lat >= -90 && bus.location.lat <= 90 &&
      bus.location.lon >= -180 && bus.location.lon <= 180
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
}

// Export singleton instance
export default new BusLocationService();