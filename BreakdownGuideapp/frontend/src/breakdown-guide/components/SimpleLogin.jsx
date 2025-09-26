// Simple Login Component - bypasses Supabase Auth for backend API
import React, { useState, useEffect } from 'react';
import { apiConfig } from '../components/common/constants.js';

const SimpleLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                    console.log('✅ Found valid session, auto-logging in:', session);
                    onLoginSuccess(session);
                    return;
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

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🔐 Attempting login with email:', email);
            const response = await fetch(`${apiConfig.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            console.log('🔐 Login response:', result);

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Login failed');
            }

            // Create session data compatible with breakdown logger
            const session = {
                id: result.user.user_id,
                supervisorId: result.user.supervisorId,
                name: result.user.name,
                email: result.user.email,
                depot: result.user.depot,
                role: result.user.role,
                isAdmin: result.user.role === 'admin',
                timestamp: new Date().toISOString(),
                authenticated: true
            };

            // Save session
            localStorage.setItem('supervisor_session', JSON.stringify(session));

            console.log('✅ Login successful, calling onLoginSuccess with session:', session);
            onLoginSuccess(session);

        } catch (err) {
            console.error('❌ Login error:', err);
            setError(err.message || 'Login failed. Please check your email and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="supervisor-login-container">
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

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-login"
                        disabled={loading || !email}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="security-note">
                        🔒 Secure System - All activities are logged for safety compliance
                    </p>
                    <p className="version-info">
                        Version 2.3 - Simplified Authentication
                    </p>
                    <p className="help-info">
                        Valid emails: anthony.gair@gonortheast.co.uk
                    </p>
                    <p className="support-info">
                        Need help? Contact IT Support
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SimpleLogin;