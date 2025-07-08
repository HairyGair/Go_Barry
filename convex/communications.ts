// convex/communications.ts
// Enhanced Convex functions for Communications Platform
// Real-time sync for emails, VoIP, templates, and message queues

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// =======================
// EMAIL TEMPLATES
// =======================

/**
 * Create a new email template
 */
export const createEmailTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    variables: v.array(v.object({
      name: v.string(),
      type: v.string(),
      required: v.boolean(),
      defaultValue: v.optional(v.string()),
      description: v.string(),
    })),
    category: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const id = await ctx.db.insert("emailTemplates", {
      templateId,
      name: args.name,
      subject: args.subject,
      body: args.body,
      variables: args.variables,
      category: args.category,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      lastModified: Date.now(),
      usage: 0,
    });

    return { success: true, templateId, id };
  },
});

/**
 * Get all email templates
 */
export const getEmailTemplates = query({
  args: {
    category: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let templates = ctx.db.query("emailTemplates");
    
    if (args.category) {
      templates = templates.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    if (args.activeOnly !== false) {
      templates = templates.filter((q) => q.eq(q.field("isActive"), true));
    }
    
    return await templates.order("desc").collect();
  },
});

/**
 * Update template usage count
 */
export const incrementTemplateUsage = mutation({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("emailTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();

    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(template._id, {
      usage: template.usage + 1,
    });

    return { success: true };
  },
});

// =======================
// DISTRIBUTION LISTS
// =======================

/**
 * Create a new distribution list
 */
export const createDistributionList = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    members: v.array(v.object({
      email: v.string(),
      name: v.string(),
      role: v.string(),
      department: v.string(),
      isActive: v.boolean(),
      addedAt: v.number(),
    })),
    type: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const id = await ctx.db.insert("distributionLists", {
      listId,
      name: args.name,
      description: args.description,
      members: args.members,
      type: args.type,
      criteria: null,
      isActive: true,
      createdBy: args.createdBy,
      lastSyncAt: Date.now(),
      memberCount: args.members.length,
    });

    return { success: true, listId, id };
  },
});

/**
 * Get all distribution lists
 */
export const getDistributionLists = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let lists = ctx.db.query("distributionLists");
    
    if (args.activeOnly !== false) {
      lists = lists.filter((q) => q.eq(q.field("isActive"), true));
    }
    
    return await lists.order("desc").collect();
  },
});

/**
 * Add member to distribution list
 */
