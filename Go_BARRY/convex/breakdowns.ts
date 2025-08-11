// convex/breakdowns.ts
// Real-time breakdown tracking and synchronization

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Query all active breakdowns
export const getActiveBreakdowns = query({
  args: {},
  handler: async (ctx) => {
    const breakdowns = await ctx.db
      .query("breakdowns")
      .filter(q => 
        q.or(
          q.eq(q.field("status"), "started"),
          q.eq(q.field("status"), "diagnosed"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .order("desc")
      .collect();

    // Calculate time since diagnosis for each
    const now = Date.now();
    return breakdowns.map(breakdown => ({
      ...breakdown,
      minutesSinceDiagnosis: breakdown.diagnosedAt 
        ? Math.round((now - breakdown.diagnosedAt) / 60000)
        : null,
      isOverdue: breakdown.diagnosedAt 
        ? (now - breakdown.diagnosedAt) > 30 * 60 * 1000
        : false
    }));
  }
});

// Query today's breakdowns (since 1am)
export const getTodaysBreakdowns = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    today.setHours(1, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return await ctx.db
      .query("breakdowns")
      .filter(q => q.gte(q.field("createdAt"), todayTimestamp))
      .order("asc")
      .collect();
  }
});

// Query breakdowns by supervisor
export const getBreakdownsBySupervisor = query({
  args: { supervisorBadge: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("breakdowns")
      .filter(q => q.eq(q.field("supervisorBadge"), args.supervisorBadge))
      .order("desc")
      .take(50);
  }
});

// Query breakdown by ID
export const getBreakdownById = query({
  args: { breakdownId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("breakdowns")
      .filter(q => q.eq(q.field("breakdownId"), args.breakdownId))
      .first();
  }
});

// Create new breakdown
export const createBreakdown = mutation({
  args: {
    breakdownId: v.string(),
    dailyId: v.number(),
    fleetNumber: v.string(),
    depotId: v.string(),
    supervisorBadge: v.string(),
    supervisorName: v.string(),
    location: v.optional(v.string()),
    routeNumber: v.optional(v.string()),
    wizardType: v.optional(v.string()),
    isPriority: v.boolean(),
    isRepeat: v.boolean(),
    previousBreakdownId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const breakdown = {
      breakdownId: args.breakdownId,
      dailyId: args.dailyId,
      fleetNumber: args.fleetNumber,
      depotId: args.depotId,
      supervisorBadge: args.supervisorBadge,
      supervisorName: args.supervisorName,
      location: args.location || null,
      routeNumber: args.routeNumber || null,
      wizardType: args.wizardType || "general",
      status: "started",
      severity: "PENDING",
      isPriority: args.isPriority,
      isRepeat: args.isRepeat,
      previousBreakdownId: args.previousBreakdownId || null,
      createdAt: Date.now(),
      diagnosedAt: null,
      resolvedAt: null,
      returnedToServiceAt: null,
      autoEscalated: false,
      escalatedAt: null,
      wizardSteps: [],
      resolutionNotes: null,
      passengerCloudUsed: false,
      totalDurationMinutes: null,
      archived: false,
      archivedAt: null
    };

    const id = await ctx.db.insert("breakdowns", breakdown);
    
    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "breakdown_created",
      supervisorId: args.supervisorBadge,
      supervisorName: args.supervisorName,
      timestamp: Date.now(),
      details: {
        breakdownId: args.breakdownId,
        fleetNumber: args.fleetNumber,
        depot: args.depotId
      }
    });

    return id;
  }
});

// Add wizard step
export const addWizardStep = mutation({
  args: {
    breakdownId: v.string(),
    stepType: v.string(),
    stepData: v.any(),
    timestamp: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const breakdown = await ctx.db
      .query("breakdowns")
      .filter(q => q.eq(q.field("breakdownId"), args.breakdownId))
      .first();

    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    const newStep = {
      type: args.stepType,
      data: args.stepData,
      timestamp: args.timestamp || Date.now()
    };

    const updatedSteps = [...(breakdown.wizardSteps || []), newStep];

    await ctx.db.patch(breakdown._id, {
      wizardSteps: updatedSteps
    });

    return { success: true, totalSteps: updatedSteps.length };
  }
});

// Mark as diagnosed (start timer)
export const diagnoseBreakdown = mutation({
  args: {
    breakdownId: v.string(),
    severity: v.optional(v.string()),
    passengerCloudRequired: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const breakdown = await ctx.db
      .query("breakdowns")
      .filter(q => q.eq(q.field("breakdownId"), args.breakdownId))
      .first();

    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    const diagnosedAt = Date.now();

    await ctx.db.patch(breakdown._id, {
      status: "diagnosed",
      diagnosedAt: diagnosedAt,
      severity: args.severity || "AMBER",
      passengerCloudUsed: args.passengerCloudRequired || false
    });

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "breakdown_diagnosed",
      supervisorId: breakdown.supervisorBadge,
      supervisorName: breakdown.supervisorName,
      timestamp: diagnosedAt,
      details: {
        breakdownId: args.breakdownId,
        severity: args.severity
      }
    });

    return { success: true, diagnosedAt };
  }
});

