# Go BARRY Security Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Application                          │
│                     (React, React Native, Web)                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTPS (Production)
                                 │ HTTP (Development)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          CORS Middleware                            │
│  • Allow configured origins                                         │
│  • Allow credentials (cookies)                                      │
│  • Expose required headers                                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Rate Limiting Layer                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ IP-Based Limiter: 5 attempts / 15 min                       │   │
│  │ Badge-Based Limiter: 3 attempts / 60 min (with lockout)    │   │
│  │ API Limiter: 100 requests / 15 min                         │   │
│  │ Refresh Limiter: 10 refreshes / 60 min                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Validation Layer                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Content-Type: application/json                              │   │
│  │ Body Size: Max 10KB                                         │   │
│  │ Badge Format: [A-Z]{2}\d{3}                                │   │
│  │ Password Length: 8-128 chars                                │   │
│  │ Input Sanitization: XSS prevention                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Authentication Routes                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  POST /api/auth/login                                       │   │
│  │  POST /api/auth/refresh                                     │   │
│  │  POST /api/auth/logout                                      │   │
│  │  POST /api/auth/verify                                      │   │
│  │  GET  /api/auth/me                                          │   │
│  │  GET  /api/auth/health                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Security Services                           │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │   Database   │    Logger    │  Blacklist   │ Audit Logger │     │
│  │   Service    │   Service    │   Service    │   Service    │     │
│  └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘     │
│         │              │              │              │             │
└─────────┼──────────────┼──────────────┼──────────────┼─────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐
│   MySQL     │  │ Log Files   │  │ Memory   │  │    MySQL     │
│  Database   │  │ error.log   │  │   Map    │  │ audit_logs   │
│             │  │combined.log │  │          │  │    table     │
└─────────────┘  └─────────────┘  └──────────┘  └──────────────┘
```

## Authentication Flow

### Login Flow

```
Client                 API                   Services              Database
  │                     │                       │                     │
  ├─ POST /login ──────>│                       │                     │
  │  {badge, password}  │                       │                     │
  │                     │                       │                     │
  │                     ├─ Check Rate Limit ───>│                     │
  │                     │  (IP + Badge)         │                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Validate Input ─────>│                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Query Supervisor ────┼────────────────────>│
  │                     │                       │<────────────────────┤
  │                     │                       │                     │
  │                     ├─ bcrypt.compare ─────>│                     │
  │                     │  (constant time)      │                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Generate Tokens ────>│                     │
  │                     │  - Access (15m)       │                     │
  │                     │  - Refresh (7d)       │                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Log Audit Event ────┼────────────────────>│
  │                     │                       │<────────────────────┤
  │                     │                       │                     │
  │<─ 200 OK ───────────┤                       │                     │
  │  {token, user}      │                       │                     │
  │  Set-Cookie:        │                       │                     │
  │  refreshToken       │                       │                     │
  │                     │                       │                     │
```

### Token Refresh Flow

```
Client                 API                   Services              Database
  │                     │                       │                     │
  ├─ POST /refresh ────>│                       │                     │
  │  Cookie:            │                       │                     │
  │  refreshToken       │                       │                     │
  │                     │                       │                     │
  │                     ├─ Check Rate Limit ───>│                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Check Blacklist ────>│                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Verify JWT ─────────>│                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Get Supervisor ──────┼────────────────────>│
  │                     │                       │<────────────────────┤
  │                     │                       │                     │
  │                     ├─ Generate Access Token│                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Log Audit Event ────┼────────────────────>│
  │                     │                       │<────────────────────┤
  │                     │                       │                     │
  │<─ 200 OK ───────────┤                       │                     │
  │  {token}            │                       │                     │
  │                     │                       │                     │
