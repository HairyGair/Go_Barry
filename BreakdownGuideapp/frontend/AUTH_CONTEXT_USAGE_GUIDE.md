# AuthContext Usage Guide

## 🎯 Overview

The AuthContext provides a centralized authentication state management system for the entire application. It integrates with the enhanced authentication service and provides React hooks, HOCs, and components for easy authentication handling.

## 🚀 Core Features Implemented

### ✅ Required Features
- **currentUser state** - Complete user object with all details
- **isAuthenticated boolean** - Authentication status
- **isLoading boolean** - Loading state during auth operations
- **login(email, password) function** - Login with credentials
- **logout() function** - Sign out user
- **refreshSession() function** - Refresh current session
- **checkSession() function** - Verify current session

### ✨ Enhanced Features
- **Automatic session management** - Handles token refresh automatically
- **Permission system** - Role-based access control
- **Session expiration tracking** - Monitor session time remaining
- **Error handling** - Comprehensive error management
- **HOCs and utility components** - Easy authentication guards
- **Real-time updates** - Session changes propagate immediately

## 📦 Setup and Integration

### 1. Wrap Your App with AuthProvider

```javascript
// In your main App.jsx or index.js
import { AuthProvider } from './contexts/AuthContext.jsx';

function App() {
    return (
        <AuthProvider>
            <Router>
                {/* Your app components */}
            </Router>
        </AuthProvider>
    );
}
```

### 2. Use the useAuth Hook

```javascript
// In any component
import { useAuth } from './contexts/AuthContext.jsx';

function MyComponent() {
    const {
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        error
    } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            {isAuthenticated ? (
                <div>
                    <h1>Welcome, {currentUser.name}!</h1>
                    <button onClick={logout}>Logout</button>
                </div>
            ) : (
                <div>Please log in</div>
            )}
        </div>
    );
}
```

## 🔐 Authentication Methods

### Login Function
```javascript
const { login } = useAuth();

const handleLogin = async (email, password, rememberMe = true) => {
    const result = await login(email, password, rememberMe);

    if (result.success) {
        console.log('Login successful:', result.user);
        // User is now logged in, state updated automatically
    } else {
        console.error('Login failed:', result.error);
        // Error is also available in the error state
    }
};
```

### Logout Function
```javascript
const { logout } = useAuth();

const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
        console.log('Logout successful');
        // User is now logged out, state cleared automatically
    } else {
        console.error('Logout error:', result.error);
    }
};
```

### Session Management
```javascript
const {
    refreshSession,
    checkSession,
    getSessionTimeRemaining,
    isSessionExpiringSoon
} = useAuth();

// Manually refresh session
const handleRefresh = async () => {
    const result = await refreshSession();
    console.log('Session refresh:', result.success);
};

// Check current session
const handleCheck = async () => {
    const result = await checkSession();
    console.log('Session valid:', result.success);
};

// Monitor session expiration
useEffect(() => {
    const interval = setInterval(() => {
        const timeLeft = getSessionTimeRemaining();
        if (timeLeft && timeLeft < 5 * 60 * 1000) { // 5 minutes
            alert('Session expiring soon!');
        }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
}, []);
```

## 🛡️ Permission System

### Check User Permissions
```javascript
const { hasPermission, isAdmin, currentUser } = useAuth();

function AdminPanel() {
    if (!hasPermission('admin')) {
        return <div>Access denied</div>;
    }

    return (
        <div>
            <h1>Admin Panel</h1>
            {/* Admin content */}
        </div>
    );
}

function SupervisorFeatures() {
    if (!hasPermission('supervisor')) {
        return null;
    }

    return <div>Supervisor tools</div>;
}
```

### Available Permissions
```javascript
// Built-in permissions
hasPermission('admin')           // Admin users only
hasPermission('supervisor')      // Supervisors and admins
hasPermission('manager')         // Managers and admins
hasPermission('breakdown-access') // All authenticated users
hasPermission('dashboard-access') // All authenticated users
hasPermission('admin-panel')     // Admin users only
hasPermission('user-management') // Admin users only
```

## 🔧 Higher-Order Components (HOCs)

### Basic Authentication HOC
```javascript
import { withAuth } from './contexts/AuthContext.jsx';

const MyProtectedComponent = () => {
    return <div>This requires authentication</div>;
};

export default withAuth(MyProtectedComponent);
```

