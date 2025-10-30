# 🚀 DEPLOY NOW - MySQL Auth Fix

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

## ✅ What's Fixed

**Problem**: Login didn't work (frontend used Supabase, but database is MySQL on cPanel)
**Solution**: Frontend now calls cPanel MySQL backend API for authentication

---

## 📦 Upload These Files

**From**:
```
/Users/anthony/Go BARRY App/BreakdownGuideapp/frontend/dist/
```

**To** (via Cyberduck):
```
cPanel → public_html/
```

**IMPORTANT**: Upload **ALL** files, including `.htaccess`

---

## 🔑 Test Login

**URL**: https://breakdowns.gobarry.co.uk

**Test Credentials**:
- Email: jamie.rao@goahead.com
- Password: Stafford45!

(Or any supervisor email/password from your MySQL database)

---

## ✅ What Should Happen

1. ✅ Login page loads
2. ✅ Enter credentials
3. ✅ Redirects to /breakdown-guide (not back to login!)
4. ✅ User name shows in header
5. ✅ Refresh page → stays logged in

---

## 🔍 Check Network Tab (F12)

**BEFORE (Broken)**:
- Saw: `POST https://oieliubbvvdzhzvikzal.supabase.co/auth/v1/token` ❌

**AFTER (Fixed)**:
- See: `POST https://api.breakdowns.gobarry.co.uk/api/auth/login` ✅

---

## ⚠️ If Login Still Fails

### Check Backend:
```bash
pm2 status gobarry-backend
# Should show: online
```

### Check Database:
Supervisor must have:
- ✅ Email in MySQL `supervisors` table
- ✅ `password_hash` column (bcrypt hash)
- ✅ `is_active = true`

### Check Password:
If user has no password_hash, you need to set it:
```sql
UPDATE supervisors
SET password_hash = '$2b$10$YourBcryptHashHere'
WHERE email = 'jamie.rao@goahead.com';
```

Generate hash with: `bcrypt.hash('Stafford45!', 10)`

---

## 📄 Full Documentation

See: `/MYSQL_AUTH_FIX_COMPLETE.md` for complete details

---

## 🎯 Quick Checklist

- [ ] Upload dist/ folder via Cyberduck
- [ ] Include .htaccess file (show hidden files)
- [ ] Backend is running (pm2 status)
- [ ] Test login at breakdowns.gobarry.co.uk
- [ ] Check network tab shows api.breakdowns.gobarry.co.uk
- [ ] Verify session persists on refresh

---

**Build Date**: October 22, 2025 22:43
**Ready**: ✅ YES - Upload now!
