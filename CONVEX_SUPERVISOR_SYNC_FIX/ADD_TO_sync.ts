// Add this function to convex/sync.ts

// Log a supervisor action (for audit trail)
export const logSupervisorAction = mutation({
  args: {
    supervisorId: v.string(),
    supervisorName: v.string(),
    action: v.string(),
    details: v.optional(v.any()),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert action into supervisorActions table
    const actionId = await ctx.db.insert("supervisorActions", {
      supervisorId: args.supervisorId,
      supervisorName: args.supervisorName,
      action: args.action,
      details: args.details || {},
      timestamp: args.timestamp,
      sessionId: args.sessionId,
      alertId: args.details?.alertId, // For alert-specific actions
    });

    console.log(`Logged supervisor action: ${args.action} by ${args.supervisorName}`);
    
    // Update sync state to trigger real-time updates
    const state = await ctx.db
      .query("syncState")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, {
        lastUpdated: Date.now(),
      });
    }
    
    return { success: true, actionId };
  },
});
