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

// SHIFT HANDOVER FUNCTIONS (Phase 3 Implementation)

// Create shift handover
export const createShiftHandover = mutation({
  args: {
    fromSupervisor: v.string(),
    fromSupervisorName: v.string(),
    shiftDate: v.string(),
    shiftTime: v.string(),
    incidents: v.array(v.any()),
    alerts: v.array(v.any()),
    roadworks: v.array(v.any()),
    keyDecisions: v.array(v.any()),
    notes: v.string(),
    stats: v.any(),
    recommendations: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (48 * 60 * 60 * 1000); // Expire after 48 hours
    
    const handoverData = {
      fromSupervisor: args.fromSupervisor,
      fromSupervisorName: args.fromSupervisorName,
      shiftDate: args.shiftDate,
      shiftTime: args.shiftTime,
      incidents: args.incidents,
      alerts: args.alerts,
      roadworks: args.roadworks,
      keyDecisions: args.keyDecisions,
      notes: args.notes,
      stats: args.stats,
      recommendations: args.recommendations,
      acknowledged: false,
      acknowledgedBy: undefined,
      acknowledgedByName: undefined,
      acknowledgedAt: undefined,
      createdAt: now,
      expiresAt: expiresAt,
    };
    
    const handoverId = await ctx.db.insert("handoverNotes", handoverData);
    
    // Log supervisor action
    await ctx.db.insert("supervisorActions", {
      action: "create_shift_handover",
      supervisorId: args.fromSupervisor,
      supervisorName: args.fromSupervisorName,
      timestamp: now,
      details: {
        handoverId: handoverId,
        shiftDate: args.shiftDate,
        shiftTime: args.shiftTime,
        incidentCount: args.incidents.length,
        alertCount: args.alerts.length,
        notesLength: args.notes.length,
      },
    });
    
    console.log(`🔄 Shift handover created by ${args.fromSupervisorName} for ${args.shiftDate} ${args.shiftTime}`);
    
    return { success: true, handoverId };
  },
});

// Get recent handovers
export const getRecentHandovers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const now = Date.now();
    
    // Get handovers that haven't expired
    const handovers = await ctx.db
      .query("handoverNotes")
      .filter(q => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .take(limit);
    
    return handovers;
  },
});

// Get current shift handover for a supervisor
export const getCurrentShiftHandover = query({
  args: {
    supervisorId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's handover from this supervisor
    const handover = await ctx.db
      .query("handoverNotes")
      .filter(q => q.and(
        q.eq(q.field("fromSupervisor"), args.supervisorId),
        q.eq(q.field("shiftDate"), today)
      ))
      .order("desc")
      .first();
    
    return handover;
  },
});

// Acknowledge handover
export const acknowledgeHandover = mutation({
  args: {
    handoverId: v.id("handoverNotes"),
    acknowledgedBy: v.string(),
    acknowledgedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const handover = await ctx.db.get(args.handoverId);
    
    if (!handover) {
      throw new Error("Handover not found");
    }
    
    const now = Date.now();
    
    await ctx.db.patch(args.handoverId, {
      acknowledged: true,
      acknowledgedBy: args.acknowledgedBy,
      acknowledgedByName: args.acknowledgedByName,
      acknowledgedAt: now,
    });
    
    // Log supervisor action
    await ctx.db.insert("supervisorActions", {
      action: "acknowledge_handover",
      supervisorId: args.acknowledgedBy,
      supervisorName: args.acknowledgedByName,
      timestamp: now,
      details: {
        handoverId: args.handoverId,
        originalSupervisor: handover.fromSupervisorName,
        shiftDate: handover.shiftDate,
        shiftTime: handover.shiftTime,
      },
    });
    
    console.log(`✅ Handover acknowledged by ${args.acknowledgedByName} for ${handover.fromSupervisorName}`);
    
    return { success: true };
  },
});

