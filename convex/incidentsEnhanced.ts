// convex/incidentsEnhanced.ts
// Enhanced incident management with action tracking and conversion capabilities

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Action types for comprehensive tracking
export const INCIDENT_ACTION_TYPES = {
  // Conversion actions
  CONVERTED_FROM_ALERT: 'converted_from_alert',
  
  // Management actions
  DIVERSION_IMPLEMENTED: 'diversion_implemented',
  DRIVER_NOTIFICATION: 'driver_notification',
  COUNCIL_CONTACTED: 'council_contacted',
  EMERGENCY_SERVICES_NOTIFIED: 'emergency_services_notified',
  SHUTTLE_SERVICE_ARRANGED: 'shuttle_service_arranged',
  ROUTE_SUSPENSION: 'route_suspension',
  ROUTE_DIVERSION: 'route_diversion',
  
  // Resolution actions
  INCIDENT_RESOLVED: 'incident_resolved',
  INCIDENT_ARCHIVED: 'incident_archived',
  MARKED_DUPLICATE: 'marked_duplicate',
  MARKED_IRRELEVANT: 'marked_irrelevant',
  FALSE_ALERT: 'false_alert',
  
  // Communication actions
  PUBLIC_ANNOUNCEMENT: 'public_announcement',
  SOCIAL_MEDIA_UPDATE: 'social_media_update',
  WEBSITE_UPDATE: 'website_update',
  CUSTOMER_SERVICE_BRIEFED: 'customer_service_briefed',
};

// Archive reasons
export const ARCHIVE_REASONS = {
  RESOLVED: 'resolved',
  DUPLICATE: 'duplicate',
  IRRELEVANT: 'irrelevant',
  FALSE_ALERT: 'false_alert',
  NO_ACTION_REQUIRED: 'no_action_required',
  OTHER: 'other'
};

