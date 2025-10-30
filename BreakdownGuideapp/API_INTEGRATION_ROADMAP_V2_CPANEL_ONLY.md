# Go BARRY - Complete API Integration & WebSocket Roadmap V2

**Date**: October 27, 2025
**Version**: 2.0 (ACCURATE PRODUCTION IMPLEMENTATION)
**Scope**: All 165+ REST APIs + WebSocket real-time communication
**Production URL**: https://breakdowns.gobarry.co.uk
**Deployment Targets**: cPanel + cPanel (Backup)
**Memory Constraint**: 2GB RAM limit on cPanel

---

## Overview

This document provides accurate implementation guidance for all Go BARRY APIs and WebSocket real-time communication, reflecting the **actual production architecture** currently deployed.

**Total APIs**: 165+ endpoints across 10 categories
**WebSocket Channels**: 5 real-time communication channels
**Current Deployment**: cPanel with MySQL backend
**Module System**: ES6 modules only (`"type": "module"`)
**Expected Integration Time**: 2-3 weeks

**Key Differences from V1**:
- Uses **WebSocket (ws package)**, not Convex
- Uses **ES6 imports**, not CommonJS require()
- Uses **MySQL on cPanel**, not cPanel initially
- Uses **Badge-based authentication** (9 supervisors)
- Memory optimization for 2GB constraint

---

## Phase 1: Foundation Setup (Week 1)

### 1.1 Environment Preparation

**Tasks**:
```
☐ Verify Node.js 18+ installed
☐ Create MySQL database and user credentials
☐ Generate JWT secret and store securely
☐ Set up application directories
☐ Create .env file with all required variables
☐ Test database connection
☐ Configure for 2GB RAM limit
```

**Commands**:
```bash
# Check Node.js version
node --version  # Must be 18+
npm --version

# Create app directory structure
mkdir -p /backend
cd /backend

# Initialize npm with ES6 modules
npm init -y

# IMPORTANT: Add "type": "module" to package.json
npm pkg set type=module

# Install core dependencies
npm install express ws mysql2 jsonwebtoken bcrypt cors helmet express-rate-limit dotenv morgan

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Critical package.json Configuration**:
```json
{
  "name": "breakdown-guide-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node --no-experimental-fetch server.js",
    "start:safe": "node --no-experimental-fetch --max-old-space-size=512 server.js",
    "dev": "nodemon --no-experimental-fetch server.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.4",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "joi": "^18.0.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "mysql2": "^2.3.3",
    "node-fetch": "^3.3.2",
    "ws": "^8.18.3"
  }
}
```

**Files to Create**:
- [ ] `/backend/.env` (production values)
- [ ] `/backend/.env.example` (template)
- [ ] `/backend/config/mysql.js` (MySQL connection pool)
- [ ] `/backend/middleware/authMiddleware.js` (badge-based auth)
- [ ] `/backend/middleware/cors.js`
- [ ] `/backend/routes/webSocketHandler.js` (WebSocket manager)

### 1.2 Database Setup (MySQL)

**Create MySQL Database**:
```sql
-- Connect to MySQL
mysql -h your-host -u root -p

-- Create database
CREATE DATABASE gobarryco_breakdowns CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'gobarry_user'@'%' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON gobarryco_breakdowns.* TO 'gobarry_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

**Run Migrations**:
```bash
# Apply base schema
mysql -h your-host -u gobarry_user -p gobarryco_breakdowns < migrations/001_create_base_tables.sql
mysql -h your-host -u gobarry_user -p gobarryco_breakdowns < migrations/002_create_breakdown_tables.sql
mysql -h your-host -u gobarry_user -p gobarryco_breakdowns < migrations/003_create_analytics_tables.sql

# Verify tables created
mysql -h your-host -u gobarry_user -p gobarryco_breakdowns -e "SHOW TABLES;"
```

**Essential Tables**:
- [ ] supervisors (9 badge-based users: AG003, BP009, etc.)
- [ ] supervisor_sessions (JWT token tracking)
- [ ] fleet_vehicles (231+ buses)
- [ ] breakdowns (core breakdown data)
- [ ] breakdown_activity (audit trail)
- [ ] wizard_assessments (diagnostic wizard data)
- [ ] activity_logs (system activity feed)
- [ ] engineers (dispatch team)

