# Deployment Guide - Go BARRY Breakdown Management System

**Last Updated:** November 10, 2025
**Version:** 3.2.0
**System Status:** Production-Ready

---

## Overview

This document provides complete deployment procedures for the Go BARRY Breakdown Management System running on cPanel infrastructure with PM2 process management and MySQL database.

### Production Architecture

| Component | Technology | URL/Location |
|-----------|-----------|--------------|
| **Frontend** | React + Vite on cPanel | https://breakdowns.gobarry.co.uk |
| **Backend API** | Node.js + Express + PM2 | https://api.breakdowns.gobarry.co.uk |
| **Database** | MySQL 8.0+ | 85.234.151.224:3306 |
| **Authentication** | JWT + bcrypt | N/A |
| **Real-time** | WebSocket (ws) | wss://api.breakdowns.gobarry.co.uk/ws |
| **Process Manager** | PM2 | N/A |
| **Hosting** | cPanel | gobarry.co.uk |

---

## Quick Reference

### Common Deployment Commands

```bash
# Backend Deployment (SSH)
ssh user@85.234.151.224
cd ~/api
npm ci --production
pm2 restart breakdown-backend
pm2 logs breakdown-backend --lines 50

# Frontend Deployment (Local)
cd frontend
npm run build
# Upload frontend/dist/ to cPanel via CyberDuck or File Manager

# Health Check
curl https://api.breakdowns.gobarry.co.uk/api/health
curl https://breakdowns.gobarry.co.uk
```

---

## Pre-Deployment Checklist

### Development Testing
- [ ] All changes tested locally
- [ ] Authentication flow working (login → duty selection → dashboard)
- [ ] Database queries optimized
- [ ] All API endpoints returning correct responses
- [ ] WebSocket connections establishing correctly
- [ ] Error handling implemented

### Code Quality
- [ ] No hardcoded credentials or API keys
- [ ] Input validation implemented (Joi schemas)
- [ ] SQL queries use parameterized statements
- [ ] Console.log statements removed or conditionals used

### Backend Deployment

**Step 1: Connect to Server**
```bash
ssh user@85.234.151.224
cd ~/api
```

**Step 2: Backup Current Code**
```bash
timestamp=$(date +%Y%m%d_%H%M%S)
tar -czf ~/backups/backend_backup_$timestamp.tar.gz ~/api
```

**Step 3: Upload New Code**
```bash
# Option A: Git Pull
git fetch origin && git pull origin main

# Option B: Upload via CyberDuck to /home/username/api/
# Option C: SCP from local machine
scp -r backend/* user@85.234.151.224:~/api/
```

**Step 4: Install Dependencies**
```bash
cd ~/api
npm ci --production  # Production install (no dev dependencies)
```

**Step 5: Verify Configuration**
```bash
# Check .env file exists
ls -la ~/api/.env

# Required variables:
# NODE_ENV=production
# PORT=3001
# DB_HOST=85.234.151.224
# DB_USER=gobarryco_Gair
# DB_PASSWORD=<password>
# DB_NAME=gobarryco_breakdown
# JWT_SECRET=<secret>
# FRONTEND_URL=https://breakdowns.gobarry.co.uk
```

**Step 6: Restart PM2**
```bash
pm2 status
pm2 restart breakdown-backend
pm2 logs breakdown-backend --lines 50
```

**Step 7: Verify Backend Health**
```bash
# Test health endpoint
curl http://localhost:3001/api/health
curl https://api.breakdowns.gobarry.co.uk/api/health

# Test database connection
curl http://localhost:3001/api/health-db
```

### Frontend Deployment

**Step 1: Build Frontend Locally**
```bash
cd frontend
npm install
npm run build
# Creates frontend/dist/
```

**Step 2: Backup Current Frontend**
```bash
ssh user@85.234.151.224
timestamp=$(date +%Y%m%d_%H%M%S)
tar -czf ~/backups/frontend_backup_$timestamp.tar.gz ~/public_html/breakdowns.gobarry.co.uk
```

**Step 3: Upload Build Files**

**Option A: CyberDuck (Recommended)**
1. Connect to 85.234.151.224 via SFTP
2. Navigate to `/home/username/public_html/breakdowns.gobarry.co.uk/`
3. Delete all existing files (except .htaccess)
4. Upload entire contents of `frontend/dist/`

