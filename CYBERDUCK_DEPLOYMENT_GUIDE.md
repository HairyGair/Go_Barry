# Go BARRY Complete Deployment Guide for CyberDuck

## Overview
This guide provides step-by-step instructions for deploying the complete Go BARRY system to your cPanel using CyberDuck, ensuring the breakdown guide and all other features work correctly.

## Pre-Deployment Checklist

### Files to Deploy
The complete system is located in: `/Users/anthony/Go BARRY App/Go_BARRY/dist/`

### Required Server Configuration
- Apache with mod_rewrite enabled
- PHP support (if needed)
- Proper file permissions (644 for files, 755 for directories)

## CyberDuck Deployment Steps

### Step 1: Connect to Your Server
1. Open CyberDuck
2. Click "Open Connection"
3. Select "FTP" or "SFTP" (recommended)
4. Enter your cPanel credentials:
   - Server: Your domain or IP
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (FTP) or 22 (SFTP)

### Step 2: Navigate to Web Root
1. Once connected, navigate to your web root directory
   - Usually `/public_html/` or `/www/`
   - This is where your main website files go

### Step 3: Backup Existing Files (Optional but Recommended)
1. If you have existing files, create a backup folder:
   - Right-click in the file browser
   - Create new folder called `backup_[date]`
   - Move existing files to this folder

### Step 4: Upload the Complete Go BARRY System

#### 4.1 Upload Main Files
From `/Users/anthony/Go BARRY App/Go_BARRY/dist/`, upload these files to your web root:

**Essential Files:**
- `index.html` - Main homepage
- `favicon.ico` - Site icon
- `gobarry-logo.png` - Logo file
- `styles.css` - Main styles
- `app.js` - Main application logic

**HTML Pages:**
- `about.html`
- `communications-hub.html`
- `control.html`
- `dashboard.html`
- `disruptions.html`
- `operations.html`
- `roadworks.html`
- `services.html`
- `settings.html`
- `supervisor.html`

#### 4.2 Upload Directories
Upload these complete directories maintaining their structure:

1. **`/breakdown-guide/`** - The breakdown guide system
   - Contains: index.html, App.js, components/, styles/
   - CRITICAL: Maintain exact directory structure

2. **`/admin/`** - Admin dashboard
   
3. **`/operations-centre/`** - Operations center
   
4. **`/disruptions/`** - Disruptions management
   
5. **`/data/`** - Data files
   
6. **`/assets/`** - Assets and resources
   
7. **`/_expo/`** - Expo/React Native Web files

### Step 5: Upload the Fixed Breakdown Guide

The breakdown guide needs special attention as it's currently broken. Use the fixed version:

1. Navigate to `/public_html/breakdown-guide/` on your server
2. Delete all existing files in this directory
3. Upload ALL files from `/Users/anthony/Go BARRY App/breakdown-guide-react-deploy/`:

```
breakdown-guide/
├── index.html
├── App.js
├── .htaccess           ← CRITICAL for routing
├── package.json
├── components/
│   ├── common/
│   │   ├── constants.js
│   │   └── icons.js
│   └── wizards/
│       └── SteeringWizard.js
└── styles/
    └── main.css
```

### Step 6: Set Correct Permissions

In CyberDuck, right-click on files and folders to set permissions:

**Files**: 644 (rw-r--r--)
- All .html files
- All .js files
- All .css files
- .htaccess files

**Directories**: 755 (rwxr-xr-x)
- All folders

### Step 7: Upload Additional Wizard Files

To complete the breakdown guide with all 24 wizards:

1. Navigate to `/public_html/breakdown-guide/components/wizards/`
2. Upload all wizard files from `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards/`:
   - BrakesWizard.js
   - ABSLightWizard.js
   - OilWarningLightWizard.js
   - InteriorLightsWizard.js
   - ExteriorLightsWizard.js
   - WheelchairLiftWizard.js
   - DestinationDisplayWizard.js
   - BatteryWizard.js
   - CoolingSystemWizard.js
   - DemistersHeatersWizard.js
   - RepeatDefectsWizard.js
   - RoadTrafficIncidentsWizard.js
   - TracerItHelperWizard.js
   - LooseWheelNutsWizard.js
   - PunctureWizard.js
   - NonStarterWizard.js
   - DoorsWizard.js
   - GearSelectionWizard.js
   - GearboxWizard.js
   - BuzzersWizard.js
   - WarningLightsWizard.js
   - ExcessiveSmokeWizard.js
   - SuspensionWizard.js

## Verification Steps

### 1. Test Main Site
- Visit: `https://www.gobarry.co.uk/`
- Verify homepage loads with all tiles

### 2. Test Breakdown Guide
- Click "Open Breakdown Guide" button
- OR visit: `https://www.gobarry.co.uk/breakdown-guide/`
- Should show:
  - Brief "Go NorthEast" loading screen
  - Then "Go BARRY" dark themed interface
  - 24 of 31 Wizards Complete (77%)

### 3. Test Other Features
- Operations Centre: `https://www.gobarry.co.uk/operations.html`
- Disruptions Manager: `https://www.gobarry.co.uk/disruptions.html`
- Admin Dashboard: `https://www.gobarry.co.uk/admin/`

## Troubleshooting

### If Breakdown Guide Still Shows "Unmatched Route"
1. Verify .htaccess file was uploaded to /breakdown-guide/
2. Check that Apache mod_rewrite is enabled on your server
3. Clear browser cache and try again
4. Check file permissions (especially on .htaccess)

### If Other Pages Don't Load
1. Verify all HTML files were uploaded to root directory
2. Check that file names match exactly (case-sensitive)
3. Ensure all subdirectories were uploaded with contents

### If Styles or Scripts Don't Work
1. Check that styles.css and app.js are in the root
2. Verify all files in /assets/ were uploaded
3. Check browser console for 404 errors

## File Structure on Server

After deployment, your server structure should look like:

```
/public_html/
├── index.html                 ← Homepage
├── favicon.ico
├── gobarry-logo.png
├── styles.css
├── app.js
├── breakdown-guide/           ← Breakdown guide app
│   ├── index.html
│   ├── App.js
│   ├── .htaccess
│   ├── components/
│   └── styles/
├── admin/                     ← Admin dashboard
├── operations-centre/         ← Operations tools
├── disruptions/              ← Disruptions system
├── data/                     ← Data files
├── assets/                   ← Resources
└── [other HTML files]        ← Various pages
```

## Quick Deployment Checklist

- [ ] Connected to server via CyberDuck
- [ ] Backed up existing files
- [ ] Uploaded all HTML files to root
- [ ] Uploaded styles.css and app.js to root
- [ ] Uploaded complete breakdown-guide directory
- [ ] Uploaded all other directories
- [ ] Set correct file permissions
- [ ] Tested main homepage
- [ ] Tested breakdown guide
- [ ] Tested other major features

## Support

If issues persist after following this guide:
1. Check server error logs in cPanel
2. Verify Apache configuration supports .htaccess
3. Ensure all files uploaded completely (check file sizes)
4. Clear all browser caches and test in incognito mode

---

**Important**: The breakdown guide is a modular React app that requires all component files to work properly. Ensure you maintain the exact directory structure when uploading.