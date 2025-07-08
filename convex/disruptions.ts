// Convex functions for disruption management
import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Query to get all disruptions with optional filters
export const getDisruptions = query({
  args: {
    types: v.optional(v.array(v.string())),
    severities: v.optional(v.array(v.string())),
    statuses: v.optional(v.array(v.string())),
    routes: v.optional(v.array(v.string())),
    supervisorBadge: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("disruptions");

    // Apply filters
    const disruptions = await query.collect();
    
    let filtered = disruptions.filter(d => {
      if (args.types && !args.types.includes(d.type)) return false;
      if (args.severities && !args.severities.includes(d.severity)) return false;
      if (args.statuses && !args.statuses.includes(d.status)) return false;
      if (args.routes && !args.routes.some(r => d.affectedRoutes.includes(r))) return false;
      if (args.supervisorBadge && !d.dismissedBy?.includes(args.supervisorBadge)) return false;
      return true;
    });

    // Sort by severity and time
    filtered.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.startTime - a.startTime;
    });

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Get notes for each disruption
    const disruptionsWithNotes = await Promise.all(
      filtered.map(async (disruption) => {
        const notes = await ctx.db
          .query("disruptionNotes")
          .withIndex("by_disruption", (q) => q.eq("disruptionId", disruption._id))
          .collect();
        return { ...disruption, notes };
      })
    );

    return disruptionsWithNotes;
  },
});

// Query to get a single disruption by ID
export const getDisruption = query({
  args: { id: v.id("disruptions") },
  handler: async (ctx, args) => {
    const disruption = await ctx.db.get(args.id);
    if (!disruption) return null;

    const notes = await ctx.db
      .query("disruptionNotes")
      .withIndex("by_disruption", (q) => q.eq("disruptionId", args.id))
      .collect();

    return { ...disruption, notes };
  },
});

// Mutation to create a new disruption
export const createDisruption = mutation({
  args: {
    type: v.union(
      v.literal("roadwork"),
      v.literal("incident"),
      v.literal("event"),
      v.literal("weather"),
      v.literal("breakdown")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("planned"),
      v.literal("cleared"),
      v.literal("monitoring")
    ),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    location: v.object({
      description: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      road: v.optional(v.string()),
      junction: v.optional(v.string()),
      postcode: v.optional(v.string()),
    }),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    affectedRoutes: v.array(v.string()),
    estimatedDelay: v.optional(v.number()),
    title: v.string(),
    description: v.string(),
    source: v.string(),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const disruption = await ctx.db.insert("disruptions", {
      ...args,
      lastUpdated: Date.now(),
    });
    return disruption;
  },
});

// Mutation to update a disruption
export const updateDisruption = mutation({
  args: {
    id: v.id("disruptions"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("planned"),
      v.literal("cleared"),
      v.literal("monitoring")
    )),
    severity: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )),
    endTime: v.optional(v.number()),
    estimatedDelay: v.optional(v.number()),
    affectedRoutes: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      lastUpdated: Date.now(),
    });
    return { success: true };
  },
});

// Mutation to dismiss a disruption for a supervisor
export const dismissDisruption = mutation({
  args: {
    disruptionId: v.id("disruptions"),
    supervisorBadge: v.string(),
  },
  handler: async (ctx, args) => {
    const disruption = await ctx.db.get(args.disruptionId);
    if (!disruption) throw new Error("Disruption not found");

    const dismissedBy = disruption.dismissedBy || [];
    if (!dismissedBy.includes(args.supervisorBadge)) {
      dismissedBy.push(args.supervisorBadge);
      await ctx.db.patch(args.disruptionId, { dismissedBy });
    }
    
    return { success: true };
  },
});

// Mutation to add a note to a disruption
export const addDisruptionNote = mutation({
  args: {
    disruptionId: v.id("disruptions"),
    supervisorBadge: v.string(),
    supervisorName: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("update"),
      v.literal("action"),
      v.literal("observation")
    ),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.insert("disruptionNotes", {
      ...args,
      timestamp: Date.now(),
    });
    
    // Update disruption's lastUpdated timestamp
    await ctx.db.patch(args.disruptionId, {
      lastUpdated: Date.now(),
    });
    
    return note;
  },
});

// Action to sync disruptions from various sources
export const syncDisruptions = action({
  args: {},
  handler: async (ctx) => {
    // This will be called by the backend to sync disruptions
    // The backend will call mutations to create/update disruptions
    return { message: "Sync initiated from backend" };
  },
});

// Query to get disruption statistics
export const getDisruptionStats = query({
  args: {},
  handler: async (ctx) => {
    const disruptions = await ctx.db.query("disruptions").collect();
    
    const stats = {
      total: disruptions.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      activeCount: 0,
      criticalCount: 0,
    };

    disruptions.forEach(d => {
      stats.byType[d.type] = (stats.byType[d.type] || 0) + 1;
      stats.bySeverity[d.severity] = (stats.bySeverity[d.severity] || 0) + 1;
      stats.byStatus[d.status] = (stats.byStatus[d.status] || 0) + 1;
      
      if (d.status === "active") stats.activeCount++;
      if (d.severity === "critical") stats.criticalCount++;
    });

    return stats;
  },
});
