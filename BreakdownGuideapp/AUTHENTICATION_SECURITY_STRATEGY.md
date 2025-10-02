# Authentication Security Strategy & Implementation Plan
## Breakdown Guide Application - Go North East

**Created:** 2025-10-01
**Status:** CRITICAL - Security Vulnerability Active
**Risk Level:** HIGH - Authentication Bypass Enabled in Production

---

## Executive Summary

The Breakdown Guide application currently has a **CRITICAL security vulnerability** where authentication is bypassed in production (lines 94-105 in `backend/middleware/authMiddleware.js`). This bypass was implemented as a temporary workaround because the frontend is not properly maintaining and sending Supabase JWT tokens with API requests.

### Current State
- ✅ Supabase authentication works (users can log in)
- ✅ Backend can verify JWT tokens when provided
- ❌ Frontend doesn't maintain Supabase session after login
- ❌ Frontend doesn't attach tokens to API requests
- ❌ Production has authentication completely bypassed

### Impact
- All API endpoints are accessible without authentication
- No audit trail of who performed actions
- Potential unauthorized access to sensitive data
- Compliance and security audit failures

---

## Root Cause Analysis

### The Problem Chain

1. **Session Creation Works**
   - User logs in via `enhancedAuthService.authenticate()` (line 173-353)
   - Supabase `signInWithPassword()` succeeds (line 232)
   - Session is created and stored in `enhancedAuthService.currentSession`
   - AuthContext receives session via listener (line 135-138)

2. **Session Storage Issue**
   - Enhanced auth service stores session in localStorage (line 474-485)
   - BUT: Only stores a stripped version without `supabaseSession` (line 479)
   - Supabase client SHOULD be storing its own session via localStorage
   - Supabase client IS configured for `persistSession: true` (line 12 in supabase-client.js)

3. **The Critical Gap**
   - `ChangePasswordModal` calls `supabase.auth.getSession()` (line 52)
   - Returns NULL despite successful login
   - This suggests Supabase's internal session storage is not being populated

4. **Why Supabase Session Is Lost**

   **PRIMARY CAUSE:** The enhanced auth service is using `supabase.auth.signInWithPassword()` directly, but then managing its own session layer on top. This creates a disconnect where:

   - Supabase successfully authenticates and creates a session
   - The session IS stored by Supabase client in localStorage (key: `sb-oieliubbvvdzhzvikzal-auth-token`)
   - BUT: When components like `ChangePasswordModal` call `supabase.auth.getSession()`, they get a NEW Supabase client instance
   - This happens because each import of `supabase-client.js` creates a singleton, but React's module system may create multiple instances during development

   **SECONDARY CAUSE:** The `enhancedAuthService` stores the session object but removes the `supabaseSession` property when saving to localStorage (line 479), breaking the link between the custom session and Supabase's session.

5. **API Request Flow**
   - Components use `apiClient.request()` which doesn't attach auth headers
   - OR they use direct fetch without checking Supabase session first
   - Backend receives request with no Authorization header
   - Auth bypass activates, allowing the request

---

## Architecture Issues

### 1. Dual Session Management
**Problem:** Two competing session systems
- `enhancedAuthService` maintains `currentSession` object
- Supabase client maintains its own session in localStorage
- These are not synchronized

**Why It's Problematic:**
```javascript
// Login succeeds, creates TWO sessions:
const { data } = await supabase.auth.signInWithPassword(...)
// ✅ Supabase stores: localStorage['sb-oieliubbvvdzhzvikzal-auth-token']

this.currentSession = { ...sessionData }
// ✅ Enhanced service stores: localStorage['supervisor_session']

// BUT when ChangePasswordModal runs:
const { data: { session } } = await supabase.auth.getSession()
// ❌ Returns NULL - Why?
```

### 2. Missing Token Attachment
**Problem:** API client doesn't include authentication

Current API client (line 13-22 in api-client.js):
```javascript
async request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,  // ❌ No Authorization header added
    },
    ...options,
  };
  // ... makes request without auth
}
```

### 3. Inconsistent Auth Patterns
**Problem:** Different components handle auth differently

- Login page: Uses `enhancedAuthService.authenticate()`
- ChangePasswordModal: Tries to get Supabase session directly
- Dashboard: Uses `useAuth()` hook for user info
- API calls: No authentication at all

---

## The Fix Strategy

### Phase 1: Session Management Unification (IMMEDIATE)

#### Approach: Single Source of Truth
Make Supabase the ONLY session manager. The enhanced auth service becomes a wrapper, not a replacer.

**Key Changes:**