```

### Logout Flow

```
Client                 API                   Services              Database
  │                     │                       │                     │
  ├─ POST /logout ─────>│                       │                     │
  │  Authorization:     │                       │                     │
  │  Bearer <token>     │                       │                     │
  │  Cookie:            │                       │                     │
  │  refreshToken       │                       │                     │
  │                     │                       │                     │
  │                     ├─ Decode Tokens ──────>│                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Add to Blacklist ───>│                     │
  │                     │  - Access Token       │                     │
  │                     │  - Refresh Token      │                     │
  │                     │<──────────────────────┤                     │
  │                     │                       │                     │
  │                     ├─ Log Audit Event ────┼────────────────────>│
  │                     │                       │<────────────────────┤
  │                     │                       │                     │
  │<─ 200 OK ───────────┤                       │                     │
  │  Clear-Cookie:      │                       │                     │
  │  refreshToken       │                       │                     │
  │                     │                       │                     │
```

## Security Layers

### Layer 1: Network Security

```
┌─────────────────────────────────────────────────────────────┐
│ HTTPS (Production)                                          │
│ • TLS 1.2+ encryption                                       │
│ • Valid SSL certificate                                     │
│ • Secure cipher suites                                      │
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: CORS Protection

```
┌─────────────────────────────────────────────────────────────┐
│ CORS Configuration                                          │
│ • Whitelist allowed origins                                 │
│ • Allow credentials (cookies)                               │
│ • Control exposed headers                                   │
└─────────────────────────────────────────────────────────────┘
```

### Layer 3: Rate Limiting

```
┌─────────────────────────────────────────────────────────────┐
│ Multi-Tier Rate Limiting                                    │
│                                                             │
│ IP-Based:           5 attempts / 15 min                     │
│ Badge-Based:        3 attempts / 60 min (lockout)          │
│ API:              100 requests / 15 min                     │
│ Refresh:           10 refreshes / 60 min                    │
└─────────────────────────────────────────────────────────────┘
```

### Layer 4: Input Validation

```
┌─────────────────────────────────────────────────────────────┐
│ Input Validation & Sanitization                             │
│                                                             │
│ • Content-Type validation                                   │
│ • Body size limits (10KB)                                   │
│ • Badge format: [A-Z]{2}\d{3}                              │
│ • Password length: 8-128                                    │
│ • XSS prevention                                            │
│ • SQL injection prevention                                  │
└─────────────────────────────────────────────────────────────┘
```

### Layer 5: Authentication Logic

```
┌─────────────────────────────────────────────────────────────┐
│ Timing Attack Prevention                                    │
│                                                             │
│ • Always run bcrypt.compare()                               │
│ • Use dummy hash if badge not found                         │
│ • Constant-time comparison                                  │
│ • Generic error messages                                    │
└─────────────────────────────────────────────────────────────┘
```

### Layer 6: Token Security

```
┌─────────────────────────────────────────────────────────────┐
│ JWT Token Security                                          │
│                                                             │
│ Access Token:                                               │
│ • Expiry: 15 minutes                                        │
│ • Minimal payload: {sub, badge, type}                       │
│ • Algorithm: HS256                                          │
│ • Issuer: go-barry-api                                      │
│                                                             │
│ Refresh Token:                                              │
│ • Expiry: 7 days                                            │
│ • HttpOnly cookie                                           │
│ • Secure flag (production)                                  │
│ • SameSite: none/lax                                        │
└─────────────────────────────────────────────────────────────┘
```

### Layer 7: Session Management

```
┌─────────────────────────────────────────────────────────────┐
│ Token Blacklist                                             │
│                                                             │
│ • In-memory Map storage                                     │
│ • Add tokens on logout                                      │
│ • Check on verification                                     │
│ • Auto-cleanup expired tokens                               │
│ • Ready for Redis integration                               │
└─────────────────────────────────────────────────────────────┘
```

