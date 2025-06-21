// convex/supervisors.ts
// Enhanced supervisor functions with session management

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update supervisor session
export const createOrUpdateSession = mutation({
  args: {
    sessionId: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string(),
    badge: v.string(),
    role: v.string(),
    isAdmin: v.boolean(),
    loginTime: v.number(),
    lastActivity: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if session exists
    const existing = await ctx.db
      .query("supervisorSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    
    if (existing) {
      // Update existing session
      await ctx.db.patch(existing._id, {
        lastActivity: args.lastActivity,
        isActive: true,
      });
      
      console.log(`Updated session for ${args.supervisorName}`);
    } else {
      // Create new session
      await ctx.db.insert("supervisorSessions", {
        ...args,
        isActive: true,
      });
      
      console.log(`Created new session for ${args.supervisorName}`);
    }
    
    return { success: true };
  },
});

// Remove supervisor session
export const removeSession = mutation({
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
        isActive: false,
        logoutTime: Date.now(),
      });
      
      console.log(`Removed session ${args.sessionId}`);
      return { success: true };
    }
    
    return { success: false, error: "Session not found" };
  },
});

// Get active supervisors
export const getActiveSupervisors = query({
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("supervisorSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Filter out stale sessions (> 10 minutes inactive)
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes
    
    const active = activeSessions.filter(session => {
      return (now - session.lastActivity) < timeout;
    });
    
    // Map to supervisor info
    return active.map(session => ({
      id: session.supervisorId,
      name: session.supervisorName,
      badge: session.badge,
      role: session.role,
      isAdmin: session.isAdmin,
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
    }));
  },
});

// Get supervisor session
export const getSession = query({
  args: {
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sessionId) return null;
    
    const session = await ctx.db
      .query("supervisorSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    
    if (!session || !session.isActive) return null;
    
    // Check if session is expired
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes
    
    if ((now - session.lastActivity) > timeout) {
      // Mark as inactive
      await ctx.db.patch(session._id, {
        isActive: false,
      });
      return null;
    }
    
    return {
      sessionId: session.sessionId,
      supervisor: {
        id: session.supervisorId,
        name: session.supervisorName,
        badge: session.badge,
        role: session.role,
        isAdmin: session.isAdmin,
      },
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
    };
  },
});

// Login supervisor (placeholder - actual auth happens in backend)
export const login = mutation({
  args: {
    badge: v.string(),
    name: v.string(),
    role: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    // This is called after backend auth succeeds
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("supervisorSessions", {
      sessionId,
      supervisorId: args.badge,
      supervisorName: args.name,
      badge: args.badge,
      role: args.role,
      isAdmin: args.isAdmin,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
    });
    
    return {
      success: true,
      sessionId,
      supervisor: {
        id: args.badge,
        name: args.name,
        badge: args.badge,
        role: args.role,
        isAdmin: args.isAdmin,
      },
    };
  },
});

// Logout supervisor
export const logout = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.supervisors.removeSession, {
      sessionId: args.sessionId,
    });
  },
});

// Force logout another supervisor (admin only)
export const forceLogout = mutation({
  args: {
    targetSessionId: v.string(),
    adminSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const adminSession = await ctx.db
      .query("supervisorSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.adminSessionId))
      .first();
    
    if (!adminSession || !adminSession.isAdmin) {
      return { success: false, error: "Unauthorized" };
    }
    
    // Force logout target
    return await ctx.runMutation(internal.supervisors.removeSession, {
      sessionId: args.targetSessionId,
    });
  },
});
