/*
 * Go Barry - Traffic Intelligence Platform Backend
 * © 2024-2025 Anthony Gair. All rights reserved.
 * anthonygair@icloud.com
 */

// backend/index.js - Go BARRY Backend
// Traffic Intelligence with TomTom + National Highways + StreetManager + Manual Incidents

console.log('🌟 index.js: Module loading started at', new Date().toISOString());

// All imports must be at the top level
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

// Import ALL working services
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom-enhanced.js';
import adminAPI from './routes/adminAPI.js';
import cleanupAPI from './routes/cleanupAPI.js';
import { fetchNationalHighways } from './services/nationalHighways.js';
import { initializeEnhancedGTFS, enhancedFindRoutesNearCoordinates } from './enhanced-gtfs-route-matcher.js';
import { initializeStreamingProcessor, findNearbyStopsFromCache } from './gtfs-streaming-processor.js';
import healthRoutes from './routes/health.js';
import healthExtendedRouter from './routes/healthExtended.js';
import supervisorAPI from './routes/supervisorAPI.js';
import roadworksAPI from './routes/roadworksAPI.js';
import roadworkAlertsAPI from './routes/roadworkAlertsAPI-simple.js';
import streetworksAPI from './routes/streetworksAPI.js';
import gtfsAPI from './routes/gtfsAPI.js';
import gtfsService from './services/gtfsService.js';
console.log('✅ roadworkAlertsAPI-simple imported successfully');
console.log('✅ streetworksAPI imported successfully');
console.log('✅ gtfsAPI imported successfully');
console.log('✅ gtfsService imported successfully');
import microsoftAuthAPI from './routes/microsoftAuthAPI.js';
console.log('✅ microsoftAuthAPI imported successfully');
import intelligenceAPI from './routes/intelligenceAPI.js';
import intelligenceAPINew from './routes/intelligenceAPINew.js';
import incidentAPI from './routes/incidentAPI.js';
import enhancementAPI from './routes/enhancementAPI.js';
import frequencyAPI from './routes/frequencyAPI.js';
import throttleAPI from './routes/throttleAPI.js';
import tileAPI from './routes/tileAPI.js';
import eventAPI from './routes/eventAPI.js';
import tomtomUsageAPI from './routes/tomtomUsageAPI.js';
import activityLogsAPI from './routes/activityLogs.js';
import dutyAPI from './routes/dutyAPI.js';
import messagingAPI from './routes/messagingAPI.js';
import messageHistoryRoutes from './routes/messageHistoryRoutes.js';
import analyticsAPI from './routes/analyticsAPI.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import communicationsAPI from './routes/communications/index.js';
console.log('✅ communicationsAPI imported successfully');
import fileManagementAPI from './routes/fileManagementAPI.js';
console.log('✅ fileManagementAPI imported successfully');
import startOfServiceAPI from './routes/startOfServiceAPI.js';
console.log('✅ startOfServiceAPI imported successfully');
import locationCorrectionAPI from './routes/locationCorrectionAPI.js';
import supervisorManager from './services/supervisorManager.js';
import memoryMonitor from './services/memoryMonitor.js';
import serviceFrequencyAnalyzer from './services/serviceFrequencyAnalyzer.js';
import supervisorSyncService from './services/supervisorSync.js';
import enhancedDataSourceManager from './services/enhancedDataSourceManager.js';

// Environment variable compatibility fix - runs after imports
// Render uses SUPABASE_SERVICE_ROLE_KEY but code expects SUPABASE_SERVICE_KEY
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('✅ Mapped SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SERVICE_KEY');
}

// Removed incorrect SUPABASE_URL fix - the URL is correct as-is

/*
 * ARCHITECTURAL FIX (June 2025):
 * Previously, this file created its own Express app, resulting in TWO separate app instances:
 * 1. render-startup.js created app #1 and listened on the port
 * 2. index.js created app #2 and registered all routes on it
 * Result: 100% of routes returned 404 because app #2 was never served
 * 
 * SOLUTION: Use the global app instance created by render-startup.js
 * This avoids circular dependencies and ensures all routes use the same app!
 */

// FIXED: Get the app instance from global (set by render-startup.js)
const app = global.goBarryApp;
if (!app) {
  console.error('❌ FATAL: No app instance found! render-startup.js must run first.');
  throw new Error('App not initialized by render-startup.js');
}

// Continue with the rest of the file...
// (The rest of the code would continue here)
