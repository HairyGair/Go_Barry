# Go BARRY Frontend - Refresh Token Authentication Implementation

## Overview

The Go BARRY frontend now implements a secure JWT-based authentication system with automatic token refresh. This provides better security and a seamless user experience.

## Architecture

### Token Types

1. **Access Token** (15 minutes expiry)
   - Short-lived JWT token
   - Contains user information (id, badge, name, email, role, depot)
   - Stored in memory only (React state)
   - Never persisted to localStorage
   - Sent in Authorization header: `Bearer <token>`

2. **Refresh Token** (7 days expiry)
   - Long-lived JWT token
   - Contains minimal info (id, badge)
   - Stored in HttpOnly cookie (automatic, secure)
   - Never accessible to JavaScript
   - Used only to obtain new access tokens

### Security Benefits

- **XSS Protection**: Access tokens in memory only, cleared on page refresh
- **CSRF Protection**: HttpOnly cookies prevent JavaScript access
- **Minimal Exposure**: Short-lived access tokens limit damage if compromised
- **Automatic Cleanup**: Tokens automatically expire

## Files Created/Modified

### New Files

1. **`/Go_BARRY/utils/tokenManager.js`**
   - JWT parsing and validation utilities
   - Token expiry checking
   - No external dependencies (pure JavaScript)

2. **`/Go_BARRY/components/hooks/useApi.js`**
   - Hook for making authenticated API calls
   - Automatic token refresh before expiry
   - Retry on 401 errors
   - Request timeout handling

3. **`/Go_BARRY/.env.example`**
   - Environment configuration template

### Modified Files

1. **`/Go_BARRY/components/hooks/useSupervisorSessionOptimized.js`**
   - Updated to support access token in memory
   - Refresh token handling via cookies
   - Automatic token refresh on startup
   - Enhanced security for token storage

2. **`/Go_BARRY/.env`**
   - Added API timeout configuration

## Authentication Flow

### 1. Login

```
User enters credentials
    ↓
POST /api/auth/login
    ↓
Backend returns:
  - accessToken (in response body)
  - refreshToken (in HttpOnly cookie)
    ↓
Frontend stores:
  - accessToken in memory (React state)
  - session data in localStorage (no tokens)
  - refreshToken handled by browser (cookie)
```

### 2. Authenticated API Calls

```
Make API request
    ↓
Check if access token expires soon (< 5 min)
    ↓
If expiring: Call /api/auth/refresh
    ↓
Get new access token
    ↓
Make API request with valid token
    ↓
If 401: Retry refresh once → logout if fails
```

### 3. Automatic Token Refresh

```
Every 1 minute:
    Check token expiry
    ↓
If < 5 minutes remaining:
    POST /api/auth/refresh (sends cookie)
    ↓
Get new access token
    ↓
Update access token in memory
```

### 4. App Restart/Refresh

```
Page loads
    ↓
Load session from localStorage
    ↓
Check if access token in memory
    ↓
If expired: Call /api/auth/refresh
    ↓
If refresh succeeds: Restore session
If refresh fails: Require login
```

### 5. Logout

```
User clicks logout
    ↓
POST /api/auth/logout
    ↓
Clear refresh token cookie on server
    ↓
Clear access token from memory
Clear session from localStorage
    ↓
Redirect to login
```

## Usage Examples

### Basic Setup (Already Done)

The `SupervisorProvider` is already configured in your app. No changes needed.

```javascript
import { SupervisorProvider } from './components/hooks/useSupervisorSessionOptimized';

export default function App() {
  return (
    <SupervisorProvider>
      {/* Your app components */}
    </SupervisorProvider>
  );
}
```

### Using the Session Hook

```javascript
import { useSupervisor } from './components/hooks/useSupervisorSessionOptimized';

function MyComponent() {
  const {
    isLoggedIn,
    supervisorName,
    accessToken,
    login,
    logout,
    refreshAccessToken,
  } = useSupervisor();

  // Login
  const handleLogin = async () => {
    const result = await login({
      badge: 'AG003',
      password: 'password123',
      duty: { id: '100', name: 'Duty 100' },
      rememberMe: true
    });

    if (result.success) {
      console.log('Logged in!');
    }
  };

  // Logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome, {supervisorName}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Using the API Hook (Recommended)

The `useApi` hook automatically handles token refresh and retries.

```javascript
import { useApi } from './components/hooks/useApi';

function AlertsComponent() {
  const { get, post } = useApi();
  const [alerts, setAlerts] = useState([]);

  // Fetch alerts (automatic token refresh if needed)
  const fetchAlerts = async () => {
    try {
      const data = await get('/api/alerts');
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error.message);
    }
  };

  // Dismiss alert
  const dismissAlert = async (alertId) => {
    try {
      const result = await post('/api/alerts/dismiss', {
        alertId,
        reason: 'Resolved',
        notes: 'Issue fixed'
      });
      console.log('Alert dismissed:', result);
    } catch (error) {
      console.error('Failed to dismiss alert:', error.message);
    }
  };

  return (
    <div>
      <button onClick={fetchAlerts}>Refresh Alerts</button>
      {/* Render alerts */}
    </div>
  );
}
```

### Manual API Calls with Token Refresh

If you need to make API calls outside the `useApi` hook:

```javascript
import { useSupervisor } from './components/hooks/useSupervisorSessionOptimized';
import { isTokenExpired, willExpireSoon } from './utils/tokenManager';