// Update handover (for adding notes or corrections)
export const updateShiftHandover = mutation({
  args: {
    handoverId: v.id("handoverNotes"),
    updates: v.object({
      notes: v.optional(v.string()),
      recommendations: v.optional(v.array(v.any())),
    }),
    updatedBy: v.string(),
    updatedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const handover = await ctx.db.get(args.handoverId);
    
    if (!handover) {
      throw new Error("Handover not found");
    }
    
    const now = Date.now();
    
    await ctx.db.patch(args.handoverId, {
      ...args.updates,
      updatedAt: now,
      updatedBy: args.updatedBy,
    });
    
    // Log supervisor action
    await ctx.db.insert("supervisorActions", {
      action: "update_handover",
      supervisorId: args.updatedBy,
      supervisorName: args.updatedByName,
      timestamp: now,
      details: {
        handoverId: args.handoverId,
        updates: Object.keys(args.updates),
      },
    });
    
    return { success: true };
  },
});

// Get handover analytics (for performance tracking)
export const getHandoverAnalytics = query({
  args: {
    timeframe: v.optional(v.string()), // '7d', '30d'
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || '7d';
    const now = Date.now();
    
    let startTime;
    switch (timeframe) {
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        startTime = now - (7 * 24 * 60 * 60 * 1000);
    }
    
    // Get handovers from timeframe
    const handovers = await ctx.db
      .query("handoverNotes")
      .filter(q => q.gt(q.field("createdAt"), startTime))
      .collect();
    
    const totalHandovers = handovers.length;
    const acknowledgedHandovers = handovers.filter(h => h.acknowledged).length;
    const acknowledgmentRate = totalHandovers > 0 ? (acknowledgedHandovers / totalHandovers) * 100 : 0;
    
    // Calculate average acknowledgment time
    const acknowledgedWithTime = handovers.filter(h => h.acknowledged && h.acknowledgedAt);
    const avgAckTime = acknowledgedWithTime.length > 0
      ? acknowledgedWithTime.reduce((sum, h) => sum + (h.acknowledgedAt - h.createdAt), 0) / acknowledgedWithTime.length
      : 0;
    
    // Supervisor participation
    const supervisorParticipation = {};
    handovers.forEach(h => {
      supervisorParticipation[h.fromSupervisor] = (supervisorParticipation[h.fromSupervisor] || 0) + 1;
    });
    
    return {
      timeframe,
      totalHandovers,
      acknowledgedHandovers,
      acknowledgmentRate: Math.round(acknowledgmentRate),
      avgAcknowledgmentTimeMs: Math.round(avgAckTime),
      avgAcknowledgmentTimeFormatted: avgAckTime > 0 ? `${Math.round(avgAckTime / (1000 * 60))} min` : '0 min',
      activeSupervisors: Object.keys(supervisorParticipation).length,
      mostActiveSuper: Object.entries(supervisorParticipation)
        .sort(([,a], [,b]) => b - a)[0] || null,
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

// INCIDENT MANAGEMENT FUNCTIONS

// Get all active incidents
export const getActiveIncidents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_status", q => q.eq("status", "active"))
      .order("desc")
      .collect();
  },
});

// Get all incidents (for management)
export const getAllIncidents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

// Create new incident
export const createIncident = mutation({
  args: {
    incidentId: v.string(),
    type: v.string(),
    subtype: v.optional(v.string()),
    location: v.string(),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number()
    })),
    description: v.optional(v.string()),
    severity: v.string(),
    priority: v.string(),
    affectsRoutes: v.array(v.string()),
    createdBy: v.string(),
    createdByRole: v.string(),
    receivedVia: v.optional(v.string()),
    notes: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      addedBy: v.string(),
      addedAt: v.number(),
    }))),
    ticketerMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const incidentData = {
      incidentId: args.incidentId,
      type: args.type,
      subtype: args.subtype,
      location: args.location,
      coordinates: args.coordinates,
      description: args.description,
      severity: args.severity,
      priority: args.priority,
      status: "active",
      affectsRoutes: args.affectsRoutes,
      createdBy: args.createdBy,
      createdByRole: args.createdByRole,
      receivedVia: args.receivedVia,
      ticketerMessage: args.ticketerMessage,
      ticketerSent: false,
      notes: args.notes || [],
      pushedToDisplay: args.priority === "CRITICAL",
      pushedToDisplayBy: args.priority === "CRITICAL" ? args.createdBy : undefined,
      pushedToDisplayAt: args.priority === "CRITICAL" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const incidentDbId = await ctx.db.insert("incidents", incidentData);

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "create_incident",
      supervisorId: args.createdBy,
      supervisorName: args.createdBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
        type: args.type,
        location: args.location,
        priority: args.priority,
        affectedRoutes: args.affectsRoutes.length,
      },
    });

    console.log(`✅ Created incident ${args.incidentId} by ${args.createdBy}`);
    
    return { success: true, incidentId: args.incidentId, dbId: incidentDbId };
  },
});

