# Backend Build & Deploy Guide

## 🚀 NEW: One-Command Build for cPanel

Your backend now has a build system just like the frontend!

---

## ⚡ Quick Deploy (2 Steps)

### Step 1: Build for Production
```bash
cd backend
npm run build
```

**What happens:**
- Creates a `dist/` folder with all necessary files
- Optimizes for production
- Removes dev dependencies
- Includes deployment instructions
- **Total size: ~500 KB**

### Step 2: Upload with Cyberduck
1. Open Cyberduck
2. Connect to your cPanel server
3. Navigate to your `api` folder
4. Drag and drop **contents of `backend/dist/`**
5. Done! (Then run npm install on server)

---

## 📦 What Gets Included in dist/

```
dist/
├── server.js                    ← Main server file
├── package.json                 ← Production dependencies only
├── package-lock.json            ← Locked versions
├── .env                         ← Environment config (update after upload!)
├── DEPLOYMENT_INSTRUCTIONS.txt  ← Step-by-step guide
├── routes/                      ← All API routes (17 files)
├── services/                    ← All services (6 files)
├── middleware/                  ← All middleware (3 files)
├── migrations/                  ← Database migrations (8 files)
├── scripts/                     ← Helper scripts (6 files)
└── data/                        ← Data files (5 files)

EXCLUDED:
✗ node_modules/    (install on server)
✗ logs/            (create on server)
✗ .git/            (not needed)
✗ dist/            (not needed)
✗ test files       (not needed)
```

---

## 🎯 Build Commands

```bash
# Standard build
npm run build

# Clean build (removes old dist first)
npm run build:clean

# Development (no build needed)
npm run dev
```

---

## 📋 Full Deployment Checklist

### 1. Build Backend ✅
```bash
cd backend
npm run build
```

### 2. Upload via Cyberduck ✅
- Open Cyberduck/FTP
- Navigate to `/public_html/api/` (or your backend folder)
- Drag and drop **contents** of `backend/dist/`

### 3. Install Dependencies on Server 🔧
Via cPanel Terminal or SSH:
```bash
cd /path/to/api
npm install --production
```

### 4. Update .env File ⚙️
Edit the `.env` file on the server:
```bash
# Verify these are correct for production
DB_HOST=localhost
DB_USER=gobarryco
DB_PASSWORD=<your-password>
DB_NAME=gobarryco_breakdowns

JWT_ACCESS_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-secret>
```

### 5. Run Database Migrations 🗄️
Via phpMyAdmin:
- Run `migrations/verify-supervisors-table.sql`
- Run `migrations/add-security-indexes.sql`
- Run `migrations/create-audit-logs.sql`
- Run `migrations/add-refresh-tokens.sql`

### 6. Create Logs Directory 📁
```bash
mkdir logs
chmod 755 logs
```

### 7. Restart Backend Server 🔄
```bash
pm2 restart backend
# or
pm2 start server.js --name backend
```

### 8. Test 🧪
```bash
curl https://gobarry.co.uk/api/auth/health
```

Expected: `{"status":"healthy","database":"connected"}`

---

## 🔍 What's Different from Frontend Build?

### Frontend (Expo):
```bash
npm run build           # Compiles React Native to web bundle
# Result: dist/ folder with compiled JavaScript
```

### Backend (Node.js):
```bash
npm run build           # Copies source files (no compilation needed)
# Result: dist/ folder with organized source code
```

**Why no compilation?**
- Node.js runs JavaScript natively
- No need for webpack/babel
- Just organizing and excluding dev files

---

## 💡 Tips

### Tip 1: Always build before uploading
```bash
npm run build:clean    # Ensures fresh build
```

### Tip 2: Check build output
The build script shows:
- Number of files copied
- Total size
- What was included/excluded

### Tip 3: Read DEPLOYMENT_INSTRUCTIONS.txt
After building, check `dist/DEPLOYMENT_INSTRUCTIONS.txt` for server-specific steps.

### Tip 4: Gitignore is set
The `dist/` folder is ignored by git (like frontend), so it won't clutter your repository.

---

## 🆘 Troubleshooting

### Build fails: "Cannot find module 'fs-extra'"
```bash
npm install
```

### Dist folder is empty
```bash
npm run build:clean
```

### Files missing from dist
Check `scripts/build-for-cpanel.js` - The `INCLUDE` array lists what gets copied.

### Want to include additional files?
Edit `backend/scripts/build-for-cpanel.js`:
```javascript
const INCLUDE = [
  'server.js',
  'package.json',
  // ... add more here
];
```

---

## 📊 Comparison: Before vs After

### Before (Manual Upload):
1. ❌ Manually select files in Cyberduck
2. ❌ Accidentally upload node_modules/ (huge!)
3. ❌ Forget to upload new services/middleware
4. ❌ Upload test files unnecessarily
5. ❌ No clear instructions for deployment

### After (Build System):
1. ✅ Run `npm run build`
2. ✅ Upload single `dist/` folder
3. ✅ Only production files included
4. ✅ Optimized and organized
5. ✅ Deployment instructions included

---

## 🎉 Benefits

✅ **Fast**: One command builds everything
✅ **Consistent**: Same files every time
✅ **Small**: Only 500KB (vs GBs with node_modules)
✅ **Safe**: Automatically excludes dev files
✅ **Clear**: Includes deployment instructions
✅ **Professional**: Like enterprise deployments

---

## 🚀 Quick Reference Card

```bash
# Development
npm run dev              # Start dev server with nodemon

# Build for Production
npm run build            # Create dist/ folder
npm run build:clean      # Clean build from scratch

# Deploy
1. npm run build
2. Upload backend/dist/ contents via Cyberduck
3. npm install --production (on server)
4. Restart server
```

---

**That's it!** Your backend now deploys as easily as your frontend. 🎉
