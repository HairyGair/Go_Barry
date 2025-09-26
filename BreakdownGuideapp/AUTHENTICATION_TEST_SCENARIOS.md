# Authentication Security Test Scenarios

This document provides comprehensive test scenarios for validating the authentication system's security features.

## Prerequisites

1. **Backend running** on http://localhost:3001
2. **Frontend running** on http://localhost:5173
3. **Supabase configured** with valid credentials
4. **Test accounts created** in Supabase Auth and supervisors table

## Test Accounts

### Valid Supervisor Accounts
- **Admin**: anthony.gair@example.com / TempPassword2025!
- **Admin**: lee.mutch@example.com / TempPassword2025!
- **Supervisor**: supervisor@example.com / TempPassword2025!

### Invalid Test Accounts
- **Non-existent**: nonexistent@example.com / AnyPassword123!
- **Unauthorized**: regular.user@example.com / ValidPassword123!

---

## 1. Valid Login - Correct Email/Password

### Test Scenario 1.1: Successful Admin Login
**Objective**: Verify successful authentication with valid admin credentials

**Steps**:
1. Navigate to login page
2. Enter email: `anthony.gair@example.com`
3. Enter password: `TempPassword2025!`
4. Check "Remember Me" checkbox
5. Click "Login"

**Expected Results**:
- ✅ Login succeeds immediately
- ✅ User redirected to dashboard
- ✅ User info displayed correctly (Anthony Gair, Admin, Washington)
- ✅ Session persists across browser refresh
- ✅ localStorage contains session data
- ✅ Backend logs successful authentication

**Backend Verification**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anthony.gair@example.com","password":"TempPassword2025!"}'
```

### Test Scenario 1.2: Successful Supervisor Login
**Objective**: Verify successful authentication with supervisor credentials

**Steps**:
1. Navigate to login page
2. Enter email: `supervisor@example.com`
3. Enter password: `TempPassword2025!`
4. Do NOT check "Remember Me"
5. Click "Login"

**Expected Results**:
- ✅ Login succeeds
- ✅ User gets supervisor-level access
- ✅ Session expires after browser close
- ✅ No persistent session data stored

---

## 2. Invalid Email - Non-existent User

### Test Scenario 2.1: Non-existent Email
**Objective**: Verify generic error for non-existent email addresses

**Steps**:
1. Navigate to login page
2. Enter email: `nonexistent@example.com`
3. Enter password: `AnyPassword123!`
4. Click "Login"

**Expected Results**:
- ❌ Login fails with generic error
- ❌ Error message: "Invalid credentials. Please check your email and password."
- ❌ No indication that email doesn't exist
- ❌ Response time similar to valid attempts (no timing attack)
- ✅ Failed attempt logged in backend

**Backend Verification**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"AnyPassword123!"}'
```

### Test Scenario 2.2: Malformed Email
**Objective**: Verify handling of invalid email formats

**Steps**:
1. Navigate to login page
2. Enter email: `not-an-email`
3. Enter password: `SomePassword123!`
4. Click "Login"

**Expected Results**:
- ❌ Login fails with validation error
- ❌ Error message about invalid email format
- ✅ Frontend validation prevents submission

---

## 3. Invalid Password - Wrong Password

### Test Scenario 3.1: Wrong Password for Valid User
**Objective**: Verify generic error for incorrect passwords

**Steps**:
1. Navigate to login page
2. Enter email: `anthony.gair@example.com` (valid user)
3. Enter password: `WrongPassword123!`
4. Click "Login"

**Expected Results**:
- ❌ Login fails with generic error
- ❌ Error message: "Invalid credentials. Please check your email and password."
- ❌ No indication that email exists but password is wrong
- ✅ Failed attempt logged

### Test Scenario 3.2: Weak Password Validation
**Objective**: Verify password strength requirements

**Steps**:
1. Navigate to login page
2. Enter email: `anthony.gair@example.com`
3. Enter weak passwords: `weak`, `12345678`, `password`
4. Observe real-time validation

**Expected Results**:
- ❌ Password strength indicator shows weakness
- ❌ Login disabled until password meets requirements
- ✅ Helpful validation messages displayed

---

## 4. Session Expiry - Token Timeout Handling

### Test Scenario 4.1: Natural Token Expiry
**Objective**: Verify handling of expired tokens

**Steps**:
1. Login successfully and get a valid session
2. Wait for token to expire (or mock expired token)
3. Attempt to access protected route
4. Observe automatic refresh attempt

**Expected Results**:
- ✅ System attempts automatic token refresh
- ✅ If refresh succeeds, request continues
- ❌ If refresh fails, user redirected to login
- ✅ No data loss during refresh process

