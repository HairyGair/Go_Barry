# Quick Integration Guide

## Using the Secure Authentication System

### For Server.js Integration

Replace your existing auth route import with the secure version:

```javascript
// OLD - in server.js
import authOptimizedRouter from './routes/authOptimized.js';
app.use('/api/auth', rateLimitLogin, authOptimizedRouter);

// NEW - in server.js
import authSecureRouter from './routes/authSecure.js';
app.use('/api/auth', authSecureRouter);
// Note: Rate limiting is already built into authSecure.js
```

### Frontend Integration Example

#### 1. Login Function

```javascript
async function login(badge, password) {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Include cookies
      body: JSON.stringify({ badge, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store access token (in memory or secure storage)
      localStorage.setItem('accessToken', data.token);

      // Store user info
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

#### 2. API Request with Token

```javascript
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`http://localhost:3001${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for refresh token
  });

  // Handle token expiration
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry request with new token
      return makeAuthenticatedRequest(endpoint, options);
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

#### 3. Token Refresh Function

```javascript
async function refreshToken() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Important: Send refresh token cookie
    });

    const data = await response.json();

    if (data.success) {
      // Update access token
      localStorage.setItem('accessToken', data.token);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Auto-refresh token every 14 minutes (before 15-minute expiry)
setInterval(refreshToken, 14 * 60 * 1000);
```

#### 4. Logout Function

```javascript
async function logout() {
  const token = localStorage.getItem('accessToken');

  try {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Send refresh token cookie
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API response
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
```

#### 5. Check Authentication Status

```javascript
async function checkAuth() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return { authenticated: false };
  }

  try {
    const response = await fetch('http://localhost:3001/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.valid) {
      return { authenticated: true, user: data.user };
    } else {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        return checkAuth(); // Retry
      }
      return { authenticated: false };
    }
  } catch (error) {
    return { authenticated: false };
  }
}
```

### React Example

```jsx
import React, { useState, useEffect } from 'react';

function LoginForm() {
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(badge, password);

    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Badge (e.g., AG003)"
        value={badge}
        onChange={(e) => setBadge(e.target.value)}
        maxLength={5}
        pattern="[A-Z]{2}\d{3}"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    checkAuth().then((result) => {
      setAuthenticated(result.authenticated);
      if (!result.authenticated) {
        window.location.href = '/login';
      }
    });
  }, []);

  if (authenticated === null) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : null;
}
```

### Error Handling

```javascript
function handleAuthError(error) {
  switch (error.code) {
    case 'AUTH_FAILED':
      return 'Invalid credentials. Please check your badge and password.';

    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many login attempts. Please try again later.';

    case 'BADGE_BLOCKED':
      return 'This badge has been temporarily locked. Please wait 60 minutes.';

    case 'ACCOUNT_INACTIVE':
      return 'Your account is inactive. Please contact an administrator.';

    case 'VALIDATION_ERROR':
      return 'Invalid input. Badge format: 2 letters + 3 digits (e.g., AG003).';

    case 'TOKEN_BLACKLISTED':
      return 'Your session has expired. Please login again.';

    default:
      return 'An error occurred. Please try again.';
  }
}
```

### CORS Configuration

Ensure your frontend domain is allowed in the backend:

```javascript
// In backend/.env
CORS_ORIGIN=http://localhost:8082,http://localhost:3000,https://gobarry.co.uk

// Or in server.js
const allowedOrigins = [
  'http://localhost:3000',
  'https://gobarry.co.uk',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Important for cookies
}));
```

### Testing Checklist

- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Rate limiting triggers after 5 attempts
- [ ] Badge lockout triggers after 3 attempts
- [ ] Token refresh works automatically
- [ ] Logout clears tokens properly
- [ ] Blacklisted tokens are rejected
- [ ] Cross-origin requests work with cookies
- [ ] Audit logs are created
- [ ] Application logs show events

### Common Issues

**Issue:** Cookies not being set

**Solution:**
```javascript
// Make sure credentials: 'include' is set in fetch
fetch(url, {
  credentials: 'include',
  // ...
});

// Check cookie settings in backend
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none', // For cross-origin
});
```

**Issue:** Token refresh fails

**Solution:**
- Check if refresh token cookie is being sent
- Verify credentials: 'include' in fetch options
- Check browser console for CORS errors
- Verify cookie domain matches

**Issue:** Rate limit triggers too quickly

**Solution:**
- Clear rate limit by restarting server
- Adjust limits in `/backend/middleware/rateLimiting.js`
- Check if multiple IPs are being detected

### Next Steps

1. Install new dependencies: `npm install`
2. Update server.js to use authSecure.js
3. Test all endpoints manually
4. Update frontend to use new error codes
5. Monitor audit logs for suspicious activity
6. Set up log rotation in production