// Convert automatic alert to managed incident
export const convertAlertToIncident = mutation({
  args: {
    alertData: v.object({
      id: v.string(),
      title: v.string(),
      location: v.string(),
      coordinates: v.optional(v.any()),
      severity: v.string(),
      description: v.optional(v.string()),
      source: v.string(),
      affectsRoutes: v.optional(v.array(v.string())),
    }),
    supervisorId: v.string(),
    supervisorName: v.string(),
    supervisorRole: v.string(),
    conversionNotes: v.string(),
    priority: v.string(),
    incidentType: v.string(),
    subtype: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const incidentId = `INC_${now}_${args.alertData.id}`;
    
    // Create the incident with enhanced tracking
    const incidentData = {
      incidentId,
      type: args.incidentType,
      subtype: args.subtype,
      location: args.alertData.location,
      coordinates: args.alertData.coordinates ? 
        (typeof args.alertData.coordinates === 'object' && 'latitude' in args.alertData.coordinates ? 
          args.alertData.coordinates : 
          { latitude: args.alertData.coordinates[0], longitude: args.alertData.coordinates[1] }
        ) : undefined,
      description: args.alertData.description || `Converted from ${args.alertData.source} alert: ${args.alertData.title}`,
      severity: args.alertData.severity,
      priority: args.priority,
      status: "active",
      affectsRoutes: args.alertData.affectsRoutes || [],
      
      // Supervisor info
      createdBy: args.supervisorName,
      createdByRole: args.supervisorRole,
      receivedVia: `automatic_${args.alertData.source}`,
      
      // Conversion tracking
      convertedFromAlert: true,
      originalAlertId: args.alertData.id,
      originalAlertSource: args.alertData.source,
      conversionNotes: args.conversionNotes,
      
      // Enhanced action tracking
      actions: [{
        id: `action_${now}`,
        type: INCIDENT_ACTION_TYPES.CONVERTED_FROM_ALERT,
        description: args.conversionNotes,
        performedBy: args.supervisorName,
        performedAt: now,
        details: {
          originalAlertId: args.alertData.id,
          source: args.alertData.source,
          priority: args.priority
        }
      }],
      
      // Standard fields
      notes: [],
      ticketerSent: false,
      pushedToDisplay: args.priority === "CRITICAL",
      pushedToDisplayBy: args.priority === "CRITICAL" ? args.supervisorName : undefined,
      pushedToDisplayAt: args.priority === "CRITICAL" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const dbId = await ctx.db.insert("incidents", incidentData);

    // Log conversion action
    await ctx.db.insert("supervisorActions", {
      action: "convert_alert_to_incident",
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      timestamp: now,
      details: {
        incidentId,
        originalAlertId: args.alertData.id,
        alertSource: args.alertData.source,
        priority: args.priority,
        conversionNotes: args.conversionNotes,
      },
      alertId: args.alertData.id,
    });

    console.log(`🔄 Converted alert ${args.alertData.id} to incident ${incidentId} by ${args.supervisorName}`);
    
    return { 
      success: true, 
      incidentId, 
      dbId,
      message: `Alert successfully converted to managed incident ${incidentId}`
    };
  },
});

// Add comprehensive action to incident
export const addIncidentAction = mutation({
  args: {
    incidentId: v.string(),
    actionType: v.string(),
    description: v.string(),
    performedBy: v.string(),
    details: v.optional(v.any()),
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
    const newAction = {
      id: `action_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: args.actionType,
      description: args.description,
      performedBy: args.performedBy,
      performedAt: now,
      details: args.details || {}
    };

    // Get existing actions or initialize
    const existingActions = incident.actions || [];
    
    await ctx.db.patch(incident._id, {
      actions: [...existingActions, newAction],
      updatedAt: now,
    });

    // Log supervisor action
    await ctx.db.insert("supervisorActions", {
      action: `incident_action_${args.actionType}`,
      supervisorId: args.performedBy,
      supervisorName: args.performedBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
        actionType: args.actionType,
        description: args.description,
        actionDetails: args.details,
      },
    });

    console.log(`➕ Added action ${args.actionType} to incident ${args.incidentId}`);
    
    return { success: true, action: newAction };
  },
});

// Archive incident with reason
export const archiveIncident = mutation({
  args: {
    incidentId: v.string(),
    reason: v.string(),
    reasonDetails: v.string(),
    archivedBy: v.string(),
    resolutionNotes: v.optional(v.string()),
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
    
    // Add archive action
    const archiveAction = {
      id: `action_${now}_archive`,
      type: INCIDENT_ACTION_TYPES.INCIDENT_ARCHIVED,
      description: `Archived: ${args.reason} - ${args.reasonDetails}`,
      performedBy: args.archivedBy,
      performedAt: now,
      details: {
        archiveReason: args.reason,
        reasonDetails: args.reasonDetails,
        resolutionNotes: args.resolutionNotes,
      }
    };

    const existingActions = incident.actions || [];

    await ctx.db.patch(incident._id, {
      status: "archived",
      archiveReason: args.reason,
      archiveReasonDetails: args.reasonDetails,
      resolutionNotes: args.resolutionNotes,
      archivedBy: args.archivedBy,
      archivedAt: now,
      actions: [...existingActions, archiveAction],
      updatedAt: now,
    });

    // Log supervisor action
    await ctx.db.insert("supervisorActions", {
      action: "archive_incident",
      supervisorId: args.archivedBy,
      supervisorName: args.archivedBy,
      timestamp: now,
      details: {
        incidentId: args.incidentId,
        reason: args.reason,
        reasonDetails: args.reasonDetails,
      },
    });

    console.log(`📦 Archived incident ${args.incidentId} - Reason: ${args.reason}`);
    
    return { success: true };
  },
});

// Get incident with full action history
export const getIncidentWithActions = query({
  args: {
    incidentId: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("incidentId"), args.incidentId))
      .first();

    if (!incident) {
      return null;
    }

    // Get all supervisor actions related to this incident
    const supervisorActions = await ctx.db
      .query("supervisorActions")
      .filter(q => 
        q.or(
          q.eq(q.field("details.incidentId"), args.incidentId),
          q.eq(q.field("alertId"), incident.originalAlertId || "")
        )
      )
      .order("desc")
      .collect();

    return {
      ...incident,
      supervisorActions,
    };
  },
});

// Get incidents by status (including archived)
export const getIncidentsByStatus = query({
  args: {
    status: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("status"), args.status))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    
    return await query.collect();
  },
});

// Search archived incidents
export const searchArchivedIncidents = query({
  args: {
    searchTerm: v.optional(v.string()),
    archiveReason: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("status"), "archived"));

    const results = await query.collect();

    // Filter results based on search criteria
    return results.filter(incident => {
      // Archive reason filter
      if (args.archiveReason && incident.archiveReason !== args.archiveReason) {
        return false;
      }

      // Date range filter
      if (args.startDate && incident.archivedAt < args.startDate) {
        return false;
      }
      if (args.endDate && incident.archivedAt > args.endDate) {
        return false;
      }

      // Search term filter
      if (args.searchTerm) {
        const searchLower = args.searchTerm.toLowerCase();
        return (
          incident.location.toLowerCase().includes(searchLower) ||
          incident.description?.toLowerCase().includes(searchLower) ||
          incident.archiveReasonDetails?.toLowerCase().includes(searchLower) ||
          incident.resolutionNotes?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  },
});

// Get incident statistics
export const getIncidentStats = query({
  handler: async (ctx) => {
    const allIncidents = await ctx.db.query("incidents").collect();
    
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    return {
      total: allIncidents.length,
      active: allIncidents.filter(i => i.status === "active").length,
      monitoring: allIncidents.filter(i => i.status === "monitoring").length,
      closed: allIncidents.filter(i => i.status === "closed").length,
      archived: allIncidents.filter(i => i.status === "archived").length,
      
      // Conversion stats
      convertedFromAlerts: allIncidents.filter(i => i.convertedFromAlert).length,
      
      // Time-based stats
      last24Hours: allIncidents.filter(i => i.createdAt >= last24Hours).length,
      last7Days: allIncidents.filter(i => i.createdAt >= last7Days).length,
      
      // Archive reasons
      archiveReasons: {
        resolved: allIncidents.filter(i => i.archiveReason === ARCHIVE_REASONS.RESOLVED).length,
        duplicate: allIncidents.filter(i => i.archiveReason === ARCHIVE_REASONS.DUPLICATE).length,
        irrelevant: allIncidents.filter(i => i.archiveReason === ARCHIVE_REASONS.IRRELEVANT).length,
        falseAlert: allIncidents.filter(i => i.archiveReason === ARCHIVE_REASONS.FALSE_ALERT).length,
        noAction: allIncidents.filter(i => i.archiveReason === ARCHIVE_REASONS.NO_ACTION_REQUIRED).length,
      },
      
      // Action counts
      totalActions: allIncidents.reduce((sum, i) => sum + (i.actions?.length || 0), 0),
      incidentsWithDiversions: allIncidents.filter(i => 
        i.actions?.some(a => a.type === INCIDENT_ACTION_TYPES.DIVERSION_IMPLEMENTED)
      ).length,
      incidentsWithNotifications: allIncidents.filter(i => 
        i.actions?.some(a => a.type === INCIDENT_ACTION_TYPES.DRIVER_NOTIFICATION)
      ).length,
    };
  },
});

// Get supervisor performance metrics
export const getSupervisorMetrics = query({
  args: {
    supervisorName: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("incidents")
      .filter(q => q.eq(q.field("createdBy"), args.supervisorName));
    
    const incidents = await query.collect();
    
    // Filter by date if provided
    const filteredIncidents = incidents.filter(incident => {
      if (args.startDate && incident.createdAt < args.startDate) return false;
      if (args.endDate && incident.createdAt > args.endDate) return false;
      return true;
    });

    // Calculate metrics
    const totalActions = filteredIncidents.reduce((sum, incident) => {
      const supervisorActions = incident.actions?.filter(a => 
        a.performedBy === args.supervisorName
      ) || [];
      return sum + supervisorActions.length;
    }, 0);

    return {
      incidentsCreated: filteredIncidents.length,
      incidentsConverted: filteredIncidents.filter(i => i.convertedFromAlert).length,
      totalActions,
      
      // Action breakdown
      actionTypes: {
        diversions: filteredIncidents.filter(i => 
          i.actions?.some(a => 
            a.type === INCIDENT_ACTION_TYPES.DIVERSION_IMPLEMENTED && 
            a.performedBy === args.supervisorName
          )
        ).length,
        notifications: filteredIncidents.filter(i => 
          i.actions?.some(a => 
            a.type === INCIDENT_ACTION_TYPES.DRIVER_NOTIFICATION && 
            a.performedBy === args.supervisorName
          )
        ).length,
        resolutions: filteredIncidents.filter(i => 
          i.closedBy === args.supervisorName || i.archivedBy === args.supervisorName
        ).length,
      },
      
      // Average response time (from creation to first action)
      avgResponseTime: calculateAverageResponseTime(filteredIncidents, args.supervisorName),
    };
  },
});

// Helper function to calculate average response time
function calculateAverageResponseTime(incidents: any[], supervisorName: string): number {
  const responseTimes: number[] = [];
  
  incidents.forEach(incident => {
    const firstAction = incident.actions?.find((a: any) => 
      a.performedBy === supervisorName
    );
    
    if (firstAction) {
      const responseTime = firstAction.performedAt - incident.createdAt;
      responseTimes.push(responseTime);
    }
  });
  
  if (responseTimes.length === 0) return 0;
  
  const avgMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  return Math.round(avgMs / 60000); // Convert to minutes
}
