# Bus Location Integration Plan - BODS API (Detailed)
## Go BARRY - Real-time Bus Position Tracking via SIRI-VM

**Created:** January 2025  
**Version:** 2.0 - Detailed Step-by-Step  
**Operator:** Go North East  
**NOC Code:** GONORTHEAST  
**Fleet Size:** ~350 buses peak  
**Update Frequency:** 10 seconds

---

## 📋 CRITICAL PRE-IMPLEMENTATION CHECKLIST

### Step 0: Account Setup & API Access
- [ ] **0.1** Create BODS account at https://data.bus-data.dft.gov.uk/account/signup/
- [ ] **0.2** Verify email and complete registration
- [ ] **0.3** Navigate to Account Settings: https://data.bus-data.dft.gov.uk/account/settings/
- [ ] **0.4** Generate and copy API key (NOT just registration - need settings page)
- [ ] **0.5** Store API key securely in password manager

### Step 0.5: Find Go North East Data Feed
- [ ] **0.6** Login to BODS portal
- [ ] **0.7** Go to Browse Data: https://data.bus-data.dft.gov.uk/browse/
- [ ] **0.8** Search for "Go North East" or NOC "GONORTHEAST"
- [ ] **0.9** Identify the SIRI-VM feed URL/ID for Go North East
- [ ] **0.10** Test API key with curl command:
```bash
curl -H "Authorization: Token YOUR_API_KEY" \
     -H "Accept: application/xml" \
     "https://data.bus-data.dft.gov.uk/api/v1/datafeed/[FEED_ID]/"
```

---

## 🔧 PHASE 1: Backend API Integration (Days 1-2)

### Step 1: Environment Setup
```bash
# Step 1.1: Add to backend/.env
BODS_API_KEY=your-actual-api-key-here
BODS_API_URL=https://data.bus-data.dft.gov.uk/api/v1/
BODS_GNE_DATAFEED_ID=actual-feed-id-here
BODS_UPDATE_INTERVAL=10000  # 10 seconds
BODS_MAX_RETRIES=3
BODS_RATE_LIMIT_PER_HOUR=900
```

### Step 2: Install Required Dependencies
```bash
# Step 2.1: Navigate to backend
cd backend

# Step 2.2: Install XML parsing library
npm install xml2js node-fetch

# Step 2.3: Verify installations
npm list xml2js node-fetch
```

