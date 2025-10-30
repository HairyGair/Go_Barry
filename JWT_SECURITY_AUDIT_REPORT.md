# Go BARRY JWT Authentication Security Audit Report

**Audit Date**: October 26, 2025
**Auditor**: Security Audit Team
**System**: Go BARRY - Bus Alerts and Roadworks Reporting Platform
**Scope**: JWT Authentication System (`/backend/routes/authOptimized.js` and related components)

---

## Executive Summary

**Overall Security Rating: 🟡 MODERATE - Requires Improvements Before Production**

The JWT authentication system has basic security measures in place but contains several critical vulnerabilities that must be addressed before production deployment. While the implementation includes bcrypt password hashing, JWT tokens, and rate limiting, there are significant security gaps in secret management, input validation, and token security.

---

## 1. Password Security Assessment

### ✅ Strengths
- **Bcrypt Implementation**: Using bcrypt with 10 salt rounds (adequate for most applications)
- **Password Hashing**: Passwords are properly hashed before storage
- **Secure Comparison**: Using `bcrypt.compare()` for timing-attack resistant password verification

### ❌ Critical Issues
- **Hardcoded Passwords**: Default password "GoNorthEast2025!" is hardcoded in `/scripts/set-passwords.js`
- **Weak Password Policy**: No password complexity requirements enforced
- **No Password History**: Users can reuse previous passwords

### 🟡 Medium Issues
- **Salt Rounds**: 10 rounds is acceptable but consider increasing to 12 for enhanced security

### Severity: **HIGH**
**OWASP Reference**: A07:2021 - Identification and Authentication Failures

---

## 2. JWT Token Security

### ❌ Critical Issues
1. **Weak Default Secrets**:
   ```javascript
   const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
   ```
   - Fallback secrets are predictable and insecure
   - Production secrets in `.env` are exposed in the codebase

2. **Sensitive Data in Tokens**:
   ```javascript
   // Line 104-112: Storing excessive data in JWT
   {
     id: supervisor.id,
     badge: supervisor.badge_number,
     name: supervisor.name,
     email: supervisor.email,
     role: supervisor.role,
     depot: supervisor.depot,
   }
   ```
   - PII (email, name) should not be in JWT payload
   - Tokens can be decoded client-side exposing user data

3. **Missing Token Rotation**: No mechanism for token blacklisting or rotation on privilege changes

### 🟡 Medium Issues
- **Token Expiry**: 1 hour for access token is reasonable, but 7 days for refresh token may be too long
- **Algorithm Not Specified**: JWT signing doesn't explicitly specify algorithm (potential for algorithm confusion attacks)

### Severity: **CRITICAL**
**OWASP Reference**: A02:2021 - Cryptographic Failures

---

## 3. Authentication Flow Security

### ✅ Strengths
- **Rate Limiting**: Basic rate limiting implemented (5 attempts per 15 minutes)
- **Generic Error Messages**: Returns same error for invalid badge or password
- **Connection Pooling**: Proper MySQL connection pool management

### ❌ Critical Issues
1. **Information Disclosure in Logs**:
   ```javascript
   console.log(`🔐 Login attempt: badge=${badge}`); // Line 56
   console.warn(`❌ Login attempt: Supervisor not found (badge: ${badge})`); // Line 79
   ```
   - Sensitive information logged to console
   - Badge numbers exposed in logs

2. **No Input Sanitization**:
   - Badge and password inputs are not validated/sanitized
   - Direct SQL parameter binding without validation

3. **Missing CSRF Protection**: No CSRF tokens implemented for state-changing operations

### 🟡 Medium Issues
- **IP-Based Rate Limiting**: Can be bypassed with proxies/VPNs
- **No Account Lockout**: Accounts are not locked after multiple failed attempts
- **Missing Captcha**: No CAPTCHA for preventing automated attacks

### Severity: **HIGH**
**OWASP Reference**: A03:2021 - Injection, A09:2021 - Security Logging and Monitoring Failures

---

## 4. Session Management

### ✅ Strengths
- **HttpOnly Cookies**: Refresh tokens stored in HttpOnly cookies
- **Secure Flag**: Properly set in production environment
- **SameSite Protection**: Using 'Strict' SameSite attribute

### ❌ Critical Issues
1. **No Session Invalidation**: No server-side session store for token invalidation
2. **Missing Refresh Token Rotation**: Refresh tokens are not rotated on use
3. **Token Replay Vulnerability**: No jti (JWT ID) for preventing token replay attacks

### 🟡 Medium Issues
- **Cookie Security**: `secure: process.env.NODE_ENV === 'production'` relies on environment variable
- **No Session Timeout**: No idle timeout mechanism

### Severity: **HIGH**
**OWASP Reference**: A07:2021 - Identification and Authentication Failures

---

## 5. Environment Variables & Configuration

