/**
 * SECURE Authentication Context
 * XSS-Protected Version - No localStorage/sessionStorage
 * All sensitive data stored in memory only
 * HTTP-only cookies handle persistence
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

    // Restore session from backend (NOT from localStorage)
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

                // Call backend to get current user from HTTP-only cookie
                const response = await fetch(`${apiUrl}/api/auth/me`, {
                    method: 'GET',
                    credentials: 'include', // Send HTTP-only cookie
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        setIsAuthenticated(true);
                        setCurrentUser(data.user);
                        console.log('✅ Session restored from secure backend');
                    } else {
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                    }
                } else {
                    // Not authenticated or session expired
                    setIsAuthenticated(false);
                    setCurrentUser(null);
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
            console.log('🔐 Login attempt:', email);

            // Validate required fields
            if (!email || !password) {
                return {
                    success: false,
                    error: 'Email and password are required'
                };
            }

            // Call backend API for authentication
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                credentials: 'include', // CRITICAL: Required for HTTP-only cookies
                headers: {
                    'Content-Type': 'application/json'
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

            // Extract user data from backend response
            const { user: supervisor } = data;

            if (!supervisor) {
                console.error('❌ Invalid login response - missing user data');
                return {
                    success: false,
                    error: 'Invalid server response'
                };
            }

            // Create user object (NO SENSITIVE DATA STORAGE)
            const user = {
                id: supervisor.user_id || supervisor.supervisorId || supervisor.id,
                email: supervisor.email,
                name: supervisor.name || supervisor.full_name,
                role: supervisor.role || 'supervisor',
                depot: supervisor.depot,
                badge_number: supervisor.badge_number,
                loginTime: Date.now()
            };

            // SECURITY: Store ONLY in React state (memory)
            // NO localStorage, NO sessionStorage
            setIsAuthenticated(true);
            setCurrentUser(user);

            console.log('✅ Login successful (secure mode):', user.email);

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

        const userEmail = currentUser?.email;

        try {
            // Call backend logout endpoint to clear HTTP-only cookie
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
            await fetch(`${apiUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Backend logout successful');
        } catch (error) {
            console.error('⚠️ Error calling logout endpoint:', error);
        }

        // Log logout event
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
            }
        }

        // SECURITY: Clear ONLY from memory (no storage to clear)
        setIsAuthenticated(false);
        setCurrentUser(null);

        // Clear any session-related data
        sessionStorage.removeItem('currentDuty');
        sessionStorage.removeItem('showDutyModal');

        console.log('✅ Logout complete (secure mode)');
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