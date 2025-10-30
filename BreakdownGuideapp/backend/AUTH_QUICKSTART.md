# Authentication Migration - Quick Start Guide

## ⚠️ CRITICAL: Follow These Steps BEFORE Starting Backend

### Step 1: Install bcrypt (DONE ✅)
```bash
npm install bcrypt
```

### Step 2: Run Database Migration (⚠️ REQUIRED)
```bash
mysql -u your_mysql_user -p gobarryco_breakdowns < migrations/003_add_password_hash.sql
```

Or run manually in MySQL:
```sql
USE gobarryco_breakdowns;

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL
COMMENT 'Bcrypt hashed password for authentication';

CREATE INDEX IF NOT EXISTS idx_supervisors_email ON supervisors(email);

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS signup_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE;
```

### Step 3: Set JWT_SECRET (⚠️ REQUIRED)
Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to your `.env` file:
```bash
JWT_SECRET=paste_generated_secret_here
JWT_EXPIRATION=24h
```

### Step 4: Start Backend
```bash
npm run dev
# or
npm start
```

---

## Quick Test

Test login endpoint:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anthony.gair@gonortheast.co.uk",
    "password": "your_password"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": { ... },
  "session": {
    "access_token": "eyJhbGc...",
    "expires_at": 1234567890,
    "token_type": "Bearer"
  }
}
```

---

## Files Changed

1. ✅ `/backend/routes/auth.js` - Migrated to MySQL + JWT
2. ✅ `/backend/routes/auth.js.supabase.backup` - Original backup
3. ✅ `/backend/migrations/003_add_password_hash.sql` - Database migration
4. ✅ `/backend/package.json` - Added bcrypt dependency

---

## What Changed?

- **Before**: Supabase Auth (external service)
- **After**: MySQL + JWT (self-hosted)

### Authentication Flow
1. User sends email + password to `/api/auth/login`
2. Backend looks up user in MySQL `supervisors` table
3. Verifies password with bcrypt
4. Generates JWT token (24-hour expiration)
5. Returns token to client
6. Client includes token in Authorization header: `Bearer <token>`

---

## Important Notes

- **Existing users must re-activate accounts**: Use `/api/auth/supervisor-signup`
- **JWT tokens expire after 24 hours**: Client must re-login
- **Rate limiting active**: 5 failed login attempts per 15 minutes
- **Tokens are stateless**: Cannot be invalidated server-side (until blacklisting is implemented)

---

## Need Help?

- **Full documentation**: See `AUTH_MIGRATION_SUMMARY.md`
- **Rollback instructions**: See backup file `routes/auth.js.supabase.backup`
- **Test the API**: Use Postman or curl to test endpoints