---

## Phase 2: Backend Infrastructure (Week 1-2)

### 2.1 Express Server Setup (ES6 Modules)

**Create `/backend/server.js`**:
```javascript
/**
 * Go BARRY Breakdown Management System - Backend Server
 * ES6 Module System - No require() statements
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import db from './config/mysql.js';
import webSocketHandler from './routes/webSocketHandler.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow WebSocket connections
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));

// Body parsing (memory-optimized)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging (production-safe)
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      memory: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB',
      uptime: process.uptime() + ' seconds'
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: error.message
    });
  }
});

// Import API routes (all use ES6 imports)
import authRoutes from './routes/auth.js';
import breakdownRoutes from './routes/breakdowns.js';
import fleetRoutes from './routes/fleet.js';
import activityRoutes from './routes/activity.js';
import engineeringRoutes from './routes/engineering.js';
import defectsRoutes from './routes/defects.js';
import analyticsRoutes from './routes/analytics.js';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/defects', defectsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
webSocketHandler.initialize(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`🌐 Production: https://breakdowns.gobarry.co.uk`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

**ES6 __dirname Workaround**:
```javascript
// For any files needing __dirname in ES6 modules:
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now you can use __dirname:
const dataPath = join(__dirname, '../data/breakdown-counter.json');
```

**Checklist**:
- [ ] Express app created and listening
- [ ] Health endpoint responds
- [ ] CORS configured for production domains
- [ ] Error handlers in place
- [ ] Memory limits set (--max-old-space-size=512)
- [ ] All imports use ES6 syntax (no require())

### 2.2 MySQL Database Connection (ES6)

**Create `/backend/config/mysql.js`**:
```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool (memory-optimized)
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQL_HOST,
  user: process.env.DB_USER || process.env.MYSQL_USER,
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 5, // Low for 2GB RAM constraint
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Query helper function
export async function query(sql, values) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

// Health check
export async function healthCheck() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  } finally {
    connection.release();
  }
}

// Close pool (for graceful shutdown)
export async function closePool() {
  await pool.end();
}

// Default export
export default { query, healthCheck, closePool, pool };
```

**Checklist**:
- [ ] Connection pool configured for low memory
- [ ] Query helper function working
- [ ] Database connection tested
- [ ] Error handling for disconnections
- [ ] Graceful shutdown support

---

## Phase 3: API Routes Implementation (Week 2)

### 3.1 Authentication Routes (Badge-Based)

**Go BARRY uses badge-based authentication for 9 real supervisors**:
- AG003 (Admin)
- BP009 (Admin)
- JF001, KB001, AJ001, CC001, CL001, DM001, BM001

**Create `/backend/routes/auth.js`** (ES6):
```javascript
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/mysql.js';
import { rateLimitLogin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find supervisor by email
    const [users] = await query(
      'SELECT * FROM supervisors WHERE email = ? AND is_active = 1',
      [email.toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        badge: user.badge_number,
        role: user.role,
        depot: user.depot
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await query(
      'UPDATE supervisors SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Log successful login
    await query(
      'INSERT INTO activity_logs (activity_type, actor_type, actor_id, actor_name, message) VALUES (?, ?, ?, ?, ?)',
      ['supervisor_login', 'supervisor', user.badge_number, user.name, `${user.name} logged in`]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        badge: user.badge_number,
        role: user.role,
        depot: user.depot,
        is_admin: user.role === 'admin'
      },
      expiresIn: '24h'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/validate
router.get('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const [users] = await query(
      'SELECT id, email, name, badge_number, role, depot FROM supervisors WHERE id = ? AND is_active = 1',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: users[0]
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
```

**Authentication Middleware** (`/backend/middleware/authMiddleware.js`):
```javascript
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { query } from '../config/mysql.js';

// Rate limiter for login attempts
export const rateLimitLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

// Verify JWT token
export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Require supervisor role
export async function requireSupervisor(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
}

// Require admin role (only AG003 and BP009)
export async function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}

export default {
  rateLimitLogin,
  verifyToken,
  requireSupervisor,
  requireAdmin
};
```

