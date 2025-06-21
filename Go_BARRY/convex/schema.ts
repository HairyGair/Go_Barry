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

  // System configuration
  systemConfig: defineTable({
    key: v.string(),
    value: v.any(),
    updatedBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),
});
