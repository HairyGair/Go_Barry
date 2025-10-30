# Go BARRY Authentication Flow Diagram

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GO BARRY AUTH SYSTEM                            │
│                     Refresh Token Implementation                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            1. LOGIN FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

    User Login Form
         │
         │ badge + password
         ↓
    POST /api/auth/login
         │
         ├──→ Backend validates credentials
         │         │
         │         ↓
         │    Generate Tokens
         │         │
         │         ├──→ Access Token (1 hour)
         │         │    { id, badge, name, email, role, depot }
         │         │
         │         └──→ Refresh Token (7 days)
         │              { id, badge }
         │
         ↓
    Response:
    ├── accessToken (in body)
    └── refreshToken (HttpOnly cookie)
         │
         ↓
    Frontend Storage:
    ├── Memory: accessToken
    ├── Cookie: refreshToken (automatic)
    └── localStorage: session data (NO tokens)
         │
         ↓
    ✓ User Logged In


┌─────────────────────────────────────────────────────────────────────────┐
│                      2. AUTHENTICATED API CALL                           │
└─────────────────────────────────────────────────────────────────────────┘

    Component calls useApi.get('/api/alerts')
         │
         ↓
    Check Access Token
         │
         ├──→ Expired or < 5 min left?
         │         │
         │         YES
         │         │
         │         ↓
         │    Call refreshAccessToken()
         │         │
         │         ↓
         │    POST /api/auth/refresh
         │         │
         │         ├──→ Send refresh token (cookie)
         │         │
         │         ↓
         │    Backend validates refresh token
         │         │
         │         ↓
         │    Generate new access token
         │         │
         │         ↓
         │    Store in memory
         │         │
         │         └──→ Continue with new token
         │
         NO (token valid)
         │
         ↓
    Make API Request
    Headers: { Authorization: "Bearer <accessToken>" }
    Credentials: include (for cookies)
         │
         ↓
    ┌──────────┐
    │ Response │
    └──────────┘
         │
         ├──→ 200 OK ──→ Return data ✓
         │
         ├──→ 401 Unauthorized
         │         │
         │         ↓
         │    Try refreshAccessToken()
         │         │
         │         ├──→ Success: Retry request
         │         └──→ Fail: Logout user
         │
         ├──→ 403 Forbidden ──→ Logout immediately
         │
         └──→ 500 Error ──→ Show error, keep session


┌─────────────────────────────────────────────────────────────────────────┐
│                    3. AUTOMATIC TOKEN REFRESH                            │
└─────────────────────────────────────────────────────────────────────────┘

    Every 60 seconds:
         │
         ↓
    Check Access Token Expiry
         │
         ├──→ More than 5 min left
         │         │
         │         └──→ Do nothing
         │
         └──→ Less than 5 min left
               │
               ↓
          Call refreshAccessToken()
               │
               ↓
          POST /api/auth/refresh
               │
               ├──→ Send refresh token (cookie)
               │
               ↓
          Backend generates new access token
               │
               ↓
          Store in memory
               │
               ↓
          ✓ Token refreshed (user unaware)


┌─────────────────────────────────────────────────────────────────────────┐
│                     4. APP RESTART / PAGE REFRESH                        │
└─────────────────────────────────────────────────────────────────────────┘

    App Loads
         │
         ↓
    Load session from localStorage
         │
         ├──→ No session found
         │         │
         │         └──→ Show login screen
         │
         └──→ Session found
               │
               ↓
          Check access token in memory
               │
               ├──→ Token in memory & valid
               │         │
               │         └──→ ✓ Restore session
               │
               └──→ Token missing or expired
                     │
                     ↓
                POST /api/auth/refresh
                     │
                     ├──→ Refresh token valid
                     │         │
                     │         ↓
                     │    Get new access token
                     │         │
                     │         └──→ ✓ Restore session
                     │
                     └──→ Refresh token expired
                           │
                           └──→ Show login screen


┌─────────────────────────────────────────────────────────────────────────┐
│                          5. LOGOUT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

    User clicks Logout
         │
         ↓
    POST /api/auth/logout
         │
         ├──→ Backend clears refresh token cookie
         │
         ↓
    Frontend cleanup:
    ├── Clear access token from memory
    ├── Clear session from localStorage
    └── Clear any cached data
         │
         ↓
    Redirect to login screen
         │
         ↓
    ✓ User logged out


┌─────────────────────────────────────────────────────────────────────────┐
│                      TOKEN STORAGE LOCATIONS                             │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │          ACCESS TOKEN (1 hour)               │
    │──────────────────────────────────────────────│
    │  Storage:  React State (Memory)              │
    │  Security: High - cleared on refresh         │
    │  Access:   useSupervisor().accessToken       │
    │  Risk:     Lost on page refresh              │
    └──────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │         REFRESH TOKEN (7 days)               │
    │──────────────────────────────────────────────│
    │  Storage:  HttpOnly Cookie                   │
    │  Security: Very High - JS can't access       │
    │  Access:   Automatic (browser managed)       │
    │  Risk:     Protected from XSS/CSRF           │
    └──────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │           SESSION DATA                       │
    │──────────────────────────────────────────────│
    │  Storage:  localStorage                      │
    │  Security: Low - public data only            │
    │  Access:   sessionStorageService             │
    │  Contents: supervisor info, duty, timestamps │
    │  Risk:     No sensitive data stored          │
    └──────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING                                    │
