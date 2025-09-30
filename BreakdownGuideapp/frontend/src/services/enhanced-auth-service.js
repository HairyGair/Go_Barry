// Enhanced Supabase Authentication Service with Security Integration
// Implements proper Supabase authentication flow with session management and security features

import { supabase } from './supabase-client.js';
import { passwordValidator, sessionSecurity, rateLimiter, SecurityUtils, SECURITY_CONFIG } from './security-service.js';

// Authorized supervisors - these accounts must be created in Supabase Auth
// All supervisors are initially from SDC (Service Delivery Centre)
const AUTHORIZED_SUPERVISORS = [
    {
        email: 'anthony.gair@gonortheast.co.uk',
        name: 'Anthony Gair',
        depot: 'SDC',
        role: 'admin',
        supervisorId: 'AG003',
        badge_number: 'AG003'
    },
    {
        email: 'lee.mutch@gonortheast.co.uk',
        name: 'Lee Mutch',
        depot: 'SDC',
        role: 'admin',
        supervisorId: 'LM001',
        badge_number: 'LM001'
    },
    {
        email: 'joshua.devlin@gonortheast.co.uk',
        name: 'Joshua Devlin',
        depot: 'SDC',
        role: 'supervisor',
        supervisorId: 'JD002',
        badge_number: 'JD002'
    },
    {
        email: 'test@test.com',
        name: 'Test Supervisor',
        depot: 'SDC',
        role: 'supervisor',
        supervisorId: 'TEST01',
        badge_number: 'TEST01'
    },
    {
        email: 'simon.glass@gonortheast.co.uk',
        name: 'Simon Glass',
        depot: 'SDC',
        role: 'supervisor',
        supervisorId: 'SG001',
        badge_number: 'SG001'
    }
];

class EnhancedAuthService {
    constructor() {
        this.currentSession = null;
        this.refreshTimer = null;
        this.sessionListeners = new Set();
        this.isInitialized = false;

        // Initialize authentication listener
        this.initializeAuthListener();
    }

    // Initialize Supabase auth state listener
    initializeAuthListener() {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event, session?.user?.email);

