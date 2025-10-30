# Files to Upload to cPanel

## ✅ BACKEND FILES (Upload to your backend directory)

### NEW FILES - Must Upload:

```
backend/
├── services/
│   ├── database.js
│   ├── logger.js
│   ├── tokenBlacklist.js
│   └── auditLogger.js
│
├── middleware/
│   ├── validation.js
│   └── rateLimiting.js
│
├── routes/
│   └── authSecure.js
│
├── migrations/
│   ├── verify-supervisors-table.sql
│   ├── add-security-indexes.sql
│   ├── create-audit-logs.sql
│   └── add-refresh-tokens.sql
│
└── scripts/
    └── run-migrations.js
```

### MODIFIED FILES - Must Upload:

```
backend/
├── server.js          (NOW USES authSecure)
├── .env               (ADD JWT secrets)
└── package.json       (NEW dependencies)
```

---

## 🎨 FRONTEND FILES (Upload to your Go_BARRY directory)

### NEW FILES - Must Upload:

```
Go_BARRY/
├── components/hooks/
│   └── useApi.js
│
└── utils/
    └── tokenManager.js
```

### MODIFIED FILES - Must Upload:

```
Go_BARRY/
└── components/hooks/
    └── useSupervisorSessionOptimized.js
```

---

## 📍 File Locations (Full Paths)

All files are in: `/Users/anthony/Go BARRY App/`

### Backend:
- Services: `/Users/anthony/Go BARRY App/backend/services/`
- Middleware: `/Users/anthony/Go BARRY App/backend/middleware/`
- Routes: `/Users/anthony/Go BARRY App/backend/routes/`
- Migrations: `/Users/anthony/Go BARRY App/backend/migrations/`
- Scripts: `/Users/anthony/Go BARRY App/backend/scripts/`

### Frontend:
- Hooks: `/Users/anthony/Go BARRY App/Go_BARRY/components/hooks/`
- Utils: `/Users/anthony/Go BARRY App/Go_BARRY/utils/`

---

## 🗄️ SQL MIGRATIONS TO RUN (In phpMyAdmin)

**Run these 4 files IN ORDER via phpMyAdmin SQL tab:**

1. `migrations/verify-supervisors-table.sql`
2. `migrations/add-security-indexes.sql`
3. `migrations/create-audit-logs.sql`
4. `migrations/add-refresh-tokens.sql`

---

## ⚙️ .ENV VARIABLES TO ADD

**Add to `backend/.env` file:**

```bash
# JWT Configuration
JWT_ACCESS_SECRET=hPa0aPbwhqdtG6EIW1AWkSGmz2gfHV6QlAWObk6Yx+M=
JWT_REFRESH_SECRET=6mjSuVtkevNfbesTa8/WtJAF3Jl915RxQZSMgyvaKcg=
JWT_ISSUER=go-barry-api
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

**Verify these are correct:**
```bash
DB_HOST=localhost
DB_USER=gobarryco
DB_PASSWORD=Turnip1105!!!!!
DB_NAME=gobarryco_breakdowns
```

---

## 📦 AFTER UPLOAD

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Run migrations** (via phpMyAdmin - see above)

3. **Create logs directory:**
   ```bash
   mkdir backend/logs
   ```

4. **Restart backend:**
   ```bash
   pm2 restart backend
   ```

5. **Test:**
   ```bash
   curl https://gobarry.co.uk/api/auth/health
   ```

---

## ✅ Quick Upload Checklist

- [ ] Upload 4 files to `backend/services/`
- [ ] Upload 2 files to `backend/middleware/`
- [ ] Upload 1 file to `backend/routes/` (authSecure.js)
- [ ] Upload 4 SQL files to `backend/migrations/`
- [ ] Upload 1 file to `backend/scripts/`
- [ ] Upload modified `backend/server.js`
- [ ] Edit `backend/.env` (add JWT secrets)
- [ ] Upload modified `backend/package.json`
- [ ] Upload 1 file to `Go_BARRY/components/hooks/` (useApi.js)
- [ ] Upload 1 file to `Go_BARRY/utils/` (tokenManager.js)
- [ ] Upload modified `Go_BARRY/components/hooks/useSupervisorSessionOptimized.js`
- [ ] Run `npm install` in backend
- [ ] Run 4 SQL migrations via phpMyAdmin
- [ ] Create `backend/logs/` directory
- [ ] Restart backend server
- [ ] Test authentication

---

**Total Files to Upload:** ~15 files
**Time Required:** 15-20 minutes for upload
**Total Deployment Time:** 30-45 minutes

**Next Steps:** Follow the complete guide in `CPANEL_DEPLOYMENT_GUIDE.md`
