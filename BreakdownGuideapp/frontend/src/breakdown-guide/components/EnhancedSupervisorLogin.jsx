// Enhanced Supervisor Login Component with Fallback Authentication
// This component provides robust authentication with both Supabase and local fallback

import React, { useState, useEffect } from 'react';
import authService from '../../services/auth-service.js';

const EnhancedSupervisorLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [authStatus, setAuthStatus] = useState('');
    const [showHints, setShowHints] = useState(false);
    
    // Check for existing session and auth status on mount
    useEffect(() => {
        checkExistingSession();
        updateAuthStatus();
    }, []);
    
    const checkExistingSession = async () => {
        const { success, session } = await authService.getCurrentSession();
        if (success && session) {
            console.log('✅ Found existing session for:', session.name);
            onLoginSuccess(session);
        }
    };
    
    const updateAuthStatus = async () => {
        await authService.checkSupabaseAvailability();
        setAuthStatus(authService.getAuthStatusMessage());
    };
    
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
            const result = await authService.authenticate(email, password);
            
            if (result.success) {
                console.log('✅ Login successful:', result.session.name);
                
                // Save session if remember me is checked
                if (rememberMe) {
                    authService.saveSession(result.session);
                }
                
                onLoginSuccess(result.session);
            } else {
                setError(result.error || 'Invalid email or password. Please try again.');
                
                // Show hints after failed attempt
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
    
    // Quick login for testing (only in development)
    const handleQuickLogin = (email, password) => {
        setEmail(email);
        setPassword(password);
        // Auto-submit after setting values
        setTimeout(() => {
            document.getElementById('login-form').requestSubmit();
        }, 100);
    };
    
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    return (
        <div className="supervisor-login-container">
            <div className="auth-status-badge" style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '8px 16px',
                background: authService.supabaseAvailable ? '#28a745' : '#ffc107',
                color: authService.supabaseAvailable ? 'white' : 'black',
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
                    <p className="login-subtitle">Supervisor Login</p>
                </div>
                
                <form id="login-form" onSubmit={handleLogin} className="login-form">
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
                        />
                    </div>
                    
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
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
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                
                {/* Login hints for production */}
                {showHints && !authService.supabaseAvailable && (
                    <div className="login-hints" style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                            🔑 Authorized Access Only
                        </p>
                        <p style={{ margin: 0, color: '#666' }}>
                            Please contact your system administrator if you need access credentials.
                        </p>
                    </div>
                )}
                
                {/* Quick login buttons for development/testing */}
                {isDevelopment && (
                    <div className="dev-quick-login" style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f0f0f0',
                        borderRadius: '8px'
                    }}>
                        <p style={{ fontSize: '12px', marginBottom: '10px', color: '#666' }}>
                            🔧 Development Quick Login:
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('anthony.gair@gonortheast.co.uk', 'GoNorthEast2025!')}
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
                                onClick={() => handleQuickLogin('supervisor@gonortheast.co.uk', 'Supervisor2025!')}
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
                        🔒 Secure System - All activities are logged for safety compliance
                    </p>
                    <p className="version-info">
                        Version 2.3 - Enhanced Authentication
                    </p>
                    <p className="support-info">
                        Need help? Contact IT Support
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnhancedSupervisorLogin;
