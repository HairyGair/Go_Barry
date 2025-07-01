// convex/schema.ts
// Go BARRY Convex Schema - Real-time supervisor sync without CORS issues!

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Supervisor sessions - who's logged in
  supervisorSessions: defineTable({
    supervisorId: v.string(),
    supervisorName: v.string(),
    badge: v.string(),
    role: v.string(),
    isAdmin: v.boolean(),
    duty: v.object({
      id: v.string(),
      name: v.string(),
      shift: v.optional(v.string()),
    }),
    loginTime: v.number(),
    lastActivity: v.number(),
    isActive: v.boolean(),
  })
    .index("by_supervisor", ["supervisorId"])
    .index("by_active", ["isActive"]),

  // Traffic alerts with all metadata
  alerts: defineTable({
    // Core alert data
    alertId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    coordinates: v.optional(v.array(v.number())),
    severity: v.string(),
    status: v.string(),
    source: v.string(),
    timestamp: v.number(),
    
    // Route information
    affectsRoutes: v.array(v.string()),
    routeFrequencies: v.optional(v.any()),
    
    // Supervisor interactions
    acknowledged: v.boolean(),
    acknowledgedBy: v.optional(v.string()),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedReason: v.optional(v.string()),
    
    priorityOverride: v.optional(v.string()),
    priorityUpdatedBy: v.optional(v.string()),
    priorityUpdatedAt: v.optional(v.number()),
    
    notes: v.array(v.object({
      note: v.string(),
      addedBy: v.string(),
      addedAt: v.number(),
    })),
    
    // Display control
    dismissedFromDisplay: v.boolean(),
    dismissedFromDisplayBy: v.optional(v.string()),
    dismissedFromDisplayAt: v.optional(v.number()),
    
    lockedOnDisplay: v.boolean(),
    lockedOnDisplayBy: v.optional(v.string()),
    lockedOnDisplayAt: v.optional(v.number()),
    
    // Push to display control
    pushedToDisplay: v.boolean(),
    pushedToDisplayBy: v.optional(v.string()),
    pushedToDisplayAt: v.optional(v.number()),
    pushedToDisplayNotes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_timestamp", ["timestamp"]),

  // Supervisor action audit trail
  supervisorActions: defineTable({
    action: v.string(), // login, logout, acknowledge, dismiss, etc.
    supervisorId: v.string(),
    supervisorName: v.string(),
    timestamp: v.number(),
    details: v.any(), // Flexible object for action-specific data
    alertId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_supervisor", ["supervisorId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"])
    .index("by_alert", ["alertId"]),

  // Login history for analytics
  loginHistory: defineTable({
    supervisorId: v.string(),
    supervisorName: v.string(),
    dutyId: v.string(),
    timestamp: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_supervisor", ["supervisorId"])
    .index("by_success", ["success"])
    .index("by_timestamp", ["createdAt"]),

  // Shared sync state (replaces WebSocket state)
  syncState: defineTable({
    key: v.string(), // Single record with key "global"
    connectedSupervisors: v.number(),
    activeSupervisors: v.array(v.object({
      supervisorId: v.string(),
      supervisorName: v.string(),
      badge: v.string(),
      duty: v.string(),
      lastSeen: v.number(),
    })),
    customMessages: v.array(v.object({
      id: v.string(),
      message: v.string(),
      priority: v.string(),
      duration: v.number(),
      createdBy: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    })),
    displayMode: v.string(), // normal, emergency, maintenance
    lastUpdated: v.number(),
  })
    .index("by_key", ["key"]),

  // Email groups for notifications
  emailGroups: defineTable({
    name: v.string(),
    description: v.string(),
    recipients: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_name", ["name"]),

  // Major events (concerts, matches, etc)
  events: defineTable({
    eventId: v.string(),
    venue: v.string(),
    event: v.string(),
    time: v.string(),
    date: v.string(),
    severity: v.string(), // LOW, MEDIUM, HIGH, CRITICAL
    status: v.string(), // UPCOMING, ACTIVE, COMPLETED, CANCELLED
    expectedAttendance: v.optional(v.number()),
    affectedRoutes: v.array(v.string()),
    description: v.optional(v.string()),
    alertMessage: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_active", ["isActive"])
    .index("by_date", ["date"]),

  // Manual incidents created by supervisors
  incidents: defineTable({
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
    status: v.string(), // active, monitoring, closed
    
    // Route information
    affectsRoutes: v.array(v.string()),
    
    // Supervisor information
    createdBy: v.string(),
    createdByRole: v.string(),
    receivedVia: v.optional(v.string()), // radio_call, call_centre, other
    
    // Ticketer messaging
    ticketerMessage: v.optional(v.string()),
    ticketerSent: v.boolean(),
    ticketerSentAt: v.optional(v.number()),
    ticketerSentBy: v.optional(v.string()),
    
    // Notes and updates
    notes: v.array(v.object({
      id: v.string(),
      text: v.string(),
      addedBy: v.string(),
      addedAt: v.number(),
    })),
    
    // Display control
    pushedToDisplay: v.boolean(),
    pushedToDisplayBy: v.optional(v.string()),
    pushedToDisplayAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.optional(v.number()),
    closedBy: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_created", ["createdAt"])
    .index("by_supervisor", ["createdBy"]),

  // Bus locations - real-time bus positions from UK Bus Data API
  busLocations: defineTable({
    busId: v.string(),
    vehicleRef: v.string(),
    lineRef: v.optional(v.string()),
    routeName: v.optional(v.string()),
    directionRef: v.optional(v.string()),
    coordinates: v.array(v.number()), // [latitude, longitude]
    bearing: v.optional(v.number()),
    status: v.string(), // 'active', 'delayed', 'out_of_service'
    delay: v.number(), // delay in seconds
    timestamp: v.number(),
    operator: v.string(),
    operatorCode: v.string(),
    lastUpdated: v.number(),
  })
    .index("by_route", ["routeName"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"])
    .index("by_vehicle", ["vehicleRef"]),

  // System configuration
  systemConfig: defineTable({
    key: v.string(),
    value: v.any(),
    updatedBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // Duty Boards - PDF storage for supervisor duty boards
  dutyBoards: defineTable({
    fileName: v.string(),
    fileData: v.optional(v.string()), // Legacy: Base64 encoded PDF
    storageId: v.optional(v.id("_storage")), // New: Convex storage ID
    fileUrl: v.optional(v.string()), // URL to access the file
    fileSize: v.number(),
    uploadedBy: v.string(),
    uploadedById: v.string(),
    uploadedAt: v.number(),
    isActive: v.boolean(),
    version: v.number(),
    searchIndex: v.optional(v.string()), // Text content for searching
  })
    .index("by_active", ["isActive"])
    .index("by_upload_date", ["uploadedAt"]),

  // VIX Late Runners data
  vixData: defineTable({
    lateRunners: v.array(v.object({
      fleetNo: v.string(),
      service: v.string(),
      depot: v.string(),
      rb: v.optional(v.string()),
      stop: v.string(),
      driverNo: v.optional(v.string()),
      lateness: v.string(),
      delayMinutes: v.number()
    })),
    stats: v.object({
      totalLateRunners: v.number(),
      criticalDelays: v.number(),
      averageDelay: v.number(),
      worstDelay: v.number()
    }),
    uploadedBy: v.optional(v.string()),
    uploadedAt: v.string(),
    timestamp: v.number()
  })
    .index("by_timestamp", ["timestamp"]),

  // Display messages for intelligent forwarding (Phase 2)
  displayMessages: defineTable({
    messageId: v.string(),
    content: v.string(),
    priority: v.number(), // 0=P0, 1=P1, 2=P2, 3=P3
    messageType: v.string(),
    supervisorId: v.string(),
    supervisorName: v.string(),
    templateId: v.optional(v.string()),
    templateVariables: v.optional(v.any()),
    displayDuration: v.number(),
    rotationInterval: v.number(),
    autoTriggered: v.boolean(),
    source: v.string(), // 'supervisor', 'event', 'roadwork', 'system'
    displayed: v.boolean(),
    displayedAt: v.optional(v.number()),
    displayCount: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_priority", ["priority", "createdAt"])
    .index("active", ["displayed", "expiresAt"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_expiry", ["expiresAt"]),

  // Multi-supervisor coordination messages (Phase 4.1)
  coordinationMessages: defineTable({
    messageId: v.string(),
    content: v.string(),
    messageType: v.string(), // 'broadcast', 'depot', 'direct', 'alert_coordination'
    priority: v.string(), // 'low', 'medium', 'high', 'urgent'
    
    // Sender information
    fromSupervisorId: v.string(),
    fromSupervisorName: v.string(),
    fromSupervisorBadge: v.string(),
    
    // Target information
    targetType: v.string(), // 'all', 'depot', 'direct', 'role'
    targetDepots: v.array(v.string()), // Empty array for all/direct messages
    targetSupervisors: v.array(v.string()), // Specific supervisor IDs for direct messages
    targetRoles: v.array(v.string()), // admin, supervisor, etc
    
    // Message metadata
    subject: v.optional(v.string()),
    relatedAlertId: v.optional(v.string()),
    relatedIncidentId: v.optional(v.string()),
    requiresResponse: v.boolean(),
    autoExpire: v.boolean(),
    
    // Read receipts and responses
    readBy: v.array(v.object({
      supervisorId: v.string(),
      supervisorName: v.string(),
      readAt: v.number(),
    })),
    
    responses: v.array(v.object({
      responseId: v.string(),
      supervisorId: v.string(),
      supervisorName: v.string(),
      response: v.string(),
      respondedAt: v.number(),
    })),
    
    // Timestamps
    createdAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_target_type", ["targetType"])
    .index("by_priority", ["priority", "createdAt"])
    .index("by_sender", ["fromSupervisorId"])
    .index("by_active", ["isActive", "createdAt"])
    .index("by_expiry", ["expiresAt"]),

  // Depot channels for organized communication (Phase 4.1)
  depotChannels: defineTable({
    channelId: v.string(),
    name: v.string(),
    description: v.string(),
    depotCode: v.string(), // 'BLY', 'CHE', 'CON', 'HEX', 'PMT', 'RIV', 'STN', 'WAS', 'WBY'
    
    // Channel settings
    isActive: v.boolean(),
    autoArchive: v.boolean(),
    archiveAfterHours: v.number(),
    allowedRoles: v.array(v.string()),
    
    // Moderation
    moderators: v.array(v.string()), // Supervisor IDs
    
    // Metadata
    messageCount: v.number(),
    lastMessageAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_depot", ["depotCode"])
    .index("by_active", ["isActive"])
    .index("by_last_message", ["lastMessageAt"]),

  // Handover notes for shift transitions (Phase 3)
  handoverNotes: defineTable({
    handoverId: v.string(),
    
    // Shift information
    fromSupervisor: v.string(),
    fromSupervisorName: v.string(),
    fromShift: v.string(),
    toSupervisor: v.optional(v.string()),
    toSupervisorName: v.optional(v.string()),
    toShift: v.string(),
    
    // Handover data
    shiftDate: v.string(),
    shiftSummary: v.string(),
    activeIncidents: v.array(v.object({
      incidentId: v.string(),
      type: v.string(),
      location: v.string(),
      severity: v.string(),
      routesAffected: v.array(v.string()),
      notes: v.string(),
    })),
    
    unresolvedAlerts: v.array(v.object({
      alertId: v.string(),
      title: v.string(),
      location: v.string(),
      severity: v.string(),
      timestamp: v.number(),
      notes: v.string(),
    })),
    
    keyDecisions: v.array(v.object({
      decision: v.string(),
      reasoning: v.string(),
      timestamp: v.number(),
      impact: v.string(),
    })),
    
    recommendations: v.array(v.object({
      priority: v.string(),
      recommendation: v.string(),
      reasoning: v.string(),
    })),
    
    // Statistics
    shiftStats: v.object({
      alertsHandled: v.number(),
      incidentsCreated: v.number(),
      roadworksCreated: v.number(),
      messagesWillSent: v.number(),
      averageResponseTime: v.number(),
    }),
    
    supervisorNotes: v.string(),
    
    // Acknowledgment
    acknowledged: v.boolean(),
    acknowledgedBy: v.optional(v.string()),
    acknowledgedAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    expiresAt: v.number(), // Auto-expire after 48 hours
  })
    .index("by_shift_date", ["shiftDate"])
    .index("by_from_supervisor", ["fromSupervisor"])
    .index("by_to_supervisor", ["toSupervisor"])
    .index("by_acknowledged", ["acknowledged"])
    .index("by_expiry", ["expiresAt"]),
});