export const addToDistributionList = mutation({
  args: {
    listId: v.string(),
    member: v.object({
      email: v.string(),
      name: v.string(),
      role: v.string(),
      department: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("distributionLists")
      .filter((q) => q.eq(q.field("listId"), args.listId))
      .first();

    if (!list) {
      throw new Error("Distribution list not found");
    }

    const newMember = {
      ...args.member,
      isActive: true,
      addedAt: Date.now(),
    };

    const updatedMembers = [...list.members, newMember];

    await ctx.db.patch(list._id, {
      members: updatedMembers,
      memberCount: updatedMembers.length,
      lastSyncAt: Date.now(),
    });

    return { success: true };
  },
});

// =======================
// COMMUNICATION LOGS
// =======================

/**
 * Log a communication activity
 */
export const logCommunication = mutation({
  args: {
    type: v.string(), // 'email', 'voip', 'ticketer', 'sms'
    action: v.string(), // 'sent', 'received', 'failed', 'scheduled'
    from: v.string(),
    to: v.array(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    templateUsed: v.optional(v.string()),
    supervisorId: v.string(),
    supervisorName: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const id = await ctx.db.insert("communicationLogs", {
      logId,
      type: args.type,
      action: args.action,
      from: args.from,
      to: args.to,
      subject: args.subject,
      content: args.content,
      templateUsed: args.templateUsed,
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      success: args.success,
      errorMessage: args.errorMessage,
      timestamp: Date.now(),
      deliveredAt: args.success ? Date.now() : undefined,
      readAt: undefined,
    });

    return { success: true, logId, id };
  },
});

/**
 * Get communication logs for a supervisor
 */
export const getCommunicationLogs = query({
  args: {
    supervisorId: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = ctx.db.query("communicationLogs");
    
    if (args.supervisorId) {
      logs = logs.filter((q) => q.eq(q.field("supervisorId"), args.supervisorId));
    }
    
    if (args.type) {
      logs = logs.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const result = await logs.order("desc").collect();
    
    if (args.limit) {
      return result.slice(0, args.limit);
    }
    
    return result;
  },
});

/**
 * Get communication statistics
 */
export const getCommunicationStats = query({
  args: {
    supervisorId: v.optional(v.string()),
    timeframe: v.optional(v.string()), // 'today', 'week', 'month'
  },
  handler: async (ctx, args) => {
    let logs = ctx.db.query("communicationLogs");
    
    if (args.supervisorId) {
      logs = logs.filter((q) => q.eq(q.field("supervisorId"), args.supervisorId));
    }
    
    // Apply timeframe filter
    if (args.timeframe) {
      const now = Date.now();
      let cutoff = now;
      
      switch (args.timeframe) {
        case 'today':
          cutoff = now - (24 * 60 * 60 * 1000);
          break;
        case 'week':
          cutoff = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoff = now - (30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      logs = logs.filter((q) => q.gte(q.field("timestamp"), cutoff));
    }
    
    const allLogs = await logs.collect();
    
    const stats = {
      total: allLogs.length,
      successful: allLogs.filter(log => log.success).length,
      failed: allLogs.filter(log => !log.success).length,
      byType: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
    };
    
    // Count by type and action
    allLogs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });
    
    return stats;
  },
});

// =======================
// VOIP SESSIONS
// =======================

/**
 * Create a VoIP session
 */
export const createVoIPSession = mutation({
  args: {
    callId: v.optional(v.string()),
    from: v.string(),
    to: v.string(),
    type: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string(),
    isEmergency: v.boolean(),
    emergencyType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = `voip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const id = await ctx.db.insert("voipSessions", {
      sessionId,
      callId: args.callId,
      from: args.from,
      to: args.to,
      type: args.type,
      status: "ringing",
      duration: 0,
      audioQuality: undefined,
      latency: undefined,
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      startedAt: Date.now(),
      connectedAt: undefined,
      endedAt: undefined,
      isEmergency: args.isEmergency,
      emergencyType: args.emergencyType,
    });

    return { success: true, sessionId, id };
  },
});

/**
 * Update VoIP session status
 */
export const updateVoIPSession = mutation({
  args: {
    sessionId: v.string(),
    status: v.string(),
    duration: v.optional(v.number()),
    audioQuality: v.optional(v.number()),
    latency: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("voipSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (!session) {
      throw new Error("VoIP session not found");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.status === "connected" && !session.connectedAt) {
      updates.connectedAt = Date.now();
    }

    if (args.status === "ended") {
      updates.endedAt = Date.now();
      if (args.duration !== undefined) {
        updates.duration = args.duration;
      }
    }

    if (args.audioQuality !== undefined) {
      updates.audioQuality = args.audioQuality;
    }

    if (args.latency !== undefined) {
      updates.latency = args.latency;
    }

    await ctx.db.patch(session._id, updates);

    return { success: true };
  },
});

/**
 * Get VoIP sessions
 */
export const getVoIPSessions = query({
  args: {
    supervisorId: v.optional(v.string()),
    status: v.optional(v.string()),
    emergencyOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let sessions = ctx.db.query("voipSessions");
    
    if (args.supervisorId) {
      sessions = sessions.filter((q) => q.eq(q.field("supervisorId"), args.supervisorId));
    }
    
    if (args.status) {
      sessions = sessions.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    if (args.emergencyOnly) {
      sessions = sessions.filter((q) => q.eq(q.field("isEmergency"), true));
    }
    
    const result = await sessions.order("desc").collect();
    
    if (args.limit) {
      return result.slice(0, args.limit);
    }
    
    return result;
  },
});

// =======================
// MESSAGE QUEUES
// =======================

/**
 * Add message to queue
 */
export const queueMessage = mutation({
  args: {
    messageId: v.string(),
    type: v.string(),
    priority: v.string(),
    to: v.array(v.string()),
    subject: v.optional(v.string()),
    content: v.string(),
    templateId: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    supervisorId: v.string(),
  },
  handler: async (ctx, args) => {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const id = await ctx.db.insert("messageQueues", {
      queueId,
      messageId: args.messageId,
      type: args.type,
      priority: args.priority,
      status: "pending",
      to: args.to,
      subject: args.subject,
      content: args.content,
      templateId: args.templateId,
      scheduledFor: args.scheduledFor,
      retryCount: 0,
      maxRetries: 3,
      supervisorId: args.supervisorId,
      createdAt: Date.now(),
      processedAt: undefined,
      sentAt: undefined,
      failedAt: undefined,
      errorMessage: undefined,
    });

    return { success: true, queueId, id };
  },
});

/**
 * Update message queue status
 */
export const updateMessageStatus = mutation({
  args: {
    queueId: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("messageQueues")
      .filter((q) => q.eq(q.field("queueId"), args.queueId))
      .first();

    if (!message) {
      throw new Error("Message not found in queue");
    }

    const updates: any = {
      status: args.status,
    };

    switch (args.status) {
      case "processing":
        updates.processedAt = Date.now();
        break;
      case "sent":
        updates.sentAt = Date.now();
        break;
      case "failed":
        updates.failedAt = Date.now();
        updates.retryCount = message.retryCount + 1;
        if (args.errorMessage) {
          updates.errorMessage = args.errorMessage;
        }
        break;
    }

    await ctx.db.patch(message._id, updates);

    return { success: true };
  },
});

/**
 * Get pending messages from queue
 */
export const getPendingMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messageQueues")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("asc")
      .collect();
    
    if (args.limit) {
      return messages.slice(0, args.limit);
    }
    
    return messages;
  },
});

/**
 * Get queue statistics
 */
export const getQueueStats = query({
  handler: async (ctx) => {
    const allMessages = await ctx.db.query("messageQueues").collect();
    
    const stats = {
      total: allMessages.length,
      pending: allMessages.filter(m => m.status === "pending").length,
      processing: allMessages.filter(m => m.status === "processing").length,
      sent: allMessages.filter(m => m.status === "sent").length,
      failed: allMessages.filter(m => m.status === "failed").length,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };
    
    allMessages.forEach(message => {
      stats.byPriority[message.priority] = (stats.byPriority[message.priority] || 0) + 1;
      stats.byType[message.type] = (stats.byType[message.type] || 0) + 1;
    });
    
    return stats;
  },
});

// =======================
// CLEANUP FUNCTIONS
// =======================

/**
 * Clean up old communication logs (keep last 30 days)
 */
export const cleanupOldLogs = mutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const oldLogs = await ctx.db
      .query("communicationLogs")
      .filter((q) => q.lt(q.field("timestamp"), thirtyDaysAgo))
      .collect();
    
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }
    
    return { success: true, deleted: oldLogs.length };
  },
});

/**
 * Clean up completed message queue items (keep last 7 days)
 */
export const cleanupMessageQueue = mutation({
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const oldMessages = await ctx.db
      .query("messageQueues")
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("status"), "sent"),
            q.eq(q.field("status"), "failed")
          ),
          q.lt(q.field("createdAt"), sevenDaysAgo)
        )
      )
      .collect();
    
    for (const message of oldMessages) {
      await ctx.db.delete(message._id);
    }
    
    return { success: true, deleted: oldMessages.length };
  },
});