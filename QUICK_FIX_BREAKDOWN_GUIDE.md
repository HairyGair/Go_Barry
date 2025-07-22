# URGENT: Go BARRY Breakdown Guide Deployment Fix

## Quick Fix for "Unmatched Route" Error

### The Problem
Your breakdown guide at https://www.gobarry.co.uk/breakdown-guide/ is showing "Unmatched Route" because the server has outdated files.

### The Solution
Upload the correct files from your local system to fix this immediately.

## CyberDuck Upload Instructions (5 Minutes)

### 1. Connect to Your Server
- Open CyberDuck
- Connect to your cPanel server

### 2. Navigate to Breakdown Guide Directory
- Go to: `/public_html/breakdown-guide/`

### 3. Delete Existing Files
- Select all files in the breakdown-guide directory
- Delete them (backup first if needed)

### 4. Upload New Files
Upload ALL files from: `/Users/anthony/Go BARRY App/breakdown-guide-react-deploy/`

**Critical files to upload:**
```
breakdown-guide/
├── index.html          ← Main file
├── App.js              ← React app
├── .htaccess           ← MUST UPLOAD (may be hidden in Finder)
├── components/         ← Entire folder
│   ├── common/
│   └── wizards/
└── styles/             ← Entire folder
```

### 5. Upload Missing Wizards
The deployment folder only has SteeringWizard. To get all 24 wizards:

From: `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards/`
To: `/public_html/breakdown-guide/components/wizards/`

Upload all .js files in that directory.

### 6. Set Permissions (if needed)
- Files: 644
- Directories: 755
- .htaccess: 644

## Verification

After upload, visit: https://www.gobarry.co.uk/breakdown-guide/

You should see:
1. "Go NorthEast" loading screen (briefly)
2. Then "Go BARRY" interface with dark theme
3. "24 of 31 Wizards Complete (77%)" progress bar

## If It Still Doesn't Work

1. **Check .htaccess**: Make sure it was uploaded (it's hidden by default)
2. **Clear Cache**: Force refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
3. **Check Console**: Open browser dev tools for any errors

## Complete Site Structure

Your server should have:
```
/public_html/
├── index.html              ← Your homepage (already working)
├── breakdown-guide/        ← This needs fixing
├── admin/
├── operations-centre/
├── disruptions/
└── [other files/folders]
```

---

**Time Required**: 5-10 minutes
**Urgency**: HIGH - This is blocking access to the breakdown guide