# cPanel Production URLs & Configuration Guide

**Version:** 2.0.0
**Last Updated:** October 27, 2025
**System:** Go BARRY Breakdown Management System
**Deployment Target:** cPanel Shared Hosting

---

## Table of Contents

1. [Production Domain Structure](#1-production-domain-structure)
2. [Environment Variable Templates](#2-environment-variable-templates)
3. [DNS Configuration](#3-dns-configuration)
4. [SSL Certificate Setup](#4-ssl-certificate-setup)
5. [CORS Configuration](#5-cors-configuration)
6. [WebSocket Configuration](#6-websocket-configuration)
7. [Apache Virtual Host Setup](#7-apache-virtual-host-setup)
8. [Deployment Verification Checklist](#8-deployment-verification-checklist)

---

## 1. Production Domain Structure

### Primary Domains

| Service | Domain | Purpose | SSL Required |
|---------|--------|---------|--------------|
| **Frontend** | `breakdowns.gobarry.co.uk` | React application entry point | ✅ Yes |
| **Backend API** | `api.breakdowns.gobarry.co.uk` | REST API endpoints | ✅ Yes |
| **WebSocket** | `wss://api.breakdowns.gobarry.co.uk` | Real-time updates | ✅ Yes |
| **Main Domain** | `gobarry.co.uk` | Company main site (redirect) | ✅ Yes |

### Current Configuration Status

Based on the codebase analysis:

**✅ CONFIRMED PRODUCTION URLS:**
- Frontend: `https://breakdowns.gobarry.co.uk`
- Backend API: `https://api.breakdowns.gobarry.co.uk`
- WebSocket: `wss://api.breakdowns.gobarry.co.uk`

**⚠️ ALTERNATE CONFIGURATION FOUND:**
Some files reference: `https://breakdowns.gobarry.co.uk/api` (single domain with path-based routing)

### URL Architecture Patterns

#### Option A: Subdomain Architecture (RECOMMENDED)
```
Frontend:   https://breakdowns.gobarry.co.uk
Backend:    https://api.breakdowns.gobarry.co.uk/api/...
WebSocket:  wss://api.breakdowns.gobarry.co.uk
```

**Pros:**
- Clean separation of concerns
- Easier CORS management
- Better load balancing potential
- Professional structure

**Cons:**
- Requires 2 SSL certificates (or wildcard)
- More DNS records to manage

#### Option B: Path-Based Architecture (SIMPLER FOR cPANEL)
```
Frontend:   https://breakdowns.gobarry.co.uk
Backend:    https://breakdowns.gobarry.co.uk/api/...
WebSocket:  wss://breakdowns.gobarry.co.uk/ws
```

**Pros:**
- Single SSL certificate
- Single domain to manage
- Simpler cPanel configuration
- Already partially configured in codebase

**Cons:**
- Requires Apache ProxyPass rules
- Frontend and backend share same domain

### Recommended Production URLs (FINAL)

**Based on cPanel constraints and current configuration:**

```
Main Application:    https://breakdowns.gobarry.co.uk
API Endpoints:       https://breakdowns.gobarry.co.uk/api/*
WebSocket:           wss://breakdowns.gobarry.co.uk/ws
Health Check:        https://breakdowns.gobarry.co.uk/api/health
Login:               https://breakdowns.gobarry.co.uk/login
Dashboard:           https://breakdowns.gobarry.co.uk/breakdown-guide
Control Room:        https://breakdowns.gobarry.co.uk/dashboards/control-room-display.html
Engineering:         https://breakdowns.gobarry.co.uk/engineering
```

---

## 2. Environment Variable Templates

### 2.1 Backend Environment Variables (.env)

**Location:** `/backend/.env`

```bash
#=============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Go BARRY Breakdown Management System - Backend
#=============================================================================

# Environment
NODE_ENV=production
PORT=3001

#-----------------------------------------------------------------------------
# MySQL Database Configuration (cPanel)
#-----------------------------------------------------------------------------
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns
DB_USER=gobarryco_breakdown_user
DB_PASSWORD=<SECURE_PASSWORD_FROM_CPANEL>
MYSQL_CONNECTION_LIMIT=10

#-----------------------------------------------------------------------------
# Production URLs
#-----------------------------------------------------------------------------
# Backend API base URL
API_BASE_URL=https://breakdowns.gobarry.co.uk/api

# Frontend application URL
APP_URL=https://breakdowns.gobarry.co.uk

#-----------------------------------------------------------------------------
# CORS Configuration
#-----------------------------------------------------------------------------
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk,https://www.gobarry.co.uk

#-----------------------------------------------------------------------------
# Security & Authentication
#-----------------------------------------------------------------------------
# Generate with: openssl rand -base64 64
SESSION_SECRET=<GENERATE_RANDOM_64_CHAR_STRING>
JWT_SECRET=<GENERATE_RANDOM_64_CHAR_STRING>
JWT_EXPIRES_IN=24h

#-----------------------------------------------------------------------------
# Feature Flags (Production)
#-----------------------------------------------------------------------------
ENABLE_AUTH=true
ENABLE_MOCK_DATA=false

#-----------------------------------------------------------------------------
# Rate Limiting
#-----------------------------------------------------------------------------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

#-----------------------------------------------------------------------------
# Legacy Supabase (Keep for gradual migration)
#-----------------------------------------------------------------------------
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8
SUPABASE_SERVICE_KEY=<SERVICE_KEY_FROM_SUPABASE_DASHBOARD>

#-----------------------------------------------------------------------------
# Optional: External API Keys
#-----------------------------------------------------------------------------
# TOMTOM_API_KEY=<your_tomtom_key>
# HERE_API_KEY=<your_here_key>
# NATIONAL_HIGHWAYS_API_KEY=<your_key>
```

### 2.2 Frontend Environment Variables (.env)

**Location:** `/frontend/.env`

```bash
#=============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Go BARRY Breakdown Management System - Frontend
#=============================================================================

#-----------------------------------------------------------------------------
# API Configuration
#-----------------------------------------------------------------------------
# Backend API URL (with /api path for path-based routing)
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000

# Application URL
VITE_APP_URL=https://breakdowns.gobarry.co.uk

#-----------------------------------------------------------------------------
# WebSocket Configuration
#-----------------------------------------------------------------------------
# WebSocket URL (secure WebSocket)
VITE_WS_URL=wss://breakdowns.gobarry.co.uk/ws
VITE_WS_RECONNECT_INTERVAL=5000
VITE_WS_MAX_RECONNECT_ATTEMPTS=5

#-----------------------------------------------------------------------------
# Supabase Configuration
#-----------------------------------------------------------------------------
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8

#-----------------------------------------------------------------------------
# Authentication
#-----------------------------------------------------------------------------
VITE_ENABLE_AUTH=true
VITE_SESSION_TIMEOUT=3600
VITE_REFRESH_TOKEN_INTERVAL=1800

#-----------------------------------------------------------------------------
# Feature Flags (Production)
#-----------------------------------------------------------------------------
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PWA=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_MAINTENANCE_MODE=false

#-----------------------------------------------------------------------------
# Map Configuration
#-----------------------------------------------------------------------------
VITE_MAP_PROVIDER=openstreetmap
VITE_MAP_DEFAULT_LAT=54.9783
VITE_MAP_DEFAULT_LNG=-1.6178
VITE_MAP_DEFAULT_ZOOM=10

# Google Maps API for geocoding (if needed)
VITE_GOOGLE_MAPS_KEY=AIzaSyBhBN_kVOnIRTKXYhzrDwpr8kvb0Uy0IY8

#-----------------------------------------------------------------------------
# Weather API
#-----------------------------------------------------------------------------
VITE_WEATHER_API_KEY=21c611301aff245720d1e3f5771f4536

#-----------------------------------------------------------------------------
# Storage Configuration
#-----------------------------------------------------------------------------
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
VITE_STORAGE_BUCKET=breakdown-photos

#-----------------------------------------------------------------------------
# Environment Metadata
#-----------------------------------------------------------------------------
VITE_ENV=production
VITE_APP_NAME="GNE Breakdown Management"
VITE_APP_VERSION=2.0.0
VITE_PUBLIC_URL=https://breakdowns.gobarry.co.uk

#-----------------------------------------------------------------------------
# Security
#-----------------------------------------------------------------------------
VITE_ENABLE_CSP=true
VITE_SECURE_COOKIES=true
```

### 2.3 Development Environment Variables

**Backend (.env.development):**
```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns_dev
DB_USER=root
DB_PASSWORD=your_dev_password
API_BASE_URL=http://localhost:3001
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8081
SESSION_SECRET=dev_session_secret_change_in_production
JWT_SECRET=dev_jwt_secret_change_in_production
ENABLE_AUTH=true
ENABLE_MOCK_DATA=false
```

**Frontend (.env.development):**
```bash
VITE_API_URL=http://localhost:3001
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
VITE_APP_URL=http://localhost:3000
VITE_ENABLE_AUTH=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=true
```

### 2.4 Testing Environment Variables

**Backend (.env.test):**
```bash
NODE_ENV=test
PORT=3002
DB_HOST=localhost
DB_NAME=gobarryco_breakdowns_test
API_BASE_URL=http://localhost:3002
ENABLE_AUTH=true
ENABLE_MOCK_DATA=true
```

---

## 3. DNS Configuration

### Required DNS Records

Add these records in your DNS provider (or cPanel DNS Zone Editor):

#### A Records
```
Type  | Name                | Value               | TTL
------|---------------------|---------------------|------
A     | breakdowns          | <SERVER_IP_ADDRESS> | 3600
A     | api.breakdowns      | <SERVER_IP_ADDRESS> | 3600
A     | www.breakdowns      | <SERVER_IP_ADDRESS> | 3600
```

#### CNAME Records (Alternative to A records)
```
Type  | Name                | Value               | TTL
------|---------------------|---------------------|------
CNAME | breakdowns          | gobarry.co.uk       | 3600
CNAME | api.breakdowns      | gobarry.co.uk       | 3600
CNAME | www.breakdowns      | gobarry.co.uk       | 3600
```

#### Recommended: Use A Records for Production

**Why?** A records provide direct IP resolution, avoiding potential CNAME chain delays.

### DNS Setup Steps

1. **Log into cPanel**
2. Navigate to **Zone Editor**
3. Select domain: `gobarry.co.uk`
4. Add A record:
   - **Name:** `breakdowns`
   - **Type:** `A`
   - **Address:** Your server IP (find in cPanel > Server Information)
   - **TTL:** 3600 (1 hour)

5. Add A record for API subdomain (if using Option A):
   - **Name:** `api.breakdowns`
   - **Type:** `A`
   - **Address:** Same server IP
   - **TTL:** 3600

6. **Wait for propagation** (usually 1-4 hours)

### Verify DNS Propagation

```bash
# Check DNS resolution
nslookup breakdowns.gobarry.co.uk
dig breakdowns.gobarry.co.uk

# Check from multiple locations
# Visit: https://dnschecker.org
# Enter: breakdowns.gobarry.co.uk
```

---

## 4. SSL Certificate Setup

### Option 1: AutoSSL (Recommended for cPanel)

**Steps:**
1. Log into cPanel
2. Navigate to **SSL/TLS Status**
3. Select domains:
   - `breakdowns.gobarry.co.uk`
   - `api.breakdowns.gobarry.co.uk` (if using subdomain)
   - `www.breakdowns.gobarry.co.uk`
4. Click **Run AutoSSL**
5. Wait for certificates to be issued (usually 1-5 minutes)

**Expected Result:**
```
✓ breakdowns.gobarry.co.uk - SSL certificate installed
✓ api.breakdowns.gobarry.co.uk - SSL certificate installed
```

### Option 2: Let's Encrypt (Manual)

**Steps:**
1. cPanel → **SSL/TLS** → **Manage SSL Sites**
2. Choose **Let's Encrypt™ SSL**
3. Select domain: `breakdowns.gobarry.co.uk`
4. Click **Issue**
5. Repeat for `api.breakdowns.gobarry.co.uk`

### Option 3: Wildcard SSL (Premium)

**Purchase a wildcard certificate for:**
- `*.gobarry.co.uk`

**Benefits:**
- Covers all subdomains automatically
- Single certificate to manage

**Install via:**
cPanel → **SSL/TLS** → **Manage SSL Sites** → Upload certificate files

### Verify SSL Installation

```bash
# Test SSL certificate
curl -I https://breakdowns.gobarry.co.uk

# Check certificate details
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk

# Online tools:
# https://www.ssllabs.com/ssltest/
# Enter: breakdowns.gobarry.co.uk
```

**Expected SSL Grade:** A or A+

---

## 5. CORS Configuration

### Backend CORS Setup

**File:** `/backend/server.js`

```javascript
import cors from 'cors';

// Parse allowed origins from environment
const getAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
  ];

  // Production origins
  const productionOrigins = [
    'https://breakdowns.gobarry.co.uk',
    'https://www.breakdowns.gobarry.co.uk',
    'https://gobarry.co.uk',
    'https://www.gobarry.co.uk',
  ];

  return process.env.NODE_ENV === 'production'
    ? [...productionOrigins, ...envOrigins]
    : [...defaultOrigins, ...productionOrigins, ...envOrigins];
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

### Frontend CORS Headers

**File:** `/frontend/dist/.htaccess` (generated during build)

```apache
# CORS headers for API requests
<IfModule mod_headers.c>
    # Allow credentials
    Header set Access-Control-Allow-Credentials "true"

    # Production origin
    Header set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"

    # Allowed methods
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"

    # Allowed headers
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

    # Cache preflight requests for 24 hours
    Header set Access-Control-Max-Age "86400"
</IfModule>
```

### Testing CORS

```bash
# Test CORS from allowed origin
curl -H "Origin: https://breakdowns.gobarry.co.uk" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://breakdowns.gobarry.co.uk/api/health

# Expected response headers:
# Access-Control-Allow-Origin: https://breakdowns.gobarry.co.uk
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 6. WebSocket Configuration

### Backend WebSocket Server

**File:** `/backend/server.js`

```javascript
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/ws',
  verifyClient: (info, cb) => {
    // Verify origin
    const origin = info.origin || info.req.headers.origin;
    const allowedOrigins = getAllowedOrigins();

    if (!origin || allowedOrigins.includes(origin)) {
      cb(true);
    } else {
      console.warn(`WebSocket connection rejected from: ${origin}`);
      cb(false, 403, 'Forbidden');
    }
  }
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');

  ws.on('message', (data) => {
    // Handle incoming messages
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ WebSocket server ready at ws://localhost:${PORT}/ws`);
});
```

### Frontend WebSocket Client

**File:** `/frontend/src/services/websocket-service.js`

```javascript
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://breakdowns.gobarry.co.uk/ws';

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.reconnect();
    };
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }
}

export default new WebSocketService();
```

### Apache ProxyPass for WebSocket (cPanel)

**File:** `/home/username/public_html/.htaccess`

```apache
# WebSocket proxy configuration
<IfModule mod_proxy.c>
    RewriteEngine On

    # WebSocket upgrade
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^ws(.*)$ ws://localhost:3001/ws$1 [P,L]

    # HTTP to WebSocket upgrade
    RewriteCond %{HTTP:Connection} Upgrade [NC]
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteRule ^ws(.*)$ ws://localhost:3001/ws$1 [P,L]
</IfModule>
```

---

## 7. Apache Virtual Host Setup

### Main .htaccess Configuration

**File:** `/home/username/public_html/breakdowns/.htaccess`

```apache
# Go BARRY Breakdown Management System
# Apache Configuration for cPanel Hosting

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

    # API Proxy to Node.js backend (port 3001)
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

    # WebSocket proxy
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^ws(.*)$ ws://localhost:3001/ws$1 [P,L]

    # React Router - Single Page Application
    # Serve index.html for all non-file routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header set X-Frame-Options "SAMEORIGIN"

    # Prevent MIME type sniffing
    Header set X-Content-Type-Options "nosniff"

    # Enable XSS protection
    Header set X-XSS-Protection "1; mode=block"

    # Referrer policy
    Header set Referrer-Policy "strict-origin-when-cross-origin"

    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self' https://oieliubbvvdzhzvikzal.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://oieliubbvvdzhzvikzal.supabase.co https://breakdowns.gobarry.co.uk wss://breakdowns.gobarry.co.uk;"
</IfModule>

# Caching rules
<IfModule mod_expires.c>
    ExpiresActive On

    # HTML files - no cache
    ExpiresByType text/html "access plus 0 seconds"

    # JavaScript and CSS - 1 year (with versioned filenames)
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"

    # Images - 1 month
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"

    # Fonts - 1 year
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/ttf "access plus 1 year"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Error pages
ErrorDocument 404 /index.html
ErrorDocument 500 /index.html
```

### Subdomain Configuration (if using api.breakdowns.gobarry.co.uk)

Create subdomain in cPanel:
1. cPanel → **Subdomains**
2. **Subdomain:** `api.breakdowns`
3. **Document Root:** `/home/username/api.breakdowns`
4. Create `.htaccess` in subdomain root:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

    # Proxy all requests to Node.js backend
    RewriteRule ^(.*)$ http://localhost:3001/api/$1 [P,L]
</IfModule>

# CORS headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"
    Header set Access-Control-Allow-Credentials "true"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

---

## 8. Deployment Verification Checklist

### Pre-Deployment Checks

- [ ] **DNS Records Created**
  - `breakdowns.gobarry.co.uk` A record points to server IP
  - `api.breakdowns.gobarry.co.uk` A record (if using subdomain)
  - DNS propagation complete (check with `nslookup`)

- [ ] **SSL Certificates Installed**
  - Certificate for `breakdowns.gobarry.co.uk`
  - Certificate for `api.breakdowns.gobarry.co.uk` (if applicable)
  - All certificates show as valid (green padlock)

- [ ] **Environment Variables Configured**
  - Backend `.env` file uploaded with production values
  - Frontend built with production `.env`
  - All secrets generated and stored securely

- [ ] **Database Setup**
  - MySQL database created: `gobarryco_breakdowns`
  - Database user created with proper permissions
  - Migration scripts run successfully
  - Test connection from Node.js app

### Post-Deployment Tests

#### 1. Frontend Accessibility
```bash
# Test main page loads
curl -I https://breakdowns.gobarry.co.uk
# Expected: HTTP/2 200

# Test React Router
curl -I https://breakdowns.gobarry.co.uk/breakdown-guide
# Expected: HTTP/2 200 (serves index.html)
```

#### 2. Backend API Health
```bash
# Test health endpoint
curl https://breakdowns.gobarry.co.uk/api/health
# Expected: {"status":"healthy","timestamp":"..."}

# Test authentication endpoint
curl https://breakdowns.gobarry.co.uk/api/auth/supervisors
# Expected: JSON array of supervisors
```

#### 3. CORS Testing
```bash
# Test from allowed origin
curl -H "Origin: https://breakdowns.gobarry.co.uk" \
     -I https://breakdowns.gobarry.co.uk/api/health
# Expected: Access-Control-Allow-Origin header present
```

#### 4. WebSocket Connection
Open browser console on `https://breakdowns.gobarry.co.uk`:
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

#### 5. SSL Verification
```bash
# Check SSL grade
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=breakdowns.gobarry.co.uk
# Expected: A or A+ grade
```

#### 6. Authentication Flow
1. Navigate to `https://breakdowns.gobarry.co.uk/login`
2. Enter test credentials
3. Verify redirect to dashboard
4. Check session persists on refresh
5. Test logout functionality

#### 7. Database Connectivity
```bash
# Check backend logs for database connection
ssh username@server
cd ~/backend
pm2 logs breakdown-backend
# Expected: "✅ Database connection established"
```

### Performance Checks

- [ ] **Page Load Time** < 3 seconds
- [ ] **API Response Time** < 500ms
- [ ] **WebSocket Latency** < 100ms
- [ ] **Lighthouse Score** > 90 (Performance)

### Security Checks

- [ ] **HTTPS Enforced** (HTTP redirects to HTTPS)
- [ ] **SSL Certificate Valid** (not expired, correct domain)
- [ ] **Security Headers Present** (X-Frame-Options, CSP, etc.)
- [ ] **CORS Properly Configured** (only allowed origins)
- [ ] **Sensitive Data Not Exposed** (no .env in public directory)

---

## Quick Reference URLs

### Development
```
Frontend: http://localhost:3000
Backend:  http://localhost:3001
API:      http://localhost:3001/api
WS:       ws://localhost:3001/ws
```

### Production
```
Frontend: https://breakdowns.gobarry.co.uk
Backend:  https://breakdowns.gobarry.co.uk/api
WS:       wss://breakdowns.gobarry.co.uk/ws
Health:   https://breakdowns.gobarry.co.uk/api/health
Login:    https://breakdowns.gobarry.co.uk/login
```

### cPanel Access
```
URL:      https://gobarry.co.uk:2083
Username: <cpanel_username>
Password: <cpanel_password>
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** CORS errors in browser console
**Solution:** Verify `ALLOWED_ORIGINS` in backend `.env` includes `https://breakdowns.gobarry.co.uk`

**Issue:** WebSocket connection fails
**Solution:** Check Apache ProxyPass rules in `.htaccess`, verify port 3001 is accessible

**Issue:** API returns 502 Bad Gateway
**Solution:** Backend Node.js app not running. Check with `pm2 status` or restart

**Issue:** SSL certificate not trusted
**Solution:** Reinstall certificate via cPanel AutoSSL or Let's Encrypt

**Issue:** React Router 404 errors
**Solution:** Verify `.htaccess` RewriteRules are present in frontend directory

### Contact Information

**System Administrator:** Anthony Gair
**Company:** Go North East
**Domain Registrar:** Check WHOIS for `gobarry.co.uk`
**Hosting Provider:** cPanel/WHM hosting

---

**Document Version:** 2.0.0
**Last Updated:** October 27, 2025
**Next Review:** Before next major deployment
