// Go_BARRY/convex/buses.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to update all buses
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
      // Clear old buses efficiently
      const existing = await ctx.db.query("busLocations").collect();
      const deletePromises = existing.map(bus => ctx.db.delete(bus._id));
      await Promise.all(deletePromises);
      
      // Insert new buses in batches
      const insertPromises = args.buses.map(bus => 
        ctx.db.insert("busLocations", {
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
      
      // Log update
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

// Query buses in viewport
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
    // Build query with filters
    let busQuery = ctx.db
      .query("busLocations")
      .filter(q => 
        q.and(
          q.gte(q.field("latitude"), args.south),
          q.lte(q.field("latitude"), args.north),
          q.gte(q.field("longitude"), args.west),
          q.lte(q.field("longitude"), args.east)
        )
      );
    
    const allBuses = await busQuery.collect();
    
    // Apply additional filters
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
    
    // Sort by delay (worst first) and limit
    filteredBuses.sort((a, b) => b.delay - a.delay);
    
    const limitedBuses = args.maxResults 
      ? filteredBuses.slice(0, args.maxResults)
      : filteredBuses;
    
    // Return formatted data
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

// Get bus statistics
export const getBusStats = query({
  handler: async (ctx) => {
    const buses = await ctx.db.query("busLocations").collect();
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

// Get all buses (for debugging/admin)
export const getAllBuses = query({
  handler: async (ctx) => {
    const buses = await ctx.db.query("busLocations").collect();
    
    return buses.map(bus => ({
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
      vehicleRef: bus.vehicleRef,
      originName: bus.originName,
      occupancy: bus.occupancy,
    }));
  },
});
