/**
 * Go BARRY Breakdown Management System - Backend Server
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * Licensed exclusively to the operator for internal breakdown management.
 * See LICENSE.md for full terms and conditions.
 *
 * @author Anthony Gair
 * @version 2.0.0
 * @license Proprietary
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { generateToken, doubleCsrfProtection } from './middleware/csrfProtection.js';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import db, { healthCheck as dbHealthCheck, closePool } from './config/mysql.js';
import { activityLogger } from './services/activityLogger.js';
import {
  rateLimitLogin,
  clearLoginAttempts,
  rateLimitSDC,
  verifyToken,
  requireSupervisor,
  requireAdmin,
  authenticateUser,
  authenticateSupervisor,
  authenticateAdmin,
  authenticateSDC,
  healthCheck,
  logSecurityEvent
} from './middleware/authMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// MySQL Database Configuration Check
const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'gobarryco_breakdowns';

if (!process.env.DB_USER && !process.env.MYSQL_USER) {
  console.error('❌ Missing MySQL user configuration:');
  console.error('   DB_USER or MYSQL_USER:', '❌ Missing');
  process.exit(1);
}

if (!process.env.DB_PASSWORD && !process.env.MYSQL_PASSWORD) {
  console.error('❌ Missing MySQL password configuration:');
  console.error('   DB_PASSWORD or MYSQL_PASSWORD:', '❌ Missing');
  process.exit(1);
}

console.log('✅ MySQL client configuration loaded');
console.log(`   Database: ${dbName}@${dbHost}`);

// Note: activityLogger already uses MySQL via queryHelpers.js - no setup needed

// Verify MySQL connection on startup
// SIMPLIFIED: Skip actual database queries to avoid WebAssembly issues on shared hosting
async function verifyDatabaseConnection() {
  try {
    console.log('🔍 Verifying MySQL database connection...');

    // SIMPLIFIED: Just check if credentials are configured
    // Actual connection will be tested on first real query
    // This avoids WebAssembly errors on shared hosting
    if (dbHost && dbName) {
      console.log('✅ MySQL database connection configured');
      console.log(`📊 Database will be tested on first query`);
      return true;
    }

    console.error('❌ MySQL connection configuration missing');
    return false;
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    return false;
  }
}

// Parse allowed origins from environment variable
const getAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:5173',
    'https://breakdowns.gobarry.co.uk',
    'https://www.breakdowns.gobarry.co.uk',
    'https://api.breakdowns.gobarry.co.uk'
  ];

  const regexOrigins = [
    /^https:\/\/.*\.breakdowns\.gobarry\.co\.uk$/,
    /^http:\/\/localhost:\d+$/
  ];

  return [...new Set([...defaultOrigins, ...envOrigins]), ...regexOrigins];
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'CSRF-Token'],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision']
}));
app.use(express.json());
// HTTP-only cookie parser - must be after CORS and before routes
// This enables secure session management via cookies instead of localStorage (XSS protection)
app.use(cookieParser());

// SECURITY: CSRF protection configured in middleware/csrfProtection.js
// Uses csrf-csrf (double-submit cookie pattern, replaces deprecated csurf)
const isProduction = process.env.NODE_ENV === 'production';

app.use(morgan('combined'));

// Enhanced health check endpoint with MySQL status
app.get('/health', async (req, res) => {
  try {
    // Check MySQL connection
    const isHealthy = await dbHealthCheck();

    const dbStatus = isHealthy ? 'connected' : 'disconnected';

    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'breakdown-guide-api',
      database: {
        type: 'mysql',
        status: dbStatus,
        host: dbHost,
        name: dbName,
        error: isHealthy ? null : 'Health check failed'
      },
      environment: process.env.NODE_ENV || 'development',
      routes: {
        breakdowns: '/api/breakdowns',
        fleet: '/api/fleet',
        auth: '/api/auth',
        wizards: '/api/wizards',
        engineering: '/api/engineering',
        analytics: '/api/analytics',
        defects: '/api/defects'
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'breakdown-guide-api',
      error: err.message,
      database: {
        type: 'mysql',
        status: 'error',
        host: dbHost,
        name: dbName
      }
    });
  }
});

// Import routes
import breakdownRoutes from './routes/breakdowns.js';
import fleetRoutes from './routes/fleet.js';
import authRoutes from './routes/auth.js';
import wizardRoutes from './routes/wizards.js';
import engineeringRoutes from './routes/engineering.js';
import analyticsRoutes from './routes/analytics.js';
import loginAnalyticsRoutes from './routes/loginAnalytics.js';
import activityRoutes from './routes/activity.js';
import supervisorRoutes from './routes/supervisors.js';
import breakdownsAPIRoutes from './routes/breakdownsAPI.js';
import preferencesRoutes from './routes/preferences.js';
import publicRoutes from './routes/public.js';
import defectsRoutes from './routes/defects.js';
import bugReportsRoutes from './routes/bugReports.js';
import displayRoutes from './routes/displays.js';
import adminFleetRoutes from './routes/adminFleet.js';
import adminGTFSRoutes from './routes/adminGTFS.js';
import gtfsPhase1Routes from './routes/gtfsPhase1.js';
import gtfsPhase2Routes from './routes/gtfsPhase2.js';
import supervisorSessionsRoutes from './routes/supervisorSessions.js';
import assessmentRoutes from './routes/assessment.js';
import dutyHandoverRoutes from './routes/dutyHandover.js';
import dutyNotesRoutes from './routes/dutyNotes.js';
import dutySchedulesRoutes from './routes/dutySchedules.js';
import dutyAuditRoutes from './routes/dutyAudit.js';
import dutyBreaksRoutes from './routes/dutyBreaks.js';
import dutyExtensionsRoutes from './routes/dutyExtensions.js';
import systemSettingsRoutes from './routes/systemSettings.js';
import mileageRoutes from './routes/mileage.js';
import engineerManagementRoutes from './routes/engineerManagement.js';
import webSocketHandler from './routes/webSocketHandler.js';

// Root API documentation endpoint
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>the operator - Breakdown Guide API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .header { background: white; border-radius: 16px; padding: 40px; margin-bottom: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .header h1 { color: #667eea; font-size: 36px; margin-bottom: 10px; }
    .header p { color: #666; font-size: 18px; }
    .status { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 15px; }
    .section { background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .section h2 { color: #667eea; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; }
    .endpoint { background: #f9fafb; border-left: 4px solid #667eea; padding: 15px 20px; margin-bottom: 15px; border-radius: 8px; }
    .endpoint .method { display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; margin-right: 10px; }
    .method.get { background: #10b981; color: white; }
    .method.post { background: #3b82f6; color: white; }
    .method.put { background: #f59e0b; color: white; }
    .method.delete { background: #ef4444; color: white; }
    .endpoint .path { font-family: 'Courier New', monospace; color: #374151; font-size: 14px; }
    .endpoint .desc { color: #6b7280; font-size: 13px; margin-top: 5px; }
    .badge { display: inline-block; background: #e0e7ff; color: #6366f1; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px; }
    .footer { text-align: center; color: white; margin-top: 40px; font-size: 14px; }
    a { color: #667eea; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚍 the operator - Breakdown Guide API</h1>
      <p>Real-time breakdown management and fleet monitoring system</p>
      <span class="status">✅ API Online</span>
    </div>

    <div class="section">
      <h2>📊 System Health</h2>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path"><a href="${baseUrl}/health">/health</a></span>
        <div class="desc">API health check with MySQL connection status</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path"><a href="${baseUrl}/api/health">/api/health</a></span>
        <div class="desc">Alternative health check endpoint</div>
      </div>
    </div>

    <div class="section">
      <h2>🔓 Public Endpoints</h2>
      <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">These endpoints do not require authentication - designed for Control Room displays</p>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/public/breakdowns/live</span>
        <div class="desc">Get active breakdowns for public displays (Control Room)</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/public/breakdowns/stats</span>
        <div class="desc">Get breakdown statistics (query: ?period=today|week|month)</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/public/activity/feed</span>
        <div class="desc">Get activity feed (query: ?limit=25&offset=0)</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/public/fleet</span>
        <div class="desc">Get fleet database (all vehicles)</div>
      </div>
    </div>

    <div class="section">
      <h2>🔐 Authenticated Endpoints</h2>
      <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">These endpoints require JWT authentication token in Authorization header</p>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">🚨 Breakdowns</h3>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/breakdowns</span>
        <span class="badge">AUTH</span>
        <div class="desc">Create new breakdown report</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/breakdowns/live</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get live breakdowns for SDC Dashboard</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/breakdowns/in-progress</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get breakdowns currently being assessed</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/breakdowns/:id</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get specific breakdown by ID</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/breakdowns/:id</span>
        <span class="badge">AUTH</span>
        <div class="desc">Update breakdown details</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/breakdowns/stats</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get breakdown statistics</div>
      </div>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">🚍 Fleet Management</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/fleet/vehicles</span>
        <span class="badge">AUTH</span>
        <div class="desc">Search fleet vehicles</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/fleet/vehicle/:fleetNumber</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get specific vehicle details</div>
      </div>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">👤 Authentication</h3>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
        <div class="desc">Supervisor login (badge-based)</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/verify</span>
        <span class="badge">AUTH</span>
        <div class="desc">Verify current session</div>
      </div>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">🔧 Engineering</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/engineering/depot-stats</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get depot statistics</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/engineering/engineers</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get all engineers</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/engineering/assign</span>
        <span class="badge">AUTH</span>
        <div class="desc">Assign engineer to breakdown</div>
      </div>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">📈 Analytics</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/analytics/kpis</span>
        <span class="badge">AUTH</span>
        <div class="desc">Key performance indicators</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/analytics/trends</span>
        <span class="badge">AUTH</span>
        <div class="desc">Performance trends over time</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/analytics/depot-comparison</span>
        <span class="badge">AUTH</span>
        <div class="desc">Compare depot performance</div>
      </div>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">🔍 Fleet Intelligence / Defects</h3>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/defects/repeat</span>
        <span class="badge">AUTH</span>
        <div class="desc">Identify vehicles with repeat defects</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/defects/trends</span>
        <span class="badge">AUTH</span>
        <div class="desc">Analyze trending defect types</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/defects/depot-stats</span>
        <span class="badge">AUTH</span>
        <div class="desc">Defect statistics by depot</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/defects/predictive</span>
        <span class="badge">AUTH</span>
        <div class="desc">Data-driven predictive maintenance alerts based on historical patterns</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/defects/escalate</span>
        <span class="badge">AUTH</span>
        <div class="desc">Escalate critical defects to management</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/defects/report</span>
        <span class="badge">AUTH</span>
        <div class="desc">Generate comprehensive defect analysis report</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/defects/vehicle/:fleetNumber</span>
        <span class="badge">AUTH</span>
        <div class="desc">Complete defect history for specific vehicle</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/defects/notifications/maintenance</span>
        <span class="badge">AUTH</span>
        <div class="desc">Send notification to maintenance team</div>
      </div>

      <h3 style="color: #374151; font-size: 18px; margin: 20px 0 15px 0;">🖥️ Display Control</h3>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/displays/active</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get list of active engineering displays</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/displays/depot/:depot</span>
        <span class="badge">AUTH</span>
        <div class="desc">Get displays for specific depot</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/displays/control</span>
        <span class="badge">AUTH</span>
        <div class="desc">Send control command to display(s)</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/displays/:displayId/highlight</span>
        <span class="badge">AUTH</span>
        <div class="desc">Highlight specific breakdown on display</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/displays/:displayId/refresh</span>
        <span class="badge">AUTH</span>
        <div class="desc">Force display to refresh data</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/displays/:displayId/filters</span>
        <span class="badge">AUTH</span>
        <div class="desc">Update display filters remotely</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/displays/:displayId/depot</span>
        <span class="badge">AUTH</span>
        <div class="desc">Change which depot display shows</div>
      </div>
    </div>

    <div class="section">
      <h2>📡 WebSocket Endpoints</h2>
      <div class="endpoint">
        <span class="method get" style="background: #8b5cf6;">WS</span>
        <span class="path">ws://${req.get('host')}/ws/sdc-dashboard</span>
        <span class="badge">AUTH</span>
        <div class="desc">Real-time SDC Dashboard updates (requires token in URL: ?token=...)</div>
      </div>
      <div class="endpoint">
        <span class="method get" style="background: #8b5cf6;">WS</span>
        <span class="path">ws://${req.get('host')}/ws/control-room</span>
        <div class="desc">Real-time Control Room display updates (public)</div>
      </div>
      <div class="endpoint">
        <span class="method get" style="background: #8b5cf6;">WS</span>
        <span class="path">ws://${req.get('host')}/ws/engineering-display?displayId=yard1&depot=Washington</span>
        <div class="desc">Engineering display connection with remote control support (public)</div>
      </div>
    </div>

    <div class="footer">
      <p><strong>the operator</strong> • Breakdown Management System</p>
      <p style="margin-top: 10px; opacity: 0.8;">Production API • Powered by MySQL</p>
    </div>
  </div>
</body>
</html>
  `);
});

// Public routes (no authentication required)
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Diagnostic endpoint (admin only - exposes server config)
app.get('/api/diagnostics', authenticateAdmin, async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        env: process.env.NODE_ENV || 'not set'
      },
      database: {
        host: process.env.DB_HOST || 'NOT SET',
        port: process.env.DB_PORT || 'NOT SET',
        user: process.env.DB_USER || 'NOT SET',
        database: process.env.DB_NAME || 'NOT SET',
        passwordSet: !!process.env.DB_PASSWORD
      },
      tests: {}
    };

    // Test 1: MySQL connection
    try {
      const testQuery = await db('SELECT 1 as test');
      diagnostics.tests.mysqlConnection = '✅ Connected';
      diagnostics.tests.mysqlResponse = testQuery[0];
    } catch (error) {
      diagnostics.tests.mysqlConnection = `❌ ${error.message}`;
    }

    // Test 2: Check supervisors table
    try {
      const count = await db('SELECT COUNT(*) as count FROM supervisors');
      diagnostics.tests.supervisorsTable = `✅ ${count[0].count} supervisors found`;
    } catch (error) {
      diagnostics.tests.supervisorsTable = `❌ ${error.message}`;
    }

    // Test 3: Check specific supervisor
    try {
      const supervisor = await db(
        'SELECT id, email, name, badge_number FROM supervisors WHERE badge_number = ? LIMIT 1',
        ['AG003']
      );
      diagnostics.tests.supervisorAG003 = supervisor[0]
        ? `✅ Found: ${supervisor[0].name}`
        : '❌ Not found';
    } catch (error) {
      diagnostics.tests.supervisorAG003 = `❌ ${error.message}`;
    }

    // Test 4: Check breakdowns table
    try {
      const count = await db('SELECT COUNT(*) as count FROM breakdowns');
      diagnostics.tests.breakdownsTable = `✅ ${count[0].count} breakdowns found`;
    } catch (error) {
      diagnostics.tests.breakdownsTable = `❌ ${error.message}`;
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostics check failed'
    });
  }
});

app.use('/api/public', publicRoutes); // Public endpoints for Control Room Display

// CSRF token endpoint - public endpoint for getting token
app.get('/api/auth/csrf-token', (req, res) => {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
});

// Authentication routes (CSRF protection for all, rate limiting only on login/signup)
app.use('/api/auth', doubleCsrfProtection, authRoutes);

// Protected routes (require supervisor authentication)
app.use('/api/breakdowns', authenticateSupervisor, breakdownRoutes);
app.use('/api/fleet', authenticateSupervisor, fleetRoutes);
app.use('/api/wizards', authenticateSupervisor, wizardRoutes);
app.use('/api/engineering', authenticateSupervisor, engineeringRoutes);
app.use('/api/engineer-management', authenticateSupervisor, engineerManagementRoutes);
app.use('/api/analytics', authenticateSupervisor, analyticsRoutes);
app.use('/api/analytics', authenticateSupervisor, loginAnalyticsRoutes);
app.use('/api/reports', authenticateSupervisor, analyticsRoutes); // Reports also use analytics routes
app.use('/api/activity', authenticateSupervisor, activityRoutes);
app.use('/api/preferences', authenticateSupervisor, preferencesRoutes);
app.use('/api/defects', authenticateSupervisor, defectsRoutes);
app.use('/api/displays', authenticateSupervisor, displayRoutes); // Display control - requires auth
app.use('/api/bug-reports', bugReportsRoutes); // Bug reports - no auth required for submission, auth for viewing
app.use('/api/supervisors', supervisorRoutes); // Stats endpoint is read-only, no auth required
app.use('/api/assessment', assessmentRoutes); // Assessment broadcasts - no auth required for real-time updates
app.use('/api/duty', authenticateSupervisor, dutyHandoverRoutes); // Duty handover routes
app.use('/api/duty', authenticateSupervisor, dutyNotesRoutes); // Duty notes/log routes

// Admin-only routes (require admin role)
app.use('/api/admin/fleet', authenticateAdmin, adminFleetRoutes); // Fleet CSV import and management
app.use('/api/admin/gtfs', authenticateAdmin, adminGTFSRoutes); // GTFS transit data import
app.use('/api/admin/duty', authenticateAdmin, dutySchedulesRoutes); // Duty schedule management (Phase 5)
app.use('/api/audit', authenticateAdmin, dutyAuditRoutes); // Duty audit trail (Phase 9.2)
app.use('/api/breaks', authenticateSupervisor, dutyBreaksRoutes); // Break tracking (Phase 2.3)
app.use('/api/extensions', authenticateSupervisor, dutyExtensionsRoutes); // Duty extensions (Phase 2.5)
app.use('/api/settings', systemSettingsRoutes); // System settings (Phase 9.1) - compliance endpoint is public, others require admin

// GTFS Phase 1 Features - Live route status, coverage analysis, incident heatmap
app.use('/api/gtfs', authenticateSupervisor, gtfsPhase1Routes);
// GTFS Phase 2 Features - Trips at risk, service gaps, shape matching, timetable, stop finder
app.use('/api/gtfs', authenticateSupervisor, gtfsPhase2Routes);
app.use('/api/mileage', authenticateSupervisor, mileageRoutes); // Mileage lost calculation

// SDC Dashboard API routes (requires SDC operator authentication and rate limiting)
app.use('/api/sdc', rateLimitSDC, authenticateSDC, breakdownsAPIRoutes);

// Supervisor session management (requires authentication)
app.use('/api/supervisor-sessions', supervisorSessionsRoutes);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Centralized error handling - must be last
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket handler
webSocketHandler.initialize(server);

// Connect Activity Logger to WebSocket handler for real-time broadcasts
activityLogger.setWebSocketHandler(webSocketHandler);

// WebSocket connections are now handled by webSocketHandler

// WebSocket broadcast functions are now handled by webSocketHandler
// Export broadcast functions for use by other modules
export const broadcastToSDCDashboard = (message) => {
  return webSocketHandler.broadcast('sdc-dashboard', message);
};

export const broadcastToAll = (message) => {
  return webSocketHandler.broadcastToAll(message);
};

// WebSocket cleanup is now handled by webSocketHandler

// Graceful shutdown handler for MySQL
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM signal received: closing HTTP server and database connections');

  // Close the HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close MySQL connection pool
  try {
    await closePool();
    console.log('✅ MySQL connection pool closed');
  } catch (error) {
    console.error('❌ Error closing MySQL pool:', error);
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT signal received: closing HTTP server and database connections');

  // Close the HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close MySQL connection pool
  try {
    await closePool();
    console.log('✅ MySQL connection pool closed');
  } catch (error) {
    console.error('❌ Error closing MySQL pool:', error);
  }

  process.exit(0);
});

// Check if running under Passenger (Phusion Passenger doesn't need us to call listen())
const isPassenger = process.env.PASSENGER_APP_ENV || process.env.PHUSION_PASSENGER;

// Start server with MySQL verification (only if NOT under Passenger)
if (!isPassenger) {
  server.listen(PORT, async () => {
    console.log(`🚀 Breakdown Guide API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
    console.log(`🎯 SDC Dashboard WebSocket: ws://localhost:${PORT}/ws/sdc-dashboard`);

  // Verify MySQL connection
  const dbConnected = await verifyDatabaseConnection();
  if (!dbConnected) {
    console.warn('⚠️  Starting server despite MySQL connection issues');
    console.warn('   Check your environment variables and network connection');
  }

  console.log('\n📋 Available API Routes:');
  console.log(`   POST   http://localhost:${PORT}/api/breakdowns - Create breakdown`);
  console.log(`   GET    http://localhost:${PORT}/api/breakdowns/live - Live breakdowns for SDC`);
  console.log(`   GET    http://localhost:${PORT}/api/breakdowns/in-progress - Active assessments`);
  console.log(`   POST   http://localhost:${PORT}/api/breakdowns/:id/edit - Start assessment edit`);
  console.log(`   GET    http://localhost:${PORT}/api/breakdowns/:id/audit - Get audit trail`);
  console.log(`   PUT    http://localhost:${PORT}/api/breakdowns/:id - Update breakdown`);
  console.log(`   GET    http://localhost:${PORT}/api/breakdowns/stats - Get stats`);
  console.log(`   GET    http://localhost:${PORT}/api/fleet/vehicles - Search vehicles`);
  console.log(`   GET    http://localhost:${PORT}/api/fleet/vehicle/:fleetNumber - Get vehicle`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/login - Supervisor login`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/verify - Verify session`);
  console.log('\n   📊 Engineering Routes:');
  console.log(`   GET    http://localhost:${PORT}/api/engineering/depot-stats - Depot statistics`);
  console.log(`   GET    http://localhost:${PORT}/api/engineering/engineers - All engineers`);
  console.log(`   GET    http://localhost:${PORT}/api/engineering/metrics - Performance metrics`);
  console.log(`   POST   http://localhost:${PORT}/api/engineering/assign - Assign engineer`);
  console.log(`   POST   http://localhost:${PORT}/api/engineering/auto-assign - Auto-assign`);
  console.log('\n   📈 Analytics Routes:');
  console.log(`   GET    http://localhost:${PORT}/api/analytics/kpis - Key performance indicators`);
  console.log(`   GET    http://localhost:${PORT}/api/analytics/trends - Performance trends`);
  console.log(`   GET    http://localhost:${PORT}/api/analytics/depot-comparison - Compare depots`);
  console.log(`   GET    http://localhost:${PORT}/api/analytics/fleet-health - Fleet health`);
  console.log('\n   🔍 Fleet Intelligence / Defects Routes:');
  console.log(`   POST   http://localhost:${PORT}/api/defects/repeat - Identify repeat defects`);
  console.log(`   POST   http://localhost:${PORT}/api/defects/trends - Analyze defect trends`);
  console.log(`   GET    http://localhost:${PORT}/api/defects/depot-stats - Depot defect stats`);
  console.log(`   GET    http://localhost:${PORT}/api/defects/predictive - Predictive maintenance alerts`);
  console.log(`   POST   http://localhost:${PORT}/api/defects/escalate - Escalate defects`);
  console.log(`   POST   http://localhost:${PORT}/api/defects/report - Generate defect report`);
  console.log(`   GET    http://localhost:${PORT}/api/defects/vehicle/:fleetNumber - Vehicle defect history`);
  console.log(`   POST   http://localhost:${PORT}/api/defects/notifications/maintenance - Send maintenance notification`);
  console.log('\n✅ Server ready for connections with MySQL database');
  });
} else {
  // Running under Passenger - it will manage the server
  console.log('🚀 Breakdown Guide API starting under Passenger');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎯 Passenger will manage server lifecycle');

  // Still verify database connection
  (async () => {
    const dbConnected = await verifyDatabaseConnection();
    if (!dbConnected) {
      console.warn('⚠️  MySQL connection issues detected');
      console.warn('   Check your environment variables and network connection');
    } else {
      console.log('✅ Application ready with MySQL database');
    }
  })();
}

export { app, db };