**Checklist**:
- [ ] Login endpoint working with badge numbers
- [ ] JWT token generation with supervisor metadata
- [ ] Token validation endpoint
- [ ] Rate limiting enforced (5 attempts/15 min)
- [ ] Admin role checking (AG003, BP009 only)
- [ ] Activity logging for all auth events

### 3.2 Complete API Documentation

**For full endpoint documentation, see**: `COMPLETE_API_ENDPOINT_AUDIT.md`

**Summary**:
- 21 Authentication & Supervisors endpoints
- 42 Breakdowns & Tracking endpoints
- 11 Fleet Management endpoints
- 18 Activity & Audit endpoints
- 32 Engineering Operations endpoints
- 8 Defects & Maintenance endpoints
- 15 Analytics & Reporting endpoints
- 7 Public & Display endpoints

**Total**: 165+ endpoints

**Memory Optimization Pattern for All Routes**:
```javascript
// Always close connections explicitly
// Always paginate results (max 100 records)
// Always release database connections
// Stream large responses instead of buffering

// Example:
router.get('/breakdowns', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Cap at 100
  const offset = parseInt(req.query.offset) || 0;

  const [breakdowns] = await query(
    'SELECT * FROM breakdowns ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  res.json({
    breakdowns,
    pagination: { limit, offset, count: breakdowns.length }
  });
});
```

---

## Phase 4: Real-Time Communication (WebSocket) (Week 2-3)

### 4.1 WebSocket Server Setup

**Go BARRY uses native WebSocket (ws package), NOT Convex.**

**WebSocket Handler Structure** (`/backend/routes/webSocketHandler.js`):
```javascript
import { WebSocketServer } from 'ws';
import { verifyToken } from '../middleware/authMiddleware.js';
import { query } from '../config/mysql.js';

class WebSocketHandler {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.channels = new Map([
      ['sdc-dashboard', new Set()],      // SDC operators (protected)
      ['breakdowns', new Set()],          // Supervisor breakdowns (protected)
      ['assessment-progress', new Set()], // Ongoing assessments (protected)
      ['control-room', new Set()],        // Public display (public)
      ['defect-intelligence', new Set()]  // Fleet alerts (public)
    ]);
  }

  // Initialize WebSocket server
  initialize(server) {
    console.log('🔌 Initializing WebSocket server');

    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    console.log('✅ WebSocket server initialized on /ws');
  }

  // Handle new WebSocket connection
  async handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const url = new URL(request.url, `http://${request.headers.host}`);

    const channel = url.searchParams.get('channel') || 'general';
    const token = url.searchParams.get('token');

    console.log(`🔗 New WebSocket connection: ${clientId} on channel: ${channel}`);

    // Protected channels require authentication
    const protectedChannels = ['sdc-dashboard', 'breakdowns', 'assessment-progress'];

    if (protectedChannels.includes(channel)) {
      if (!token) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Authentication required for this channel',
          code: 'WS_AUTH_REQUIRED'
        }));
        ws.close();
        return;
      }

      // Verify JWT token
      const decoded = await verifyToken(token);
      if (!decoded) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid or expired token',
          code: 'WS_AUTH_INVALID'
        }));
        ws.close();
        return;
      }

      // For SDC dashboard, verify supervisor privileges
      if (channel === 'sdc-dashboard') {
        const [supervisors] = await query(
          'SELECT * FROM supervisors WHERE email = ? AND is_active = 1',
          [decoded.email]
        );

        if (!supervisors || supervisors.length === 0) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'SDC operator privileges required',
            code: 'WS_SDC_AUTH_FORBIDDEN'
          }));
          ws.close();
          return;
        }
      }

      console.log(`✅ WebSocket authenticated: ${decoded.email} on channel: ${channel}`);
    }

    // Store client
    this.clients.set(clientId, {
      ws,
      channel,
      authenticated: !!token,
      connectedAt: new Date().toISOString()
    });

    // Add to channel
    if (this.channels.has(channel)) {
      this.channels.get(channel).add(clientId);
    }

    // Set up event handlers
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      channel,
      timestamp: new Date().toISOString()
    }));
  }

  // Broadcast message to channel
  broadcast(channel, data) {
    if (!this.channels.has(channel)) return 0;

    let sentCount = 0;
    const clients = this.channels.get(channel);

    clients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === 1) { // OPEN
        try {
          client.ws.send(JSON.stringify(data));
          sentCount++;
        } catch (error) {
          console.error(`Error sending to ${clientId}:`, error);
        }
      }
    });

    console.log(`📡 Broadcasted to ${sentCount} clients on ${channel}`);
    return sentCount;
  }

  // Generate unique client ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Handle client disconnection
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      this.channels.forEach(channelClients => {
        channelClients.delete(clientId);
      });
      this.clients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId}`);
    }
  }
}

// Create singleton instance
const webSocketHandler = new WebSocketHandler();
export default webSocketHandler;
```

