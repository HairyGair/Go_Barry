// convex/coordination.ts
// Multi-Supervisor Coordination Functions - Phase 4.1
// Real-time messaging and coordination between supervisors

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active coordination messages for a supervisor
export const getCoordinationMessages = query({
  args: { 
    supervisorId: v.string(),
    depotCode: v.optional(v.string()),
    includeArchived: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get all messages that target this supervisor
    let messages = await ctx.db
      .query("coordinationMessages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        // Messages that target all supervisors
        q.eq(q.field("targetType"), "all") ||
        // Messages that target this supervisor's depot
        (q.eq(q.field("targetType"), "depot") && 
         q.field("targetDepots").contains(args.depotCode || "")) ||
        // Messages that target this supervisor directly
        (q.eq(q.field("targetType"), "direct") && 
         q.field("targetSupervisors").contains(args.supervisorId))
      )
      .order("desc")
      .take(50);

    // Filter out expired messages unless includeArchived is true
    if (!args.includeArchived) {
      messages = messages.filter(msg => msg.expiresAt > now);
    }

    // Sort by priority and creation time
    messages.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.createdAt - a.createdAt;
    });

    return messages;
  },
});

// Send a coordination message
export const sendCoordinationMessage = mutation({
  args: {
    content: v.string(),
    messageType: v.string(),
    priority: v.string(),
    fromSupervisorId: v.string(),
    fromSupervisorName: v.string(),
    fromSupervisorBadge: v.string(),
    targetType: v.string(),
    targetDepots: v.optional(v.array(v.string())),
    targetSupervisors: v.optional(v.array(v.string())),
    targetRoles: v.optional(v.array(v.string())),
    subject: v.optional(v.string()),
    relatedAlertId: v.optional(v.string()),
    relatedIncidentId: v.optional(v.string()),
    requiresResponse: v.optional(v.boolean()),
    expirationHours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const messageId = `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    // Calculate expiration time based on priority and custom setting
    const defaultExpiration = {
      urgent: 2, // 2 hours
      high: 4,   // 4 hours
      medium: 8, // 8 hours
      low: 24    // 24 hours
    };
    
    const expirationMs = (args.expirationHours ?? defaultExpiration[args.priority as keyof typeof defaultExpiration] ?? 8) * 60 * 60 * 1000;
    
    await ctx.db.insert("coordinationMessages", {
      messageId,
      content: args.content,
      messageType: args.messageType,
      priority: args.priority,
      fromSupervisorId: args.fromSupervisorId,
      fromSupervisorName: args.fromSupervisorName,
      fromSupervisorBadge: args.fromSupervisorBadge,
      targetType: args.targetType,
      targetDepots: args.targetDepots ?? [],
      targetSupervisors: args.targetSupervisors ?? [],
      targetRoles: args.targetRoles ?? [],
      subject: args.subject,
      relatedAlertId: args.relatedAlertId,
      relatedIncidentId: args.relatedIncidentId,
      requiresResponse: args.requiresResponse ?? false,
      autoExpire: true,
      readBy: [],
      responses: [],
      createdAt: now,
      expiresAt: now + expirationMs,
      isActive: true,
    });

    // Log the coordination action
    await ctx.db.insert("supervisorActions", {
      action: "coordination_message_sent",
      supervisorId: args.fromSupervisorId,
      supervisorName: args.fromSupervisorName,
      timestamp: now,
      details: {
        messageId,
        messageType: args.messageType,
        targetType: args.targetType,
        priority: args.priority,
        subject: args.subject,
        requiresResponse: args.requiresResponse,
      },
    });

    return { success: true, messageId };
  },
});

// Mark message as read by supervisor
export const markMessageAsRead = mutation({
  args: {
    messageId: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("coordinationMessages")
      .filter((q) => q.eq(q.field("messageId"), args.messageId))
      .first();

    if (!message) {
      throw new Error("Message not found");
    }

    // Check if already read by this supervisor
    const alreadyRead = message.readBy.some(r => r.supervisorId === args.supervisorId);
    if (alreadyRead) return { success: true, alreadyRead: true };

    // Add to readBy array
    const updatedReadBy = [...message.readBy, {
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      readAt: Date.now()
    }];

    await ctx.db.patch(message._id, {
      readBy: updatedReadBy
    });

    return { success: true, alreadyRead: false };
  },
});

// Respond to a coordination message
export const respondToMessage = mutation({
  args: {
    messageId: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string(),
    response: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("coordinationMessages")
      .filter((q) => q.eq(q.field("messageId"), args.messageId))
      .first();

    if (!message) {
      throw new Error("Message not found");
    }

    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();

    // Add response to array
    const updatedResponses = [...message.responses, {
      responseId,
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      response: args.response,
      respondedAt: now
    }];

    await ctx.db.patch(message._id, {
      responses: updatedResponses
    });

    // Also mark as read if not already
    const alreadyRead = message.readBy.some(r => r.supervisorId === args.supervisorId);
    if (!alreadyRead) {
      const updatedReadBy = [...message.readBy, {
        supervisorId: args.supervisorId,
        supervisorName: args.supervisorName,
        readAt: now
      }];
      
      await ctx.db.patch(message._id, {
        readBy: updatedReadBy
      });
    }

    // Log the response action
    await ctx.db.insert("supervisorActions", {
      action: "coordination_response",
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      timestamp: now,
      details: {
        messageId: args.messageId,
        responseId,
        originalSender: message.fromSupervisorName,
      },
    });

    return { success: true, responseId };
  },
});

// Get depot channels
export const getDepotChannels = query({
  args: { depotCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("depotChannels").withIndex("by_active", (q) => q.eq("isActive", true));
    
    if (args.depotCode) {
      query = query.filter((q) => q.eq(q.field("depotCode"), args.depotCode));
    }
    
    return await query.order("desc").collect();
  },
});

// Create depot channel
export const createDepotChannel = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    depotCode: v.string(),
    createdBy: v.string(),
    allowedRoles: v.optional(v.array(v.string())),
    moderators: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const channelId = `depot_${args.depotCode.toLowerCase()}_${Date.now()}`;
    const now = Date.now();
    
    await ctx.db.insert("depotChannels", {
      channelId,
      name: args.name,
      description: args.description,
      depotCode: args.depotCode,
      isActive: true,
      autoArchive: true,
      archiveAfterHours: 168, // 7 days
      allowedRoles: args.allowedRoles ?? ["supervisor", "admin"],
      moderators: args.moderators ?? [args.createdBy],
      messageCount: 0,
      createdBy: args.createdBy,
      createdAt: now,
    });

    return { success: true, channelId };
  },
});

// Get coordination statistics for analytics
export const getCoordinationStats = query({
  args: { 
    supervisorId: v.optional(v.string()),
    timeframe: v.optional(v.string()) // '24h', '7d', '30d'
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeframes = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeframe = timeframes[args.timeframe as keyof typeof timeframes] ?? timeframes['24h'];
    const since = now - timeframe;

    let messages = await ctx.db
      .query("coordinationMessages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    // Filter by supervisor if specified
    if (args.supervisorId) {
      messages = messages.filter(msg => 
        msg.fromSupervisorId === args.supervisorId ||
        msg.targetSupervisors.includes(args.supervisorId) ||
        msg.targetType === "all"
      );
    }

    // Calculate statistics
    const stats = {
      totalMessages: messages.length,
      messagesSent: messages.filter(m => m.fromSupervisorId === args.supervisorId).length,
      messagesReceived: messages.filter(m => 
        m.fromSupervisorId !== args.supervisorId &&
        (m.targetType === "all" || m.targetSupervisors.includes(args.supervisorId || ""))
      ).length,
      byPriority: {
        urgent: messages.filter(m => m.priority === "urgent").length,
        high: messages.filter(m => m.priority === "high").length,
        medium: messages.filter(m => m.priority === "medium").length,
        low: messages.filter(m => m.priority === "low").length,
      },
      byType: {
        broadcast: messages.filter(m => m.messageType === "broadcast").length,
        depot: messages.filter(m => m.messageType === "depot").length,
        direct: messages.filter(m => m.messageType === "direct").length,
        alert_coordination: messages.filter(m => m.messageType === "alert_coordination").length,
      },
      responseRate: messages.filter(m => m.requiresResponse).length > 0 
        ? messages.filter(m => m.requiresResponse && m.responses.length > 0).length / 
          messages.filter(m => m.requiresResponse).length 
        : 0,
      averageResponseTime: 0, // Calculate if needed
    };

    return stats;
  },
});

// Clean up expired messages (called by cron)
export const cleanupExpiredMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredMessages = await ctx.db
      .query("coordinationMessages")
      .withIndex("by_expiry")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const message of expiredMessages) {
      await ctx.db.patch(message._id, { isActive: false });
    }

    return { success: true, expiredCount: expiredMessages.length };
  },
});
