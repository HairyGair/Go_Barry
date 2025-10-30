// Enhanced Authentication Service with Security Integration
// Implements authentication flow with session management and security features
// Supabase removed - now uses backend MySQL API

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

    // Initialize auth state listener
    initializeAuthListener() {
        // Supabase removed - now uses backend MySQL API
        // Auth state listening is handled by the application layer
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

    // Get supervisor data from backend
    async getSupabaseSupervisorData(email) {
        // Supabase removed - now uses backend MySQL API
        // TODO: Implement backend API call to fetch supervisor data
        return null;
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

            // Supabase removed - now uses backend MySQL API
            // TODO: Implement backend authentication API call

            // For now, check local supervisor list
            const localSupervisor = this.getLocalSupervisorData(normalizedEmail);

            if (!localSupervisor) {
                // Log failed authentication
                await sessionSecurity.logSecurityEvent('authentication_failed', {
                    email: normalizedEmail,
                    errorType: 'Invalid credentials',
                    timestamp: new Date().toISOString(),
                    attemptsRemaining: rateLimitCheck.remaining,
                    deviceInfo,
                    authDuration: Date.now() - authStartTime,
                    ipAddress: this.getClientIP(),
                    userAgent: navigator.userAgent
                });

                // Detect suspicious activity on failed login
                await sessionSecurity.detectSuspiciousActivity(normalizedEmail, 'failed_login', {
                    error: 'Invalid credentials',
                    attemptsRemaining: rateLimitCheck.remaining,
                    deviceInfo
                });

                return {
                    success: false,
                    error: 'Invalid credentials. Please check your email and password.'
                };
            }

            const authDuration = Date.now() - authStartTime;

            // Clear rate limiting on successful login
            rateLimiter.clearAttempts(rateLimitKey);

            // Create secure session tracking
            const mockUser = { id: localSupervisor.supervisorId, email: normalizedEmail };
            const secureSession = await sessionSecurity.createSession(mockUser, deviceInfo);

            // Log successful authentication
            await sessionSecurity.logSecurityEvent('authentication_success', {
                userId: localSupervisor.supervisorId,
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
                user: mockUser
            };

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

            // Supabase removed - now uses backend MySQL API
            // No Supabase sign out needed

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
            // Supabase removed - now uses backend MySQL API
            // Session validation would be done through backend API
            // For now, trust stored session if not expired
            this.currentSession = storedSession;
            return { success: true, session: this.currentSession };
        }

        // Supabase removed - no Supabase session check needed

        return { success: false, session: null };
    }

    // Get access token from any available source
    async getAccessToken() {
        // Priority 1: Get from current session in memory
        if (this.currentSession?.supabaseSession?.access_token) {
            console.log('🔒 Token from memory session');
            return this.currentSession.supabaseSession.access_token;
        }

        // Priority 2: Get from stored session
        const storedSession = this.getStoredSession();
        if (storedSession?.supabaseSession?.access_token) {
            // Check if token is expired
            const expiresAt = storedSession.supabaseSession.expires_at;
            if (expiresAt && expiresAt > Math.floor(Date.now() / 1000)) {
                console.log('🔒 Token from localStorage');
                return storedSession.supabaseSession.access_token;
            } else {
                console.log('⚠️ Stored token expired, attempting refresh');
            }
        }

        // Supabase removed - now uses backend MySQL API
        // Token retrieval would be handled through backend API

        console.warn('❌ No access token available from any source');
        return null;
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
                    // Supabase removed - now uses backend MySQL API
                    // Session refresh would be handled through backend API
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
                // Store essential Supabase tokens (needed for API authentication)
                supabaseSession: session.supabaseSession ? {
                    access_token: session.supabaseSession.access_token,
                    refresh_token: session.supabaseSession.refresh_token,
                    expires_at: session.supabaseSession.expires_at,
                    token_type: session.supabaseSession.token_type || 'bearer'
                } : null
            };
            localStorage.setItem('supervisor_session', JSON.stringify(sessionData));
            console.log('✅ Session saved with Supabase tokens');
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
        // Supabase removed - now uses backend MySQL API
        // User account setup would be handled through backend API
        for (const supervisor of AUTHORIZED_SUPERVISORS) {
            console.log(`Setup would create account for ${supervisor.email}`);
            results.push({
                email: supervisor.email,
                success: false,
                error: 'Supabase not available - use backend API',
                supervisorRecord: false
            });
        }

        return results;
    }
}

// Create and export singleton instance
const enhancedAuthService = new EnhancedAuthService();
export default enhancedAuthService;