### 4.2 WebSocket Channels

**Channel Documentation**:

| Channel | Auth Required | Purpose | Event Types |
|---------|--------------|---------|-------------|
| `sdc-dashboard` | Yes (Supervisor) | SDC Operations Dashboard | NEW_BREAKDOWN, BREAKDOWN_UPDATED, CRITICAL_PATTERN |
| `breakdowns` | Yes (Supervisor) | Breakdown updates | BREAKDOWN_UPDATED, ENGINEER_ASSIGNED, ASSESSMENT_COMPLETE |
| `assessment-progress` | Yes (Supervisor) | Wizard progress tracking | WIZARD_STARTED, WIZARD_PROGRESS, WIZARD_COMPLETED |
| `control-room` | No (Public) | Control Room Display | DISPLAY_UPDATE, STATS_UPDATE |
| `defect-intelligence` | No (Public) | Fleet intelligence | REPEAT_DEFECT, TREND_UPDATE, PREDICTIVE_ALERT |

### 4.3 WebSocket Event Types

**Breakdown Events**:
```javascript
// When breakdown created
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'NEW_BREAKDOWN',
  data: {
    breakdown_id: 'BRK-0123',
    fleet_no: '1234',
    severity: 'high',
    location: 'City Centre',
    supervisor: 'AG003'
  },
  timestamp: new Date().toISOString()
});

// When status changes
webSocketHandler.broadcast('breakdowns', {
  type: 'BREAKDOWN_UPDATED',
  data: {
    breakdown_id: 'BRK-0123',
    new_status: 'in-progress',
    updated_by: 'BP009'
  },
  timestamp: new Date().toISOString()
});

// Critical pattern detected
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'CRITICAL_PATTERN',
  data: {
    pattern_type: 'REPEAT_VEHICLE',
    fleet_no: '1234',
    count: 5,
    timeframe: '24h'
  },
  priority: 'critical',
  timestamp: new Date().toISOString()
});
```

### 4.4 Frontend WebSocket Integration

**React Hook** (`/frontend/hooks/useWebSocket.js`):
```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(channel, token) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//go-barry.oncPanel hosting/ws?channel=${channel}&token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[WS] Connected to ${channel}`);
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);

        // Dispatch custom event for component listening
        window.dispatchEvent(new CustomEvent('ws-message', { detail: message }));
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setConnected(false);

      // Reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    wsRef.current = ws;
  }, [channel, token]);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, token]);

  return { connected, lastMessage };
}

// Usage in component
export function BreakdownsPanel() {
  const token = localStorage.getItem('auth_token');
  const { connected, lastMessage } = useWebSocket('sdc-dashboard', token);
  const [breakdowns, setBreakdowns] = useState([]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'NEW_BREAKDOWN') {
      setBreakdowns(prev => [lastMessage.data, ...prev]);
    }
  }, [lastMessage]);

  return (
    <div>
      <span>WebSocket: {connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
      {/* Render breakdowns */}
    </div>
  );
}
```

**Checklist**:
- [ ] WebSocket server initialized
- [ ] 5 channels configured (sdc-dashboard, breakdowns, assessment-progress, control-room, defect-intelligence)
- [ ] Authentication on protected channels
- [ ] Broadcast function implemented
- [ ] Frontend hook created
- [ ] Auto-reconnection logic working
- [ ] Memory leak prevention

---

## Phase 5: Deployment (Week 3)

### 5.1 cPanel Deployment (Current Production)

**cPanel Configuration**:

**Web Service Settings**:
- **Name**: go-barry-backend
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm run start:safe` (with memory limit)
- **Instance Type**: Starter (2GB RAM)
- **Region**: Oregon (US-West)