1. **Fix Enhanced Auth Service Session Storage**
   ```javascript
   // Line 474-485 in enhanced-auth-service.js
   saveSessionToStorage(session) {
     // DON'T strip the supabaseSession - keep it!
     try {
       const sessionData = {
         ...session,
         supabaseSession: {
           access_token: session.supabaseSession.access_token,
           refresh_token: session.supabaseSession.refresh_token,
           expires_at: session.supabaseSession.expires_at,
           expires_in: session.supabaseSession.expires_in
         }
       };
       localStorage.setItem('supervisor_session', JSON.stringify(sessionData));
     } catch (error) {
       console.error('Error saving session to storage:', error);
     }
   }
   ```

2. **Create Session Accessor Method**
   ```javascript
   // Add to enhanced-auth-service.js
   async getAccessToken() {
     // First check if we have a current session
     if (this.currentSession?.supabaseSession?.access_token) {
       return this.currentSession.supabaseSession.access_token;
     }

     // Otherwise, check Supabase directly
     const { data: { session }, error } = await supabase.auth.getSession();
     if (error || !session) {
       return null;
     }

     return session.access_token;
   }
   ```

3. **Fix ChangePasswordModal**
   ```javascript
   // Line 47-63 in ChangePasswordModal.jsx
   try {
     // Use enhanced auth service instead of direct Supabase access
     const token = await enhancedAuthService.getAccessToken();

     const headers = {
       'Content-Type': 'application/json'
     };

     if (token) {
       headers['Authorization'] = `Bearer ${token}`;
       console.log('✅ Using access token for auth');
     } else {
       console.warn('⚠️ No access token available');
       throw new Error('Please log in again to change your password');
     }

     const response = await fetch(`${apiConfig.baseUrl}/api/auth/change-password`, {
       method: 'POST',
       headers,
       body: JSON.stringify({
         email: userEmail || currentUser?.email,
         currentPassword,
         newPassword
       })
     });
   }
   ```

### Phase 2: API Client Token Injection (IMMEDIATE)

#### Centralize Auth Header Injection

**Update api-client.js:**

```javascript
import enhancedAuthService from './enhanced-auth-service.js';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get access token from enhanced auth service
    const token = await enhancedAuthService.getAccessToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Inject Authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.warn('🔒 Authentication required, session may be expired');
        // Optionally trigger logout or token refresh
        // This could dispatch an event that AuthContext listens to
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ... rest of methods unchanged
}
```

### Phase 3: Backend Auth Bypass Removal (AFTER Phase 1 & 2 Testing)

#### Staged Removal Process

**Step 1: Add Logging to Auth Bypass (Week 1)**
```javascript
// Line 94-105 in authMiddleware.js
if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') {
  console.log('🔧 Auth bypass mode: allowing access for', req.path);
  console.log('🔍 Request from:', req.ip, req.get('User-Agent'));
  console.log('📊 Bypass usage count:', ++bypassCounter); // Add counter

  req.user = {
    id: '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0',
    email: 'anthony.gair@gonortheast.co.uk',
    role: 'admin',
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    bypassMode: true // Flag for tracking
  };
  return next();
}
```

**Step 2: Test in Production (Week 1-2)**
- Deploy Phase 1 & 2 changes
- Monitor logs for bypass usage
- Verify all features work with proper auth
- Goal: Zero bypass usage for 48 hours

**Step 3: Switch to Warning Mode (Week 2)**
```javascript
// Replace bypass with loud warning
if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') {
  console.error('⚠️ MISSING AUTH TOKEN:', req.path);
  console.error('⚠️ Client:', req.ip, req.get('User-Agent'));

  // Still allow but log as security event
  req.user = { ...mockUser, securityWarning: true };
  return next();
}
```

**Step 4: Remove Bypass Completely (Week 3)**
```javascript
// Final secure version - NO BYPASS
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    error: 'Authentication required',
    code: 'AUTH_TOKEN_MISSING'
  });
}
```

### Phase 4: Enhanced Security Features

#### 1. Token Refresh Interceptor
```javascript
// Add to api-client.js
async requestWithRetry(endpoint, options = {}, retryCount = 0) {
  try {
    return await this.request(endpoint, options);
  } catch (error) {
    // If 401 and haven't retried yet, try refreshing token
    if (error.message.includes('401') && retryCount === 0) {
      console.log('🔄 Token may be expired, attempting refresh...');

      const refreshed = await enhancedAuthService.refreshSession();
      if (refreshed.success) {
        console.log('✅ Token refreshed, retrying request...');
        return this.requestWithRetry(endpoint, options, retryCount + 1);
      }
    }
    throw error;
  }
}
```

