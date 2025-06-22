// convex/sync.ts
// Real-time sync functions for supervisor coordination

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current sync state
export const getSyncState = query({
  handler: async (ctx) => {
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (!state) {
      // Return default state
      return {
        connectedSupervisors: 0,
        activeSupervisors: [],
        customMessages: [],
        displayMode: "normal",
        lastUpdated: Date.now(),
      };
    }

    // Filter out expired messages
    const now = Date.now();
    const activeMessages = state.customMessages.filter(msg => msg.expiresAt > now);

    return {
      ...state,
      customMessages: activeMessages,
    };
  },
});

// Update display mode
export const setDisplayMode = mutation({
  args: {
    mode: v.string(),
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive || !session.isAdmin) {
      throw new Error("Unauthorized - admin access required");
    }

    // Get or create sync state
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, {
        displayMode: args.mode,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("syncState", {
        key: "global",
        connectedSupervisors: 0,
        activeSupervisors: [],
        customMessages: [],
        displayMode: args.mode,
        lastUpdated: Date.now(),
      });
    }

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "set_display_mode",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      details: {
        mode: args.mode,
      },
    });

    return { success: true };
  },
});

// EVENT MANAGEMENT FUNCTIONS

// Get active events
export const getActiveEvents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_active", q => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});

// Get most severe active event
export const getMostSevereEvent = query({
  handler: async (ctx) => {
    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    if (activeEvents.length === 0) return null;

    // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    
    const sortedEvents = activeEvents.sort((a, b) => {
      const aSeverity = severityOrder[a.severity.toUpperCase()] || 0;
      const bSeverity = severityOrder[b.severity.toUpperCase()] || 0;
      return bSeverity - aSeverity;
    });

    return sortedEvents[0];
  },
});

// Add or update event
export const upsertEvent = mutation({
  args: {
    eventId: v.string(),
    venue: v.string(),
    event: v.string(),
    time: v.string(),
    date: v.string(),
    severity: v.string(),
    status: v.string(),
    expectedAttendance: v.optional(v.number()),
    affectedRoutes: v.array(v.string()),
    description: v.optional(v.string()),
    alertMessage: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if event exists
    const existingEvent = await ctx.db
      .query("events")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .first();

    const now = Date.now();

    if (existingEvent) {
      // Update existing event
      await ctx.db.patch(existingEvent._id, {
        venue: args.venue,
        event: args.event,
        time: args.time,
        date: args.date,
        severity: args.severity,
        status: args.status,
        expectedAttendance: args.expectedAttendance,
        affectedRoutes: args.affectedRoutes,
        description: args.description,
        alertMessage: args.alertMessage,
        isActive: args.isActive,
        updatedAt: now,
      });
      return existingEvent._id;
    } else {
      // Create new event
      return await ctx.db.insert("events", {
        eventId: args.eventId,
        venue: args.venue,
        event: args.event,
        time: args.time,
        date: args.date,
        severity: args.severity,
        status: args.status,
        expectedAttendance: args.expectedAttendance,
        affectedRoutes: args.affectedRoutes,
        description: args.description,
        alertMessage: args.alertMessage,
        isActive: args.isActive,
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update event status
export const updateEventStatus = mutation({
  args: {
    eventId: v.string(),
    status: v.string(),
    isActive: v.boolean(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .first();

    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(event._id, {
      status: args.status,
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "update_event_status",
      supervisorId: args.updatedBy,
      supervisorName: args.updatedBy,
      timestamp: Date.now(),
      details: {
        eventId: args.eventId,
        newStatus: args.status,
        isActive: args.isActive,
      },
    });

    return { success: true };
  },
});

// Log a supervisor action (for audit trail)
export const logSupervisorAction = mutation({
  args: {
    supervisorId: v.string(),
    supervisorName: v.string(),
    action: v.string(),
    details: v.optional(v.any()),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert action into supervisorActions table
    const actionId = await ctx.db.insert("supervisorActions", {
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      action: args.action,
      details: args.details || {},
      timestamp: args.timestamp,
      sessionId: args.sessionId,
      alertId: args.details?.alertId, // For alert-specific actions
    });

    console.log(`Logged supervisor action: ${args.action} by ${args.supervisorName}`);
    
    // Update sync state to trigger real-time updates
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, {
        lastUpdated: Date.now(),
      });
    }
    
    return { success: true, actionId };
  },
});

// Add custom message
export const addCustomMessage = mutation({
  args: {
    message: v.string(),
    priority: v.string(),
    duration: v.number(), // minutes
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    const now = Date.now();
    const newMessage = {
      id: `msg_${now}_${Math.random().toString(36).substr(2, 9)}`,
      message: args.message,
      priority: args.priority,
      duration: args.duration,
      createdBy: session.supervisorName,
      createdAt: now,
      expiresAt: now + (args.duration * 60 * 1000),
    };

    // Get or create sync state
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, {
        customMessages: [...state.customMessages, newMessage],
        lastUpdated: now,
      });
    } else {
      await ctx.db.insert("syncState", {
        key: "global",
        connectedSupervisors: 0,
        activeSupervisors: [],
        customMessages: [newMessage],
        displayMode: "normal",
        lastUpdated: now,
      });
    }

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "add_custom_message",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: now,
      details: {
        message: args.message,
        priority: args.priority,
        duration: args.duration,
      },
    });

    return { success: true, messageId: newMessage.id };
  },
});

// Remove custom message
export const removeCustomMessage = mutation({
  args: {
    messageId: v.string(),
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    // Get sync state
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (!state) {
      throw new Error("Sync state not found");
    }

    // Filter out the message
    const updatedMessages = state.customMessages.filter(msg => msg.id !== args.messageId);

    await ctx.db.patch(state._id, {
      customMessages: updatedMessages,
      lastUpdated: Date.now(),
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "remove_custom_message",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      details: {
        messageId: args.messageId,
      },
    });

    return { success: true };
  },
});

// Get supervisor actions (audit trail)
export const getRecentActions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("supervisorActions")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

// Get actions for specific supervisor
export const getSupervisorActions = query({
  args: {
    supervisorId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("supervisorActions")
      .withIndex("by_supervisor", q => q.eq("supervisorId", args.supervisorId))
      .order("desc")
      .take(limit);
  },
});

// Get actions for specific alert
export const getAlertActions = query({
  args: {
    alertId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("supervisorActions")
      .withIndex("by_alert", q => q.eq("alertId", args.alertId))
      .order("desc")
      .collect();
  },
});

// Heartbeat to keep session alive
export const heartbeat = mutation({
  args: {
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      return { success: false, reason: "Session expired" };
    }

    // Update last activity
    await ctx.db.patch(args.sessionId, {
      lastActivity: Date.now(),
    });

    // Update sync state with current active supervisors
    const activeSessions = await ctx.db
      .query("supervisorSessions")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    const activeSupervisors = activeSessions.map(s => ({
      supervisorId: s.supervisorId,
      supervisorName: s.supervisorName,
      badge: s.badge,
      duty: s.duty.name,
      lastSeen: s.lastActivity,
    }));

    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, {
        connectedSupervisors: activeSessions.length,
        activeSupervisors,
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});
