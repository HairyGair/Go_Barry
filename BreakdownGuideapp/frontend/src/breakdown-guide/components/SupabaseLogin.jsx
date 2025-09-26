// Supabase-First Authentication Component
// Implements the specific login flow requested with proper session management

import React, { useState, useEffect, useCallback } from 'react';
import enhancedAuthService from '../../services/enhanced-auth-service.js';

const SupabaseLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [authStatus, setAuthStatus] = useState('');
    const [showHints, setShowHints] = useState(false);
    const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

    // Step 1: Check for existing session on mount
    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = useCallback(async () => {
        console.log('🔍 Checking for existing session...');
        setAuthLoading(true);

        try {
            const { success, session } = await enhancedAuthService.getCurrentSession();

            if (success && session) {
                console.log('✅ Found existing session for:', session.name);
                // Step 4: Successful session found → redirect to dashboard
                onLoginSuccess(session);
                return;
            }

            console.log('ℹ️ No existing session found');
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            setAuthLoading(false);
            setSessionCheckComplete(true);
            updateAuthStatus();
        }
    }, [onLoginSuccess]);

    const updateAuthStatus = useCallback(() => {
        setAuthStatus(enhancedAuthService.getAuthStatusMessage());
    }, []);

    // Step 3: Handle login form submission
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        if (!password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 3: Email/password authentication via Supabase
            const result = await enhancedAuthService.authenticate(email, password, rememberMe);

            if (result.success) {
                console.log('✅ Login successful:', result.session?.name);

                // Step 4: Successful login → store session, redirect to dashboard
                onLoginSuccess(result.session);
            } else {
                // Step 5: Failed login → show error message, remain on login page
                setError(result.error || 'Invalid email or password. Please try again.');

                // Show helpful hints after failed attempt
                if (!showHints) {
                    setTimeout(() => setShowHints(true), 2000);
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Development quick login helper
    const handleQuickLogin = useCallback((testEmail, testPassword) => {
        setEmail(testEmail);
        setPassword(testPassword);
        setTimeout(() => {
            document.getElementById('supabase-login-form')?.requestSubmit();
        }, 100);
    }, []);

    // Setup user accounts helper (for development)
    const setupUserAccounts = async () => {
        console.log('🔧 Setting up Supabase user accounts...');
        const results = await enhancedAuthService.setupAuthorizedUsers();
        console.log('Setup results:', results);
        alert('User accounts setup attempted. Check console for results.');
    };

    const isDevelopment = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

    // Show loading while checking for existing session
    if (authLoading && !sessionCheckComplete) {
        return (
            <div className="supervisor-login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Go North East</h1>
                        <h2>Breakdown Assessment System</h2>
                        <p className="login-subtitle">Checking session...</p>
                    </div>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Verifying authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="supervisor-login-container">
            <div className="auth-status-badge" style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '8px 16px',
                background: enhancedAuthService.isAuthenticated() ? '#28a745' : '#dc3545',
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 1000
            }}>
                {authStatus}
            </div>

            <div className="login-card">
                <div className="login-header">
                    <h1>Go North East</h1>
                    <h2>Breakdown Assessment System</h2>
                    <p className="login-subtitle">Secure Supervisor Login</p>
                </div>

                <form id="supabase-login-form" onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control"
                            placeholder="Enter your Go North East email"
                            required
                            autoComplete="email"
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                            />
                            <span>Remember me for 24 hours</span>
                        </label>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-login"
                        disabled={loading || !email || !password}
                    >
                        {loading ? 'Signing in...' : 'Sign In with Supabase'}
                    </button>
                </form>

                {/* Login hints for production */}
                {showHints && (
                    <div className="login-hints" style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                            🔑 Authorized Supervisors Only
                        </p>
                        <p style={{ margin: 0, color: '#666' }}>
                            Contact your system administrator if you need access credentials.
                            Only pre-authorized Go North East supervisors can access this system.
                        </p>
                    </div>
                )}

                {/* Development tools */}
                {isDevelopment && (
                    <div className="dev-tools" style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f0f0f0',
                        borderRadius: '8px'
                    }}>
                        <p style={{ fontSize: '12px', marginBottom: '10px', color: '#666' }}>
                            🔧 Development Tools:
                        </p>

                        <div style={{ marginBottom: '10px' }}>
                            <button
                                type="button"
                                onClick={setupUserAccounts}
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    background: '#ffc107',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                Setup User Accounts
                            </button>
                        </div>

                        <p style={{ fontSize: '12px', marginBottom: '10px', color: '#666' }}>
                            Quick Login (Development):
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('anthony.gair@example.com', 'TempPassword2025!')}
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Anthony (Admin)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('supervisor@example.com', 'TempPassword2025!')}
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    background: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Test Supervisor
                            </button>
                        </div>
                    </div>
                )}

                <div className="login-footer">
                    <p className="security-note">
                        🔒 Supabase Secure Authentication - All sessions are managed securely
                    </p>
                    <p className="version-info">
                        Version 3.0 - Full Supabase Integration
                    </p>
                    <p className="support-info">
                        Need help? Contact IT Support
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupabaseLogin;