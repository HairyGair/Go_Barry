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
});
