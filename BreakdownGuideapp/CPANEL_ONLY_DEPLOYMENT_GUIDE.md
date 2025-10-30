# cPanel-ONLY Deployment Guide - 100% Free Hosting
## Go BARRY Breakdown Management System

**Version:** 3.0.0
**Last Updated:** October 27, 2025
**Target:** 100% cPanel-native deployment (no external services)
**Cost:** $0 beyond your existing cPanel hosting plan

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [cPanel Environment Detection](#2-cpanel-environment-detection)
3. [Pre-Deployment Checklist](#3-pre-deployment-checklist)
4. [Free Service Configuration](#4-free-service-configuration)
5. [Database Setup (cPanel MySQL)](#5-database-setup-cpanel-mysql)
6. [Backend Deployment](#6-backend-deployment)
7. [Frontend Deployment](#7-frontend-deployment)
8. [Node.js Application Setup](#8-nodejs-application-setup)
9. [Resource Optimization for Shared Hosting](#9-resource-optimization-for-shared-hosting)
10. [Free SSL & Security](#10-free-ssl--security)
11. [Scheduled Tasks (cPanel Cron)](#11-scheduled-tasks-cpanel-cron)
12. [Testing & Verification](#12-testing--verification)
13. [Troubleshooting cPanel-Specific Issues](#13-troubleshooting-cpanel-specific-issues)
14. [Cost-Free Maintenance](#14-cost-free-maintenance)

---

## 1. Overview & Philosophy

### What This Guide Is
This is the **definitive guide** for deploying Go BARRY using **ONLY** cPanel features - no external hosting services, no paid add-ons, no cloud platforms. Everything runs on your existing cPanel shared or dedicated hosting.

### Key Principles
- **100% Free**: Uses only features included in standard cPanel hosting
- **Self-Contained**: No external dependencies (Render, Vercel, Supabase, etc.)
- **Resource-Conscious**: Optimized for shared hosting limitations
- **Production-Ready**: Full-featured despite being free

### What You Get with cPanel
- **Node.js hosting** via Passenger
- **MySQL database** with phpMyAdmin
- **Free SSL** via Let's Encrypt (AutoSSL)
- **Email service** built-in
- **Cron jobs** for scheduled tasks
- **DNS management** included
- **File management** via GUI + FTP/SSH
- **WebSocket support** (Apache proxy)
- **Backups** using cPanel tools

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                  cPanel Shared Hosting                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   Apache   │  │  Node.js │  │  MySQL Database  │   │
│  │  Frontend  │──│  Backend │──│   (localhost)    │   │
│  │   (port    │  │ (Passenger│  │                  │   │
│  │    80/443) │  │  port 3001)│  │  6-7 tables     │   │
│  └────────────┘  └──────────┘  └──────────────────┘   │
│         │              │                                │
│         └──────────────┴─ WebSocket via Apache Proxy   │
│                                                          │
│  Free SSL (Let's Encrypt) + cPanel Email + Cron Jobs   │
└─────────────────────────────────────────────────────────┘
```

### Hosting Scenarios Covered
1. **Shared Hosting** (512MB-1GB RAM) - Most common, budget-friendly
2. **Dedicated Server with cPanel** (2GB+ RAM) - Better performance, same setup

---

## 2. cPanel Environment Detection

**Duration:** 10 minutes
**Purpose:** Understand your hosting limits before deploying

### 2.1 Check Available RAM

#### Via cPanel Dashboard
1. Login to cPanel: `https://yourdomain.com/cpanel`
2. Look for "CPU and Memory Usage" widget
3. Note values:
   - **Physical Memory Usage**: Current RAM usage
   - **Memory Limit**: Your maximum allocation
   - **Typical values**:
     - Shared hosting: 512MB - 1GB
     - Reseller hosting: 1GB - 2GB
     - Dedicated server: 2GB - 8GB+

#### Via SSH/Terminal (if available)
```bash
# Check total memory
free -h
# Expected output:
#              total        used        free
# Mem:          1.9G        450M        1.4G

# Check your account limits
cat /proc/meminfo | grep MemTotal
# MemTotal:        2048000 kB (example)

# Check current Node.js memory usage (if app running)
ps aux | grep node | awk '{sum+=$6} END {print "Total: " sum/1024 " MB"}'
```

#### What This Means for Your Deployment

| RAM Available | Deployment Strategy | Node.js Memory Limit | Expected Performance |
|---------------|---------------------|----------------------|----------------------|
| **512MB** | Minimal, single instance | `--max-old-space-size=256` | Basic functionality, slower |
| **1GB** | Standard deployment | `--max-old-space-size=512` | Good performance, recommended minimum |
| **2GB+** | Full features enabled | `--max-old-space-size=1024` | Excellent performance |

---

### 2.2 Check Node.js Version Options

#### Via cPanel Node.js Selector
1. Navigate to **"Setup Node.js App"** in cPanel
2. Click **"Create Application"** (don't create yet, just check)
3. View available Node.js versions in dropdown
4. **Required:** Node.js 18.x or higher

#### What to Look For
```
Available Versions:
✓ Node.js 18.17.0 (Recommended)
✓ Node.js 20.5.0 (Best)
✗ Node.js 16.x (Too old)
✗ Node.js 14.x (Too old)
```

#### Via SSH (if available)
```bash
# List available Node.js versions
source ~/.bashrc
nvm list
# Or check system Node.js
node --version
# Expected: v18.x.x or v20.x.x

# Check npm version
npm --version
# Expected: 9.x or 10.x
```

#### If Node.js 18+ Not Available
**Contact your hosting provider:**
```
Subject: Request Node.js 18+ Installation

Hello,

I need Node.js version 18 or higher for my cPanel account to run a modern
Node.js application. The current available versions do not include Node.js 18+.

Could you please:
1. Install Node.js 18.x LTS via cPanel Node.js Selector
2. Enable Passenger support for Node.js 18+

My account: [your_username]
Domain: [your_domain]

Thank you!
```

---

### 2.3 Check MySQL Limits

#### Via cPanel MySQL Databases
1. Navigate to **"MySQL Databases"** in cPanel
2. Check displayed limits:
   - **Maximum Databases**: Usually 5-50 depending on plan
   - **Database Size**: Check current usage
   - **Connection Limit**: Usually 10-25 concurrent connections

#### Via phpMyAdmin
```sql
-- Check maximum connections
SHOW VARIABLES LIKE 'max_connections';
-- Expected: 25-151 depending on hosting

-- Check current connections
SHOW STATUS LIKE 'Threads_connected';
-- Should be < 10 for normal usage

-- Check database size limits
SELECT
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
GROUP BY table_schema;
-- Your account limit may be 100MB-1GB

-- Check allowed operations
SHOW GRANTS FOR CURRENT_USER();
-- Should show ALL PRIVILEGES or CREATE, INSERT, UPDATE, DELETE
```

#### Shared Hosting MySQL Limits (Typical)

| Metric | Shared Hosting | Dedicated Server |
|--------|----------------|------------------|
| **Max Connections** | 10-25 | 100-151 |
| **Max Database Size** | 100MB-500MB | 1GB-Unlimited |
| **Query Timeout** | 30 seconds | 60 seconds |
| **Max Packet Size** | 16MB | 64MB-128MB |

#### Configure Connection Pooling for Limited Connections
We'll optimize for this in the Backend Deployment section.

---

### 2.4 Verify Apache Modules

#### Via cPanel Terminal/SSH
```bash
# List all loaded Apache modules
apachectl -M | grep -E "(rewrite|proxy|headers|deflate|expires|passenger)"

# Expected output:
# rewrite_module (shared)
# proxy_module (shared)
# proxy_http_module (shared)
# headers_module (shared)
# deflate_module (shared)
# expires_module (shared)
# passenger_module (shared)
```

#### Critical Modules Needed

| Module | Purpose | Required? | How to Check |
|--------|---------|-----------|--------------|
| **mod_rewrite** | React Router & API routing | YES | `apachectl -M \| grep rewrite` |
| **mod_proxy** | Backend API proxying | YES | `apachectl -M \| grep proxy` |
| **mod_proxy_http** | HTTP proxy support | YES | Same as above |
| **mod_headers** | CORS & security headers | YES | `apachectl -M \| grep headers` |
| **mod_passenger** | Node.js application hosting | YES | `apachectl -M \| grep passenger` |
| **mod_deflate** | Compression (optional) | NO | `apachectl -M \| grep deflate` |
| **mod_expires** | Cache headers (optional) | NO | `apachectl -M \| grep expires` |

#### If Modules Missing
**Contact hosting provider:**
```
Subject: Request Apache Module Activation

Hello,

I need the following Apache modules enabled for my cPanel account:
- mod_rewrite (URL rewriting)
- mod_proxy & mod_proxy_http (reverse proxy)
- mod_headers (HTTP headers)
- mod_passenger (Node.js applications)

My account: [your_username]

These are standard modules for hosting Node.js applications via cPanel.

Thank you!
```

#### Alternative: Check via .htaccess Error
Create test `.htaccess` in `public_html/`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    # If this works, mod_rewrite is enabled
</IfModule>

<IfModule !mod_rewrite.c>
    # This shows if mod_rewrite is missing
    # Will cause 500 error if rewrite rules attempted
</IfModule>
```

Visit your site. If no error, modules are working.

---

### 2.5 Check Disk Space & Inodes

#### Via cPanel Dashboard
1. Look for **"Disk Usage"** widget
2. Note values:
   - **Disk Space Used / Total**: e.g., 2.5GB / 10GB
   - **Inodes Used / Total**: e.g., 45,000 / 250,000

#### What Are Inodes?
Each file and directory counts as 1 inode. `node_modules/` contains thousands of files, which can exhaust inode limits on shared hosting.

#### Via SSH
```bash
# Check disk space
quota -s
# Or
df -h ~

# Check inode usage (if available)
quota -s -f
# Or check file count
find ~ -type f | wc -l
# Expected: < 100,000 files for smooth operation
```

#### Typical Limits

| Hosting Type | Disk Space | Inodes | Strategy |
|--------------|------------|--------|----------|
| **Shared** | 5-20GB | 50,000-250,000 | Install production deps only |
| **Reseller** | 50-100GB | 250,000-500,000 | Safe for full deployment |
| **Dedicated** | 100GB-1TB+ | Unlimited | No concerns |

#### Optimization Strategies
- **Production dependencies only**: `npm ci --production` (saves 30-50% inodes)
- **Clean up old deployments**: Delete old backup folders
- **Avoid dev tools**: Don't install TypeScript, ESLint, etc. on server

---

### 2.6 Environment Detection Summary

Create this quick reference file:

```bash
# Save as ~/hosting_environment.txt
# Run via SSH: bash << 'EOF' > ~/hosting_environment.txt

echo "=== cPanel Hosting Environment ==="
echo "Date: $(date)"
echo ""
echo "--- System Resources ---"
echo "RAM Total: $(free -h | awk '/^Mem:/{print $2}')"
echo "RAM Used: $(free -h | awk '/^Mem:/{print $3}')"
echo "Disk Space: $(df -h ~ | awk 'NR==2{print $3 " / " $2}')"
echo "Disk Usage %: $(df -h ~ | awk 'NR==2{print $5}')"
echo ""
echo "--- Node.js Environment ---"
echo "Node.js Version: $(node --version 2>/dev/null || echo 'Not found')"
echo "npm Version: $(npm --version 2>/dev/null || echo 'Not found')"
echo ""
echo "--- Database ---"
echo "MySQL Version: $(mysql --version | awk '{print $5}' | cut -d, -f1)"
echo "Max Connections: $(mysql -N -e 'SHOW VARIABLES LIKE "max_connections"' 2>/dev/null | awk '{print $2}' || echo 'Unknown')"
echo ""
echo "--- Apache Modules ---"
apachectl -M 2>/dev/null | grep -E "(rewrite|proxy|headers|passenger)" || echo "Cannot check (permission denied)"
echo ""
echo "=== End Report ==="
# EOF
```

---

## 3. Pre-Deployment Checklist

**Duration:** 15 minutes
**Purpose:** Prepare everything before uploading files

### 3.1 Local Build Verification

#### Build Backend
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend

# Verify package.json has correct start script
cat package.json | grep '"start"'
# Expected: "start": "node server.js" or similar

# Test startup locally
node server.js
# Should start without errors, Ctrl+C to stop

# Check dependencies are production-ready
npm ls --production --depth=0
# Should show only production dependencies
```

#### Build Frontend
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend

# Update .env for production
cat > .env << 'EOF'
VITE_API_URL=https://breakdowns.gobarry.co.uk
VITE_API_BASE_URL=https://breakdowns.gobarry.co.uk/api
VITE_WS_URL=wss://breakdowns.gobarry.co.uk
VITE_ENABLE_AUTH=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=false
EOF

# Build for production
npm run build

# Verify build output
ls -lh dist/
# Expected: index.html, assets/, .htaccess
```

---

### 3.2 Backup Current Production

#### Via cPanel File Manager
1. Login to cPanel
2. Navigate to **File Manager**
3. Go to `public_html/` directory
4. Select all files
5. Click **"Compress"**
6. Create: `backup_$(date +%Y%m%d_%H%M%S).zip`
7. Download to local machine

#### Via SSH (faster for large sites)
```bash
ssh user@yourdomain.com
cd ~
tar -czf backups/full_backup_$(date +%Y%m%d_%H%M%S).tar.gz public_html/ backend/
ls -lh backups/
# Verify backup created
```

#### Backup Database
**Via phpMyAdmin:**
1. Open **phpMyAdmin** from cPanel
2. Select database: `gobarryco_breakdowns`
3. Click **"Export"** tab
4. Method: **Quick**
5. Format: **SQL**
6. Click **"Go"**
7. Save as: `db_backup_$(date +%Y%m%d_%H%M%S).sql`

**Via SSH (recommended):**
```bash
mysqldump -u gobarryco_breakdowns_user -p gobarryco_breakdowns \
  > ~/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh ~/backups/db_backup_*.sql
# Should show file size > 0 bytes
```

---

### 3.3 Create Deployment Package

Create a clean deployment package to upload:

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp

# Create deployment directory
mkdir -p deployment_package

# Copy backend (exclude node_modules)
rsync -av --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  backend/ deployment_package/backend/

# Copy frontend build
cp -r frontend/dist/* deployment_package/public_html/

# Create README
cat > deployment_package/DEPLOY_README.txt << 'EOF'
Go BARRY Deployment Package
============================

Backend:
  Upload backend/ to ~/backend/ on server
  Run: npm ci --production
  Configure: .env file (see .env.example)

Frontend:
  Upload public_html/ contents to ~/public_html/
  Files include: index.html, assets/, .htaccess

Next Steps:
  1. Upload files via FTP or File Manager
  2. Set up database (see CPANEL_ONLY_DEPLOYMENT_GUIDE.md)
  3. Configure Node.js app in cPanel
  4. Test deployment

EOF

# Create zip for easy upload
cd deployment_package
zip -r ../go_barry_deployment_$(date +%Y%m%d).zip .
cd ..

echo "Deployment package created: go_barry_deployment_$(date +%Y%m%d).zip"
```

---

## 4. Free Service Configuration

**Duration:** 10 minutes
**Purpose:** Configure all free cPanel services

### 4.1 Free SSL (Let's Encrypt via cPanel)

#### AutoSSL (Automatic - Recommended)
1. Login to cPanel
2. Navigate to **"SSL/TLS Status"**
3. Find your domain: `breakdowns.gobarry.co.uk`
4. Click **"Run AutoSSL"**
5. Wait 2-5 minutes for installation
6. Verify status shows **"✓ Valid"**

#### Check SSL Certificate
```bash
# Via command line
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk < /dev/null 2>/dev/null | grep -A 2 "Verify return code"
# Expected: Verify return code: 0 (ok)

# Check expiration
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk 2>/dev/null | openssl x509 -noout -dates
# Should show notAfter date 90 days in future
```

#### Manual SSL (if AutoSSL fails)
1. Navigate to **"SSL/TLS"** → **"Manage SSL Sites"**
2. Select domain: `breakdowns.gobarry.co.uk`
3. If certificate missing:
   - Click **"Install an SSL Certificate"**
   - Select **"Browse Certificates"**
   - Choose **"Let's Encrypt"**
   - Click **"Install"**

#### Force HTTPS Redirect
Already configured in `.htaccess`, but verify:
```apache
# In public_html/.htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

---

### 4.2 cPanel Email (No External SMTP Needed)

#### Create Email Account for Notifications
1. Navigate to **"Email Accounts"** in cPanel
2. Click **"Create"**
3. Fill in:
   - **Email:** `noreply@gobarry.co.uk`
   - **Password:** Generate strong password
   - **Storage Space:** 250MB (sufficient)
4. Click **"Create"**

#### Email Settings for Application
```javascript
// In backend configuration (services/emailService.js)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.gobarry.co.uk', // cPanel mail server
  port: 465, // SSL
  secure: true,
  auth: {
    user: 'noreply@gobarry.co.uk',
    pass: process.env.EMAIL_PASSWORD // Store in .env
  }
});

// Usage
await transporter.sendMail({
  from: '"Go BARRY System" <noreply@gobarry.co.uk>',
  to: 'supervisor@gonortheast.co.uk',
  subject: 'Breakdown Alert',
  text: 'Vehicle 1234 has broken down...'
});
```

#### Add to Backend .env
```bash
# Email Configuration (cPanel Email)
EMAIL_HOST=mail.gobarry.co.uk
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@gobarry.co.uk
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="Go BARRY System <noreply@gobarry.co.uk>"
```

#### Test Email
**Via cPanel Webmail:**
1. Navigate to **"Email Accounts"**
2. Click **"Check Email"** next to `noreply@gobarry.co.uk`
3. Opens Roundcube/Horde webmail
4. Send test email to yourself

**Via Command Line:**
```bash
# Test SMTP connection
telnet mail.gobarry.co.uk 465
# Should connect (Ctrl+] then quit to exit)

# Or use swaks
swaks --to your@email.com \
  --from noreply@gobarry.co.uk \
  --server mail.gobarry.co.uk \
  --auth-user noreply@gobarry.co.uk \
  --auth-password 'your_password'
```

---

### 4.3 Free DNS Management in cPanel

#### Configure Subdomain
1. Navigate to **"Subdomains"** in cPanel
2. Click **"Create Subdomain"**
3. Fill in:
   - **Subdomain:** `breakdowns`
   - **Domain:** `gobarry.co.uk`
   - **Document Root:** `/home/username/public_html`
4. Click **"Create"**

#### Verify DNS Records
1. Navigate to **"Zone Editor"** in cPanel
2. Find `breakdowns.gobarry.co.uk`
3. Verify records:
   - **A Record:** Points to server IP
   - **CNAME** (optional): If using alias

#### Test DNS Resolution
```bash
# Check A record
dig breakdowns.gobarry.co.uk +short
# Should return your server IP

# Check from different location
nslookup breakdowns.gobarry.co.uk 8.8.8.8
# Should resolve correctly

# Check propagation (optional)
# Visit: https://www.whatsmydns.net/#A/breakdowns.gobarry.co.uk
```

---

### 4.4 Free Backup Options in cPanel

#### Enable Automated Backups
1. Navigate to **"Backup"** in cPanel
2. Check current backup status
3. Options available:
   - **Full Backup:** Download entire account
   - **Partial Backup:** Select specific directories/databases
   - **Restore:** Restore from backup

#### Schedule Backups (if supported)
Some cPanel configurations allow scheduled backups. Check with your host.

#### Manual Backup Script
Create `~/scripts/backup.sh`:
```bash
#!/bin/bash
# Go BARRY Manual Backup Script

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup files
echo "Backing up files..."
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
  ~/public_html \
  ~/backend

# Backup database
echo "Backing up database..."
mysqldump -u gobarryco_breakdowns_user -p$DB_PASSWORD gobarryco_breakdowns \
  > $BACKUP_DIR/database_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "database_*.sql" -mtime +7 -delete

echo "Backup complete: $BACKUP_DIR"
ls -lh $BACKUP_DIR | tail -5
```

Make executable:
```bash
chmod +x ~/scripts/backup.sh
```

We'll schedule this via cron in Section 11.

---

## 5. Database Setup (cPanel MySQL)

**Duration:** 20 minutes
**Purpose:** Create and configure MySQL database

### 5.1 Create Database

#### Via cPanel MySQL Databases
1. Navigate to **"MySQL Databases"** in cPanel
2. **Create Database:**
   - Database Name: `breakdowns` (cPanel adds prefix: `username_breakdowns`)
   - Click **"Create Database"**
3. **Create User:**
   - Username: `breakdowns_user` (becomes `username_breakdowns_user`)
   - Password: Click **"Password Generator"** for strong password (save it!)
   - Password Strength: Must be "Very Strong" (100)
   - Click **"Create User"**
4. **Add User to Database:**
   - User: Select `username_breakdowns_user`
   - Database: Select `username_breakdowns`
   - Privileges: **ALL PRIVILEGES**
   - Click **"Add"**

#### Verify Creation
```bash
# Via SSH
mysql -u username_breakdowns_user -p -e "SHOW DATABASES;"
# Should list username_breakdowns

mysql -u username_breakdowns_user -p username_breakdowns -e "SELECT 1;"
# Should return: 1
```

---

### 5.2 Import Schema

#### Quick Schema Migration
**Via phpMyAdmin:**
1. Open **phpMyAdmin** from cPanel
2. Select database: `username_breakdowns`
3. Click **"SQL"** tab
4. Copy and paste the schema below
5. Click **"Go"**

#### Production Schema (MySQL-Optimized)
```sql
-- Go BARRY Database Schema for cPanel MySQL
-- Optimized for shared hosting (512MB-1GB RAM)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Supervisors table
CREATE TABLE IF NOT EXISTS `supervisors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Washington',
  `role` enum('admin','supervisor','manager') COLLATE utf8mb4_unicode_ci DEFAULT 'supervisor',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `badge_number` (`badge_number`),
  KEY `idx_badge_number` (`badge_number`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Breakdowns table
CREATE TABLE IF NOT EXISTS `breakdowns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `breakdown_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fleet_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supervisor_badge` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supervisor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_description` text COLLATE utf8mb4_unicode_ci,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `issue_category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` enum('STOP','AMBER','CONTINUE','CHANGEOVER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `wizard_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wizard_decision` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wizard_assessment_data` json DEFAULT NULL,
  `depot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `returned_to_service` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `breakdown_id` (`breakdown_id`),
  KEY `idx_breakdown_id` (`breakdown_id`),
  KEY `idx_fleet_no` (`fleet_no`),
  KEY `idx_status` (`status`),
  KEY `idx_severity` (`severity`),
  KEY `idx_supervisor_badge` (`supervisor_badge`),
  KEY `idx_depot` (`depot`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activities table
CREATE TABLE IF NOT EXISTS `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `breakdown_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fleet_no` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supervisor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supervisor_badge` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `activity_data` json DEFAULT NULL,
  `wizard_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wizard_decision` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_breakdown_id` (`breakdown_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_supervisor_badge` (`supervisor_badge`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard Progress table
CREATE TABLE IF NOT EXISTS `wizard_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `breakdown_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wizard_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_step` int DEFAULT '1',
  `step_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_breakdown_id` (`breakdown_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fleet Vehicles table
CREATE TABLE IF NOT EXISTS `fleet_vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fleet_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `make` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depot` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `vehicle_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fleet_no` (`fleet_no`),
  KEY `idx_fleet_no` (`fleet_no`),
  KEY `idx_depot` (`depot`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supervisor Sessions table
CREATE TABLE IF NOT EXISTS `supervisor_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supervisor_badge` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supervisor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_supervisor_badge` (`supervisor_badge`),
  KEY `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
```

#### Verify Tables
```sql
-- Check tables were created
SHOW TABLES;
-- Expected: 6 tables

-- Check structure
DESCRIBE breakdowns;

-- Check indexes
SHOW INDEX FROM breakdowns;
-- Expected: 7+ indexes

-- Verify character set
SELECT
  table_name,
  table_collation
FROM information_schema.tables
WHERE table_schema = 'username_breakdowns';
-- Expected: utf8mb4_unicode_ci for all
```

---

### 5.3 Optimize for Shared Hosting

#### Connection Pooling Configuration
**File:** `backend/config/database.js`

```javascript
import mysql from 'mysql2/promise';

// Optimized for shared hosting (10-25 connection limit)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // Low limit for shared hosting
  maxIdle: 2, // Keep only 2 idle connections
  idleTimeout: 60000, // Close idle connections after 1 minute
  queueLimit: 10, // Max 10 queued requests
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✓ Database connection pool established');
    conn.release();
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });

export default pool;
```

#### Query Optimization for Limited Resources
```javascript
// Always use LIMIT clauses
const getRecentBreakdowns = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM breakdowns WHERE status = ? ORDER BY created_at DESC LIMIT 50',
    ['active']
  );
  return rows;
};

// Use indexes in WHERE clauses
const getBreakdownByFleet = async (fleetNo) => {
  const [rows] = await pool.execute(
    'SELECT * FROM breakdowns WHERE fleet_no = ? AND status = ?',
    [fleetNo, 'active']
  );
  return rows[0];
};

// Avoid SELECT * in production
const getBreakdownSummary = async () => {
  const [rows] = await pool.execute(
    'SELECT id, breakdown_id, fleet_no, severity, status, created_at FROM breakdowns WHERE status = ? LIMIT 100',
    ['active']
  );
  return rows;
};
```

---

## 6. Backend Deployment

**Duration:** 20 minutes
**Purpose:** Deploy Node.js application to cPanel

### 6.1 Upload Backend Files

#### Via cPanel File Manager (Easiest)
1. Login to cPanel
2. Navigate to **File Manager**
3. Go to **Home Directory** (not `public_html`)
4. Click **"Upload"**
5. Select files from local `deployment_package/backend/`
6. Upload progress bar shows when complete
7. Extract if you uploaded a zip:
   - Right-click zip file → **"Extract"**
   - Destination: `/home/username/backend/`

#### Via FTP (FileZilla/Similar)
```
Host: ftp.gobarry.co.uk (or server IP)
Username: your_cpanel_username
Password: your_cpanel_password
Port: 21 (or 22 for SFTP)

Local Path: /local/deployment_package/backend/
Remote Path: /home/username/backend/
```

Drag and drop entire `backend/` folder.

#### Via rsync/scp (SSH required)
```bash
# Using rsync (fastest, resumes on failure)
rsync -avz --progress \
  /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend/ \
  username@gobarry.co.uk:~/backend/

# Using scp
scp -r /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend/* \
  username@gobarry.co.uk:~/backend/
```

#### Verify Upload
```bash
# Via cPanel Terminal or SSH
ls -la ~/backend/
# Expected: server.js, package.json, routes/, services/, etc.

# Count files
find ~/backend -type f | wc -l
# Expected: 50-100 files

# Check critical files exist
ls ~/backend/server.js ~/backend/package.json ~/backend/.htaccess
# All should exist
```

---

### 6.2 Configure .env File

#### Create Production .env
**Via cPanel File Manager:**
1. Navigate to `~/backend/`
2. Click **"+ File"**
3. Name: `.env`
4. Right-click → **"Edit"**
5. Paste configuration below
6. Save

**Production .env Template:**
```bash
# Node.js Environment
NODE_ENV=production

# Server Configuration
PORT=3001

# Database Configuration (cPanel MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=username_breakdowns
DB_USER=username_breakdowns_user
DB_PASSWORD=your_generated_strong_password

# API Configuration
API_BASE_URL=https://breakdowns.gobarry.co.uk/api
APP_URL=https://breakdowns.gobarry.co.uk
ALLOWED_ORIGINS=https://breakdowns.gobarry.co.uk,https://gobarry.co.uk

# Security (generate with: openssl rand -base64 64)
SESSION_SECRET=your_64_character_random_string_here
JWT_SECRET=your_64_character_random_string_here

# Email Configuration (cPanel Email)
EMAIL_HOST=mail.gobarry.co.uk
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@gobarry.co.uk
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="Go BARRY System <noreply@gobarry.co.uk>"

# Memory Optimization for Shared Hosting
NODE_OPTIONS=--max-old-space-size=512

# Logging
LOG_LEVEL=warn
LOG_FILE=/home/username/logs/app.log

# Feature Flags
ENABLE_WEBSOCKETS=true
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

#### Generate Secrets
```bash
# On your local machine or via SSH
openssl rand -base64 64
# Copy output to SESSION_SECRET

openssl rand -base64 64
# Copy output to JWT_SECRET
```

#### Set Correct Permissions
```bash
# Via SSH
chmod 600 ~/backend/.env
ls -la ~/backend/.env
# Expected: -rw------- (only owner can read/write)
```

---

### 6.3 Install Dependencies

#### Via cPanel Terminal (Recommended)
1. Navigate to **Terminal** in cPanel
2. Change to backend directory:
   ```bash
   cd ~/backend
   ```
3. Install production dependencies:
   ```bash
   npm ci --production --no-optional
   ```
4. Wait for completion (5-10 minutes on shared hosting)

#### Expected Output
```
npm WARN deprecated <some packages>
added 89 packages in 4m

15 packages are looking for funding
  run `npm fund` for details
```

#### Verify Installation
```bash
# Check node_modules exists
ls -la ~/backend/node_modules/ | head -20
# Should show many packages

# Check critical dependencies
ls ~/backend/node_modules/ | grep -E "express|mysql2|ws|cors|bcrypt|jsonwebtoken"
# All should exist

# Verify package count
ls ~/backend/node_modules/ | wc -l
# Expected: 80-100 packages (production only)
```

#### Troubleshooting Installation Issues
**Error: "EACCES: permission denied"**
```bash
# Fix ownership
chown -R $USER:$USER ~/backend/node_modules
```

**Error: "Unsupported platform"**
```bash
# Some packages need native compilation
npm install --build-from-source
# Or skip optional deps
npm ci --production --no-optional --ignore-scripts
```

**Error: "Out of memory"**
```bash
# Increase Node.js memory for installation
NODE_OPTIONS=--max-old-space-size=1024 npm ci --production
```

---

### 6.4 Create .htaccess for Backend

#### Backend .htaccess Configuration
**File:** `~/backend/.htaccess`

```apache
# Go BARRY Backend - Passenger Configuration
# This routes all API requests through Node.js via Passenger

# Enable Passenger
PassengerEnabled on
PassengerAppType node
PassengerStartupFile server.js
PassengerAppRoot /home/username/backend

# Node.js executable (check with: which node)
PassengerNodejs /usr/bin/node

# Environment
SetEnv NODE_ENV production
SetEnv PORT 3001

# Passenger Performance Settings for Shared Hosting
PassengerMinInstances 1
PassengerMaxPoolSize 2
PassengerPoolIdleTime 300
PassengerMaxRequestQueueSize 50
PassengerStartTimeout 90
PassengerEnabled on

# Memory Limits
PassengerMemoryLimit 512

# Logging
PassengerLogLevel 3
PassengerLogFile /home/username/logs/passenger.log

# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"

# CORS for API
Header always set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Allow-Credentials "true"

# Handle OPTIONS requests
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# WebSocket Support
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*)$ ws://localhost:3001/$1 [P,L]

# Forward other requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

**Important:** Replace `/home/username/` with your actual cPanel username path.

#### Find Your Node.js Path
```bash
# Via SSH or cPanel Terminal
which node
# Output example: /usr/bin/node or /home/username/.nvm/versions/node/v18.17.0/bin/node

# Update .htaccess with this path
```

---

### 6.5 Test Backend Startup

#### Manual Test
```bash
# Via SSH/Terminal
cd ~/backend

# Start server manually (foreground)
node server.js

# Expected output:
# 🚀 Backend server starting...
# ✓ Environment: production
# ✓ Database connection established
# ✓ Loading route modules...
# ✓ 14 route modules loaded
# ✓ WebSocket server initialized
# 🚀 Backend server running on port 3001

# Press Ctrl+C to stop
```

#### Check for Errors
Common startup errors:

**Error: "Cannot find module"**
```bash
# Missing dependency
npm install [module_name]
```

**Error: "EADDRINUSE" (port in use)**
```bash
# Check what's using port 3001
lsof -i :3001
# Kill process or change PORT in .env
```

**Error: "Database connection failed"**
```bash
# Test database connection
mysql -u username_breakdowns_user -p username_breakdowns -e "SELECT 1;"
# If fails, check .env credentials
```

**Error: "Out of memory"**
```bash
# Check .env has NODE_OPTIONS
cat .env | grep NODE_OPTIONS
# Should be: NODE_OPTIONS=--max-old-space-size=512
```

---

## 7. Frontend Deployment

**Duration:** 15 minutes
**Purpose:** Deploy React SPA to public_html

### 7.1 Upload Frontend Build

#### Via cPanel File Manager
1. Login to cPanel
2. Navigate to **File Manager**
3. Go to `public_html/`
4. **Delete old files** (keep backups!):
   - Select all files EXCEPT `backend/` directory
   - Click **"Delete"**
5. Upload frontend build:
   - Click **"Upload"**
   - Select all files from `deployment_package/public_html/`
   - Upload (may take 5-10 minutes)

#### Via FTP
```
Local Path: /local/deployment_package/public_html/
Remote Path: /home/username/public_html/
```

Upload:
- `index.html`
- `assets/` (entire directory)
- `.htaccess`
- `dashboards/` (if exists)
- Any static files (logos, etc.)

#### Via rsync
```bash
# Sync frontend (deletes old files, keeps new)
rsync -avz --delete \
  /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend/dist/ \
  username@gobarry.co.uk:~/public_html/
```

#### Verify Upload
```bash
# Check files exist
ls -la ~/public_html/
# Expected: index.html, assets/, .htaccess

# Check index.html size
ls -lh ~/public_html/index.html
# Should be > 10KB

# Check assets folder
ls ~/public_html/assets/ | wc -l
# Expected: 20-50 files
```

---

### 7.2 Configure Frontend .htaccess

#### Frontend .htaccess (React Router + API Proxy)
**File:** `~/public_html/.htaccess`

```apache
# Go BARRY Frontend - React SPA with API Proxy
# This configures Apache for React Router and proxies API requests to backend

# Enable Rewrite Engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Force HTTPS (Free SSL)
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Proxy API requests to backend Node.js app
    RewriteCond %{REQUEST_URI} ^/api/ [NC]
    RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

    # WebSocket proxy for real-time updates
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^ws/(.*)$ ws://localhost:3001/ws/$1 [P,L]

    # React Router - Don't rewrite files that exist
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l

    # Send all non-existent paths to index.html
    RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header set X-Frame-Options "SAMEORIGIN"

    # Prevent MIME type sniffing
    Header set X-Content-Type-Options "nosniff"

    # Enable XSS filter
    Header set X-XSS-Protection "1; mode=block"

    # Force HTTPS (HSTS)
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # CORS (allow frontend to access backend)
    Header set Access-Control-Allow-Origin "https://breakdowns.gobarry.co.uk"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Compression (if mod_deflate available)
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On

    # Images - long cache (1 year)
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"

    # CSS and JavaScript - medium cache (1 month)
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"

    # HTML - no cache (always fresh)
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Error Pages
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html

# Prevent directory browsing
Options -Indexes

# Protect sensitive files
<FilesMatch "(^#.*#|\.(bak|conf|dist|fla|inc|ini|log|psd|sh|sql|sw[op])|~)$">
    Order allow,deny
    Deny from all
    Satisfy All
</FilesMatch>
```

---

### 7.3 Verify Frontend Configuration

#### Test Static Files
```bash
# Check index.html loads
curl -I https://breakdowns.gobarry.co.uk
# Expected: HTTP/1.1 200 OK

# Check assets load
curl -I https://breakdowns.gobarry.co.uk/assets/index-*.js
# Expected: HTTP/1.1 200 OK

# Check .htaccess syntax
apachectl configtest 2>&1 | grep -i syntax
# Expected: Syntax OK
```

#### Test HTTP to HTTPS Redirect
```bash
# Should redirect to HTTPS
curl -I http://breakdowns.gobarry.co.uk
# Expected:
# HTTP/1.1 301 Moved Permanently
# Location: https://breakdowns.gobarry.co.uk/
```

#### Test React Router
```bash
# Direct route access should work
curl -I https://breakdowns.gobarry.co.uk/dashboard
# Expected: HTTP/1.1 200 OK (serves index.html)
```

---

## 8. Node.js Application Setup

**Duration:** 15 minutes
**Purpose:** Configure cPanel to run Node.js app via Passenger

### 8.1 Create Node.js Application in cPanel

#### Via cPanel Node.js Selector
1. Navigate to **"Setup Node.js App"** in cPanel
2. Click **"Create Application"**
3. Configure application:
   - **Node.js version:** Select **18.17.0** or higher
   - **Application mode:** **Production**
   - **Application root:** `/home/username/backend`
   - **Application URL:** Leave blank (handled by .htaccess)
   - **Application startup file:** `server.js`
   - **Passenger log file:** `/home/username/logs/passenger.log`

4. **Environment Variables** (click "Add Variable" for each):
   ```
   NODE_ENV = production
   PORT = 3001
   ```

5. Click **"Create"**

#### Verify Creation
- cPanel should show: "Application created successfully"
- Status: **Running** (green indicator)
- PID: Shows process ID (e.g., 12345)

---

### 8.2 Configure Environment Variables

#### Add All Environment Variables in cPanel
Click **"Edit"** on your Node.js app, then add these variables:

| Variable | Value | Note |
|----------|-------|------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3001` | Backend port |
| `DB_HOST` | `localhost` | cPanel MySQL |
| `DB_NAME` | `username_breakdowns` | Your database |
| `DB_USER` | `username_breakdowns_user` | Database user |
| `DB_PASSWORD` | `your_password` | From MySQL setup |
| `API_BASE_URL` | `https://breakdowns.gobarry.co.uk/api` | Public API URL |
| `APP_URL` | `https://breakdowns.gobarry.co.uk` | Frontend URL |
| `SESSION_SECRET` | `your_64_char_secret` | From .env |
| `JWT_SECRET` | `your_64_char_secret` | From .env |
| `NODE_OPTIONS` | `--max-old-space-size=512` | Memory limit |

**Note:** cPanel Node.js Selector environment variables take precedence over `.env` file.

---

### 8.3 Start Application

#### Via cPanel Node.js Selector
1. Find your application in the list
2. Click **"Restart"** button
3. Wait for status to show **"Running"**
4. Check "Uptime" increases

#### Via Command Line (Alternative)
```bash
# Create restart trigger
touch ~/backend/tmp/restart.txt

# Passenger detects this file and restarts app

# Check if restarted
tail -f ~/logs/passenger.log
# Should show: "Starting application..."
```

---

### 8.4 Verify Application Running

#### Check Application Status
```bash
# Via cPanel Terminal or SSH
passenger-status
# Expected output:
# Version : 6.x.x
# Date    : 2025-10-27 12:34:56
# Instance: 1
#   PID     : 12345
#   CPU     : 0%
#   Memory  : 45 MB
#   Requests: 0
```

#### Test Health Endpoint
```bash
# Internal test (localhost)
curl http://localhost:3001/api/health

# External test (public URL)
curl https://breakdowns.gobarry.co.uk/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:34:56.789Z",
  "database": "connected",
  "routes": 165,
  "websocket": "active"
}
```

---

## 9. Resource Optimization for Shared Hosting

**Duration:** 10 minutes
**Purpose:** Optimize for 512MB-1GB RAM limits

### 9.1 Memory-Efficient Node.js Configuration

#### Update Backend Memory Settings
**File:** `~/backend/server.js` (add at top)

```javascript
// Memory optimization for shared hosting
if (process.env.NODE_ENV === 'production') {
  // Limit heap size
  const maxMemory = 512; // MB
  const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  if (usedMemory > maxMemory * 0.8) {
    console.warn(`⚠️  High memory usage: ${usedMemory.toFixed(2)}MB / ${maxMemory}MB`);
    // Force garbage collection (if available)
    if (global.gc) {
      global.gc();
    }
  }

  // Memory monitoring interval
  setInterval(() => {
    const mem = process.memoryUsage();
    const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);

    if (heapUsed / heapTotal > 0.9) {
      console.error(`🔴 Memory critical: ${heapUsed}MB / ${heapTotal}MB`);
    }
  }, 60000); // Check every minute
}
```

---

### 9.2 Database Connection Pooling

Already configured in Section 5.3, but verify:

```javascript
// backend/config/database.js
const pool = mysql.createPool({
  // ... other config
  connectionLimit: 5, // CRITICAL for shared hosting
  maxIdle: 2,
  idleTimeout: 60000,
  queueLimit: 10
});
```

#### Monitor Active Connections
```sql
-- Run in phpMyAdmin
SHOW STATUS LIKE 'Threads_connected';
-- Should be < 10 (your app uses max 5)

-- Check if hitting limits
SHOW STATUS LIKE 'Max_used_connections';
-- Should be well below max_connections limit
```

---

### 9.3 Static File Caching

#### Implement In-Memory Cache
**File:** `backend/middleware/cache.js`

```javascript
// Simple in-memory cache for shared hosting
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

export function cacheMiddleware(duration = CACHE_TTL) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expires) {
      // Return cached response
      return res.json(cached.data);
    }

    // Override res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Cache successful responses only
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          expires: Date.now() + duration
        });

        // Limit cache size (shared hosting memory constraint)
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }

      return originalJson(data);
    };

    next();
  };
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expires) {
      cache.delete(key);
    }
  }
}, 60000); // Every minute
```

#### Use in Routes
```javascript
import { cacheMiddleware } from './middleware/cache.js';

// Cache static data endpoints
router.get('/api/fleet/vehicles', cacheMiddleware(600000), async (req, res) => {
  // Data cached for 10 minutes
  const vehicles = await getFleetVehicles();
  res.json(vehicles);
});

// Cache activity feed
router.get('/api/activity/feed', cacheMiddleware(30000), async (req, res) => {
  // Cached for 30 seconds (fresher data)
  const activities = await getActivities();
  res.json(activities);
});
```

---

### 9.4 Passenger Optimization

#### Optimized .htaccess Settings
**File:** `~/backend/.htaccess` (update these lines)

```apache
# Shared hosting optimization (512MB-1GB RAM)
PassengerMinInstances 1        # Keep 1 instance alive always
PassengerMaxPoolSize 2         # Max 2 instances (conservative)
PassengerPoolIdleTime 300      # Keep alive for 5 minutes
PassengerMaxRequestQueueSize 50 # Queue max 50 requests
PassengerStartTimeout 90       # Allow 90 seconds to start
PassengerMemoryLimit 512       # Hard limit 512MB per instance

# For dedicated server (2GB+ RAM), use:
# PassengerMinInstances 2
# PassengerMaxPoolSize 6
# PassengerMemoryLimit 1024
```

#### Passenger Prestart (Keep App Warm)
```apache
# Add to .htaccess to prevent cold starts
PassengerPreStart https://breakdowns.gobarry.co.uk/api/health
```

This pings the health endpoint on Apache start, keeping the app loaded.

---

### 9.5 Response Compression

#### Enable Gzip Compression
**File:** `backend/server.js`

```javascript
import compression from 'compression';

// Add after other middleware
app.use(compression({
  level: 6, // Compression level (1-9, 6 is balanced)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

Install dependency:
```bash
cd ~/backend
npm install compression
```

---

## 10. Free SSL & Security

**Duration:** 10 minutes
**Purpose:** Enable HTTPS and security headers

### 10.1 Install Free SSL Certificate

#### AutoSSL (Automatic - Recommended)
Already configured in Section 4.1, but verify:

1. Navigate to **"SSL/TLS Status"** in cPanel
2. Check `breakdowns.gobarry.co.uk` shows **"✓ Valid"**
3. If not, click **"Run AutoSSL"**

#### Certificate Auto-Renewal
AutoSSL automatically renews certificates 30 days before expiration. No action needed.

#### Monitor Certificate Expiration
```bash
# Check SSL expiration date
openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk 2>/dev/null | openssl x509 -noout -dates

# Expected output:
# notBefore=Oct 27 00:00:00 2025 GMT
# notAfter=Jan 25 23:59:59 2026 GMT (90 days)
```

Create a reminder to check every 60 days (optional).

---

### 10.2 Security Headers (Already Configured)

Security headers are set in `.htaccess` files (see Sections 6.4 and 7.2).

#### Verify Security Headers
```bash
# Test security headers
curl -I https://breakdowns.gobarry.co.uk

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

---

### 10.3 Additional Security Measures

#### Disable Directory Listing
**File:** `~/public_html/.htaccess` (already included)
```apache
Options -Indexes
```

#### Protect Sensitive Files
**File:** `~/public_html/.htaccess` (already included)
```apache
<FilesMatch "(^#.*#|\.(bak|conf|dist|inc|ini|log|sql)|~)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

#### Block Common Exploits
**File:** `~/public_html/.htaccess` (add if not present)
```apache
# Block SQL injection attempts
RewriteCond %{QUERY_STRING} [a-zA-Z0-9_]=http:// [OR]
RewriteCond %{QUERY_STRING} [a-zA-Z0-9_]=(\.\.//?)+ [OR]
RewriteCond %{QUERY_STRING} [a-zA-Z0-9_]=/([a-z0-9_.]//?)+ [NC]
RewriteRule ^(.*)$ - [F,L]

# Block common exploit requests
RewriteCond %{REQUEST_URI} (\\|\.\.\.|\.\./|~|<|>|!|,|;|\(|\)|\[|\]|\{|\}|@@|&|\|) [NC,OR]
RewriteCond %{HTTP_USER_AGENT} (libwww-perl|wget|python|nikto|curl|scan|java|winhttp|clshttp|loader) [NC,OR]
RewriteCond %{HTTP_USER_AGENT} (%0A|%0D|%27|%3C|%3E|%00) [NC,OR]
RewriteCond %{HTTP_USER_AGENT} (;|<|>|'|\"|\)|\(|%0A|%0D|%22|%27|%28|%3C|%3E|%00).*(libwww-perl|wget|python|nikto|curl|scan|java|winhttp|HTTrack|clshttp|archiver|loader|email|harvest|extract|grab|miner) [NC]
RewriteRule ^(.*)$ - [F,L]
```

---

## 11. Scheduled Tasks (cPanel Cron)

**Duration:** 5 minutes
**Purpose:** Automate backups and maintenance

### 11.1 Configure Cron Jobs

#### Via cPanel Cron Jobs Interface
1. Navigate to **"Cron Jobs"** in cPanel
2. Select **"Common Settings"** → **"Once Per Day"** (for backups)
3. Add cron jobs:

#### Daily Backup (2:00 AM)
```
Minute: 0
Hour: 2
Day: *
Month: *
Weekday: *
Command: /home/username/scripts/backup.sh >> /home/username/logs/backup.log 2>&1
```

#### Restart Node.js App (Weekly, Sunday 3:00 AM)
```
Minute: 0
Hour: 3
Day: *
Month: *
Weekday: 0
Command: touch /home/username/backend/tmp/restart.txt
```

#### Clean Old Logs (Daily, 4:00 AM)
```
Minute: 0
Hour: 4
Day: *
Month: *
Weekday: *
Command: find /home/username/logs -name "*.log" -mtime +7 -delete
```

#### Database Optimization (Weekly, Sunday 4:00 AM)
```
Minute: 0
Hour: 4
Day: *
Month: *
Weekday: 0
Command: mysql -u username_breakdowns_user -p'password' username_breakdowns -e "OPTIMIZE TABLE breakdowns, activities, wizard_progress, supervisor_sessions;"
```

---

### 11.2 Backup Script (from Section 4.4)

Ensure backup script exists and is executable:

```bash
chmod +x ~/scripts/backup.sh

# Test manually
~/scripts/backup.sh

# Check output
ls -lh ~/backups/
# Should show latest backup files
```

---

### 11.3 Monitor Cron Job Execution

#### Check Cron Logs
```bash
# View cron execution log
tail -f ~/logs/backup.log

# Check last backup
ls -lth ~/backups/ | head -5
```

#### Email Notifications
cPanel automatically emails you if cron jobs fail (check your cPanel email).

---

## 12. Testing & Verification

**Duration:** 30 minutes
**Purpose:** Comprehensive testing

### 12.1 Backend Health Check

```bash
# Test health endpoint
curl https://breakdowns.gobarry.co.uk/api/health

# Expected:
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:34:56.789Z",
  "database": {
    "status": "connected",
    "type": "mysql"
  },
  "routes": 165,
  "websocket": "active",
  "memory": {
    "used": 45.6,
    "total": 512
  }
}
```

---

### 12.2 Frontend Testing

#### Load Homepage
```bash
curl -I https://breakdowns.gobarry.co.uk
# Expected: HTTP/1.1 200 OK
```

#### Test in Browser
1. Visit `https://breakdowns.gobarry.co.uk`
2. Should load login page without errors
3. Open DevTools Console (F12)
4. No JavaScript errors
5. Network tab shows API requests succeeding

---

### 12.3 Authentication Flow

```bash
# Test login
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "badge": "AG003",
    "password": "your_password"
  }'

# Expected:
{
  "success": true,
  "token": "eyJhbG...",
  "user": {
    "badge": "AG003",
    "name": "Anthony Gair",
    "role": "admin"
  }
}
```

---

### 12.4 Database Queries

```sql
-- Via phpMyAdmin

-- Check record counts
SELECT
  (SELECT COUNT(*) FROM supervisors) as supervisors,
  (SELECT COUNT(*) FROM breakdowns) as breakdowns,
  (SELECT COUNT(*) FROM activities) as activities;

-- Test query performance
SELECT * FROM breakdowns WHERE status = 'active' LIMIT 10;
-- Should execute in < 50ms
```

---

### 12.5 WebSocket Connection

**Via Browser Console:**
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws');

ws.onopen = () => {
  console.log('✓ WebSocket connected');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  console.log('✓ Received:', event.data);
};

// Expected: Connection opens, ping/pong succeeds
```

---

### 12.6 Performance Testing

```bash
# Test response times
time curl -s https://breakdowns.gobarry.co.uk/api/health > /dev/null
# Expected: < 200ms

# Test with load
for i in {1..10}; do
  curl -s https://breakdowns.gobarry.co.uk/api/health > /dev/null &
done
wait
# All should complete successfully
```

---

## 13. Troubleshooting cPanel-Specific Issues

### 13.1 Shared Hosting Resource Limits

#### Issue: "Error 503: Service Unavailable"
**Cause:** Resource limit exceeded (CPU, memory, or I/O)

**Diagnosis:**
```bash
# Check resource usage in cPanel
# Navigate to "Resource Usage" widget

# Via SSH
top -u $USER
# Look for high CPU% or MEM%
```

**Solutions:**
```bash
# Solution 1: Reduce Passenger pool size
# Edit ~/backend/.htaccess:
PassengerMaxPoolSize 1
PassengerMinInstances 1

# Solution 2: Increase memory limit
# Edit ~/backend/.env:
NODE_OPTIONS=--max-old-space-size=384

# Solution 3: Clear cache
rm -rf ~/backend/node_modules/.cache
cd ~/backend && npm cache clean --force

# Solution 4: Contact host to increase limits
```

---

#### Issue: "Database Connection Limit Reached"
**Cause:** Too many simultaneous MySQL connections

**Diagnosis:**
```sql
SHOW STATUS LIKE 'Threads_connected';
-- If >= 10 on shared hosting, you're at limit
```

**Solutions:**
```javascript
// Solution 1: Reduce pool size (backend/config/database.js)
const pool = mysql.createPool({
  connectionLimit: 3, // Lower from 5
  maxIdle: 1,
  idleTimeout: 30000 // Close faster
});

// Solution 2: Implement connection retry
async function queryWithRetry(sql, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      if (err.code === 'ER_CON_COUNT_ERROR' && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
}
```

---

### 13.2 cPanel-Specific Node.js Issues

#### Issue: "Application Crashed - Passenger"
**Cause:** Node.js app startup failure

**Diagnosis:**
```bash
# Check Passenger logs
tail -100 ~/logs/passenger.log
# Look for error messages near end

# Check app logs (if enabled)
tail -100 ~/logs/app.log
```

**Solutions:**
```bash
# Solution 1: Verify .htaccess syntax
cd ~/backend
cat .htaccess | grep PassengerNodejs
# Ensure path is correct: /usr/bin/node or actual path

# Solution 2: Check Node.js version
node --version
# Must be 18+ (update via cPanel Node.js Selector)

# Solution 3: Reinstall dependencies
cd ~/backend
rm -rf node_modules
npm ci --production

# Solution 4: Increase startup timeout
# Edit .htaccess:
PassengerStartTimeout 120

# Solution 5: Restart via cPanel Node.js Selector
```

---

#### Issue: "MODULE_NOT_FOUND" After Deployment
**Cause:** Missing npm dependencies

**Solutions:**
```bash
# Check which module is missing
grep "Cannot find module" ~/logs/passenger.log

# Install missing module
cd ~/backend
npm install [missing_module]

# Or reinstall all
npm ci --production

# Restart app
touch ~/backend/tmp/restart.txt
```

---

### 13.3 Passenger Configuration Problems

#### Issue: "Passenger Cannot Spawn Processes"
**Cause:** Passenger configuration issue or resource limits

**Diagnosis:**
```bash
# Check Passenger status
passenger-status

# If error, check Apache error log
tail -100 /usr/local/apache/logs/error_log | grep -i passenger
```

**Solutions:**
```bash
# Solution 1: Restart Passenger
# Via cPanel: Node.js Selector → Stop → Start

# Solution 2: Verify .htaccess exists
ls -la ~/backend/.htaccess
# Should exist with correct permissions (644)

# Solution 3: Check PassengerAppRoot path
cat ~/backend/.htaccess | grep PassengerAppRoot
# Must be absolute path: /home/username/backend

# Solution 4: Increase memory limit
# Edit .htaccess:
PassengerMemoryLimit 768

# Solution 5: Contact host for Passenger troubleshooting
```

---

### 13.4 Memory Exhaustion on Shared Hosting

#### Issue: "JavaScript Heap Out of Memory"
**Cause:** Node.js exceeded memory limit

**Diagnosis:**
```bash
# Check current memory usage
passenger-memory-stats

# Check Node.js process memory
ps aux | grep node | awk '{print $6}'
# Shows memory in KB
```

**Solutions:**
```bash
# Solution 1: Reduce Node.js memory limit
# Edit ~/.env:
NODE_OPTIONS=--max-old-space-size=384

# Solution 2: Clear cache and restart
cd ~/backend
rm -rf node_modules/.cache
touch tmp/restart.txt

# Solution 3: Optimize code
# - Use streams for large files
# - Clear arrays after use
# - Avoid loading large JSON files into memory

# Solution 4: Enable garbage collection
NODE_OPTIONS="--max-old-space-size=384 --expose-gc"
# Then in code:
if (global.gc) {
  setInterval(() => global.gc(), 60000);
}

# Solution 5: Upgrade to dedicated server (if budget allows)
```

---

## 14. Cost-Free Maintenance

### 14.1 Daily Tasks (Automated via Cron)
- ✓ Database backup (2:00 AM)
- ✓ Log cleanup (4:00 AM)
- ✓ Cache clearing (automatic in code)

### 14.2 Weekly Tasks
**Sundays, 3:00 AM (Automated):**
- ✓ Restart Node.js app
- ✓ Optimize database tables
- ✓ Review backup integrity

### 14.3 Monthly Tasks (Manual)
1. **Review Disk Usage:**
   ```bash
   du -sh ~/public_html ~/backend ~/backups
   ```

2. **Check SSL Certificate:**
   ```bash
   openssl s_client -connect breakdowns.gobarry.co.uk:443 -servername breakdowns.gobarry.co.uk 2>/dev/null | openssl x509 -noout -dates
   ```

3. **Review Error Logs:**
   ```bash
   tail -100 ~/logs/passenger.log
   tail -100 ~/logs/app.log
   ```

4. **Database Cleanup:**
   ```sql
   -- Remove old resolved breakdowns (> 90 days)
   DELETE FROM breakdowns WHERE resolved_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

   -- Remove old activities (> 30 days)
   DELETE FROM activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

   -- Optimize tables
   OPTIMIZE TABLE breakdowns, activities, wizard_progress;
   ```

---

## Final Checklist

### Critical Systems
- [ ] Frontend loads at `https://breakdowns.gobarry.co.uk`
- [ ] Backend API responds at `/api/health`
- [ ] Database connection working
- [ ] WebSocket connections establish
- [ ] SSL certificate valid (green padlock)
- [ ] HTTPS redirect working

### cPanel Services
- [ ] AutoSSL enabled and renewing
- [ ] cPanel MySQL database created
- [ ] cPanel email configured (optional)
- [ ] Cron jobs scheduled
- [ ] Node.js app running via Passenger
- [ ] Backups automated

### Resource Usage
- [ ] Memory usage < 80% of limit
- [ ] CPU usage reasonable
- [ ] Disk space < 80% full
- [ ] Database connections < 10
- [ ] Passenger pool size appropriate

### Performance
- [ ] API response times < 500ms
- [ ] Frontend loads < 3 seconds
- [ ] WebSocket latency < 100ms
- [ ] No memory leaks
- [ ] Cache working

---

## Deployment Summary

**Total Cost:** $0 (beyond existing cPanel hosting)

**Services Used (All Free):**
- ✓ cPanel Node.js hosting (Passenger)
- ✓ cPanel MySQL database (localhost)
- ✓ Free SSL via Let's Encrypt (AutoSSL)
- ✓ cPanel email (built-in SMTP)
- ✓ cPanel cron jobs (scheduled tasks)
- ✓ cPanel DNS management (included)
- ✓ cPanel backups (manual/automated)

**No External Services Required:**
- ✗ Render.com (not needed)
- ✗ Vercel (not needed)
- ✗ Supabase (using cPanel MySQL)
- ✗ SendGrid (using cPanel email)
- ✗ External DNS (using cPanel DNS)

---

## Support Resources

### cPanel Documentation
- **Node.js Selector:** Search cPanel docs for "Setup Node.js App"
- **MySQL Databases:** cPanel docs → Databases → MySQL
- **SSL/TLS:** cPanel docs → Security → SSL/TLS
- **Cron Jobs:** cPanel docs → Advanced → Cron Jobs

### Troubleshooting Resources
- **Passenger Errors:** https://www.phusionpassenger.com/library/
- **Node.js Issues:** https://nodejs.org/docs/
- **MySQL Optimization:** https://dev.mysql.com/doc/

### Contact Your Hosting Provider
If issues persist, contact support with:
- Error messages from logs
- Screenshots of cPanel error pages
- Steps to reproduce the issue

---

**End of Guide**

**Deployment Time:** 2-3 hours (first deployment), 1 hour (subsequent deployments)

**Questions or Issues?**
Contact: anthony.gair@gonortheast.co.uk
