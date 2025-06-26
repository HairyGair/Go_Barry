// convex/vixData.ts
// Store and sync VIX late runners data

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get current VIX data
export const getVixData = query({
  args: {},
  handler: async (ctx) => {
    const vixData = await ctx.db
      .query("vixData")
      .order("desc")
      .first();
    
    return vixData || null;
  },
});

// Mutation to update VIX data
export const updateVixData = mutation({
  args: {
    lateRunners: v.array(v.object({
      fleetNo: v.string(),
      service: v.string(),
      depot: v.string(),
      rb: v.optional(v.string()),
      stop: v.string(),
      driverNo: v.optional(v.string()),
      lateness: v.string(),
      delayMinutes: v.number()
    })),
    stats: v.object({
      totalLateRunners: v.number(),
      criticalDelays: v.number(),
      averageDelay: v.number(),
      worstDelay: v.number()
    }),
    uploadedBy: v.optional(v.string()),
    uploadedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Store the new VIX data
    await ctx.db.insert("vixData", {
      lateRunners: args.lateRunners,
      stats: args.stats,
      uploadedBy: args.uploadedBy,
      uploadedAt: args.uploadedAt,
      timestamp: Date.now()
    });
    
    // Clean up old entries (keep only last 10)
    const allEntries = await ctx.db
      .query("vixData")
      .order("desc")
      .collect();
    
    if (allEntries.length > 10) {
      const toDelete = allEntries.slice(10);
      for (const entry of toDelete) {
        await ctx.db.delete(entry._id);
      }
    }
    
    return { success: true };
  },
});

// Clear VIX data
export const clearVixData = mutation({
  args: {},
  handler: async (ctx) => {
    const allEntries = await ctx.db
      .query("vixData")
      .collect();
    
    for (const entry of allEntries) {
      await ctx.db.delete(entry._id);
    }
    
    return { success: true };
  },
});
