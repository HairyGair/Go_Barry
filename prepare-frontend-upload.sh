#!/bin/bash

# Prepare Complete Frontend for Upload to cPanel
# This script creates a clean upload package

echo "========================================="
echo "Preparing Complete Frontend for Upload"
echo "========================================="
echo ""

# Create upload directory
UPLOAD_DIR="frontend-upload-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$UPLOAD_DIR"

echo "📦 Creating upload package in: $UPLOAD_DIR"
echo ""

# Copy entire breakdown-guide-service/public directory
echo "📁 Copying Breakdown Guide frontend..."
cp -r breakdown-guide-service/public/* "$UPLOAD_DIR/"

# Copy the enhanced dashboard to root
echo "📊 Copying Enhanced Dashboard..."
cp breakdown-dashboard-enhanced.html "$UPLOAD_DIR/"

# Create a separate dashboard directory too (optional)
mkdir -p "$UPLOAD_DIR/dashboard"
cp breakdown-dashboard-enhanced.html "$UPLOAD_DIR/dashboard/index.html"

# Create a file list for reference
echo "📝 Creating file inventory..."
cat > "$UPLOAD_DIR/FILES_TO_UPLOAD.txt" << 'EOF'
COMPLETE FRONTEND FILE LIST
===========================

ROOT FILES:
-----------
- index.html (main entry point)
- App.js (main application)
- breakdown-analytics.js
- breakdown-tracking-helper.js (NEW)
- supervisorBreakdownLogger.js (UPDATED)
- guide.html (legacy redirect)
- guide-legacy.html
- gobarry-logo.png
- breakdown-dashboard-enhanced.html (NEW DASHBOARD)

COMPONENTS:
-----------
components/
  - SupervisorLogin.js
  
components/common/
  - constants.js
  - icons.js
  - BreakdownInfoStep.js
  - breakdownAnalytics.js

components/wizards/ (30+ wizard files)
  - SteeringWizard.js
  - BrakesWizard.js
  - ABSLightWizard.js
  - OilWarningLightWizard.js
  ... (and all other wizards)

STYLES:
-------
styles/
  - main.css

SERVICES:
---------
services/ (if any)

DASHBOARD:
----------
dashboard/
  - index.html (copy of breakdown-dashboard-enhanced.html)

UPLOAD LOCATIONS:
=================
1. Main breakdown guide: /public_html/breakdown-guide/
2. Dashboard (option 1): /public_html/breakdown-dashboard.html
3. Dashboard (option 2): /public_html/dashboard/index.html

CRITICAL FILES FOR BREAKDOWN TRACKING:
======================================
These files MUST be uploaded for the new tracking to work:
✅ breakdown-tracking-helper.js (NEW)
✅ supervisorBreakdownLogger.js (UPDATED)
✅ App.js (UPDATED)
✅ index.html (UPDATED)
✅ breakdown-dashboard-enhanced.html (NEW)
EOF

# Create a simple upload instructions file
cat > "$UPLOAD_DIR/UPLOAD_INSTRUCTIONS.md" << 'EOF'
# Upload Instructions for cPanel

## Method 1: Using cPanel File Manager

1. **Login to cPanel**
   - Go to your cPanel URL
   - Login with your credentials

2. **Navigate to File Manager**
   - Click "File Manager" in the Files section
   - Navigate to `/public_html/breakdown-guide/`

3. **Backup Existing Files (IMPORTANT!)**
   - Select all files in the breakdown-guide directory
   - Click "Compress" 
   - Name it: `backup-before-update-YYYYMMDD.zip`

4. **Upload New Files**
   - Click "Upload" button
   - Either:
     a) Upload the entire ZIP file and extract, OR
     b) Select all files and drag them to upload

5. **Set Permissions**
   - Ensure all .js and .html files have 644 permissions
   - Ensure all directories have 755 permissions

6. **Upload Dashboard**
   - Navigate to `/public_html/`
   - Upload `breakdown-dashboard-enhanced.html`
   - Optionally rename to `breakdown-dashboard.html`

## Method 2: Using FTP

```bash
# Connect to FTP
ftp ftp.yourdomain.com

# Navigate to breakdown guide
cd /public_html/breakdown-guide

# Upload all files
mput *.js
mput *.html
put gobarry-logo.png

# Upload components
cd components
mput *.js
cd common
mput *.js
cd ../wizards
mput *.js

# Upload dashboard
cd /public_html
put breakdown-dashboard-enhanced.html
```

## Verification Steps

After upload, verify:

1. **Check Main App**: 
   - https://yourdomain.com/breakdown-guide/
   - Login as supervisor
   - Check console for errors

2. **Test Breakdown Tracking**:
   - Start a wizard
   - Complete it
   - Check if breakdown ID is generated

3. **Check Dashboard**:
   - https://yourdomain.com/breakdown-dashboard-enhanced.html
   - Verify breakdowns appear
   - Check auto-refresh works

4. **Check Network Tab**:
   - Verify API calls to /api/breakdowns/start
   - Verify API calls to /api/breakdowns/live

## Troubleshooting

### If files don't load:
- Check file permissions (644)
- Check .htaccess isn't blocking .js files
- Clear browser cache

### If tracking doesn't work:
- Check console for errors
- Verify breakdown-tracking-helper.js is loaded
- Check API endpoint is accessible

### If dashboard is empty:
- Verify API endpoint: https://go-barry.onrender.com/api/breakdowns/live
- Check browser console for CORS errors
- Ensure supervisor badge is set
EOF

# Create a ZIP file for easy upload
echo "🗜️ Creating ZIP archive..."
cd "$UPLOAD_DIR"
zip -r "../$UPLOAD_DIR.zip" . -x "*.DS_Store"
cd ..

echo ""
echo "✅ Upload package created successfully!"
echo ""
echo "📦 Package location: $UPLOAD_DIR/"
echo "🗜️ ZIP file: $UPLOAD_DIR.zip"
echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Login to cPanel"
echo "2. Go to File Manager"
echo "3. Navigate to /public_html/breakdown-guide/"
echo "4. Upload either:"
echo "   - The ZIP file: $UPLOAD_DIR.zip"
echo "   - Or the entire folder contents"
echo ""
echo "5. Don't forget to upload the dashboard:"
echo "   breakdown-dashboard-enhanced.html"
echo "   to /public_html/ or wherever you want it"
echo ""
echo "See $UPLOAD_DIR/UPLOAD_INSTRUCTIONS.md for detailed steps"