            if (event === 'SIGNED_IN' && session) {
                this.handleSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            } else if (event === 'TOKEN_REFRESHED' && session) {
                this.handleTokenRefresh(session);
            }
        });

        this.isInitialized = true;
    }

    // Handle successful sign in
    async handleSignIn(session) {
        // First try to get supervisor data from Supabase
        const supervisorData = await this.getSupabaseSupervisorData(session.user.email);

        // If not found in Supabase, check local authorized list
        const fallbackData = supervisorData || this.getLocalSupervisorData(session.user.email);

        if (fallbackData) {
            this.currentSession = {
                id: session.user.id,
                supervisorId: session.user.id,
                name: fallbackData.name,
                email: session.user.email,
                depot: fallbackData.depot,
                role: fallbackData.role,
                isAdmin: fallbackData.role === 'admin',
                timestamp: new Date().toISOString(),
                authenticated: true,
                authMethod: 'supabase',
                supabaseSession: session,
                expiresAt: session.expires_at
            };

            // Store in localStorage for persistence
            this.saveSessionToStorage(this.currentSession);

            // Setup refresh timer
            this.setupRefreshTimer(session);

            // Notify listeners
            this.notifySessionChange(this.currentSession);

            console.log('✅ User signed in:', fallbackData.name);
        } else {
            console.error('❌ Unauthorized user attempted to sign in:', session.user.email);
            await this.signOut();
        }
    }

    // Handle sign out
    handleSignOut() {
        this.currentSession = null;
        this.clearRefreshTimer();
        this.clearSessionStorage();
        this.notifySessionChange(null);
        console.log('👋 User signed out');
    }

    // Handle token refresh
    handleTokenRefresh(session) {
        if (this.currentSession) {
            this.currentSession.supabaseSession = session;
            this.currentSession.expiresAt = session.expires_at;
            this.saveSessionToStorage(this.currentSession);
            this.setupRefreshTimer(session);
            console.log('🔄 Session refreshed');
        }
    }

    // Get supervisor data from Supabase
    async getSupabaseSupervisorData(email) {
        try {
            const { data, error } = await supabase
                .from('supervisors')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error) {
                console.log('Supervisor not found in Supabase:', error.message);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching supervisor from Supabase:', error);
            return null;
        }
    }

    // Get supervisor data from local authorized list (fallback)
    getLocalSupervisorData(email) {
        return AUTHORIZED_SUPERVISORS.find(s => s.email.toLowerCase() === email.toLowerCase());
    }

    // Get supervisor data for authorized user (backwards compatibility)
    getSupervisorData(email) {
        return this.getLocalSupervisorData(email);
    }


    // Enhanced authentication method with comprehensive security features
    async authenticate(email, password, rememberMe = true) {
        console.log('🔐 Attempting secure authentication for:', email);

        try {
            // Step 1: Input validation and sanitization
            const normalizedEmail = SecurityUtils.sanitizeInput(email.toLowerCase().trim());
            const sanitizedPassword = SecurityUtils.sanitizeInput(password);

            // Validate email format
            if (!SecurityUtils.isValidEmail(normalizedEmail)) {
                return {
                    success: false,
                    error: 'Invalid email format'
                };
            }

            // Step 2: Rate limiting check
            const rateLimitKey = `login_${normalizedEmail}`;
            const rateLimitCheck = rateLimiter.checkLimit(
                rateLimitKey,
                SECURITY_CONFIG.rateLimit.loginAttempts,
                SECURITY_CONFIG.rateLimit.loginWindow
            );

            if (!rateLimitCheck.allowed) {
                const resetTime = new Date(rateLimitCheck.resetTime);
                await sessionSecurity.logSecurityEvent('rate_limit_exceeded', {
                    email: normalizedEmail,
                    resetTime: resetTime.toISOString()
                });

                return {
                    success: false,
                    error: `Too many login attempts. Please try again at ${resetTime.toLocaleTimeString()}`
                };
            }

            // Step 3: Password strength validation
            const passwordValidation = passwordValidator.validate(sanitizedPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    error: 'Password does not meet security requirements: ' + passwordValidation.issues.join(', '),
                    passwordValidation
                };
            }

            // Step 4: Attempt Supabase authentication first (don't pre-check authorization)
            // This prevents revealing whether an email exists in our system
            const authStartTime = Date.now();

            // Step 5: Device fingerprinting
            const deviceInfo = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                timestamp: new Date().toISOString()
            };

            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: sanitizedPassword
            });

            if (error) {
                console.error('Supabase auth error:', error.message);

                // Comprehensive logging of failed authentication attempts
                await sessionSecurity.logSecurityEvent('authentication_failed', {
                    email: normalizedEmail,
                    errorType: error.message,
                    timestamp: new Date().toISOString(),
                    attemptsRemaining: rateLimitCheck.remaining,
                    deviceInfo,
                    authDuration: Date.now() - authStartTime,
                    ipAddress: this.getClientIP(),
                    userAgent: navigator.userAgent
                });

                // Detect suspicious activity on failed login
                await sessionSecurity.detectSuspiciousActivity(normalizedEmail, 'failed_login', {
                    error: error.message,
                    attemptsRemaining: rateLimitCheck.remaining,
                    deviceInfo
                });

                // Always return generic error message to prevent email enumeration
                return {
                    success: false,
                    error: 'Invalid credentials. Please check your email and password.'
                };
            }

            // Step 6: Successful authentication - validate authorization after Supabase auth
            if (data.session && data.user) {
                const authDuration = Date.now() - authStartTime;

                // Now check if user is authorized (after successful Supabase auth)
                const supabaseSupervisor = await this.getSupabaseSupervisorData(normalizedEmail);
                const localSupervisor = this.getLocalSupervisorData(normalizedEmail);

                if (!supabaseSupervisor && !localSupervisor) {
                    // User authenticated with Supabase but not authorized in our system
                    await sessionSecurity.logSecurityEvent('unauthorized_authenticated_user', {
                        email: normalizedEmail,
                        userId: data.user.id,
                        timestamp: new Date().toISOString(),
                        deviceInfo
                    });

                    // Sign them out of Supabase
                    await supabase.auth.signOut();

                    // Return generic error to prevent email enumeration
                    return {
                        success: false,
                        error: 'Invalid credentials. Please check your email and password.'
                    };
                }

                // Clear rate limiting on successful login
                rateLimiter.clearAttempts(rateLimitKey);

                // Create secure session tracking
                const secureSession = await sessionSecurity.createSession(data.user, deviceInfo);

                // Configure session settings based on rememberMe
                if (rememberMe) {
                    try {
                        localStorage.setItem('sb_remember_me', 'true');
                        localStorage.setItem('sb_session_config', JSON.stringify({
                            duration: SECURITY_CONFIG.session.maxDuration,
                            refreshDuration: SECURITY_CONFIG.session.refreshTokenDuration,
                            rememberMe: true
                        }));
                    } catch (storageError) {
                        console.warn('Failed to store session preferences:', storageError);
                    }
                }

                // Log successful authentication
                await sessionSecurity.logSecurityEvent('authentication_success', {
                    userId: data.user.id,
                    email: normalizedEmail,
                    sessionId: secureSession.id,
                    authDuration,
                    rememberMe,
                    deviceFingerprint: secureSession.deviceFingerprint
                });

                console.log('✅ Secure authentication successful for:', normalizedEmail);

                return {
                    success: true,
                    session: this.currentSession,
                    secureSession,
                    user: data.user
                };
            }

            return {
                success: false,
                error: 'Authentication failed - no session created'
            };

        } catch (error) {
            console.error('Authentication error:', error);

            // Log authentication error
            await sessionSecurity.logSecurityEvent('authentication_error', {
                email: email?.toLowerCase(),
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'An unexpected error occurred during authentication'
            };
        }
    }

    // Enhanced sign out with security cleanup
    async signOut() {
        try {
            // Get current session for logging
            const currentUser = this.currentSession?.id;

            // Invalidate secure session
            if (currentUser) {
                await sessionSecurity.invalidateAllUserSessions(currentUser, 'manual_logout');
            }

            // Clear security-related localStorage
            try {
                localStorage.removeItem('sb_remember_me');
                localStorage.removeItem('sb_session_config');
                // Clear any security tokens
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('sb_') || key.includes('security') || key.includes('fingerprint')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (storageError) {
                console.warn('Failed to clear security storage:', storageError);
            }

            // Supabase sign out
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Supabase sign out error:', error);
            }

            // Log secure sign out
            await sessionSecurity.logSecurityEvent('secure_signout', {
                userId: currentUser,
                timestamp: new Date().toISOString(),
                manual: true
            });

            console.log('🚪 Secure sign out completed');

            // Cleanup will be handled by auth state listener
        } catch (error) {
            console.error('Sign out error:', error);

            // Force cleanup even if sign out fails
            this.handleSignOut();

            // Log sign out error
            await sessionSecurity.logSecurityEvent('signout_error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get current session
    async getCurrentSession() {
        // If we have a current session, return it
        if (this.currentSession) {
            return { success: true, session: this.currentSession };
        }

        // Check for stored session
        const storedSession = this.getStoredSession();
        if (storedSession) {
            // Verify with Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                // Session is valid, restore it
                await this.handleSignIn(session);
                return { success: true, session: this.currentSession };
            } else {
                // Stored session is invalid, clear it
                this.clearSessionStorage();
            }
        }

        // Check if there's a Supabase session we missed
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            await this.handleSignIn(session);
            return { success: true, session: this.currentSession };
        }

        return { success: false, session: null };
    }

    // Setup automatic token refresh
    setupRefreshTimer(session) {
        this.clearRefreshTimer();

        if (session.expires_at) {
            const expiresAt = new Date(session.expires_at * 1000);
            const now = new Date();
            const timeUntilRefresh = expiresAt.getTime() - now.getTime() - (5 * 60 * 1000); // Refresh 5 minutes before expiry

            if (timeUntilRefresh > 0) {
                this.refreshTimer = setTimeout(async () => {
                    console.log('🔄 Refreshing session...');
                    const { error } = await supabase.auth.refreshSession();
                    if (error) {
                        console.error('Session refresh error:', error);
                        await this.signOut();
                    }
                }, timeUntilRefresh);
            }
        }
    }

    // Clear refresh timer
    clearRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    // Session storage management
    saveSessionToStorage(session) {
        try {
            const sessionData = {
                ...session,
                // Don't store sensitive Supabase session details
                supabaseSession: null
            };
            localStorage.setItem('supervisor_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error saving session to storage:', error);
        }
    }

    getStoredSession() {
        try {
            const stored = localStorage.getItem('supervisor_session');
            if (stored) {
                const session = JSON.parse(stored);

                // Check if session is expired (24 hours)
                const sessionTime = new Date(session.timestamp);
                const now = new Date();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    return session;
                } else {
                    this.clearSessionStorage();
                }
            }
        } catch (error) {
            console.error('Error reading session from storage:', error);
            this.clearSessionStorage();
        }
        return null;
    }

    clearSessionStorage() {
        localStorage.removeItem('supervisor_session');
    }

    // Session listeners for components
    addSessionListener(callback) {
        this.sessionListeners.add(callback);
        return () => this.sessionListeners.delete(callback);
    }

    notifySessionChange(session) {
        this.sessionListeners.forEach(callback => {
            try {
                callback(session);
            } catch (error) {
                console.error('Session listener error:', error);
            }
        });
    }

    // Helper methods
    getClientIP() {
        // In a real app, this would get the client IP from headers
        // For frontend-only, we can't get real IP, so return placeholder
        return 'client-side';
    }

    getReadableError(errorMessage) {
        // Always return generic message to prevent information disclosure
        return 'Invalid credentials. Please check your email and password.';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentSession !== null;
    }

    // Get authentication status message
    getAuthStatusMessage() {
        if (this.currentSession?.authMethod === 'supabase') {
            return '🟢 Connected to secure authentication';
        }
        return '🔴 Not authenticated';
    }

    // Create Supabase user accounts and supervisor records for authorized supervisors
    async setupAuthorizedUsers() {
        console.log('🔧 Setting up authorized supervisor accounts...');

        const results = [];

        // First, ensure supervisors exist in the supervisors table
        for (const supervisor of AUTHORIZED_SUPERVISORS) {
            try {
                // Insert or update supervisor in the supervisors table
                const { data: supervisorData, error: supervisorError } = await supabase
                    .from('supervisors')
                    .upsert({
                        email: supervisor.email,
                        name: supervisor.name,
                        depot: supervisor.depot,
                        role: supervisor.role
                    }, {
                        onConflict: 'email'
                    });

                if (supervisorError) {
                    console.error(`Failed to create supervisor record for ${supervisor.email}:`, supervisorError.message);
                }

                // Try to sign up the user in Supabase Auth
                const { data, error } = await supabase.auth.signUp({
                    email: supervisor.email,
                    password: 'TempPassword2025!', // Temporary password
                    options: {
                        data: {
                            name: supervisor.name,
                            depot: supervisor.depot,
                            role: supervisor.role
                        }
                    }
                });

                if (error && error.message !== 'User already registered') {
                    console.error(`Failed to create auth account for ${supervisor.email}:`, error.message);
                    results.push({
                        email: supervisor.email,
                        success: false,
                        error: error.message,
                        supervisorRecord: !supervisorError
                    });
                } else {
                    console.log(`✅ Account ready for ${supervisor.email}`);
                    results.push({
                        email: supervisor.email,
                        success: true,
                        supervisorRecord: !supervisorError
                    });
                }
            } catch (error) {
                console.error(`Error creating account for ${supervisor.email}:`, error);
                results.push({ email: supervisor.email, success: false, error: error.message });
            }
        }

        return results;
    }
}

// Create and export singleton instance
const enhancedAuthService = new EnhancedAuthService();
export default enhancedAuthService;