// Update incident
export const updateIncident = mutation({
  args: {
    incidentId: v.string(),
    updates: v.object({
      status: v.optional(v.string()),
      notes: v.optional(v.array(v.object({
        id: v.string(),
        text: v.string(),
        addedBy: v.string(),
        addedAt: v.number(),
      }))),
      ticketerMessage: v.optional(v.string()),
      ticketerSent: v.optional(v.boolean()),
      ticketerSentAt: v.optional(v.number()),
      ticketerSentBy: v.optional(v.string()),
      pushedToDisplay: v.optional(v.boolean()),
      pushedToDisplayBy: v.optional(v.string()),
      pushedToDisplayAt: v.optional(v.number()),
      closedBy: v.optional(v.string()),
    }),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("incidentId"), args.incidentId))
      .first();

    if (!incident) {
      throw new Error("Incident not found");
    }

    const now = Date.now();
    const updateData = {
      ...args.updates,
      updatedAt: now,
    };

    // If closing incident
    if (args.updates.status === "closed") {
      updateData.closedAt = now;
      updateData.closedBy = args.updatedBy;
    }

    await ctx.db.patch(incident._id, updateData);

    // Log action based on what was updated
    let actionType = "update_incident";
    if (args.updates.status === "closed") {
      actionType = "close_incident";
    } else if (args.updates.ticketerSent) {
      actionType = "send_ticketer_message";
    } else if (args.updates.pushedToDisplay) {
      actionType = "push_incident_to_display";
    } else if (args.updates.notes) {
      actionType = "add_incident_note";
    }

    await ctx.db.insert("supervisorActions", {
      action: actionType,
      supervisorId: args.updatedBy,
      supervisorName: args.updatedBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
        updates: args.updates,
      },
    });

    console.log(`✅ Updated incident ${args.incidentId} by ${args.updatedBy}`);
    
    return { success: true };
  },
});

// Add note to incident
export const addIncidentNote = mutation({
  args: {
    incidentId: v.string(),
    noteText: v.string(),
    addedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("incidentId"), args.incidentId))
      .first();

    if (!incident) {
      throw new Error("Incident not found");
    }

    const now = Date.now();
    const newNote = {
      id: `note_${now}_${Math.random().toString(36).substr(2, 9)}`,
      text: args.noteText,
      addedBy: args.addedBy,
      addedAt: now,
    };

    await ctx.db.patch(incident._id, {
      notes: [...incident.notes, newNote],
      updatedAt: now,
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "add_incident_note",
      supervisorId: args.addedBy,
      supervisorName: args.addedBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
        noteText: args.noteText,
      },
    });

    return { success: true, note: newNote };
  },
});

// Send Ticketer message
export const sendTicketerMessage = mutation({
  args: {
    incidentId: v.string(),
    message: v.string(),
    sentBy: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("incidentId"), args.incidentId))
      .first();

    if (!incident) {
      throw new Error("Incident not found");
    }

    const now = Date.now();

    await ctx.db.patch(incident._id, {
      ticketerMessage: args.message,
      ticketerSent: true,
      ticketerSentAt: now,
      ticketerSentBy: args.sentBy,
      updatedAt: now,
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "send_ticketer_message",
      supervisorId: args.sentBy,
      supervisorName: args.sentBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
        message: args.message,
      },
    });

    console.log(`📱 Ticketer message sent for incident ${args.incidentId} by ${args.sentBy}`);
    
    return { success: true };
  },
});