### ❌ CRITICAL Issues
1. **Exposed Credentials in Repository**:
   ```
   DB_PASSWORD=Turnip1105!!!!!
   JWT_SECRET=hPa0aPbwhqdtG6EIW1AWkSGmz2gfHV6QlAWObk6Yx+M=
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Database password exposed
   - JWT secrets committed to repository
   - API keys visible in codebase

2. **Weak Database Password**: "Turnip1105!!!!!" is a weak password pattern

### Severity: **CRITICAL**
**OWASP Reference**: A05:2021 - Security Misconfiguration

---

## 6. Additional Security Concerns

### HTTP Security Headers
- ✅ **Helmet.js**: Basic security headers implemented
- ❌ **Missing CSP**: No Content Security Policy configured
- ❌ **Missing HSTS**: No Strict-Transport-Security header

### SQL Injection Protection
- ✅ **Parameterized Queries**: Using prepared statements with mysql2
- ⚠️ **No Input Validation**: Missing input validation layer

### Cross-Origin Resource Sharing (CORS)
- ⚠️ **Permissive CORS**: Multiple origins allowed including localhost
- ❌ **Regex Origins**: Using regex patterns can be dangerous if not properly validated

---

## Recommended Security Improvements

### 🚨 CRITICAL - Must Fix Before Production

1. **Remove all secrets from codebase**
   ```javascript
   // Use environment variables only, no defaults
   const JWT_SECRET = process.env.JWT_SECRET;
   if (!JWT_SECRET) {
     throw new Error('JWT_SECRET must be configured');
   }
   ```

2. **Implement proper input validation**
   ```javascript
   import validator from 'validator';

   // Validate badge format
   if (!validator.matches(badge, /^[A-Z]{2}\d{3}$/)) {
     return res.status(400).json({ error: 'Invalid badge format' });
   }

   // Sanitize inputs
   const sanitizedBadge = validator.escape(badge.toUpperCase());
   ```

3. **Reduce JWT payload**
   ```javascript
   const accessToken = jwt.sign(
     {
       sub: supervisor.id,  // Use 'sub' claim
       badge: supervisor.badge_number,
       role: supervisor.role
       // Remove email, name, depot from token
     },
     JWT_SECRET,
     {
       expiresIn: ACCESS_TOKEN_EXPIRY,
       algorithm: 'HS256'  // Explicitly specify algorithm
     }
   );
   ```

4. **Implement token blacklisting**
   ```javascript
   // Add Redis or in-memory store for revoked tokens
   const revokedTokens = new Set();

   // On logout
   revokedTokens.add(tokenId);
   ```

5. **Add CSRF protection**
   ```javascript
   import csrf from 'csurf';
   const csrfProtection = csrf({ cookie: true });
   app.use(csrfProtection);
   ```

### HIGH Priority

6. **Implement password policy**
   ```javascript
   const passwordPolicy = {
     minLength: 12,
     requireUppercase: true,
     requireLowercase: true,
     requireNumbers: true,
     requireSymbols: true,
     preventReuse: 5  // Last 5 passwords
   };
   ```

7. **Add comprehensive logging**
   ```javascript
   // Use structured logging with Winston
   import winston from 'winston';

   const securityLogger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'security.log' })
     ]
   });

   // Log without sensitive data
   securityLogger.info('Login attempt', {
     timestamp: new Date(),
     ip: req.ip,
     success: false
     // Don't log badge or password
   });
   ```

8. **Implement account lockout**
   ```javascript
   if (failedAttempts >= 5) {
     await lockAccount(supervisorId, 30); // Lock for 30 minutes
     return res.status(423).json({ error: 'Account temporarily locked' });
   }
   ```

### MEDIUM Priority

9. **Add rate limiting middleware**
   ```javascript
   import rateLimit from 'express-rate-limit';

   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5,
     skipSuccessfulRequests: true,
     keyGenerator: (req) => {
       // Use combination of IP and fingerprint
       return `${req.ip}:${req.get('User-Agent')}`;
     }
   });
   ```

10. **Implement secure session management**
    ```javascript
    // Use express-session with secure store
    import session from 'express-session';
    import RedisStore from 'connect-redis';

    app.use(session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1 hour
      }
    }));
    ```

---

## Security Checklist for Production

- [ ] Remove all hardcoded secrets and credentials
- [ ] Implement input validation and sanitization
- [ ] Reduce JWT payload to minimum necessary data
- [ ] Add CSRF protection
- [ ] Implement proper session management with token blacklisting
- [ ] Set up comprehensive security logging
- [ ] Add account lockout mechanism
- [ ] Implement password complexity requirements
- [ ] Set up HTTPS with HSTS
- [ ] Configure Content Security Policy
- [ ] Rotate all existing secrets and passwords
- [ ] Set up secrets management system (e.g., HashiCorp Vault)
- [ ] Implement API rate limiting
- [ ] Add request signing for critical operations
- [ ] Set up security monitoring and alerting

---

## Compliance Considerations

### GDPR Compliance Issues
- Personal data (email, name) in JWT tokens
- Insufficient audit logging
- No data minimization in token payload

### Security Standards
- Does not meet OWASP ASVS Level 2 requirements
- PCI DSS non-compliant if handling payment data

---

## Conclusion

**The current JWT authentication implementation is NOT secure for production deployment.**

While the system has some security measures in place (bcrypt, rate limiting, HttpOnly cookies), it contains critical vulnerabilities that could lead to:
- Account takeover through exposed credentials
- Session hijacking via token theft
- Information disclosure through verbose logging
- Potential SQL injection if input validation fails

### Recommended Action Plan:
1. **Immediate**: Remove all secrets from codebase
2. **Week 1**: Implement input validation and reduce JWT payload
3. **Week 2**: Add CSRF protection and session management
4. **Week 3**: Implement comprehensive logging and monitoring
5. **Pre-Production**: Complete security testing and penetration testing

### Estimated Security Score: 4/10
**Production Readiness: ❌ NOT READY**

---

*This audit was conducted based on OWASP Top 10 2021, OWASP ASVS 4.0, and security best practices. A follow-up audit is recommended after implementing the suggested improvements.*