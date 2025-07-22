// convex/flowMonitoring.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updateFlowData = mutation({
  args: {
    alertId: v.string(),
    flowData: v.object({
      currentSpeed: v.number(),
      freeFlowSpeed: v.number(),
      speedRatio: v.number(),
      trend: v.string(),
      trendArrow: v.string(),
      severity: v.string(),
      roadClosure: v.boolean(),
      shouldAutoClear: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("trafficFlowData")
      .withIndex("by_alert")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();
    
    const timestamp = Date.now();
    const historyEntry = {
      timestamp,
      speed: args.flowData.currentSpeed,
      severity: args.flowData.severity
    };
    
    if (existing) {
      // Update existing record
      const history = existing.history || [];
      history.push(historyEntry);
      
      // Keep only last 12 entries (1 hour at 5-min intervals)
      if (history.length > 12) {
        history.shift();
      }
      
      await ctx.db.patch(existing._id, {
        ...args.flowData,
        lastChecked: timestamp,
        history
      });
    } else {
      // Create new record
      await ctx.db.insert("trafficFlowData", {
        alertId: args.alertId,
        ...args.flowData,
        lastChecked: timestamp,
        history: [historyEntry]
      });
    }
    
    // Also update alert severity if changed
    const alert = await ctx.db
      .query("alerts")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();
      
    if (alert && alert.severity !== args.flowData.severity) {
      await ctx.db.patch(alert._id, {
        severity: args.flowData.severity,
        lastUpdated: timestamp
      });
    }
    
    return { success: true };
  }
});

export const getFlowData = query({
  args: { alertId: v.string() },
  handler: async (ctx, args) => {
    const flowData = await ctx.db
      .query("trafficFlowData")
      .withIndex("by_alert")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();
    
    return flowData;
  }
});

export const getActiveFlowMonitoring = query({
  args: {},
  handler: async (ctx, args) => {
    const recentTime = Date.now() - (10 * 60 * 1000); // Last 10 minutes
    
    const activeFlows = await ctx.db
      .query("trafficFlowData")
      .filter(q => q.gte(q.field("lastChecked"), recentTime))
      .collect();
    
    return {
      count: activeFlows.length,
      flows: activeFlows,
      timestamp: Date.now()
    };
  }
});

export const getCriticalFlows = query({
  args: {},
  handler: async (ctx, args) => {
    const criticalFlows = await ctx.db
      .query("trafficFlowData")
      .filter(q => q.eq(q.field("severity"), "Critical"))
      .collect();
    
    const highFlows = await ctx.db
      .query("trafficFlowData")
      .filter(q => q.eq(q.field("severity"), "High"))
      .collect();
    
    return {
      critical: criticalFlows,
      high: highFlows,
      total: criticalFlows.length + highFlows.length,
      timestamp: Date.now()
    };
  }
});

export const updateFlowMonitoringStats = mutation({
  args: {
    stats: v.object({
      activeIncidents: v.number(),
      checksPerformed: v.number(),
      severityUpdates: v.number(),
      autoCleared: v.number(),
      lastCheck: v.union(v.string(), v.null()),
      isRunning: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    // Update sync state with monitoring stats
    const syncState = await ctx.db.query("syncState").first();
    if (syncState) {
      await ctx.db.patch(syncState._id, {
        flowMonitoringStats: args.stats,
        lastUpdated: Date.now()
      });
    } else {
      await ctx.db.insert("syncState", {
        key: "global",
        connectedSupervisors: 0,
        activeSupervisors: [],
        customMessages: [],
        displayMode: "normal",
        lastUpdated: Date.now(),
        flowMonitoringStats: args.stats,
        alertCount: 0,
        supervisorCount: 0,
        dismissedCount: 0
      });
    }
    
    return { success: true };
  }
});