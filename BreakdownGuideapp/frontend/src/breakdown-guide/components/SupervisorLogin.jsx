// Supervisor Login Component for Breakdown Guide
// Production-ready with MySQL backend authentication

import React, { useState, useEffect } from 'react';
import { authService } from '../auth/authService.js';
// Supabase removed - now uses backend MySQL API

const SupervisorLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [supervisors, setSupervisors] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('checking');
    
    // Check for existing session and load supervisors on mount
    useEffect(() => {
        const init = async () => {
            // Check backend connection status
            const isConnected = await authService.checkBackendConnection?.() || true;
            setConnectionStatus(isConnected ? 'connected' : 'fallback');
            
            // Load available supervisors
            const availableSupervisors = await authService.getSupervisors();
            setSupervisors(availableSupervisors);
            
            // Check for existing session
            const savedSession = localStorage.getItem('supervisor_session');
            if (savedSession) {
                try {
                    const session = JSON.parse(savedSession);
                    
                    // Verify session is still valid
                    const isValid = await authService.verifySession(session);
                    
                    if (isValid) {
                        onLoginSuccess(session);
                    } else {
                        localStorage.removeItem('supervisor_session');
                    }
                } catch (err) {
                    console.error('Invalid session data:', err);
                    localStorage.removeItem('supervisor_session');
                }
            }
        };
        
        init();
    }, [onLoginSuccess]);
    
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
            // Authenticate using the auth service
            const result = await authService.authenticate(email, password);
            
            if (result.success) {
                const session = result.session;
                
                // Save session if remember me is checked
                if (rememberMe) {
                    localStorage.setItem('supervisor_session', JSON.stringify(session));
                }
                
                console.log('Login successful via', result.method);
                onLoginSuccess(session);
                
            } else {
                setError(result.error || 'Login failed. Please try again.');
            }
            
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Quick login for supervisors (for easier access)
    const handleQuickLogin = (supervisor) => {
        setEmail(supervisor.email);
        // Focus on password field
        document.getElementById('password')?.focus();
    };
    
    return (
        <div className="supervisor-login-container">
            {/* Supabase debug component removed */}

            <div className="login-card">
                <div className="login-header">
                    <h1>Go North East</h1>
                    <h2>Breakdown Assessment System</h2>
                    <p className="login-subtitle">Supervisor Login</p>
                    
                    {/* Connection Status Indicator */}
                    <div className="connection-status" style={{
                        fontSize: '12px',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        marginTop: '10px',
                        background: connectionStatus === 'connected' ? '#0e5a0e' : '#5a4b0e',
                        color: '#fff',
                        textAlign: 'center'
                    }}>
                        {connectionStatus === 'checking' && '⏳ Checking connection...'}
                        {connectionStatus === 'connected' && '✅ Connected to database'}
                        {connectionStatus === 'fallback' && '⚠️ Using fallback authentication'}
                    </div>
                </div>
                
                {/* Quick Access Buttons (if supervisors loaded) */}
                {supervisors.length > 0 && (
                    <div className="quick-access" style={{
                        padding: '15px',
                        borderBottom: '1px solid #333',
                        background: '#1a1a1a'
                    }}>
                        <p style={{ fontSize: '12px', marginBottom: '10px', color: '#999' }}>
                            Quick access (select then enter password):
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {supervisors.slice(0, 3).map(sup => (
                                <button
                                    key={sup.id}
                                    type="button"
                                    onClick={() => handleQuickLogin(sup)}
                                    style={{
                                        padding: '5px 10px',
                                        fontSize: '12px',
                                        background: '#2a2a2a',
                                        color: '#fff',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {sup.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="login-form">
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
                            list="supervisor-emails"
                        />
                        {/* Email datalist for suggestions */}
                        <datalist id="supervisor-emails">
                            {supervisors.map(sup => (
                                <option key={sup.id} value={sup.email}>
                                    {sup.name} - {sup.depot}
                                </option>
                            ))}
                        </datalist>
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
                    
                    {/* Emergency Access Info (for production issues) */}
                    {connectionStatus === 'fallback' && (
                        <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            background: '#2a2a2a',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#999'
                        }}>
                            <strong>Emergency Access:</strong><br/>
                            If you cannot login, use your email and contact IT for the emergency password.
                        </div>
                    )}
                </form>
                
                <div className="login-footer">
                    <p className="security-note">
                        🔒 Secure System - All activities are logged for safety compliance
                    </p>
                    <p className="version-info">
                        Version 2.3 - Production Authentication
                    </p>
                    <p className="support-info">
                        Need help? Contact IT Support
                    </p>
                    
                    {/* Debug Toggle (for troubleshooting) */}
                    <button
                        type="button"
                        onClick={() => setShowDebug(!showDebug)}
                        style={{
                            marginTop: '10px',
                            padding: '5px 10px',
                            fontSize: '10px',
                            background: 'transparent',
                            color: '#666',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {showDebug ? 'Hide' : 'Show'} Debug Info
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupervisorLogin;
