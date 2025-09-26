// SupervisorLogin with AuthContext Integration
// Enhanced login component that uses the AuthContext for state management

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const SupervisorLoginWithContext = ({ className = '', variant = 'standalone', onSuccess }) => {
    // Get auth context
    const {
        login,
        clearError,
        isLoading,
        isSessionChecking,
        error: contextError,
        isAuthenticated,
        currentUser
    } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    // Validation state
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [touched, setTouched] = useState({ email: false, password: false });

    // Progress and feedback
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [showHints, setShowHints] = useState(false);

    // Refs for focus management
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const formRef = useRef(null);

    // Auto-focus email field when component mounts
    useEffect(() => {
        if (!isSessionChecking && emailRef.current) {
            emailRef.current.focus();
        }
    }, [isSessionChecking]);

    // Handle successful authentication
    useEffect(() => {
        if (isAuthenticated && currentUser && onSuccess) {
            onSuccess(currentUser);
        }
    }, [isAuthenticated, currentUser, onSuccess]);

    // Get combined error (context or local)
    const error = contextError || localError;

    // Email validation
    const validateEmail = useCallback((email) => {
        if (!email) {
            return 'Email is required';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }

        return '';
    }, []);

    // Password validation
    const validatePassword = useCallback((password) => {
        if (!password) {
            return 'Password is required';
        }

        if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }

        return '';
    }, []);

    // Handle email change with validation
    const handleEmailChange = useCallback((e) => {
        const value = e.target.value;
        setEmail(value);

        if (touched.email) {
            setEmailError(validateEmail(value));
        }

        // Clear errors when user starts typing
        if (error) {
            clearError();
            setLocalError('');
        }
    }, [touched.email, validateEmail, error, clearError]);

    // Handle password change with validation
    const handlePasswordChange = useCallback((e) => {
        const value = e.target.value;
        setPassword(value);

        if (touched.password) {
            setPasswordError(validatePassword(value));
        }

        // Clear errors when user starts typing
        if (error) {
            clearError();
            setLocalError('');
        }
    }, [touched.password, validatePassword, error, clearError]);

    // Handle field blur for validation
    const handleEmailBlur = useCallback(() => {
        setTouched(prev => ({ ...prev, email: true }));
        setEmailError(validateEmail(email));
    }, [email, validateEmail]);

    const handlePasswordBlur = useCallback(() => {
        setTouched(prev => ({ ...prev, password: true }));
        setPasswordError(validatePassword(password));
    }, [password, validatePassword]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr);
        setPasswordError(passwordErr);
        setTouched({ email: true, password: true });

        if (emailErr || passwordErr) {
            // Focus first field with error
            if (emailErr && emailRef.current) {
                emailRef.current.focus();
            } else if (passwordErr && passwordRef.current) {
                passwordRef.current.focus();
            }
            return;
        }

        // Clear any existing errors
        clearError();
        setLocalError('');
        setLoginAttempts(prev => prev + 1);

        try {
            const result = await login(email, password, rememberMe);

            if (result.success) {
                console.log('✅ Login successful:', result.user?.name);
                // onSuccess will be called via useEffect when auth state updates
            } else {
                // Error is handled by context, but we can show hints
                if (loginAttempts >= 2 && !showHints) {
                    setTimeout(() => setShowHints(true), 1000);
                }

                // Focus email field for retry
                setTimeout(() => {
                    if (emailRef.current) {
                        emailRef.current.select();
                    }
                }, 100);
            }
        } catch (err) {
            console.error('Login error:', err);
            setLocalError('An unexpected error occurred. Please try again.');
        }
    };

    // Handle Enter key submission
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !isLoading) {
            e.preventDefault();

            // If in email field and email is valid, move to password
            if (e.target === emailRef.current && !validateEmail(email)) {
                passwordRef.current?.focus();
                return;
            }

            // Otherwise submit form
            handleSubmit(e);
        }
    }, [email, validateEmail, isLoading, handleSubmit]);

    // Quick login for development
    const handleQuickLogin = useCallback((testEmail, testPassword) => {
        setEmail(testEmail);
        setPassword(testPassword);
        setRememberMe(true);

        // Auto-submit after short delay
        setTimeout(() => {
            if (formRef.current) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                formRef.current.dispatchEvent(submitEvent);
            }
        }, 100);
    }, []);

    // Password visibility toggle
    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);

        // Keep focus on password field
        setTimeout(() => {
            if (passwordRef.current) {
                passwordRef.current.focus();
                const len = passwordRef.current.value.length;
                passwordRef.current.setSelectionRange(len, len);
            }
        }, 0);
    }, []);

    // Check if development environment
    const isDevelopment = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

    // Loading state during session check
    if (isSessionChecking) {
        return (
            <div className={`supervisor-login ${className}`}>
                <div className="login-card">
                    <div className="login-header">
                        <img
                            src="/gne-logo-horizontal-colour.png"
                            alt="Go North East"
                            className="login-logo"
                        />
                        <h2>Breakdown Assessment System</h2>
                        <p className="login-subtitle">Checking authentication...</p>
                    </div>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Verifying session...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If already authenticated, show success state
    if (isAuthenticated && currentUser) {
        return (
            <div className={`supervisor-login ${className}`}>
                <div className="login-card success">
                    <div className="login-header">
                        <img
                            src="/gne-logo-horizontal-colour.png"
                            alt="Go North East"
                            className="login-logo"
                        />
                        <h2>Welcome Back!</h2>
                        <p className="login-subtitle">Successfully authenticated</p>
                    </div>
                    <div className="success-content">
                        <div className="success-icon">✅</div>
                        <h3>Hello, {currentUser.name}</h3>
                        <p>Role: {currentUser.role}</p>
                        <p>Depot: {currentUser.depot}</p>
                        <div className="success-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => onSuccess?.(currentUser)}
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const formIsValid = email && password && !emailError && !passwordError;

    return (
        <div className={`supervisor-login ${className}`}>
            {/* Auth Status Badge */}
            <div className="auth-status-badge">
                <span className="status-indicator" data-connected={isAuthenticated}></span>
                <span className="status-text">
                    {isAuthenticated ? '🟢 Authenticated' : '🔴 Not authenticated'}
                </span>
            </div>

            <div className="login-card">
                <div className="login-header">
                    <img
                        src="/gne-logo-horizontal-colour.png"
                        alt="Go North East"
                        className="login-logo"
                    />
                    <h2>Breakdown Assessment System</h2>
                    <p className="login-subtitle">Secure Supervisor Login</p>
                </div>

                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="login-form"
                    noValidate
                >
                    {/* Email Field */}
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                            <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                            <input
                                ref={emailRef}
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                onKeyDown={handleKeyDown}
                                className={`form-control ${emailError ? 'error' : ''} ${touched.email && !emailError ? 'valid' : ''}`}
                                placeholder="Enter your Go North East email"
                                required
                                autoComplete="email"
                                disabled={isLoading}
                                aria-describedby={emailError ? 'email-error' : undefined}
                                aria-invalid={!!emailError}
                            />
                            <div className="input-icon">
                                <span className="email-icon">📧</span>
                            </div>
                        </div>
                        {emailError && (
                            <div id="email-error" className="error-message" role="alert">
                                {emailError}
                            </div>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                            <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                            <input
                                ref={passwordRef}
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={password}
                                onChange={handlePasswordChange}
                                onBlur={handlePasswordBlur}
                                onKeyDown={handleKeyDown}
                                className={`form-control ${passwordError ? 'error' : ''} ${touched.password && !passwordError ? 'valid' : ''}`}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                disabled={isLoading}
                                aria-describedby={passwordError ? 'password-error' : undefined}
                                aria-invalid={!!passwordError}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                                disabled={isLoading}
                                title={showPassword ? 'Hide password' : 'Show password'}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {passwordError && (
                            <div id="password-error" className="error-message" role="alert">
                                {passwordError}
                            </div>
                        )}
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                                className="checkbox-input"
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-text">Remember me for 24 hours</span>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message general-error" role="alert">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-login"
                        disabled={isLoading || !formIsValid}
                        aria-describedby="login-help"
                    >
                        {isLoading ? (
                            <>
                                <span className="button-spinner"></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <span className="button-icon">🔐</span>
                                Sign In
                            </>
                        )}
                    </button>

                    {/* Forgot Password Link */}
                    <div className="form-footer">
                        <button
                            type="button"
                            className="link-button forgot-password"
                            disabled={isLoading}
                            onClick={() => alert('Password reset feature coming soon. Contact your system administrator.')}
                        >
                            Forgot your password?
                        </button>
                    </div>
                </form>

                {/* Login Hints */}
                {showHints && (
                    <div className="login-hints">
                        <div className="hints-header">
                            <span className="hints-icon">🔑</span>
                            <strong>Need Help?</strong>
                        </div>
                        <ul className="hints-list">
                            <li>Only authorized Go North East supervisors can access this system</li>
                            <li>Check your email address and password spelling</li>
                            <li>Contact your system administrator if you need access credentials</li>
                            <li>Ensure you have a stable internet connection</li>
                        </ul>
                    </div>
                )}

                {/* Development Tools */}
                {isDevelopment && (
                    <div className="dev-tools">
                        <div className="dev-header">
                            <span className="dev-icon">🔧</span>
                            <span>Development Tools</span>
                        </div>

                        <div className="quick-login-section">
                            <p className="quick-login-title">Quick Login:</p>
                            <div className="quick-login-buttons">
                                <button
                                    type="button"
                                    onClick={() => handleQuickLogin('anthony.gair@example.com', 'TempPassword2025!')}
                                    className="dev-button quick-login-btn admin"
                                    disabled={isLoading}
                                >
                                    Anthony (Admin)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickLogin('supervisor@example.com', 'TempPassword2025!')}
                                    className="dev-button quick-login-btn supervisor"
                                    disabled={isLoading}
                                >
                                    Test Supervisor
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="login-footer">
                    <p className="security-note">
                        <span className="security-icon">🔒</span>
                        AuthContext Secure Authentication - Centralized state management
                    </p>
                    <p className="version-info">
                        Enhanced Login v4.1 - AuthContext Integration
                    </p>
                    <p className="support-info">
                        Need technical support? Contact IT Support
                    </p>
                </div>
            </div>

            {/* Enhanced Styles */}
            <style jsx="true">{`
                .supervisor-login {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    position: relative;
                }

                .auth-status-badge {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 8px 16px;
                    border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    z-index: 1000;
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #dc3545;
                    transition: background-color 0.3s ease;
                }

                .status-indicator[data-connected="true"] {
                    background: #28a745;
                }

                .login-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    width: 100%;
                    max-width: 440px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .login-card.success {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border: 2px solid #0ea5e9;
                }

                .login-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #E4002B 0%, #003B5C 100%);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .login-logo {
                    height: 60px;
                    width: auto;
                    margin-bottom: 20px;
                }

                .login-header h2 {
                    color: #2d3748;
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                }

                .login-subtitle {
                    color: #718096;
                    font-size: 14px;
                    margin: 0;
                }

                .success-content {
                    text-align: center;
                    padding: 20px 0;
                }

                .success-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .success-content h3 {
                    color: #0369a1;
                    margin: 0 0 8px 0;
                }

                .success-content p {
                    color: #475569;
                    margin: 4px 0;
                }

                .success-actions {
                    margin-top: 24px;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-label {
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .required {
                    color: #e53e3e;
                    font-size: 12px;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .form-control {
                    width: 100%;
                    padding: 12px 16px;
                    padding-right: 40px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: all 0.2s ease;
                    background: white;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #3182ce;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
                }

                .form-control.error {
                    border-color: #e53e3e;
                    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
                }

                .form-control.valid {
                    border-color: #38a169;
                    box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
                }

                .form-control:disabled {
                    background: #f7fafc;
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .input-icon, .password-toggle {
                    position: absolute;
                    right: 12px;
                    font-size: 16px;
                    color: #a0aec0;
                }

                .password-toggle {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .password-toggle:hover {
                    background: #f7fafc;
                    color: #4a5568;
                }

                .password-toggle:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .checkbox-group {
                    margin: 8px 0;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #4a5568;
                }

                .checkbox-input {
                    display: none;
                }

                .checkbox-custom {
                    width: 18px;
                    height: 18px;
                    border: 2px solid #cbd5e0;
                    border-radius: 4px;
                    position: relative;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .checkbox-input:checked + .checkbox-custom {
                    background: #3182ce;
                    border-color: #3182ce;
                }

                .checkbox-input:checked + .checkbox-custom::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }

                .error-message {
                    color: #e53e3e;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .general-error {
                    background: #fed7d7;
                    border: 1px solid #feb2b2;
                    border-radius: 6px;
                    padding: 10px 12px;
                    margin: 4px 0;
                }

                .btn {
                    padding: 14px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    position: relative;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(49, 130, 206, 0.4);
                }

                .btn-primary:disabled {
                    background: #a0aec0;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .button-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .form-footer {
                    text-align: center;
                    margin-top: 16px;
                }

                .link-button {
                    background: none;
                    border: none;
                    color: #3182ce;
                    font-size: 14px;
                    cursor: pointer;
                    text-decoration: underline;
                    transition: color 0.2s ease;
                }

                .link-button:hover:not(:disabled) {
                    color: #2c5282;
                }

                .link-button:disabled {
                    color: #a0aec0;
                    cursor: not-allowed;
                }

                .login-hints {
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 20px;
                }

                .hints-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    font-weight: 600;
                    color: #2d3748;
                }

                .hints-list {
                    margin: 0;
                    padding-left: 20px;
                    color: #4a5568;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .hints-list li {
                    margin-bottom: 4px;
                }

                .dev-tools {
                    background: #fffbeb;
                    border: 1px solid #f6cc02;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 20px;
                }

                .dev-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    font-weight: 600;
                    color: #744210;
                    font-size: 14px;
                }

                .dev-button {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-right: 8px;
                    margin-bottom: 8px;
                }

                .quick-login-section {
                    margin-top: 12px;
                }

                .quick-login-title {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    color: #744210;
                    font-weight: 600;
                }

                .quick-login-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .quick-login-btn.admin {
                    background: #10b981;
                    color: white;
                }

                .quick-login-btn.supervisor {
                    background: #06b6d4;
                    color: white;
                }

                .quick-login-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                .login-footer {
                    text-align: center;
                    margin-top: 32px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }

                .login-footer p {
                    margin: 6px 0;
                    font-size: 12px;
                    color: #718096;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .security-note {
                    font-weight: 600;
                    color: #38a169;
                }

                .loading-container {
                    text-align: center;
                    padding: 40px 20px;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #3182ce;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                .loading-container p {
                    color: #718096;
                    font-size: 14px;
                    margin: 0;
                }

                /* Responsive Design */
                @media (max-width: 640px) {
                    .supervisor-login {
                        padding: 12px;
                    }

                    .login-card {
                        padding: 24px 20px;
                    }

                    .login-logo {
                        height: 48px;
                    }

                    .login-header h2 {
                        font-size: 20px;
                    }

                    .form-control {
                        font-size: 16px;
                    }

                    .quick-login-buttons {
                        flex-direction: column;
                    }

                    .auth-status-badge {
                        top: 12px;
                        right: 12px;
                        font-size: 11px;
                        padding: 6px 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SupervisorLoginWithContext;