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

    // Form mode state
    const [isSignupMode, setIsSignupMode] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [depot, setDepot] = useState('SDC');
    const [rememberMe, setRememberMe] = useState(true);

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    // Validation state
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [badgeNumberError, setBadgeNumberError] = useState('');
    const [touched, setTouched] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        fullName: false,
        badgeNumber: false
    });

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

        if (isSignupMode && password.length < 8) {
            return 'Password must be at least 8 characters for new accounts';
        }

        return '';
    }, [isSignupMode]);

    // Confirm password validation
    const validateConfirmPassword = useCallback((confirmPassword) => {
        if (!confirmPassword && isSignupMode) {
            return 'Please confirm your password';
        }

        if (confirmPassword !== password && isSignupMode) {
            return 'Passwords do not match';
        }

        return '';
    }, [password, isSignupMode]);

    // Full name validation
    const validateFullName = useCallback((fullName) => {
        if (!fullName && isSignupMode) {
            return 'Full name is required';
        }

        if (fullName && fullName.length < 2) {
            return 'Full name must be at least 2 characters';
        }

        return '';
    }, [isSignupMode]);

    // Badge number validation
    const validateBadgeNumber = useCallback((badgeNumber) => {
        if (!badgeNumber && isSignupMode) {
            return 'Badge number is required';
        }

        if (badgeNumber && !/^[A-Z]{2}\d{3}$/.test(badgeNumber)) {
            return 'Badge number must be in format: AB123';
        }

        return '';
    }, [isSignupMode]);

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

    // Signup function
    const handleSignup = async () => {
        console.log('🆕 Attempting signup for:', email);

        try {
            const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    password,
                    fullName,
                    badgeNumber: badgeNumber.toUpperCase(),
                    depot,
                    role: 'supervisor'
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Signup successful, awaiting approval');
                setLocalError('');
                // Show success message
                alert('Signup successful! Your account is pending approval. You will be notified when approved.');
                // Switch back to login mode
                setIsSignupMode(false);
                clearSignupForm();
                return { success: true };
            } else {
                console.error('❌ Signup failed:', result.error);
                
                // Handle specific error cases
                if (result.code === 'EMAIL_EXISTS') {
                    setLocalError(result.error || 'An account with this email already exists.');
                    // Suggest switching to login mode
                    setTimeout(() => {
                        if (confirm('An account with this email already exists. Would you like to switch to login mode?')) {
                            setIsSignupMode(false);
                            setEmail(email); // Pre-fill the email
                            setLocalError('');
                        }
                    }, 1000);
                } else {
                    setLocalError(result.error || 'Signup failed. Please try again.');
                }
                return { success: false, error: result.error };
            }
        } catch (err) {
            console.error('Signup error:', err);
            setLocalError('Network error. Please check your connection and try again.');
            return { success: false, error: 'Network error' };
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSignupMode) {
            // Validate all signup fields
            const emailErr = validateEmail(email);
            const passwordErr = validatePassword(password);
            const confirmPasswordErr = validateConfirmPassword(confirmPassword);
            const fullNameErr = validateFullName(fullName);
            const badgeNumberErr = validateBadgeNumber(badgeNumber);

            setEmailError(emailErr);
            setPasswordError(passwordErr);
            setConfirmPasswordError(confirmPasswordErr);
            setFullNameError(fullNameErr);
            setBadgeNumberError(badgeNumberErr);
            setTouched({
                email: true,
                password: true,
                confirmPassword: true,
                fullName: true,
                badgeNumber: true
            });

            if (emailErr || passwordErr || confirmPasswordErr || fullNameErr || badgeNumberErr) {
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

            await handleSignup();
        } else {
            // Validate login fields
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
        }
    };

    // Clear signup form
    const clearSignupForm = useCallback(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setBadgeNumber('');
        setDepot('SDC');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setFullNameError('');
        setBadgeNumberError('');
        setTouched({
            email: false,
            password: false,
            confirmPassword: false,
            fullName: false,
            badgeNumber: false
        });
    }, []);

    // Toggle between login and signup mode
    const toggleSignupMode = useCallback(() => {
        setIsSignupMode(!isSignupMode);
        clearSignupForm();
        clearError();
        setLocalError('');
        setShowHints(false);
        setLoginAttempts(0);
    }, [isSignupMode, clearSignupForm, clearError]);

    // Handle additional field changes
    const handleConfirmPasswordChange = useCallback((e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (touched.confirmPassword) {
            setConfirmPasswordError(validateConfirmPassword(value));
        }
        if (error) {
            clearError();
            setLocalError('');
        }
    }, [touched.confirmPassword, validateConfirmPassword, error, clearError]);

    const handleFullNameChange = useCallback((e) => {
        const value = e.target.value;
        setFullName(value);
        if (touched.fullName) {
            setFullNameError(validateFullName(value));
        }
        if (error) {
            clearError();
            setLocalError('');
        }
    }, [touched.fullName, validateFullName, error, clearError]);

    const handleBadgeNumberChange = useCallback((e) => {
        const value = e.target.value.toUpperCase();
        setBadgeNumber(value);
        if (touched.badgeNumber) {
            setBadgeNumberError(validateBadgeNumber(value));
        }
        if (error) {
            clearError();
            setLocalError('');
        }
    }, [touched.badgeNumber, validateBadgeNumber, error, clearError]);

    // Handle blur events for new fields
    const handleConfirmPasswordBlur = useCallback(() => {
        setTouched(prev => ({ ...prev, confirmPassword: true }));
        setConfirmPasswordError(validateConfirmPassword(confirmPassword));
    }, [confirmPassword, validateConfirmPassword]);

    const handleFullNameBlur = useCallback(() => {
        setTouched(prev => ({ ...prev, fullName: true }));
        setFullNameError(validateFullName(fullName));
    }, [fullName, validateFullName]);

    const handleBadgeNumberBlur = useCallback(() => {
        setTouched(prev => ({ ...prev, badgeNumber: true }));
        setBadgeNumberError(validateBadgeNumber(badgeNumber));
    }, [badgeNumber, validateBadgeNumber]);

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
                        <p className="login-subtitle">Authentication Successful</p>
                    </div>
                    <div className="success-content">
                        <div className="success-icon-animated">
                            <div className="checkmark-circle">
                                <div className="checkmark draw"></div>
                            </div>
                        </div>
                        <h3 className="welcome-name">Hello, {currentUser.name}!</h3>
                        <div className="user-details">
                            <div className="detail-item">
                                <span className="detail-icon">👤</span>
                                <span className="detail-label">Role:</span>
                                <span className="detail-value">
                                    {currentUser.role?.charAt(0).toUpperCase() + currentUser.role?.slice(1)}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-icon">🏢</span>
                                <span className="detail-label">Depot:</span>
                                <span className="detail-value">{currentUser.depot}</span>
                            </div>
                        </div>
                        <div className="success-actions">
                            <button
                                className="btn btn-primary btn-dashboard"
                                onClick={() => {
                                    if (onSuccess) {
                                        onSuccess(currentUser);
                                    } else {
                                        // Navigate to breakdown guide
                                        window.location.href = '/breakdown-guide';
                                    }
                                }}
                            >
                                <span className="btn-icon">🚀</span>
                                Continue to Dashboard
                            </button>
                            <button
                                className="btn btn-secondary btn-logout"
                                onClick={async () => {
                                    try {
                                        // Clear the auth context
                                        localStorage.removeItem('auth_session');
                                        sessionStorage.removeItem('auth_session');
                                        // Reload to reset state
                                        window.location.reload();
                                    } catch (error) {
                                        console.error('Logout error:', error);
                                    }
                                }}
                            >
                                <span className="btn-icon">🚪</span>
                                Switch User
                            </button>
                        </div>
                    </div>
                    <div className="success-footer">
                        <p className="session-info">
                            <span className="session-icon">🔐</span>
                            Secure session active • Expires in 24 hours
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const formIsValid = isSignupMode
        ? email && password && confirmPassword && fullName && badgeNumber &&
          !emailError && !passwordError && !confirmPasswordError && !fullNameError && !badgeNumberError
        : email && password && !emailError && !passwordError;

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
                    <p className="login-subtitle">
                        {isSignupMode ? 'Supervisor Registration' : 'Secure Supervisor Login'}
                    </p>
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

                    {/* Signup-only fields */}
                    {isSignupMode && (
                        <>
                            {/* Confirm Password Field */}
                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirm Password
                                    <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        onBlur={handleConfirmPasswordBlur}
                                        onKeyDown={handleKeyDown}
                                        className={`form-control ${confirmPasswordError ? 'error' : ''} ${touched.confirmPassword && !confirmPasswordError ? 'valid' : ''}`}
                                        placeholder="Confirm your password"
                                        required
                                        disabled={isLoading}
                                        aria-describedby={confirmPasswordError ? 'confirmPassword-error' : undefined}
                                        aria-invalid={!!confirmPasswordError}
                                    />
                                    <div className="input-icon">
                                        <span className="lock-icon">🔒</span>
                                    </div>
                                </div>
                                {confirmPasswordError && (
                                    <div id="confirmPassword-error" className="error-message" role="alert">
                                        {confirmPasswordError}
                                    </div>
                                )}
                            </div>

                            {/* Full Name Field */}
                            <div className="form-group">
                                <label htmlFor="fullName" className="form-label">
                                    Full Name
                                    <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={fullName}
                                        onChange={handleFullNameChange}
                                        onBlur={handleFullNameBlur}
                                        onKeyDown={handleKeyDown}
                                        className={`form-control ${fullNameError ? 'error' : ''} ${touched.fullName && !fullNameError ? 'valid' : ''}`}
                                        placeholder="Enter your full name"
                                        required
                                        disabled={isLoading}
                                        aria-describedby={fullNameError ? 'fullName-error' : undefined}
                                        aria-invalid={!!fullNameError}
                                    />
                                    <div className="input-icon">
                                        <span className="name-icon">👤</span>
                                    </div>
                                </div>
                                {fullNameError && (
                                    <div id="fullName-error" className="error-message" role="alert">
                                        {fullNameError}
                                    </div>
                                )}
                            </div>

                            {/* Badge Number Field */}
                            <div className="form-group">
                                <label htmlFor="badgeNumber" className="form-label">
                                    Badge Number
                                    <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        id="badgeNumber"
                                        name="badgeNumber"
                                        value={badgeNumber}
                                        onChange={handleBadgeNumberChange}
                                        onBlur={handleBadgeNumberBlur}
                                        onKeyDown={handleKeyDown}
                                        className={`form-control ${badgeNumberError ? 'error' : ''} ${touched.badgeNumber && !badgeNumberError ? 'valid' : ''}`}
                                        placeholder="e.g., AG003"
                                        required
                                        maxLength="5"
                                        disabled={isLoading}
                                        aria-describedby={badgeNumberError ? 'badgeNumber-error' : undefined}
                                        aria-invalid={!!badgeNumberError}
                                    />
                                    <div className="input-icon">
                                        <span className="badge-icon">🆔</span>
                                    </div>
                                </div>
                                {badgeNumberError && (
                                    <div id="badgeNumber-error" className="error-message" role="alert">
                                        {badgeNumberError}
                                    </div>
                                )}
                            </div>

                            {/* Depot Selection */}
                            <div className="form-group">
                                <label htmlFor="depot" className="form-label">
                                    Depot
                                </label>
                                <div className="input-wrapper">
                                    <select
                                        id="depot"
                                        name="depot"
                                        value={depot}
                                        onChange={(e) => setDepot(e.target.value)}
                                        className="form-control"
                                        disabled={isLoading}
                                    >
                                        <option value="SDC">SDC (Service Delivery Centre)</option>
                                        <option value="WASHINGTON">Washington</option>
                                        <option value="RIVERSIDE">Riverside</option>
                                        <option value="PERCY_MAIN">Percy Main</option>
                                        <option value="CONSETT">Consett</option>
                                        <option value="DEPTFORD">Deptford</option>
                                        <option value="HEXHAM">Hexham</option>
                                    </select>
                                    <div className="input-icon">
                                        <span className="depot-icon">🏢</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Remember Me Checkbox (Login only) */}
                    {!isSignupMode && (
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
                    )}

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
                                {isSignupMode ? 'Creating Account...' : 'Signing in...'}
                            </>
                        ) : (
                            <>
                                <span className="button-icon">{isSignupMode ? '✨' : '🔐'}</span>
                                {isSignupMode ? 'Create Account' : 'Sign In'}
                            </>
                        )}
                    </button>

                    {/* Mode Toggle */}
                    <div className="form-footer">
                        <button
                            type="button"
                            className="link-button mode-toggle"
                            disabled={isLoading}
                            onClick={toggleSignupMode}
                        >
                            {isSignupMode
                                ? 'Already have an account? Sign In'
                                : 'Need an account? Register as a Supervisor'
                            }
                        </button>
                        {!isSignupMode && (
                            <button
                                type="button"
                                className="link-button forgot-password"
                                disabled={isLoading}
                                onClick={() => alert('Password reset feature coming soon. Contact your system administrator.')}
                                style={{ marginTop: '8px', fontSize: '13px', opacity: '0.8' }}
                            >
                                Forgot your password?
                            </button>
                        )}
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
                                    onClick={() => handleQuickLogin('test@test.com', 'Test123456!')}
                                    className="dev-button quick-login-btn admin"
                                    disabled={isLoading}
                                >
                                    Test Supervisor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        alert('Please use the test account or create your own account in Supabase');
                                    }}
                                    className="dev-button quick-login-btn supervisor"
                                    disabled={isLoading}
                                >
                                    Setup Instructions
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
            <style jsx>{`
                .supervisor-login {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #003B5C 0%, #E4002B 100%);
                    padding: 20px;
                    position: relative;
                    overflow-x: hidden;
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
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 15px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    width: 100%;
                    max-width: 440px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .login-card.success {
                    background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
                    border: 2px solid #4a5568;
                    color: white;
                    box-shadow: 
                        0 10px 40px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    animation: slideUp 0.4s ease-out;
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
                    margin-bottom: 28px;
                }

                .login-logo {
                    height: 56px;
                    width: auto;
                    margin-bottom: 20px;
                }

                .login-header h2 {
                    color: #1a202c;
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.5px;
                }

                .login-subtitle {
                    color: #718096;
                    font-size: 14px;
                    margin: 0;
                    font-weight: 500;
                }

                .success-content {
                    text-align: center;
                    padding: 30px 0 20px;
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
                    margin-top: 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                /* Enhanced Success State Styles */
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .success-icon-animated {
                    margin: 0 auto 24px;
                    width: 80px;
                    height: 80px;
                }

                .checkmark-circle {
                    width: 80px;
                    height: 80px;
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    border: 3px solid #10b981;
                    border-radius: 50%;
                    animation: scaleIn 0.4s ease-in-out;
                    background: rgba(16, 185, 129, 0.1);
                }

                .checkmark {
                    width: 35px;
                    height: 50px;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -60%) rotate(45deg);
                    border: solid #10b981;
                    border-width: 0 5px 5px 0;
                }

                .checkmark.draw {
                    animation: checkmark-draw 0.4s ease-in-out 0.3s forwards;
                    opacity: 0;
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes checkmark-draw {
                    to {
                        opacity: 1;
                    }
                }

                .welcome-name {
                    color: #f9fafb;
                    font-size: 28px;
                    margin: 0 0 20px 0;
                    font-weight: 600;
                    letter-spacing: -0.5px;
                }

                .user-details {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    margin: 0 auto 28px;
                    max-width: 320px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 0;
                    color: #e2e8f0;
                    font-size: 15px;
                }

                .detail-item:not(:last-child) {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .detail-icon {
                    font-size: 18px;
                }

                .detail-label {
                    color: #94a3b8;
                    font-weight: 500;
                }

                .detail-value {
                    color: #f1f5f9;
                    font-weight: 600;
                }

                .btn-dashboard {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    font-size: 16px;
                    padding: 14px 28px;
                    border-radius: 10px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    color: white !important;
                }

                .btn-dashboard:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #94a3b8 !important;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    font-size: 14px;
                    padding: 10px 20px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .btn-secondary:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.15);
                    color: #cbd5e1 !important;
                    transform: translateY(-1px);
                }

                .btn-icon {
                    font-size: 18px;
                    margin-right: 4px;
                    vertical-align: middle;
                }

                .success-footer {
                    margin-top: 32px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .session-info {
                    color: #64748b;
                    font-size: 12px;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .session-icon {
                    font-size: 14px;
                }

                /* Mobile responsive for success screen */
                @media (max-width: 640px) {
                    .welcome-name {
                        font-size: 24px;
                    }
                    
                    .user-details {
                        max-width: 100%;
                    }
                    
                    .btn-dashboard {
                        font-size: 15px;
                        padding: 12px 24px;
                    }
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin-top: 35px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-label {
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 15px;
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
                    padding: 13px 16px;
                    padding-right: 42px;
                    border: 2px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 15px;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                    height: 48px;
                    color: #1a202c !important;  /* Dark text color for visibility */
                }

                .form-control:focus {
                    outline: none;
                    border-color: #3182ce;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
                    background: white;
                    color: #1a202c !important;  /* Ensure text stays dark when focused */
                }

                .form-control.error {
                    border-color: #e53e3e;
                    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
                    color: #1a202c !important;  /* Ensure text stays dark with errors */
                }

                .form-control.valid {
                    border-color: #38a169;
                    box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
                    color: #1a202c !important;  /* Ensure text stays dark when valid */
                }

                .form-control:disabled {
                    background: #f7fafc;
                    cursor: not-allowed;
                    opacity: 0.6;
                    color: #4a5568 !important;  /* Slightly lighter but still visible when disabled */
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
                    padding: 14px 24px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    position: relative;
                    height: 48px;
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

                /* Select dropdown styling */
                select.form-control {
                    color: #1a202c !important;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 9L2 5h8z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    padding-right: 36px;
                }

                select.form-control option {
                    color: #1a202c;
                    background: white;
                }

                /* Input placeholder text */
                .form-control::placeholder {
                    color: #a0aec0;
                    opacity: 1;
                }

                .form-control::-webkit-input-placeholder {
                    color: #a0aec0;
                }

                .form-control::-moz-placeholder {
                    color: #a0aec0;
                    opacity: 1;
                }

                .form-control:-ms-input-placeholder {
                    color: #a0aec0;
                }

                /* Ensure autocomplete text is visible */
                .form-control:-webkit-autofill,
                .form-control:-webkit-autofill:hover,
                .form-control:-webkit-autofill:focus {
                    -webkit-text-fill-color: #1a202c !important;
                    -webkit-box-shadow: 0 0 0 30px #fafbfc inset !important;
                    box-shadow: 0 0 0 30px #fafbfc inset !important;
                    transition: background-color 5000s ease-in-out 0s;
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