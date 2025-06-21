// convex/supervisors.ts
// Supervisor authentication and session management

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Login mutation - creates a supervisor session
export const login = mutation({
  args: {
    supervisorId: v.string(),
    badge: v.string(),
    password: v.optional(v.string()),
    duty: v.object({
      id: v.string(),
      name: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Check if supervisor exists in our hardcoded list
    const supervisors = {
      'supervisor001': { name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor', requiresPassword: false },
      'supervisor002': { name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor', requiresPassword: false },
      'supervisor003': { name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin', requiresPassword: false, isAdmin: true },
      'supervisor004': { name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor', requiresPassword: false },
      'supervisor005': { name: 'David Hall', badge: 'DH005', role: 'Supervisor', requiresPassword: false },
      'supervisor006': { name: 'James Daglish', badge: 'JD006', role: 'Supervisor', requiresPassword: false },
      'supervisor007': { name: 'John Paterson', badge: 'JP007', role: 'Supervisor', requiresPassword: false },
      'supervisor008': { name: 'Simon Glass', badge: 'SG008', role: 'Supervisor', requiresPassword: false },
      'supervisor009': { name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller', requiresPassword: true, password: 'Barry123', isAdmin: true },
    };

    const supervisor = supervisors[args.supervisorId as keyof typeof supervisors];
    if (!supervisor || supervisor.badge !== args.badge) {
      throw new Error("Invalid supervisor credentials");
    }

    // Check password if required
    if (supervisor.requiresPassword && supervisor.password !== args.password) {
      throw new Error("Invalid password");
    }

    // Deactivate any existing sessions for this supervisor
    const existingSessions = await ctx.db
      .query("supervisorSessions")
      .withIndex("by_supervisor", q => q.eq("supervisorId", args.supervisorId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    // Create new session
    const sessionId = await ctx.db.insert("supervisorSessions", {
      supervisorId: args.supervisorId,
      supervisorName: supervisor.name,
      badge: args.badge,
      role: supervisor.role,
      isAdmin: supervisor.isAdmin || false,
      duty: args.duty,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
    });

    // Log the login action
    await ctx.db.insert("supervisorActions", {
      action: "supervisor_login",
      supervisorId: args.supervisorId,
      supervisorName: supervisor.name,
      timestamp: Date.now(),
      details: {
        duty: args.duty.name,
        role: supervisor.role,
      },
    });

    // Update sync state
    await updateSyncState(ctx);

    return {
      success: true,
      sessionId,
      supervisor: {
        id: args.supervisorId,
        name: supervisor.name,
        badge: args.badge,
        role: supervisor.role,
        isAdmin: supervisor.isAdmin || false,
      },
    };
  },
});

// Logout mutation
export const logout = mutation({
  args: {
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Deactivate session
    await ctx.db.patch(args.sessionId, { isActive: false });

    // Log the logout action
    await ctx.db.insert("supervisorActions", {
      action: "supervisor_logout",
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      timestamp: Date.now(),
      details: {
        sessionDuration: Date.now() - session.loginTime,
      },
    });

    // Update sync state
    await updateSyncState(ctx);

    return { success: true };
  },
});

// Get active session
export const getSession = query({
  args: {
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    // Check if session has expired (10 minutes)
    const sessionTimeout = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - session.lastActivity > sessionTimeout) {
      await ctx.db.patch(args.sessionId, { isActive: false });
      return null;
    }

    return session;
  },
});

// Get all active supervisors
export const getActiveSupervisors = query({
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("supervisorSessions")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    return activeSessions.map(session => ({
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      badge: session.badge,
      duty: session.duty.name,
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
    }));
  },
});

// Update last activity
export const updateActivity = mutation({
  args: {
    sessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new Error("Invalid session");
    }

    await ctx.db.patch(args.sessionId, {
      lastActivity: Date.now(),
    });

    return { success: true };
  },
});

// Force logout (admin only)
export const forceLogout = mutation({
  args: {
    targetSessionId: v.id("supervisorSessions"),
    adminSessionId: v.id("supervisorSessions"),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const adminSession = await ctx.db.get(args.adminSessionId);
    if (!adminSession || !adminSession.isActive || !adminSession.isAdmin) {
      throw new Error("Unauthorized - admin access required");
    }

    // Get target session
    const targetSession = await ctx.db.get(args.targetSessionId);
    if (!targetSession) {
      throw new Error("Target session not found");
    }

    // Force logout
    await ctx.db.patch(args.targetSessionId, { isActive: false });

    // Log the action
    await ctx.db.insert("supervisorActions", {
      action: "force_logout",
      supervisorId: adminSession.supervisorId,
      supervisorName: adminSession.supervisorName,
      timestamp: Date.now(),
      details: {
        targetSupervisor: targetSession.supervisorName,
        targetSessionId: args.targetSessionId,
      },
    });

    // Update sync state
    await updateSyncState(ctx);

    return { success: true };
  },
});

// Helper function to update sync state
async function updateSyncState(ctx: any) {
  const activeSessions = await ctx.db
    .query("supervisorSessions")
    .withIndex("by_active", q => q.eq("isActive", true))
    .collect();

  const activeSupervisors = activeSessions.map((session: Doc<"supervisorSessions">) => ({
    supervisorId: session.supervisorId,
    supervisorName: session.supervisorName,
    badge: session.badge,
    duty: session.duty.name,
    lastSeen: session.lastActivity,
  }));

  // Get or create sync state
  const existingState = await ctx.db
    .query("syncState")
    .withIndex("by_key", q => q.eq("key", "global"))
    .first();

  if (existingState) {
    await ctx.db.patch(existingState._id, {
      connectedSupervisors: activeSessions.length,
      activeSupervisors,
      lastUpdated: Date.now(),
    });
  } else {
    await ctx.db.insert("syncState", {
      key: "global",
      connectedSupervisors: activeSessions.length,
      activeSupervisors,
      customMessages: [],
      displayMode: "normal",
      lastUpdated: Date.now(),
    });
  }
}
