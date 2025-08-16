// System Health Monitor Service
// Provides real-time health monitoring, diagnostics, and reporting for the Go BARRY backend

import os from 'os';
import process from 'process';
import { getDatabaseStatus } from '../utils/performanceOptimizer.js';
import { getConvexSyncStatus } from './convexSync.js';
import { getAlertQueueStatus } from './enhancedAlertProcessor.js';

const healthState = {
  lastCheck: null,
  apiStatus: 'unknown',
  dbStatus: 'unknown',
  memory: {},
  responseTimes: [],
  alertQueue: {},
  convexSync: {},
  errorRates: [],
  capacity: {},
  predictive: {},
};

export async function checkAPIStatus() {
  // Simulate API health check
  return { status: 'ok', timestamp: Date.now() };
}

export async function checkDatabaseStatus() {
  return getDatabaseStatus();
}

export function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
    free: os.freemem(),
    total: os.totalmem(),
  };
}

export async function checkConvexSync() {
  return getConvexSyncStatus();
}

export async function checkAlertQueue() {
  return getAlertQueueStatus();
}

export async function runDiagnostics() {
  const [api, db, convex, alertQueue] = await Promise.all([
    checkAPIStatus(),
    checkDatabaseStatus(),
    checkConvexSync(),
    checkAlertQueue(),
  ]);
  const memory = getMemoryUsage();
  healthState.lastCheck = new Date();
  healthState.apiStatus = api.status;
  healthState.dbStatus = db.status;
  healthState.memory = memory;
  healthState.convexSync = convex;
  healthState.alertQueue = alertQueue;
  // ...add more metrics as needed
  return healthState;
}

export function getHealthReport() {
  return healthState;
}

// For integration with /api/health-extended and admin panel
export default {
  checkAPIStatus,
  checkDatabaseStatus,
  getMemoryUsage,
  checkConvexSync,
  checkAlertQueue,
  runDiagnostics,
  getHealthReport,
};
