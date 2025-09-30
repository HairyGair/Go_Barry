// AuthContext - Global Authentication State Management
// Provides centralized authentication state and methods for the entire application

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import enhancedAuthService from '../services/enhanced-auth-service.js';
import { authErrorHandler, processAuthError } from '../utils/errorHandling.js';
import { emergencyLogout, silentLogout, autoLogout, secureCleanup, ActivityTracker } from '../utils/logoutHelpers.js';

// Create the AuthContext
const AuthContext = createContext(null);

// Authentication action types
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_USER: 'SET_USER',
    SET_ERROR: 'SET_ERROR',
    CLEAR_USER: 'CLEAR_USER',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_SESSION_CHECKING: 'SET_SESSION_CHECKING',
    SET_REFRESH_LOADING: 'SET_REFRESH_LOADING'
};

// Initial authentication state
const initialState = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    isSessionChecking: true,
    isRefreshLoading: false,
    error: null,
    lastLoginTime: null,
    sessionExpiresAt: null,
    authMethod: null
};

// Authentication reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                error: action.payload ? null : state.error
            };

        case AUTH_ACTIONS.SET_SESSION_CHECKING:
            return {
                ...state,
                isSessionChecking: action.payload
            };

        case AUTH_ACTIONS.SET_REFRESH_LOADING:
            return {
                ...state,
                isRefreshLoading: action.payload
            };

        case AUTH_ACTIONS.SET_USER:
            return {
                ...state,
                currentUser: action.payload.user,
                isAuthenticated: true,
                isLoading: false,
                isSessionChecking: false,
                error: null,
                lastLoginTime: action.payload.loginTime || new Date().toISOString(),
                sessionExpiresAt: action.payload.expiresAt || null,
                authMethod: action.payload.authMethod || 'unknown'
            };

        case AUTH_ACTIONS.CLEAR_USER:
            return {
                ...state,
                currentUser: null,
                isAuthenticated: false,
                isLoading: false,
                isSessionChecking: false,
                isRefreshLoading: false,
                lastLoginTime: null,
                sessionExpiresAt: null,
                authMethod: null
            };

        case AUTH_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
                isSessionChecking: false,
                isRefreshLoading: false
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const sessionListenerRef = useRef(null);
    const refreshTimerRef = useRef(null);

    // Initialize authentication state on mount
    useEffect(() => {
        initializeAuth();
        return cleanup;
    }, []);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (sessionListenerRef.current) {
            sessionListenerRef.current();
            sessionListenerRef.current = null;
        }
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    // Initialize authentication
    const initializeAuth = useCallback(async () => {
        console.log('🔄 AuthContext: Initializing authentication...');
        dispatch({ type: AUTH_ACTIONS.SET_SESSION_CHECKING, payload: true });

        try {
            // Set up session listener first
            sessionListenerRef.current = enhancedAuthService.addSessionListener((session) => {
                console.log('🔄 AuthContext: Session change detected:', session?.name || 'null');
                handleSessionChange(session);
            });

            // Check for existing session
            const { success, session } = await enhancedAuthService.getCurrentSession();

            if (success && session) {
                console.log('✅ AuthContext: Found existing session for:', session.name);
                handleSessionChange(session);
            } else {
                console.log('ℹ️ AuthContext: No existing session found');
                dispatch({ type: AUTH_ACTIONS.SET_SESSION_CHECKING, payload: false });
            }
        } catch (error) {
            console.error('❌ AuthContext: Initialization error:', error);
            const processedError = processAuthError(error, 'initialization');
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: processedError.message });
        }
    }, []);

    // Handle session changes from the auth service
    const handleSessionChange = useCallback((session) => {
        if (session) {
            dispatch({
                type: AUTH_ACTIONS.SET_USER,
                payload: {
                    user: {
                        id: session.id,
                        supervisorId: session.supervisorId,
                        name: session.name,
                        email: session.email,
                        depot: session.depot,
                        role: session.role,
                        isAdmin: session.isAdmin,
                        authMethod: session.authMethod
                    },
                    loginTime: session.timestamp,
                    expiresAt: session.expiresAt,
                    authMethod: session.authMethod
                }
            });

            // Set up automatic session refresh if applicable
            setupSessionRefresh(session);
        } else {
            dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
            clearSessionRefresh();
        }
    }, []);

    // Setup automatic session refresh
    const setupSessionRefresh = useCallback((session) => {
        clearSessionRefresh();

        if (session.expiresAt) {
            const expiresAt = new Date(session.expiresAt * 1000);
            const now = new Date();
            const timeUntilRefresh = expiresAt.getTime() - now.getTime() - (10 * 60 * 1000); // Refresh 10 minutes before expiry

            if (timeUntilRefresh > 0) {
                console.log(`🔄 AuthContext: Setting up session refresh in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
                refreshTimerRef.current = setTimeout(() => {
                    refreshSession();
                }, timeUntilRefresh);
            }
        }
    }, []);

    // Clear session refresh timer
    const clearSessionRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);


    // Login function
    const login = useCallback(async (email, password, rememberMe = true) => {
        console.log('🔐 AuthContext: Attempting login for:', email);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            const result = await enhancedAuthService.authenticate(email, password, rememberMe);

            if (result.success) {
                console.log('✅ AuthContext: Login successful for:', result.session?.name);
                // Session will be handled by the session listener
                return { success: true, user: result.session };
            } else {
                console.error('❌ AuthContext: Login failed:', result.error);
                dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ AuthContext: Login error:', error);
            const processedError = processAuthError(error, 'login');
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: processedError.message });
            return { success: false, error: processedError.message, processedError };
        }
    }, []);

    // Comprehensive logout function with complete session cleanup
    const logout = useCallback(async (showMessage = true, redirectTo = '/') => {
        console.log('🚪 AuthContext: Starting comprehensive logout...');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            // Step 1: Call Supabase signOut
            console.log('🔐 Step 1: Calling Supabase signOut...');
            await enhancedAuthService.signOut();
            console.log('✅ Supabase signOut successful');

            // Step 2: Clear localStorage (authentication-related items)
            console.log('🧹 Step 2: Clearing localStorage...');
            try {
                const authKeys = [
                    'supabase_remember_me',
                    'auth_user',
                    'auth_session',
                    'supervisor_session',
                    'breakdown_draft',
                    'last_login_time',
                    'session_expires_at'
                ];

                authKeys.forEach(key => {
                    localStorage.removeItem(key);
                });

                // Clear any Supabase auth tokens
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                        localStorage.removeItem(key);
                    }
                });
                console.log('✅ localStorage cleared');
            } catch (storageError) {
                console.warn('⚠️ localStorage cleanup failed:', storageError);
            }

            // Step 3: Clear sessionStorage
            console.log('🧹 Step 3: Clearing sessionStorage...');
            try {
                const sessionKeys = [
                    'dashboard_stats',
                    'dashboard_activity',
                    'breakdown_progress',
                    'current_wizard_state',
                    'temp_session_data'
                ];

                sessionKeys.forEach(key => {
                    sessionStorage.removeItem(key);
                });

                // Clear any session-based auth data
                const allSessionKeys = Object.keys(sessionStorage);
                allSessionKeys.forEach(key => {
                    if (key.includes('auth') || key.includes('session') || key.includes('user')) {
                        sessionStorage.removeItem(key);
                    }
                });
                console.log('✅ sessionStorage cleared');
            } catch (sessionError) {
                console.warn('⚠️ sessionStorage cleanup failed:', sessionError);
            }

            // Step 4: Clear application state
            console.log('🧹 Step 4: Clearing application state...');
            dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
            dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

            // Clear any cached data in the app
            if (window.appCache) {
                try {
                    window.appCache.clear();
                } catch (cacheError) {
                    console.warn('⚠️ App cache clear failed:', cacheError);
                }
            }
            console.log('✅ Application state cleared');

            // Step 5: Show logout success message (if requested)
            if (showMessage) {
                console.log('✨ Step 5: Showing logout success message...');

                // Create a success notification
                const logoutNotification = {
                    id: `logout_success_${Date.now()}`,
                    type: 'success',
                    icon: '🚪',
                    title: 'Logged Out Successfully',
                    message: 'You have been securely logged out. Thank you for using the system.',
                    dismissible: true,
                    autoHide: true,
                    duration: 3000,
                    timestamp: new Date().toISOString()
                };

                // Show notification (this could be integrated with a notification system)
                if (window.showNotification) {
                    window.showNotification(logoutNotification);
                } else {
                    // Fallback: log to console
                    console.log('✅ Logout message:', logoutNotification.message);
                }
            }

            // Step 6: Redirect to login page (if in browser environment)
            console.log('🔄 Step 6: Preparing redirect...');
            setTimeout(() => {
                if (typeof window !== 'undefined' && window.location) {
                    console.log(`🔄 Redirecting to: ${redirectTo}`);
                    window.location.href = redirectTo;
                }
            }, showMessage ? 1500 : 0); // Delay if showing message

            console.log('✅ AuthContext: Comprehensive logout completed successfully');
            return {
                success: true,
                message: 'Logout completed successfully',
                redirectTo
            };

        } catch (error) {
            console.error('❌ AuthContext: Logout error:', error);
            const processedError = processAuthError(error, 'logout');

            // Force clear user state even if logout fails
            console.log('🆘 Force clearing user state due to logout error...');
            dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
            dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

            // Still attempt to clear storage even if Supabase logout failed
            try {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🧹 Emergency storage cleanup completed');
            } catch (emergencyError) {
                console.error('❌ Emergency cleanup failed:', emergencyError);
            }

            // Show error notification
            const errorNotification = {
                id: `logout_error_${Date.now()}`,
                type: 'warning',
                icon: '⚠️',
                title: 'Logout Warning',
                message: 'Logout completed but with some issues. Your session has been cleared locally.',
                dismissible: true,
                autoHide: true,
                duration: 5000,
                timestamp: new Date().toISOString()
            };

            if (window.showNotification) {
                window.showNotification(errorNotification);
            }

            return {
                success: false,
                error: processedError.message,
                processedError,
                localCleared: true // Indicate that local data was cleared
            };
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    // Emergency logout function - force logout without API calls
    const emergencyLogoutHandler = useCallback(() => {
        console.log('🆘 AuthContext: Emergency logout triggered');
        dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        emergencyLogout();
        return { success: true, method: 'emergency' };
    }, []);

    // Silent logout function - logout without notifications
    const silentLogoutHandler = useCallback(async () => {
        console.log('🤫 AuthContext: Silent logout initiated');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            const result = await silentLogout(enhancedAuthService);
            if (result.success) {
                dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
                dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
            }
            return result;
        } catch (error) {
            const processedError = processAuthError(error, 'silent_logout');
            return { success: false, error: processedError.message };
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    // Auto logout function - for inactivity or security policies
    const autoLogoutHandler = useCallback(async (reason = 'inactivity') => {
        console.log(`⏰ AuthContext: Auto logout triggered - ${reason}`);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            const result = await autoLogout(enhancedAuthService, reason);
            dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
            dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
            return result;
        } catch (error) {
            const processedError = processAuthError(error, 'auto_logout');
            // Force clear even on error
            dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
            return { success: false, error: processedError.message };
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    // Secure cleanup function
    const secureCleanupHandler = useCallback(() => {
        console.log('🔒 AuthContext: Secure cleanup initiated');
        secureCleanup();
        dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        return { success: true };
    }, []);

    // Refresh session function
    const refreshSession = useCallback(async () => {
        console.log('🔄 AuthContext: Refreshing session...');
        dispatch({ type: AUTH_ACTIONS.SET_REFRESH_LOADING, payload: true });

        try {
            const { success, session } = await enhancedAuthService.getCurrentSession();

            if (success && session) {
                console.log('✅ AuthContext: Session refresh successful');
                // Session will be handled by the session listener
                return { success: true, session };
            } else {
                console.log('ℹ️ AuthContext: No valid session to refresh');
                dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
                return { success: false, error: 'No valid session to refresh' };
            }
        } catch (error) {
            console.error('❌ AuthContext: Session refresh error:', error);
            const processedError = processAuthError(error, 'session_refresh');
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: processedError.message });
            return { success: false, error: processedError.message, processedError };
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_REFRESH_LOADING, payload: false });
        }
    }, []);

    // Check session function
    const checkSession = useCallback(async () => {
        console.log('🔍 AuthContext: Checking session...');
        dispatch({ type: AUTH_ACTIONS.SET_SESSION_CHECKING, payload: true });

        try {
            const { success, session } = await enhancedAuthService.getCurrentSession();

            if (success && session) {
                console.log('✅ AuthContext: Valid session found');
                return { success: true, session };
            } else {
                console.log('ℹ️ AuthContext: No valid session found');
                dispatch({ type: AUTH_ACTIONS.CLEAR_USER });
                return { success: false, session: null };
            }
        } catch (error) {
            console.error('❌ AuthContext: Session check error:', error);
            const processedError = processAuthError(error, 'session_check');
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: processedError.message });
            return { success: false, error: processedError.message, processedError };
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_SESSION_CHECKING, payload: false });
        }
    }, []);

    // Clear error function
    const clearError = useCallback(() => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }, []);

    // Get session time remaining
    const getSessionTimeRemaining = useCallback(() => {
        if (!state.sessionExpiresAt) return null;

        const expiresAt = new Date(state.sessionExpiresAt * 1000);
        const now = new Date();
        const timeRemaining = expiresAt.getTime() - now.getTime();

        return Math.max(0, timeRemaining);
    }, [state.sessionExpiresAt]);

    // Check if session is about to expire (within 15 minutes)
    const isSessionExpiringSoon = useCallback(() => {
        const timeRemaining = getSessionTimeRemaining();
        return timeRemaining !== null && timeRemaining < (15 * 60 * 1000);
    }, [getSessionTimeRemaining]);

    // Get user permissions
    const hasPermission = useCallback((permission) => {
        if (!state.currentUser) return false;

        const permissions = {
            admin: state.currentUser.isAdmin,
            supervisor: state.currentUser.role === 'supervisor' || state.currentUser.isAdmin,
            manager: state.currentUser.role === 'manager' || state.currentUser.isAdmin,
            'breakdown-access': true, // All authenticated users have breakdown access
            'dashboard-access': true, // All authenticated users have dashboard access
            'admin-panel': state.currentUser.isAdmin,
            'user-management': state.currentUser.isAdmin
        };

        return permissions[permission] || false;
    }, [state.currentUser]);

    // Context value
    const contextValue = {
        // State
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        isSessionChecking: state.isSessionChecking,
        isRefreshLoading: state.isRefreshLoading,
        error: state.error,
        lastLoginTime: state.lastLoginTime,
        sessionExpiresAt: state.sessionExpiresAt,
        authMethod: state.authMethod,

        // Actions
        login,
        logout,
        refreshSession,
        checkSession,
        clearError,

        // Additional logout methods
        emergencyLogout: emergencyLogoutHandler,
        silentLogout: silentLogoutHandler,
        autoLogout: autoLogoutHandler,
        secureCleanup: secureCleanupHandler,

        // Utility functions
        getSessionTimeRemaining,
        isSessionExpiringSoon,
        hasPermission,

        // User convenience properties
        user: state.currentUser, // Alias for currentUser
        isLoggedIn: state.isAuthenticated, // Alias for isAuthenticated
        isAdmin: state.currentUser?.isAdmin || false,
        userRole: state.currentUser?.role || null,
        userDepot: state.currentUser?.depot || null,
        userName: state.currentUser?.name || null,
        userEmail: state.currentUser?.email || null
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

// HOC for components that require authentication
export const withAuth = (Component) => {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="auth-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            );
        }

        if (!isAuthenticated) {
            return (
                <div className="auth-required">
                    <h2>Authentication Required</h2>
                    <p>Please log in to access this content.</p>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

// HOC for admin-only components
export const withAdminAuth = (Component) => {
    return function AdminAuthenticatedComponent(props) {
        const { isAuthenticated, isAdmin, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="auth-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            );
        }

        if (!isAuthenticated) {
            return (
                <div className="auth-required">
                    <h2>Authentication Required</h2>
                    <p>Please log in to access this content.</p>
                </div>
            );
        }

        if (!isAdmin) {
            return (
                <div className="admin-required">
                    <h2>Admin Access Required</h2>
                    <p>You need administrator privileges to access this content.</p>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

// Protected Route component
export const ProtectedRoute = ({ children, requireAdmin = false, fallback = null }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return fallback || (
            <div className="auth-loading">
                <div className="loading-spinner"></div>
                <p>Checking authentication...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return fallback || (
            <div className="auth-required">
                <h2>Authentication Required</h2>
                <p>Please log in to access this content.</p>
            </div>
        );
    }

    if (requireAdmin && !isAdmin) {
        return fallback || (
            <div className="admin-required">
                <h2>Admin Access Required</h2>
                <p>Administrator privileges are required to access this content.</p>
            </div>
        );
    }

    return children;
};

export default AuthContext;