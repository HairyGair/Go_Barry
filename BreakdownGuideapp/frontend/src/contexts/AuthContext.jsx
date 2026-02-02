/**
 * Authentication Context
 * Secure authentication with HTTP-only cookies (XSS protected)
 *
 * SECURITY: User data stored ONLY in React state, session restored from backend
 * Tokens are stored in HTTP-only cookies to prevent XSS attacks
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSessionChecking, setIsSessionChecking] = useState(true);

    // Restore session from backend on mount (SECURITY FIX: XSS prevention)
    useEffect(() => {
        const restoreSession = async () => {
            // CRITICAL: Check if we just logged out - skip session restoration
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('logout')) {
                console.log('🚪 Logout detected - skipping session restoration');
                setIsAuthenticated(false);
                setCurrentUser(null);
                setIsSessionChecking(false);
                // Clean up URL without triggering navigation
                window.history.replaceState({}, '', '/');
                return;
            }

            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
                const response = await fetch(`${apiUrl}/api/auth/me`, {
                    method: 'GET',
                    credentials: 'include', // CRITICAL: Send HTTP-only cookie
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const { user } = await response.json();
                    setIsAuthenticated(true);
                    setCurrentUser(user);
                    console.log('✅ Session restored from backend');
                } else {
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                    console.log('ℹ️ No active session found');
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                setIsAuthenticated(false);
                setCurrentUser(null);
            } finally {
                setIsSessionChecking(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email, password, rememberMe = true) => {
        try {
            console.log('🔐 Login attempt:', email, 'Remember:', rememberMe);

            // Validate required fields
            if (!email || !password) {
                return {
                    success: false,
                    error: 'Email and password are required'
                };
            }

            // SECURITY FIX: Get CSRF token before login
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
            let csrfToken = null;

            try {
                const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
                    method: 'GET',
                    credentials: 'include', // Include cookies to get CSRF token
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (csrfResponse.ok) {
                    const csrfData = await csrfResponse.json();
                    csrfToken = csrfData.csrfToken;
                    console.log('✅ CSRF token obtained');
                } else {
                    console.warn('⚠️ Failed to obtain CSRF token, attempting login anyway');
                }
            } catch (csrfError) {
                console.warn('⚠️ Error fetching CSRF token:', csrfError);
                // Continue with login attempt - server may not require CSRF yet
            }

            // Call backend API for authentication
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                credentials: 'include', // CRITICAL: Required to send and receive HTTP-only cookies
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken || '' // Include CSRF token if available
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                console.error('❌ Login failed:', data.message || data.error);
                return {
                    success: false,
                    error: data.message || data.error || 'Login failed'
                };
            }

            // Extract user data from backend response format
            // Backend returns: {success, user, session: {expires_at, expires_in}}
            // NOTE: Token is NO LONGER in response - it's stored in HTTP-only cookie (XSS protection)
            const { user: supervisor } = data;

            if (!supervisor) {
                console.error('❌ Invalid login response - missing user data');
                console.error('Response data:', data);
                return {
                    success: false,
                    error: 'Invalid server response'
                };
            }

            // Create user object from supervisor data (WITHOUT token - it's in HTTP-only cookie)
            const user = {
                id: supervisor.user_id || supervisor.supervisorId || supervisor.id,
                email: supervisor.email,
                name: supervisor.name || supervisor.full_name,
                role: supervisor.role || 'supervisor',
                depot: supervisor.depot,
                badge_number: supervisor.badge_number,
                loginTime: Date.now()
                // NOTE: No token stored here - it's in HTTP-only cookie for XSS protection
            };

            // SECURITY FIX: Store user data ONLY in React state
            // Do NOT store in localStorage or sessionStorage (XSS vulnerability prevention)
            // Token is automatically managed by browser via HTTP-only cookie
            setIsAuthenticated(true);
            setCurrentUser(user);

            console.log('✅ Login successful:', user.email);

            // Log login event to analytics
            try {
                await fetch(`${apiUrl}/api/analytics/log-login`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: user.email,
                        success: true
                    })
                });
            } catch (logError) {
                console.warn('⚠️ Failed to log login event:', logError);
                // Don't fail the login if analytics logging fails
            }

            return {
                success: true,
                user: user
            };
        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                error: error.message || 'Login failed. Please check your connection.'
            };
        }
    };

    const logout = async () => {
        console.log('🚪 Logging out...');

        // Get email before clearing storage
        const userEmail = currentUser?.email;

        try {
            // Call backend logout endpoint to clear HTTP-only cookie
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

            // SECURITY FIX: Get CSRF token before logout (required for POST requests)
            let csrfToken = null;
            try {
                const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (csrfResponse.ok) {
                    const csrfData = await csrfResponse.json();
                    csrfToken = csrfData.csrfToken;
                }
            } catch (csrfError) {
                console.warn('⚠️ Failed to get CSRF token for logout:', csrfError);
            }

            await fetch(`${apiUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include', // Important: Send cookie with request
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken || '' // Include CSRF token
                }
            });
            console.log('✅ Backend logout successful (HTTP-only cookie cleared)');
        } catch (error) {
            console.error('⚠️ Error calling logout endpoint:', error);
            // Continue with local logout even if backend call fails
        }

        // Log logout event to analytics (if we have email)
        if (userEmail) {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
                await fetch(`${apiUrl}/api/analytics/log-logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: userEmail
                    })
                });
            } catch (logError) {
                console.warn('⚠️ Failed to log logout event:', logError);
                // Don't fail the logout if analytics logging fails
            }
        }

        // Clear session storage (SECURITY FIX: No localStorage/sessionStorage for user data)
        // Duty-related data can remain in sessionStorage as it's not sensitive
        sessionStorage.removeItem('currentDuty');
        sessionStorage.removeItem('showDutyModal');

        // Clear React state
        setIsAuthenticated(false);
        setCurrentUser(null);

        console.log('✅ Logout complete');
    };

    const value = {
        isAuthenticated,
        currentUser,
        isSessionChecking,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
