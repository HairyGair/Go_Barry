// convex/sync.ts
// Enhanced sync functions including supervisor action logging

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a supervisor action (NEW)
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
    return { success: true, actionId };
  },
});

// Get recent supervisor actions
export const getRecentActions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const actions = await ctx.db
      .query("supervisorActions")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    return actions;
  },
});

// Get actions for a specific supervisor
export const getSupervisorActions = query({
  args: {
    supervisorId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const actions = await ctx.db
      .query("supervisorActions")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .order("desc")
      .take(limit);
    
    return actions;
  },
});

// Get actions for a specific alert
export const getAlertActions = query({
  args: {
    alertId: v.string(),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("supervisorActions")
      .withIndex("by_alert", (q) => q.eq("alertId", args.alertId))
      .order("desc")
      .collect();
    
    return actions;
  },
});

// Get sync state
export const getSyncState = query({
  handler: async (ctx) => {
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    
    return state || {
      key: "main",
      displayMode: "normal",
      customMessages: [],
      lastUpdate: Date.now(),
    };
  },
});

// Set display mode
export const setDisplayMode = mutation({
  args: {
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("syncState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayMode: args.mode,
        lastUpdate: Date.now(),
      });
    } else {
      await ctx.db.insert("syncState", {
        key: "main",
        displayMode: args.mode,
        customMessages: [],
        lastUpdate: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Heartbeat for supervisor sessions
export const heartbeat = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("supervisorSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, {
        lastActivity: Date.now(),
      });
      return { success: true };
    }
    
    return { success: false, error: "Session not found" };
  },
});

// Add custom message to display
export const addCustomMessage = mutation({
  args: {
    message: v.string(),
    priority: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    
    const newMessage = {
      id: crypto.randomUUID(),
      message: args.message,
      priority: args.priority || "normal",
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    };
    
    if (state) {
      const messages = state.customMessages || [];
      messages.push(newMessage);
      
      await ctx.db.patch(state._id, {
        customMessages: messages,
        lastUpdate: Date.now(),
      });
    } else {
      await ctx.db.insert("syncState", {
        key: "main",
        displayMode: "normal",
        customMessages: [newMessage],
        lastUpdate: Date.now(),
      });
    }
    
    return { success: true, messageId: newMessage.id };
  },
});

// Remove custom message
export const removeCustomMessage = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    
    if (state && state.customMessages) {
      const filtered = state.customMessages.filter(m => m.id !== args.messageId);
      
      await ctx.db.patch(state._id, {
        customMessages: filtered,
        lastUpdate: Date.now(),
      });
      
      return { success: true };
    }
    
    return { success: false, error: "Message not found" };
  },
});
