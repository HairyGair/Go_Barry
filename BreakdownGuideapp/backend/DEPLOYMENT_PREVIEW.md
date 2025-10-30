# Backend Deployment Preview - cPanel

## 📋 What Will Be Deployed

### Core Application Files
```
✅ server.js              - Main Express application (entry point)
✅ app.js                 - Passenger compatibility wrapper
✅ package.json           - Dependencies and scripts
✅ .htaccess              - Apache/Passenger configuration
✅ .env.production        - Production environment template
✅ passenger_wsgi.py      - Passenger WSGI configuration
```

### Directory Structure
```
backend/
├── server.js                 ← Main entry point
├── app.js                    ← Passenger entry point
├── package.json              ← Node.js dependencies
├── .htaccess                 ← Apache configuration
├── .env                      ← Created from .env.production
│
├── config/
│   ├── mysql.js              ← MySQL database connection
│   └── database-cpanel.js    ← cPanel-specific DB config
│
├── middleware/
│   ├── authMiddleware.js     ← JWT authentication
│   └── validationMiddleware.js ← Input validation
│
├── routes/
│   ├── auth.js               ← Login/logout endpoints
│   ├── supervisors.js        ← Supervisor management
│   ├── breakdowns.js         ← Breakdown tracking
│   ├── breakdownsAPI.js      ← Extended breakdown API
│   ├── activity.js           ← Activity logging
│   ├── analytics.js          ← Dashboard analytics
│   ├── engineering.js        ← Engineering dashboard data
│   ├── fleet.js              ← Fleet database
│   ├── defects.js            ← Defect tracking
│   ├── wizards.js            ← Assessment wizards
│   ├── preferences.js        ← User preferences
│   ├── public.js             ← Public endpoints
│   └── webSocketHandler.js   ← Real-time updates
│
├── services/
│   ├── activityLogger.js     ← Activity logging service
│   └── breakdownIdGenerator.js ← ID generation
│
├── utils/
│   └── queryHelpers.js       ← Database query utilities
│
├── data/                     ← Static data files
│
└── migrations/               ← Database migrations (reference)
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
NODE_ENV=production
PORT=3001

# Database (cPanel MySQL - localhost)
DB_HOST=localhost
DB_PORT=3306
DB_USER=gobarryco_Gair
DB_PASSWORD=Turnip1105!!!!!
DB_NAME=gobarryco_breakdown
MYSQL_CONNECTION_LIMIT=10

# Authentication
JWT_SECRET=9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a
JWT_EXPIRATION=24h

# URLs
API_BASE_URL=https://gobarry.co.uk
APP_URL=https://breakdowns.gobarry.co.uk

# CORS
ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,https://breakdowns.gobarry.co.uk

# Features
ENABLE_AUTH=true
ENABLE_MOCK_DATA=false

# Security
SESSION_SECRET=breakdown_guide_production_secret_2025

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Apache/Passenger Configuration (.htaccess)
```apache
PassengerEnabled on
PassengerAppType node
PassengerStartupFile server.js
PassengerAppRoot /home/gobarryco/backend
PassengerNodejs /opt/cpanel/ea-nodejs20/bin/node
SetEnv NODE_ENV production

# CORS Headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Proxy to Node.js app
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

## 🚀 Deployment Steps

When you run `npm run deploy`, the script will:

### 1. Upload Files (rsync)
```bash
✓ Upload all .js files
✓ Upload configuration files
✓ Upload routes/, services/, middleware/, utils/
✓ Upload data/ directory
✓ Skip node_modules (will install fresh)
✓ Skip .git, logs, and temp files
```

**Excluded from upload:**
- `node_modules/` (installed on server)
- `.git/` (version control)
- `.DS_Store` (macOS files)
- `*.log` (log files)
- `*.zip` (archives)
- `*.md` (documentation - except critical ones)
- `*.sh` (deployment scripts)

### 2. Server Configuration
```bash
✓ Create .env from .env.production
✓ Install dependencies via npm
✓ Create tmp/ directory for Passenger
✓ Set correct file permissions
```

### 3. Application Restart
```bash
✓ Trigger Passenger restart via tmp/restart.txt
✓ Wait 5 seconds for startup
✓ Test health endpoint
```

### 4. Verification
```bash
✓ Test: https://api.breakdowns.gobarry.co.uk/health
✓ Verify database connection
✓ Check supervisor endpoints
```

## 📊 API Endpoints Available

Once deployed, these endpoints will be active:

### Health & Status
```
GET  /health                              - Server health check
GET  /api/health                          - Detailed health info
```

### Authentication
```
POST /api/auth/login                      - Supervisor login
POST /api/auth/logout                     - Supervisor logout
GET  /api/auth/verify                     - Verify JWT token
```

