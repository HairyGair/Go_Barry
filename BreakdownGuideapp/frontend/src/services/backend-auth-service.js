/**
 * Backend MySQL Authentication Service for Go BARRY
 *
 * This service uses the cPanel MySQL backend API for authentication
 * instead of Supabase Auth.
 *
 * Backend endpoint: https://breakdowns.gobarry.co.uk/api/auth/login
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

class BackendAuthService {
    constructor() {
        this.currentSession = null;
        this.sessionListeners = new Set();
        this.refreshTimer = null;
    }

    /**
     * Authenticate user with backend API
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @param {boolean} rememberMe - Whether to persist session
     * @returns {Promise<{success: boolean, session?: Object, error?: string}>}
     */
    async authenticate(email, password, rememberMe = true) {
        try {
            console.log('🔐 Authenticating with backend API:', email);

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Authentication failed:', data.error || data.code);
                return {
                    success: false,
                    error: data.error || 'Authentication failed'
                };
            }

            // Backend returns: { success: true, user: {...}, session: {...} }
            // Extract user data from the nested structure
            const userData = data.user || data;
            const sessionData = data.session || {};

            // Backend returns session data with JWT token
            const session = {
                id: userData.user_id || userData.supervisorId || userData.id,
                supervisorId: userData.supervisorId || userData.user_id || userData.id,
                name: userData.name || userData.full_name || userData.username,
                email: userData.email,
                depot: userData.depot,
                role: userData.role || 'supervisor',
                isAdmin: userData.role === 'admin',
                badge_number: userData.badge_number,
                current_duty: userData.current_duty || null,
                duty_end_time: userData.duty_end_time || null,
                access_token: sessionData.access_token || userData.access_token,
                expires_at: sessionData.expires_at || userData.expires_at,
                timestamp: userData.login_time || new Date().toISOString(),
                authenticated: true,
                authMethod: 'backend'
            };

            // Store session
            this.currentSession = session;

            // Persist to localStorage if remember me is enabled
            if (rememberMe) {
                this.saveSessionToStorage(session);
            }

            // Setup refresh timer
            this.setupRefreshTimer(session);

            // Notify listeners
            this.notifySessionChange(session);

            console.log('✅ Authentication successful:', session.name);

            return {
                success: true,
                session: session
            };

        } catch (error) {
            console.error('❌ Authentication error:', error);
            return {
                success: false,
                error: error.message || 'Network error. Please check your connection.'
            };
        }
    }

    /**
     * Get current session from memory or localStorage
     * @returns {Promise<{success: boolean, session?: Object}>}
     */
    async getCurrentSession() {
        // First check memory
        if (this.currentSession) {
            // Verify token hasn't expired
            if (this.isSessionValid(this.currentSession)) {
                return { success: true, session: this.currentSession };
            } else {
                // Session expired, clear it
                await this.signOut();
                return { success: false, session: null };
            }
        }

        // Try to restore from localStorage
        const storedSession = this.loadSessionFromStorage();
        if (storedSession && this.isSessionValid(storedSession)) {
            this.currentSession = storedSession;
            this.setupRefreshTimer(storedSession);
            this.notifySessionChange(storedSession);
            return { success: true, session: storedSession };
        }

        return { success: false, session: null };
    }

    /**
     * Check if session is still valid
     * @param {Object} session - Session object
     * @returns {boolean}
     */
    isSessionValid(session) {
        if (!session || !session.expires_at) {
            return false;
        }

        const now = Math.floor(Date.now() / 1000);
        return session.expires_at > now;
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            // Call backend logout endpoint if we have a token
            if (this.currentSession?.access_token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.currentSession.access_token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with local cleanup even if API call fails
        }

        // Clear session
        this.currentSession = null;
        this.clearRefreshTimer();
        this.clearSessionStorage();
        this.notifySessionChange(null);

        console.log('👋 User signed out');
    }

    /**
     * Save session to localStorage
     * @param {Object} session - Session object
     */
    saveSessionToStorage(session) {
        try {
            localStorage.setItem('gobarry_session', JSON.stringify(session));
            localStorage.setItem('gobarry_auth_timestamp', Date.now().toString());
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    /**
     * Load session from localStorage
     * @returns {Object|null}
     */
    loadSessionFromStorage() {
        try {
            const sessionData = localStorage.getItem('gobarry_session');
            if (sessionData) {
                return JSON.parse(sessionData);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        return null;
    }

    /**
     * Clear session from localStorage
     */
    clearSessionStorage() {
        try {
            localStorage.removeItem('gobarry_session');
            localStorage.removeItem('gobarry_auth_timestamp');
            // Clear any other auth-related items
            localStorage.removeItem('supervisor_session');
            localStorage.removeItem('auth_user');
        } catch (error) {
            console.error('Failed to clear session storage:', error);
        }
    }

    /**
     * Setup automatic token refresh
     * @param {Object} session - Session object
     */
    setupRefreshTimer(session) {
        this.clearRefreshTimer();

        if (!session.expires_at) return;

        const now = Math.floor(Date.now() / 1000);
        const expiresIn = session.expires_at - now;
        const refreshIn = Math.max(0, (expiresIn - 300) * 1000); // Refresh 5 minutes before expiry

        if (refreshIn > 0) {
            console.log(`🔄 Token will refresh in ${Math.round(refreshIn / 1000 / 60)} minutes`);
            this.refreshTimer = setTimeout(() => {
                this.refreshSession();
            }, refreshIn);
        }
    }

    /**
     * Clear refresh timer
     */
    clearRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Refresh session token
     */
    async refreshSession() {
        console.log('🔄 Refreshing session token...');

        if (!this.currentSession?.access_token) {
            console.warn('No session to refresh');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentSession.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Update session with new token
                this.currentSession.access_token = data.access_token;
                this.currentSession.expires_at = data.expires_at;

                this.saveSessionToStorage(this.currentSession);
                this.setupRefreshTimer(this.currentSession);
                this.notifySessionChange(this.currentSession);

                console.log('✅ Session refreshed successfully');
            } else {
                console.warn('Session refresh failed, will need to login again');
                await this.signOut();
            }
        } catch (error) {
            console.error('Failed to refresh session:', error);
            // Don't sign out on network errors, user might be temporarily offline
        }
    }

    /**
     * Add session change listener
     * @param {Function} listener - Callback function
     * @returns {Function} - Cleanup function
     */
    addSessionListener(listener) {
        this.sessionListeners.add(listener);

        // Immediately call with current session
        listener(this.currentSession);

        // Return cleanup function
        return () => {
            this.sessionListeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of session change
     * @param {Object|null} session - New session or null
     */
    notifySessionChange(session) {
        this.sessionListeners.forEach(listener => {
            try {
                listener(session);
            } catch (error) {
                console.error('Session listener error:', error);
            }
        });
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async authenticatedFetch(endpoint, options = {}) {
        if (!this.currentSession?.access_token) {
            throw new Error('No active session');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.currentSession.access_token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // If unauthorized, session may have expired
        if (response.status === 401) {
            console.warn('Session expired, signing out...');
            await this.signOut();
            throw new Error('Session expired');
        }

        return response;
    }
}

// Export singleton instance
const backendAuthService = new BackendAuthService();
export default backendAuthService;
