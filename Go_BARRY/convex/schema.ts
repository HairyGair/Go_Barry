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
    // Flow monitoring statistics
    flowMonitoringStats: v.optional(v.object({
      activeIncidents: v.number(),
      checksPerformed: v.number(),
      severityUpdates: v.number(),
      autoCleared: v.number(),
      lastCheck: v.union(v.string(), v.null()),
      isRunning: v.boolean()
    })),
    // Additional sync counters
    alertCount: v.optional(v.number()),
    supervisorCount: v.optional(v.number()),
    dismissedCount: v.optional(v.number()),
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
    // Vehicle identification
    vehicleId: v.string(),
    vehicleRef: v.string(),
    operatorRef: v.string(),
    
    // Service information
    lineRef: v.string(),
    lineName: v.string(),
    directionRef: v.string(),
    directionName: v.optional(v.string()),
    
    // Destination
    destinationRef: v.optional(v.string()),
    destinationName: v.string(),
    
    // Position
    latitude: v.number(),
    longitude: v.number(),
    bearing: v.number(),
    
    // Journey matching
    blockRef: v.optional(v.string()),
    vehicleJourneyRef: v.optional(v.string()),
    
    // Origin info
    originRef: v.optional(v.string()),
    originName: v.optional(v.string()),
    originAimedDeparture: v.optional(v.string()),
    
    // Status
    delay: v.number(), // minutes
    status: v.union(
      v.literal('on-time'),
      v.literal('delayed'),
      v.literal('severely-delayed'),
      v.literal('early')
    ),
    
    // Timestamps
    recordedAt: v.string(),
    validUntil: v.optional(v.string()),
    lastUpdated: v.string(),
    
    // Optional
    occupancy: v.optional(v.string()),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_line", ["lineRef"])
    .index("by_status", ["status"])
    .index("by_location", ["latitude", "longitude"])
    .index("by_operator", ["operatorRef"]),

  // Bus update logs for tracking sync history
  busUpdateLog: defineTable({
    timestamp: v.string(),
    busCount: v.number(),
    updateDuration: v.number(), // milliseconds
    errors: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"]),

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

  // === COMMUNICATIONS PLATFORM TABLES ===
  
  // Email templates for Communications Platform
  emailTemplates: defineTable({
    templateId: v.string(),
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    variables: v.array(v.object({
      name: v.string(),
      type: v.string(), // 'text', 'number', 'date', 'route', 'supervisor'
      required: v.boolean(),
      defaultValue: v.optional(v.string()),
      description: v.string(),
    })),
    category: v.string(), // 'alert', 'report', 'notification', 'custom'
    isActive: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    lastModified: v.number(),
    usage: v.number(), // Track how often used
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_usage", ["usage"]),

  // Communication logs for audit trail
  communicationLogs: defineTable({
    logId: v.string(),
    type: v.string(), // 'email', 'voip', 'ticketer', 'sms'
    action: v.string(), // 'sent', 'received', 'failed', 'scheduled'
    
    // Communication details
    from: v.string(),
    to: v.array(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    templateUsed: v.optional(v.string()),
    
    // Metadata
    supervisorId: v.string(),
    supervisorName: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    
    // Timestamps
    timestamp: v.number(),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_success", ["success"]),

  // Distribution lists for email/messaging
  distributionLists: defineTable({
    listId: v.string(),
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
    type: v.string(), // 'static', 'dynamic'
    criteria: v.optional(v.any()), // For dynamic lists
    isActive: v.boolean(),
    createdBy: v.string(),
    lastSyncAt: v.number(),
    memberCount: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"])
    .index("by_type", ["type"]),

  // VoIP call sessions
  voipSessions: defineTable({
    sessionId: v.string(),
    callId: v.optional(v.string()), // 8x8 call ID
    
    // Call details
    from: v.string(),
    to: v.string(),
    type: v.string(), // 'outbound', 'inbound', 'conference'
    status: v.string(), // 'ringing', 'connected', 'ended', 'failed'
    duration: v.number(), // seconds
    
    // Quality metrics
    audioQuality: v.optional(v.number()), // 1-5 rating
    latency: v.optional(v.number()), // milliseconds
    
    // Supervisor info
    supervisorId: v.string(),
    supervisorName: v.string(),
    
    // Timestamps
    startedAt: v.number(),
    connectedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    
    // Emergency flag
    isEmergency: v.boolean(),
    emergencyType: v.optional(v.string()),
  })
    .index("by_supervisor", ["supervisorId"])
    .index("by_status", ["status"])
    .index("by_emergency", ["isEmergency"])
    .index("by_start_time", ["startedAt"]),

  // Message queue for unified messaging
  messageQueues: defineTable({
    queueId: v.string(),
    messageId: v.string(),
    
    // Message details
    type: v.string(), // 'email', 'sms', 'ticketer', 'teams'
    priority: v.string(), // 'low', 'medium', 'high', 'urgent'
    status: v.string(), // 'pending', 'processing', 'sent', 'failed', 'cancelled'
    
    // Content
    to: v.array(v.string()),
    subject: v.optional(v.string()),
    content: v.string(),
    templateId: v.optional(v.string()),
    
    // Scheduling
    scheduledFor: v.optional(v.number()),
    retryCount: v.number(),
    maxRetries: v.number(),
    
    // Tracking
    supervisorId: v.string(),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority", "createdAt"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_supervisor", ["supervisorId"]),

  // Message templates for the Message Distribution Centre
  messageTemplates: defineTable({
    templateId: v.string(),
    name: v.string(),
    category: v.string(), // "diversion", "closure", "incident", "custom"
    subject: v.string(),
    content: v.string(),
    routes: v.optional(v.array(v.string())), // Affected routes
    isUrgent: v.boolean(),
    createdBy: v.string(), // Supervisor badge
    createdByName: v.string(),
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
    useCount: v.number(),
    isActive: v.boolean(),
    lastModifiedBy: v.optional(v.string()),
    lastModifiedAt: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_usage", ["useCount"])
    .index("by_urgent", ["isUrgent"]),

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

  // Disruptions table for unified disruption management
  disruptions: defineTable({
    // Core fields
    type: v.union(
      v.literal("roadwork"),
      v.literal("incident"),
      v.literal("event"),
      v.literal("weather"),
      v.literal("breakdown")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("planned"),
      v.literal("cleared"),
      v.literal("monitoring")
    ),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    
    // Location
    location: v.object({
      description: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      road: v.optional(v.string()),
      junction: v.optional(v.string()),
      postcode: v.optional(v.string()),
    }),
    
    // Time
    startTime: v.number(),
    endTime: v.optional(v.number()),
    lastUpdated: v.number(),
    
    // Impact
    affectedRoutes: v.array(v.string()),
    estimatedDelay: v.optional(v.number()), // minutes
    
    // Details
    title: v.string(),
    description: v.string(),
    source: v.string(),
    sourceId: v.optional(v.string()),
    
    // Supervisor actions
    dismissedBy: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"])
    .index("by_start_time", ["startTime"])
    .index("by_source", ["source", "sourceId"]),

  // Disruption notes for supervisor comments and updates
  disruptionNotes: defineTable({
    disruptionId: v.id("disruptions"),
    supervisorBadge: v.string(),
    supervisorName: v.string(),
    content: v.string(),
    timestamp: v.number(),
    type: v.union(
      v.literal("update"),
      v.literal("action"),
      v.literal("observation")
    ),
  })
    .index("by_disruption", ["disruptionId"])
    .index("by_supervisor", ["supervisorBadge"])
    .index("by_timestamp", ["timestamp"]),
    
  // Traffic flow monitoring data
  trafficFlowData: defineTable({
    alertId: v.string(),
    currentSpeed: v.number(),
    freeFlowSpeed: v.number(),
    speedRatio: v.number(),
    trend: v.string(),
    trendArrow: v.string(),
    severity: v.string(),
    lastChecked: v.number(),
    roadClosure: v.boolean(),
    shouldAutoClear: v.boolean(),
    history: v.array(v.object({
      timestamp: v.number(),
      speed: v.number(),
      severity: v.string()
    }))
  })
    .index("by_alert", ["alertId"])
    .index("by_severity", ["severity"])
    .index("by_last_checked", ["lastChecked"]),
    
  // Display screen incidents
  displayIncidents: defineTable({
    incidentId: v.string(),
    type: v.string(),
    title: v.optional(v.string()),
    description: v.string(),
    location: v.string(),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number()
    })),
    severity: v.optional(v.string()),
    priority: v.optional(v.string()),
    affectsRoutes: v.array(v.string()),
    status: v.string(),
    source: v.optional(v.string()),
    
    // Display metadata
    displayedAt: v.number(),
    displayedBy: v.optional(v.string()),
    displayMessage: v.optional(v.object({
      id: v.string(),
      priority: v.number(),
      expiresAt: v.number(),
      autoZoom: v.boolean(),
      zoomLevel: v.number(),
      highlightIncident: v.boolean(),
      showRoutes: v.boolean(),
      pulseAnimation: v.boolean(),
      duration: v.number()
    })),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number())
  })
    .index("by_incident_id", ["incidentId"])
    .index("by_displayed_at", ["displayedAt"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_status", ["status"]),
    
  // Display messages queue
  displayMessages: defineTable({
    messageId: v.string(),
    type: v.optional(v.string()),
    content: v.string(),
    priority: v.number(),
    supervisorName: v.string(),
    supervisorBadge: v.string(),
    
    // Related data
    incidentId: v.optional(v.string()),
    alertId: v.optional(v.string()),
    
    // Display options
    autoZoom: v.optional(v.boolean()),
    zoomLevel: v.optional(v.number()),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number()
    })),
    affectsRoutes: v.optional(v.array(v.string())),
    
    // Timestamps
    createdAt: v.number(),
    expiresAt: v.number(),
    displayedAt: v.optional(v.number()),
    displayed: v.boolean(),
    
    // Metadata
    pushedBy: v.optional(v.string()),
    pushedAt: v.optional(v.number()),
    rotationInterval: v.optional(v.number())
  })
    .index("by_message_id", ["messageId"])
    .index("by_priority_created", ["priority", "createdAt"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_displayed", ["displayed"]),
});