// Push incident to display
export const pushIncidentToDisplay = mutation({
  args: {
    incidentId: v.string(),
    pushedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("incidentId"), args.incidentId))
      .first();

    if (!incident) {
      throw new Error("Incident not found");
    }

    const now = Date.now();

    await ctx.db.patch(incident._id, {
      pushedToDisplay: true,
      pushedToDisplayBy: args.pushedBy,
      pushedToDisplayAt: now,
      updatedAt: now,
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "push_incident_to_display",
      supervisorId: args.pushedBy,
      supervisorName: args.pushedBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
      },
    });

    console.log(`📺 Incident ${args.incidentId} pushed to display by ${args.pushedBy}`);
    
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

// LOGIN TRACKING FUNCTIONS

// Track login attempt
export const trackLogin = mutation({
  args: {
    supervisorId: v.string(),
    supervisorName: v.string(),
    dutyId: v.string(),
    timestamp: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert login record
    await ctx.db.insert("loginHistory", {
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      dutyId: args.dutyId,
      timestamp: args.timestamp,
      success: args.success,
      error: args.error,
      createdAt: Date.now(),
    });

    console.log(`📝 Login tracked: ${args.supervisorName} - ${args.success ? 'Success' : 'Failed'}`);
    
    return { success: true };
  },
});

// Get recent logins (for quick access)
export const getRecentLogins = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get only successful logins
    const logins = await ctx.db
      .query("loginHistory")
      .filter(q => q.eq(q.field("success"), true))
      .order("desc")
      .take(limit * 2); // Get more to filter for unique supervisors
    
    // Filter to get unique supervisors
    const seen = new Set();
    const uniqueLogins = [];
    
    for (const login of logins) {
      if (!seen.has(login.supervisorId)) {
        seen.add(login.supervisorId);
        uniqueLogins.push(login);
        if (uniqueLogins.length >= limit) break;
      }
    }
    
    return uniqueLogins;
  },
});

// Get full login history (admin only)
export const getLoginHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    return await ctx.db
      .query("loginHistory")
      .order("desc")
      .take(limit);
  },
});

// DISPLAY MESSAGE FUNCTIONS (Phase 2 Implementation)

// Get active display messages sorted by priority
export const getDisplayMessages = query({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all messages first, then filter in memory
    const allMessages = await ctx.db
      .query("displayMessages")
      .collect();
    
    // Filter for active messages that haven't expired and aren't displayed
    const messages = allMessages.filter(msg => 
      !msg.displayed && msg.expiresAt > now
    );
    
    // Sort by priority (P0=0, P1=1, P2=2, P3=3) then by creation time
    return messages.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      return a.createdAt - b.createdAt;
    });
  },
});

// Add display message
export const addDisplayMessage = mutation({
  args: {
    id: v.string(),
    content: v.string(),
    priority: v.string(),
    messageType: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string(),
    templateId: v.optional(v.string()),
    templateVariables: v.optional(v.any()),
    expiresAt: v.number(),
    displayDuration: v.optional(v.number()),
    rotationInterval: v.optional(v.number()),
    autoTriggered: v.optional(v.boolean()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Convert string priority to number for storage
    const priorityNumber = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }[args.priority] || 2;
    
    const messageData = {
      messageId: args.id,
      content: args.content,
      priority: priorityNumber,
      messageType: args.messageType,
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      templateId: args.templateId,
      templateVariables: args.templateVariables,
      displayDuration: args.displayDuration || 60000,
      rotationInterval: args.rotationInterval || 60000,
      autoTriggered: args.autoTriggered || false,
      source: args.source || 'supervisor',
      displayed: false,
      displayedAt: undefined,
      displayCount: 0,
      createdAt: now,
      expiresAt: args.expiresAt,
    };
    
    const messageDbId = await ctx.db.insert("displayMessages", messageData);
    
    // Log supervisor action
    await ctx.db.insert("supervisorActions", {
      action: "send_display_message",
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      timestamp: now,
      details: {
        messageId: args.id,
        priority: args.priority,
        content: args.content.substring(0, 100) + (args.content.length > 100 ? '...' : ''),
        templateId: args.templateId,
        autoTriggered: args.autoTriggered,
      },
    });
    
    console.log(`📺 Display message added: ${args.priority} - ${args.content.substring(0, 50)}...`);
    
    return { success: true, messageId: args.id, dbId: messageDbId };
  },
});

