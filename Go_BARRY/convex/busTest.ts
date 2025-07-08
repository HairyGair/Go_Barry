// Simplified bus test function to isolate the issue
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const testBusInsertion = mutation({
  args: {
    testBus: v.object({
      id: v.string(),
      operatorRef: v.string(),
      routeName: v.string(),
      lineRef: v.string(),
      coordinates: v.array(v.number()),
      bearing: v.number(),
      delay: v.number(),
      status: v.string(),
      destination: v.string(),
      lastUpdate: v.number()
    })
  },
  handler: async (ctx, args) => {
    try {
      console.log('🧪 Testing simple bus insertion...');
      
      // Test if we can insert a single bus record
      const result = await ctx.db.insert("busLocations", {
        vehicleId: args.testBus.id,
        vehicleRef: args.testBus.id,
        operatorRef: args.testBus.operatorRef,
        lineRef: args.testBus.lineRef,
        lineName: args.testBus.routeName,
        directionRef: "1",
        directionName: "Test Direction",
        destinationRef: `dest-${args.testBus.lineRef}`,
        destinationName: args.testBus.destination,
        latitude: args.testBus.coordinates[0],
        longitude: args.testBus.coordinates[1],
        bearing: args.testBus.bearing,
        blockRef: undefined,
        vehicleJourneyRef: undefined,
        originRef: undefined,
        originName: undefined,
        originAimedDeparture: undefined,
        delay: args.testBus.delay,
        status: 'on-time' as any,
        recordedAt: new Date(args.testBus.lastUpdate).toISOString(),
        validUntil: new Date(args.testBus.lastUpdate + 300000).toISOString(),
        lastUpdated: new Date().toISOString(),
        occupancy: undefined
      });
      
      console.log('✅ Test bus insertion successful:', result);
      return { success: true, id: result };
      
    } catch (error: any) {
      console.error('❌ Test bus insertion failed:', error);
      return { success: false, error: error.message };
    }
  },
});