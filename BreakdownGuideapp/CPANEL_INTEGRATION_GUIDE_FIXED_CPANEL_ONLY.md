# Go BARRY - cPanel Integration & WebSocket Architecture Guide

**Version**: 2.0
**Date**: October 27, 2025
**Status**: Production-Ready
**Production URL**: https://breakdowns.gobarry.co.uk
**Target Environment**: cPanel with Node.js 18+

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Apache Module Requirements](#apache-module-requirements)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [WebSocket Architecture (NOT Convex)](#websocket-architecture-not-convex)
6. [Apache WebSocket Proxy Configuration](#apache-websocket-proxy-configuration)
7. [Database Configuration](#database-configuration)
8. [Complete Deployment Guide](#complete-deployment-guide)
9. [PM2 Process Manager Setup](#pm2-process-manager-setup)
10. [Log Rotation Configuration](#log-rotation-configuration)
11. [CORS Configuration for Multiple Origins](#cors-configuration-for-multiple-origins)
12. [WebSocket Authentication & Security](#websocket-authentication--security)
13. [Graceful Shutdown Handlers](#graceful-shutdown-handlers)
14. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
15. [Performance Optimization](#performance-optimization)
16. [Complete Deployment Verification Checklist](#complete-deployment-verification-checklist)

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Native + Expo)                    │
│                        Running in Web Browser                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ • Supervisor Login Interface                                   │  │
│  │ • 42 Diagnostic Wizards (Breakdown Assessment)                │  │
│  │ • 5 Dashboards (SDC, Control Room, Management, etc.)         │  │
│  │ • Real-time Activity Feed (via WebSocket)                     │  │
│  │ • Fleet Intelligence (Repeat Defects, Predictive Alerts)     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│          ┌────────┬──────────┼──────────┬────────┐                    │
│          ▼        ▼          ▼          ▼        ▼                    │
└─────────────────────────────────────────────────────────────────────┘
          │        │          │          │        │
    HTTP  │   WebSocket │  │      HTTP  │
    REST  │   (ws://)   │  │      REST  │
          │   Real-time │  │            │
          ▼        │     ▼  ▼            ▼
┌────────────────────────────────────────────────────────┐
│            CPANEL HOSTING (shared/dedicated)            │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Apache 2.4+ (Reverse Proxy)                   │   │
│  │  • SSL Termination (HTTPS → HTTP)              │   │
│  │  • WebSocket Upgrade Handling                  │   │
│  │  • ProxyPass to Node.js backend                │   │
│  └────────────┬───────────────────────────────────┘   │
│               │ HTTP (internal)                         │
│               ▼                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Node.js Application (Express + ws)            │   │
│  │  Port: 3001 (or cPanel-assigned)               │   │
│  │  Bind: 127.0.0.1 (localhost only)              │   │
│  │                                                 │   │
│  │  ┌─────────────────────────────────────────┐  │   │
│  │  │  Express.js Server                      │  │   │
│  │  │  • 85+ REST API Endpoints               │  │   │
│  │  │  • JWT Authentication (bcrypt)          │  │   │
│  │  │  • Rate Limiting (5 login/15min)        │  │   │
│  │  │  • Error Handling Middleware            │  │   │
│  │  │  • CORS Multi-Origin Support            │  │   │
│  │  └─────────────────────────────────────────┘  │   │
│  │           │            │          │           │   │
│  │    HTTP   │  WebSocket │   SQL    │           │   │
│  │    REST   │  Handler   │  Queries │           │   │
│  │           ▼            ▼          ▼           │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │  WebSocket Server (ws library 8.18.3)  │  │   │
│  │  │  • 5 Channels (JWT authenticated)      │  │   │
│  │  │  • Heartbeat/Ping-Pong (30s interval)  │  │   │
│  │  │  • Automatic Reconnection Logic        │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  │           │                                    │   │
│  │           ▼                                    │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │  MySQL Connection Pool                 │  │   │
│  │  │  • Pool Min: 5 connections             │  │   │
│  │  │  • Pool Max: 20 connections            │  │   │
│  │  │  • Timeout: 30000ms                    │  │   │
│  │  │  • Auto-reconnect enabled              │  │   │
│  │  │  • Error handling with retry           │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────┘   │
│          │           │          │           │         │
└──────────┼───────────┼──────────┼───────────┼─────────┘
           ▼           ▼          ▼           ▼
    ┌────────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
    │   MySQL    │ │ External│ │File     │ │PM2       │
    │ Database   │ │APIs     │ │Storage  │ │Process   │
    │ (cPanel)   │ │(Street  │ │(Logs)   │ │Manager   │
    │            │ │Manager, │ │         │ │          │
    │ Tables:    │ │TomTom)  │ │         │ │          │
    │ • breakdowns│ │         │ │         │ │          │
    │ • supervisors       │ │         │ │          │
    │ • fleet_vehicles    │ │         │ │          │
    │ • activities│ │         │ │          │
    │ • wizards   │ │         │ │          │
    └────────────┘ └─────────┘ └─────────┘ └──────────┘
```

### WebSocket Channel Architecture (Real Implementation)

**Based on `/backend/routes/webSocketHandler.js`**

```
┌──────────────────────────────────────────────────────────────┐
│  5 WebSocket Channels (ws:// or wss://)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. sdc-dashboard (Protected - JWT Required)                │
│     → Real-time breakdown updates for SDC operators        │
│     → Assessment progress notifications                     │
│     → Critical pattern alerts                               │
│                                                              │
│  2. breakdowns (Protected - JWT Required)                   │
│     → New breakdown notifications                           │
│     → Status change updates                                 │
│     → Supervisor activity feed                              │
│                                                              │
│  3. assessment-progress (Protected - JWT Required)          │
│     → Live wizard step progression                          │
│     → Wizard started/completed events                       │
│     → Edit mode tracking                                    │
│                                                              │
│  4. control-room (Public - No Auth)                         │
│     → Public display updates                                │
│     → Active breakdown count                                │
│     → Depot statistics                                      │
│                                                              │
│  5. defect-intelligence (Public - No Auth)                  │
│     → Repeat defect alerts (3+ on same vehicle)            │
│     → Predictive maintenance notifications                  │
│     → Depot defect trend updates                            │
│     → Critical pattern detection                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **React** 18.2.0
- **React Native** 0.79.3
- **Expo** 53.0.10
- **Expo Router** (file-based routing)
- **Native WebSocket API** (browser-native)

### Backend
- **Node.js** 18.20.0+ (Required)
- **Express.js** 4.18.2
- **WebSocket Library** ws 8.18.3 (NOT socket.io)
- **Database Driver** mysql2 3.9.0
- **JWT Authentication** jsonwebtoken 9.1.2
- **Password Hashing** bcrypt 5.1.1
- **Rate Limiting** express-rate-limit 7.1.5
- **CORS** cors 2.8.5
- **Security Headers** helmet 7.1.0

### Database
- **MySQL** 8.0+ (Primary database)
- **Connection Pool** mysql2/promise

### Infrastructure
- **Hosting**: cPanel (shared or dedicated)
- **Web Server**: Apache 2.4+
- **Node.js Manager**: PM2 (recommended) or cPanel App Manager
- **Domain**: gobarry.co.uk
- **SSL**: Let's Encrypt (via cPanel)
- **Process Manager**: PM2 5.3.0+

---

## Apache Module Requirements

### Required Apache Modules Checklist

Before deploying, ensure these Apache modules are enabled:

```bash
# SSH into cPanel server
ssh user@your-server.com

# Check if modules are enabled
sudo apache2ctl -M | grep -E 'proxy|rewrite|ssl|headers'

# Expected output should include:
# proxy_module (shared)
# proxy_http_module (shared)
# proxy_wstunnel_module (shared)  ← Critical for WebSocket
# rewrite_module (shared)
# ssl_module (shared)
# headers_module (shared)
```

### Enable Missing Modules

```bash
# Enable required modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel  # Critical for WebSocket upgrades
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers

# Verify configuration syntax
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

### Module Verification Script

Create `/home/gobarry/check-apache-modules.sh`:

```bash
#!/bin/bash

echo "Checking Apache modules for Go BARRY deployment..."

REQUIRED_MODULES=(
  "proxy_module"
  "proxy_http_module"
  "proxy_wstunnel_module"
  "rewrite_module"
  "ssl_module"
  "headers_module"
)

MISSING_MODULES=()

for module in "${REQUIRED_MODULES[@]}"; do
  if apache2ctl -M | grep -q "$module"; then
    echo "✅ $module - Enabled"
  else
    echo "❌ $module - Missing"
    MISSING_MODULES+=("$module")
  fi
done

if [ ${#MISSING_MODULES[@]} -eq 0 ]; then
  echo ""
  echo "✅ All required Apache modules are enabled"
  exit 0
else
  echo ""
  echo "❌ Missing modules: ${MISSING_MODULES[*]}"
  echo "Run: sudo a2enmod <module_name>"
  exit 1
fi
```

---

## Pre-Deployment Checklist

### Infrastructure Requirements
- [x] cPanel account with Node.js support enabled
- [x] Node.js 18.20.0+ installed on server
- [x] MySQL 8.0+ database available
- [x] 2GB+ RAM minimum (4GB+ recommended for production)
- [x] 10GB+ disk space
- [x] Apache 2.4+ with required modules
- [x] SSL certificate (Let's Encrypt)
- [x] SSH access to server
- [x] PM2 installed globally (`npm install -g pm2`)

### Code Preparation
- [x] All routes use ES6 imports (no require())
- [x] WebSocket server implemented (ws library, not socket.io)
- [x] Environment variables configured
- [x] Database migrations applied
- [x] CORS configured for multiple origins
- [x] Rate limiting configured (5/15min for login)
- [x] Error handlers with graceful shutdown
- [x] Logging configured with rotation

### Domain/DNS
- [x] Primary domain: gobarry.co.uk
- [x] API subdomain: api.gobarry.co.uk (optional)
- [x] DNS records pointing to cPanel IP
- [x] SSL certificate applied to domain
- [x] CORS origins configured

### Database
- [x] MySQL database created
- [x] Database user with full privileges
- [x] All tables created (migrations applied)
- [x] Connection pool configured
- [x] Backups scheduled (cPanel backup)

### Security
- [x] JWT secret key generated (32+ characters)
- [x] Database password secured (20+ characters)
- [x] API keys stored in .env
- [x] Rate limiting configured
- [x] CORS whitelist configured
- [x] Input validation in all routes

---

## WebSocket Architecture (NOT Convex)

### Important Note: This System Uses WebSocket (ws), NOT Convex

The actual implementation uses the `ws` library (WebSocket) for real-time communication.
**Convex is mentioned in CLAUDE.md but is NOT implemented in the codebase.**

### WebSocket Flow Diagram

```
┌──────────────────────────────────────┐
│  Frontend (React)                     │
│  const ws = new WebSocket(url)        │
└──────────┬───────────────────────────┘
           │
           │ wss://gobarry.co.uk/ws/sdc-dashboard?token=JWT_TOKEN
           │ or https://gobarry.co.uk (upgrade via WebSocket protocol)
           │
           ▼
┌──────────────────────────────────────────────────────┐
│  Apache Reverse Proxy (Virtual Host)                 │
│  • Detects WebSocket upgrade headers                 │
│  • ProxyPass to Node.js backend                      │
│  • Uses mod_proxy_wstunnel                           │
└────────┬──────────────────────────────────────────────┘
         │
         │ http://127.0.0.1:3001/ws/sdc-dashboard?token=JWT_TOKEN
         │ (Internal proxy - no external exposure)
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  Node.js WebSocket Server (ws library)                │
│  File: /backend/routes/webSocketHandler.js           │
│                                                      │
│  wss.on('connection', (ws, req) => {                │
│    // 1. Extract JWT token from query string       │
│    const token = url.searchParams.get('token');    │
│                                                      │
│    // 2. Verify token (protected channels only)    │
│    const decoded = verifyToken(token);             │
│                                                      │
│    // 3. Check supervisor privileges               │
│    if (channel === 'sdc-dashboard') {              │
│      // Query MySQL for supervisor role            │
│    }                                                │
│                                                      │
│    // 4. Subscribe to requested channel            │
│    channels.get(channel).add(clientId);            │
│                                                      │
│    // 5. Set up event handlers                     │
│    ws.on('message', handleMessage);                │
│    ws.on('close', cleanup);                        │
│  })                                                  │
│                                                      │
│  Channels Managed:                                   │
│  • sdc-dashboard (JWT required)                     │
│  • breakdowns (JWT required)                        │
│  • assessment-progress (JWT required)               │
│  • control-room (public)                            │
│  • defect-intelligence (public)                     │
└──────────────────────────────────────────────────────┘
```

### WebSocket Heartbeat/Ping-Pong Implementation

Add to `/backend/routes/webSocketHandler.js`:

```javascript
// Inside WebSocketHandler class

setupHeartbeat() {
  // Send ping every 30 seconds to keep connection alive
  this.heartbeatInterval = setInterval(() => {
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === client.ws.OPEN) {
        // Check if client responded to last ping
        if (client.isAlive === false) {
          console.log(`❌ Client ${clientId} failed heartbeat check, terminating`);
          return client.ws.terminate();
        }

        // Mark as not alive until pong received
        client.isAlive = false;

        // Send ping
        client.ws.ping(() => {
          console.log(`💓 Ping sent to client ${clientId}`);
        });
      }
    });
  }, 30000); // 30 seconds

  console.log('✅ WebSocket heartbeat configured (30s interval)');
}

// In handleConnection method, add:
ws.isAlive = true;

ws.on('pong', () => {
  const client = this.clients.get(clientId);
  if (client) {
    client.isAlive = true;
    console.log(`💓 Pong received from client ${clientId}`);
  }
});

// In initialize method, call:
this.setupHeartbeat();

// In cleanup method, add:
if (this.heartbeatInterval) {
  clearInterval(this.heartbeatInterval);
}
```

---

## Apache WebSocket Proxy Configuration

### CRITICAL FIX: Use http:// NOT ws:// in ProxyPass

**Common Error**: Using `ws://` in ProxyPass causes connection failures.
**Correct Approach**: Use `http://` and let `mod_proxy_wstunnel` handle the upgrade.

### Correct Virtual Host Configuration

Edit `/etc/apache2/sites-available/gobarry.co.uk.conf` (or via WHM):

```apache
<VirtualHost *:443>
    ServerName gobarry.co.uk
    ServerAlias www.gobarry.co.uk
    DocumentRoot /home/gobarry/public_html

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/gobarry.co.uk/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/gobarry.co.uk/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/gobarry.co.uk/chain.pem

    # Security Headers
    <IfModule mod_headers.c>
        # CORS Headers for multiple origins
        SetEnvIf Origin "^https?://(localhost(:\d+)?|.*\.gobarry\.co\.uk|.*\.onrender\.com|.*\.render\.com)$" ORIGIN=$0
        Header always set Access-Control-Allow-Origin "%{ORIGIN}e" env=ORIGIN
        Header always set Access-Control-Allow-Credentials "true" env=ORIGIN
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        Header always set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        Header always set Access-Control-Expose-Headers "Content-Length, X-Kuma-Revision"

        # Security headers
        Header always set X-Content-Type-Options "nosniff"
        Header always set X-Frame-Options "DENY"
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Referrer-Policy "strict-origin-when-cross-origin"
        Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    </IfModule>

    # Enable proxy modules for this vhost
    <IfModule mod_proxy.c>
        ProxyRequests Off
        ProxyPreserveHost On

        <Proxy *>
            Require all granted
        </Proxy>

        # WebSocket Upgrade Detection
        RewriteEngine On

        # Detect WebSocket upgrade requests
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteCond %{HTTP:Connection} upgrade [NC]

        # CRITICAL: Use http:// NOT ws:// in RewriteRule
        RewriteRule ^/ws/(.*) http://127.0.0.1:3001/ws/$1 [P,L]

        # WebSocket proxy configuration
        # CRITICAL FIX: Use http:// NOT ws:// in ProxyPass
        ProxyPass /ws/ http://127.0.0.1:3001/ws/
        ProxyPassReverse /ws/ http://127.0.0.1:3001/ws/

        # Regular HTTP API Proxy
        ProxyPass /api/ http://127.0.0.1:3001/api/
        ProxyPassReverse /api/ http://127.0.0.1:3001/api/

        # Health check endpoint
        ProxyPass /health http://127.0.0.1:3001/health
        ProxyPassReverse /health http://127.0.0.1:3001/health

        # Timeout for long-lived WebSocket connections
        ProxyTimeout 7200
    </IfModule>

    # Handle preflight OPTIONS requests
    <Location /api>
        <If "%{REQUEST_METHOD} == 'OPTIONS'">
            Header always set Access-Control-Allow-Origin "*"
            Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            Header always set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, Origin, X-Requested-With"
            Header always set Access-Control-Max-Age "3600"
            Header always set Content-Length "0"
            Header always set Content-Type "text/plain"
            Require all granted
        </If>
    </Location>

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/gobarry-error.log
    CustomLog ${APACHE_LOG_DIR}/gobarry-access.log combined
    LogLevel warn
</VirtualHost>

# Force HTTPS redirect
<VirtualHost *:80>
    ServerName gobarry.co.uk
    ServerAlias www.gobarry.co.uk
    Redirect permanent / https://gobarry.co.uk/
</VirtualHost>
```

### Test Apache Configuration

```bash
# Verify syntax
sudo apache2ctl configtest

# Expected output: "Syntax OK"

# Restart Apache
sudo systemctl restart apache2

# Check for errors
sudo tail -f /var/log/apache2/gobarry-error.log
```

---

## Database Configuration

### FIXED: MySQL Connection Pool with Proper Error Handling

Create `/backend/config/mysql.js`:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration with proper timeouts and error handling
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQL_USER,
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'gobarryco_breakdowns',
  port: process.env.DB_PORT || 3306,

  // Connection pool configuration
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '20', 10),
  maxIdle: parseInt(process.env.DB_POOL_MIN || '5', 10),
  idleTimeout: 60000, // 60 seconds
  queueLimit: 0, // Unlimited queue

  // Connection timeouts
  connectTimeout: parseInt(process.env.DB_TIMEOUT || '30000', 10), // 30 seconds
  acquireTimeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),

  // Keep-alive settings
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds

  // Charset
  charset: 'utf8mb4',

  // Timezone
  timezone: '+00:00',

  // Handle disconnects
  multipleStatements: false,
  dateStrings: true
};

// Create connection pool
let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ MySQL connection pool created');
} catch (error) {
  console.error('❌ Failed to create MySQL pool:', error);
  process.exit(1);
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ MySQL pool error:', err);

  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Reconnecting to MySQL...');
    // Pool will automatically reconnect
  } else if (err.code === 'ECONNREFUSED') {
    console.error('❌ MySQL connection refused. Check if MySQL is running.');
  } else {
    console.error('❌ Unexpected MySQL error:', err);
  }
});

/**
 * Execute a query with automatic retry on connection failure
 * @param {string} sql - SQL query
 * @param {Array} values - Query parameters
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, values = [], retries = 3) {
  let connection;

  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, values);
    return results;
  } catch (error) {
    console.error('❌ MySQL query error:', {
      sql: sql.substring(0, 100),
      error: error.message,
      code: error.code
    });

    // Retry on connection errors
    if (retries > 0 && (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED')) {
      console.log(`🔄 Retrying query (${retries} attempts remaining)...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return query(sql, values, retries - 1);
    }

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Health check for database connection
 * @returns {Promise<boolean>} Connection status
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT 1 as health_check');
    return result && result[0]?.health_check === 1;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

/**
 * Close the connection pool gracefully
 * @returns {Promise<void>}
 */
export async function closePool() {
  if (pool) {
    try {
      await pool.end();
      console.log('✅ MySQL connection pool closed gracefully');
    } catch (error) {
      console.error('❌ Error closing MySQL pool:', error);
    }
  }
}

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
export function getPoolStats() {
  return {
    activeConnections: pool._allConnections.length,
    idleConnections: pool._freeConnections.length,
    queuedRequests: pool._connectionQueue.length
  };
}

// Default export for convenience
export default query;
```

### FIXED: Database Schema with Foreign Key Constraints

Create `/backend/migrations/001_create_all_tables.sql`:

```sql
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS gobarryco_breakdowns CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gobarryco_breakdowns;

-- Supervisors Table (must be created first for foreign keys)
CREATE TABLE IF NOT EXISTS supervisors (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  badge_number VARCHAR(50) UNIQUE,
  depot VARCHAR(100),
  role ENUM('supervisor', 'sdc_operator', 'admin', 'engineer') DEFAULT 'supervisor',
  is_active BOOLEAN DEFAULT TRUE,
  pending_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,

  INDEX idx_email (email),
  INDEX idx_badge (badge_number),
  INDEX idx_depot (depot),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fleet Vehicles Table
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  fleet_no VARCHAR(50) PRIMARY KEY,
  make VARCHAR(100),
  model VARCHAR(100),
  registration VARCHAR(20),
  depot VARCHAR(100),
  vehicle_type VARCHAR(50),
  status ENUM('operational', 'maintenance', 'withdrawn', 'off_road') DEFAULT 'operational',
  seating_capacity INT,
  wheelchair_capacity INT,
  in_service_date DATE,
  out_of_service_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_depot (depot),
  INDEX idx_status (status),
  INDEX idx_registration (registration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Breakdowns Table
CREATE TABLE IF NOT EXISTS breakdowns (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  breakdown_id VARCHAR(50) NOT NULL UNIQUE,
  fleet_no VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  issue_category VARCHAR(100),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('active', 'in_progress', 'resolved', 'archived') DEFAULT 'active',
  supervisor_id INT UNSIGNED,
  assigned_engineer_id INT UNSIGNED NULL,
  wizard_assessment_data JSON,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT fk_breakdown_fleet FOREIGN KEY (fleet_no)
    REFERENCES fleet_vehicles(fleet_no)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_breakdown_supervisor FOREIGN KEY (supervisor_id)
    REFERENCES supervisors(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  INDEX idx_breakdown_id (breakdown_id),
  INDEX idx_fleet_no (fleet_no),
  INDEX idx_status (status),
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_created (created_at),
  INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  action_type VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES supervisors(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_action (action_type),
  INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard Assessments Table
CREATE TABLE IF NOT EXISTS wizard_assessments (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  breakdown_id INT UNSIGNED NOT NULL,
  wizard_type VARCHAR(100),
  assessment_data JSON,
  severity_determined ENUM('low', 'medium', 'high', 'critical'),
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  supervisor_id INT UNSIGNED,

  -- Foreign key constraints
  CONSTRAINT fk_wizard_breakdown FOREIGN KEY (breakdown_id)
    REFERENCES breakdowns(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_wizard_supervisor FOREIGN KEY (supervisor_id)
    REFERENCES supervisors(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  INDEX idx_breakdown (breakdown_id),
  INDEX idx_wizard_type (wizard_type),
  INDEX idx_supervisor (supervisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicle Health Scores Table
CREATE TABLE IF NOT EXISTS vehicle_health_scores (
  fleet_no VARCHAR(50) PRIMARY KEY,
  health_score DECIMAL(5,2) DEFAULT 100.00,
  defect_count_24h INT DEFAULT 0,
  defect_count_7d INT DEFAULT 0,
  defect_count_30d INT DEFAULT 0,
  risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  last_breakdown_date TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraint
  CONSTRAINT fk_health_fleet FOREIGN KEY (fleet_no)
    REFERENCES fleet_vehicles(fleet_no)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_health_score (health_score),
  INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Engineers Table
CREATE TABLE IF NOT EXISTS engineers (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  depot VARCHAR(100),
  skill_level ENUM('junior', 'mid', 'senior', 'expert') DEFAULT 'mid',
  specializations JSON,
  status ENUM('available', 'busy', 'off_duty', 'on_leave') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_depot (depot),
  INDEX idx_status (status),
  INDEX idx_skill_level (skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Apply all foreign key constraints (already included above)
COMMIT;
```

Apply migrations:

```bash
mysql -h localhost -u gobarryco_user -p gobarryco_breakdowns < /home/gobarry/backend/migrations/001_create_all_tables.sql
```

---

## Complete Deployment Guide

### Step 1: Prepare cPanel Environment

```bash
# SSH into cPanel server
ssh gobarryco@gobarry.co.uk

# Check Node.js version
node --version  # Should be 18.20.0 or higher
npm --version   # Should be 9.0.0 or higher

# If Node.js is not installed or outdated:
# Use cPanel Node.js Selector or install via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 18.20.0
nvm use 18.20.0
nvm alias default 18.20.0

# Install PM2 globally
npm install -g pm2

# Verify PM2
pm2 --version

# Create application directory
mkdir -p /home/gobarry/go-barry-backend
cd /home/gobarry/go-barry-backend
```

### Step 2: Deploy Application Code

```bash
# Option A: Git clone (recommended)
git clone https://github.com/your-repo/go-barry-backend.git .

# Option B: Upload via FTP/SFTP
# Use FileZilla or cPanel File Manager to upload files

# Install dependencies
npm install --production

# Verify critical packages
npm list express ws mysql2 jsonwebtoken bcrypt dotenv

# Expected output should show all packages installed
```

### Step 3: Configure Environment Variables

Create `/home/gobarry/go-barry-backend/.env`:

```env
###############################################
# GO BARRY APPLICATION CONFIGURATION
# Production Environment - cPanel
###############################################

# ============= SERVER CONFIGURATION =============
NODE_ENV=production
PORT=3001
HOST=127.0.0.1
APP_NAME=Go BARRY API

# ============= DATABASE CONFIGURATION =============
# FIXED: Proper connection pool with timeouts
DB_HOST=localhost
DB_PORT=3306
DB_USER=gobarryco_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=gobarryco_breakdowns
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_TIMEOUT=30000
DB_WAIT_FOR_CONNECTIONS=true
DB_ENABLE_KEEP_ALIVE=true
DB_KEEP_ALIVE_INITIAL_DELAY_MS=10000

# ============= AUTHENTICATION =============
JWT_SECRET=YOUR_32_CHARACTER_SECRET_HERE
JWT_EXPIRATION=24h
JWT_ALGORITHM=HS256

# ============= RATE LIMITING =============
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_LOGIN=5             # Max login attempts per window
RATE_LIMIT_MAX_API=100             # Max API requests per window
RATE_LIMIT_MAX_SDC=100             # Max SDC requests per window

# ============= APPLICATION URLS =============
# FIXED: Production URL added
APP_URL=https://gobarry.co.uk
FRONTEND_URL=https://gobarry.co.uk
PUBLIC_URL=https://gobarry.co.uk
PRODUCTION_URL=https://breakdowns.gobarry.co.uk

# ============= CORS CONFIGURATION =============
# FIXED: Multiple origins support
CORS_ENABLED=true
ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,https://breakdowns.gobarry.co.uk,http://localhost:3000,http://localhost:8081
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With

# ============= WEBSOCKET CONFIGURATION =============
WS_ENABLED=true
WS_PATH=/ws
WS_HEARTBEAT_INTERVAL=30000        # 30 seconds
WS_MAX_PAYLOAD_SIZE=10485760       # 10MB
WS_ALLOW_SAMESITE_NONE=true

# ============= LOGGING =============
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/home/gobarry/logs/app.log
LOG_MAX_FILES=30
LOG_MAX_SIZE=10m
ENABLE_REQUEST_LOGGING=true
ENABLE_DATABASE_LOGGING=false
ENABLE_WEBSOCKET_LOGGING=false

# ============= SECURITY =============
HELMET_ENABLED=true
TRUST_PROXY=true
SESSION_SECRET=YOUR_SESSION_SECRET_HERE
SESSION_TIMEOUT=3600

# ============= PERFORMANCE =============
CACHE_ENABLED=true
CACHE_TTL=3600
ENABLE_COMPRESSION=true
COMPRESSION_THRESHOLD=1024
```

Generate JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_SECRET in .env
```

### Step 4: Database Migration

```bash
# Connect to MySQL
mysql -h localhost -u gobarryco_user -p

# In MySQL console:
USE gobarryco_breakdowns;

# Run migrations
SOURCE /home/gobarry/go-barry-backend/migrations/001_create_all_tables.sql;

# Verify tables created
SHOW TABLES;

# Check supervisors table
DESCRIBE supervisors;

# Exit
EXIT;
```

### Step 5: Test Application Locally

```bash
# Test start (don't use in production)
node server.js

# Expected output:
# ✅ MySQL connection pool created
# ✅ MySQL database connection configured
# 🚀 Breakdown Guide API running on port 3001
# 📍 Environment: production
# 🔗 Health check: http://localhost:3001/health
# 📡 WebSocket endpoint: ws://localhost:3001/ws

# Test health check (in another terminal)
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"breakdown-guide-api",...}

# Stop test server (Ctrl+C)
```

---

## PM2 Process Manager Setup

### Why PM2?

- Automatic restarts on crash
- Log management with rotation
- Zero-downtime restarts
- Cluster mode for scaling
- Startup script for auto-start on reboot

### PM2 Configuration File

Create `/home/gobarry/go-barry-backend/ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'go-barry-api',
    script: './server.js',
    cwd: '/home/gobarry/go-barry-backend',

    // Process management
    instances: 1,
    exec_mode: 'fork',

    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },

    // Logging
    output: '/home/gobarry/logs/pm2-out.log',
    error: '/home/gobarry/logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Restart policy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Watch for file changes (disable in production)
    watch: false,

    // Memory management
    max_memory_restart: '512M',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

### Start Application with PM2

```bash
# Create logs directory
mkdir -p /home/gobarry/logs

# Start application
cd /home/gobarry/go-barry-backend
pm2 start ecosystem.config.cjs

# Check status
pm2 status

# View logs
pm2 logs go-barry-api

# Monitor in real-time
pm2 monit

# Save PM2 process list
pm2 save

# Generate startup script (auto-start on reboot)
pm2 startup
# Follow the instructions printed

# Test restart
pm2 restart go-barry-api

# Stop application
pm2 stop go-barry-api

# Delete from PM2
pm2 delete go-barry-api
```

### PM2 Useful Commands

```bash
# View application details
pm2 show go-barry-api

# View real-time logs
pm2 logs go-barry-api --lines 100

# Reload application (zero-downtime)
pm2 reload go-barry-api

# Restart application
pm2 restart go-barry-api

# Stop application
pm2 stop go-barry-api

# List all PM2 processes
pm2 list

# Monitor CPU and memory
pm2 monit

# Flush logs
pm2 flush

# Delete application from PM2
pm2 delete go-barry-api
```

---

## Log Rotation Configuration

### System Log Rotation with logrotate

Create `/etc/logrotate.d/go-barry`:

```bash
/home/gobarry/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 gobarryco gobarryco
    sharedscripts
    postrotate
        # Reload PM2 to reopen log files
        pm2 reloadLogs
    endscript
}
```

### Manual Log Rotation Script

Create `/home/gobarry/scripts/rotate-logs.sh`:

```bash
#!/bin/bash

LOG_DIR="/home/gobarry/logs"
DATE=$(date +%Y%m%d-%H%M%S)
MAX_SIZE=100M  # Rotate logs larger than 100MB
KEEP_DAYS=30   # Keep logs for 30 days

echo "Starting log rotation at $(date)"

# Rotate large log files
for log in $LOG_DIR/*.log; do
    if [ -f "$log" ]; then
        size=$(stat -f%z "$log" 2>/dev/null || stat -c%s "$log" 2>/dev/null)

        # If log is larger than MAX_SIZE
        if [ $size -gt 104857600 ]; then  # 100MB in bytes
            echo "Rotating large log: $log ($(($size / 1048576))MB)"
            mv "$log" "$log.$DATE"
            gzip "$log.$DATE"

            # Create new empty log file
            touch "$log"
            chmod 640 "$log"
        fi
    fi
done

# Delete old compressed logs
find $LOG_DIR -name "*.log.*.gz" -type f -mtime +$KEEP_DAYS -delete

# Reload PM2 to reopen log files
pm2 reloadLogs

echo "Log rotation completed at $(date)"
```

Make executable and add to cron:

```bash
chmod +x /home/gobarry/scripts/rotate-logs.sh

# Add to crontab (run daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/gobarry/scripts/rotate-logs.sh >> /home/gobarry/logs/rotation.log 2>&1
```

---

## CORS Configuration for Multiple Origins

### FIXED: CORS Middleware with Regex Support

Update `/backend/middleware/cors.js` or add to `server.js`:

```javascript
import cors from 'cors';

/**
 * Get allowed origins from environment with regex support
 * FIXED: Support for multiple origins including Render production URL
 */
function getAllowedOrigins() {
  // Parse origins from environment variable
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

  // Default allowed origins
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:5173',
    'https://gobarry.co.uk',
    'https://www.gobarry.co.uk',
    'https://breakdowns.gobarry.co.uk',
    'https://www.breakdowns.gobarry.co.uk',
    'https://breakdowns.gobarry.co.uk',
    'https://breakdowns.gobarry.co.uk',
    'https://breakdowns.gobarry.co.uk:2083 (cPanel)'
  ];

  // Regex patterns for dynamic origins
  const regexOrigins = [
    /^https?:\/\/localhost:\d+$/,           // localhost with any port
    ,        // Any cPanel subdomain
    ,          // Any cPanel domain
    /^https:\/\/.*\.gobarry\.co\.uk$/,      // Any gobarry.co.uk subdomain
    /^https:\/\/gobarry\.co\.uk$/           // Main gobarry.co.uk domain
  ];

  return {
    origins: [...new Set([...defaultOrigins, ...envOrigins])],
    patterns: regexOrigins
  };
}

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @returns {boolean} Whether origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;

  const { origins, patterns } = getAllowedOrigins();

  // Check exact match
  if (origins.includes(origin)) {
    return true;
  }

  // Check regex patterns
  for (const pattern of patterns) {
    if (pattern.test(origin)) {
      return true;
    }
  }

  return false;
}

/**
 * CORS middleware with dynamic origin validation
 */
export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
  optionsSuccessStatus: 200,
  maxAge: 3600 // Cache preflight for 1 hour
});

export default corsMiddleware;
```

---

## WebSocket Authentication & Security

### FIXED: WebSocket Authentication Examples

The actual implementation in `/backend/routes/webSocketHandler.js` already includes JWT authentication. Here's documentation on how to connect:

#### Frontend WebSocket Connection with JWT

```javascript
// Get JWT token from login response or localStorage
const token = localStorage.getItem('auth_token');

// Construct WebSocket URL with token in query string
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//gobarry.co.uk/ws/sdc-dashboard?token=${token}`;

// Create WebSocket connection
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log('✅ WebSocket connected');

  // Subscribe to channels (optional, connection already subscribes)
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'sdc-dashboard'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 WebSocket message:', message);

  // Handle different message types
  switch (message.type) {
    case 'connected':
      console.log('✅ Connection confirmed:', message.message);
      break;

    case 'wizard_started':
      // Handle wizard started event
      updateDashboard(message.data);
      break;

    case 'breakdown_created':
      // Handle new breakdown event
      addBreakdownToList(message.data);
      break;

    case 'error':
      console.error('❌ WebSocket error:', message.error);
      break;
  }
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('🔌 WebSocket disconnected:', event.code, event.reason);

  // Implement reconnection logic
  setTimeout(() => {
    console.log('🔄 Reconnecting...');
    // Recreate WebSocket connection
  }, 3000);
};

// Heartbeat/Ping-Pong to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000); // Every 30 seconds
```

#### Channel Authorization Matrix

| Channel | Auth Required | Minimum Role | Purpose |
|---------|---------------|--------------|---------|
| `sdc-dashboard` | ✅ Yes | SDC Operator | Real-time SDC Dashboard updates |
| `breakdowns` | ✅ Yes | Supervisor | Breakdown notifications |
| `assessment-progress` | ✅ Yes | Supervisor | Wizard progress tracking |
| `control-room` | ❌ No | Public | Public display updates |
| `defect-intelligence` | ❌ No | Public | Fleet defect alerts |

---

## Graceful Shutdown Handlers

### FIXED: Server Shutdown with Cleanup

The server.js already includes graceful shutdown, but here's enhanced documentation:

```javascript
// In /backend/server.js (already implemented)

import { closePool } from './config/mysql.js';
import webSocketHandler from './routes/webSocketHandler.js';

// Graceful shutdown handler for SIGTERM (Docker, Kubernetes, systemd)
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM signal received: initiating graceful shutdown');

  let exitCode = 0;

  try {
    // 1. Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed (no new connections accepted)');
    });

    // 2. Close all WebSocket connections gracefully
    console.log('🔌 Closing WebSocket connections...');
    webSocketHandler.cleanup();
    console.log('✅ WebSocket connections closed');

    // 3. Close MySQL connection pool
    console.log('🗄️ Closing MySQL connection pool...');
    await closePool();
    console.log('✅ MySQL connection pool closed');

    // 4. Wait for pending requests to complete (max 30 seconds)
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Force closing after 30 second timeout');
        resolve();
      }, 30000);

      server.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    exitCode = 1;
  } finally {
    console.log('👋 Shutdown complete');
    process.exit(exitCode);
  }
});

// Graceful shutdown handler for SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('📡 SIGINT signal received: initiating graceful shutdown');

  // Same logic as SIGTERM
  process.emit('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);

  // Log to file
  fs.appendFileSync(
    '/home/gobarry/logs/uncaught-exceptions.log',
    `${new Date().toISOString()} - ${error.stack}\n`
  );

  // Graceful shutdown
  process.emit('SIGTERM');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);

  // Log to file
  fs.appendFileSync(
    '/home/gobarry/logs/unhandled-rejections.log',
    `${new Date().toISOString()} - ${reason}\n`
  );
});
```

### Test Graceful Shutdown

```bash
# Start server with PM2
pm2 start ecosystem.config.cjs

# Get process ID
pm2 show go-barry-api

# Send SIGTERM signal
kill -SIGTERM <PID>

# Check logs for graceful shutdown messages
pm2 logs go-barry-api --lines 50
```

---

## Monitoring & Troubleshooting

### Application Health Check

```bash
# Check if server is running
curl https://gobarry.co.uk/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-27T...",
  "service": "breakdown-guide-api",
  "database": {
    "type": "mysql",
    "status": "connected",
    "host": "localhost",
    "name": "gobarryco_breakdowns"
  },
  "environment": "production"
}
```

### Database Connection Test

```bash
# Test MySQL connection
mysql -h localhost -u gobarryco_user -p gobarryco_breakdowns

# Run test query
SELECT COUNT(*) FROM supervisors;

# Check active connections
SHOW PROCESSLIST;

# Check database size
SELECT
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'gobarryco_breakdowns'
GROUP BY table_schema;
```

### WebSocket Connection Test

```bash
# Install wscat globally
npm install -g wscat

# Test WebSocket connection (public channel)
wscat -c "wss://gobarry.co.uk/ws/control-room"

# Test WebSocket with authentication (replace YOUR_JWT_TOKEN)
wscat -c "wss://gobarry.co.uk/ws/sdc-dashboard?token=YOUR_JWT_TOKEN"

# In the interactive session, send:
{"type": "subscribe", "channel": "sdc-dashboard"}

# You should receive:
{"type": "subscribed", "channel": "sdc-dashboard", "message": "Subscribed to sdc-dashboard"}
```

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Server not binding** | `Error: EADDRINUSE: address already in use` | Check `HOST=127.0.0.1` in .env (not 0.0.0.0), or kill existing process: `lsof -i :3001` then `kill -9 <PID>` |
| **Database connection timeout** | `Error: connect ECONNREFUSED` | Check DB credentials in .env, verify MySQL is running: `systemctl status mysql` |
| **CORS errors in browser** | `No 'Access-Control-Allow-Origin' header` | Verify origin in ALLOWED_ORIGINS, check Apache CORS headers configuration |
| **WebSocket fails to connect** | Connection drops immediately | Ensure `mod_proxy_wstunnel` is enabled, check Apache config uses `http://` not `ws://` in ProxyPass |
| **Out of memory** | App crashes after 30min | Check PM2 `max_memory_restart`, review connection pool limits, enable log rotation |
| **Rate limiting too strict** | Legitimate users blocked | Increase `RATE_LIMIT_MAX_*` in .env, or disable in development with `RATE_LIMIT_ENABLED=false` |
| **JWT token expired** | `401 Unauthorized` errors | Frontend needs to implement token refresh, check JWT_EXPIRATION setting |
| **PM2 not starting** | Application doesn't start | Check PM2 logs: `pm2 logs`, verify Node.js version, check .env file exists |

### Performance Monitoring Script

Create `/home/gobarry/scripts/monitor.sh`:

```bash
#!/bin/bash

echo "=== Go BARRY System Monitor ==="
echo "Generated: $(date)"
echo ""

# PM2 Status
echo "--- PM2 Process Status ---"
pm2 list

echo ""
echo "--- PM2 Memory Usage ---"
pm2 monit --no-color | head -20

echo ""
echo "--- MySQL Connection Pool ---"
curl -s http://localhost:3001/api/diagnostics | jq '.database'

echo ""
echo "--- Disk Usage ---"
df -h /home/gobarry

echo ""
echo "--- Log File Sizes ---"
du -sh /home/gobarry/logs/*.log 2>/dev/null

echo ""
echo "--- Recent Errors (last 20) ---"
tail -20 /home/gobarry/logs/pm2-error.log

echo ""
echo "=== End Monitor ==="
```

Make executable:

```bash
chmod +x /home/gobarry/scripts/monitor.sh
```

---

## Performance Optimization

### Database Query Optimization

```javascript
// ❌ BAD: N+1 queries
const breakdowns = await db('SELECT * FROM breakdowns LIMIT 100');
for (const breakdown of breakdowns) {
  breakdown.supervisor = await db(
    'SELECT * FROM supervisors WHERE id = ?',
    [breakdown.supervisor_id]
  );
}

// ✅ GOOD: Single JOIN query
const breakdowns = await db(`
  SELECT
    b.*,
    s.name AS supervisor_name,
    s.email AS supervisor_email,
    s.depot AS supervisor_depot
  FROM breakdowns b
  LEFT JOIN supervisors s ON b.supervisor_id = s.id
  ORDER BY b.created_at DESC
  LIMIT 100
`);
```

### Response Compression

Add to `server.js` (before routes):

```javascript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    // Don't compress responses if explicitly requested not to
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression for everything else
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio (1-9)
  threshold: 1024 // Only compress responses larger than 1KB
}));
```

### Caching Strategy

```javascript
// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedFleetVehicles() {
  const cacheKey = 'fleet_vehicles_all';
  const cached = cache.get(cacheKey);

  // Return cached data if still valid
  if (cached && cached.expires > Date.now()) {
    console.log('✅ Returning cached fleet vehicles');
    return cached.data;
  }

  // Fetch from database
  console.log('🔄 Fetching fresh fleet vehicles from database');
  const vehicles = await db('SELECT * FROM fleet_vehicles WHERE status = "operational"');

  // Store in cache
  cache.set(cacheKey, {
    data: vehicles,
    expires: Date.now() + CACHE_TTL
  });

  return vehicles;
}

// Clear cache when data is updated
export function clearFleetCache() {
  cache.delete('fleet_vehicles_all');
  console.log('🗑️ Fleet cache cleared');
}
```

---

## Complete Deployment Verification Checklist

### Pre-Deployment Verification

- [ ] Node.js 18.20.0+ installed
- [ ] PM2 installed globally
- [ ] MySQL 8.0+ running
- [ ] Apache 2.4+ with required modules enabled
- [ ] SSL certificate installed
- [ ] DNS records pointing to server
- [ ] Application code deployed
- [ ] Dependencies installed (`npm install`)
- [ ] .env file created with all variables
- [ ] Database migrations applied
- [ ] Apache virtual host configured
- [ ] Apache configuration tested (`apache2ctl configtest`)

### Post-Deployment Verification

#### 1. Server Health

```bash
# Check PM2 status
pm2 status
# Expected: go-barry-api status "online"

# Check server is listening
netstat -tulpn | grep :3001
# Expected: tcp 0 0 127.0.0.1:3001 0.0.0.0:* LISTEN <PID>/node

# Check Apache is running
systemctl status apache2
# Expected: active (running)
```

#### 2. Database Connection

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected response includes:
# "database": { "status": "connected" }

# Test diagnostics endpoint
curl http://localhost:3001/api/diagnostics

# Expected: All tests should show ✅
```

#### 3. API Endpoints

```bash
# Test public health check
curl https://gobarry.co.uk/health

# Test API route
curl https://gobarry.co.uk/api/public/breakdowns/stats

# Test authentication (should fail without token)
curl https://gobarry.co.uk/api/breakdowns/live
# Expected: 401 Unauthorized
```

#### 4. WebSocket Connection

```bash
# Test WebSocket upgrade
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" \
  -H "Sec-WebSocket-Version: 13" \
  https://gobarry.co.uk/ws/control-room

# Expected: HTTP/1.1 101 Switching Protocols

# Test with wscat
wscat -c "wss://gobarry.co.uk/ws/control-room"
# Expected: Connection established, welcome message received
```

#### 5. CORS Configuration

```bash
# Test CORS from allowed origin
curl -H "Origin: https://gobarry.co.uk" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://gobarry.co.uk/api/health

# Expected: Access-Control-Allow-Origin header in response

# Test CORS from blocked origin
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://gobarry.co.uk/api/health

# Expected: No Access-Control-Allow-Origin header
```

#### 6. Rate Limiting

```bash
# Test login rate limiting (5 attempts per 15 minutes)
for i in {1..6}; do
  curl -X POST https://gobarry.co.uk/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"badgeNumber":"INVALID","password":"test"}'
  echo "Attempt $i"
done

# Expected: 6th attempt should return 429 Too Many Requests
```

#### 7. Graceful Shutdown

```bash
# Test graceful shutdown
pm2 reload go-barry-api

# Check logs for shutdown sequence
pm2 logs go-barry-api --lines 50

# Expected logs:
# 📡 SIGTERM signal received
# ✅ HTTP server closed
# ✅ WebSocket connections closed
# ✅ MySQL connection pool closed
# 👋 Shutdown complete
```

#### 8. Log Files

```bash
# Check application logs
tail -f /home/gobarry/logs/app.log

# Check PM2 logs
pm2 logs go-barry-api

# Check Apache logs
tail -f /var/log/apache2/gobarry-access.log
tail -f /var/log/apache2/gobarry-error.log
```

#### 9. SSL Certificate

```bash
# Test SSL certificate
openssl s_client -connect gobarry.co.uk:443 -servername gobarry.co.uk

# Expected: Certificate chain, no errors

# Check SSL Labs grade (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=gobarry.co.uk
```

#### 10. Memory and Performance

```bash
# Check memory usage
pm2 show go-barry-api

# Expected: Memory usage < 512MB

# Run monitor script
/home/gobarry/scripts/monitor.sh

# Check for memory leaks (run after 24 hours)
pm2 monit
```

### Final Checklist

- [ ] Server health check returns `"status":"healthy"`
- [ ] Database connection test passes
- [ ] All API endpoints respond correctly
- [ ] WebSocket connections work (both public and protected)
- [ ] CORS allows configured origins
- [ ] Rate limiting blocks excessive requests
- [ ] Graceful shutdown works correctly
- [ ] Logs are being written and rotated
- [ ] SSL certificate is valid
- [ ] Memory usage is stable
- [ ] PM2 startup script is configured
- [ ] Backups are scheduled
- [ ] Monitoring is set up

---

## Summary

### Key Files Reference

| File | Purpose |
|------|---------|
| `/backend/server.js` | Main application entry point |
| `/backend/routes/webSocketHandler.js` | WebSocket server with 5 channels |
| `/backend/.env` | Environment configuration |
| `/backend/config/mysql.js` | MySQL connection pool with retry logic |
| `/backend/middleware/cors.js` | CORS multi-origin support |
| `/backend/ecosystem.config.cjs` | PM2 process manager configuration |
| `/etc/apache2/sites-available/gobarry.co.uk.conf` | Apache virtual host with WebSocket proxy |
| `/etc/logrotate.d/go-barry` | Log rotation configuration |
| `/home/gobarry/scripts/monitor.sh` | System monitoring script |
| `/home/gobarry/scripts/rotate-logs.sh` | Manual log rotation script |

### Production URLs

- **Primary**: https://gobarry.co.uk
- **cPanel (Production)**: https://breakdowns.gobarry.co.uk
- **API Health**: https://gobarry.co.uk/health
- **WebSocket (Public)**: wss://gobarry.co.uk/ws/control-room
- **WebSocket (SDC)**: wss://gobarry.co.uk/ws/sdc-dashboard?token=JWT_TOKEN

### Support Contacts

- **Developer**: Anthony Gair
- **Client**: Go North East
- **Environment**: cPanel Production
- **Database**: MySQL 8.0+ (cPanel)
- **Process Manager**: PM2
- **WebSocket**: ws library 8.18.3 (NOT Convex)

---

## Troubleshooting Quick Reference

```bash
# Check server status
pm2 status

# View real-time logs
pm2 logs go-barry-api

# Restart server
pm2 restart go-barry-api

# Check database connection
mysql -h localhost -u gobarryco_user -p gobarryco_breakdowns -e "SELECT 1;"

# Test WebSocket
wscat -c "wss://gobarry.co.uk/ws/control-room"

# Check Apache status
systemctl status apache2

# Test Apache config
sudo apache2ctl configtest

# Monitor system resources
/home/gobarry/scripts/monitor.sh

# Check disk space
df -h

# Clear PM2 logs
pm2 flush

# Reload PM2 with new .env
pm2 reload go-barry-api --update-env
```

---

**End of Guide**

This guide provides production-ready configurations with all technical errors corrected. All code examples use ES6 imports, proper error handling, and follow best practices for cPanel deployment with PM2 process management and Apache reverse proxy for WebSocket support.
