// Go_BARRY/convex/training.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProgress = query({
  args: { supervisorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trainingProgress")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .first();
  },
});

export const updateProgress = mutation({
  args: {
    supervisorId: v.string(),
    moduleId: v.string(),
    stepId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get existing progress
    const progress = await ctx.db
      .query("trainingProgress")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .first();
      
    if (progress) {
      // Update existing progress
      await ctx.db.patch(progress._id, {
        currentModule: args.moduleId,
        currentStep: args.stepId,
        lastActivityAt: Date.now(),
      });
    } else {
      // Create new progress record
      await ctx.db.insert("trainingProgress", {
        supervisorId: args.supervisorId,
        supervisorBadge: args.supervisorId,
        completedModules: [],
        currentModule: args.moduleId,
        currentStep: 0,
        totalScore: 0,
        startedAt: Date.now(),
        lastActivityAt: Date.now(),
        certificateIssued: false,
      });
    }
  },
});

export const completeModule = mutation({
  args: {
    supervisorId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("trainingProgress")
      .withIndex("by_supervisor", (q) => q.eq("supervisorId", args.supervisorId))
      .first();
      
    if (progress) {
      const completedModules = [...(progress.completedModules || []), args.moduleId];
      const updates: any = { 
        completedModules,
        lastActivityAt: Date.now(),
      };
      
      // Mark as complete if all 5 modules done
      if (completedModules.length === 5) {
        updates.completedAt = Date.now();
        updates.certificateIssued = true;
      }
      
      await ctx.db.patch(progress._id, updates);
    } else {
      await ctx.db.insert("trainingProgress", {
        supervisorId: args.supervisorId,
        supervisorBadge: args.supervisorId,
        completedModules: [args.moduleId],
        currentModule: args.moduleId,
        currentStep: 0,
        totalScore: 0,
        startedAt: Date.now(),
        lastActivityAt: Date.now(),
        certificateIssued: false,
      });
    }
  },
});

export const startModule = mutation({
  args: {
    supervisorId: v.string(),
    supervisorBadge: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    // Record module attempt
    const attemptCount = await ctx.db
      .query("trainingAttempts")
      .withIndex("by_supervisor_module", (q) => 
        q.eq("supervisorId", args.supervisorId).eq("moduleId", args.moduleId)
      )
      .collect();
      
    await ctx.db.insert("trainingAttempts", {
      supervisorId: args.supervisorId,
      supervisorBadge: args.supervisorBadge,
      moduleId: args.moduleId,
      attempt: attemptCount.length + 1,
      startedAt: Date.now(),
      passed: false,
      stepsCompleted: [],
    });
    
    // Update progress
    await updateProgress(ctx, {
      supervisorId: args.supervisorId,
      moduleId: args.moduleId,
      stepId: "start",
    });
  },
});

export const completeStep = mutation({
  args: {
    supervisorId: v.string(),
    moduleId: v.string(),
    stepId: v.string(),
    timeSpent: v.number(),
  },
  handler: async (ctx, args) => {
    // Find current attempt
    const attempt = await ctx.db
      .query("trainingAttempts")
      .withIndex("by_supervisor_module", (q) => 
        q.eq("supervisorId", args.supervisorId).eq("moduleId", args.moduleId)
      )
      .order("desc")
      .first();
      
    if (attempt && !attempt.completedAt) {
      const stepsCompleted = [...(attempt.stepsCompleted || []), {
        stepId: args.stepId,
        completedAt: Date.now(),
        timeSpent: args.timeSpent,
      }];
      
      await ctx.db.patch(attempt._id, { stepsCompleted });
    }
  },
});

export const submitQuiz = mutation({
  args: {
    supervisorId: v.string(),
    supervisorBadge: v.string(),
    moduleId: v.string(),
    quizResults: v.array(v.object({
      questionId: v.string(),
      answer: v.string(),
      correct: v.boolean(),
      timeSpent: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Calculate score
    const correctAnswers = args.quizResults.filter(r => r.correct).length;
    const totalQuestions = args.quizResults.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= 70; // 70% to pass
    
    // Update attempt
    const attempt = await ctx.db
      .query("trainingAttempts")
      .withIndex("by_supervisor_module", (q) => 
        q.eq("supervisorId", args.supervisorId).eq("moduleId", args.moduleId)
      )
      .order("desc")
      .first();
      
    if (attempt) {
      await ctx.db.patch(attempt._id, {
        quizResults: args.quizResults,
        score,
        passed,
        completedAt: passed ? Date.now() : undefined,
      });
    }
    
    // If passed, complete the module
    if (passed) {
      await completeModule(ctx, {
        supervisorId: args.supervisorId,
        moduleId: args.moduleId,
      });
    }
    
    return { score, passed };
  },
});

export const submitFeedback = mutation({
  args: {
    supervisorId: v.string(),
    moduleId: v.string(),
    rating: v.number(),
    feedback: v.optional(v.string()),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("trainingFeedback", {
      supervisorId: args.supervisorId,
      moduleId: args.moduleId,
      rating: args.rating,
      feedback: args.feedback,
      difficulty: args.difficulty,
      helpfulnessScore: args.rating, // Using rating as helpfulness for now
      createdAt: Date.now(),
    });
  },
});

export const getModuleAttempts = query({
  args: {
    supervisorId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trainingAttempts")
      .withIndex("by_supervisor_module", (q) => 
        q.eq("supervisorId", args.supervisorId).eq("moduleId", args.moduleId)
      )
      .order("desc")
      .collect();
  },
});