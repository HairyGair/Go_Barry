# Complete cPanel Backend Deployment Guide

## Overview
This guide will help you deploy the Go BARRY backend to cPanel with full functionality, replacing the Render.com deployment.

## Prerequisites
- cPanel access for gobarry.co.uk
- SSH access credentials
- Database already configured on cPanel MySQL
- Node.js 20 available on cPanel

## Step-by-Step Deployment

### Step 1: Prepare Deployment Package

Run from your local machine:
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
./prepare-cpanel-deployment.sh
```

This creates a zip file with all necessary backend files.

### Step 2: Upload to cPanel

**Option A: Via SSH (Recommended)**
```bash
# Deploy automatically
npm run deploy

# OR manually with rsync
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  ./ gobarryco@gobarry.co.uk:~/backend/
```

**Option B: Via cPanel File Manager**
1. Login to cPanel: https://gobarry.co.uk:2083
2. Go to File Manager
3. Navigate to `/home/gobarryco/`
4. Upload the zip file created in Step 1
5. Extract it to create `/home/gobarryco/backend/`

### Step 3: Configure Environment on cPanel

SSH into the server:
```bash
ssh gobarryco@gobarry.co.uk
```

Create production environment file:
```bash
cd ~/backend
cp .env.production .env
```

Verify the .env file contains:
```bash
cat .env
```

Should show:
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=gobarryco_Gair
DB_PASSWORD=Turnip1105!!!!!
DB_NAME=gobarryco_breakdown
JWT_SECRET=9fa4f0f326a2f2b997ebe6450b6ae5a236c8229cc43137462505b810c5c27bd792e6f97f058297758f0bc425ae36026e4cbdba91b10fef256541f3425ddd611a
ALLOWED_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk,https://breakdowns.gobarry.co.uk
```

### Step 4: Install Dependencies

While still in SSH:
```bash
cd ~/backend

# Use cPanel's Node.js 20 npm
/opt/cpanel/ea-nodejs20/bin/npm install --production

# Verify installation
ls -la node_modules/ | head -20
```

### Step 5: Set Up Node.js Application in cPanel

**Via cPanel Interface:**
1. Login to cPanel
2. Go to "Setup Node.js App"
3. Click "Create Application"
4. Configure:
   - **Node.js version**: 20.x (or latest available)
   - **Application mode**: Production
   - **Application root**: backend
   - **Application URL**: api.breakdowns.gobarry.co.uk
   - **Application startup file**: server.js
   - **Environment variables**: (Add these)
     ```
     NODE_ENV=production
     PORT=3001
     ```

5. Click "Create"

**Via SSH (Alternative):**
```bash
cd ~/backend

# Create Passenger restart file
mkdir -p tmp
touch tmp/restart.txt

# This tells Passenger to restart the app
```

### Step 6: Configure Apache/Passenger

The `.htaccess` file should already be in the backend directory. Verify:
```bash
cd ~/backend
cat .htaccess
```

If missing, create it with:
```bash
cat > .htaccess << 'EOF'
PassengerEnabled on
PassengerAppType node
PassengerStartupFile server.js
PassengerAppRoot /home/gobarryco/backend
PassengerNodejs /opt/cpanel/ea-nodejs20/bin/node
SetEnv NODE_ENV production
EOF
```

### Step 7: Test the Deployment

Test the health endpoint:
```bash
# From SSH
curl https://api.breakdowns.gobarry.co.uk/health

# Expected response:
{"status":"ok","timestamp":"2025-10-21T17:00:00.000Z","database":"connected"}
```

Test supervisors endpoint:
```bash
curl https://api.breakdowns.gobarry.co.uk/api/supervisors
```

Test from your browser:
- https://api.breakdowns.gobarry.co.uk/health
- https://api.breakdowns.gobarry.co.uk/api/supervisors

### Step 8: Verify Database Connection

Check if backend can connect to MySQL:
```bash
# SSH into server
ssh gobarryco@gobarry.co.uk

# Test MySQL connection
mysql -h localhost -u gobarryco_Gair -p gobarryco_breakdown
# Enter password: Turnip1105!!!!!

# Once in MySQL:
SHOW TABLES;
SELECT COUNT(*) FROM supervisors;
EXIT;
```

### Step 9: Monitor Logs

Check for errors:
```bash
# Passenger/Apache logs
tail -f ~/logs/stderr.log
tail -f ~/logs/stdout.log

# Node.js application logs (if enabled)
tail -f ~/backend/logs/app.log
```

### Step 10: Restart Application

To restart after making changes:
```bash
# Via SSH
touch ~/backend/tmp/restart.txt

# OR via cPanel
# Go to "Setup Node.js App" and click "Restart" button
```

## Troubleshooting

### App Not Starting
```bash
# Check Node.js version
/opt/cpanel/ea-nodejs20/bin/node -v

# Test server manually
cd ~/backend
/opt/cpanel/ea-nodejs20/bin/node server.js

# Should see: "Server running on port 3001"
```

### Database Connection Errors
```bash
# Verify database credentials
cat ~/backend/.env | grep DB_

# Test connection
mysql -h localhost -u gobarryco_Gair -p gobarryco_breakdown
```

### Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill if necessary
kill -9 <PID>
```

### Module Not Found Errors
```bash
# Reinstall dependencies
cd ~/backend
rm -rf node_modules
/opt/cpanel/ea-nodejs20/bin/npm install --production
```

### Passenger Not Starting
```bash
# Check Apache configuration
cat ~/backend/.htaccess

# Restart Passenger
touch ~/backend/tmp/restart.txt

# Check Passenger processes
ps aux | grep -i passenger
```

## Post-Deployment Checklist

- [ ] Backend responds at https://api.breakdowns.gobarry.co.uk/health
- [ ] Database connection working
- [ ] Supervisors endpoint returns data
- [ ] Breakdowns API endpoints working
- [ ] CORS configured for frontend domains
- [ ] Environment variables set correctly
- [ ] Logs are accessible and clean
- [ ] Frontend updated to use cPanel backend URL

## Updating the Backend

To deploy updates:
```bash
# Local machine
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
npm run deploy

# This will:
# 1. Upload changed files via rsync
# 2. Install any new dependencies
# 3. Restart the application
```

## Rolling Back

If something goes wrong:
1. Re-enable Render backend temporarily
2. Update frontend to point back to Render
3. Debug cPanel deployment
4. Re-deploy when ready

## Support

- cPanel URL: https://gobarry.co.uk:2083
- SSH: ssh gobarryco@gobarry.co.uk
- MySQL: localhost (from server only)
- Backend URL: https://api.breakdowns.gobarry.co.uk

---

**Last Updated**: 2025-10-21
**Status**: Ready for deployment