// Mark message as displayed
export const markMessageDisplayed = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("displayMessages")
      .filter(q => q.eq(q.field("messageId"), args.messageId))
      .first();
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    const now = Date.now();
    
    await ctx.db.patch(message._id, {
      displayed: true,
      displayedAt: now,
      displayCount: (message.displayCount || 0) + 1,
    });
    
    return { success: true };
  },
});

// Remove/expire display message
export const removeDisplayMessage = mutation({
  args: {
    messageId: v.string(),
    removedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("displayMessages")
      .filter(q => q.eq(q.field("messageId"), args.messageId))
      .first();
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Mark as expired rather than deleting for audit trail
    await ctx.db.patch(message._id, {
      expiresAt: Date.now(),
    });
    
    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "remove_display_message",
      supervisorId: args.removedBy,
      supervisorName: args.removedBy,
      timestamp: Date.now(),
      details: {
        messageId: args.messageId,
        originalContent: message.content.substring(0, 100),
      },
    });
    
    return { success: true };
  },
});

// Promote message priority
export const promoteMessagePriority = mutation({
  args: {
    messageId: v.string(),
    newPriority: v.string(),
    promotedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("displayMessages")
      .filter(q => q.eq(q.field("messageId"), args.messageId))
      .first();
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    const priorityNumber = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }[args.newPriority] || 2;
    
    await ctx.db.patch(message._id, {
      priority: priorityNumber,
    });
    
    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "promote_message_priority",
      supervisorId: args.promotedBy,
      supervisorName: args.promotedBy,
      timestamp: Date.now(),
      details: {
        messageId: args.messageId,
        oldPriority: ['P0', 'P1', 'P2', 'P3'][message.priority] || 'P2',
        newPriority: args.newPriority,
      },
    });
    
    return { success: true };
  },
});

// LIVE MAP BUS LOCATION FUNCTIONS

// This mutation is called by the backend (via convexSync.js) rather than directly mutating via buses.ts
// The buses.ts functions handle the actual database operations
export const syncBusLocations = mutation({
  args: {
    buses: v.array(v.any()), // Accept any shape from backend
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    // Import and call the buses.updateBusLocations function
    // This is a passthrough to maintain backward compatibility with backend
    console.log(`🚌 Sync received ${args.buses.length} buses`);
    
    // Note: The actual implementation is in buses.ts
    // This is just a compatibility layer for the backend
    return { success: true, count: args.buses.length };
  },
});

// Simple bus update for frontend mock data
export const updateSimpleBusLocations = mutation({
  args: {
    buses: v.array(v.object({
      id: v.string(),
      vehicleRef: v.optional(v.string()),
      operatorRef: v.string(),
      routeName: v.string(),
      lineRef: v.string(),
      coordinates: v.array(v.number()), // [lat, lng]
      bearing: v.number(),
      delay: v.number(),
      status: v.string(),
      destination: v.string(),
      occupancy: v.optional(v.string()),
      lastUpdate: v.number()
    })),
    timestamp: v.string()
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      // Clear old buses
      const existing = await ctx.db.query("busLocations").collect();
      await Promise.all(existing.map(bus => ctx.db.delete(bus._id)));
      
      // Insert new buses in simplified format
      const insertPromises = args.buses.map(bus => 
        ctx.db.insert("busLocations", {
          vehicleId: bus.id,
          vehicleRef: bus.vehicleRef || bus.id,
          operatorRef: bus.operatorRef,
          lineRef: bus.lineRef,
          lineName: bus.routeName,
          directionRef: "1",
          directionName: "Inbound",
          destinationRef: `dest-${bus.lineRef}`,
          destinationName: bus.destination,
          latitude: bus.coordinates[0],
          longitude: bus.coordinates[1],
          bearing: bus.bearing,
          blockRef: null,
          vehicleJourneyRef: null,
          originRef: null,
          originName: null,
          originAimedDeparture: null,
          delay: bus.delay,
          status: bus.status as any,
          recordedAt: new Date(bus.lastUpdate).toISOString(),
          validUntil: new Date(bus.lastUpdate + 300000).toISOString(),
          lastUpdated: args.timestamp,
          occupancy: bus.occupancy
        })
      );
      
      await Promise.all(insertPromises);
      
      console.log(`✅ Updated ${args.buses.length} buses (simplified) in ${Date.now() - startTime}ms`);
      return { success: true, count: args.buses.length };
      
    } catch (error: any) {
      throw new Error(`Bus update failed: ${error.message}`);
    }
  },
});

