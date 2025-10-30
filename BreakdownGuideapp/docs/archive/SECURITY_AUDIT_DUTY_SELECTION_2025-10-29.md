# Security Audit Report: Duty Selection Authentication System
**Go BARRY Breakdown Management System**

**Date:** October 29, 2025
**Auditor:** Claude Code (Security Analysis Agent)
**Scope:** New duty selection authentication flow
**Systems Reviewed:**
- Frontend: React at https://breakdowns.gobarry.co.uk
- Backend: Node.js/Express at https://api.breakdowns.gobarry.co.uk
- Database: MySQL (cPanel hosting)
- Authentication: JWT tokens with bcrypt password hashing

---

## Executive Summary

**Overall Security Rating: 7.5/10** (Good, with room for improvement)

The new duty selection authentication system demonstrates strong security fundamentals with proper JWT authentication, parameterized queries to prevent SQL injection, rate limiting, and secure password handling. However, several critical and high-priority vulnerabilities require immediate attention, particularly around development fallbacks, input validation, and session management.

### Key Findings
- **CRITICAL:** Development authentication bypass in production
- **HIGH:** Insufficient input validation on duty code parameter
- **HIGH:** JWT secret configuration vulnerabilities
- **MEDIUM:** Potential XSS vulnerabilities in frontend
- **MEDIUM:** Session management race conditions

---

## 1. Authentication & Authorization

### ✅ STRENGTHS

#### Proper JWT Token Verification
**File:** `/backend/middleware/authMiddleware.js` (Lines 176-279)

```javascript
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_TOKEN_MISSING'
        });
    }

    const token = authHeader.substring(7);
    decoded = jwt.verify(token, JWT_SECRET);
}
```

**Security Score: 9/10**
- Properly requires `Bearer` token in Authorization header
- Uses `jwt.verify()` to validate signature and expiration
- Returns appropriate HTTP 401 status codes
- Implements proper error codes for debugging

#### Protected Set-Duty Endpoint
**File:** `/backend/routes/auth.js` (Lines 1249-1311)

```javascript
router.post('/set-duty', verifyToken, async (req, res) => {
    const supervisorId = req.user.id;  // From verified JWT token
    // ... endpoint implementation
});
```

