# Production Architecture Diagram - Go BARRY

**Deployment Type:** cPanel Shared Hosting (Path-Based Routing)
**Last Updated:** October 27, 2025

---

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET (Public Access)                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ DNS Resolution
                                 │ breakdowns.gobarry.co.uk → Server IP
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SSL/TLS Layer (Port 443)                        │
│                  Let's Encrypt / AutoSSL Certificate                     │
│                    ✅ https://breakdowns.gobarry.co.uk                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS Requests
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Apache Web Server (cPanel)                          │
│                         mod_rewrite + mod_proxy                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    .htaccess Routing Rules                          │ │
│  │                                                                     │ │
│  │  Route Decision:                                                   │ │
│  │  ├─ /                    → Serve React App (public_html)          │ │
│  │  ├─ /breakdown-guide     → Serve React App (SPA routing)          │ │
│  │  ├─ /login               → Serve React App                        │ │
│  │  ├─ /dashboards/*        → Serve static HTML                      │ │
│  │  ├─ /api/*               → ProxyPass to Node.js (port 3001)       │ │
│  │  └─ /ws                  → WebSocket upgrade to Node.js           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────┬────────────────────────────────────┬────────────────────────────┘
         │                                    │
         │ Static Files                       │ Proxy to Backend
         ▼                                    ▼
┌─────────────────────────┐      ┌──────────────────────────────────────────┐
│   React Frontend        │      │   Node.js Backend (Express)              │
│   (Static Build)        │      │   Port: 3001 (internal only)             │
│                         │      │                                          │
│   📂 public_html/       │      │   ┌────────────────────────────────────┐ │
│      breakdowns/        │      │   │  Express.js Application             │ │
│   ├─ index.html         │      │   │  ├─ 14 Route Modules               │ │
│   ├─ assets/            │      │   │  ├─ Authentication Middleware      │ │
│   │  ├─ index-xxx.js    │      │   │  ├─ CORS Configuration             │ │
│   │  ├─ index-xxx.css   │      │   │  ├─ Rate Limiting                 │ │
│   │  └─ vendor-xxx.js   │      │   │  ├─ Error Handling                │ │
│   ├─ dashboards/        │      │   │  └─ WebSocket Server (ws)         │ │
│   │  └─ control-room-   │      │   └────────────────────────────────────┘ │
│   │     display.html    │      │                 │                        │
│   └─ .htaccess          │      │                 │ Database Queries       │
│                         │      │                 ▼                        │
│   Environment:          │      │   ┌────────────────────────────────────┐ │
│   - VITE_API_URL        │      │   │  MySQL Connection Pool             │ │
│   - VITE_WS_URL         │      │   │  - Max Connections: 10             │ │
│   - VITE_ENABLE_AUTH    │      │   │  - Prepared Statements             │ │
│                         │      │   │  - Auto-reconnect                  │ │
└─────────────────────────┘      │   └────────────────────────────────────┘ │
                                 └──────────────────┬───────────────────────┘
                                                    │
                                                    │ SQL Queries
                                                    ▼
                         ┌──────────────────────────────────────────────┐
                         │         MySQL Database (cPanel)               │
                         │         Database: gobarryco_breakdowns        │
                         │                                              │
                         │  Tables:                                     │
                         │  ├─ breakdowns         (breakdown records)   │
                         │  ├─ fleet_vehicles     (vehicle database)    │
                         │  ├─ supervisors        (user authentication) │
                         │  ├─ engineers          (engineer roster)     │
                         │  ├─ activities         (audit log)           │
                         │  ├─ wizard_progress    (diagnostic tracking) │
                         │  └─ defects            (defect reports)      │
                         └──────────────────────────────────────────────┘
```

---

## 🌐 Request Flow Diagrams

### 1. Frontend Page Load

```
User Browser                Apache                  React App
    │                         │                         │
    │  GET /breakdown-guide   │                         │
    ├────────────────────────>│                         │
    │                         │  Read index.html        │
    │                         ├────────────────────────>│
    │                         │                         │
    │  200 OK (index.html)    │  Return HTML           │
    │<────────────────────────┤<────────────────────────┤
    │                         │                         │
    │  Load /assets/*.js      │                         │
    ├────────────────────────>│  Serve static assets   │
    │  200 OK (JS bundle)     │                         │
    │<────────────────────────┤                         │
    │                         │                         │
    │  React Router handles   │                         │
    │  /breakdown-guide route │                         │
    │  (client-side)          │                         │
```

### 2. API Request Flow

```
React App              Apache              Node.js Backend        MySQL
    │                    │                      │                   │
    │  POST /api/auth/   │                      │                   │
    │     login          │                      │                   │
    ├───────────────────>│                      │                   │
    │                    │  ProxyPass to        │                   │
    │                    │  localhost:3001/api  │                   │
    │                    ├─────────────────────>│                   │
    │                    │                      │  Query            │
    │                    │                      │  supervisors      │
    │                    │                      │  table            │
    │                    │                      ├──────────────────>│
    │                    │                      │  Return user data │
    │                    │                      │<──────────────────┤
    │                    │  200 OK + JWT        │                   │
    │                    │<─────────────────────┤                   │
    │  200 OK + Session  │                      │                   │
    │<───────────────────┤                      │                   │
    │  Store JWT in      │                      │                   │
    │  localStorage      │                      │                   │
```

### 3. WebSocket Connection Flow

```
React App              Apache              Node.js Backend
    │                    │                      │
    │  WS Upgrade        │                      │
    │  wss://.../ws      │                      │
    ├───────────────────>│                      │
    │                    │  Upgrade: websocket  │
    │                    │  ProxyPass ws://...  │
    │                    ├─────────────────────>│
    │                    │                      │
    │                    │  101 Switching       │
    │                    │  Protocols           │
    │                    │<─────────────────────┤
    │  WebSocket Open    │                      │
    │<───────────────────┤                      │
    │                    │                      │
    │  <─────────── Bi-directional ─────────> │
    │           Real-time messages             │
    │  (breakdown updates, notifications)      │
```

---

## 🗂️ File Structure on Server

### cPanel Directory Layout

```
/home/username/
├── public_html/
│   └── breakdowns/                    ← Frontend deployment location
│       ├── index.html                 ← Main app entry
│       ├── .htaccess                  ← Routing rules
│       ├── assets/                    ← Compiled JS/CSS
│       │   ├── index-[hash].js
│       │   ├── index-[hash].css
│       │   └── vendor-[hash].js
│       ├── dashboards/                ← Static dashboards
│       │   ├── control-room-display.html
│       │   ├── engineering-dashboard.html
│       │   └── management-dashboard.html
│       └── images/
│           └── gobarry-logo.png
│
├── backend/                           ← Backend deployment location
│   ├── server.js                      ← Main entry point
│   ├── package.json
│   ├── .env                          ← Production config (SECRET!)
│   ├── config/
│   │   └── mysql.js                  ← Database connection
│   ├── routes/                       ← API route modules
│   │   ├── auth.js
│   │   ├── breakdowns.js
│   │   ├── fleet.js
│   │   ├── wizards.js
│   │   └── ... (14 total)
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── corsConfig.js
│   ├── services/
│   │   ├── activityLogger.js
│   │   └── fleetService.js
│   └── node_modules/                 ← Dependencies
│
├── mysql/                            ← MySQL data (managed by cPanel)
│   └── gobarryco_breakdowns/
│
└── logs/                             ← Application logs
    ├── backend-output.log
    ├── backend-error.log
    └── apache-access.log
```

---

## 🔌 Port Configuration

### External Ports (Public-Facing)

| Port | Protocol | Service | Access |
|------|----------|---------|--------|
| 80   | HTTP     | Apache (redirects to 443) | Public |
| 443  | HTTPS    | Apache + SSL | Public |

### Internal Ports (Server-Only)

| Port | Protocol | Service | Access |
|------|----------|---------|--------|
| 3001 | HTTP     | Node.js Backend | localhost only |
| 3306 | TCP      | MySQL Database | localhost only |

**Security Note:** Backend port 3001 is NOT accessible from internet. Only Apache can proxy to it.

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: SSL/TLS Encryption (Let's Encrypt)                 │
│ - All traffic encrypted with HTTPS                          │
│ - WebSocket uses WSS (secure WebSocket)                     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Apache Security Headers                            │
│ - X-Frame-Options: SAMEORIGIN                               │
│ - X-Content-Type-Options: nosniff                           │
│ - Content-Security-Policy                                   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: CORS Policy                                        │
│ - Only allows breakdowns.gobarry.co.uk                      │
│ - Rejects unauthorized origins                              │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: JWT Authentication                                 │
│ - Token-based auth with 24h expiry                          │
│ - Secure session management                                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Rate Limiting                                      │
│ - Login: 5 attempts per 15 minutes                          │
│ - API: 100 requests per 15 minutes                          │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: Database Access Control                            │
│ - Prepared statements (SQL injection prevention)            │
│ - Connection pooling with limits                            │
│ - User-specific database credentials                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Client-Side Architecture

### React Application Structure

```
React App (breakdowns.gobarry.co.uk)
├── Authentication System
│   ├── Login Component
│   ├── Session Management
│   └── JWT Token Storage
│
├── Routing (React Router)
│   ├── /login              → Login page
│   ├── /breakdown-guide    → Main dashboard
│   ├── /engineering        → Engineering dashboard
│   ├── /dashboards/*       → Static dashboards
│   └── /* (404)            → Redirect to login
│
├── API Client Service
│   ├── Base URL: breakdowns.gobarry.co.uk/api
│   ├── Auto-attach JWT tokens
│   ├── Retry logic
│   └── Error handling
│
├── WebSocket Service
│   ├── URL: wss://breakdowns.gobarry.co.uk/ws
│   ├── Auto-reconnect
│   ├── Message routing
│   └── Event handlers
│
└── State Management
    ├── Auth State (useAuth hook)
    ├── Breakdown Data (API cache)
    ├── Fleet Database (local cache)
    └── Real-time Updates (WebSocket)
```

---

## 🚀 Deployment Flow

### Build → Upload → Configure → Test

```
Local Development Machine
    │
    │ 1. npm run build:cpanel (frontend)
    ├──────> dist/ folder created
    │
    │ 2. Upload via FTP/SSH
    ├──────> /home/username/public_html/breakdowns/
    │
    │ 3. Upload backend folder
    ├──────> /home/username/backend/
    │
    ▼
cPanel Server
    │
    │ 4. Setup Node.js App in cPanel
    ├──────> Application Manager
    │        - App Root: /home/username/backend
    │        - App URL: Not needed (internal proxy)
    │        - Startup File: server.js
    │        - Port: 3001
    │
    │ 5. Configure .env files
    ├──────> Backend: /home/username/backend/.env
    │        Frontend: Already built with production .env
    │
    │ 6. Start Node.js app
    ├──────> PM2 or cPanel App Manager
    │
    ▼
Production Live
    │
    │ 7. Test endpoints
    ├──────> https://breakdowns.gobarry.co.uk
    │        https://breakdowns.gobarry.co.uk/api/health
    │        wss://breakdowns.gobarry.co.uk/ws
    │
    ▼
✅ Deployment Complete
```

---

## 📊 Data Flow Summary

### User Authentication Flow
```
User → Login Form → API (/api/auth/login) → MySQL → JWT Token → Store in localStorage → Authenticated
```

### Breakdown Creation Flow
```
Supervisor → Breakdown Form → API (/api/breakdowns) → MySQL → WebSocket Broadcast → Update All Clients
```

### Real-time Updates Flow
```
Backend Event → WebSocket Server → Push to Connected Clients → Update UI (without refresh)
```

---

## 🎯 Key Differences: Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Frontend URL** | http://localhost:3000 | https://breakdowns.gobarry.co.uk |
| **Backend URL** | http://localhost:3001 | https://breakdowns.gobarry.co.uk/api |
| **WebSocket** | ws://localhost:3001/ws | wss://breakdowns.gobarry.co.uk/ws |
| **SSL** | Not required | Required (HTTPS/WSS) |
| **CORS** | Localhost allowed | Only production domain |
| **Database** | Local MySQL | cPanel MySQL |
| **Auth** | Development supervisors | Real supervisors |
| **Logging** | Verbose console logs | Production-level only |
| **Error Display** | Full stack traces | User-friendly messages |

---

**Last Updated:** October 27, 2025
**Architecture Type:** Path-Based Routing on cPanel
**Status:** Production Ready ✅
