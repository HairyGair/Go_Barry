# 🚀 Quick Deploy Guide - Cyberduck to cPanel

## TL;DR - Upload These Files NOW!

1. **Open Cyberduck** → Connect to your cPanel
2. **Navigate to** `public_html/` (or your subdomain folder)
3. **Upload ALL files from:**
   ```
   /Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/
   ```
4. **Important**: Make sure `.htaccess` is uploaded (enable "Show Hidden Files")
5. **Test**: Visit https://breakdowns.gobarry.co.uk

---

## ✅ What's Fixed

✅ Homepage blank screen - FIXED
✅ Login redirect loop - FIXED
✅ Auth reliability - FIXED
✅ All routes work - FIXED

---

## 📦 Files to Upload

**Location on Mac:**
```bash
/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/
```

**Upload EVERYTHING inside the `dist/` folder to cPanel's `public_html/`**

Critical files:
- ✅ index.html
- ✅ .htaccess (MUST be uploaded - enables React Router)
- ✅ assets/ folder (all JS/CSS)
- ✅ All images and icons

---

## 🔑 Cyberduck Quick Steps

### Connect:
- Protocol: SFTP or FTP
- Server: breakdowns.gobarry.co.uk
- Username: [your cPanel username]
- Password: [your cPanel password]

### Upload:
1. Drag `dist/` contents into Cyberduck window
2. Choose "Overwrite All"
3. Enable "Show Hidden Files" (Cmd+Shift+.)
4. Verify `.htaccess` uploaded

### Done!
Visit: https://breakdowns.gobarry.co.uk

---

## ⚠️ Common Issues

**Blank screen?**
→ Upload `.htaccess` file (enable hidden files in Cyberduck)

**404 on routes?**
→ Check `.htaccess` is in public_html root

**Can't see .htaccess?**
→ Cyberduck: View → Show Hidden Files (Cmd+Shift+.)

**Login loop?**
→ Clear browser cache (Cmd+Shift+R) and try again

---

## ✨ Test After Upload

1. Visit https://breakdowns.gobarry.co.uk
2. Login with supervisor badge
3. Should go to Breakdown Guide (not blank!)
4. Refresh page - should stay logged in
5. Logout - should go back to login

---

**Need detailed instructions?**
See: `CPANEL_DEPLOYMENT_INSTRUCTIONS.md`

**🎉 Build completed: October 22, 2025**
