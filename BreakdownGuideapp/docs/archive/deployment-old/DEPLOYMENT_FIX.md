# Deployment Fix Summary

---

## ⚠️ **LEGACY DOCUMENTATION - OUTDATED** ⚠️

**This document describes outdated deployment using Supabase/Render.com.**

**Current Deployment:**
- ✅ Platform: cPanel (self-hosted)
- ✅ Database: MySQL (cPanel)
- ✅ See: `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`
- ✅ Quick: `docs/CPANEL_QUICK_START_10MIN.md`

**Last Updated:** October 27, 2025

---

## Problem: 404 Errors for All Assets on cPanel

### Before Fix (Broken)

**Built index.html:**
```html
<script type="module" crossorigin src="/assets/index-BqbHVL8N.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-BnWDKY2V.js">
<link rel="stylesheet" crossorigin href="/assets/index-BL9kVj0n.css">
```

**Browser Console Errors:**
```
Failed to load resource: 404 (index-BqbHVL8N.js)
Failed to load resource: 404 (vendor-BnWDKY2V.js)
Failed to load resource: 404 (supabase-Qsiuvy-o.js)
Failed to load resource: 404 (index-BL9kVj0n.css)
```

**Problem:**
- Absolute paths (`/assets/...`) don't work on cPanel
- Server returns 404 for all asset requests
- Page loads blank with no JavaScript or CSS

---

### After Fix (Working)

**Built index.html:**
```html
<script type="module" crossorigin src="./assets/index-w2vwU0hn.js"></script>
<link rel="modulepreload" crossorigin href="./assets/vendor-BnWDKY2V.js">
<link rel="stylesheet" crossorigin href="./assets/index-BL9kVj0n.css">
```

**Browser Console:**
```
✓ All assets load successfully (200 OK)
✓ Application renders correctly
✓ No 404 errors
```

**Solution:**
- Relative paths (`./assets/...`) work on all hosting platforms
- Assets load from same directory as index.html
- Works in root domain or subdirectory

---

## What Was Changed

### 1. vite.config.js
```diff
export default defineConfig({
  plugins: [react()],
+ base: './', // Use relative paths for assets - critical for cPanel deployment
  resolve: {
    // ... aliases
  },
  // ... rest of config
})
```

**Effect:** Vite now generates relative paths instead of absolute paths.

### 2. index.html (source)
```diff
<head>
  <meta charset="UTF-8" />
- <link rel="icon" type="image/svg+xml" href="/logo.svg" />
+ <link rel="icon" type="image/svg+xml" href="./logo.svg" />
  <!-- ... rest of head -->
</head>
```

**Effect:** Favicon also uses relative path for consistency.

### 3. package.json
```diff
"scripts": {
  "dev": "vite --host",
  "build": "vite build",
+ "build:cpanel": "vite build && echo 'Build complete! Upload dist/ to cPanel.'",
  "preview": "vite preview",
  // ... rest of scripts
}
```

**Effect:** New script with helpful deployment reminder.

---

## Technical Explanation

### Why Absolute Paths Failed

1. **Absolute path**: `/assets/file.js`
   - Browser requests: `https://breakdowns.gobarry.co.uk/assets/file.js`
   - cPanel server: Cannot resolve from filesystem root
   - Result: 404 Not Found

2. **Relative path**: `./assets/file.js`
   - Browser requests: `https://breakdowns.gobarry.co.uk/assets/file.js`
   - cPanel server: Resolves relative to index.html location
   - Result: 200 OK

### Why Relative Paths Work

- **Root deployment**: `./assets/` → `/assets/` ✓
- **Subdirectory**: `./assets/` → `/breakdowns/assets/` ✓
- **Any path**: Works because path is relative to HTML file

---

## Verification Checklist

After deploying to cPanel:

- [ ] Open https://breakdowns.gobarry.co.uk
- [ ] Press F12 to open DevTools
- [ ] Check Console tab - should be no 404 errors
- [ ] Check Network tab - all assets should show 200 status
- [ ] Verify application loads and functions correctly
- [ ] Test login functionality
- [ ] Test navigation between pages

---

## Quick Reference

### Build Commands
```bash
# Standard build
npm run build

# Build with deployment message
npm run build:cpanel

# Preview build locally
npm run preview
```

### Deployment Process
```bash
# 1. Build the application
npm run build

# 2. Upload dist/ contents to cPanel
# Files → public_html/ or public_html/breakdowns/

# 3. Verify deployment
# Open https://breakdowns.gobarry.co.uk in browser
```

---

## Files Modified

1. **vite.config.js** - Added `base: './'`
2. **index.html** - Changed favicon to relative path
3. **package.json** - Added `build:cpanel` script

## Files Created

1. **CPANEL_DEPLOYMENT.md** - Comprehensive deployment guide
2. **DEPLOY.sh** - Automated deployment script
3. **DEPLOYMENT_FIX.md** - This document

---

## Testing

### Local Testing
```bash
# Build and preview
npm run build && npm run preview

# Check paths in built HTML
cat dist/index.html | grep "assets/"

# Should output:
# src="./assets/index-*.js"
# NOT src="/assets/index-*.js"
```

### Production Testing
1. Upload dist/ to cPanel
2. Open in browser
3. Check DevTools Console for errors
4. Verify all pages work
5. Test in incognito mode (avoid cache)

---

## Rollback Plan

If this fix causes issues:

```bash
# 1. Revert vite.config.js
git checkout vite.config.js

# 2. Rebuild
npm run build

# 3. Redeploy
# Upload new dist/ to cPanel
```

---

**Status:** ✅ Fixed and Tested
**Date:** October 5, 2025
**Author:** Anthony Gair
**Tested On:** cPanel hosting at gobarry.co.uk
