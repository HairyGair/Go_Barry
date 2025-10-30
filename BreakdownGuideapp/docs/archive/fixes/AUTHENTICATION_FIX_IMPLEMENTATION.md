# Authentication Fix - Implementation Guide
## Quick Reference for Developers

**Date:** 2025-10-01
**Priority:** CRITICAL
**Estimated Time:** 3-5 hours for Phase 1 & 2

---

## ⚠️ **LEGACY DOCUMENTATION - MIGRATION COMPLETE** ⚠️

**This document describes the Supabase → MySQL migration process.**

**Migration Status:** ✅ **COMPLETE** (October 2025)

**Current System:**
- ✅ Authentication: JWT + bcrypt (backend)
- ✅ Database: MySQL (cPanel)
- ✅ No Supabase dependencies
- ✅ See: `PHASE1_CLEANUP_COMPLETE.md` and `PHASE2_CLEANUP_COMPLETE.md`

**This document kept for historical reference only.**

**Last Updated:** October 27, 2025

---

## Quick Summary

**Problem:** Frontend doesn't attach JWT tokens to API requests → Backend has dangerous auth bypass enabled

**Solution:**
1. Fix session storage to keep Supabase tokens
2. Update API client to inject Authorization headers automatically
3. Remove auth bypass after testing

---

## Phase 1: Fix Session Management (1-2 hours)

### File: `/frontend/src/services/enhanced-auth-service.js`

#### Change 1: Fix Session Storage (Line 474-485)

**Current Code (BROKEN):**
```javascript
saveSessionToStorage(session) {
  try {
    const sessionData = {
      ...session,
      // Don't store sensitive Supabase session details
      supabaseSession: null  // ❌ THIS BREAKS AUTH
    };
    localStorage.setItem('supervisor_session', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session to storage:', error);
  }
}
```

**New Code (FIXED):**
```javascript
saveSessionToStorage(session) {
  try {
    const sessionData = {
      ...session,
      // Store essential token info for auth header injection
      supabaseSession: session.supabaseSession ? {
        access_token: session.supabaseSession.access_token,
        refresh_token: session.supabaseSession.refresh_token,
        expires_at: session.supabaseSession.expires_at,
        expires_in: session.supabaseSession.expires_in,
        token_type: session.supabaseSession.token_type
      } : null
    };
    localStorage.setItem('supervisor_session', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session to storage:', error);
  }
}
```

#### Change 2: Add Token Accessor Method (After line 541)

**Add this new method:**
```javascript
/**
 * Get current access token for API requests
 * @returns {Promise<string|null>} Access token or null if not authenticated
 */
async getAccessToken() {
  try {
    // Method 1: Check current session in memory
    if (this.currentSession?.supabaseSession?.access_token) {
      const token = this.currentSession.supabaseSession.access_token;
      console.log('✅ Access token retrieved from current session');
      return token;
    }

    // Method 2: Check localStorage
    const storedSession = this.getStoredSession();
    if (storedSession?.supabaseSession?.access_token) {
      console.log('✅ Access token retrieved from localStorage');
      return storedSession.supabaseSession.access_token;
    }

    // Method 3: Check Supabase directly (fallback)
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Failed to get Supabase session:', error);
      return null;
    }

    if (session?.access_token) {
      console.log('✅ Access token retrieved from Supabase');
      return session.access_token;
    }

    console.warn('⚠️ No access token available - user may need to re-login');
    return null;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return null;
  }
}

/**
 * Check if we have a valid access token
 * @returns {Promise<boolean>}
 */
async hasValidToken() {
  const token = await this.getAccessToken();
  return token !== null;
}
```

#### Change 3: Update getCurrentSession Method (Line 412-441)