// Resolve breakdown
export const resolveBreakdown = mutation({
  args: {
    breakdownId: v.string(),
    resolutionNotes: v.string(),
    resolvingSupervisor: v.string(),
    returnedToService: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const breakdown = await ctx.db
      .query("breakdowns")
      .filter(q => q.eq(q.field("breakdownId"), args.breakdownId))
      .first();

    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    const resolvedAt = Date.now();
    let totalDuration = null;

    if (breakdown.diagnosedAt) {
      totalDuration = Math.round((resolvedAt - breakdown.diagnosedAt) / 60000);
    }

    const updateData: any = {
      status: "resolved",
      resolvedAt: resolvedAt,
      resolutionNotes: args.resolutionNotes,
      resolvingSupervisor: args.resolvingSupervisor,
      totalDurationMinutes: totalDuration
    };

    if (args.returnedToService) {
      updateData.returnedToServiceAt = resolvedAt;
    }

    await ctx.db.patch(breakdown._id, updateData);

    // Log action
    await ctx.db.insert("supervisorActions", {
      action: "breakdown_resolved",
      supervisorId: args.resolvingSupervisor,
      supervisorName: args.resolvingSupervisor,
      timestamp: resolvedAt,
      details: {
        breakdownId: args.breakdownId,
        durationMinutes: totalDuration,
        notes: args.resolutionNotes
      }
    });

    return { success: true, durationMinutes: totalDuration };
  }
});

// Auto-escalate overdue breakdowns
export const checkEscalations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    const activeBreakdowns = await ctx.db
      .query("breakdowns")
      .filter(q => 
        q.and(
          q.eq(q.field("status"), "diagnosed"),
          q.eq(q.field("autoEscalated"), false)
        )
      )
      .collect();

    for (const breakdown of activeBreakdowns) {
      if (breakdown.diagnosedAt && (now - breakdown.diagnosedAt) > thirtyMinutes) {
        await ctx.db.patch(breakdown._id, {
          autoEscalated: true,
          escalatedAt: now
        });

        // Log escalation
        await ctx.db.insert("supervisorActions", {
          action: "breakdown_auto_escalated",
          supervisorId: "SYSTEM",
          supervisorName: "System",
          timestamp: now,
          details: {
            breakdownId: breakdown.breakdownId,
            minutesOverdue: Math.round((now - breakdown.diagnosedAt) / 60000)
          }
        });
      }
    }
  }
});

// Get breakdown statistics
export const getBreakdownStats = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    today.setHours(1, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const allBreakdowns = await ctx.db.query("breakdowns").collect();
    
    const todaysBreakdowns = allBreakdowns.filter(b => b.createdAt >= todayTimestamp);
    const activeBreakdowns = allBreakdowns.filter(b => 
      ["started", "diagnosed", "in_progress"].includes(b.status)
    );
    const resolvedToday = todaysBreakdowns.filter(b => b.status === "resolved");
    
    // Calculate average resolution time for today
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    
    for (const breakdown of resolvedToday) {
      if (breakdown.totalDurationMinutes) {
        totalResolutionTime += breakdown.totalDurationMinutes;
        resolvedCount++;
      }
    }
    
    const avgResolutionTime = resolvedCount > 0 
      ? Math.round(totalResolutionTime / resolvedCount)
      : 0;

    // Count by depot
    const depotCounts: Record<string, number> = {};
    for (const breakdown of todaysBreakdowns) {
      depotCounts[breakdown.depotId] = (depotCounts[breakdown.depotId] || 0) + 1;
    }

    return {
      totalToday: todaysBreakdowns.length,
      activeNow: activeBreakdowns.length,
      resolvedToday: resolvedToday.length,
      avgResolutionMinutes: avgResolutionTime,
      byDepot: depotCounts
    };
  }
});

// Archive old breakdowns (called by cron)
export const archiveOldBreakdowns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const oldBreakdowns = await ctx.db
      .query("breakdowns")
      .filter(q => 
        q.and(
          q.eq(q.field("status"), "resolved"),
          q.eq(q.field("archived"), false),
          q.lt(q.field("resolvedAt"), thirtyDaysAgo)
        )
      )
      .collect();

    for (const breakdown of oldBreakdowns) {
      await ctx.db.patch(breakdown._id, {
        archived: true,
        archivedAt: Date.now()
      });
    }

    return { archivedCount: oldBreakdowns.length };
  }
});