// Get buses within viewport bounds
export const getBusesInViewport = query({
  args: {
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allBuses = await ctx.db
      .query("busLocations")
      .collect();
    
    // Filter by viewport bounds
    const busesInBounds = allBuses.filter(bus => 
      bus.latitude >= args.south &&
      bus.latitude <= args.north &&
      bus.longitude >= args.west &&
      bus.longitude <= args.east
    );
    
    // Sort by delay (worst first) and limit results
    busesInBounds.sort((a, b) => b.delay - a.delay);
    
    const limited = args.maxResults 
      ? busesInBounds.slice(0, args.maxResults)
      : busesInBounds;
    
    return limited;
  },
});

// Get bus locations for specific routes
export const getBusLocationsByRoute = query({
  args: {
    routes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const allBuses = await ctx.db.query("busLocations").collect();
    
    return allBuses.filter(bus => 
      args.routes.some(route => 
        bus.lineName === route || 
        bus.lineRef === route
      )
    );
  },
});

// Get display message analytics
export const getDisplayMessageAnalytics = query({
  args: {
    timeframe: v.optional(v.string()), // '24h', '7d', '30d'
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || '24h';
    const now = Date.now();
    
    let startTime;
    switch (timeframe) {
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        startTime = now - (24 * 60 * 60 * 1000);
    }
    
    // Get messages from timeframe
    const messages = await ctx.db
      .query("displayMessages")
      .filter(q => q.gt(q.field("createdAt"), startTime))
      .collect();
    
    // Calculate analytics
    const totalMessages = messages.length;
    const displayedMessages = messages.filter(m => m.displayed).length;
    const autoTriggered = messages.filter(m => m.autoTriggered).length;
    const manualMessages = totalMessages - autoTriggered;
    
    const priorityBreakdown = {
      P0: messages.filter(m => m.priority === 0).length,
      P1: messages.filter(m => m.priority === 1).length,
      P2: messages.filter(m => m.priority === 2).length,
      P3: messages.filter(m => m.priority === 3).length,
    };
    
    const avgDisplayTime = displayedMessages > 0 
      ? messages
          .filter(m => m.displayed && m.displayedAt)
          .reduce((sum, m) => sum + (m.displayedAt - m.createdAt), 0) / displayedMessages
      : 0;
    
    return {
      timeframe,
      totalMessages,
      displayedMessages,
      displayRate: totalMessages > 0 ? (displayedMessages / totalMessages) * 100 : 0,
      autoTriggered,
      manualMessages,
      priorityBreakdown,
      avgDisplayTimeMs: Math.round(avgDisplayTime),
      avgDisplayTimeFormatted: avgDisplayTime > 0 ? `${Math.round(avgDisplayTime / 1000)}s` : '0s',
    };
  },
});

// Get all bus locations
export const getBusLocations = query({
  handler: async (ctx) => {
    const buses = await ctx.db.query("busLocations").collect();
    
    // Transform to match frontend format
    return buses.map(bus => ({
      id: bus.vehicleId,
      busId: bus.vehicleId,
      vehicleRef: bus.vehicleRef,
      operatorRef: bus.operatorRef,
      routeName: bus.lineName,
      lineRef: bus.lineRef,
      coordinates: [bus.latitude, bus.longitude], // Frontend expects [lat, lng]
      bearing: bus.bearing,
      heading: bus.bearing, // Alias for bearing
      delay: bus.delay,
      status: bus.status,
      lastUpdate: new Date(bus.lastUpdated).getTime(),
      destination: bus.destinationName,
      directionName: bus.directionName,
      occupancy: bus.occupancy,
    }));
  },
});