**Security Score: 8/10**
- Endpoint properly protected with `verifyToken` middleware
- Supervisor ID extracted from verified JWT token (req.user.id)
- Cannot set duty for other supervisors (uses authenticated user's ID)

#### Rate Limiting Implementation
**File:** `/backend/middleware/authMiddleware.js` (Lines 48-97)

**Security Score: 8/10**
- Login rate limiting: 5 attempts per 15 minutes per IP/User-Agent
- SDC operations: 100 operations per 15 minutes
- Automatic cleanup of old rate limit entries
- Returns retry-after headers

---

### ⚠️ CRITICAL ISSUES

#### 1. Development Authentication Bypass in Production Code

**CRITICAL SEVERITY - MUST FIX IMMEDIATELY**

**File:** `/backend/middleware/authMiddleware.js` (Lines 257-272)

```javascript
// Development fallback to prevent crashes
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Auth error fallback for', req.path);
    req.user = {
        id: '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0',
        email: 'anthony.gair@gonortheast.co.uk',
        name: 'Anthony Gair',
        role: 'admin',
        // ... grants full admin access
    };
    return next();
}
```

**Risk:** If `NODE_ENV` is not set to `production` (common misconfiguration), this creates a backdoor that grants anyone full admin access without authentication.

**OWASP Reference:** A01:2021 - Broken Access Control

**Proof of Concept:**
1. If NODE_ENV is undefined, `process.env.NODE_ENV === 'development'` may evaluate truthy
2. Attacker sends any request to protected endpoint
3. Even with invalid/no token, authentication is bypassed
4. Full admin access granted

**Recommended Fix:**
```javascript
// NEVER allow authentication bypass in production
// Remove development fallback entirely OR check explicitly for development
if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_BYPASS === 'true') {
    console.warn('⚠️ DEVELOPMENT ONLY: Using fallback auth');
    // ... fallback code
}

// Production should ALWAYS reject invalid auth
return res.status(401).json({
    error: 'Authentication failed',
    code: 'AUTH_VERIFICATION_FAILED'
});
```

**Impact:** Complete authentication bypass, unauthorized admin access
**Likelihood:** Medium (depends on environment configuration)
**Priority:** P0 - Fix before production deployment

---

#### 2. Duplicate Development Bypass in requireSupervisor

**CRITICAL SEVERITY**

**File:** `/backend/middleware/authMiddleware.js` (Lines 316-331)

```javascript
// Development fallback to prevent crashes
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Supervisor check fallback for', req.path);
    req.supervisor = { /* ... admin credentials ... */ };
    return next();
}
```

**Risk:** Second authentication bypass, same vulnerability as above.

**Impact:** Allows supervisor privilege escalation
**Priority:** P0 - Fix immediately

---

### 🔴 HIGH PRIORITY ISSUES

#### 3. JWT Secret Configuration Vulnerability

**HIGH SEVERITY**

**File:** `/backend/middleware/authMiddleware.js` (Lines 13-20)

```javascript
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL: Missing required JWT_SECRET');
    process.exit(1);  // Good - fails closed
}
```

**Issues:**
1. **Fallback to deprecated SUPABASE_JWT_SECRET** - May use old/leaked secret
2. **No validation of secret strength** - Could be "password123"
3. **Exit on missing secret is good** - But should happen earlier in startup

**File:** `/backend/.env.example` (Lines 63-65)

```bash
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=24h
```

**Risks:**
- Example secret might be used in production
- No minimum length requirement (should be ≥256 bits / 32 bytes)
- No documentation on secret generation

**OWASP Reference:** A02:2021 - Cryptographic Failures

**Recommended Fix:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL: Missing required JWT_SECRET');
    console.error('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

// Validate secret strength
if (JWT_SECRET.length < 32) {
    console.error('❌ FATAL: JWT_SECRET must be at least 32 characters');
    process.exit(1);
}

// Prevent use of example/default secrets
const FORBIDDEN_SECRETS = [
    'your_jwt_secret_here_change_in_production',
    'change_me',
    'secret',
    'password'
];

if (FORBIDDEN_SECRETS.includes(JWT_SECRET)) {
    console.error('❌ FATAL: Using default/example JWT_SECRET is forbidden');
    process.exit(1);
}
```

**Priority:** P1 - Fix before production deployment

---

## 2. Input Validation & SQL Injection

### ✅ STRENGTHS

#### Parameterized Queries Prevent SQL Injection
**File:** `/backend/utils/queryHelpers.js` (Lines 60-64)

```javascript
eq(column, value) {
    this.whereConditions.push(`${column} = ?`);  // Placeholder
    this.whereParams.push(value);                 // Separate params
    return this;
}
```

**Security Score: 9/10**
- All database queries use parameterized statements (prepared statements)
- User input never directly concatenated into SQL
- Query builder enforces separation of SQL structure and data

**File:** `/backend/routes/auth.js` (Lines 1270-1273)

```javascript
const supervisorResult = await query(
    'SELECT id, name, badge_number FROM supervisors WHERE id = ?',
    [supervisorId]  // Parameterized - safe from SQL injection
);
```

**OWASP Reference:** A03:2021 - Injection (Properly Mitigated)

#### MySQL Configuration Prevents Multiple Statements
**File:** `/backend/config/mysql.js` (Line 47)

```javascript
multipleStatements: false, // Security: prevent SQL injection via multiple statements
```

**Security Score: 10/10**
- Prevents stacked query attacks (e.g., `'; DROP TABLE users; --`)

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 4. Insufficient Input Validation on Duty Code

**MEDIUM SEVERITY**

**File:** `/backend/routes/auth.js` (Lines 1254-1267)

```javascript
if (!duty) {
    return res.status(400).json({
        success: false,
        error: 'Duty code is required'
    });
}

// Validate duty code
if (!dutyManager.DUTY_SHIFTS[duty]) {
    return res.status(400).json({
        success: false,
        error: `Invalid duty code: ${duty}`  // ⚠️ Reflects user input
    });
}
```

**Issues:**
1. **No type validation** - Accepts any data type, not just strings
2. **No length limit** - Could send 10MB duty code string
3. **Reflected input in error message** - Potential XSS if error displayed in browser
4. **No sanitization** - Should validate format (e.g., "Duty XXX")

**OWASP Reference:** A03:2021 - Injection (Insufficient Validation)

**Recommended Fix:**
```javascript
// Strict input validation
if (!duty || typeof duty !== 'string') {
    return res.status(400).json({
        success: false,
        error: 'Duty code must be a string'
    });
}

// Length validation
if (duty.length > 20) {
    return res.status(400).json({
        success: false,
        error: 'Duty code too long'
    });
}

// Format validation (whitelist)
const DUTY_CODE_REGEX = /^Duty \d{3}$/;
if (!DUTY_CODE_REGEX.test(duty)) {
    return res.status(400).json({
        success: false,
        error: 'Invalid duty code format. Expected: "Duty XXX"'
    });
}

// Check against allowed duties
if (!dutyManager.DUTY_SHIFTS[duty]) {
    return res.status(400).json({
        success: false,
        error: 'Duty code not found',
        // Do NOT reflect user input
    });
}
```

**Priority:** P2 - Fix within 1 week

---

#### 5. Supervisor ID Validation Missing

**MEDIUM SEVERITY**

**File:** `/backend/routes/auth.js` (Lines 1252, 1270-1280)

```javascript
const supervisorId = req.user.id;  // No validation on this value

const supervisorResult = await query(
    'SELECT id, name, badge_number FROM supervisors WHERE id = ?',
    [supervisorId]
);

if (supervisorResult.length === 0) {
    return res.status(404).json({
        success: false,
        error: 'Supervisor not found'  // Only checked AFTER query
    });
}
```

**Issues:**
1. **No validation that supervisorId is UUID format** - Could be any value
2. **Relies entirely on JWT token parsing** - If token parsing has bug, could inject malicious ID
3. **No check if supervisor is active** - Could set duty for deactivated supervisor

**Recommended Fix:**
```javascript
const supervisorId = req.user.id;

// Validate UUID format (assuming UUIDs are used)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!supervisorId || !UUID_REGEX.test(supervisorId)) {
    return res.status(401).json({
        success: false,
        error: 'Invalid supervisor ID in token'
    });
}

const supervisorResult = await query(
    'SELECT id, name, badge_number FROM supervisors WHERE id = ? AND is_active = 1',
    [supervisorId]
);
```

**Priority:** P2 - Fix within 1 week

---

## 3. JWT Token Security

### ✅ STRENGTHS

#### Token Stored Securely in Frontend
**File:** `/frontend/src/services/backend-auth-service.js` (Lines 181-188)

```javascript
saveSessionToStorage(session) {
    try {
        localStorage.setItem('gobarry_session', JSON.stringify(session));
        localStorage.setItem('gobarry_auth_timestamp', Date.now().toString());
    } catch (error) {
        console.error('Failed to save session:', error);
    }
}
```

**Security Score: 7/10**
- Uses localStorage (acceptable for JWT tokens)
- Not vulnerable to CSRF (token not in cookies)
- Proper error handling

**Note:** localStorage is XSS-vulnerable, but acceptable for JWT tokens as long as XSS is prevented elsewhere.

#### Token Sent via Authorization Header
**File:** `/frontend/src/services/backend-auth-service.js` (Lines 331-345)

```javascript
async authenticatedFetch(endpoint, options = {}) {
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.currentSession.access_token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
}
```

**Security Score: 10/10**
- Token sent in Authorization header (best practice)
- Not sent in URL query parameters (would be logged)
- Proper Bearer token format

#### Token Expiration Handled
**File:** `/frontend/src/services/backend-auth-service.js` (Lines 139-146)

```javascript
isSessionValid(session) {
    if (!session || !session.expires_at) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return session.expires_at > now;
}
```

**Security Score: 9/10**
- Validates token expiration client-side
- Server also validates expiration in JWT library
- Automatic cleanup of expired sessions

#### Token Refresh Implemented
**File:** `/frontend/src/services/backend-auth-service.js` (Lines 225-240)

```javascript
setupRefreshTimer(session) {
    const expiresIn = session.expires_at - now;
    const refreshIn = Math.max(0, (expiresIn - 300) * 1000); // Refresh 5 minutes before expiry

    if (refreshIn > 0) {
        this.refreshTimer = setTimeout(() => {
            this.refreshSession();
        }, refreshIn);
    }
}
```

**Security Score: 9/10**
- Automatic token refresh 5 minutes before expiry
- Prevents session interruption for active users
- Reduces need for re-authentication

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 6. Token Expiration Too Long

**MEDIUM SEVERITY**

**File:** `/backend/.env.example` (Line 65)

```bash
JWT_EXPIRES_IN=24h
```

**Risk:** 24-hour token lifetime is excessive for a sensitive breakdown management system. If token is stolen, attacker has 24 hours of access.

**OWASP Reference:** A07:2021 - Identification and Authentication Failures

**Recommended Fix:**
```bash
# More secure token lifetimes
JWT_EXPIRES_IN=1h           # Access token: 1 hour
REFRESH_TOKEN_EXPIRES_IN=7d # Refresh token: 7 days (if implemented)
```

**Best Practice:**
- Access tokens: 15 minutes to 1 hour
- Refresh tokens: 7-30 days
- Implement refresh token rotation

**Priority:** P2 - Fix within 1 week

---

#### 7. No Token Revocation Mechanism

**MEDIUM SEVERITY**

**Issue:** If a supervisor's account is compromised or they are terminated, there is no way to immediately revoke their active JWT tokens. Tokens remain valid until expiration (24 hours).

**Current Implementation:**
- `/backend/middleware/authMiddleware.js` (Lines 218-221) checks if user exists
- Does NOT check for token revocation list or "logged_out_at" timestamp

**Recommended Fix:**

**Database Schema:**
```sql
ALTER TABLE supervisors
ADD COLUMN tokens_invalid_before TIMESTAMP NULL DEFAULT NULL;

-- On password change or forced logout:
UPDATE supervisors
SET tokens_invalid_before = NOW()
WHERE id = ?;
```

**Middleware Update:**
```javascript
// In verifyToken middleware
const supervisor = supervisorResult[0];

// Check if token was issued before forced logout
if (supervisor.tokens_invalid_before) {
    const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
    const invalidBefore = new Date(supervisor.tokens_invalid_before).getTime();

    if (tokenIssuedAt < invalidBefore) {
        return res.status(401).json({
            error: 'Token has been revoked',
            code: 'AUTH_TOKEN_REVOKED'
        });
    }
}
```

**Priority:** P3 - Implement within 2 weeks

---

## 4. Frontend Security (XSS & Input Sanitization)

### ✅ STRENGTHS

#### React Provides Automatic XSS Protection
**File:** `/frontend/src/components/DutySelectionModal.jsx` (Lines 106-108)

```jsx
<span className="duty-code">{duty.code}</span>
<span className="duty-time">{duty.startTime} - {duty.endTime}</span>
<span className="duty-description">{duty.description}</span>
```

**Security Score: 9/10**
- React automatically escapes JSX expressions
- Prevents XSS in rendered content
- No use of `dangerouslySetInnerHTML`

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 8. Potential XSS in Error Messages

**MEDIUM SEVERITY**

**File:** `/frontend/src/components/DutySelectionModal.jsx` (Lines 114-117)

```jsx
{error && (
    <div className="duty-modal-error">
        <span>⚠️</span> {error}  {/* ⚠️ Renders user-controlled error string */}
    </div>
)}
```

**Risk:** If backend returns user input in error message (as seen in Issue #4), it could be rendered unsanitized.

**Example Attack:**
```javascript
// Attacker sends malicious duty code:
{ duty: "<img src=x onerror=alert('XSS')>" }

// Backend reflects it in error:
error: "Invalid duty code: <img src=x onerror=alert('XSS')>"

// Frontend renders it (React escapes, but still displays)
```

**React does escape this**, so not exploitable, but demonstrates poor practice.

**Recommended Fix:**
```javascript
// Backend: Never reflect user input in error messages
if (!dutyManager.DUTY_SHIFTS[duty]) {
    return res.status(400).json({
        success: false,
        error: 'Invalid duty code',  // Generic message
        code: 'INVALID_DUTY_CODE'
    });
}

// Frontend: Still display errors safely
{error && (
    <div className="duty-modal-error" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{error}</span>  {/* React auto-escapes */}
    </div>
)}
```

**Priority:** P3 - Fix within 2 weeks

---

#### 9. API URL Configuration Vulnerability

**LOW SEVERITY**

**File:** `/frontend/src/components/DutySelectionModal.jsx` (Lines 23-25)

```javascript
const apiUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://api.breakdowns.gobarry.co.uk';
```

**Issues:**
1. **Hardcoded URLs** - Should use environment variable
2. **HTTP in development** - Should use HTTPS everywhere
3. **No HTTPS validation** - Could be overridden to HTTP in production

**Recommended Fix:**
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

// Validate HTTPS in production
if (import.meta.env.MODE === 'production' && !apiUrl.startsWith('https://')) {
    throw new Error('API URL must use HTTPS in production');
}
```

**Priority:** P3 - Fix within 2 weeks

---

## 5. Session Management

### ✅ STRENGTHS

#### Automatic Session Cleanup on Token Expiry
**File:** `/frontend/src/services/backend-auth-service.js` (Lines 109-132)

```javascript
async getCurrentSession() {
    if (this.currentSession) {
        if (this.isSessionValid(this.currentSession)) {
            return { success: true, session: this.currentSession };
        } else {
            // Session expired, clear it
            await this.signOut();
            return { success: false, session: null };
        }
    }
    // ... restore from storage with validation
}
```

**Security Score: 9/10**
- Validates session before use
- Automatically cleans up expired sessions
- Prevents use of stale tokens

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 10. Race Condition in Duty Setting

**MEDIUM SEVERITY**

**File:** `/backend/routes/auth.js` (Lines 1284-1290)

```javascript
// Start the shift
const shiftInfo = await dutyManager.startShift({
    supervisorId: supervisor.id,
    supervisorName: supervisor.name,
    supervisorBadge: supervisor.badge_number,
    duty: duty
});
```

**Issue:** No transaction or locking to prevent race conditions. If two requests arrive simultaneously:

1. Request A checks supervisor exists
2. Request B checks supervisor exists
3. Request A creates shift
4. Request B creates shift (duplicate!)

**Recommended Fix:**
```javascript
// Wrap in transaction
const connection = await pool.getConnection();
await connection.beginTransaction();

try {
    // Lock supervisor row to prevent concurrent updates
    const [supervisorResult] = await connection.query(
        'SELECT id, name, badge_number FROM supervisors WHERE id = ? FOR UPDATE',
        [supervisorId]
    );

    if (supervisorResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({
            success: false,
            error: 'Supervisor not found'
        });
    }

    // Create shift
    const shiftInfo = await dutyManager.startShift({
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        supervisorBadge: supervisor.badge_number,
        duty: duty
    }, connection);  // Pass connection to use same transaction

    await connection.commit();
    connection.release();

    res.json({ success: true, duty, shiftInfo });

} catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
}
```

**Priority:** P2 - Fix within 1 week

---

#### 11. No Session Invalidation on Duty Change

**LOW SEVERITY**

**Issue:** When a supervisor sets their duty, the existing JWT token is not invalidated. The token still contains old duty information until it expires naturally.

**Impact:** Minimal - The backend re-fetches supervisor data on each request, so old token data is not trusted. However, this could cause confusion if token claims are displayed in the UI.

**Recommended Enhancement:**
- Option A: Invalidate and reissue token on duty change
- Option B: Store duty in database only, never in token (current approach is fine)

**Priority:** P4 - Optional enhancement

---

## 6. Network Security (HTTPS, CORS, Headers)

### ✅ STRENGTHS

#### HTTPS Enforced in Production
**Configuration:** Production domains use HTTPS

**Security Score: 10/10**
- Frontend: `https://breakdowns.gobarry.co.uk`
- Backend: `https://api.breakdowns.gobarry.co.uk`
- No HTTP endpoints exposed

#### Proper CORS Configuration
**File:** `/backend/server.js` (Lines 122-128)

```javascript
app.use(cors({
  origin: getAllowedOrigins(),  // Whitelist of allowed origins
  credentials: true,            // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision']
}));
```

**Security Score: 9/10**
- Whitelist-based origin validation
- Supports credentials (required for Authorization header)
- Proper method and header restrictions

**Origin Whitelist:** `/backend/server.js` (Lines 93-118)

```javascript
const getAllowedOrigins = () => {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://breakdowns.gobarry.co.uk',
    'https://www.breakdowns.gobarry.co.uk'
  ];

  const regexOrigins = [
    /\.gobarry\.co\.uk$/,
    /localhost:\d+$/
  ];

  return [...defaultOrigins, ...regexOrigins];
};
```

**Good:** Regex patterns prevent subdomain attacks
**Good:** Localhost allowed only for development

#### Security Headers with Helmet
**File:** `/backend/server.js` (Line 121)

```javascript
app.use(helmet());
```

**Security Score: 8/10**
- Automatically sets security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy` (default restrictive policy)

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 12. CORS Wildcard in Regex

**LOW SEVERITY**

**File:** `/backend/server.js` (Lines 110-115)

```javascript
const regexOrigins = [
    /\.onrender\.com$/,      // ⚠️ Matches ANY subdomain
    /\.render\.com$/,        // ⚠️ Matches ANY subdomain
    /\.gobarry\.co\.uk$/,    // ⚠️ Matches ANY subdomain
    /localhost:\d+$/
];
```

**Risk:** An attacker who controls `evil.gobarry.co.uk` could make requests to the API.

**Recommended Fix:**
```javascript
const regexOrigins = [
    // Only allow specific subdomains
    /^https:\/\/(api|breakdowns|www)\.gobarry\.co\.uk$/,
    /^https:\/\/[a-z0-9-]+\.onrender\.com$/,  // Only lowercase alphanumeric
    /^http:\/\/localhost:\d+$/                  // Explicitly localhost
];
```

**Priority:** P3 - Fix within 2 weeks

---

#### 13. Missing Content Security Policy

**MEDIUM SEVERITY**

**Issue:** While Helmet is used, no custom CSP is configured. The default CSP may be too restrictive or too permissive.

**Recommended Fix:**
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],  // Required for inline styles
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.breakdowns.gobarry.co.uk"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        }
    },
    hsts: {
        maxAge: 31536000,        // 1 year
        includeSubDomains: true,
        preload: true
    }
}));
```

**Priority:** P2 - Fix within 1 week

---

## 7. Additional Security Recommendations

### Best Practices

#### Implement Security Logging and Monitoring

**Current State:** Basic logging exists but not comprehensive

**Recommendation:**
```javascript
// Create dedicated security audit log
import { query } from './utils/queryHelpers.js';

async function logSecurityEvent(event) {
    await query(
        `INSERT INTO security_audit_log
         (event_type, user_id, ip_address, user_agent, details, timestamp)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
            event.type,
            event.userId,
            event.ip,
            event.userAgent,
            JSON.stringify(event.details)
        ]
    );
}

