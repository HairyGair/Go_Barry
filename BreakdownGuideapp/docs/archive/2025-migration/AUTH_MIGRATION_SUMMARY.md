# Authentication Migration Summary
## Supabase Auth → MySQL + JWT

**Migration Date**: 2025-10-16
**Status**: ✅ COMPLETE
**Author**: System Migration

---

## Overview

Successfully migrated all authentication routes from Supabase Auth to MySQL-based authentication with JWT tokens. The system now uses bcrypt password hashing and JSON Web Tokens for secure, stateless authentication.

---

## Files Modified

### 1. `/backend/routes/auth.js`
- **Backup**: `/backend/routes/auth.js.supabase.backup`
- **Changes**: Complete rewrite to use MySQL + JWT
- **Lines**: 1,095 lines (previously 1,140 lines)

### 2. `/backend/migrations/003_add_password_hash.sql`
- **Status**: NEW FILE
- **Purpose**: Add password_hash column and audit columns to supervisors table

### 3. `/backend/package.json`
- **Added**: `bcrypt@^6.0.0` dependency

---

## Endpoint Migration Details

### ✅ POST /api/auth/login
**Before**: Supabase `auth.signInWithPassword()`
**After**: MySQL user lookup + bcrypt password verification + JWT generation

**Changes**:
- Email lookup from MySQL `supervisors` table
- Password verification using `bcrypt.compare()`
- JWT token generation with 24-hour expiration
- Rate limiting via `rateLimitLogin` middleware
- Activity logging maintained

**Response Format**:
```json
{
  "success": true,
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "supervisor",
    "depot": "Washington",
    "badge_number": "AG003",
    "access_token": "jwt_token_here",
    "expires_at": 1234567890
  },
  "session": {
    "access_token": "jwt_token_here",
    "expires_at": 1234567890,
    "expires_in": 86400,
    "token_type": "Bearer"
  },
  "message": "Login successful"
}
```

---

### ✅ POST /api/auth/supervisor-signup
**Before**: Supabase admin user creation + supervisor linking
**After**: MySQL password hash update for existing supervisors

**Changes**:
- Checks if supervisor exists with `is_active = true`
- Verifies no existing `password_hash` (prevents duplicate activation)
- Creates bcrypt hash with 10 salt rounds
- Updates supervisor record with password hash
- Removes Supabase Auth dependency

**Use Case**: Existing supervisors activating their accounts for the first time

---

### ✅ POST /api/auth/signup
**Before**: Supabase `auth.signUp()` + supervisor table insert
**After**: MySQL INSERT with bcrypt password hash

**Changes**:
- Password validation (minimum 8 characters)
- Email format validation
- Badge number format validation (AB123)
- Duplicate checking (email and badge_number)
- UUID generation using `crypto.randomUUID()`
- Password hashing with bcrypt
- Account created with `pending_approval = true`, `is_active = false`

**Use Case**: New supervisors requesting account access

---

### ✅ POST /api/auth/logout
**Before**: Supabase `auth.signOut()`
**After**: JWT token invalidation (client-side)

**Changes**:
- JWT tokens are stateless (no server-side session)
- Decodes token to log user activity
- Client must discard token
- Activity logging maintained

**Note**: To implement server-side token blacklisting, add token to Redis/database blacklist

---

### ✅ POST /api/auth/change-password
**Before**: Supabase admin API `updateUserById()`
**After**: MySQL UPDATE with bcrypt hash

**Changes**:
- Verifies current password with `bcrypt.compare()`
- Validates new password strength (8+ characters)
- Creates new bcrypt hash
- Updates `password_hash` column
- Updates `updated_at` timestamp

---

### ✅ POST /api/auth/admin/reset-password
**Before**: Supabase admin API `updateUserById()`
**After**: MySQL UPDATE with bcrypt hash (admin only)

**Changes**:
- Requires `authenticateAdmin` middleware
- Finds supervisor by email
- Creates new bcrypt hash
- Updates password without current password verification
- Logs admin action

---

### ✅ GET /api/auth/supervisors
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ GET /api/auth/user/:id
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ GET /api/auth/supervisor/:username
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ POST /api/auth/verify
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ GET /api/auth/validate
**Before**: Development fallback only
**After**: JWT token verification