**Backend Simulation**:
```bash
# Test with expired token
curl -X GET http://localhost:3001/api/breakdowns/stats \
  -H "Authorization: Bearer expired-token-here"
```

### Test Scenario 4.2: Session Cleanup on Expiry
**Objective**: Verify proper cleanup when session expires

**Steps**:
1. Login and establish session
2. Force session expiry (close backend, wait, restart)
3. Refresh page or navigate
4. Check application state

**Expected Results**:
- ✅ Application detects invalid session
- ✅ User redirected to login page
- ✅ Local session data cleared
- ✅ No sensitive data remains in browser

---

## 5. Remember Me - 24-hour Persistence

### Test Scenario 5.1: Remember Me Enabled
**Objective**: Verify session persistence with Remember Me

**Steps**:
1. Login with "Remember Me" checked
2. Close browser completely
3. Reopen browser and navigate to app
4. Verify session restoration

**Expected Results**:
- ✅ User remains logged in after browser restart
- ✅ Session valid for 24 hours
- ✅ Automatic session restoration on app load
- ✅ localStorage contains session data

### Test Scenario 5.2: Remember Me Disabled
**Objective**: Verify session cleared without Remember Me

**Steps**:
1. Login without "Remember Me" checked
2. Close browser tab/window
3. Reopen and navigate to app
4. Verify session cleared

**Expected Results**:
- ❌ Session not restored after browser close
- ❌ User redirected to login page
- ✅ No persistent session data stored

### Test Scenario 5.3: 24-Hour Expiry
**Objective**: Verify Remember Me expires after 24 hours

**Steps**:
1. Login with "Remember Me" checked
2. Mock timestamp to 25 hours in the future
3. Refresh page or navigate
4. Verify session expired

**Expected Results**:
- ❌ Session expired and cleared
- ❌ User redirected to login
- ✅ Expired session data removed

---

## 6. Logout - Proper Session Clearing

### Test Scenario 6.1: Standard Logout
**Objective**: Verify complete session cleanup on logout

**Steps**:
1. Login successfully
2. Access some protected resources
3. Click "Logout" button
4. Verify complete cleanup

**Expected Results**:
- ✅ Immediate logout and redirect to login page
- ✅ Supabase session invalidated
- ✅ localStorage cleared completely
- ✅ Backend session invalidated
- ❌ Cannot access protected routes with old token

**Backend Verification**:
```bash
# After logout, this should fail
curl -X GET http://localhost:3001/api/breakdowns/stats \
  -H "Authorization: Bearer previous-token"
```

### Test Scenario 6.2: Logout Error Handling
**Objective**: Verify graceful handling of logout errors

**Steps**:
1. Login successfully
2. Disconnect from internet
3. Click "Logout"
4. Observe error handling

**Expected Results**:
- ✅ Local session cleared regardless of network error
- ✅ User redirected to login page
- ✅ Error logged but doesn't break application

---

## 7. Network Errors - Offline/Timeout Handling

### Test Scenario 7.1: Offline Authentication
**Objective**: Verify handling of network connectivity issues

**Steps**:
1. Disconnect from internet
2. Attempt to login with valid credentials
3. Observe error handling
4. Reconnect and retry

**Expected Results**:
- ❌ Login fails with network error message
- ✅ User-friendly error message displayed
- ✅ Retry button or automatic retry on reconnection
- ✅ No application crash or undefined behavior

### Test Scenario 7.2: Slow Network Response
**Objective**: Verify handling of slow/timeout responses

**Steps**:
1. Simulate slow network (throttle to 2G in DevTools)
2. Attempt login
3. Observe loading states and timeouts

**Expected Results**:
- ✅ Loading indicator shown during request
- ✅ Request times out after reasonable period (10-15 seconds)
- ✅ Appropriate timeout error message
- ✅ User can retry without page refresh

### Test Scenario 7.3: API Endpoint Unavailable
**Objective**: Verify handling when backend is unavailable

**Steps**:
1. Stop backend server
2. Attempt login from frontend
3. Observe error handling

**Expected Results**:
- ❌ Login fails with server error message
- ✅ Generic error message (not technical details)
- ✅ Application remains stable
- ✅ User can retry when server returns

---

## 8. Concurrent Sessions - Multiple Tabs/Windows

### Test Scenario 8.1: Multiple Tab Login
**Objective**: Verify session synchronization across tabs

**Steps**:
1. Open application in two browser tabs
2. Login in first tab
3. Observe second tab behavior
4. Logout from first tab
5. Check second tab state

**Expected Results**:
- ✅ Second tab automatically reflects login state
- ✅ Both tabs show authenticated user interface
- ✅ Logout in one tab affects both tabs
- ✅ Session state synchronized via storage events