// Log critical events:
// - Failed login attempts
// - Duty changes
// - Admin actions
// - Token refresh attempts
// - Unusual activity patterns
```

**Priority:** P2 - Implement within 1 week

---

#### Add Password Policy Enforcement

**Recommendation:**
```javascript
// Enforce strong password requirements
function validatePassword(password) {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, error: 'Password must be at least 12 characters' };
    }

    if (!hasUppercase || !hasLowercase) {
        return { valid: false, error: 'Password must contain uppercase and lowercase letters' };
    }

    if (!hasNumber) {
        return { valid: false, error: 'Password must contain at least one number' };
    }

    if (!hasSpecial) {
        return { valid: false, error: 'Password must contain at least one special character' };
    }

    // Check against common passwords
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        return { valid: false, error: 'Password is too common' };
    }

    return { valid: true };
}
```

**Priority:** P3 - Implement within 2 weeks

---

#### Implement Account Lockout

**Recommendation:**
```javascript
// Lock account after 5 failed login attempts
async function checkAccountLockout(email) {
    const [result] = await query(
        `SELECT failed_login_attempts, locked_until
         FROM supervisors
         WHERE email = ?`,
        [email]
    );

    if (!result) return { locked: false };

    // Check if account is locked
    if (result.locked_until && new Date() < new Date(result.locked_until)) {
        return {
            locked: true,
            unlockAt: result.locked_until
        };
    }

    return { locked: false };
}

