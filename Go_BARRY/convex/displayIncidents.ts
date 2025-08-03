import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Update display incidents
export const updateDisplayIncidents = mutation({
  args: {
    incidents: v.array(v.any()),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const { incidents, timestamp } = args;
    
    // Clear existing display incidents
    const existing = await ctx.db
      .query("displayIncidents")
      .collect();
    
    for (const incident of existing) {
      await ctx.db.delete(incident._id);
    }
    
    // Add new incidents
    for (const incident of incidents) {
      await ctx.db.insert("displayIncidents", {
        incidentId: incident.id,
        type: incident.type || "unknown",
        title: incident.title,
        description: incident.description || "",
        location: incident.location || "",
        coordinates: incident.coordinates ? {
          lat: incident.coordinates.lat || incident.coordinates.latitude || incident.coordinates[0],
          lng: incident.coordinates.lng || incident.coordinates.longitude || incident.coordinates[1]
        } : undefined,
        severity: incident.severity,
        priority: incident.priority,
        affectsRoutes: incident.affectsRoutes || incident.affectedRoutes || [],
        status: incident.status || "active",
        source: incident.source,
        
        displayedAt: new Date(incident.displayedAt || timestamp).getTime(),
        displayedBy: incident.displayedBy,
        displayMessage: incident.displayMessage ? {
          id: incident.displayMessage.id,
          priority: incident.displayMessage.priority || 2,
          expiresAt: new Date(incident.displayMessage.expiresAt).getTime(),
          autoZoom: incident.displayMessage.autoZoom !== false,
          zoomLevel: incident.displayMessage.zoomLevel || 15,
          highlightIncident: incident.displayMessage.highlightIncident !== false,
          showRoutes: incident.displayMessage.showRoutes !== false,
          pulseAnimation: incident.displayMessage.pulseAnimation !== false,
          duration: incident.displayMessage.duration || 30000
        } : undefined,
        
        createdAt: new Date(incident.createdAt || timestamp).getTime(),
        updatedAt: new Date().getTime(),
        expiresAt: incident.displayMessage?.expiresAt 
          ? new Date(incident.displayMessage.expiresAt).getTime()
          : new Date().getTime() + 3600000 // 1 hour default
      });
    }
    
    return { success: true, count: incidents.length };
  },
});

// Update display messages
export const updateDisplayMessages = mutation({
  args: {
    messages: v.array(v.any()),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const { messages, timestamp } = args;
    
    // Don't clear all messages, just update/add new ones
    for (const message of messages) {
      // Check if message already exists
      const existing = await ctx.db
        .query("displayMessages")
        .withIndex("by_message_id", q => q.eq("messageId", message.id))
        .first();
      
      if (existing) {
        // Update existing message
        await ctx.db.patch(existing._id, {
          displayed: message.displayed || false,
          displayedAt: message.displayedAt ? new Date(message.displayedAt).getTime() : undefined,
        });
      } else {
        // Add new message
        await ctx.db.insert("displayMessages", {
          messageId: message.id,
          type: message.type,
          content: message.content || "",
          priority: message.priority || 2,
          supervisorName: message.supervisorName || "System",
          supervisorBadge: message.supervisorBadge || "SYSTEM",
          
          incidentId: message.incidentId,
          alertId: message.alertId,
          
          autoZoom: message.autoZoom,
          zoomLevel: message.zoomLevel,
          coordinates: message.coordinates ? {
            lat: message.coordinates.lat || message.coordinates[0],
            lng: message.coordinates.lng || message.coordinates[1]
          } : undefined,
          affectsRoutes: message.affectsRoutes || [],
          
          createdAt: new Date(message.createdAt || timestamp).getTime(),
          expiresAt: new Date(message.expiresAt || new Date().getTime() + 600000).getTime(),
          displayedAt: message.displayedAt ? new Date(message.displayedAt).getTime() : undefined,
          displayed: message.displayed || false,
          
          pushedBy: message.pushedBy,
          pushedAt: message.pushedAt ? new Date(message.pushedAt).getTime() : undefined,
          rotationInterval: message.rotationInterval || 30000
        });
      }
    }
    
    // Clean up expired messages
    const now = Date.now();
    const expired = await ctx.db
      .query("displayMessages")
      .withIndex("by_expires_at")
      .filter(q => q.lt(q.field("expiresAt"), now))
      .collect();
    
    for (const msg of expired) {
      await ctx.db.delete(msg._id);
    }
    
    return { success: true, count: messages.length };
  },
});