### Test Scenario 8.2: Conflicting Sessions
**Objective**: Verify handling of session conflicts

**Steps**:
1. Login as User A in Tab 1
2. Login as User B in Tab 2
3. Observe behavior in both tabs
4. Perform actions in both tabs

**Expected Results**:
- ✅ Latest login takes precedence
- ✅ Previous session invalidated
- ✅ All tabs reflect current session
- ✅ No data corruption or mixed states

### Test Scenario 8.3: Session Storage Conflicts
**Objective**: Verify handling of localStorage conflicts

**Steps**:
1. Login and establish session
2. Manually modify localStorage session data
3. Refresh page or navigate
4. Observe conflict resolution

**Expected Results**:
- ✅ Invalid session data detected
- ✅ Session validation with backend
- ✅ Corrupted session cleared and user re-authenticated
- ✅ Application recovers gracefully

---

## 9. Rate Limiting Tests

### Test Scenario 9.1: Brute Force Protection
**Objective**: Verify rate limiting prevents brute force attacks

**Steps**:
1. Attempt login with wrong password 6 times rapidly
2. Observe rate limiting activation
3. Wait for rate limit reset
4. Attempt valid login

**Expected Results**:
- ❌ After 5 failed attempts, rate limiting activated
- ❌ Clear error message about rate limiting
- ❌ Reset time provided to user
- ✅ Valid login works after rate limit expires

**Backend Verification**:
```bash
# Rapid failed attempts
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' &
done
wait
```

### Test Scenario 9.2: Rate Limit Reset
**Objective**: Verify rate limits reset properly

**Steps**:
1. Trigger rate limiting
2. Wait for reset period (15 minutes or configured time)
3. Attempt login again
4. Verify rate limit cleared

**Expected Results**:
- ✅ Rate limit clears after specified time
- ✅ Normal login attempts work again
- ✅ Counter resets to zero

---

## 10. Security Event Logging

### Test Scenario 10.1: Failed Login Logging
**Objective**: Verify comprehensive logging of failed attempts

**Steps**:
1. Attempt various failed logins (wrong email, wrong password)
2. Check backend logs
3. Verify log details

**Expected Results**:
- ✅ All failed attempts logged with timestamps
- ✅ IP addresses and user agents logged
- ✅ No sensitive data (passwords) in logs
- ✅ Generic error messages in logs

### Test Scenario 10.2: Successful Login Logging
**Objective**: Verify logging of successful authentications

**Steps**:
1. Perform successful login
2. Check backend logs
3. Verify success details

**Expected Results**:
- ✅ Successful login logged with user details
- ✅ Session creation logged
- ✅ Security events tracked

---

## Automated Test Execution

### Frontend Tests
```bash
cd frontend
npm test -- authentication.test.js
```

### Backend Tests
```bash
cd backend
npm test -- auth-integration.test.js
```

### Manual Test Checklist

Print this checklist and manually verify each scenario:

- [ ] 1.1 Successful Admin Login
- [ ] 1.2 Successful Supervisor Login
- [ ] 2.1 Non-existent Email
- [ ] 2.2 Malformed Email
- [ ] 3.1 Wrong Password for Valid User
- [ ] 3.2 Weak Password Validation
- [ ] 4.1 Natural Token Expiry
- [ ] 4.2 Session Cleanup on Expiry
- [ ] 5.1 Remember Me Enabled
- [ ] 5.2 Remember Me Disabled
- [ ] 5.3 24-Hour Expiry
- [ ] 6.1 Standard Logout
- [ ] 6.2 Logout Error Handling
- [ ] 7.1 Offline Authentication
- [ ] 7.2 Slow Network Response
- [ ] 7.3 API Endpoint Unavailable
- [ ] 8.1 Multiple Tab Login
- [ ] 8.2 Conflicting Sessions
- [ ] 8.3 Session Storage Conflicts
- [ ] 9.1 Brute Force Protection
- [ ] 9.2 Rate Limit Reset
- [ ] 10.1 Failed Login Logging
- [ ] 10.2 Successful Login Logging

---

## Expected Security Behaviors Summary

### ✅ Security Features Working Correctly:
- Generic error messages for all authentication failures
- Rate limiting prevents brute force attacks
- Comprehensive security event logging
- Proper session management and cleanup
- Token-based API authentication
- Session synchronization across tabs
- Graceful handling of network errors
- Password strength validation
- Secure logout with complete cleanup

### ❌ Security Violations to Report:
- Specific error messages revealing email existence
- Missing rate limiting or easy bypass
- Insufficient logging of security events
- Session data persisting after logout
- Unprotected API endpoints
- Timing attacks possible
- Weak password acceptance
- Session conflicts causing data leakage

This comprehensive test suite ensures the authentication system meets enterprise security standards.