// On failed login:
await query(
    `UPDATE supervisors
     SET failed_login_attempts = failed_login_attempts + 1,
         locked_until = CASE
             WHEN failed_login_attempts + 1 >= 5
             THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE)
             ELSE NULL
         END
     WHERE email = ?`,
    [email]
);

// On successful login:
await query(
    `UPDATE supervisors
     SET failed_login_attempts = 0, locked_until = NULL
     WHERE email = ?`,
    [email]
);
```

**Priority:** P2 - Implement within 1 week

---

## 8. Compliance Considerations

### OWASP Top 10 (2021) Mapping

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| A01: Broken Access Control | ⚠️ CRITICAL | Development bypass vulnerability |
| A02: Cryptographic Failures | 🟡 MEDIUM | JWT secret validation needed |
| A03: Injection | ✅ GOOD | Parameterized queries used throughout |
| A04: Insecure Design | ✅ GOOD | Proper authentication flow design |
| A05: Security Misconfiguration | ⚠️ CRITICAL | Development fallbacks in production |
| A06: Vulnerable Components | ⚠️ MEDIUM | Needs dependency audit |
| A07: ID & Auth Failures | 🟡 MEDIUM | Token lifetime too long |
| A08: Software & Data Integrity | ✅ GOOD | No CI/CD integrity issues found |
| A09: Logging & Monitoring | 🟡 MEDIUM | Insufficient security logging |
| A10: SSRF | ✅ GOOD | No external request handling found |

---

## 9. Testing Recommendations

### Security Test Cases

#### Test Case 1: Authentication Bypass Attempt
```bash
# Test if authentication can be bypassed with no token
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/set-duty \
  -H "Content-Type: application/json" \
  -d '{"duty": "Duty 100"}'

