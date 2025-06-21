// convex/alerts.ts
// Alert management functions for Go BARRY

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Acknowledge an alert
export const acknowledge = mutation({
  args: {
    alertId: v.string(),
    sessionId: v.id("supervisorSessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Find the alert
    const alert = await ctx.db
      .query("alerts")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();

    if (!alert) {
      throw new Error("Alert not found");
    }

    // Update alert
    await ctx.db.patch(alert._id, {
      acknowledged: true,
      acknowledgedBy: session.supervisorName,
      acknowledgedAt: Date.now(),
      acknowledgedReason: args.reason,
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "acknowledge_alert",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      alertId: args.alertId,
      details: {
        alertTitle: alert.title,
        reason: args.reason,
      },
    });

    return { success: true };
  },
});

// Dismiss alert from display
export const dismissFromDisplay = mutation({
  args: {
    alertId: v.string(),
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Find the alert
    const alert = await ctx.db
      .query("alerts")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();

    if (!alert) {
      throw new Error("Alert not found");
    }

    // Update alert
    await ctx.db.patch(alert._id, {
      dismissedFromDisplay: true,
      dismissedFromDisplayBy: session.supervisorName,
      dismissedFromDisplayAt: Date.now(),
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "dismiss_from_display",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      alertId: args.alertId,
      details: {
        alertTitle: alert.title,
      },
    });

    return { success: true };
  },
});

// Lock/unlock alert on display
export const toggleDisplayLock = mutation({
  args: {
    alertId: v.string(),
    sessionId: v.id("supervisorSessions"),
    lock: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Find the alert
    const alert = await ctx.db
      .query("alerts")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();

    if (!alert) {
      throw new Error("Alert not found");
    }

    // Update alert
    const update = args.lock
      ? {
          lockedOnDisplay: true,
          lockedOnDisplayBy: session.supervisorName,
          lockedOnDisplayAt: Date.now(),
        }
      : {
          lockedOnDisplay: false,
          lockedOnDisplayBy: undefined,
          lockedOnDisplayAt: undefined,
        };

    await ctx.db.patch(alert._id, update);

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: args.lock ? "lock_on_display" : "unlock_from_display",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      alertId: args.alertId,
      details: {
        alertTitle: alert.title,
      },
    });

    return { success: true };
  },
});

// Override alert priority
export const overridePriority = mutation({
  args: {
    alertId: v.string(),
    sessionId: v.id("supervisorSessions"),
    newPriority: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Find the alert
    const alert = await ctx.db
      .query("alerts")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();

    if (!alert) {
      throw new Error("Alert not found");
    }

    // Update alert
    await ctx.db.patch(alert._id, {
      priorityOverride: args.newPriority,
      priorityUpdatedBy: session.supervisorName,
      priorityUpdatedAt: Date.now(),
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "priority_override",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      alertId: args.alertId,
      details: {
        alertTitle: alert.title,
        oldPriority: alert.severity,
        newPriority: args.newPriority,
      },
    });

    return { success: true };
  },
});

// Add note to alert
export const addNote = mutation({
  args: {
    alertId: v.string(),
    sessionId: v.id("supervisorSessions"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Find the alert
    const alert = await ctx.db
      .query("alerts")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();

    if (!alert) {
      throw new Error("Alert not found");
    }

    // Add note
    const newNote = {
      note: args.note,
      addedBy: session.supervisorName,
      addedAt: Date.now(),
    };

    await ctx.db.patch(alert._id, {
      notes: [...alert.notes, newNote],
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "add_note",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      alertId: args.alertId,
      details: {
        alertTitle: alert.title,
        note: args.note,
      },
    });

    return { success: true };
  },
});

// Get active alerts
export const getActiveAlerts = query({
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_timestamp")
      .order("desc")
      .filter(q => 
        q.and(
          q.neq(q.field("status"), "resolved"),
          q.eq(q.field("dismissedFromDisplay"), false)
        )
      )
      .take(100);

    return alerts;
  },
});

// Get alert by ID
export const getAlert = query({
  args: {
    alertId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("alertId"), args.alertId))
      .first();
  },
});

// Get dismissed alerts
export const getDismissedAlerts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_timestamp")
      .order("desc")
      .filter(q => q.eq(q.field("dismissedFromDisplay"), true))
      .take(50);
  },
});

// Batch insert alerts (for sync from backend)
export const batchInsertAlerts = mutation({
  args: {
    alerts: v.array(v.object({
      alertId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      location: v.string(),
      coordinates: v.optional(v.array(v.number())),
      severity: v.string(),
      status: v.string(),
      source: v.string(),
      timestamp: v.number(),
      affectsRoutes: v.array(v.string()),
      routeFrequencies: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const insertedCount = 0;
    const updatedCount = 0;

    for (const alertData of args.alerts) {
      // Check if alert exists
      const existing = await ctx.db
        .query("alerts")
        .withIndex("by_status")
        .filter(q => q.eq(q.field("alertId"), alertData.alertId))
        .first();

      if (existing) {
        // Update existing alert (preserve supervisor interactions)
        await ctx.db.patch(existing._id, {
          title: alertData.title,
          description: alertData.description,
          location: alertData.location,
          coordinates: alertData.coordinates,
          severity: alertData.severity,
          status: alertData.status,
          source: alertData.source,
          timestamp: alertData.timestamp,
          affectsRoutes: alertData.affectsRoutes,
          routeFrequencies: alertData.routeFrequencies,
        });
      } else {
        // Insert new alert
        await ctx.db.insert("alerts", {
          ...alertData,
          acknowledged: false,
          notes: [],
          dismissedFromDisplay: false,
          lockedOnDisplay: false,
        });
      }
    }

    return { 
      success: true,
      processed: args.alerts.length,
    };
  },
});
