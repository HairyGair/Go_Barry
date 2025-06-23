// convex/dutyBoards.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Test mutation
export const testUpload = mutation({
  args: {
    test: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Test upload received:", args.test);
    return { success: true, message: "Test successful" };
  },
});

// New upload method using Convex storage
export const createDutyBoardWithStorage = mutation({
  args: {
    fileName: v.string(),
    storageId: v.id("_storage"),
    uploadedBy: v.string(),
    uploadedById: v.string(), 
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Deactivate any current active duty board
      const currentActive = await ctx.db
        .query("dutyBoards")
        .withIndex("by_active")
        .filter(q => q.eq(q.field("isActive"), true))
        .collect();
      
      for (const board of currentActive) {
        await ctx.db.patch(board._id, { isActive: false });
      }

      // Get the next version number
      const allBoards = await ctx.db.query("dutyBoards").collect();
      const maxVersion = Math.max(0, ...allBoards.map(b => b.version || 0));

      // Get URL for the stored file
      const fileUrl = await ctx.storage.getUrl(args.storageId);

      // Create the new duty board
      const newBoard = await ctx.db.insert("dutyBoards", {
        fileName: args.fileName,
        storageId: args.storageId,
        fileUrl: fileUrl || undefined,
        fileSize: args.fileSize,
        uploadedBy: args.uploadedBy,
        uploadedById: args.uploadedById,
        uploadedAt: Date.now(),
        isActive: true,
        version: maxVersion + 1,
      });

      return { success: true, id: newBoard, fileUrl };
    } catch (error) {
      console.error("Storage upload error:", error);
      throw new Error(`Failed to create duty board: ${error.message}`);
    }
  },
});

// Simplified upload without file data for testing
export const uploadDutyBoardMetadata = mutation({
  args: {
    fileName: v.string(),
    uploadedBy: v.string(),
    uploadedById: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Just save metadata without the actual file data
      const newBoard = await ctx.db.insert("dutyBoards", {
        fileName: args.fileName,
        fileData: "[File data omitted for testing]",
        fileSize: args.fileSize,
        uploadedBy: args.uploadedBy,
        uploadedById: args.uploadedById,
        uploadedAt: Date.now(),
        isActive: true,
        version: 1,
      });

      return { success: true, id: newBoard };
    } catch (error) {
      console.error("Metadata upload error:", error);
      throw new Error(`Failed to upload metadata: ${error.message}`);
    }
  },
});

// Get the current active duty board
export const getCurrentDutyBoard = query({
  args: {},
  handler: async (ctx) => {
    const dutyBoard = await ctx.db
      .query("dutyBoards")
      .withIndex("by_active")
      .filter(q => q.eq(q.field("isActive"), true))
      .first();
    
    if (!dutyBoard) return null;
    
    // If using storage, ensure we have the URL
    if (dutyBoard.storageId && !dutyBoard.fileUrl) {
      const fileUrl = await ctx.storage.getUrl(dutyBoard.storageId);
      return { ...dutyBoard, fileUrl };
    }
    
    return dutyBoard;
  },
});

// Upload a new duty board
export const uploadDutyBoard = mutation({
  args: {
    fileName: v.string(),
    fileData: v.string(),
    uploadedBy: v.string(),
    uploadedById: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("Upload starting with args:", {
        fileName: args.fileName,
        fileSize: args.fileSize,
        uploadedBy: args.uploadedBy,
        uploadedById: args.uploadedById,
        fileDataLength: args.fileData.length
      });

      // Deactivate any current active duty board
      const currentActive = await ctx.db
        .query("dutyBoards")
        .withIndex("by_active")
        .filter(q => q.eq(q.field("isActive"), true))
        .collect();
      
      console.log("Found active boards:", currentActive.length);
      
      for (const board of currentActive) {
        await ctx.db.patch(board._id, { isActive: false });
      }

      // Get the next version number
      const allBoards = await ctx.db.query("dutyBoards").collect();
      const maxVersion = Math.max(0, ...allBoards.map(b => b.version || 0));
      console.log("Next version:", maxVersion + 1);

      // Create the new duty board
      const newBoard = await ctx.db.insert("dutyBoards", {
        fileName: args.fileName,
        fileData: args.fileData,
        fileSize: args.fileSize,
        uploadedBy: args.uploadedBy,
        uploadedById: args.uploadedById,
        uploadedAt: Date.now(),
        isActive: true,
        version: maxVersion + 1,
      });

      console.log("Board created:", newBoard);

      // Log the action - wrap in try/catch in case this fails
      try {
        await ctx.db.insert("supervisorActions", {
          action: "upload_duty_board",
          supervisorId: args.uploadedById,
          supervisorName: args.uploadedBy,
          timestamp: Date.now(),
          details: {
            fileName: args.fileName,
            fileSize: args.fileSize,
            version: maxVersion + 1,
          },
        });
      } catch (logError) {
        console.error("Failed to log action:", logError);
        // Don't fail the upload if logging fails
      }

      return { success: true, id: newBoard };
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(`Failed to upload: ${error.message}`);
    }
  },
});

// Search within the PDF (placeholder - actual PDF text extraction would be needed)
export const searchInPDF = mutation({
  args: {
    dutyBoardId: v.id("dutyBoards"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const dutyBoard = await ctx.db.get(args.dutyBoardId);
    if (!dutyBoard) {
      throw new Error("Duty board not found");
    }

    // In a real implementation, you would:
    // 1. Extract text from the PDF if not already done
    // 2. Search through the extracted text
    // 3. Return page numbers and context
    
    // For now, return a placeholder
    return [
      {
        pageNumber: 1,
        context: "Example search result - PDF text search not implemented yet",
      },
    ];
  },
});

// Get duty board history
export const getDutyBoardHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const boards = await ctx.db
      .query("dutyBoards")
      .withIndex("by_upload_date")
      .order("desc")
      .take(limit);
    
    return boards;
  },
});

// Delete old duty boards (keep only last N versions)
export const cleanupOldDutyBoards = mutation({
  args: {
    keepVersions: v.number(),
  },
  handler: async (ctx, args) => {
    const allBoards = await ctx.db
      .query("dutyBoards")
      .withIndex("by_upload_date")
      .order("desc")
      .collect();
    
    // Keep the specified number of versions
    const boardsToDelete = allBoards.slice(args.keepVersions);
    
    for (const board of boardsToDelete) {
      await ctx.db.delete(board._id);
    }
    
    return {
      deleted: boardsToDelete.length,
      kept: Math.min(allBoards.length, args.keepVersions),
    };
  },
});
