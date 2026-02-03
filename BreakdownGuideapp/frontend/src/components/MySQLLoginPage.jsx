/**
 * MySQL Login Page - Completely Rebuilt
 * Clean, simple, centered design with glassmorphism effect
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import GairWareLogo from './GairWareLogo.jsx';
import { GoBarryLogo } from './GoBarryLogo.jsx';
import './MySQLLoginPage.css';

const MySQLLoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, isSessionChecking } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [emailWasPrefilled, setEmailWasPrefilled] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState('general'); // 'auth', 'connection', 'general'
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [capsLockOn, setCapsLockOn] = useState(false);

    // Refs
    const emailRef = useRef(null);
    const errorTimerRef = useRef(null);

    // Update date/time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format date and time
    const formatDateTime = () => {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return currentDateTime.toLocaleDateString('en-GB', options);
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (!isSessionChecking && isAuthenticated) {
            // Set flag to show duty modal on homepage
            sessionStorage.setItem('showDutyModal', 'true');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isSessionChecking, navigate]);

    // Force light theme for login page
    useEffect(() => {
        // Save current theme
        const currentTheme = document.documentElement.getAttribute('data-theme');

        // Set to light theme for login page
        document.documentElement.setAttribute('data-theme', 'light');

        // Cleanup: restore theme when component unmounts
        return () => {
            if (currentTheme) {
                document.documentElement.setAttribute('data-theme', currentTheme);
            }
        };
    }, []);

    // Load saved email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('lastLoginEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setEmailWasPrefilled(true);
        }
    }, []);

    // Focus email on mount
    useEffect(() => {
        if (!isSessionChecking && emailRef.current) {
            emailRef.current.focus();
        }
    }, [isSessionChecking]);

    // Auto-dismiss error after 5 seconds
    useEffect(() => {
        if (error) {
            // Clear any existing timer
            if (errorTimerRef.current) {
                clearTimeout(errorTimerRef.current);
            }

            // Set new timer
            errorTimerRef.current = setTimeout(() => {
                setError('');
                setErrorType('general');
            }, 5000);
        }

        // Cleanup
        return () => {
            if (errorTimerRef.current) {
                clearTimeout(errorTimerRef.current);
            }
        };
    }, [error]);

    // Detect error type from error message
    const detectErrorType = (errorMessage) => {
        const lowercaseError = errorMessage.toLowerCase();

        // Authentication errors (red)
        if (lowercaseError.includes('password') ||
            lowercaseError.includes('credentials') ||
            lowercaseError.includes('invalid email') ||
            lowercaseError.includes('unauthorized') ||
            lowercaseError.includes('authentication failed')) {
            return 'auth';
        }

        // Connection errors (orange)
        if (lowercaseError.includes('network') ||
            lowercaseError.includes('connection') ||
            lowercaseError.includes('timeout') ||
            lowercaseError.includes('fetch') ||
            lowercaseError.includes('server') ||
            lowercaseError.includes('unavailable')) {
            return 'connection';
        }

        // General errors (red)
        return 'general';
    };

    // Handle clearing saved email
    const handleClearEmail = () => {
        setEmail('');
        setEmailWasPrefilled(false);
        localStorage.removeItem('lastLoginEmail');
        if (emailRef.current) {
            emailRef.current.focus();
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear errors
        setError('');
        setErrorType('general');

        // Validation
        if (!email || !password) {
            const errorMsg = 'Please enter both email and password';
            setError(errorMsg);
            setErrorType(detectErrorType(errorMsg));
            return;
        }

        if (!email.includes('@')) {
            const errorMsg = 'Please enter a valid email address';
            setError(errorMsg);
            setErrorType(detectErrorType(errorMsg));
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(email, password, rememberMe);

            if (result.success) {
                // Save email for next login
                localStorage.setItem('lastLoginEmail', email);

                // Set flag to show duty modal on homepage
                sessionStorage.setItem('showDutyModal', 'true');

                // Redirect to homepage where duty selection will appear
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 300);
            } else {
                const errorMsg = result.error || 'Login failed. Please check your credentials.';
                setError(errorMsg);
                setErrorType(detectErrorType(errorMsg));
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.message || 'An unexpected error occurred. Please try again.';
            setError(errorMsg);
            setErrorType(detectErrorType(errorMsg));
            setIsLoading(false);
        }
    };

    // Show loading screen while checking session
    if (isSessionChecking) {
        return (
            <div className="login-page">
                <div className="login-background"></div>
                <div className="login-container">
                    <div className="login-card">
                        <div className="loading-spinner"></div>
                        <p>Checking session...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            {/* Background */}
            <div className="login-background"></div>

            {/* Centered Login Container */}
            <div className="login-container">
                <div className="login-card">
                    {/* Date/Time Display */}
                    <div className="datetime-display">
                        {formatDateTime()}
                    </div>

                    {/* Logo */}
                    <div className="logo-section">
                        <GoBarryLogo size="lg" variant="full" theme="dark" />
                    </div>

                    {/* Title */}
                    <div className="title-section">
                        <p className="subtitle-primary">SECURE SUPERVISOR ACCESS PORTAL</p>
                        <p className="subtitle-secondary">Real-time Fleet Management & Assessment Tools</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Email Input */}
                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address
                                {emailWasPrefilled && (
                                    <span className="prefilled-badge">Saved</span>
                                )}
                            </label>
                            <div className="input-wrapper">
                                <input
                                    ref={emailRef}
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                        setErrorType('general');
                                        if (emailWasPrefilled) {
                                            setEmailWasPrefilled(false);
                                        }
                                    }}
                                    placeholder="supervisor@example.com"
                                    disabled={isLoading}
                                    autoComplete="email"
                                    required
                                />
                                {emailWasPrefilled && email && (
                                    <button
                                        type="button"
                                        className="clear-email-btn"
                                        onClick={handleClearEmail}
                                        disabled={isLoading}
                                        title="Clear saved email"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                        setErrorType('general');
                                    }}
                                    onKeyDown={(e) => {
                                        // Detect Caps Lock on keydown
                                        if (e.getModifierState && e.getModifierState('CapsLock')) {
                                            setCapsLockOn(true);
                                        } else {
                                            setCapsLockOn(false);
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        // Double-check on keyup
                                        if (e.getModifierState && e.getModifierState('CapsLock')) {
                                            setCapsLockOn(true);
                                        } else {
                                            setCapsLockOn(false);
                                        }
                                    }}
                                    placeholder="Enter your password"
                                    disabled={isLoading}
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
                            {/* Caps Lock Warning */}
                            {capsLockOn && (
                                <div className="caps-lock-warning">
                                    <span className="warning-icon">⚠️</span>
                                    <span>Caps Lock is on</span>
                                </div>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span>Remember me for 24 hours</span>
                            </label>
                        </div>

                        {/* Error Message with Color Coding */}
                        {error && (
                            <div className={`error-message error-${errorType}`}>
                                <span className="error-icon">⚠️</span>
                                <span>{error}</span>
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
                                    <span className="spinner"></span>
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

                    {/* Security Badges */}
                    <div className="security-badges">
                        <div className="badge fade-in-badge" style={{ animationDelay: '0.2s' }}>
                            <span className="badge-icon">🔒</span>
                            <span className="badge-text">JWT Authentication</span>
                        </div>
                        <div className="badge fade-in-badge" style={{ animationDelay: '0.4s' }}>
                            <span className="badge-icon">🛡️</span>
                            <span className="badge-text">Secure Connection</span>
                        </div>
                        <div className="badge badge-online fade-in-badge" style={{ animationDelay: '0.6s' }}>
                            <span className="badge-icon pulse-icon">✅</span>
                            <span className="badge-text">System Online</span>
                        </div>
                    </div>

                    {/* GairWare Attribution */}
                    <div className="gairware-attribution fade-in-badge" style={{ animationDelay: '0.8s' }}>
                        <div className="attribution-content">
                            <GairWareLogo height={24} variant="icon" />
                            <div className="attribution-text">
                                <span className="powered-by">Powered by</span>
                                <span className="gairware-brand">
                                    <strong>Gair</strong>Ware
                                </span>
                            </div>
                        </div>
                        <div className="copyright-text">
                            © {new Date().getFullYear()} GairWare. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySQLLoginPage;
