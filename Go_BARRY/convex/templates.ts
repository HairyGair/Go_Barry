// convex/templates.ts
// Message template management for Go BARRY Message Distribution Centre

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active templates
export const getTemplates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("messageTemplates")
      .withIndex("by_active")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Get templates by category
export const getTemplatesByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageTemplates")
      .withIndex("by_category")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), args.category),
          q.eq(q.field("isActive"), true)
        )
      )
      .order("desc")
      .collect();
  },
});

// Create a new template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    subject: v.string(),
    content: v.string(),
    routes: v.optional(v.array(v.string())),
    isUrgent: v.boolean(),
    supervisorBadge: v.string(),
    supervisorName: v.string(),
  },
  handler: async (ctx, args) => {
    const templateId = `TPL${Date.now()}`;
    
    await ctx.db.insert("messageTemplates", {
      templateId,
      name: args.name,
      category: args.category,
      subject: args.subject,
      content: args.content,
      routes: args.routes,
      isUrgent: args.isUrgent,
      createdBy: args.supervisorBadge,
      createdByName: args.supervisorName,
      createdAt: Date.now(),
      lastUsed: undefined,
      useCount: 0,
      isActive: true,
      lastModifiedBy: undefined,
      lastModifiedAt: undefined,
    });

    return { success: true, templateId };
  },
});

// Update an existing template
export const updateTemplate = mutation({
  args: {
    templateId: v.string(),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    routes: v.optional(v.array(v.string())),
    isUrgent: v.optional(v.boolean()),
    supervisorBadge: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();

    if (!template) {
      throw new Error("Template not found");
    }

    const updates: any = {
      lastModifiedBy: args.supervisorBadge,
      lastModifiedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.category !== undefined) updates.category = args.category;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.content !== undefined) updates.content = args.content;
    if (args.routes !== undefined) updates.routes = args.routes;
    if (args.isUrgent !== undefined) updates.isUrgent = args.isUrgent;

    await ctx.db.patch(template._id, updates);

    return { success: true };
  },
});

// Delete a template (soft delete by marking inactive)
export const deleteTemplate = mutation({
  args: {
    templateId: v.string(),
    supervisorBadge: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();

    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(template._id, {
      isActive: false,
      lastModifiedBy: args.supervisorBadge,
      lastModifiedAt: Date.now(),
    });

    return { success: true };
  },
});

// Record template usage
export const recordTemplateUsage = mutation({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();

    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(template._id, {
      lastUsed: Date.now(),
      useCount: (template.useCount || 0) + 1,
    });

    return { success: true };
  },
});

// Get most used templates
export const getMostUsedTemplates = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const templates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_usage")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit);

    return templates;
  },
});

// Seed the High Level Bridge template
export const seedHighLevelBridgeTemplate = mutation({
  args: {
    supervisorBadge: v.string(),
    supervisorName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if template already exists
    const existing = await ctx.db
      .query("messageTemplates")
      .filter((q) => 
        q.and(
          q.eq(q.field("name"), "High Level Bridge Closure"),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (existing) {
      return { success: true, message: "Template already exists" };
    }

    const templateId = `TPL_HIGH_LEVEL_${Date.now()}`;
    
    await ctx.db.insert("messageTemplates", {
      templateId,
      name: "High Level Bridge Closure",
      category: "closure",
      subject: "URGENT MESSAGE REGARDING CLOSURE OF HIGH LEVEL BRIDGE IN NEWCASTLE",
      content: `URGENT MESSAGE REGARDING CLOSURE OF HIGH LEVEL BRIDGE IN NEWCASTLE

We have been advised that Northumbria Police are currently dealing with a Serious Incident on the High Level Bridge in Newcastle.

As a result, the bridge is closed to all traffic, including buses, in both directions. This is affecting all our services that use this crossing.

All services that operate over the High Level Bridge - 1, 10, 10A, 10B, 11, 11X, 12, 12A, Q3, 21, 28B, 29, 56, 57, 58, 84, 85, 93 & 94 as well as any others that use the bridge crossing will be affected by the closure.

Services operating to/from Eldon Square Bus Station will start/terminate at Central Station where possible. All connections to Gateshead will be suspended whilst the bridge is closed, any services scheduled to serve Gateshead Interchange after operating to Eldon Square will operate via Pilgrim Street, Market Street, and Clayton Street to Newcastle Central Station instead.

Any customers making journeys that need to use the bridge to cross the Tyne should make alternative arrangements - we'd suggest travelling to Four Lane Ends Metro Interchange to pick up the 1, 309, 310 or 311 to get to Gateshead Interchange.

Please discourage any customers from walking over the bridge during the closure.

We'll update as soon as we have further information.

Thank you.`,
      routes: ["1", "10", "10A", "10B", "11", "11X", "12", "12A", "Q3", "21", "28B", "29", "56", "57", "58", "84", "85", "93", "94"],
      isUrgent: true,
      createdBy: args.supervisorBadge,
      createdByName: args.supervisorName,
      createdAt: Date.now(),
      lastUsed: undefined,
      useCount: 0,
      isActive: true,
      lastModifiedBy: undefined,
      lastModifiedAt: undefined,
    });

    return { success: true, templateId };
  },
});