**Current Code:**
```javascript
async getCurrentSession() {
  // If we have a current session, return it
  if (this.currentSession) {
    return { success: true, session: this.currentSession };
  }

  // Check for stored session
  const storedSession = this.getStoredSession();
  if (storedSession) {
    // Verify with Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      // Session is valid, restore it
      await this.handleSignIn(session);
      return { success: true, session: this.currentSession };
    } else {
      // Stored session is invalid, clear it
      this.clearSessionStorage();
    }
  }

  // Check if there's a Supabase session we missed
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    await this.handleSignIn(session);
    return { success: true, session: this.currentSession };
  }

  return { success: false, session: null };
}
```

**Enhanced Code:**
```javascript
async getCurrentSession() {
  // If we have a current session, verify it's still valid
  if (this.currentSession) {
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (this.currentSession.expiresAt && this.currentSession.expiresAt < now) {
      console.log('🔄 Current session expired, attempting refresh...');
      // Try to refresh
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (!error && session) {
        await this.handleSignIn(session);
        return { success: true, session: this.currentSession };
      } else {
        // Refresh failed, clear session
        this.clearSessionStorage();
        this.currentSession = null;
        return { success: false, session: null };
      }
    }
    return { success: true, session: this.currentSession };
  }

  // Check for stored session
  const storedSession = this.getStoredSession();
  if (storedSession) {
    // Verify with Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session && session.user) {
      // Session is valid, restore it
      await this.handleSignIn(session);
      return { success: true, session: this.currentSession };
    } else {
      // Stored session is invalid, clear it
      console.log('🧹 Clearing invalid stored session');
      this.clearSessionStorage();
    }
  }

  // Check if there's a Supabase session we missed
  const { data: { session }, error } = await supabase.auth.getSession();
  if (!error && session && session.user) {
    console.log('✅ Found valid Supabase session, restoring...');
    await this.handleSignIn(session);
    return { success: true, session: this.currentSession };
  }

  return { success: false, session: null };
}
```

---

## Phase 2: Update API Client (1-2 hours)

### File: `/frontend/src/services/api-client.js`

#### Complete Replacement

**Replace entire file with:**

```javascript
// API Client for Go North East Breakdown Guide
// Connects to production Supabase via backend API with automatic auth header injection

import enhancedAuthService from './enhanced-auth-service.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com';

// API Client class with automatic authentication
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.retryCount = 0;
    this.maxRetries = 1;
  }

  /**
   * Make an authenticated API request
   * Automatically injects Authorization header if user is logged in
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
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
        console.log(`🔒 Request to ${endpoint} includes auth token`);
      } else {
        console.warn(`⚠️ Request to ${endpoint} has NO auth token - may fail if endpoint requires auth`);
      }

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, config);

      // Handle 401 Unauthorized - session may be expired
      if (response.status === 401) {
        console.warn('🔒 401 Unauthorized - Session may be expired');

        // Dispatch session expired event for UI to handle
        window.dispatchEvent(new CustomEvent('auth:session-expired', {
          detail: {
            endpoint,
            timestamp: new Date().toISOString()
          }
        }));

        throw new Error('Session expired. Please log in again.');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Make a request with automatic retry on auth failure
   * If 401 error occurs, attempts to refresh token and retry once
   */
  async requestWithRetry(endpoint, options = {}) {
    try {
      return await this.request(endpoint, options);
    } catch (error) {
      // If 401 and haven't retried yet, try refreshing token
      if (error.message.includes('Session expired') && this.retryCount < this.maxRetries) {
        console.log('🔄 Attempting token refresh and retry...');
        this.retryCount++;

        try {
          // Try to refresh session
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError && session) {
            console.log('✅ Token refreshed successfully, retrying request...');
            // Reset retry count and try again
            const result = await this.request(endpoint, options);
            this.retryCount = 0;
            return result;
          } else {
            console.error('❌ Token refresh failed:', refreshError);
            throw error;
          }
        } catch (refreshErr) {
          console.error('❌ Token refresh error:', refreshErr);
          throw error;
        } finally {
          this.retryCount = 0;
        }
      }

      // Reset retry count and throw error
      this.retryCount = 0;
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.requestWithRetry(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.requestWithRetry(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.requestWithRetry(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.requestWithRetry(endpoint, {
      method: 'PATCH',
      body: data,
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.requestWithRetry(endpoint, { method: 'DELETE' });
  }
}

// Create and export API client instance
export const apiClient = new APIClient();

// Breakdown API methods
export const breakdownAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/breakdowns${queryString ? `?${queryString}` : ''}`);
  },

  getActive: () => apiClient.get('/api/breakdowns/active'),

  getById: (id) => apiClient.get(`/api/breakdowns/${id}`),

  create: (breakdownData) => apiClient.post('/api/breakdowns', breakdownData),

  update: (id, updates) => apiClient.put(`/api/breakdowns/${id}`, updates),

  updateStatus: (id, status) => apiClient.patch(`/api/breakdowns/${id}/status`, { status }),

  getStats: (period = 'today') => apiClient.get(`/api/breakdowns/stats/summary?period=${period}`)
};