└─────────────────────────────────────────────────────────────────────────┘

    API Request Error
         │
         ├──→ Network Error (fetch failed)
         │         │
         │         ├──→ Keep session active
         │         ├──→ Show "Connection error"
         │         └──→ User can retry
         │
         ├──→ 401 Unauthorized
         │         │
         │         ├──→ Call refreshAccessToken()
         │         │         │
         │         │         ├──→ Success: Retry request
         │         │         └──→ Fail: Logout user
         │         │
         │         └──→ Show "Session expired"
         │
         ├──→ 403 Forbidden
         │         │
         │         ├──→ Logout immediately
         │         └──→ Show "Access denied"
         │
         ├──→ 500 Server Error
         │         │
         │         ├──→ Keep session active
         │         └──→ Show "Server error"
         │
         └──→ Timeout (> 10 seconds)
               │
               ├──→ Keep session active
               └──→ Show "Request timeout"


┌─────────────────────────────────────────────────────────────────────────┐
│                    CONCURRENT REFRESH PREVENTION                         │
└─────────────────────────────────────────────────────────────────────────┘

    Multiple API calls at same time
         │
         ├──→ All check token expiry
         │         │
         │         └──→ All trigger refresh
         │
         ↓
    First refresh call
         │
         ├──→ Store promise in refreshPromiseRef
         │
         ↓
    Other refresh calls
         │
         ├──→ See promise already exists
         │
         ├──→ Wait for existing promise
         │
         ↓
    First refresh completes
         │
         ├──→ Update access token
         │
         ├──→ Clear promise reference
         │
         ↓
    All waiting calls continue
         │
         └──→ Use refreshed token


┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY FEATURES                                 │
└─────────────────────────────────────────────────────────────────────────┘

    ✓ XSS Protection
      └──→ Access token in memory only
          └──→ Cleared on page refresh
              └──→ Can't be stolen via XSS

    ✓ CSRF Protection
      └──→ Refresh token in HttpOnly cookie
          └──→ JavaScript can't access
              └──→ SameSite=Strict policy

    ✓ Token Expiry
      └──→ Access token: 1 hour
          └──→ Limits damage if compromised
              └──→ Automatic rotation

    ✓ Secure Transport
      └──→ HTTPS only in production
          └──→ credentials: 'include'
              └──→ Secure cookies

    ✓ Minimal Exposure
      └──→ Tokens never logged
          └──→ Not in localStorage
              └──→ Limited lifetime


┌─────────────────────────────────────────────────────────────────────────┐
│                     TIMELINE VISUALIZATION                               │
└─────────────────────────────────────────────────────────────────────────┘

    Login              Access Token                    Refresh Token
      ↓                    ↓                               ↓
    ━━●━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━→ Time
      0min              60min                           7days

      │                    │                               │
      │                    │                               │
      └─ User logs in      └─ Access token expires        └─ Refresh expires
                                  ↓                              ↓
                           Auto-refresh triggered        Must login again
                                  ↓
                           New access token (60min)

    Auto-refresh triggers:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━→
                                55min
                           (5 min before expiry)


┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT USAGE                                   │
└─────────────────────────────────────────────────────────────────────────┘

    Your Component
         │
         ├──→ useSupervisor()
         │         │
         │         └──→ isLoggedIn, supervisorName, login, logout
         │
         └──→ useApi()
               │
               ├──→ get('/api/alerts')
               │         │
               │         └──→ Automatic token refresh
               │
               ├──→ post('/api/alerts/dismiss', data)
               │         │
               │         └──→ Automatic retry on 401
               │
               └──→ Error handling
                     │
                     └──→ try/catch for user feedback

```

## Quick Reference

### Token Lifetimes
- **Access Token**: 1 hour (short-lived, in memory)
- **Refresh Token**: 7 days (long-lived, HttpOnly cookie)
- **Auto-refresh**: When < 5 minutes remaining

### Storage Security
- **Highest**: Refresh token (HttpOnly cookie, JS can't access)
- **High**: Access token (memory only, cleared on refresh)
- **Low**: Session data (localStorage, no sensitive info)

### Error Responses
- **401**: Try refresh → logout if fails
- **403**: Logout immediately
- **500**: Keep session, show error
- **Network**: Keep session, allow retry

### Key Functions
- `login()` - Authenticate user
- `logout()` - Clear session and tokens
- `refreshAccessToken()` - Get new access token
- `useApi()` - Make authenticated API calls
- Token utilities in `tokenManager.js`

---

**Visual Guide Version**: 1.0.0
**Last Updated**: October 26, 2025