### Admin-Only HOC
```javascript
import { withAdminAuth } from './contexts/AuthContext.jsx';

const AdminComponent = () => {
    return <div>Admin only content</div>;
};

export default withAdminAuth(AdminComponent);
```

### Protected Route Component
```javascript
import { ProtectedRoute } from './contexts/AuthContext.jsx';

function App() {
    return (
        <Routes>
            <Route path="/public" element={<PublicPage />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute requireAdmin={true}>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
```

## 📊 State Properties

### User Information
```javascript
const {
    currentUser,      // Complete user object
    user,            // Alias for currentUser
    isAuthenticated, // Boolean: is user logged in
    isLoggedIn,      // Alias for isAuthenticated
    isAdmin,         // Boolean: is user admin
    userRole,        // String: user's role
    userDepot,       // String: user's depot
    userName,        // String: user's name
    userEmail        // String: user's email
} = useAuth();
```

### Loading States
```javascript
const {
    isLoading,           // General loading state
    isSessionChecking,   // Checking for existing session
    isRefreshLoading     // Refreshing current session
} = useAuth();
```

### Session Information
```javascript
const {
    lastLoginTime,       // ISO string of last login
    sessionExpiresAt,    // Unix timestamp of expiration
    authMethod          // How user authenticated ('supabase', 'local', etc.)
} = useAuth();
```

## 🎨 Integration Examples

### Login Form Integration
```javascript
import { useAuth } from './contexts/AuthContext.jsx';

function LoginForm() {
    const { login, isLoading, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError(); // Clear any previous errors

        const result = await login(email, password);
        if (result.success) {
            // Login successful - user state updated automatically
            console.log('Welcome!');
        }
        // Errors are automatically set in context state
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
}
```

### Navigation with Auth State
```javascript
import { useAuth } from './contexts/AuthContext.jsx';

function Navigation() {
    const {
        isAuthenticated,
        currentUser,
        logout,
        isAdmin
    } = useAuth();

    return (
        <nav>
            {isAuthenticated ? (
                <>
                    <span>Welcome, {currentUser.name}</span>
                    {isAdmin && (
                        <Link to="/admin">Admin Panel</Link>
                    )}
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <Link to="/login">Login</Link>
            )}
        </nav>
    );
}
```

### Session Expiration Warning
```javascript
import { useAuth } from './contexts/AuthContext.jsx';

function SessionWarning() {
    const {
        isSessionExpiringSoon,
        getSessionTimeRemaining,
        refreshSession
    } = useAuth();

    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        if (isSessionExpiringSoon()) {
            setShowWarning(true);
        }
    }, [isSessionExpiringSoon]);

    if (!showWarning) return null;

    const timeLeft = getSessionTimeRemaining();
    const minutesLeft = Math.floor(timeLeft / 60000);

    return (
        <div className="session-warning">
            <p>Your session expires in {minutesLeft} minutes</p>
            <button onClick={() => {
                refreshSession();
                setShowWarning(false);
            }}>
                Extend Session
            </button>
        </div>
    );
}
```

## 🔄 Migration from Existing Auth

### Replace Manual State Management
```javascript
// Before (manual state)
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser] = useState(null);

// After (using AuthContext)
const { isAuthenticated, currentUser } = useAuth();
```

### Replace Direct Service Calls
```javascript
// Before (direct service calls)
const handleLogin = async () => {
    const result = await enhancedAuthService.authenticate(email, password);
    if (result.success) {
        setCurrentUser(result.session);
        setIsAuthenticated(true);
    }
};

// After (using AuthContext)
const { login } = useAuth();
const handleLogin = async () => {
    await login(email, password);
    // State updated automatically
};
```

## 🚀 Best Practices

1. **Always use the context** instead of direct service calls
2. **Handle loading states** to improve UX
3. **Use HOCs** for route protection
4. **Monitor session expiration** for long-running apps
5. **Clear errors** before retry attempts
6. **Use permission system** instead of role checks
7. **Leverage automatic session refresh** for seamless UX

The AuthContext provides a complete, production-ready authentication solution that integrates seamlessly with your existing enhanced authentication service while providing a clean, React-friendly API.