**Environment Variables** (set in Render dashboard):
```bash
NODE_ENV=production
PORT=3001

# Database (Render MySQL or external)
DB_HOST=your-mysql-host
DB_USER=gobarry_user
DB_PASSWORD=your-secure-password
DB_NAME=gobarryco_breakdowns

# JWT Secret
JWT_SECRET=your-generated-secret-here

# CORS (production domains)
ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,https://control-room.gobarry.co.uk

# Memory settings
NODE_OPTIONS=--max-old-space-size=512
```

**Deploy Commands**:
```bash
# Connect to Git repository
git remote add render https://github.com/your-username/go-barry-backend.git

# Push to deploy
git push render main

# Monitor deployment
# Check Render dashboard for logs
```

**Health Check**:
```bash
# Test production API
curl https://breakdowns.gobarry.co.uk/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-27T...","database":"connected"}
```

**Checklist**:
- [ ] cPanel service created
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Health endpoint responding
- [ ] WebSocket connections working (wss://)
- [ ] SSL certificate active
- [ ] Memory usage monitored (<2GB)
- [ ] Logs accessible via Render dashboard

### 5.2 cPanel Deployment (Backup Option)

**Apache Reverse Proxy Configuration** (`.htaccess`):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # WebSocket proxy (CRITICAL for real-time features)
  RewriteCond %{HTTP:Upgrade} websocket [NC]
  RewriteCond %{HTTP:Connection} upgrade [NC]
  RewriteRule ^ws(.*)$ ws://127.0.0.1:3001/ws$1 [P,L]

  # API proxy
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]

  # CORS headers
  Header always set Access-Control-Allow-Origin "*"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

**PM2 Ecosystem File** (`ecosystem.config.cjs`):
```javascript
// Note: CommonJS for PM2 compatibility
module.exports = {
  apps: [{
    name: 'go-barry-backend',
    script: 'server.js',
    interpreter: 'node',
    interpreter_args: '--no-experimental-fetch --max-old-space-size=512',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

**cPanel Deployment Commands**:
```bash
# SSH to cPanel server
ssh user@your-cpanel-server

# Navigate to app directory
cd /home/gobarry/public_html/go-barry-backend

# Install dependencies
npm install --production

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup

# Monitor
pm2 monit
pm2 logs go-barry-backend
```

**Checklist**:
- [ ] Node.js App Manager configured
- [ ] PM2 process running
- [ ] Apache proxy configured (including WebSocket)
- [ ] SSL certificate installed
- [ ] Startup script configured
- [ ] Logs accessible
- [ ] Memory limit enforced

---

## Phase 6: Testing & Validation (Week 3)

### 6.1 API Endpoint Testing

**Test All 165+ Endpoints** (see `COMPLETE_API_ENDPOINT_AUDIT.md` for full list):

```bash
# Set production URL
API_URL="https://breakdowns.gobarry.co.uk"

# Test health endpoint
curl $API_URL/health

# Test login
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@gobarry.co.uk",
    "password": "your-password"
  }'

# Store token
TOKEN="eyJhbGc..." # From login response

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/api/breakdowns/active

# Test breakdown creation
curl -X POST $API_URL/api/breakdowns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_no": "1234",
    "location": "City Centre",
    "issue_category": "Engine",
    "severity": "high",
    "supervisor_badge": "AG003"
  }'

# Test fleet search
curl "$API_URL/api/fleet/search/1234"

# Test activity feed
curl "$API_URL/api/activity/feed?limit=10"
```

### 6.2 WebSocket Connection Testing

```bash
# Install websocat (WebSocket client)
# macOS: brew install websocat
# Linux: cargo install websocat

# Test WebSocket connection
websocat "wss://breakdowns.gobarry.co.uk/ws?channel=control-room"

# Test authenticated channel
websocat "wss://breakdowns.gobarry.co.uk/ws?channel=sdc-dashboard&token=$TOKEN"

# Should receive welcome message:
# {"type":"connected","clientId":"client_...","channel":"sdc-dashboard"}

