// convex/crons.ts
// Scheduled functions for periodic cleanup

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run supervisor session cleanup every 5 minutes
crons.interval(
  "supervisor session cleanup",
  { minutes: 5 },
  internal.supervisors.cleanupExpiredSessions
);

export default crons;
