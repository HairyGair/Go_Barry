/**
 * Authentication Context
 * Simple authentication with sessionStorage/localStorage
 * Password required: "GoNorthEast2025!"
 * Accepts any valid email with correct password
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

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = () => {
            try {
                // Check localStorage first (remember me)
                let userData = localStorage.getItem('currentUser');
                let loginTime = localStorage.getItem('loginTime');

                // Then check sessionStorage (current session)
                if (!userData) {
                    userData = sessionStorage.getItem('currentUser');
                    loginTime = sessionStorage.getItem('loginTime');
                }

                if (userData && loginTime) {
                    const user = JSON.parse(userData);
                    const time = parseInt(loginTime);
                    const now = Date.now();
                    const hoursPassed = (now - time) / (1000 * 60 * 60);

                    // Session expires after 24 hours for localStorage, never for sessionStorage
                    if (userData === localStorage.getItem('currentUser') && hoursPassed > 24) {
                        // Expired localStorage session
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('loginTime');
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                    } else {
                        // Valid session
                        setIsAuthenticated(true);
                        setCurrentUser(user);
                        console.log('✅ Existing session found:', user.email);
                    }
                } else {
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setIsAuthenticated(false);
                setCurrentUser(null);
            } finally {
                setIsSessionChecking(false);
            }
        };

        checkSession();
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

            // Call backend API for authentication
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
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

            // Extract user and token from backend response format
            // Backend returns: {success, user, session: {access_token}}
            const { user: supervisor, session } = data;
            const token = session?.access_token;

            if (!token || !supervisor) {
                console.error('❌ Invalid login response - missing token or user data');
                console.error('Response data:', data);
                return {
                    success: false,
                    error: 'Invalid server response'
                };
            }

            // Create user object from supervisor data
            const user = {
                id: supervisor.user_id || supervisor.supervisorId || supervisor.id,
                email: supervisor.email,
                name: supervisor.name || supervisor.full_name,
                role: supervisor.role || 'supervisor',
                depot: supervisor.depot,
                badge_number: supervisor.badge_number,
                loginTime: Date.now(),
                token: token  // Store JWT token
            };

            // Store in appropriate storage
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('currentUser', JSON.stringify(user));
            storage.setItem('loginTime', user.loginTime.toString());
            storage.setItem('authToken', token);  // Store token separately for easy access

            setIsAuthenticated(true);
            setCurrentUser(user);

            console.log('✅ Login successful:', user.email);

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

    const logout = () => {
        console.log('🚪 Logging out...');

        // Clear all storage including auth token
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentDuty');
        sessionStorage.removeItem('showDutyModal');

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