# Send ping
echo '{"type":"ping"}' | websocat "wss://breakdowns.gobarry.co.uk/ws?channel=control-room"

# Should receive pong
# {"type":"pong","timestamp":"2025-10-27T..."}
```

### 6.3 Load Testing (2GB Memory Constraint)

```bash
# Install Apache Bench
# macOS: already installed
# Linux: apt-get install apache2-utils

# Test under load (monitor memory usage)
ab -n 1000 -c 50 -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/breakdowns/active

# Expected: <200ms response time, <2GB memory usage
# Monitor in Render dashboard: Metrics > Memory Usage

# Test concurrent WebSocket connections
# Create test script:
cat > test-websockets.js << 'EOF'
import WebSocket from 'ws';

const connections = [];
const maxConnections = 100;

for (let i = 0; i < maxConnections; i++) {
  const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws?channel=control-room');

  ws.on('open', () => {
    console.log(`Connection ${i + 1} opened`);
  });

  ws.on('message', (data) => {
    console.log(`Connection ${i + 1} received:`, data.toString());
  });

  connections.push(ws);
}

// Keep alive for 30 seconds
setTimeout(() => {
  connections.forEach(ws => ws.close());
  process.exit(0);
}, 30000);
EOF

node test-websockets.js
```

**Test Checklist**:
```
☐ All 165+ endpoints returning correct data
☐ Authentication working (badge-based)
☐ Rate limiting enforced (5 attempts/15 min)
☐ WebSocket connections stable
☐ All 5 channels working
☐ Protected channels require auth
☐ Public channels accessible
☐ Real-time broadcasts working
☐ Auto-reconnection functioning
☐ Memory usage <2GB under load
☐ Response times <200ms
☐ Database queries optimized
☐ No memory leaks detected
☐ SSL certificates valid
☐ CORS properly configured
```

---

## Phase 7: Production Hardening (Week 3+)

### 7.1 Monitoring & Logging

**Application Logging** (ES6):
```javascript
import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logFile = createWriteStream(
  join(__dirname, '../logs/app.log'),
  { flags: 'a' }
);

// Log middleware
app.use((req, res, next) => {
  const log = `${new Date().toISOString()} ${req.method} ${req.path}`;
  logFile.write(log + '\n');
  console.log(log);
  next();
});
```

**Enhanced Health Endpoint**:
```javascript
app.get('/health', async (req, res) => {
  try {
    // Test database
    await db.query('SELECT 1');

    // Test memory
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    // Get WebSocket stats
    const wsStats = webSocketHandler.getConnectionStats();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      websocket: {
        active_connections: wsStats.total_clients,
        channels: wsStats.channels
      },
      memory: {
        heap_used_mb: heapUsedMB,
        heap_total_mb: heapTotalMB,
        percentage: Math.round((heapUsedMB / heapTotalMB) * 100)
      },
      uptime: Math.round(process.uptime()) + ' seconds',
      version: '2.0.0'
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      error: err.message
    });
  }
});
```

**Checklist**:
- [ ] Application logging configured
- [ ] Health check monitoring memory
- [ ] WebSocket stats tracked
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Performance monitoring (Render metrics)
- [ ] Alert system configured (email/Slack)
- [ ] Database query logging
- [ ] Slow query detection

### 7.2 Memory Optimization (2GB Constraint)

**Critical Memory Patterns**:
```javascript
// 1. Always paginate results
router.get('/breakdowns', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const [breakdowns] = await db.query(
    'SELECT * FROM breakdowns LIMIT ? OFFSET ?',
    [limit, offset]
  );

  res.json({ breakdowns, pagination: { limit, offset } });
});

// 2. Stream large responses
import { pipeline } from 'stream';

router.get('/export/breakdowns', async (req, res) => {
  const stream = db.pool.query('SELECT * FROM breakdowns').stream();

  res.setHeader('Content-Type', 'application/json');
  res.write('[');

  let first = true;
  stream.on('data', (row) => {
    if (!first) res.write(',');
    res.write(JSON.stringify(row));
    first = false;
  });

  stream.on('end', () => {
    res.write(']');
    res.end();
  });
});

// 3. Release connections immediately
async function getBreakdown(id) {
  const connection = await db.pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM breakdowns WHERE id = ?',
      [id]
    );
    return rows[0];
  } finally {
    connection.release(); // Always release
  }
}