#### 2. Session Expiry Warning
```javascript
// Add to AuthContext.jsx after line 203
useEffect(() => {
  const checkInterval = setInterval(() => {
    if (isSessionExpiringSoon()) {
      // Show warning to user
      window.dispatchEvent(new CustomEvent('auth:expiring-soon', {
        detail: { minutesRemaining: getSessionTimeRemaining() / 60000 }
      }));
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkInterval);
}, [isSessionExpiringSoon, getSessionTimeRemaining]);
```

#### 3. Automatic Token Refresh
```javascript
// Add to enhanced-auth-service.js
setupAutoRefresh(session) {
  this.clearRefreshTimer();

  if (!session.expires_at) return;

  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();

  // Refresh 5 minutes before expiry
  const refreshIn = Math.max(timeUntilExpiry - (5 * 60 * 1000), 30000);

  if (refreshIn > 0) {
    console.log(`🔄 Scheduling auto-refresh in ${Math.round(refreshIn / 1000 / 60)} minutes`);

    this.refreshTimer = setTimeout(async () => {
      console.log('🔄 Auto-refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ Auto-refresh failed:', error);
        // Trigger logout
        await this.signOut();
      } else {
        console.log('✅ Session auto-refreshed');
      }
    }, refreshIn);
  }
}
```

---

## Implementation Plan

### Week 1: Emergency Fixes (Days 1-3)

**Day 1: Session Management**
- [ ] Update `enhancedAuthService.saveSessionToStorage()` to keep supabaseSession
- [ ] Add `enhancedAuthService.getAccessToken()` method
- [ ] Test login flow maintains Supabase session
- [ ] Verify `supabase.auth.getSession()` returns valid session after login

**Day 2: API Client Update**
- [ ] Update `api-client.js` to inject Authorization headers
- [ ] Add 401 error handling
- [ ] Test all API endpoints with proper auth
- [ ] Update ChangePasswordModal to use new pattern

**Day 3: Testing & Validation**
- [ ] Test all user workflows:
  - Login
  - Change password
  - Create breakdown
  - View dashboard
  - Logout
- [ ] Monitor browser console for auth errors
- [ ] Check localStorage for proper session storage
- [ ] Verify backend receives valid tokens

### Week 2: Monitoring & Transition (Days 4-10)

**Day 4-5: Deploy to Production**
- [ ] Deploy Phase 1 & 2 changes
- [ ] Add bypass usage logging (Step 1)
- [ ] Monitor logs for 48 hours

**Day 6-7: Analysis**
- [ ] Review bypass usage logs
- [ ] Identify any remaining auth issues
- [ ] Fix any edge cases discovered

**Day 8-10: Warning Mode**
- [ ] Deploy Step 2 (warning mode)
- [ ] Monitor for any remaining issues
- [ ] Prepare for final removal

### Week 3: Secure Mode (Days 11-14)

**Day 11: Remove Bypass**
- [ ] Deploy Step 4 (full auth requirement)
- [ ] Monitor closely for any auth failures
- [ ] Have rollback plan ready

**Day 12-13: Enhanced Features**
- [ ] Implement token refresh interceptor
- [ ] Add session expiry warnings
- [ ] Implement auto-refresh

**Day 14: Security Audit**
- [ ] Full security review
- [ ] Document auth flow
- [ ] Update deployment guide
- [ ] Mark vulnerability as RESOLVED

---

## Testing Strategy

### Unit Tests Needed

```javascript
// tests/auth/session-management.test.js
describe('Session Management', () => {
  test('Login creates both Supabase and enhanced service session', async () => {
    await enhancedAuthService.authenticate(email, password);

    // Check enhanced service session
    const { session: enhancedSession } = await enhancedAuthService.getCurrentSession();
    expect(enhancedSession).toBeTruthy();
    expect(enhancedSession.supabaseSession).toBeTruthy();

    // Check Supabase session
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    expect(supabaseSession).toBeTruthy();
    expect(supabaseSession.access_token).toBeTruthy();
  });

  test('getAccessToken returns valid token', async () => {
    await enhancedAuthService.authenticate(email, password);
    const token = await enhancedAuthService.getAccessToken();

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(50);
  });

  test('Session persists across page refresh', async () => {
    await enhancedAuthService.authenticate(email, password);

    // Simulate page refresh
    window.location.reload();

    const { session } = await enhancedAuthService.getCurrentSession();
    expect(session).toBeTruthy();
  });
});
```

