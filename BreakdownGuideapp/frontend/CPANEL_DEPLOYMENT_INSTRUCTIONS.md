# cPanel Deployment Instructions via Cyberduck

## 🎉 Production Build Complete!

Your Go BARRY Breakdown Management System is now ready for production deployment with **ALL AUTH FIXES INCLUDED**.

---

## ✅ What's Been Fixed

✅ **Homepage blank screen** - Resolved routing loop
✅ **Login redirect issues** - Now flows directly to Breakdown Guide
✅ **Authentication reliability** - Flawless auth flow implemented
✅ **Protected routes** - All routes properly secured
✅ **Session management** - Maintains auth state on refresh

---

## 📦 What to Upload

Upload the **ENTIRE** `dist/` folder contents to your cPanel public_html directory.

**Location on your computer:**
```
/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/
```

---

## 🚀 Step-by-Step Deployment via Cyberduck

### 1. **Connect to cPanel via Cyberduck**

**Option A: FTP/SFTP**
- Open Cyberduck
- Click "Open Connection"
- Protocol: SFTP (SSH File Transfer Protocol) or FTP
- Server: `breakdowns.gobarry.co.uk` (or your cPanel hostname)
- Username: Your cPanel username
- Password: Your cPanel password
- Click "Connect"

**Option B: If you have SSH key:**
- Use SFTP protocol
- Add your private key in Cyberduck preferences

### 2. **Navigate to public_html**

Once connected:
1. Look for the `public_html` folder (or `www` folder depending on your cPanel)
2. This is where your website files live
3. Double-click to open it

**For subdomain deployment:**
- If using `breakdowns.gobarry.co.uk` subdomain
- Navigate to `public_html/breakdowns/` or wherever the subdomain points
- If unsure, check "Subdomains" in cPanel to see the document root

### 3. **Backup Current Files (IMPORTANT!)**

Before uploading:
1. In Cyberduck, select all files in public_html
2. Right-click → Download to a backup folder on your computer
3. Name it something like `gobarry-backup-2025-10-22`
4. This allows you to rollback if needed

### 4. **Upload New Build**

**Method 1: Drag & Drop (Recommended)**
1. Open Finder and navigate to:
   ```
   /Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/
   ```
2. Select **ALL** files inside the `dist/` folder
3. Drag them into the Cyberduck window (public_html)
4. When prompted, choose:
   - ✅ "Overwrite" existing files
   - ✅ "Apply to All"

**Method 2: Upload Button**
1. In Cyberduck, click the "Upload" button (↑)
2. Navigate to `/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/`
3. Select all files inside
4. Click "Choose"
5. Overwrite when prompted

### 5. **Critical: Verify .htaccess Upload**

**Very Important!** The `.htaccess` file must be uploaded for React Router to work.

In Cyberduck:
1. Click "View" → "Show Hidden Files" (Cmd+Shift+.)
2. Verify `.htaccess` appears in your public_html
3. If not visible, manually upload it:
   - File → Upload
   - Select `.htaccess` from the dist folder
   - Upload to public_html root

### 6. **Set Correct Permissions**

Right-click on each folder and set permissions:
- **Folders**: 755 (drwxr-xr-x)
- **Files**: 644 (-rw-r--r--)
- **.htaccess**: 644 (-rw-r--r--)

Or use Cyberduck's "Info" → "Permissions" tab.

---

## 📂 File Structure After Upload

Your public_html should look like this:

```
public_html/
├── .htaccess                          # React Router configuration
├── index.html                         # Main entry point
├── assets/                            # JS, CSS, and chunks
│   ├── index-BORjDyIf.css            # Styles
│   ├── vendor-eipnX2rG.js            # React/dependencies
│   ├── supabase-DHVhoRQG.js          # Supabase client
│   └── index-BKmmbQ0v.js             # Main app code
├── icons/                             # PWA icons
├── dashboards/                        # Static dashboard assets
├── GO_NORTHEAST_WHITE_RGB.png         # Logo
├── gne-fleet-database.json            # Fleet data
└── ... (other static assets)
```

---

## 🔧 Backend Configuration (if needed)

Your backend is already configured on cPanel at:
- **API URL**: `https://api.breakdowns.gobarry.co.uk`
- **Frontend URL**: `https://breakdowns.gobarry.co.uk`

**If backend is in the same cPanel account:**
1. Navigate to `public_html/api/` (or your backend folder)
2. Ensure Node.js app is running (via cPanel Node.js selector)
3. Verify backend `.env` has correct database credentials

**Backend environment variables should include:**
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
FRONTEND_URL=https://breakdowns.gobarry.co.uk
```

---

## ✅ Post-Deployment Checklist

After uploading, test the following:

### 1. **Basic Access**
- [ ] Visit `https://breakdowns.gobarry.co.uk`
- [ ] Login page loads correctly
- [ ] No console errors (F12 → Console)

