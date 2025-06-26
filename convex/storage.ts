// convex/storage.ts
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  // Generate a short-lived upload URL for file storage
  return await ctx.storage.generateUploadUrl();
});
