# Go BARRY - Breakdown Guide Backend (Complete)

## 🎯 Purpose

This is a **complete, standalone backend** specifically optimized for the **Go BARRY Breakdown Management System**. It contains all the necessary files to run the backend independently.

## 📁 What's Included

### Core Files:
- `render-startup.js` - Main entry point (optimized for Render.com)
- `index.js` - Backend initialization and route registration
- `package.json` - Dependencies and scripts

### API Routes (`/routes/`):
- `breakdownTrackerV2.js` - **Main breakdown tracking API**
- `health.js` - System health monitoring
- `supervisorAPI.js` - Supervisor authentication
- `analyticsAPI.js` - Dashboard analytics
- All other supporting routes

### Services (`/services/`):
- `supabaseService.js` - Database connection management
- `supabaseConnectionManager.js` - Connection pooling
- `memoryMonitor.js` - Memory optimization
- Supporting services for traffic data, authentication, etc.

### Middleware (`/middleware/`):
- `productionLogFilter.js` - **Log noise reduction (80-90% cleaner logs)**
- `auth.js` - Authentication middleware
- `memoryOptimization.js` - Memory management

### Data & Config:
- `data/` - JSON data files and caches
- `migrations/` - Database schema files
- `utils/` - Helper functions

## 🚀 Deployment Options

### Option 1: Render.com (Recommended)
```bash
# Deploy using the included render.yaml
# 1. Push this folder to a GitHub repository
# 2. Connect to Render.com
# 3. Use render.yaml for automatic configuration
```

### Option 2: Manual Deployment
```bash
# Install dependencies
npm install

# Start production server
npm start

# Or start development server
npm run dev
```

## 🔧 Environment Variables Required

```bash
# Supabase Database
SUPABASE_URL=https://haountnghecfrsoniubq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=your_service_key

# Log Management
QUIET_LOGS=true
LOG_LEVEL=INFO
ENABLE_HEALTH_LOGS=false
ENABLE_MEMORY_LOGS=false

# Optional APIs
TOMTOM_API_KEY=your_tomtom_key
HERE_API_KEY=your_here_key
NATIONAL_HIGHWAYS_API_KEY=your_nh_key
```

## 📊 Key Features

### ✅ Breakdown Management:
- Complete breakdown lifecycle tracking
- Supervisor authentication
- Real-time status updates
- Analytics and reporting

### ✅ Performance Optimized:
- Memory-efficient (works within 2GB Render limit)
- Production log filtering (reduces noise by 80-90%)
- CORS configured for static hosting
- Database connection pooling

### ✅ API Endpoints:
```
GET  /api/health                 - System health
GET  /api/breakdowns/stats       - Breakdown statistics
GET  /api/breakdowns/active      - Active breakdowns
GET  /api/breakdowns/today       - Today's breakdowns
GET  /api/breakdowns/overdue     - Overdue breakdowns
GET  /api/breakdowns/critical    - Critical breakdowns
POST /api/breakdowns/start       - Start new breakdown
POST /api/supervisor/auth        - Supervisor login
```

## 🔗 Frontend Connection

This backend is designed to work with the **BreakdownGuideFrontendComplete** static frontend. The frontend automatically connects to:

```
Production: https://your-backend.onrender.com
Development: http://localhost:3001
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run health check
npm run health

# Check memory usage
npm run memory-check
```

## 📈 Monitoring

### Health Endpoint:
```
GET /api/health
```

### Memory Usage:
```
GET /api/memory
```

### Log Levels:
- `ERROR` - Only critical failures
- `WARN` - Errors + warnings (recommended)
- `INFO` - Normal operations (default)
- `DEBUG` - Verbose logging

## 🚨 Production Notes

1. **Memory Limit**: Optimized for 2GB RAM limit on Render free tier
2. **Log Management**: Set `QUIET_LOGS=true` to reduce log noise
3. **Database**: Requires Supabase with `breakdowns` table
4. **CORS**: Pre-configured for static hosting domains

## 📞 Support

This backend powers the **Go North East Breakdown Management System**. For issues:

1. Check `/api/health` endpoint
2. Review Render logs (should be much cleaner now)
3. Verify Supabase connection
4. Check environment variables

## 🏗️ Architecture

```
Frontend (Static) → CORS → Backend (Node.js) → Supabase (PostgreSQL)
     ↓                         ↓                      ↓
  HTML/CSS/JS            Express Routes         breakdown table
```

**This is a complete, production-ready backend that can run independently.**