### Layer 8: Audit & Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│ Comprehensive Logging                                       │
│                                                             │
│ Application Logs (Winston):                                │
│ • error.log - Errors and critical events                    │
│ • combined.log - All events                                 │
│ • Sensitive data sanitization                               │
│ • Request context tracking                                  │
│                                                             │
│ Audit Logs (MySQL):                                         │
│ • Login attempts (success/failure)                          │
│ • Token operations                                          │
│ • Security events                                           │
│ • Badge enumeration detection                               │
│ • 90-day retention                                          │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    event_type      VARCHAR(50) NOT NULL,
    badge           VARCHAR(10),
    supervisor_id   INT,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    success         BOOLEAN NOT NULL,
    details         JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_badge (badge),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_success (success)
);
```

### Event Types

```
┌─────────────────────────┬───────────────────────────────────┐
│ Event Type              │ Description                       │
├─────────────────────────┼───────────────────────────────────┤
│ login_success           │ Successful authentication         │
│ login_failure           │ Failed authentication             │
│ logout                  │ User logout                       │
│ token_refresh           │ Successful token refresh          │
│ token_refresh_failure   │ Failed token refresh              │
│ password_change         │ Password changed                  │
│ password_change_failure │ Failed password change            │
│ badge_enumeration       │ Enumeration attempt detected      │
│ rate_limit_exceeded     │ Rate limit triggered              │
│ invalid_token           │ Invalid token used                │
│ token_blacklisted       │ Blacklisted token used            │
│ suspicious_activity     │ Other suspicious activity         │
└─────────────────────────┴───────────────────────────────────┘
```

## Token Structure

### Access Token Payload

```json
{
  "sub": 1,                    // Supervisor ID
  "badge": "AG003",            // Badge number
  "type": "access",            // Token type
  "iat": 1698331200,           // Issued at
  "exp": 1698332100,           // Expires at (15 min)
  "iss": "go-barry-api"        // Issuer
}
```

### Refresh Token Payload

```json
{
  "sub": 1,                    // Supervisor ID
  "badge": "AG003",            // Badge number
  "type": "refresh",           // Token type
  "iat": 1698331200,           // Issued at
  "exp": 1698936000,           // Expires at (7 days)
  "iss": "go-barry-api"        // Issuer
}
```

## Error Response Formats

### Authentication Error

```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}
```

### Rate Limit Error

```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

### Validation Error

```json
{
  "success": false,
  "error": "Invalid input",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "badge",
      "message": "Badge must be 2 letters followed by 3 digits"
    }
  ]
}
```

## Security Metrics

### Performance Targets

```
┌─────────────────────────┬──────────────┬──────────────┐
│ Operation               │ Target Time  │ Max Time     │
├─────────────────────────┼──────────────┼──────────────┤
│ Login (success)         │ < 200ms      │ < 500ms      │
│ Login (failure)         │ < 200ms      │ < 500ms      │
│ Token Refresh           │ < 50ms       │ < 100ms      │
│ Token Verification      │ < 10ms       │ < 50ms       │
│ Logout                  │ < 10ms       │ < 50ms       │
└─────────────────────────┴──────────────┴──────────────┘
```

### Rate Limit Thresholds

```
┌─────────────────────────┬──────────────┬──────────────┐
│ Limiter Type            │ Window       │ Max Requests │
├─────────────────────────┼──────────────┼──────────────┤
│ IP-based (login)        │ 15 minutes   │ 5            │
│ Badge-based (login)     │ 60 minutes   │ 3            │
│ API (general)           │ 15 minutes   │ 100          │
│ Token Refresh           │ 60 minutes   │ 10           │
└─────────────────────────┴──────────────┴──────────────┘
```

## Deployment Checklist

### Pre-Deployment

- [ ] Install dependencies: `npm install`
- [ ] Update environment variables
- [ ] Generate strong JWT secrets
- [ ] Configure database connection
- [ ] Create audit_logs table
- [ ] Test all endpoints locally
- [ ] Review security configuration
- [ ] Update CORS origins

### Deployment

- [ ] Update server.js imports
- [ ] Deploy to production
- [ ] Verify HTTPS enabled
- [ ] Test login from production URL
- [ ] Monitor error logs
- [ ] Check audit logs
- [ ] Verify rate limiting works
- [ ] Test token refresh
- [ ] Test logout

### Post-Deployment

- [ ] Monitor application logs
- [ ] Review audit logs daily
- [ ] Set up log rotation
- [ ] Configure monitoring alerts
- [ ] Document any issues
- [ ] Train users on new system
- [ ] Plan security review schedule

---

**Last Updated:** October 26, 2025
**Version:** 2.0
**Status:** Production-Ready