// 4. Use connection pooling limits
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  connectionLimit: 5, // Low for 2GB constraint
  queueLimit: 0
});

// 5. Implement garbage collection hints
if (global.gc) {
  setInterval(() => {
    global.gc();
    console.log('Manual GC triggered');
  }, 60000); // Every minute
}
```

**Start Script with Memory Limits**:
```json
{
  "scripts": {
    "start": "node --no-experimental-fetch server.js",
    "start:safe": "node --no-experimental-fetch --max-old-space-size=512 server.js",
    "start:gc": "node --no-experimental-fetch --max-old-space-size=512 --expose-gc server.js"
  }
}
```

**Checklist**:
- [ ] All queries paginated (max 100 records)
- [ ] Large responses streamed
- [ ] Database connections always released
- [ ] Connection pool limited (5 connections)
- [ ] Memory usage monitored (<2GB)
- [ ] Garbage collection optimized
- [ ] Memory leaks detected and fixed
- [ ] WebSocket connections limited (max 500)

### 7.3 Security Hardening

```javascript
// HTTPS enforcement
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Security headers (Helmet)
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: false, // Allow WebSocket
  crossOriginEmbedderPolicy: false
}));

// Input validation (Joi)
import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  // ... login logic
});

// Rate limiting on critical endpoints
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

app.use('/api/auth/login', loginLimiter);
```

**Checklist**:
- [ ] HTTPS enforced
- [ ] Security headers set (Helmet)
- [ ] Input validation on all endpoints (Joi)
- [ ] SQL injection prevention (prepared statements)
- [ ] XSS protection
- [ ] Rate limiting on auth endpoints
- [ ] CORS whitelist configured
- [ ] JWT secrets secured
- [ ] Database passwords secured
- [ ] Environment variables protected

---

## Summary & Quick Reference

### Total Implementation: 3 weeks

| Week | Phase | Key Deliverables |
|------|-------|-----------------|
| Week 1 | Foundation | ES6 setup, MySQL, Environment |
| Week 1-2 | Backend | Express server, WebSocket, Routes |
| Week 2 | API Routes | 165+ endpoints implemented |
| Week 2-3 | Real-Time | WebSocket events, 5 channels |
| Week 3 | Deployment | cPanel + cPanel options |
| Week 3+ | Testing | Load testing, Memory optimization |

### Production URLs

- **API**: https://breakdowns.gobarry.co.uk
- **WebSocket**: wss://breakdowns.gobarry.co.uk/ws
- **Health**: https://breakdowns.gobarry.co.uk/health
- **Documentation**: [COMPLETE_API_ENDPOINT_AUDIT.md](./COMPLETE_API_ENDPOINT_AUDIT.md)

### Critical Constraints

- **Memory**: 2GB RAM limit (cPanel Starter)
- **Module System**: ES6 only (`"type": "module"`)
- **Authentication**: Badge-based (9 supervisors)
- **WebSocket**: Native ws package, NOT Convex
- **Database**: MySQL (Render or external)

### Quick Commands

```bash
# Development
npm run dev

# Production (memory-optimized)
npm run start:safe

# Test health
curl https://breakdowns.gobarry.co.uk/health

# Test WebSocket
websocat "wss://breakdowns.gobarry.co.uk/ws?channel=control-room"

# Monitor memory
pm2 monit # (cPanel)
# Or check Render dashboard
```

### Support

- **API Documentation**: `COMPLETE_API_ENDPOINT_AUDIT.md` (165+ endpoints)
- **Deployment Guide**: `DEPLOYMENT.md`
- **System Status**: `SYSTEM_STATUS.md`
- **Migration Instructions**: `MIGRATION_INSTRUCTIONS.md`

---

**Document Version**: 2.0
**Last Updated**: October 27, 2025
**Status**: Production-Ready
**Generated**: Accurate implementation guide based on actual codebase

**Next Steps**:
1. Review Phase 1 setup
2. Configure MySQL database
3. Deploy to cPanel
4. Test all 165+ endpoints
5. Verify WebSocket channels
6. Monitor memory usage (<2GB)
7. Launch to production
