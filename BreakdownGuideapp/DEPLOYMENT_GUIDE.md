# cPanel Deployment Guide for breakdowns.gobarry.co.uk

## 📋 Pre-Deployment Checklist

1. **Get Supabase Anon Key**:
   - Go to https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal/settings/api
   - Copy the "anon public" key
   - Update `/frontend/.env.production` with this key

2. **Install Dependencies**:
   ```bash
   cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
   npm install
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with all static files.

## 🚀 Deployment Steps

### Step 1: Upload Files to cPanel

1. **Login to cPanel**
2. **Navigate to File Manager**
3. **Find your subdomain folder**: `public_html/breakdowns` (or similar)
4. **Upload the following**:
   - Everything from the `dist/` folder
   - The `.htaccess` file (from frontend folder)
   
   Your structure should look like:
   ```
   public_html/breakdowns/
   ├── index.html
   ├── .htaccess
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   └── logo.svg (if you have one)
   ```

### Step 2: Verify .htaccess is Working

The `.htaccess` file ensures React Router works properly. Test by:
1. Going to https://breakdowns.gobarry.co.uk
2. Click on "Live Dashboard" 
3. Refresh the page - it should still show "Coming Soon" not a 404

### Step 3: Database Alternative (if needed)

If you want to use cPanel's database instead of Supabase:
- **MySQL/MariaDB** is available in cPanel
- Look for "MySQL Databases" in cPanel
- We can adapt the schema if needed

However, **Supabase is recommended** because:
- Real-time updates built-in
- Better API
- Easier to manage
- Already configured

## 📁 What to Transfer Next

### From `breakdown-guide-standalone/frontend/`

1. **Breakdown Guide Core** (Priority 1):
   ```
   breakdown-guide/
   ├── App.js                          → Update imports, modernize
   ├── supervisorBreakdownLogger.js    → Core tracking logic
   ├── components/
   │   ├── wizards/                    → All 29 wizards
   │   ├── shared/                     → Shared components
   │   └── BreakdownList.js          → Reference for display
   └── services/                       → API calls (update URLs)
   ```

2. **Dashboards** (Priority 2):
   ```
   dashboard/
   ├── engineering-live/
   ├── management-overview/
   └── sdc-operations/
   ```

3. **Fleet Intelligence** (Priority 3):
   ```
   analytics/fleet-intelligence/
   ├── FleetIntelligence.js
   ├── services/
   └── components/
   ```

## 🔧 API Endpoints Needed

Based on the existing app, these are the endpoints your Breakdown Guide will need:

```javascript
// Core Breakdown Management
POST   /api/breakdowns/v3/start
POST   /api/breakdowns/v3/step
POST   /api/breakdowns/v3/complete
GET    /api/breakdowns/live
GET    /api/breakdowns/today

// Fleet Data
GET    /api/fleet
GET    /api/fleet/:fleetNumber

// Analytics
GET    /api/analytics/depot-performance
GET    /api/fleet-intelligence/summary
GET    /api/fleet-intelligence/problem-vehicles
```

## 🎯 Immediate Next Steps

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to cPanel**:
   - Upload contents of `dist/` folder
   - Upload `.htaccess` file

3. **Test the deployment**:
   - Visit https://breakdowns.gobarry.co.uk
   - Verify navigation works
   - Check console for errors

4. **Start transferring**:
   - Copy the breakdown-guide folder
   - We'll update imports and API calls together

## ⚠️ Important Notes

- **No Node.js needed on cPanel** - we're serving static files
- **API calls go to Render** - already configured in vite.config.js
- **Database is on Supabase** - no local database needed
- **Start with Breakdown Guide** - it's the priority feature

## 🔐 cPanel Details Needed

To help further, I would need:
1. **Subdomain folder path** in cPanel (usually `public_html/breakdowns`)
2. **Any specific SSL/HTTPS requirements**
3. **Do you want to password protect during development?**

But you can start deploying immediately with what we have!
