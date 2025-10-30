/**
 * MySQL-Native Login Page
 *
 * Clean, purpose-built login screen for MySQL backend authentication.
 * No Supabase dependencies - connects directly to cPanel MySQL backend API.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import './MySQLLoginPage.css';

const MySQLLoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, isSessionChecking, error: authError, clearError } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginStep, setLoginStep] = useState(''); // For showing what's happening

    // Refs
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isSessionChecking && isAuthenticated) {
            console.log('Already authenticated, redirecting...');
            navigate('/breakdown-guide', { replace: true });
        }
    }, [isAuthenticated, isSessionChecking, navigate]);

    // Focus email on mount
    useEffect(() => {
        if (!isSessionChecking && emailRef.current) {
            emailRef.current.focus();
        }
    }, [isSessionChecking]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear any previous errors
        setError('');
        clearError();

        // Validation
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            emailRef.current?.focus();
            return;
        }

        setIsLoading(true);
        setLoginStep('Connecting to server...');

        try {
            console.log('🔐 Attempting login:', email);

            setLoginStep('Verifying credentials...');
            const result = await login(email, password, rememberMe);

            if (result.success) {
                console.log('✅ Login successful, redirecting...');
                setLoginStep('Login successful! Redirecting...');

                // Small delay to show success message
                setTimeout(() => {
                    navigate('/breakdown-guide', { replace: true });
                }, 500);
            } else {
                console.error('❌ Login failed:', result.error);
                setError(result.error || 'Login failed. Please check your credentials.');
                setLoginStep('');
                setIsLoading(false);

                // Focus email for retry
                setTimeout(() => {
                    emailRef.current?.select();
                }, 100);
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('An unexpected error occurred. Please try again.');
            setLoginStep('');
            setIsLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            if (e.target === emailRef.current && password) {
                handleSubmit(e);
            } else if (e.target === emailRef.current) {
                passwordRef.current?.focus();
            } else {
                handleSubmit(e);
            }
        }
    };

    // Show loading state while checking session
    if (isSessionChecking) {
        return (
            <div className="mysql-login-page">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <img src="/gne-logo-horizontal-colour.png" alt="Go North East" className="brand-logo" />
                            <h1>Checking Session...</h1>
                        </div>
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Verifying authentication...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mysql-login-page">
            {/* Background */}
            <div className="login-background">
                <div className="bg-gradient"></div>
                <div className="bg-pattern"></div>
            </div>

            {/* Login Container */}
            <div className="login-container">
                {/* Branding Side */}
                <div className="brand-panel">
                    <div className="brand-content">
                        <img
                            src="/GO_NORTHEAST_WHITE_RGB.png"
                            alt="Go North East"
                            className="brand-logo-large"
                        />
                        <h1>Breakdown Management System</h1>
                        <p className="brand-subtitle">
                            Secure supervisor access to breakdown assessment and fleet management tools
                        </p>

                        <div className="feature-list">
                            <div className="feature">
                                <span className="feature-icon">🚨</span>
                                <div>
                                    <h3>Rapid Assessment</h3>
                                    <p>Step-by-step breakdown evaluation wizards</p>
                                </div>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">📊</span>
                                <div>
                                    <h3>Real-Time Tracking</h3>
                                    <p>Live breakdown status and fleet monitoring</p>
                                </div>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✅</span>
                                <div>
                                    <h3>Compliance Ready</h3>
                                    <p>Meets operational safety standards</p>
                                </div>
                            </div>
                        </div>

                        <div className="brand-footer">
                            <p>© 2025 Go North East | Part of Go-Ahead Group</p>
                        </div>
                    </div>
                </div>

                {/* Login Form Side */}
                <div className="form-panel">
                    <div className="login-card">
                        <div className="login-header">
                            <img
                                src="/gne-logo-horizontal-colour.png"
                                alt="Go North East"
                                className="brand-logo"
                            />
                            <h2>Supervisor Login</h2>
                            <p>Enter your credentials to access the system</p>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            {/* Email Input */}
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                            clearError();
                                        }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="your.name@gonortheast.co.uk"
                                        disabled={isLoading}
                                        className={error ? 'error' : ''}
                                        autoComplete="email"
                                        required
                                    />
                                    <span className="input-icon">📧</span>
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <input
                                        ref={passwordRef}
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                            clearError();
                                        }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter your password"
                                        disabled={isLoading}
                                        className={error ? 'error' : ''}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="form-options">
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={isLoading}
                                    />
                                    <span>Remember me for 24 hours</span>
                                </label>
                            </div>

                            {/* Error Message */}
                            {(error || authError) && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    <span>{error || authError}</span>
                                </div>
                            )}

                            {/* Login Step Info */}
                            {loginStep && !error && !authError && (
                                <div className="login-step">
                                    <span className="step-spinner"></span>
                                    <span>{loginStep}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={isLoading || !email || !password}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="button-spinner"></span>
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🔐</span>
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="login-footer">
                            <p className="connection-info">
                                <span className="status-indicator active"></span>
                                Connected to MySQL Backend
                            </p>
                            <p className="help-text">
                                Need help? Contact IT Support
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySQLLoginPage;