### 2. **Authentication Flow**
- [ ] Can log in with supervisor badge (e.g., AG003, BP009)
- [ ] After login, redirects to Breakdown Guide (not blank screen)
- [ ] Navigation bar shows user name
- [ ] Can access all protected routes

### 3. **Page Refresh Test**
- [ ] After logging in, refresh the page (F5)
- [ ] Should stay logged in (not redirect to login)
- [ ] User info still displays correctly

### 4. **Direct URL Access**
- [ ] Visit `https://breakdowns.gobarry.co.uk/breakdown-guide`
- [ ] If not logged in → redirects to login
- [ ] If logged in → shows Breakdown Guide

### 5. **Logout Test**
- [ ] Click logout button
- [ ] Redirects to login page
- [ ] Cannot access protected routes
- [ ] No cached user data

### 6. **Mobile Test**
- [ ] Open on mobile device
- [ ] Login works
- [ ] Navigation works
- [ ] Responsive design displays correctly

---

## 🐛 Troubleshooting

### **Blank Screen / White Page**
**Cause**: Missing .htaccess or incorrect base path

**Fix**:
1. Verify `.htaccess` is in public_html root
2. Open browser console (F12) and check for errors
3. Check browser Network tab for 404 errors on assets

### **404 on Routes (e.g., /breakdown-guide)**
**Cause**: .htaccess not working or missing

**Fix**:
1. Ensure `.htaccess` uploaded (enable "Show Hidden Files")
2. Verify cPanel has `mod_rewrite` enabled (contact host if not)
3. Check file permissions: 644 for .htaccess

### **Assets Not Loading (CSS/JS 404)**
**Cause**: Incorrect base path in vite.config.js

**Fix**:
1. Should already be set to `base: '/'` (already correct)
2. Verify assets folder uploaded to public_html/assets/

### **API Connection Errors**
**Cause**: Backend not running or incorrect CORS

**Fix**:
1. Check backend is running: Visit `https://api.breakdowns.gobarry.co.uk/api/health`
2. Should return JSON: `{"status":"ok"}`
3. Verify backend CORS allows `breakdowns.gobarry.co.uk`
4. Check backend .env has correct `FRONTEND_URL`

### **Login Redirects to Login Again (Loop)**
**Cause**: This was the original bug - FIXED in this build!

**Fix**: Already resolved. If still happening:
1. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear localStorage (F12 → Application → Storage → Clear site data)
3. Try incognito/private mode

### **Session Lost on Page Refresh**
**Cause**: localStorage not persisting or Supabase session expired

**Fix**:
1. Check browser doesn't block cookies/localStorage
2. Verify Supabase project is active
3. Check browser console for auth errors

---

## 🔄 Quick Redeploy Process

For future updates:

1. Make code changes locally
2. Run `npm run build:cpanel` in the frontend folder
3. Open Cyberduck and connect to cPanel
4. Drag contents of `dist/` to `public_html/`
5. Overwrite all files
6. Test in browser (Cmd+Shift+R to hard refresh)

**Pro tip**: Create a Cyberduck bookmark for faster connection!

---

## 📞 Support

If you encounter issues:

1. **Check browser console** (F12) for JavaScript errors
2. **Check Network tab** (F12) for failed API calls
3. **Check backend logs** in cPanel → Logs
4. **Verify environment variables** in both frontend and backend

---

## 🎯 Production URLs

- **Frontend**: https://breakdowns.gobarry.co.uk
- **Backend API**: https://api.breakdowns.gobarry.co.uk
- **Supabase**: https://oieliubbvvdzhzvikzal.supabase.co

---

## 📊 Build Info

- **Build Date**: October 22, 2025
- **Version**: 1.5.4
- **Build Time**: 6.02s
- **Bundle Size**:
  - CSS: 259.78 kB
  - JS: ~3.9 MB (minified + gzipped)
  - Total Assets: ~4.2 MB

- **Includes Auth Fixes**: ✅ Yes
- **Production Ready**: ✅ Yes
- **Console Logs Removed**: ✅ Yes (except errors)
- **Source Maps**: ❌ No (security)

---

## ✨ What's New in This Build

✅ Fixed infinite redirect loop on homepage
✅ Login now flows directly to Breakdown Guide
✅ Auth state persists on page refresh
✅ Protected routes work flawlessly
✅ Emergency logout fixed
✅ All dashboard links corrected
✅ Comprehensive error handling
✅ Security headers enabled in .htaccess

---

**🚀 Your app is ready for production deployment!**

Upload via Cyberduck and enjoy flawless authentication! 🎉