function ManualApiComponent() {
  const { accessToken, refreshAccessToken } = useSupervisor();

  const makeApiCall = async () => {
    let token = accessToken;

    // Check if token needs refresh
    if (!token || isTokenExpired(token) || willExpireSoon(token, 5)) {
      const result = await refreshAccessToken();
      if (!result.success) {
        console.error('Session expired');
        return;
      }
      token = result.token;
    }

    // Make API call
    const response = await fetch('/api/endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  };
}
```

## Token Manager Utilities

Located in `/Go_BARRY/utils/tokenManager.js`:

```javascript
import {
  parseJWT,           // Decode JWT token
  isTokenExpired,     // Check if token is expired
  willExpireSoon,     // Check if expires within X minutes
  getTokenExpiry,     // Get expiry timestamp
  getTokenMetadata,   // Get full token information
} from './utils/tokenManager';

// Example usage
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const decoded = parseJWT(token);
console.log('User ID:', decoded.id);

if (isTokenExpired(token)) {
  console.log('Token expired, need to refresh');
}

if (willExpireSoon(token, 5)) {
  console.log('Token expires in < 5 minutes');
}

const metadata = getTokenMetadata(token);
console.log('Token info:', metadata);
// {
//   payload: { id, badge, name, ... },
//   expiryTime: 1234567890000,
//   timeRemaining: 300000,
//   expired: false,
//   expiringSoon: true,
//   userId: 123,
//   userName: 'John Doe',
//   ...
// }
```

## Error Handling

### Network Errors
- **Behavior**: Don't logout user, show error message
- **Reason**: Might be temporary connectivity issue
- **Recovery**: User can retry when connection restored

### 401 Unauthorized
- **Behavior**: Try token refresh once, then logout if fails
- **Reason**: Access token expired
- **Recovery**: Refresh token → retry request

### 403 Forbidden
- **Behavior**: Logout immediately
- **Reason**: User doesn't have permission
- **Recovery**: Requires admin intervention

### 500 Server Error
- **Behavior**: Show error, keep session active
- **Reason**: Server issue
- **Recovery**: User can retry

## Configuration

### Environment Variables

Required in `.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com
EXPO_PUBLIC_API_TIMEOUT=10000
```

### Token Expiry Settings

Backend (`/backend/routes/authOptimized.js`):
- Access Token: 1 hour
- Refresh Token: 7 days

Frontend refresh triggers:
- Automatic check: Every 1 minute
- Refresh if: < 5 minutes remaining
- On API call: Check before request

## Security Considerations

### What's Stored Where

| Data Type | Storage Location | Security |
|-----------|-----------------|----------|
| Access Token | Memory (React state) | High - cleared on refresh |
| Refresh Token | HttpOnly Cookie | Very High - JavaScript can't access |
| Session Data | localStorage | Medium - no sensitive data |
| User Info | localStorage | Low - public data only |

### Best Practices

1. **Never log tokens**: Don't console.log tokens in production
2. **Use HTTPS**: Always use secure connections
3. **Validate inputs**: Backend validates all requests
4. **Rate limiting**: Backend implements rate limits
5. **Token rotation**: Consider rotating refresh tokens

## Testing Checklist

- [x] Login stores both tokens correctly
- [x] Access token auto-refreshes before expiry
- [x] Logout clears all tokens and session
- [x] Session persists on app restart (if refresh token valid)
- [x] Expired refresh token requires new login
- [x] Network errors don't logout user
- [x] 401 errors trigger refresh → logout if fails
- [x] API calls include credentials for cookie
- [x] Token expiry is checked before each request
- [x] Concurrent refreshes are prevented

## Troubleshooting

### Issue: User logged out on page refresh
**Solution**: Refresh token may have expired (7 days). User needs to login again.

### Issue: API calls return 401
**Possible Causes**:
1. Access token expired and refresh failed
2. Refresh token expired
3. Server rejected token

**Check**:
```javascript
const { accessToken } = useSupervisor();
console.log('Token valid?', !isTokenExpired(accessToken));
```

### Issue: Token refresh not working
**Check**:
1. Cookies enabled in browser
2. CORS configured correctly (credentials: 'include')
3. Backend refresh endpoint working
4. Same domain for API and frontend

### Issue: Memory leaks
**Cause**: Token check intervals not cleared
**Solution**: useEffect cleanup functions handle this automatically

## Migration Notes

### From Old System

The old system stored JWT tokens in localStorage. The new system:
- Moves access token to memory only
- Uses HttpOnly cookies for refresh tokens
- Automatically migrates on first login

### Breaking Changes

None - the API remains backward compatible. Existing sessions will require re-login on first use of new system.

## Future Enhancements

Potential improvements:
1. **Token rotation**: Rotate refresh tokens on each use
2. **Device tracking**: Track active sessions per device
3. **Revocation**: Server-side token revocation
4. **Biometric auth**: Support fingerprint/face unlock
5. **Remember device**: Trust specific devices for longer

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables are set
3. Check backend logs for authentication errors
4. Review this guide for common issues

## References

- Backend Auth Routes: `/backend/routes/authOptimized.js`
- JWT Documentation: https://jwt.io/introduction
- HttpOnly Cookies: https://owasp.org/www-community/HttpOnly
- OWASP Auth Cheatsheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
