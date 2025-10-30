# Go BARRY Security Implementation Guide

## Overview

This guide documents the comprehensive security hardening implemented for the Go BARRY authentication system. The implementation follows industry best practices and includes multiple layers of security to protect against common attack vectors.

**Implementation Date:** October 2025
**Version:** 2.0
**Security Level:** Production-Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security Features](#security-features)
3. [File Structure](#file-structure)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [API Endpoints](#api-endpoints)
7. [Security Measures](#security-measures)
8. [Testing](#testing)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Rate Limiting Layer                         │
│  • IP-based rate limiting (5 attempts/15min)                │
│  • Badge-based rate limiting (3 attempts/hour)              │
│  • API rate limiting (100 requests/15min)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Validation Layer                            │
│  • Input validation (express-validator)                     │
│  • Badge format: [A-Z]{2}\d{3}                             │
│  • Password length: 8-128 characters                        │
│  • Content-Type validation                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Authentication Routes                         │
│  POST /api/auth/login     - Login with bcrypt              │
│  POST /api/auth/refresh   - Refresh access token           │
│  POST /api/auth/logout    - Invalidate tokens              │
│  POST /api/auth/verify    - Verify token validity          │
│  GET  /api/auth/me        - Get current user info          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Security Services                           │
│  • Token Blacklist (in-memory Map)                          │
│  • Audit Logger (MySQL database)                            │
│  • Structured Logger (Winston)                              │
│  • Database Pool (mysql2/promise)                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Login Request**
   - Rate limiter checks IP and badge attempts
   - Input validation ensures proper format
   - Database query (constant-time via bcrypt)
   - Token generation (access + refresh)
   - Audit log entry created
   - Response with tokens

2. **Token Refresh**
   - Extract refresh token from HttpOnly cookie
   - Verify token signature and expiry
   - Check token blacklist
   - Generate new access token
   - Audit log entry created

3. **Logout**
   - Add tokens to blacklist
   - Clear refresh token cookie
   - Audit log entry created

---

## Security Features

### 1. Timing Attack Prevention

**Problem:** Attackers can determine if a badge exists by measuring response times.

**Solution:**
```javascript
// Always run bcrypt comparison, even if badge doesn't exist
const dummyHash = '$2b$10$...';
const hashToCompare = supervisor?.password_hash || dummyHash;
const passwordValid = await bcrypt.compare(password, hashToCompare);
```

### 2. Multi-Tier Rate Limiting

**IP-based Limiter:**
- 5 login attempts per 15 minutes per IP
- Prevents brute force attacks

**Badge-based Limiter:**
- 3 failed attempts per hour per badge
- Prevents targeted attacks on specific accounts
- 1-hour lockout after 3 failures

**API Limiter:**
- 100 requests per 15 minutes per IP
- Prevents API abuse

### 3. JWT Security

**Access Token:**
- Expiry: 15 minutes
- Minimal payload: `{ sub, badge, type }`
- Algorithm: HS256 (explicit)
- Issuer: 'go-barry-api'

**Refresh Token:**
- Expiry: 7 days
- Stored in HttpOnly cookie
- Cannot be accessed by JavaScript
- Secure flag enabled in production

### 4. Token Blacklist

**Implementation:**
- In-memory Map with automatic cleanup
- Tokens added on logout
- Tokens checked on verification
- Expired tokens auto-removed

**Future Enhancement:**
- Redis integration for distributed systems

### 5. Audit Logging

**Events Logged:**
- Login attempts (success/failure)
- Token refreshes
- Logout events
- Rate limit violations
- Badge enumeration attempts
- Suspicious activity

**Storage:**
- MySQL database table: `audit_logs`
- 90-day retention policy
- Daily cleanup job

### 6. Input Validation

**Badge Format:**
- Pattern: `[A-Z]{2}\d{3}`
- Example: `AG003`, `BP009`
- Uppercase normalization

**Password:**
- Length: 8-128 characters
- Required for login
- Not validated for complexity (allow supervisor freedom)

### 7. Structured Logging

**Log Levels:**
- `error`: System errors, critical failures
- `warn`: Security events, failed attempts
- `info`: Successful operations
- `http`: API requests
- `debug`: Detailed debugging info

**Sensitive Data:**
- Automatically sanitized before logging
- Passwords, tokens, secrets redacted

---

## File Structure

```
backend/
├── services/
│   ├── database.js           # MySQL connection pool
│   ├── logger.js             # Winston structured logging
│   ├── tokenBlacklist.js     # Token invalidation service
│   └── auditLogger.js        # Security event logging
│
├── middleware/
│   ├── validation.js         # Input validation
│   └── rateLimiting.js       # Multi-tier rate limiting
│
├── routes/
│   ├── authSecure.js         # NEW: Secure auth routes
│   └── authOptimized.js      # OLD: Legacy auth routes
│
├── logs/                     # Winston log files
│   ├── error.log
│   └── combined.log
│
└── .env                      # Environment configuration
```

---

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

**New Dependencies:**
- `express-validator@^7.0.1` - Input validation
- `winston@^3.11.0` - Structured logging

**Existing Dependencies:**
- `express-rate-limit@^7.1.5` - Rate limiting
- `jsonwebtoken@^9.0.2` - JWT tokens
- `bcrypt@^6.0.0` - Password hashing
- `mysql2@^3.15.3` - Database driver

### 2. Database Setup

Run the audit logs table creation:

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  badge VARCHAR(10),
  supervisor_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_badge (badge),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Environment Configuration

Ensure your `.env` file includes:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=gobarryco
DB_PASSWORD=your_password
DB_NAME=gobarryco_breakdowns

# JWT Configuration
JWT_ACCESS_SECRET=your-64-char-random-string
JWT_REFRESH_SECRET=your-different-64-char-random-string
JWT_ISSUER=go-barry-api
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Environment
NODE_ENV=production
```

**Generate Strong Secrets:**

```bash
# Generate JWT secrets (use Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Configuration

### Rate Limiting Configuration

Located in `/backend/middleware/rateLimiting.js`:

```javascript
// Adjust these values based on your needs
export const strictLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 requests per window
  // ...
});

export const badgeLimiter = {
  maxAttempts: 3,           // 3 failed attempts
  lockoutDuration: 60,      // 60 minutes
  // ...
};
```

### Token Configuration

Located in `/backend/routes/authSecure.js`:

```javascript
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
```

**Recommended Values:**
- Access Token: `15m` - `1h`
- Refresh Token: `7d` - `30d`

### Logging Configuration

Located in `/backend/services/logger.js`:

```javascript
// Log level based on environment
const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// File rotation settings
maxsize: 5242880,  // 5MB
maxFiles: 5,       // Keep 5 old files
```

---

## API Endpoints

### POST /api/auth/login

Authenticate supervisor with badge and password.

**Request:**
```json
{
  "badge": "AG003",
  "password": "your-password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "badge": "AG003",
    "name": "Anthony Goldsmith",
    "email": "anthony@gobarry.co.uk",
    "role": "admin",
    "depot": "Riverside"
  },
  "message": "Login successful"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}
```

**Rate Limits:**
- 5 attempts per 15 minutes per IP
- 3 attempts per hour per badge

**Cookies Set:**
- `refreshToken` (HttpOnly, Secure in production)

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
- No body required
- Refresh token sent via HttpOnly cookie

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Token refreshed successfully"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid or expired refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

**Rate Limits:**
- 10 refreshes per hour per IP

---

### POST /api/auth/logout

Logout and invalidate tokens.

**Request:**
- No body required
- Access token via Authorization header (optional)
- Refresh token via HttpOnly cookie (optional)

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Effects:**
- Adds tokens to blacklist
- Clears refresh token cookie
- Logs audit event

---

### POST /api/auth/verify

Verify current access token.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (Valid):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": 1,
    "badge": "AG003"
  },
  "message": "Token is valid"
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "valid": false,
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

---

### GET /api/auth/me

Get current supervisor information.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "badge": "AG003",
    "name": "Anthony Goldsmith",
    "email": "anthony@gobarry.co.uk",
    "role": "admin",
    "depot": "Riverside"
  }
}
```

---

### GET /api/auth/health

Health check for authentication service.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "blacklist": {
    "total": 5,
    "active": 3,
    "expired": 2
  },
  "timestamp": "2025-10-26T12:00:00.000Z"
}
```

---

## Security Measures

### Attack Vector Protection

| Attack Type | Protection Method |
|-------------|-------------------|
| Brute Force | IP + Badge rate limiting |
| Timing Attack | Constant-time bcrypt comparison |
| Token Theft | HttpOnly cookies, blacklist on logout |
| XSS | Input sanitization, HttpOnly cookies |
| CSRF | SameSite cookies, token validation |
| SQL Injection | Parameterized queries |
| Badge Enumeration | Generic error messages, audit logging |
| Session Hijacking | Short-lived tokens, refresh mechanism |

### Error Messages

**Security Principle:** Never reveal whether a badge exists.

**Generic Messages:**
- ✅ "Invalid credentials" (don't specify badge or password)
- ❌ "Badge not found" (reveals badge doesn't exist)
- ❌ "Incorrect password" (reveals badge exists)

### Cookie Security

**Production Settings:**
```javascript
{
  httpOnly: true,        // Cannot be accessed by JavaScript
  secure: true,          // HTTPS only
  sameSite: 'none',      // Cross-origin requests allowed
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/'
}
```

**Development Settings:**
```javascript
{
  httpOnly: true,
  secure: false,         // Allow HTTP in development
  sameSite: 'lax',       // Relaxed for local testing
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
}
```

---

## Testing

### Manual Testing

**Test Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"badge":"AG003","password":"your-password"}' \
  -c cookies.txt
```

**Test Refresh:**
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt
```

**Test Verify:**
```bash
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Logout:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rate Limit Testing

**Test IP Rate Limit:**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"badge":"AG003","password":"wrong"}'
  echo ""
done
```

**Expected:** 429 status after 5 attempts

### Badge Rate Limit Testing

**Test Badge Lockout:**
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"badge":"AG003","password":"wrong"}'
  echo ""
done
```

**Expected:** Badge blocked after 3 attempts

---

## Monitoring

### Audit Logs

**Query Recent Logins:**
```sql
SELECT * FROM audit_logs
WHERE event_type = 'login_success'
ORDER BY created_at DESC
LIMIT 10;
```

**Query Failed Logins:**
```sql
SELECT badge, COUNT(*) as attempts
FROM audit_logs
WHERE event_type = 'login_failure'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY badge
ORDER BY attempts DESC;
```

**Detect Badge Enumeration:**
```sql
SELECT ip_address, COUNT(DISTINCT badge) as unique_badges, COUNT(*) as attempts
FROM audit_logs
WHERE event_type = 'login_failure'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
GROUP BY ip_address
HAVING unique_badges >= 3 AND attempts >= 5;
```

### Application Logs

**View Error Logs:**
```bash
tail -f backend/logs/error.log
```

**View Combined Logs:**
```bash
tail -f backend/logs/combined.log
```

**Filter Security Events:**
```bash
grep "SECURITY:" backend/logs/combined.log
```

### Token Blacklist Stats

**API Endpoint:**
```bash
curl http://localhost:3001/api/auth/health
```

**Response:**
```json
{
  "blacklist": {
    "total": 10,
    "active": 8,
    "expired": 2
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Too many requests" on first login

**Cause:** IP rate limiter triggered from previous testing

**Solution:**
```bash
# Restart server to clear in-memory rate limits
npm restart
```

#### 2. Token verification fails after logout

**Expected behavior:** Tokens are blacklisted on logout

**Solution:** Use refresh endpoint to get new token after login

#### 3. Refresh token cookie not set

**Cause:** Cross-origin cookie issues

**Solution:** Check CORS configuration and cookie settings:
```javascript
// For cross-origin requests
sameSite: 'none',
secure: true
```

#### 4. Database connection errors

**Symptoms:**
```
❌ MySQL database connection failed: ECONNREFUSED
```

**Solution:**
1. Check `.env` database credentials
2. Verify MySQL is running
3. Test connection manually:
```bash
mysql -u gobarryco -p gobarryco_breakdowns
```

#### 5. Audit logs not created

**Symptoms:** No entries in `audit_logs` table

**Solution:**
1. Verify table exists:
```sql
SHOW TABLES LIKE 'audit_logs';
```
2. Check permissions:
```sql
SHOW GRANTS FOR 'gobarryco'@'localhost';
```
3. Check application logs for errors

---

## Migration from Old Auth System

### Step 1: Install Dependencies

```bash
cd backend
npm install express-validator winston
```

### Step 2: Update Server Configuration

Replace in `server.js`:

```javascript
// OLD
import authOptimizedRouter from './routes/authOptimized.js';
app.use('/api/auth', rateLimitLogin, authOptimizedRouter);

// NEW
import authSecureRouter from './routes/authSecure.js';
app.use('/api/auth', authSecureRouter);
```

### Step 3: Test Thoroughly

1. Test login with valid credentials
2. Test login with invalid credentials
3. Test rate limiting
4. Test token refresh
5. Test logout
6. Verify audit logs created

### Step 4: Monitor

- Watch application logs for errors
- Monitor audit logs for suspicious activity
- Check rate limit effectiveness

---

## Best Practices

### 1. Environment Variables

- **Never commit** `.env` to version control
- Use strong, random secrets (64+ characters)
- Rotate secrets periodically
- Use different secrets for development/production

### 2. Rate Limiting

- Adjust limits based on actual usage patterns
- Monitor for false positives (legitimate users blocked)
- Consider IP whitelist for internal tools

### 3. Logging

- Review audit logs weekly
- Set up alerts for suspicious patterns
- Archive logs for compliance (if required)

### 4. Token Management

- Keep access tokens short-lived (15-60 minutes)
- Use refresh tokens for long-term sessions
- Implement "remember me" carefully

### 5. Database Security

- Use least-privilege principle for database user
- Enable SSL for database connections in production
- Regular backups of audit logs

---

## Future Enhancements

### 1. Redis Integration

Replace in-memory token blacklist with Redis:

```javascript
// tokenBlacklist.js
import redis from 'redis';
const client = redis.createClient();

export async function addToBlacklist(token, expiresAt) {
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
  await client.setEx(`bl:${hashToken(token)}`, ttl, '1');
}
```

### 2. Two-Factor Authentication (2FA)

Add TOTP-based 2FA for admin accounts:

```javascript
import speakeasy from 'speakeasy';

// Generate secret
const secret = speakeasy.generateSecret();

// Verify token
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: userToken
});
```

### 3. Passwordless Authentication

Add magic link authentication:

```javascript
// Generate magic link token
const magicToken = jwt.sign(
  { badge, purpose: 'login' },
  JWT_MAGIC_SECRET,
  { expiresIn: '15m' }
);

// Send via email
await sendMagicLinkEmail(email, magicToken);
```

### 4. IP Whitelisting

Add trusted IP ranges:

```javascript
const trustedIPs = [
  '192.168.1.0/24',  // Office network
  '10.0.0.0/8'       // VPN
];

// Skip rate limiting for trusted IPs
```

### 5. Advanced Analytics

Track authentication patterns:

```javascript
// Login time patterns
// Geographic distribution
// Device fingerprinting
// Anomaly detection
```

---

## Support

For issues or questions:

1. Check application logs: `/backend/logs/`
2. Check audit logs: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`
3. Review this documentation
4. Contact system administrator

---

## Changelog

### Version 2.0 (October 2025)

**Added:**
- Comprehensive security hardening
- Multi-tier rate limiting
- Token blacklist service
- Audit logging system
- Structured logging with Winston
- Input validation middleware
- Timing attack prevention
- Badge enumeration detection

**Changed:**
- JWT payload minimized (sub, badge, type only)
- Access token expiry: 1h → 15m
- Error messages made generic
- Cookie configuration enhanced

**Security:**
- All major attack vectors addressed
- Production-ready security measures
- Compliance-ready audit trails

---

**Last Updated:** October 26, 2025
**Maintainer:** Anthony Goldsmith
**Version:** 2.0