**Changes**: Added `jwt.verify()` to validate token signature and expiration

---

### ✅ GET /api/auth/depots
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ GET /api/auth/recent-sessions
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ GET /api/auth/pending-signups (Admin only)
**Before**: Supabase query
**After**: MySQL query with QueryBuilder

**Changes**: Replaced Supabase client with `from('supervisors')` helper

---

### ✅ POST /api/auth/approve-signup (Admin only)
**Before**: Supabase UPDATE/DELETE
**After**: MySQL UPDATE/DELETE with helper functions

**Changes**:
- Uses `update()` helper for approval
- Uses `remove()` helper for rejection
- Removed Supabase Auth user management

---

### ✅ PUT /api/auth/supervisor/:id (Admin only)
**Before**: Supabase UPDATE
**After**: MySQL UPDATE with helper function

**Changes**: Uses `update()` helper function

---

### ✅ GET /api/supervisors/:id/stats
**Before**: Supabase queries
**After**: MySQL queries with QueryBuilder

**Changes**: Replaced Supabase client with `from()` helper

---

## Database Schema Changes

### New Column: `password_hash`
```sql
ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL
COMMENT 'Bcrypt hashed password for authentication';
```

### New Columns: Audit Fields
```sql
ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS signup_date TIMESTAMP DEFAULT NULL;

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP DEFAULT NULL;

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE;
```

### New Index
```sql
CREATE INDEX IF NOT EXISTS idx_supervisors_email ON supervisors(email);
```

---

## Security Improvements

### 1. **Password Hashing**
- Algorithm: bcrypt
- Salt Rounds: 10
- Hash Length: 60 characters (stored in VARCHAR(255))

### 2. **JWT Security**
- Secret: `process.env.JWT_SECRET` (required)
- Algorithm: HS256 (default)
- Expiration: 24 hours
- Token Format: Bearer token in Authorization header

### 3. **Rate Limiting**
- Login attempts: 5 per 15 minutes per IP
- Automatic cleanup of rate limit entries

### 4. **Input Validation**
- Email format validation
- Password strength requirements (8+ characters)
- Badge number format validation (AB123)

### 5. **Error Handling**
- Generic error messages for failed authentication
- Detailed logging for debugging (console only)
- No password hashes exposed in responses

---

## Environment Variables Required

```bash
# MySQL Database (existing)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=gobarryco_breakdowns

# JWT Configuration (NEW - REQUIRED)
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRATION=24h  # Optional, defaults to 24h

# Legacy (for backward compatibility)
SUPABASE_JWT_SECRET=fallback-if-JWT_SECRET-not-set
```

### ⚠️ CRITICAL: Set JWT_SECRET
```bash
# Generate a secure random secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file:
JWT_SECRET=generated_secret_here
```

---

## Migration Steps

### Step 1: Backup Original Files ✅
```bash
cp routes/auth.js routes/auth.js.supabase.backup
```

### Step 2: Install Dependencies ✅
```bash
npm install bcrypt
```

### Step 3: Run Database Migration ⚠️ REQUIRED
```bash
# Run this SQL script in your MySQL database:
mysql -u your_user -p gobarryco_breakdowns < migrations/003_add_password_hash.sql
```

### Step 4: Set Environment Variables ⚠️ REQUIRED
```bash
# Add to .env file:
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRATION=24h
```

### Step 5: Restart Backend Server
```bash
npm run dev
# or
npm start
```

---

## Testing Checklist

### Manual Testing

- [ ] **POST /api/auth/login** - Test with valid credentials
- [ ] **POST /api/auth/login** - Test with invalid credentials
- [ ] **POST /api/auth/login** - Test rate limiting (6+ failed attempts)
- [ ] **POST /api/auth/supervisor-signup** - Test account activation
- [ ] **POST /api/auth/signup** - Test new supervisor signup
- [ ] **POST /api/auth/logout** - Test logout with valid token
- [ ] **POST /api/auth/change-password** - Test password change
- [ ] **POST /api/auth/admin/reset-password** - Test admin reset (requires admin token)
- [ ] **GET /api/auth/validate** - Test token validation
- [ ] **GET /api/auth/supervisors** - Test supervisor list retrieval

