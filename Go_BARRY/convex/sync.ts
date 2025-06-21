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