# Expected: 401 Unauthorized
# Current Risk: May succeed if NODE_ENV misconfigured
```

#### Test Case 2: Invalid Duty Code Injection
```bash
# Test if malicious duty code causes issues
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/set-duty \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duty": "<script>alert(\"XSS\")</script>"}'

# Expected: 400 Bad Request with safe error message
# Current Risk: Error message may reflect malicious input
```

#### Test Case 3: SQL Injection Attempt
```bash
# Test if SQL injection is possible
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/set-duty \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duty": "Duty 100\"; DROP TABLE supervisors; --"}'

# Expected: 400 Bad Request (parameterized queries prevent injection)
# Risk: LOW (already protected)
```

#### Test Case 4: Token Replay Attack
```bash
# Test if expired token can be used
# 1. Get valid token
# 2. Wait for expiration (24 hours)
# 3. Attempt to use expired token

curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/set-duty \
  -H "Authorization: Bearer EXPIRED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duty": "Duty 100"}'

# Expected: 401 Unauthorized with AUTH_TOKEN_EXPIRED
# Risk: LOW (properly validates expiration)
```

#### Test Case 5: CORS Bypass Attempt
```javascript
// Test if CORS can be bypassed from malicious origin
fetch('https://api.breakdowns.gobarry.co.uk/api/auth/set-duty', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer STOLEN_TOKEN'
    },
    body: JSON.stringify({ duty: 'Duty 100' })
});