### Integration Tests

```javascript
// tests/integration/api-auth.test.js
describe('API Authentication', () => {
  test('API requests include Authorization header', async () => {
    await enhancedAuthService.authenticate(email, password);

    // Mock fetch to inspect headers
    const originalFetch = window.fetch;
    let capturedHeaders;
    window.fetch = jest.fn(async (url, options) => {
      capturedHeaders = options.headers;
      return originalFetch(url, options);
    });

    await apiClient.get('/api/breakdowns/active');

    expect(capturedHeaders.Authorization).toBeTruthy();
    expect(capturedHeaders.Authorization).toMatch(/^Bearer \w+/);

    window.fetch = originalFetch;
  });

  test('401 response triggers session refresh', async () => {
    await enhancedAuthService.authenticate(email, password);

    // Simulate expired token
    const mockResponse = { status: 401, ok: false };
    jest.spyOn(window, 'fetch').mockResolvedValueOnce(mockResponse);

    // Should attempt refresh and retry
    const refreshSpy = jest.spyOn(enhancedAuthService, 'refreshSession');

    try {
      await apiClient.get('/api/breakdowns/active');
    } catch (e) {
      // Expected to fail if refresh also fails
    }

    expect(refreshSpy).toHaveBeenCalled();
  });
});
```

### Manual Test Cases

**Test Case 1: Login and Maintain Session**
1. Clear all localStorage and cookies
2. Navigate to login page
3. Enter valid credentials and click "Login"
4. Verify dashboard loads
5. Open DevTools → Application → Local Storage
6. Verify keys present:
   - `sb-oieliubbvvdzhzvikzal-auth-token` (Supabase)
   - `supervisor_session` (Enhanced service)
7. Click "Change Password"
8. Verify modal opens without errors
9. Check console - should show "✅ Using access token for auth"

**Test Case 2: Token Injection**
1. Log in successfully
2. Open DevTools → Network tab
3. Navigate to dashboard (triggers API calls)
4. Select any API request (e.g., `/api/breakdowns/active`)
5. Verify Request Headers include:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Test Case 3: Session Persistence**
1. Log in successfully
2. Navigate around the app (dashboard, create breakdown, etc.)
3. Refresh the page (F5)
4. Verify:
   - Still logged in (no redirect to login)
   - User info still shows in header
   - API calls still work

**Test Case 4: Session Expiry**
1. Log in successfully
2. Wait for session to expire (or manually edit localStorage to set old expiry)
3. Try to make an API call (e.g., create breakdown)
4. Verify:
   - 401 error is caught
   - User is notified "Session expired"
   - Redirected to login page

---

## Configuration Changes

### Environment Variables (No Changes Needed)

Current configuration is correct:
```env
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (backend only)
```

### Supabase Client Configuration (Already Correct)

The Supabase client is already properly configured:
```javascript
// supabase-client.js (lines 9-61)
{
  auth: {
    persistSession: true,      // ✅ Correct
    autoRefreshToken: true,    // ✅ Correct
    detectSessionInUrl: true,  // ✅ Correct
    storage: localStorage      // ✅ Correct
  }
}
```

---

## Security Considerations

### Current Risks (CRITICAL)

1. **Unauthorized Access**
   - Any request to backend succeeds without auth
   - No way to verify who created/modified data
   - Potential for data tampering

2. **Audit Trail Loss**
   - All actions attributed to bypass user (AG003)
   - Can't track actual user actions
   - Compliance failures

3. **Session Hijacking**
   - Not applicable (no sessions being verified)
   - But this BECOMES a risk once auth is fixed

### Post-Fix Security Measures

1. **Token Storage**
   - JWT tokens stored in localStorage (acceptable for internal app)
   - Consider httpOnly cookies for enhanced security (future)
   - Implement token rotation on sensitive actions

2. **Rate Limiting**
   - Already implemented in backend (line 11-85 authMiddleware.js)
   - MAX_LOGIN_ATTEMPTS = 5 per 15 minutes
   - Works per IP + User Agent

3. **Password Requirements**
   - Minimum 8 characters
   - Must include: uppercase, lowercase, numbers, special chars
   - Enforced in both frontend and backend

4. **Session Management**
   - Tokens expire after 1 hour (Supabase default)
   - Automatic refresh 5 minutes before expiry
   - Force logout on 401 errors

---

## Rollback Plan

### If Phase 1 & 2 Fail

**Symptoms:**
- Login works but API calls still fail with 401
- Token not being attached to requests
- Dashboard doesn't load data

