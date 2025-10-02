#!/bin/bash

# Deploy Frontend to cPanel
# This script builds the frontend and prepares it for cPanel upload

set -e  # Exit on any error

echo "🚀 Starting cPanel deployment process..."

# Build the frontend
echo "📦 Building frontend..."
cd "$(dirname "$0")"
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
DEPLOY_DIR="cpanel-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "../$DEPLOY_DIR"

# Copy built files
echo "📋 Copying built files..."
cp -r dist/* "../$DEPLOY_DIR/"

# Create upload instructions
cat > "../$DEPLOY_DIR/UPLOAD_INSTRUCTIONS.txt" << 'EOF'
=================================================
CPANEL UPLOAD INSTRUCTIONS
=================================================

1. Log into your cPanel File Manager

2. Navigate to your public web directory:
   - Usually: public_html/
   - Or: www/
   - Or: httpdocs/

3. BACKUP FIRST (recommended):
   - Select all files in web root
   - Click "Compress" → Create backup.zip
   - Download the backup

4. UPLOAD NEW FILES:
   - Upload index.html (overwrite existing)
   - Upload the entire assets/ folder (overwrite existing)
   - Keep any .htaccess files (don't delete!)

5. VERIFY:
   - Visit your site URL
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Check console for new bundle: index-BhXvcFjr.js
   - Look for: "🔒 Request includes auth token"

=================================================
NEW BUNDLE HASH: index-BhXvcFjr.js
OLD BUNDLE HASH: index-Dm7SH4eV.js

This confirms the new code is loaded!
=================================================

Need help? Check the README.md in this folder.
EOF

# Create detailed README
cat > "../$DEPLOY_DIR/README.md" << 'EOF'
# cPanel Deployment Package

Built: $(date)
From: Go BARRY Breakdown Management System

## Files Included

- `index.html` - Main HTML entry point
- `assets/` - All JavaScript, CSS, and static assets
  - `index-BhXvcFjr.js` - Main application bundle (NEW!)
  - `index-C5O5z1X6.css` - Styles
  - `vendor-BpuzECPt.js` - Third-party libraries
  - Other chunks and assets

## What's New

This deployment includes:
- ✅ Fixed authentication with automatic JWT token injection
- ✅ Activity feed now works in production
- ✅ Dashboard data loads with proper authentication
- ✅ Password change functionality working
- ✅ All API calls properly authenticated

## Upload Methods

### Method 1: cPanel File Manager (Easiest)
1. Log into cPanel
2. Open File Manager
3. Navigate to public_html/
4. Upload all files from this folder
5. Overwrite when prompted

### Method 2: FTP/SFTP
```bash
# Use FileZilla, Transmit, or Cyberduck
# Upload all files from this folder to your web root
```

### Method 3: cPanel Upload via ZIP
1. Compress this entire folder into a ZIP
2. Upload ZIP to cPanel File Manager
3. Extract in public_html/
4. Move files out of subfolder if needed

## Verification

After upload, test:
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Open DevTools Console
3. Look for: `"🔒 Request includes auth token"`
4. Check Network tab for: `index-BhXvcFjr.js` (not index-Dm7SH4eV.js)
5. Login and verify dashboard loads

## Rollback

If issues occur:
1. Restore from your backup.zip
2. Contact support with error messages from Console

## Support

- GitHub: https://github.com/HairyGair/Breakdown_Guide
- Backend API: https://breakdown-guide.onrender.com
- Database: Supabase (oieliubbvvdzhzvikzal.supabase.co)
EOF

echo ""
echo "✅ Deployment package created: $DEPLOY_DIR"
echo ""
echo "📍 Location: $(pwd)/../$DEPLOY_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Open the folder: $DEPLOY_DIR"
echo "2. Read UPLOAD_INSTRUCTIONS.txt"
echo "3. Upload files to your cPanel"
echo ""
echo "🎯 New bundle hash: index-BhXvcFjr.js"
echo "🎯 Old bundle hash: index-Dm7SH4eV.js"
echo ""
echo "✅ Ready to deploy!"
