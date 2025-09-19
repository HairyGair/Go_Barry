// Supervisor Login Component for Breakdown Guide
// Integrates with Supabase authentication system

import React, { useState, useEffect } from 'react';
import { authHelpers, supabaseHelpers } from '../../services/supabase-client.js';
import SupabaseDebug from './SupabaseDebug.jsx';

const SupervisorLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    // Check for existing session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem('supervisor_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                // Verify session is still valid (within 24 hours)
                const sessionTime = new Date(session.timestamp);
                const now = new Date();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    onLoginSuccess(session);
                } else {
                    localStorage.removeItem('supervisor_session');
                }
            } catch (err) {
                console.error('Invalid session data:', err);
                localStorage.removeItem('supervisor_session');
            }
        }
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
            // Authenticate with email and password
            const authResult = await authHelpers.signInWithPassword(email, password);
            
            if (!authResult.supervisor) {
                throw new Error('Supervisor profile not found');
            }
            
            // Create session data
            const session = {
                id: authResult.supervisor.id,
                supervisorId: authResult.supervisor.id, // Keep for backward compatibility
                name: authResult.supervisor.name,
                email: authResult.supervisor.email,
                depot: authResult.supervisor.depot,
                role: authResult.supervisor.role,
                isAdmin: authResult.supervisor.role === 'admin',
                timestamp: new Date().toISOString(),
                authenticated: true,
                supabaseSession: authResult.session
            };
            
            // Save session if remember me is checked
            if (rememberMe) {
                localStorage.setItem('supervisor_session', JSON.stringify(session));
            }
            
            console.log('Login successful, calling onLoginSuccess with session:', session);
            onLoginSuccess(session);
            
        } catch (err) {
            console.error('Login error:', err);
            
            // Handle specific error types
            if (err.message === 'Invalid login credentials') {
                setError('Invalid email or password. Please try again.');
            } else if (err.message === 'Supervisor profile not found') {
                setError('Your account is not set up as a supervisor. Please contact your manager.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="supervisor-login-container">
            <SupabaseDebug />
            <div className="login-card">
                <div className="login-header">
                    <h1>Go North East</h1>
                    <h2>Breakdown Assessment System</h2>
                    <p className="login-subtitle">Supervisor Login</p>
                </div>
                
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
                
                <div className="login-footer">
                    <p className="security-note">
                        🔒 Secure System - All activities are logged for safety compliance
                    </p>
                    <p className="version-info">
                        Version 2.2 - Email Authentication
                    </p>
                    <p className="support-info">
                        Need help? Contact IT Support
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupervisorLogin;