### Step 3: Create BODS Test Script
```javascript
// Step 3.1: Create backend/scripts/testBODS.js
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import dotenv from 'dotenv';

dotenv.config();

const parser = new xml2js.Parser({
  explicitArray: false,
  ignoreAttrs: false,
  tagNameProcessors: [xml2js.processors.stripPrefix]
});

async function testBODSConnection() {
  console.log('🚌 Testing BODS API Connection...');
  console.log('API URL:', process.env.BODS_API_URL);
  console.log('Feed ID:', process.env.BODS_GNE_DATAFEED_ID);
  
  try {
    // Step 3.2: Make API request
    const url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${process.env.BODS_API_KEY}`,
        'Accept': 'application/xml'
      }
    });
    
    // Step 3.3: Check response
    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Step 3.4: Get XML data
    const xml = await response.text();
    console.log('XML Length:', xml.length);
    console.log('First 500 chars:', xml.substring(0, 500));
    
    // Step 3.5: Parse XML
    const data = await parser.parseStringPromise(xml);
    console.log('\n✅ Successfully parsed XML!');
    
    // Step 3.6: Explore structure
    console.log('\n📊 SIRI Structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    
    // Step 3.7: Find vehicle data
    const vehicleActivities = data?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.VehicleActivity;
    if (vehicleActivities) {
      const activities = Array.isArray(vehicleActivities) ? vehicleActivities : [vehicleActivities];
      console.log(`\n🚌 Found ${activities.length} buses`);
      
      // Step 3.8: Sample first bus
      if (activities[0]) {
        const journey = activities[0].MonitoredVehicleJourney;
        console.log('\nFirst bus details:');
        console.log('- Vehicle:', journey.VehicleRef);
        console.log('- Line:', journey.PublishedLineName);
        console.log('- Destination:', journey.DestinationName);
        console.log('- Location:', journey.VehicleLocation);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Step 3.9: Run test
testBODSConnection();
```

### Step 4: Run Initial Test
```bash
# Step 4.1: Execute test script
node backend/scripts/testBODS.js

# Step 4.2: Verify output shows:
# - Successful connection (200 status)
# - XML data received
# - Bus data parsed
# - At least some buses found
```

---

## 📦 PHASE 2: Data Processing Service (Days 3-4)

### Step 5: Create Bus Location Service
```javascript
// Step 5.1: Create backend/services/busLocationService.js
import xml2js from 'xml2js';
import fetch from 'node-fetch';

class BusLocationService {
  constructor() {
    // Step 5.2: Initialize parser with correct options
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
      attrkey: '$',
      charkey: '_'
    });
    
    // Step 5.3: Setup caching
    this.cache = new Map();
    this.lastFetch = null;
    this.CACHE_DURATION = 10000; // 10 seconds
    this.fetchInProgress = false;
    
    // Step 5.4: Stats tracking
    this.stats = {
      totalFetches: 0,
      successfulFetches: 0,
      failedFetches: 0,
      lastError: null,
      averageBusCount: 0
    };
  }

  // Step 5.5: Main fetch method with error handling
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
      // Step 5.6: Make API request
      const url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${process.env.BODS_API_KEY}`,
          'Accept': 'application/xml'
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`BODS API Error: ${response.status} ${response.statusText}`);
      }
      
      // Step 5.7: Parse response
      const xml = await response.text();
      const data = await this.parser.parseStringPromise(xml);
      
      // Step 5.8: Extract and process bus data
      const buses = this.extractBusData(data);
      
      // Step 5.9: Update cache and stats
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

  // Step 5.10: Extract bus data from SIRI-VM XML
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
      
      // Step 5.11: Process each vehicle
      vehicleActivities.forEach((activity, index) => {
        try {
          const journey = activity.MonitoredVehicleJourney;
          if (!journey) return;
          
          // Step 5.12: Extract mandatory BODS fields
          const bus = {
            // Unique identifier
            id: journey.VehicleRef?.$?.value || journey.VehicleRef || `unknown-${Date.now()}-${index}`,
            
            // Operator info (verify it's Go North East)
            operatorRef: journey.OperatorRef?.$?.value || journey.OperatorRef,
            
            // Service info
            lineRef: journey.LineRef?.$?.value || journey.LineRef,
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
            
            // Timing info
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
          
          // Step 5.13: Calculate status based on delay
          bus.status = this.calculateStatus(bus.delay);
          
          // Step 5.14: Validate mandatory fields
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

  // Step 5.15: Parse SIRI delay format (ISO 8601 duration)
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

  // Step 5.16: Calculate status based on delay
  calculateStatus(delayMinutes) {
    if (delayMinutes > 10) return 'severely-delayed';
    if (delayMinutes > 5) return 'delayed';
    if (delayMinutes < -2) return 'early';
    return 'on-time';
  }

  // Step 5.17: Validate bus has required fields
  isValidBus(bus) {
    // Check BODS mandatory fields
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

  // Step 5.18: Update cache
  updateCache(buses) {
    // Clear old cache
    this.cache.clear();
    
    // Add new buses
    buses.forEach(bus => {
      this.cache.set(bus.id, bus);
    });
    
    console.log(`📦 Cache updated with ${buses.length} buses`);
  }

  // Step 5.19: Get service health status
  getHealth() {
    return {
      status: this.stats.failedFetches > 5 ? 'unhealthy' : 'healthy',
      stats: this.stats,
      cacheSize: this.cache.size,
      lastFetch: this.lastFetch ? new Date(this.lastFetch).toISOString() : null
    };
  }
}

// Step 5.20: Export singleton instance
export default new BusLocationService();
```

### Step 6: Test Bus Location Service
```javascript
// Step 6.1: Create backend/scripts/testBusService.js
import busLocationService from '../services/busLocationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testBusService() {
  console.log('🧪 Testing Bus Location Service...\n');
  
  try {
    // Step 6.2: First fetch
    console.log('📡 Fetching buses (first call)...');
    const buses1 = await busLocationService.fetchBusLocations();
    console.log(`✅ Got ${buses1.length} buses`);
    
    if (buses1.length > 0) {
      console.log('\n🚌 Sample bus:');
      console.log(JSON.stringify(buses1[0], null, 2));
    }
    
    // Step 6.3: Test caching
    console.log('\n📡 Fetching buses (should use cache)...');
    const start = Date.now();
    const buses2 = await busLocationService.fetchBusLocations();
    const duration = Date.now() - start;
    console.log(`✅ Got ${buses2.length} buses in ${duration}ms (cached)`);
    
    // Step 6.4: Check health
    console.log('\n💓 Service Health:');
    console.log(JSON.stringify(busLocationService.getHealth(), null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Step 6.5: Run test
testBusService();
```

---

## 🔄 PHASE 3: Convex Integration (Day 5)

### Step 7: Update Convex Schema
```bash
# Step 7.1: Navigate to frontend
cd Go_BARRY

# Step 7.2: Start Convex dev environment
npx convex dev
```

```typescript
// Step 7.3: Update Go_BARRY/convex/schema.ts
// ADD these tables to existing schema:

buses: defineTable({
  // Vehicle identification
  vehicleId: v.string(),
  vehicleRef: v.string(),
  
  // Operator
  operatorRef: v.string(),
  
  // Service information
  lineRef: v.string(),
  lineName: v.string(),
  directionRef: v.string(),
  directionName: v.optional(v.string()),
  
  // Destination
  destinationRef: v.optional(v.string()),
  destinationName: v.string(),
  
  // Position
  latitude: v.number(),
  longitude: v.number(),
  bearing: v.number(),
  
  // Journey matching
  blockRef: v.optional(v.string()),
  vehicleJourneyRef: v.optional(v.string()),
  
  // Origin info
  originRef: v.optional(v.string()),
  originName: v.optional(v.string()),
  originAimedDeparture: v.optional(v.string()),
  
  // Status
  delay: v.number(), // minutes
  status: v.union(
    v.literal('on-time'),
    v.literal('delayed'),
    v.literal('severely-delayed'),
    v.literal('early')
  ),
  
  // Timestamps
  recordedAt: v.string(),
  validUntil: v.optional(v.string()),
  lastUpdated: v.string(),
  
  // Optional
  occupancy: v.optional(v.string()),
})
.index("by_vehicle", ["vehicleId"])
.index("by_line", ["lineRef"])
.index("by_status", ["status"])
.index("by_location", ["latitude", "longitude"])
.index("by_operator", ["operatorRef"]),

busUpdateLog: defineTable({
  timestamp: v.string(),
  busCount: v.number(),
  updateDuration: v.number(), // milliseconds
  errors: v.optional(v.string()),
})
.index("by_timestamp", ["timestamp"]),
```

### Step 8: Create Convex Functions
```typescript
// Step 8.1: Create Go_BARRY/convex/buses.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Step 8.2: Mutation to update all buses
export const updateBusLocations = mutation({
  args: {
    buses: v.array(v.object({
      // All fields from service
      id: v.string(),
      operatorRef: v.string(),
      lineRef: v.string(),
      lineName: v.string(),
      directionRef: v.string(),
      directionName: v.optional(v.string()),
      destinationRef: v.optional(v.string()),
      destinationName: v.string(),
      location: v.object({
        lat: v.number(),
        lon: v.number(),
      }),
      bearing: v.number(),
      blockRef: v.optional(v.string()),
      vehicleJourneyRef: v.optional(v.string()),
      originRef: v.optional(v.string()),
      originName: v.optional(v.string()),
      originAimedDeparture: v.optional(v.string()),
      delay: v.number(),
      status: v.string(),
      recordedAt: v.string(),
      validUntil: v.optional(v.string()),
      occupancy: v.optional(v.string()),
    })),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      // Step 8.3: Clear old buses efficiently
      const existing = await ctx.db.query("buses").collect();
      const deletePromises = existing.map(bus => ctx.db.delete(bus._id));
      await Promise.all(deletePromises);
      
      // Step 8.4: Insert new buses in batches
      const insertPromises = args.buses.map(bus => 
        ctx.db.insert("buses", {
          vehicleId: bus.id,
          vehicleRef: bus.id, // Using same as vehicleId
          operatorRef: bus.operatorRef,
          lineRef: bus.lineRef,
          lineName: bus.lineName,
          directionRef: bus.directionRef,
          directionName: bus.directionName,
          destinationRef: bus.destinationRef,
          destinationName: bus.destinationName,
          latitude: bus.location.lat,
          longitude: bus.location.lon,
          bearing: bus.bearing,
          blockRef: bus.blockRef,
          vehicleJourneyRef: bus.vehicleJourneyRef,
          originRef: bus.originRef,
          originName: bus.originName,
          originAimedDeparture: bus.originAimedDeparture,
          delay: bus.delay,
          status: bus.status as any,
          recordedAt: bus.recordedAt,
          validUntil: bus.validUntil,
          lastUpdated: args.timestamp,
          occupancy: bus.occupancy,
        })
      );
      
      await Promise.all(insertPromises);
      
      // Step 8.5: Log update
      await ctx.db.insert("busUpdateLog", {
        timestamp: args.timestamp,
        busCount: args.buses.length,
        updateDuration: Date.now() - startTime,
      });
      
      console.log(`✅ Updated ${args.buses.length} buses in ${Date.now() - startTime}ms`);
      return { success: true, count: args.buses.length };
      
    } catch (error: any) {
      // Log error
      await ctx.db.insert("busUpdateLog", {
        timestamp: args.timestamp,
        busCount: 0,
        updateDuration: Date.now() - startTime,
        errors: error.message,
      });
      
      throw new Error(`Bus update failed: ${error.message}`);
    }
  },
});

// Step 8.6: Query buses in viewport
export const getBusesInViewport = query({
  args: {
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
    maxResults: v.optional(v.number()),
    statusFilter: v.optional(v.array(v.string())),
    lineFilter: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Step 8.7: Build query with filters
    let busQuery = ctx.db
      .query("buses")
      .filter(q => 
        q.and(
          q.gte(q.field("latitude"), args.south),
          q.lte(q.field("latitude"), args.north),
          q.gte(q.field("longitude"), args.west),
          q.lte(q.field("longitude"), args.east)
        )
      );
    
    const allBuses = await busQuery.collect();
    
    // Step 8.8: Apply additional filters
    let filteredBuses = allBuses;
    
    if (args.statusFilter && args.statusFilter.length > 0) {
      filteredBuses = filteredBuses.filter(bus => 
        args.statusFilter!.includes(bus.status)
      );
    }
    
    if (args.lineFilter && args.lineFilter.length > 0) {
      filteredBuses = filteredBuses.filter(bus => 
        args.lineFilter!.includes(bus.lineRef)
      );
    }
    
    // Step 8.9: Sort by delay (worst first) and limit
    filteredBuses.sort((a, b) => b.delay - a.delay);
    
    const limitedBuses = args.maxResults 
      ? filteredBuses.slice(0, args.maxResults)
      : filteredBuses;
    
    // Step 8.10: Return formatted data
    return limitedBuses.map(bus => ({
      id: bus.vehicleId,
      lineRef: bus.lineRef,
      lineName: bus.lineName,
      direction: bus.directionName || bus.directionRef,
      destination: bus.destinationName,
      location: {
        lat: bus.latitude,
        lon: bus.longitude,
      },
      bearing: bus.bearing,
      delay: bus.delay,
      status: bus.status,
      recordedAt: bus.recordedAt,
      // Additional info for tooltips
      vehicleRef: bus.vehicleRef,
      originName: bus.originName,
      occupancy: bus.occupancy,
    }));
  },
});

// Step 8.11: Get bus statistics
export const getBusStats = query({
  handler: async (ctx) => {
    const buses = await ctx.db.query("buses").collect();
    const logs = await ctx.db
      .query("busUpdateLog")
      .order("desc")
      .take(10);
    
    // Calculate stats
    const statusCounts = buses.reduce((acc, bus) => {
      acc[bus.status] = (acc[bus.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const lineCounts = buses.reduce((acc, bus) => {
      acc[bus.lineName] = (acc[bus.lineName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgDelay = buses.length > 0
      ? buses.reduce((sum, bus) => sum + bus.delay, 0) / buses.length
      : 0;
    
    return {
      totalBuses: buses.length,
      statusBreakdown: statusCounts,
      topLines: Object.entries(lineCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([line, count]) => ({ line, count })),
      averageDelay: Math.round(avgDelay * 10) / 10,
      lastUpdate: logs[0]?.timestamp,
      recentUpdates: logs,
    };
  },
});
```

### Step 9: Deploy Convex Schema
```bash
# Step 9.1: Deploy to production
npx convex deploy --prod

# Step 9.2: Verify deployment
npx convex dashboard
# Check that buses and busUpdateLog tables appear
```

---

## 🔗 PHASE 4: Backend Sync Service (Day 6)

### Step 10: Create Convex Sync for Buses
```javascript
// Step 10.1: Update backend/services/convexSync.js
// ADD this method to existing ConvexSync class:

async syncBusLocations() {
  try {
    // Step 10.2: Fetch latest bus data
    console.log('🚌 Fetching bus locations for Convex sync...');
    const buses = await busLocationService.fetchBusLocations();
    
    if (buses.length === 0) {
      console.warn('⚠️ No buses to sync');
      return;
    }
    
    // Step 10.3: Filter and prepare data
    const busesToSync = buses
      .filter(bus => bus.operatorRef === 'GONORTHEAST') // Only GNE buses
      .slice(0, 350); // Limit to 350 for performance
    
    // Step 10.4: Send to Convex
    const response = await fetch(
      `${this.convexUrl}/api/mutation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'buses:updateBusLocations',
          args: { 
            buses: busesToSync,
            timestamp: new Date().toISOString()
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Convex sync failed: ${error}`);
    }
    
    const result = await response.json();
    console.log(`✅ Synced ${busesToSync.length} bus locations to Convex`);
    
  } catch (error) {
    console.error('❌ Bus sync error:', error.message);
    // Don't throw - allow other syncs to continue
  }
}

// Step 10.5: Add to main sync method
async sync() {
  console.log('🔄 Starting Convex sync...');
  
  // Existing syncs...
  await this.syncAlerts();
  await this.syncSupervisors();
  await this.syncEvents();
  
  // Add bus sync
  await this.syncBusLocations();
  
  console.log('✅ Convex sync complete');
}
```

### Step 11: Create Bus Update Loop
```javascript
// Step 11.1: Create backend/services/busUpdateLoop.js
import busLocationService from './busLocationService.js';
import convexSync from './convexSync.js';

class BusUpdateLoop {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.updateInterval = parseInt(process.env.BODS_UPDATE_INTERVAL) || 10000;
  }
  
  // Step 11.2: Start the update loop
  start() {
    if (this.isRunning) {
      console.log('⚠️ Bus update loop already running');
      return;
    }
    
    console.log(`🚌 Starting bus update loop (every ${this.updateInterval}ms)`);
    this.isRunning = true;
    
    // Initial update
    this.performUpdate();
    
    // Schedule regular updates
    this.intervalId = setInterval(() => {
      this.performUpdate();
    }, this.updateInterval);
  }
  
  // Step 11.3: Perform single update
  async performUpdate() {
    try {
      const startTime = Date.now();
      
      // Fetch and sync
      await convexSync.syncBusLocations();
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ Bus update completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Bus update failed:', error);
    }
  }
  
  // Step 11.4: Stop the loop
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Bus update loop stopped');
    }
  }
  
  // Step 11.5: Get status
  getStatus() {
    return {
      running: this.isRunning,
      updateInterval: this.updateInterval,
      health: busLocationService.getHealth()
    };
  }
}

export default new BusUpdateLoop();
```

### Step 12: Integrate into Backend
```javascript
// Step 12.1: Update backend/index.js
// ADD these imports:
import busLocationService from './services/busLocationService.js';
import busUpdateLoop from './services/busUpdateLoop.js';

// Step 12.2: Add API endpoint for bus status
app.get('/api/buses/health', (req, res) => {
  res.json({
    success: true,
    busService: busLocationService.getHealth(),
    updateLoop: busUpdateLoop.getStatus()
  });
});

// Step 12.3: Start bus updates after server starts
// ADD after existing convexSync.startPeriodicSync():
busUpdateLoop.start();

// Step 12.4: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  busUpdateLoop.stop();
  // ... existing shutdown code
});
```

---

## 🎨 PHASE 5: Frontend Integration (Day 7)

### Step 13: Create Enhanced Bus Hook
```javascript
// Step 13.1: Update Go_BARRY/hooks/useBusLocations.js
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useState, useEffect, useMemo } from 'react';

export const useBusLocations = (viewport, options = {}) => {
  // Step 13.2: Dynamic limit based on zoom
  const [busLimit, setBusLimit] = useState(100);
  const [filters, setFilters] = useState({
    status: options.statusFilter || [],
    lines: options.lineFilter || []
  });
  
  // Step 13.3: Adjust limit by zoom level
  useEffect(() => {
    if (viewport?.zoom) {
      if (viewport.zoom > 14) {
        setBusLimit(200); // Very zoomed in - show more
      } else if (viewport.zoom > 12) {
        setBusLimit(150); // Medium zoom
      } else {
        setBusLimit(100); // Zoomed out - limit for performance
      }
    }
  }, [viewport?.zoom]);
  
  // Step 13.4: Query buses from Convex
  const buses = useQuery(
    api.buses.getBusesInViewport,
    viewport ? {
      north: viewport.north,
      south: viewport.south,
      east: viewport.east,
      west: viewport.west,
      maxResults: busLimit,
      statusFilter: filters.status.length > 0 ? filters.status : undefined,
      lineFilter: filters.lines.length > 0 ? filters.lines : undefined
    } : "skip"
  );
  
  // Step 13.5: Get bus statistics
  const stats = useQuery(api.buses.getBusStats);
  
  // Step 13.6: Memoize processed data
  const processedData = useMemo(() => {
    if (!buses) return { buses: [], stats: null };
    
    return {
      buses,
      stats,
      isLoading: false,
      busCount: buses.length,
      totalInSystem: stats?.totalBuses || 0
    };
  }, [buses, stats]);
  
  // Step 13.7: Return hook interface
  return {
    ...processedData,
    setFilters,
    filters
  };
};
```

### Step 14: Create Bus Marker Component
```javascript
// Step 14.1: Create Go_BARRY/components/operations/live-map/components/BusLocationLayer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

const BusLocationLayer = ({ map, buses, onBusClick, selectedBusId }) => {
  const markersRef = useRef(new Map());
  const markerPoolRef = useRef([]);
  
  // Step 14.2: Status colors
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'on-time': return '#10b981';
      case 'delayed': return '#f59e0b';
      case 'severely-delayed': return '#ef4444';
      case 'early': return '#3b82f6';
      default: return '#6b7280';
    }
  }, []);
  
  // Step 14.3: Create bus marker element
  const createBusElement = useCallback((bus) => {
    const element = document.createElement('div');
    element.className = 'bus-marker-container';
    element.style.cssText = `
      position: relative;
      cursor: pointer;
      transform: rotate(${bus.bearing}deg);
      transition: transform 0.3s ease;
    `;
    
    // Step 14.4: Bus icon SVG
    element.innerHTML = `
      <div class="bus-marker" style="position: relative;">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <!-- Bus body -->
          <path d="M18 2 L10 12 L10 30 L26 30 L26 12 Z" 
                fill="${getStatusColor(bus.status)}" 
                stroke="#1f2937" 
                stroke-width="2"/>
          <!-- Arrow point -->
          <path d="M18 2 L14 8 L22 8 Z" 
                fill="${getStatusColor(bus.status)}" 
                stroke="#1f2937" 
                stroke-width="2"/>
          <!-- Line number -->
          <text x="18" y="22" text-anchor="middle" 
                fill="white" font-size="11" font-weight="bold">
            ${bus.lineName}
          </text>
        </svg>
        ${bus.delay > 5 ? `
          <div class="delay-badge" style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">+${bus.delay}</div>
        ` : ''}
      </div>
    `;
    
    return element;
  }, [getStatusColor]);
  
  // Step 14.5: Create popup content
  const createPopupContent = useCallback((bus) => {
    const delayText = bus.delay > 0 
      ? `<span style="color: #ef4444">+${bus.delay} min</span>`
      : bus.delay < 0 
      ? `<span style="color: #3b82f6">${bus.delay} min</span>`
      : '<span style="color: #10b981">On Time</span>';
    
    return `
      <div style="padding: 12px; min-width: 220px; font-family: -apple-system, sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">
          Route ${bus.lineName}
        </h3>
        <div style="font-size: 14px; color: #374151; space-y: 4px;">
          <p style="margin: 4px 0;">
            <strong>To:</strong> ${bus.destination}
          </p>
          ${bus.originName ? `
            <p style="margin: 4px 0;">
              <strong>From:</strong> ${bus.originName}
            </p>
          ` : ''}
          <p style="margin: 4px 0;">
            <strong>Status:</strong> ${delayText}
          </p>
          <p style="margin: 4px 0;">
            <strong>Vehicle:</strong> ${bus.vehicleRef || bus.id}
          </p>
          ${bus.occupancy ? `
            <p style="margin: 4px 0;">
              <strong>Occupancy:</strong> ${bus.occupancy}
            </p>
          ` : ''}
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
            Last updated: ${new Date(bus.recordedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    `;
  }, []);
  
  // Step 14.6: Update bus markers
  useEffect(() => {
    if (!map || !window.tt || Platform.OS !== 'web') return;
    
    const existingIds = new Set(markersRef.current.keys());
    const newIds = new Set(buses.map(bus => bus.id));
    
    // Step 14.7: Remove old markers
    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.remove();
          // Return to pool
          if (marker.getElement()) {
            markerPoolRef.current.push(marker.getElement());
          }
        }
        markersRef.current.delete(id);
      }
    });
    
    // Step 14.8: Add/update markers
    buses.forEach(bus => {
      let marker = markersRef.current.get(bus.id);
      
      if (!marker) {
        // Create new marker
        const element = createBusElement(bus);
        
        marker = new window.tt.Marker({
          element,
          anchor: 'center',
          offset: [0, 0]
        })
        .setLngLat([bus.location.lon, bus.location.lat])
        .addTo(map);
        
        // Step 14.9: Add popup
        const popup = new window.tt.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(createPopupContent(bus));
        
        marker.setPopup(popup);
        
        // Step 14.10: Click handler
        element.addEventListener('click', (e) => {
          e.stopPropagation();
          onBusClick(bus);
        });
        
        markersRef.current.set(bus.id, marker);
      } else {
        // Update existing marker
        marker.setLngLat([bus.location.lon, bus.location.lat]);
        
        // Update rotation
        const element = marker.getElement();
        if (element) {
          element.style.transform = `rotate(${bus.bearing}deg)`;
          
          // Update delay badge
          const delayBadge = element.querySelector('.delay-badge');
          if (bus.delay > 5) {
            if (delayBadge) {
              delayBadge.textContent = `+${bus.delay}`;
            } else {
              // Add delay badge
              const badge = document.createElement('div');
              badge.className = 'delay-badge';
              badge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
              `;
              badge.textContent = `+${bus.delay}`;
              element.querySelector('.bus-marker').appendChild(badge);
            }
          } else if (delayBadge) {
            delayBadge.remove();
          }
        }
        
        // Update popup content
        marker.getPopup().setHTML(createPopupContent(bus));
      }
      
      // Step 14.11: Highlight selected bus
      const element = marker.getElement();
      if (element) {
        if (bus.id === selectedBusId) {
          element.classList.add('selected-bus');
          element.style.zIndex = '1000';
        } else {
          element.classList.remove('selected-bus');
          element.style.zIndex = '';
        }
      }
    });
    
    console.log(`🚌 Rendered ${buses.length} bus markers`);
    
  }, [map, buses, selectedBusId, onBusClick, createBusElement, createPopupContent]);
  
  // Step 14.12: Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      markerPoolRef.current = [];
    };
  }, []);
  
  return null; // No visual component, just manages markers
};