### Automated Testing

Create test file: `/backend/tests/auth-integration.test.js`

```javascript
import request from 'supertest';
import app from '../index.js';

describe('Authentication API', () => {
  test('POST /api/auth/login - Valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('session.access_token');
  });

  test('POST /api/auth/login - Invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('code', 'AUTH_FAILED');
  });
});
```

---

## Rollback Instructions

If you need to rollback to Supabase Auth:

### Step 1: Restore Original File
```bash
cp routes/auth.js.supabase.backup routes/auth.js
```

### Step 2: Remove bcrypt Dependency (Optional)
```bash
npm uninstall bcrypt
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Remove Database Changes (Optional)
```sql
ALTER TABLE supervisors DROP COLUMN password_hash;
ALTER TABLE supervisors DROP COLUMN signup_date;
ALTER TABLE supervisors DROP COLUMN approved_date;
ALTER TABLE supervisors DROP COLUMN pending_approval;
DROP INDEX idx_supervisors_email ON supervisors;
```

---

## Known Issues & Limitations

### 1. **JWT Token Blacklisting**
- Tokens are stateless and cannot be invalidated server-side
- To implement blacklisting, add tokens to Redis/database on logout
- Tokens will remain valid until expiration (24 hours)

### 2. **Password Reset Flow**
- No email-based password reset implemented
- Admin must use `/api/auth/admin/reset-password` to reset passwords
- Consider implementing email-based reset with temporary tokens

### 3. **Account Activation**
- Existing supervisors must use `/api/auth/supervisor-signup` to activate
- No email notification sent to admins for pending approvals
- Consider implementing email notifications

### 4. **Rate Limiting**
- Rate limiting is in-memory (lost on server restart)
- Consider moving to Redis for persistence
- Rate limiting is per-IP, not per-account

---

## Future Improvements

1. **Token Refresh Endpoint**
   - Implement `/api/auth/refresh` to refresh tokens
   - Issue short-lived access tokens (15 minutes) + long-lived refresh tokens (7 days)

2. **Email-Based Password Reset**
   - Implement `/api/auth/forgot-password`
   - Implement `/api/auth/reset-password/:token`
   - Send password reset emails with temporary tokens

3. **Two-Factor Authentication (2FA)**
   - Add TOTP-based 2FA for admin accounts
   - Store 2FA secrets in supervisors table

4. **Session Management**
   - Track active sessions in database
   - Implement `/api/auth/sessions` to list active sessions
   - Allow users to revoke sessions

5. **Audit Logging**
   - Log all authentication events to database
   - Track failed login attempts per account
   - Alert admins of suspicious activity

6. **Token Blacklisting**
   - Implement Redis-based token blacklist
   - Add tokens to blacklist on logout
   - Check blacklist in auth middleware

---

## Support & Questions

If you encounter issues with the migration:

1. **Check the logs**: Look for errors in the backend console
2. **Verify environment variables**: Ensure `JWT_SECRET` is set
3. **Test the database**: Ensure `password_hash` column exists
4. **Check dependencies**: Verify bcrypt is installed
5. **Review backup**: Original file is at `routes/auth.js.supabase.backup`

---

## Conclusion

✅ **Migration Complete**

All authentication endpoints have been successfully migrated from Supabase Auth to MySQL + JWT. The system is now fully independent of Supabase authentication services and uses industry-standard bcrypt password hashing and JWT tokens.

**Next Steps**:
1. Run database migration: `migrations/003_add_password_hash.sql`
2. Set `JWT_SECRET` environment variable
3. Restart backend server
4. Test all authentication endpoints
5. Update any existing user passwords (they'll need to use supervisor-signup)

---

**Files Created**:
- `/backend/routes/auth.js` (migrated)
- `/backend/routes/auth.js.supabase.backup` (backup)
- `/backend/migrations/003_add_password_hash.sql` (migration)
- `/backend/AUTH_MIGRATION_SUMMARY.md` (this document)
