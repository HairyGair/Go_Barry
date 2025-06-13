# 🚀 Go BARRY - cPanel Upload Guide

## Quick Upload Steps

### 1. Access cPanel File Manager
- Log into your cPanel account
- Open **File Manager**
- Navigate to `public_html` directory

### 2. Upload Files
You need to upload **TWO SETS** of files:

#### From cpanel-deployment-fresh/ folder:
- `index.html` (main app file)
- `.htaccess` (routing and optimization)

#### From Go_BARRY/dist/ folder:
- `_expo/` folder (contains all JS/CSS)
- `assets/` folder (contains images)
- `gobarry-logo.png`
- `metadata.json`

### 3. Complete File Structure
After upload, your public_html should contain:
```
public_html/
├── index.html
├── .htaccess
├── _expo/
│   └── static/
│       ├── js/
│       ├── css/
│       └── media/
├── assets/
├── gobarry-logo.png
└── metadata.json
```

### 4. Set Permissions (if needed)
- Set folder permissions to `755`
- Set file permissions to `644`
- Set `.htaccess` permissions to `644`

### 5. Test Your Deployment

Visit these URLs after upload:

- **Main App**: https://gobarry.co.uk
- **Display Screen**: https://gobarry.co.uk/display  
- **Supervisor Interface**: https://gobarry.co.uk/browser-main

### 6. Verify Features

✅ Check these work:
- Traffic alerts loading
- Map displaying (on production, not localhost)
- Supervisor login functionality
- Real-time updates
- Display screen rotation

### 7. Backend Connection

The frontend automatically connects to:
- **Backend API**: https://go-barry.onrender.com
- This provides all traffic data and functionality

## 🔧 Troubleshooting

**If alerts don't load:**
- Check browser console for CORS errors
- Verify .htaccess was uploaded correctly
- Ensure backend API is running

**If routing doesn't work:**
- Verify .htaccess file was uploaded
- Check if mod_rewrite is enabled on your hosting

**If JavaScript files don't load:**
- Verify `_expo/` folder was uploaded completely
- Check file permissions
- Look for 404 errors in browser console

**Need help?** 
- Check browser developer console for errors
- Verify all files uploaded correctly
- Contact hosting support for .htaccess issues

---
**Go BARRY Traffic Intelligence Platform v3.0**  
Professional deployment ready! ✅

## 🎯 Manual Upload Instructions

Since this is a complex Expo build, follow these steps:

1. **Upload index.html and .htaccess** from cpanel-deployment-fresh/
2. **Upload _expo/ and assets/ folders** from Go_BARRY/dist/
3. **Upload gobarry-logo.png** from Go_BARRY/dist/
4. **Test the application**

The app will then work perfectly with the backend at https://go-barry.onrender.com