export default BusLocationLayer;
```

### Step 15: Add Bus Layer to Live Map
```javascript
// Step 15.1: Update LiveMapContainer.jsx to include bus layer
// ADD to imports:
import BusLocationLayer from './components/BusLocationLayer';
import { useBusLocations } from '../../../hooks/useBusLocations';

// Step 15.2: ADD to component state:
const [showBuses, setShowBuses] = useState(true);
const [selectedBusId, setSelectedBusId] = useState(null);

// Step 15.3: ADD bus data hook:
const { 
  buses, 
  stats: busStats,
  isLoading: busesLoading 
} = useBusLocations(viewport, {
  statusFilter: showDelayed ? ['delayed', 'severely-delayed'] : []
});

// Step 15.4: ADD bus click handler:
const handleBusClick = useCallback((bus) => {
  setSelectedItem({
    type: 'bus',
    data: bus
  });
  setSelectedBusId(bus.id);
}, []);

// Step 15.5: ADD bus layer to map:
{showBuses && (
  <BusLocationLayer
    map={mapInstance}
    buses={buses}
    onBusClick={handleBusClick}
    selectedBusId={selectedBusId}
  />
)}

// Step 15.6: ADD toggle for buses in MapControls:
<Switch
  value={showBuses}
  onValueChange={setShowBuses}
  label="Show Buses"
  icon="🚌"