// Fleet API methods
export const fleetAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/fleet${queryString ? `?${queryString}` : ''}`);
  },

  search: (term) => apiClient.get(`/api/fleet/search/${encodeURIComponent(term)}`),

  getByFleetNumber: (fleetNumber) => apiClient.get(`/api/fleet/${fleetNumber}`),

  update: (fleetNumber, updates) => apiClient.put(`/api/fleet/${fleetNumber}`, updates),

  updateStatus: (fleetNumber, status) => apiClient.patch(`/api/fleet/${fleetNumber}/status`, { status }),

  getDepots: () => apiClient.get('/api/fleet/depots/list'),

  getTypes: () => apiClient.get('/api/fleet/types/list'),

  getStats: () => apiClient.get('/api/fleet/stats/summary')
};

// Auth API methods
export const authAPI = {
  getSupervisors: () => apiClient.get('/api/auth/supervisors'),

  getUser: (id) => apiClient.get(`/api/auth/user/${id}`),

  getSupervisor: (supervisorId) => apiClient.get(`/api/auth/supervisor/${supervisorId}`),

  login: (credentials) => apiClient.post('/api/auth/login', credentials),

  logout: () => apiClient.post('/api/auth/logout'),

  validate: () => apiClient.get('/api/auth/validate'),

  getDepots: () => apiClient.get('/api/auth/depots')
};

// Wizard API methods
export const wizardAPI = {
  logProgress: (progressData) => apiClient.post('/api/wizards/progress', progressData),

  getProgress: (breakdownId) => apiClient.get(`/api/wizards/progress/${breakdownId}`),

  completeAssessment: (completionData) => apiClient.post('/api/wizards/complete', completionData),

  getUsageStats: (period = 'week') => apiClient.get(`/api/wizards/stats/usage?period=${period}`),

  getDecisionStats: (period = 'week') => apiClient.get(`/api/wizards/decisions/summary?period=${period}`)
};

export default apiClient;
```

---

## Phase 3: Fix ChangePasswordModal (30 minutes)

### File: `/frontend/src/components/ChangePasswordModal.jsx`

#### Change: Simplify Auth Token Retrieval (Line 47-74)

**Current Code (COMPLEX):**
```javascript
try {
  // Try to get the Supabase session for the Authorization header
  let authHeader = undefined;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!sessionError && session?.access_token) {
      authHeader = `Bearer ${session.access_token}`;
      console.log('✅ Using Supabase access token for auth');
    } else {
      console.log('⚠️ No Supabase session found, backend will use auth bypass');
    }
  } catch (sessionErr) {
    console.log('⚠️ Failed to get Supabase session:', sessionErr.message);
    console.log('Backend will use auth bypass');
  }

  // Make the API request - backend has auth bypass enabled so this will work
  // even without a valid token
  const headers = {
    'Content-Type': 'application/json'
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
```

**New Code (SIMPLIFIED):**
```javascript
try {
  // Get access token from enhanced auth service
  const token = await enhancedAuthService.getAccessToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ Using access token for password change');
  } else {
    console.error('❌ No access token available');
    throw new Error('Please log in again to change your password');
  }
```

