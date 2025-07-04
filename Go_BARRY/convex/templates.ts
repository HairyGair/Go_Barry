// convex/templates.ts
// Message Template CRUD operations for Go BARRY Message Distribution Centre

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all message templates
export const getTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
    
    return templates;
  },
});

// Get templates by category
export const getTemplatesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    if (args.category === "all") {
      return await ctx.db
        .query("messageTemplates")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .collect();
    }
    
    return await ctx.db
      .query("messageTemplates")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Get most used templates
export const getMostUsedTemplates = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_usage", (q) => q.gte("useCount", 0))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(args.limit);
    
    return templates;
  },
});

// Get urgent templates
export const getUrgentTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("messageTemplates")
      .withIndex("by_urgent", (q) => q.eq("isUrgent", true))
      .filter((q) => q.eq(q.field("isActive"), true))
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
    const templateId = `TPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await ctx.db.insert("messageTemplates", {
      templateId,
      name: args.name,
      category: args.category,
      subject: args.subject,
      content: args.content,
      routes: args.routes || [],
      isUrgent: args.isUrgent,
      createdBy: args.supervisorBadge,
      createdByName: args.supervisorName,
      createdAt: Date.now(),
      useCount: 0,
      isActive: true,
    });
    
    return { success: true, templateId, id: result };
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
    supervisorName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the template
    const template = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();
    
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Prepare update data
    const updateData: any = {
      lastModifiedBy: args.supervisorBadge,
      lastModifiedAt: Date.now(),
    };
    
    // Only update provided fields
    if (args.name !== undefined) updateData.name = args.name;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.subject !== undefined) updateData.subject = args.subject;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.routes !== undefined) updateData.routes = args.routes;
    if (args.isUrgent !== undefined) updateData.isUrgent = args.isUrgent;
    
    await ctx.db.patch(template._id, updateData);
    
    return { success: true, templateId: args.templateId };
  },
});

// Delete (deactivate) a template
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
    
    // Soft delete by setting isActive to false
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
  args: { templateId: v.string() },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();
    
    if (!template) {
      return { success: false, error: "Template not found" };
    }
    
    await ctx.db.patch(template._id, {
      useCount: (template.useCount || 0) + 1,
      lastUsed: Date.now(),
    });
    
    return { success: true };
  },
});

// Seed the High Level Bridge template (called on first load)
export const seedHighLevelBridgeTemplate = mutation({
  args: {
    supervisorBadge: v.string(),
    supervisorName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if High Level Bridge template already exists
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
    
    // Create the High Level Bridge template
    const templateId = `TPL_HIGH_LEVEL_BRIDGE_${Date.now()}`;
    
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
      routes: ['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94'],
      isUrgent: true,
      createdBy: args.supervisorBadge,
      createdByName: args.supervisorName,
      createdAt: Date.now(),
      useCount: 0,
      isActive: true,
    });
    
    return { success: true, templateId };
  },
});