### Supervisors
```
GET  /api/supervisors                     - List all supervisors
GET  /api/supervisors/:id                 - Get supervisor details
PUT  /api/supervisors/:id                 - Update supervisor
PUT  /api/supervisors/:id/password        - Reset password
```

### Breakdowns
```
GET  /api/breakdowns                      - List breakdowns
POST /api/breakdowns                      - Create breakdown
GET  /api/breakdowns/:id                  - Get breakdown details
PUT  /api/breakdowns/:id                  - Update breakdown
DELETE /api/breakdowns/:id                - Delete breakdown
GET  /api/breakdowns/live                 - Active breakdowns
GET  /api/breakdowns/resolved             - Resolved breakdowns
```

### Analytics
```
GET  /api/analytics/summary               - Dashboard summary
GET  /api/analytics/depot/:depot          - Depot statistics
GET  /api/analytics/trends                - Trend analysis
```

### Engineering Dashboard
```
GET  /api/engineering/live                - Live engineering data
GET  /api/engineering/stats               - Engineering statistics
```

### Fleet
```
GET  /api/fleet                           - Fleet database
GET  /api/fleet/:fleetNo                  - Specific vehicle
```

### Activity Logs
```
GET  /api/activity                        - Recent activity
GET  /api/activity/supervisor/:id         - Supervisor activity
```

### Wizards
```
GET  /api/wizards/:type                   - Get wizard flow
POST /api/wizards/assessment              - Submit assessment
```

## 🔍 Pre-Deployment Checklist

Before deploying, verify:

- [x] **Database Ready**: MySQL database `gobarryco_breakdown` exists on cPanel
- [x] **Database User**: `gobarryco_Gair` has full access to the database
- [x] **Tables Migrated**: All tables from Supabase migrated to MySQL
- [x] **DNS Configured**: `api.breakdowns.gobarry.co.uk` points to cPanel server
- [x] **Node.js Available**: Node.js 20.x installed on cPanel
- [x] **SSH Access**: Can connect via `ssh gobarryco@gobarry.co.uk`
- [x] **cPanel Access**: Can login to https://gobarry.co.uk:2083
- [x] **Frontend Updated**: Frontend `.env` points to `https://api.breakdowns.gobarry.co.uk`

## ⚠️ Important Notes

### Database Connection
- **Development**: Connects to cPanel MySQL via IP `85.234.151.224`
- **Production**: Connects to `localhost` (faster, more secure)

### Render Backend
- Currently **suspended** (good - avoids conflicts)
- Can be reactivated if rollback needed
- Keep environment variables backed up

### CORS Configuration
- Allows requests from:
  - `https://gobarry.co.uk`
  - `https://www.gobarry.co.uk`
  - `https://breakdowns.gobarry.co.uk`
- All methods enabled: GET, POST, PUT, DELETE, OPTIONS

### Rate Limiting
- Production: 100 requests per 15 minutes
- Development: 1000 requests per 15 minutes

## 🔧 Post-Deployment Testing

After deployment, test these critical endpoints:

```bash
# 1. Health Check
curl https://api.breakdowns.gobarry.co.uk/health
# Expected: {"status":"ok","timestamp":"...","database":"connected"}

# 2. Supervisors List
curl https://api.breakdowns.gobarry.co.uk/api/supervisors
# Expected: Array of supervisor objects

# 3. Login Test
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"badge":"AG003","password":"Gair1105!"}'
# Expected: {"token":"...","supervisor":{...}}

# 4. Live Breakdowns
curl https://api.breakdowns.gobarry.co.uk/api/breakdowns/live
# Expected: Array of active breakdowns
```

## 📝 Rollback Plan

If deployment fails:

1. **Keep Render backend suspended** (avoid duplicate operations)
2. **SSH into cPanel** and restore previous version:
   ```bash
   cd ~/backend
   git checkout HEAD~1  # If using git
   # OR restore from backup
   touch tmp/restart.txt
   ```
3. **Check logs**:
   ```bash
   tail -f ~/logs/stderr.log
   ```

## 🆘 Support Contacts

- **Developer**: Anthony Gair (anthony@gobarry.co.uk)
- **Hosting**: cPanel support via gobarry.co.uk:2083
- **Database**: MySQL on cPanel localhost

---

## ✅ Ready to Deploy?

If everything looks good, run:

```bash
npm run deploy
```

The deployment will complete in approximately **2-3 minutes**.

You'll be prompted for the SSH password: `juvwyh-1nuJdu-gyqrut`

---

**Last Updated**: 2025-10-21
**Deployment Script**: `deploy-complete.sh`
**Documentation**: `CPANEL_COMPLETE_DEPLOYMENT.md`