**OR EVEN BETTER** - Use the API client instead of fetch:

```javascript
try {
  // Use apiClient which automatically handles auth
  const data = await apiClient.post('/api/auth/change-password', {
    email: userEmail || currentUser?.email,
    currentPassword,
    newPassword
  });

  setSuccess('✅ Password changed successfully!');
  setTimeout(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess('');
    onClose();
  }, 2000);
} catch (err) {
  console.error('Change password error:', err);
  setError(err.message || 'Failed to change password. Please try again.');
} finally {
  setIsLoading(false);
}
```

---

## Testing Checklist

### Immediate Tests (After Phase 1 & 2)

**Test 1: Login and Token Availability**
```javascript
// In browser console after logging in:

// Check enhanced service
const token1 = await enhancedAuthService.getAccessToken();
console.log('Enhanced service token:', token1 ? '✅ Present' : '❌ Missing');

// Check Supabase
const { data: { session } } = await supabase.auth.getSession();
console.log('Supabase session:', session ? '✅ Present' : '❌ Missing');

// Check localStorage
const stored = localStorage.getItem('supervisor_session');
const parsed = JSON.parse(stored);
console.log('Stored token:', parsed?.supabaseSession?.access_token ? '✅ Present' : '❌ Missing');
```

**Test 2: API Request Headers**
```javascript
// In browser DevTools Network tab:
// 1. Log in
// 2. Navigate to dashboard (triggers API calls)
// 3. Click on any XHR request
// 4. Check "Request Headers"
// 5. Verify "Authorization: Bearer ey..." is present
```

**Test 3: Password Change**
```
1. Log in successfully
2. Open user menu
3. Click "Change Password"
4. Enter current and new password
5. Click "Change Password"
6. Check console - should see: "🔒 Request to /api/auth/change-password includes auth token"
7. Should NOT see: "Backend will use auth bypass"
8. Password should change successfully
```

**Test 4: Session Persistence**
```
1. Log in
2. Navigate around app
3. Press F5 (refresh page)
4. Verify:
   - Still logged in
   - Dashboard loads data
   - Console shows auth tokens present
```

### Backend Monitoring

**Add to backend logs (temporarily):**
```javascript
// In authMiddleware.js, line 88
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // TEMPORARY DEBUG LOGGING
    console.log('========================================');
    console.log('Auth Check:', req.path);
    console.log('Has Auth Header:', !!authHeader);
    console.log('Header Value:', authHeader?.substring(0, 20) + '...');
    console.log('========================================');

    // ... rest of code
```

Watch logs for:
- ✅ "Auth Check: /api/breakdowns/active" with "Has Auth Header: true"
- ❌ "Auth bypass mode: allowing access" (should NOT appear after fix)

---

## Deployment Steps

### Step 1: Deploy Frontend (Phase 1 & 2)
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
git add src/services/enhanced-auth-service.js
git add src/services/api-client.js
git add src/components/ChangePasswordModal.jsx
git commit -m "Fix authentication: store tokens and inject auth headers"
git push
npm run build
# Deploy to your hosting service
```

### Step 2: Monitor for 24-48 Hours
- Check browser console for auth errors
- Monitor backend logs for auth bypass usage
- Test all features thoroughly
- Get feedback from users

### Step 3: Backend Auth Bypass Removal (ONLY after Step 2 succeeds)

#### Week 1: Add Logging
```javascript
// In authMiddleware.js line 94-105
let bypassCounter = 0; // Add at top of file

