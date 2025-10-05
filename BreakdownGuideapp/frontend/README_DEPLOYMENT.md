# Frontend Deployment - Quick Start

## The Fix

**Problem:** Assets returned 404 on cPanel (blank page)
**Solution:** Changed from absolute paths (`/assets/`) to relative paths (`./assets/`)
**Status:** ✅ Fixed - Ready to deploy

---

## Deploy in 3 Steps

### Step 1: Build
```bash
cd frontend
npm run build
```

### Step 2: Upload
Upload contents of `dist/` folder to cPanel:
- **Location:** `public_html/` or `public_html/breakdowns/`
- **All files:** Including `.htaccess` (enable "show hidden files" in FTP client)

### Step 3: Verify
Open https://breakdowns.gobarry.co.uk
- ✓ Page should load (not blank)
- ✓ DevTools Console should show no 404 errors
- ✓ Assets should load with 200 status

---

## Key Changes Made

**File:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/vite.config.js`
```javascript
export default defineConfig({
  plugins: [react()],
  base: './', // ← This line fixes cPanel deployment
  // ... rest of config
})
```

---

## Before vs After

### Before (Broken)
```html
<script src="/assets/index-*.js"></script>
<!-- Absolute path → 404 on cPanel -->
```

### After (Fixed)
```html
<script src="./assets/index-*.js"></script>
<!-- Relative path → Works everywhere -->
```

---

## Files to Upload

Upload entire `dist/` folder contents:
```
✓ index.html              (main entry point)
✓ .htaccess              (URL rewriting - IMPORTANT!)
✓ assets/                (all JS/CSS bundles)
✓ logo.svg               (favicon)
✓ manifest.json          (PWA manifest)
✓ sw.js                  (service worker)
✓ icons/                 (PWA icons)
✓ All other static files (images, PDFs, etc.)
```

**Important:** Don't forget `.htaccess` - it's hidden by default!

---

## Troubleshooting

### Still getting 404 errors?

1. **Check paths in index.html**
   ```bash
   cat dist/index.html | grep assets
   # Should show: src="./assets/..." NOT src="/assets/..."
   ```

2. **Rebuild from scratch**
   ```bash
   rm -rf dist/
   npm run build
   ```

3. **Clear browser cache**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or use incognito mode

4. **Check file permissions on cPanel**
   - Files: 644
   - Folders: 755

5. **Verify .htaccess uploaded**
   - Enable "Show hidden files" in FTP client
   - File should be at same level as index.html

---

## Complete Documentation

For detailed information:
- **CPANEL_DEPLOYMENT.md** - Comprehensive deployment guide
- **DEPLOYMENT_FIX.md** - Technical explanation of the fix
- **DEPLOY.sh** - Automated deployment script

---

## Production URLs

- **Frontend:** https://breakdowns.gobarry.co.uk
- **Backend:** https://breakdown-guide.onrender.com
- **Supabase:** https://oieliubbvvdzhzvikzal.supabase.co

---

## Quick Commands

```bash
# Build for cPanel
npm run build:cpanel

# Preview build locally
npm run preview

# Clean build
rm -rf dist/ && npm run build

# Deploy with script
./DEPLOY.sh
```

---

**Last Updated:** October 5, 2025
**Status:** Production Ready ✅