// Expected: CORS error (request blocked by browser)
// Risk: LOW (properly configured CORS)
```

---

## 10. Remediation Priority Matrix

### P0 - Critical (Fix Immediately - Within 24 hours)

1. **Remove Development Authentication Bypass** (Issue #1, #2)
   - File: `/backend/middleware/authMiddleware.js`
   - Lines: 257-272, 316-331
   - Impact: Complete authentication bypass
   - Effort: 1 hour

### P1 - High (Fix Before Production - Within 1 week)

2. **Validate JWT Secret Strength** (Issue #3)
   - File: `/backend/middleware/authMiddleware.js`
   - Lines: 13-20
   - Impact: Weak cryptography
   - Effort: 2 hours

### P2 - Medium (Fix Within 1-2 weeks)

3. **Improve Duty Code Validation** (Issue #4)
   - File: `/backend/routes/auth.js`
   - Lines: 1254-1267
   - Impact: Input validation bypass
   - Effort: 1 hour

4. **Add Supervisor ID Validation** (Issue #5)
   - File: `/backend/routes/auth.js`
   - Lines: 1252, 1270-1280
   - Impact: Potential injection
   - Effort: 1 hour

5. **Reduce Token Expiration Time** (Issue #6)
   - File: `/backend/.env.example`
   - Line: 65
   - Impact: Extended exposure window
   - Effort: 30 minutes

6. **Fix Race Condition in Duty Setting** (Issue #10)
   - File: `/backend/routes/auth.js`
   - Lines: 1284-1290
   - Impact: Duplicate duty records
   - Effort: 3 hours

7. **Configure Content Security Policy** (Issue #13)
   - File: `/backend/server.js`
   - Line: 121
   - Impact: XSS protection
   - Effort: 2 hours

8. **Implement Security Audit Logging** (Recommendation)
   - Impact: Incident detection
   - Effort: 4 hours

9. **Implement Account Lockout** (Recommendation)
   - Impact: Brute force protection
   - Effort: 3 hours

### P3 - Low (Fix Within 2-4 weeks)

10. **Implement Token Revocation** (Issue #7)
    - Impact: Stolen token mitigation
    - Effort: 4 hours

11. **Sanitize Error Messages** (Issue #8)
    - File: `/frontend/src/components/DutySelectionModal.jsx`
    - Lines: 114-117
    - Impact: Information disclosure
    - Effort: 1 hour

12. **Use Environment Variables for API URLs** (Issue #9)
    - File: `/frontend/src/components/DutySelectionModal.jsx`
    - Lines: 23-25
    - Impact: Configuration flexibility
    - Effort: 30 minutes

13. **Restrict CORS Regex Patterns** (Issue #12)
    - File: `/backend/server.js`
    - Lines: 110-115
    - Impact: Subdomain attacks
    - Effort: 1 hour

14. **Implement Password Policy** (Recommendation)
    - Impact: Weak password prevention
    - Effort: 2 hours

### P4 - Optional Enhancements

15. **Session Invalidation on Duty Change** (Issue #11)
    - Impact: Token consistency
    - Effort: 2 hours

---

## 11. Security Checklist for Deployment

Before deploying to production, verify:

### Configuration
- [ ] `NODE_ENV=production` is explicitly set
- [ ] JWT_SECRET is randomly generated (≥32 characters)
- [ ] JWT_SECRET is not default/example value
- [ ] Database credentials are production values
- [ ] HTTPS is enforced for all endpoints
- [ ] CORS allowed origins are production domains only

### Code
- [ ] Development authentication bypasses removed
- [ ] All authentication endpoints use verifyToken middleware
- [ ] Input validation is present on all user inputs
- [ ] SQL queries use parameterized statements
- [ ] Error messages do not leak sensitive information
- [ ] Security headers are configured (Helmet)

### Database
- [ ] Supervisor table has is_active column
- [ ] Failed login attempts are tracked
- [ ] Security audit log table exists
- [ ] Database user has minimum required permissions

### Monitoring
- [ ] Security event logging is enabled
- [ ] Failed login attempts are logged
- [ ] Rate limiting is active
- [ ] Health check endpoint is accessible

### Testing
- [ ] Authentication tests pass
- [ ] Authorization tests pass
- [ ] Input validation tests pass
- [ ] CORS tests pass
- [ ] Rate limiting tests pass

---

## 12. Conclusion

### Summary of Findings

The Go BARRY duty selection authentication system demonstrates **strong security fundamentals** with proper use of JWT authentication, parameterized queries, and rate limiting. However, **critical vulnerabilities** in development authentication bypasses pose an immediate risk if deployed without remediation.

### Overall Security Rating: 7.5/10

**Breakdown:**
- Authentication & Authorization: 6/10 (critical bypass vulnerabilities)
- Input Validation: 8/10 (good parameterized queries, needs input validation)
- JWT Security: 8/10 (solid implementation, needs token expiration reduction)
- Frontend Security: 9/10 (React provides good XSS protection)
- Network Security: 9/10 (proper HTTPS, CORS, and headers)
- Session Management: 7/10 (good validation, needs race condition fix)

### Recommended Immediate Actions

1. **Remove all development authentication bypasses** (P0)
2. **Validate JWT secret configuration** (P1)
3. **Add comprehensive input validation** (P2)
4. **Implement security audit logging** (P2)
5. **Configure Content Security Policy** (P2)

### Long-term Security Improvements

- Implement refresh token rotation
- Add comprehensive security monitoring
- Conduct regular penetration testing
- Implement automated dependency scanning
- Add Web Application Firewall (WAF)

---

## References

- OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Express Security Best Practices: https://expressjs.com/en/advanced/best-practice-security.html

---

**Report Generated:** October 29, 2025
**Next Review Due:** November 29, 2025 (30 days)

**Auditor:** Claude Code (Security Analysis Agent)
**Contact:** Via Claude Code CLI at https://claude.com/code