if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') {
  bypassCounter++;
  console.warn('⚠️ AUTH BYPASS USAGE #' + bypassCounter);
  console.warn('⚠️ Path:', req.path);
  console.warn('⚠️ IP:', req.ip);
  console.warn('⚠️ User-Agent:', req.get('User-Agent'));
  console.warn('⚠️ THIS SHOULD NOT HAPPEN - Frontend auth may be broken');

  req.user = {
    id: '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0',
    email: 'anthony.gair@gonortheast.co.uk',
    role: 'admin',
    bypassMode: true // Flag for tracking
  };
  return next();
}
```

**Deploy and monitor logs. Goal: Zero bypass usage for 48 hours.**

#### Week 2: Remove Bypass
```javascript
// Complete removal - NO MORE BYPASS
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // NO MORE BYPASS - Require authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing authentication:', {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_TOKEN_MISSING',
        message: 'Please log in to access this resource'
      });
    }

    // ... rest of verification code (unchanged)
```

---

## Rollback Plan

### If Tests Fail After Deployment

**Symptoms:**
- Users report 401 errors
- Dashboard doesn't load
- "Session expired" messages everywhere

**Immediate Rollback:**
```bash
# Frontend rollback
cd frontend
git revert HEAD
npm run build
# Deploy

# Or keep frontend but revert just the problematic file:
git checkout HEAD~1 src/services/api-client.js
```

**Backend stays unchanged** - Auth bypass is still active, so everything still works even if frontend breaks.

---

## Success Criteria

### Phase 1 & 2 Success = ALL of these true:
- ✅ Users can log in successfully
- ✅ Dashboard loads data without errors
- ✅ Password change works
- ✅ Console shows "🔒 Request to X includes auth token" for all API calls
- ✅ NO "Backend will use auth bypass" messages
- ✅ Session persists across page refreshes
- ✅ Backend logs show proper Authorization headers

### Phase 3 Success = ALL of these true:
- ✅ 48 hours with zero auth bypass usage
- ✅ All features still working after bypass removal
- ✅ Zero 401 errors in production
- ✅ Audit trail showing actual user IDs (not bypass user)

---

## Quick Reference

### Import Statement for Components
```javascript
import enhancedAuthService from '../services/enhanced-auth-service.js';
```

### Get Access Token
```javascript
const token = await enhancedAuthService.getAccessToken();
```

### Check if Authenticated
```javascript
const isValid = await enhancedAuthService.hasValidToken();
```

### Make Authenticated API Call
```javascript
// Old way (manual):
const token = await enhancedAuthService.getAccessToken();
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// New way (automatic):
import { apiClient } from '../services/api-client.js';
apiClient.get('/api/endpoint'); // Token injected automatically!
```

### Listen for Session Expiry
```javascript
// In any component
useEffect(() => {
  const handleExpired = (event) => {
    console.error('Session expired:', event.detail);
    // Show message, redirect to login, etc.
  };

  window.addEventListener('auth:session-expired', handleExpired);
  return () => window.removeEventListener('auth:session-expired', handleExpired);
}, []);
```

---

## Need Help?

### Common Issues

**Issue:** "getAccessToken is not a function"
- **Cause:** Old version of enhanced-auth-service.js
- **Fix:** Make sure Phase 1 changes are deployed

**Issue:** API calls still get 401 even with token
- **Cause:** Token might be expired
- **Fix:** Check token expiry, try logout/login

**Issue:** "Cannot read property 'access_token' of null"
- **Cause:** Session not being stored properly
- **Fix:** Check Phase 1 saveSessionToStorage changes

**Issue:** Console shows "NO auth token" for API calls
- **Cause:** getAccessToken() returning null
- **Fix:** Check localStorage for 'supervisor_session' and 'sb-' keys

### Debug Commands
```javascript
// Check all auth state
console.log('=== AUTH DEBUG ===');
console.log('Enhanced session:', await enhancedAuthService.getCurrentSession());
console.log('Access token:', await enhancedAuthService.getAccessToken());
console.log('Supabase session:', await supabase.auth.getSession());
console.log('LocalStorage keys:', Object.keys(localStorage).filter(k => k.includes('session') || k.includes('sb-')));
```

---

**Last Updated:** 2025-10-01
**Next Review:** After Phase 1 & 2 deployment