// Get active display incidents
export const getDisplayIncidents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get non-expired incidents
    const incidents = await ctx.db
      .query("displayIncidents")
      .filter(q => 
        q.or(
          q.gt(q.field("expiresAt"), now),
          q.eq(q.field("expiresAt"), undefined)
        )
      )
      .order("desc")
      .take(20);
    
    return incidents.map(incident => ({
      id: incident.incidentId,
      type: incident.type,
      title: incident.title,
      description: incident.description,
      location: incident.location,
      coordinates: incident.coordinates,
      severity: incident.severity,
      priority: incident.priority,
      affectsRoutes: incident.affectsRoutes,
      status: incident.status,
      source: incident.source,
      displayedAt: new Date(incident.displayedAt).toISOString(),
      displayedBy: incident.displayedBy,
      displayMessage: incident.displayMessage,
      createdAt: new Date(incident.createdAt).toISOString(),
    }));
  },
});

// Get active display messages
export const getDisplayMessages = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get non-expired, non-displayed messages
    const messages = await ctx.db
      .query("displayMessages")
      .withIndex("by_displayed", q => q.eq("displayed", false))
      .filter(q => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .collect();
    
    // Sort by priority (ascending) then by creation time (descending)
    messages.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower number = higher priority
      }
      return b.createdAt - a.createdAt; // Newer first
    });
    
    return messages.map(msg => ({
      id: msg.messageId,
      type: msg.type,
      content: msg.content,
      priority: msg.priority,
      supervisorName: msg.supervisorName,
      supervisorBadge: msg.supervisorBadge,
      incidentId: msg.incidentId,
      alertId: msg.alertId,
      autoZoom: msg.autoZoom,
      zoomLevel: msg.zoomLevel,
      coordinates: msg.coordinates,
      affectsRoutes: msg.affectsRoutes,
      createdAt: new Date(msg.createdAt).toISOString(),
      expiresAt: new Date(msg.expiresAt).toISOString(),
      displayed: msg.displayed,
      pushedBy: msg.pushedBy,
      pushedAt: msg.pushedAt ? new Date(msg.pushedAt).toISOString() : undefined,
      rotationInterval: msg.rotationInterval
    }));
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
      .withIndex("by_message_id", q => q.eq("messageId", args.messageId))
      .first();
    
    if (message) {
      await ctx.db.patch(message._id, {
        displayed: true,
        displayedAt: Date.now()
      });
    }
    
    return { success: true };
  },
});

// Remove incident from display (End Display functionality)
export const removeFromDisplay = mutation({
  args: {
    incidentId: v.string(),
    supervisorBadge: v.string(),
  },
  handler: async (ctx, args) => {
    const { incidentId, supervisorBadge } = args;
    
    // Find the incident in displayIncidents
    const incident = await ctx.db
      .query("displayIncidents")
      .filter(q => q.eq(q.field("incidentId"), incidentId))
      .first();
    
    if (incident) {
      // Delete the incident from display
      await ctx.db.delete(incident._id);
      
      // Log the action
      await ctx.db.insert("supervisorActions", {
        supervisorBadge,
        action: "END_DISPLAY",
        target: "roadwork",
        targetId: incidentId,
        details: {
          location: incident.location,
          title: incident.title,
          displayedDuration: Date.now() - incident.displayedAt
        },
        timestamp: Date.now(),
      });
      
      return { success: true, message: "Roadwork removed from display" };
    }
    
    return { success: false, message: "Roadwork not found on display" };
  },
});