**Option B: cPanel File Manager**
1. Login to cPanel: https://gobarry.co.uk:2083
2. Open File Manager
3. Navigate to public_html/breakdowns.gobarry.co.uk/
4. Delete all files
5. Click Upload and upload frontend/dist/ files

**Step 4: Configure .htaccess**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Step 5: Verify Deployment**
```bash
curl -I https://breakdowns.gobarry.co.uk  # Should return 200 OK
```

### Database Deployment

**Step 1: Test Migration Locally**
```bash
mysql -u root -p gobarryco_breakdown_local < backend/migrations/migration.sql
```

**Step 2: Backup Production Database**
```bash
ssh user@85.234.151.224
mysqldump -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown > ~/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Step 3: Apply Migration via phpMyAdmin**
1. Login: https://gobarry.co.uk:2083/cpsess###/3rdparty/phpMyAdmin/
2. Select `gobarryco_breakdown` database
3. Click "SQL" tab
4. Paste migration SQL
5. Click "Go"

---

## Environment Variables

### Backend .env
```bash
NODE_ENV=production
PORT=3001
DB_HOST=85.234.151.224
DB_USER=gobarryco_Gair
DB_PASSWORD=<password>
DB_NAME=gobarryco_breakdown
JWT_SECRET=<strong-secret-32+-chars>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://breakdowns.gobarry.co.uk
MAX_FILE_SIZE=10485760
```

### Frontend .env
```bash
VITE_API_URL=https://api.breakdowns.gobarry.co.uk
VITE_WS_URL=wss://api.breakdowns.gobarry.co.uk
VITE_ENV=production
```

---

## Monitoring & Health Checks

### PM2 Monitoring
```bash
pm2 status                    # Check process status
pm2 logs breakdown-backend    # View real-time logs
pm2 monit                     # Monitor CPU/memory
pm2 show breakdown-backend    # Detailed process info
```

### Health Endpoints
```bash
curl https://api.breakdowns.gobarry.co.uk/api/health      # Basic health
curl https://api.breakdowns.gobarry.co.uk/api/health-db   # Database check
```

---

## Rollback Procedures

### Rolling Back Backend
```bash
# Restore from backup
ssh user@85.234.151.224
ls -lht ~/backups/backend_backup_*.tar.gz
tar -xzf ~/backups/backend_backup_20251110_120000.tar.gz
mv ~/api ~/api_failed
mv ~/api_backup ~/api
cd ~/api && pm2 restart breakdown-backend
```

### Rolling Back Frontend
```bash
rm -rf ~/public_html/breakdowns.gobarry.co.uk/*
tar -xzf ~/backups/frontend_backup_20251110_120000.tar.gz -C ~/public_html/breakdowns.gobarry.co.uk/
```

---

## Common Issues

### Issue 1: PM2 Process Won't Start
```bash
pm2 logs breakdown-backend --err --lines 50  # Check errors

# Common causes:
node ~/api/server.js                # Check syntax errors
cd ~/api && npm install --production # Install dependencies
pm2 restart breakdown-backend        # Restart after fix
```

### Issue 2: Frontend Shows Blank Page
```bash
# Check browser console (F12)
# Rebuild frontend:
cd frontend && npm run build
# Re-upload dist/

# Clear cache
Hard refresh: Cmd+Shift+R or Ctrl+Shift+R
```

### Issue 3: Database Connection Timeout
```bash
# Test connection
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown

# Check credentials in .env
cat ~/api/.env | grep DB_

# Restart backend
pm2 restart breakdown-backend
```

---

## Post-Deployment Verification

### Immediate Checks (0-5 minutes)
```bash
# 1. Backend is running
curl https://api.breakdowns.gobarry.co.uk/api/health

# 2. Database connected
curl https://api.breakdowns.gobarry.co.uk/api/health-db

# 3. Frontend loads
curl -I https://breakdowns.gobarry.co.uk

# 4. PM2 stable
pm2 status

# 5. No errors in logs
pm2 logs breakdown-backend --lines 20
```

### Functional Tests (5-15 minutes)
1. Open https://breakdowns.gobarry.co.uk
2. Login with test credentials
3. Verify duty selection modal appears
4. Create test breakdown
5. Verify breakdown appears in dashboard

---

**Last Updated:** November 10, 2025
**Document Version:** 3.2.0
**System Status:** Production-Ready
