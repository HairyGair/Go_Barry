# 🚀 Go BARRY - cPanel Upload Guide

## Quick Upload Steps

### 1. Access cPanel File Manager
- Log into your cPanel account  
- Open **File Manager**
- Navigate to `public_html` directory

### 2. Upload Files
**Upload the ZIP file** or **upload all files manually**:

#### Option A - ZIP Upload (Recommended):
1. Upload `go-barry-cpanel-ready.zip` 
2. Right-click → Extract
3. Move extracted files to `public_html` root

#### Option B - Manual Upload:
- Upload ALL files and folders to `public_html`
- Ensure folder structure is preserved

### 3. Verify Upload
Your `public_html` should contain:
- ✅ `index.html`
- ✅ `.htaccess`
- ✅ `_expo/` folder
- ✅ `assets/` folder (if present)
- ✅ Other asset files

### 4. Test Your Site

Visit: **https://gobarry.co.uk**

#### Features to Test:
- ✅ Main page loads
- ✅ Navigation works (`/display`, `/browser-main`)
- ✅ Traffic alerts load
- ✅ Real-time updates
- ✅ Supervisor login

### 5. Troubleshooting

**If site doesn't load:**
- Check `.htaccess` permissions (644)
- Verify mod_rewrite is enabled
- Check browser console for errors

**If alerts don't load:**
- Backend connects to: https://go-barry.onrender.com
- Check CORS headers in browser network tab

**If routing doesn't work:**
- Ensure `.htaccess` is in root directory
- Contact hosting support if needed

---
**Go BARRY v3.0 - Ready for Production!** 🚦