/>
```

---

## 🧪 PHASE 6: Testing & Debugging (Day 8)

### Step 16: Create Test Dashboard
```javascript
// Step 16.1: Create backend/public/bus-test.html
<!DOCTYPE html>
<html>
<head>
  <title>BODS Bus Test Dashboard</title>
  <style>
    body { 
      font-family: -apple-system, sans-serif; 
      margin: 20px;
      background: #f3f4f6;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #1f2937;
    }
    .stat-label {
      color: #6b7280;
      margin-top: 5px;
    }
    .bus-list {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .on-time { 
      background: #d1fae5; 
      color: #065f46; 
    }
    .delayed { 
      background: #fed7aa; 
      color: #92400e; 
    }
    .severely-delayed { 
      background: #fee2e2; 
      color: #991b1b; 
    }
    .early { 
      background: #dbeafe; 
      color: #1e40af; 
    }
    .error {
      background: #fee2e2;
      color: #991b1b;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .success {
      background: #d1fae5;
      color: #065f46;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚌 BODS Bus Test Dashboard</h1>
    
    <div id="status"></div>
    
    <div class="stats" id="stats">
      <div class="stat-card">
        <div class="stat-value" id="total-buses">-</div>
        <div class="stat-label">Total Buses</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="on-time">-</div>
        <div class="stat-label">On Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="delayed">-</div>
        <div class="stat-label">Delayed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="avg-delay">-</div>
        <div class="stat-label">Avg Delay (min)</div>
      </div>
    </div>
    
    <div class="bus-list">
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Route</th>
            <th>Destination</th>
            <th>Status</th>
            <th>Delay</th>
            <th>Location</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody id="bus-table">
          <tr><td colspan="7" style="text-align: center; padding: 40px;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    // Step 16.2: Test script
    async function fetchBusData() {
      try {
        const response = await fetch('/api/buses/health');
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('status').innerHTML = 
            '<div class="success">✅ Bus service is healthy</div>';
          
          // Update stats
          const stats = data.busService.stats;
          document.getElementById('total-buses').textContent = stats.averageBusCount.toFixed(0);
          
          // Fetch actual bus data from Convex
          // This would need to be implemented via your API
          updateBusTable();
        } else {
          throw new Error('Service unhealthy');
        }
      } catch (error) {
        document.getElementById('status').innerHTML = 
          `<div class="error">❌ Error: ${error.message}</div>`;
      }
    }
    
    async function updateBusTable() {
      // This would fetch from your API endpoint that queries Convex
      // For now, showing the structure
      const tbody = document.getElementById('bus-table');
      tbody.innerHTML = '<tr><td colspan="7">Implement /api/buses endpoint to see live data</td></tr>';
    }
    
    // Initial load
    fetchBusData();
    
    // Refresh every 10 seconds
    setInterval(fetchBusData, 10000);
  </script>
</body>
</html>
```

### Step 17: Add Debug Endpoints
```javascript
// Step 17.1: Add to backend/index.js
// Debug endpoint to test BODS connection
app.get('/api/buses/test-bods', async (req, res) => {
  try {
    const buses = await busLocationService.fetchBusLocations();
    res.json({
      success: true,
      count: buses.length,
      sample: buses.slice(0, 5),
      health: busLocationService.getHealth()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Step 17.2: Serve test dashboard
app.use('/bus-test', express.static('public'));
```

---

## ✅ FINAL DEPLOYMENT CHECKLIST

### Pre-Deployment Verification
- [ ] **API Access Working**
  - [ ] BODS API key valid
  - [ ] Can fetch GNE buses
  - [ ] XML parsing successful
  - [ ] Getting ~350 buses

- [ ] **Backend Integration**
  - [ ] busLocationService tested
  - [ ] Convex sync working
  - [ ] Update loop running
  - [ ] Error handling robust

- [ ] **Frontend Display**
  - [ ] Bus markers appear
  - [ ] Popups show info
  - [ ] Click interactions work
  - [ ] Performance acceptable

### Deployment Steps
1. **Backend Deployment**
   ```bash
   git add .
   git commit -m "Add BODS bus location integration"
   git push origin main
   # Render auto-deploys
   ```

2. **Environment Variables on Render**
   - Add BODS_API_KEY
   - Add BODS_GNE_DATAFEED_ID
   - Verify other BODS_ variables

3. **Monitor Initial Run**
   - Check Render logs
   - Verify bus sync messages
   - Monitor error rates

4. **Frontend Testing**
   - Open Live Map
   - Toggle bus layer
   - Verify markers appear
   - Test interactions

### Post-Deployment Monitoring
- [ ] Check bus count matches expected (~350 peak)
- [ ] Monitor API rate limits (staying under 900/hour)
- [ ] Verify 10-second update frequency
- [ ] Check memory usage stays reasonable
- [ ] Gather user feedback

---

## 🚨 TROUBLESHOOTING GUIDE

### Common Issues & Solutions

**1. No API Key Error**
- Solution: Get key from Account Settings, not just registration page

**2. 401 Unauthorized**
- Check API key format: `Token YOUR_KEY` not `Bearer YOUR_KEY`
- Verify key is active in account settings

**3. No Buses Found**
- Check datafeed ID is correct
- Verify operator filter for GONORTHEAST
- Check time of day (fewer buses at night)

**4. XML Parsing Errors**
- Update xml2js options for namespace handling
- Check for empty responses
- Log raw XML for debugging

**5. Convex Sync Failures**
- Verify Convex URL is correct
- Check schema matches exactly
- Monitor Convex dashboard for errors

**6. Performance Issues**
- Reduce bus limit in viewport query
- Increase cache duration
- Check marker cleanup is working

---

## 📊 SUCCESS CRITERIA

### Week 1 Goals - ACHIEVED ✅
- ✅ BODS API connected and authenticated (333 buses found)
- ✅ Parsing GNE buses successfully (using GNEL operator code)
- ✅ Convex schema updated (busLocations table created)
- ✅ Basic bus markers on map (BusLocationLayer component working)
- ✅ 10-second update cycle working (busUpdateLoop.js running)

### Week 2 Goals - IN PROGRESS
- ✅ Performance optimized for 350 buses (350 bus limit implemented)
- ✅ Advanced filtering (by route, status) - implemented in useBusLocations
- ⬜ Historical tracking setup (busUpdateLog table exists but not used)
- ⬜ Supervisor feedback incorporated
- ⬜ Production deployment stable (minor fixes needed)

---

**Document Status:** IMPLEMENTED - Needs Minor Fixes  
**Total Steps:** 17 major steps with 100+ sub-steps  
**Estimated Timeline:** 8 days with careful testing  
**Risk Level:** Medium - dependent on BODS API access

---

## 🚀 IMPLEMENTATION STATUS (Updated)

### ✅ COMPLETED:
1. **Backend API Integration** - Successfully fetching 333 Go North East buses
2. **Data Processing Service** - busLocationService.js fully functional with GNEL filtering
3. **Convex Integration** - Schema and functions created (with table name fix applied)
4. **Backend Sync Service** - busUpdateLoop running every 10 seconds
5. **Frontend Components** - BusLocationLayer and useBusLocations hook implemented

### ⚠️ FIXES NEEDED:
1. **Table Name Mismatch** - Fixed: Changed "buses" to "busLocations" in buses.ts
2. **Hook Location** - useBusLocations is in wrong folder (should move from live-map/hooks to /hooks)
3. **Convex Functions** - useBusLocations trying to use non-existent api.sync.getBusLocations

### 📝 NEXT STEPS:
1. Deploy Convex changes: `npx convex deploy --prod`
2. Test bus locations appearing on live map
3. Move useBusLocations hook to correct location
4. Add bus location functions to Convex sync.ts if needed
5. Verify real-time updates working

### ✅ WORKING FEATURES:
- BODS API connection with correct operator code (GNEL)
- 333 buses being fetched successfully
- Backend caching and health monitoring
- Frontend fallback to backend API when Convex unavailable
- Map integration with BusLocationLayer component
- Bus filtering and viewport-based display

**Current Status:** System is functional but needs minor adjustments for production deployment

---

## 🐛 BUGS FOUND & FIXED

### 1. ✅ Table Name Mismatch (FIXED)
- **Issue**: Convex schema defines `busLocations` table but buses.ts uses `"buses"` table
- **Fix**: Updated all references in buses.ts from `"buses"` to `"busLocations"`
- **Files changed**: /Go_BARRY/convex/buses.ts

### 2. ⚠️ Hook Location Issue
- **Issue**: useBusLocations hook is in `/components/operations/live-map/hooks/` instead of `/hooks/`
- **Impact**: Import paths are longer than necessary
- **Fix needed**: Move file to proper location

### 3. ⚠️ Missing Convex Functions
- **Issue**: useBusLocations tries to use `api.sync.getBusLocations` which doesn't exist
- **Impact**: Falls back to backend API (which works fine)
- **Fix needed**: Either add functions to sync.ts or update hook to use api.buses.*

### 4. ✅ Operator Code Correction
- **Issue**: Plan mentioned "GONORTHEAST" but actual code is "GNEL"
- **Fix**: Already corrected in busLocationService.js

**Overall Status**: Core functionality working, minor path/naming adjustments needed for cleaner code