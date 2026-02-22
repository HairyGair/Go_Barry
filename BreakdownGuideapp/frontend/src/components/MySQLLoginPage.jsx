/**
 * Go BARRY Landing Page
 * Professional landing page with nav-bar login dropdown
 * Desktop-first design for supervisor control rooms
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { GoBarryLogo } from './GoBarryLogo.jsx';
import PixelishLogo from './PixelishLogo.jsx';
import './MySQLLoginPage.css';

const MySQLLoginPage = () => {
    const navigate = useNavigate();
    const { login, demoLogin, isAuthenticated, isSessionChecking } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [emailWasPrefilled, setEmailWasPrefilled] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState('general');
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

    // Refs
    const emailRef = useRef(null);
    const errorTimerRef = useRef(null);
    const loginPanelRef = useRef(null);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isSessionChecking && isAuthenticated) {
            sessionStorage.setItem('showDutyModal', 'true');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isSessionChecking, navigate]);

    // Load saved email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('lastLoginEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setEmailWasPrefilled(true);
        }
    }, []);

    // Focus email when login panel opens
    useEffect(() => {
        if (loginOpen && emailRef.current) {
            setTimeout(() => emailRef.current.focus(), 300);
        }
    }, [loginOpen]);

    // Close login panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (loginOpen && loginPanelRef.current && !loginPanelRef.current.contains(e.target)) {
                setLoginOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [loginOpen]);

    // Auto-dismiss error after 5 seconds
    useEffect(() => {
        if (error) {
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
            errorTimerRef.current = setTimeout(() => {
                setError('');
                setErrorType('general');
            }, 5000);
        }
        return () => {
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        };
    }, [error]);

    const detectErrorType = (errorMessage) => {
        const lc = errorMessage.toLowerCase();
        if (lc.includes('password') || lc.includes('credentials') || lc.includes('invalid email') ||
            lc.includes('unauthorized') || lc.includes('authentication failed')) return 'auth';
        if (lc.includes('network') || lc.includes('connection') || lc.includes('timeout') ||
            lc.includes('fetch') || lc.includes('server') || lc.includes('unavailable')) return 'connection';
        return 'general';
    };

    const handleClearEmail = () => {
        setEmail('');
        setEmailWasPrefilled(false);
        localStorage.removeItem('lastLoginEmail');
        if (emailRef.current) emailRef.current.focus();
    };

    const handleDemoLogin = async () => {
        setError('');
        setErrorType('general');
        setIsDemoLoading(true);
        try {
            const result = await demoLogin();
            if (result.success) {
                sessionStorage.removeItem('showDutyModal');
                setTimeout(() => navigate('/', { replace: true }), 300);
            } else {
                const errorMsg = result.error || 'Demo login failed.';
                setError(errorMsg);
                setErrorType(detectErrorType(errorMsg));
                setIsDemoLoading(false);
            }
        } catch (err) {
            console.error('Demo login error:', err);
            const errorMsg = err.message || 'Demo login failed. Please try again.';
            setError(errorMsg);
            setErrorType(detectErrorType(errorMsg));
            setIsDemoLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorType('general');

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
                localStorage.setItem('lastLoginEmail', email);
                sessionStorage.setItem('showDutyModal', 'true');
                setTimeout(() => navigate('/', { replace: true }), 300);
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

    // Session check loading screen
    if (isSessionChecking) {
        return (
            <div className="lp">
                <div className="lp-bg" />
                <div className="lp-session-check">
                    <div className="lp-spinner" />
                    <p>Checking session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lp">
            {/* Background layers */}
            <div className="lp-bg" />
            <div className="lp-grid-overlay" />

            {/* ─── Navigation Bar ─── */}
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <div className="lp-nav-logo">
                        <GoBarryLogo size="md" variant="compact" theme="dark" />
                    </div>
                    <div className="lp-nav-actions" ref={loginPanelRef}>
                        <a href="/showcase.html" className="lp-nav-learn-more">Learn More</a>
                        <button
                            className={`lp-nav-signin ${loginOpen ? 'active' : ''}`}
                            onClick={() => setLoginOpen(!loginOpen)}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                            </svg>
                            Sign In
                            <svg className={`lp-nav-chevron ${loginOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>

                        {/* Login Dropdown Panel */}
                        <div className={`lp-login-panel ${loginOpen ? 'open' : ''}`}>
                            <form onSubmit={handleSubmit} className="lp-login-form">
                                <div className="lp-form-group">
                                    <label htmlFor="email">
                                        Email
                                        {emailWasPrefilled && <span className="lp-saved-badge">Saved</span>}
                                    </label>
                                    <div className="lp-input-wrap">
                                        <input
                                            ref={emailRef}
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError('');
                                                if (emailWasPrefilled) setEmailWasPrefilled(false);
                                            }}
                                            placeholder="supervisor@gobarry.co.uk"
                                            disabled={isLoading}
                                            autoComplete="email"
                                            required
                                        />
                                        {emailWasPrefilled && email && (
                                            <button type="button" className="lp-clear-btn" onClick={handleClearEmail} disabled={isLoading}>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="lp-form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="lp-input-wrap">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                            onKeyDown={(e) => setCapsLockOn(e.getModifierState?.('CapsLock') || false)}
                                            onKeyUp={(e) => setCapsLockOn(e.getModifierState?.('CapsLock') || false)}
                                            placeholder="Enter password"
                                            disabled={isLoading}
                                            autoComplete="current-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="lp-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                                                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                                                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                                                    <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {capsLockOn && (
                                        <div className="lp-caps-warn">Caps Lock is on</div>
                                    )}
                                </div>

                                <div className="lp-form-options">
                                    <label className="lp-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            disabled={isLoading}
                                        />
                                        <span>Remember me</span>
                                    </label>
                                </div>

                                {error && (
                                    <div className={`lp-error lp-error--${errorType}`}>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button type="submit" className="lp-submit-btn" disabled={isLoading || !email || !password}>
                                    {isLoading ? (
                                        <><span className="lp-btn-spinner" /> Signing in...</>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ─── */}
            <main className="lp-main">
                <section className="lp-hero">
                    <div className="lp-hero-content">
                        <div className="lp-hero-badge">Built Around Your Operations</div>
                        <h1 className="lp-hero-title">
                            Your Breakdown<br />
                            <span className="lp-hero-accent">Operations Centre</span>
                        </h1>
                        <p className="lp-hero-subtitle">
                            A fully configurable breakdown management platform, tailored to your fleet,
                            your depots, and the way your supervisors work.
                        </p>
                        <div className="lp-hero-actions">
                            <button
                                className="lp-demo-btn"
                                onClick={handleDemoLogin}
                                disabled={isLoading || isDemoLoading}
                            >
                                {isDemoLoading ? (
                                    <><span className="lp-btn-spinner" /> Loading Demo...</>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <polygon points="6,3 15,9 6,15" fill="currentColor"/>
                                        </svg>
                                        Try Live Demo
                                    </>
                                )}
                            </button>
                            <a href="/showcase.html" className="lp-learn-more-btn">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M3 9h12m0 0L11 5m4 4L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                See The Full Platform
                            </a>
                            <span className="lp-demo-hint">No account needed</span>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="lp-stats">
                        <div className="lp-stat">
                            <span className="lp-stat-value">Your Routes</span>
                            <span className="lp-stat-label">Any Network Size</span>
                        </div>
                        <div className="lp-stat-divider" />
                        <div className="lp-stat">
                            <span className="lp-stat-value">Your Depots</span>
                            <span className="lp-stat-label">Multi-Site Ready</span>
                        </div>
                        <div className="lp-stat-divider" />
                        <div className="lp-stat">
                            <span className="lp-stat-value">Your Workflows</span>
                            <span className="lp-stat-label">Fully Configurable</span>
                        </div>
                        <div className="lp-stat-divider" />
                        <div className="lp-stat">
                            <span className="lp-stat-value lp-stat-live">
                                <span className="lp-pulse" />
                                Live
                            </span>
                            <span className="lp-stat-label">Breakdown Analysis</span>
                        </div>
                    </div>
                </section>

                {/* ─── Feature Cards ─── */}
                <section className="lp-features">
                    <div className="lp-feature-card" style={{ animationDelay: '0.1s' }}>
                        <div className="lp-feature-icon">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <rect x="3" y="5" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                                <rect x="7" y="8" width="14" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                                <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
                                <circle cx="19" cy="19" r="1.5" fill="currentColor"/>
                                <path d="M10 23h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h3>Guided Diagnostics</h3>
                        <p>Custom assessment wizards built around your fleet types, guiding supervisors through fault identification with intelligent decision trees.</p>
                    </div>
                    <div className="lp-feature-card" style={{ animationDelay: '0.2s' }}>
                        <div className="lp-feature-icon">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M14 8v6l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
                            </svg>
                        </div>
                        <h3>Live Fleet Status</h3>
                        <p>Real-time breakdown tracking across every depot, with engineer dispatch, ETA countdowns, and replacement vehicle coordination.</p>
                    </div>
                    <div className="lp-feature-card" style={{ animationDelay: '0.3s' }}>
                        <div className="lp-feature-icon">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <path d="M4 20l4-6 4 3 5-8 7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4 24h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h3>Operations Intelligence</h3>
                        <p>Dashboards shaped to your KPIs - trend analysis, dead mileage reporting, and route impact assessment tailored to your operation.</p>
                    </div>
                    <div className="lp-feature-card" style={{ animationDelay: '0.4s' }}>
                        <div className="lp-feature-icon">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <path d="M14 3l2.5 6H23l-5 4 2 6.5L14 16l-6 3.5 2-6.5-5-4h6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h3>Smart Route Matching</h3>
                        <p>Automatically identifies affected routes from breakdown locations, scoring service impact across your entire network.</p>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <a href="https://www.gairware.com" target="_blank" rel="noopener noreferrer" className="lp-footer-attribution">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" className="lp-gairware-logo">
                            <defs>
                                <linearGradient id="gw-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#FF8080' }} />
                                    <stop offset="25%" style={{ stopColor: '#FF3B3B' }} />
                                    <stop offset="50%" style={{ stopColor: '#CC2020' }} />
                                    <stop offset="75%" style={{ stopColor: '#FF3B3B' }} />
                                    <stop offset="100%" style={{ stopColor: '#FF6060' }} />
                                </linearGradient>
                                <radialGradient id="gw-sphere" cx="35%" cy="35%" r="65%">
                                    <stop offset="0%" style={{ stopColor: '#252525' }} />
                                    <stop offset="60%" style={{ stopColor: '#151515' }} />
                                    <stop offset="100%" style={{ stopColor: '#0a0a0a' }} />
                                </radialGradient>
                                <linearGradient id="gw-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: '#FF3B3B00' }} />
                                    <stop offset="30%" style={{ stopColor: '#FF3B3B' }} />
                                    <stop offset="70%" style={{ stopColor: '#FF3B3B' }} />
                                    <stop offset="100%" style={{ stopColor: '#FF3B3B00' }} />
                                </linearGradient>
                                <filter id="gw-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                            <circle cx="55" cy="60" r="45" fill="url(#gw-sphere)" stroke="url(#gw-chrome)" strokeWidth="2" />
                            <path d="M10 60 Q32 50 55 48 Q78 50 100 60" fill="none" stroke="url(#gw-ring)" strokeWidth="1.5" opacity="0.4" />
                            <g filter="url(#gw-glow)">
                                <path d="M78 35 L38 35 L22 60 L38 85 L78 85 L78 62 L55 62" fill="none" stroke="url(#gw-chrome)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                            <path d="M10 60 Q32 70 55 72 Q78 70 100 60" fill="none" stroke="url(#gw-ring)" strokeWidth="2" />
                            <circle cx="55" cy="12" r="3" fill="#FF3B3B" />
                            <circle cx="55" cy="108" r="3" fill="#FF3B3B" />
                            <text x="120" y="68" fontFamily="'SF Pro Display', -apple-system, sans-serif" fontSize="32" fontWeight="800" letterSpacing="5" fill="#ffffff">GAIRWARE</text>
                        </svg>
                    </a>
                    <div className="lp-footer-hosted">
                        <span className="lp-footer-hosted-text">Hosted by</span>
                        <a href="https://www.pixelish.co.uk" target="_blank" rel="noopener noreferrer" className="lp-footer-pixelish">
                            <PixelishLogo height={18} />
                        </a>
                    </div>
                    <div className="lp-footer-copy">
                        &copy; {new Date().getFullYear()} GairWare. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MySQLLoginPage;