**Rollback Steps:**
1. Keep auth bypass enabled in backend
2. Revert frontend changes
3. Investigate why token isn't being retrieved
4. Check browser console for Supabase errors

**Rollback Command:**
```bash
git checkout HEAD~1 frontend/src/services/enhanced-auth-service.js
git checkout HEAD~1 frontend/src/services/api-client.js
npm run deploy:frontend
```

### If Phase 3 Fails (Bypass Removal)

**Symptoms:**
- 401 errors everywhere
- Users can't access any features
- Token validation failing

**Emergency Rollback:**
```bash
# Re-enable bypass immediately
git checkout HEAD~1 backend/middleware/authMiddleware.js
npm run deploy:backend

# Or manual fix:
# In authMiddleware.js, uncomment bypass code (lines 94-105)
```

---

## Success Metrics

### Week 1 Targets
- ✅ 100% of users can log in
- ✅ 100% of API calls include Authorization header
- ✅ Zero "No access token available" warnings in console
- ✅ Password change works for all users

### Week 2 Targets
- ✅ 48 hours with zero auth bypass usage
- ✅ All features working with proper auth
- ✅ Session persists across page refreshes
- ✅ Automatic token refresh working

### Week 3 Targets
- ✅ Auth bypass completely removed
- ✅ Zero 401 errors in production logs
- ✅ Full audit trail of all actions
- ✅ Security audit passes
- ✅ Documentation complete

---

## File Changes Summary

### Files to Modify

1. **frontend/src/services/enhanced-auth-service.js**
   - Line 474-485: Update `saveSessionToStorage()` to keep supabaseSession
   - Add new method: `getAccessToken()`
   - Estimated changes: +30 lines

2. **frontend/src/services/api-client.js**
   - Line 13-43: Update `request()` method to inject auth headers
   - Add 401 error handling
   - Add session expiry event dispatch
   - Estimated changes: +40 lines

3. **frontend/src/components/ChangePasswordModal.jsx**
   - Line 47-63: Replace direct Supabase call with enhancedAuthService
   - Add better error handling
   - Estimated changes: +10 lines, -5 lines

4. **backend/middleware/authMiddleware.js**
   - Line 94-105: Add logging (Week 1)
   - Line 94-105: Add warning mode (Week 2)
   - Line 94-105: Remove bypass (Week 3)
   - Estimated changes: Evolves over 3 weeks

### Files to Create

1. **frontend/src/services/auth-interceptor.js** (Optional enhancement)
   - Centralized token refresh logic
   - Session expiry handling
   - Auth event management

2. **tests/auth/session-management.test.js**
   - Unit tests for session management

3. **tests/integration/api-auth.test.js**
   - Integration tests for API authentication

---

## Additional Recommendations

### 1. Monitoring Dashboard
Create a real-time auth monitoring page (admin only):
- Current active sessions
- Failed login attempts
- Token refresh rate
- Session expiry warnings
- Auth bypass usage (during transition)

### 2. User Session Management
Allow admins to:
- View all active sessions
- Force logout specific users
- View login history
- Export auth audit logs

### 3. Enhanced Logging
Implement structured logging:
```javascript
const authLogger = {
  login: (userId, success, metadata) => {
    console.log(JSON.stringify({
      event: 'auth:login',
      userId,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    }));
  },
  // ... other auth events
};
```

### 4. Security Headers
Add security headers to backend responses:
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

---

## Contact & Support

### Implementation Team
- **Lead Developer:** Anthony Gair (anthony.gair@gonortheast.co.uk)
- **Security Review:** [TBD]
- **Testing Lead:** [TBD]

### Emergency Contacts
- **Production Issues:** [Emergency contact]
- **Security Incidents:** [Security team contact]

### Documentation Links
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OWASP Auth Guidelines: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

## Conclusion

This authentication security vulnerability is **CRITICAL** but **FIXABLE** with a phased approach. The root cause is well-understood: the frontend is not properly retrieving and attaching Supabase JWT tokens to API requests, forcing a dangerous authentication bypass in production.

The fix involves three clear phases:
1. **Fix session management** to ensure tokens are accessible
2. **Update API client** to inject tokens automatically
3. **Remove auth bypass** once everything is working

With proper testing and monitoring, this can be resolved within 2-3 weeks without service disruption.

**Next Steps:**
1. Review this document with the development team
2. Create tickets for each phase in your project management system
3. Begin Phase 1 implementation immediately
4. Schedule daily standups during transition period

---

**Document Status:** DRAFT for Review
**Last Updated:** 2025-10-01
**Next Review:** After Phase 1 completion
