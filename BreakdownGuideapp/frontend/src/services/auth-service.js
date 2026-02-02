/**
 * Authentication Service
 *
 * SECURITY NOTE: This service is DEPRECATED.
 * All authentication should go through AuthContext.jsx which uses
 * the backend API with HTTP-only cookies for secure token storage.
 *
 * This file is kept for backward compatibility but contains NO credentials.
 * Use AuthContext's login() method instead.
 */

class AuthService {
    constructor() {
        this.useSupabase = false;
        this.supabaseAvailable = false;
        console.warn('⚠️ AuthService is deprecated. Use AuthContext instead for secure authentication.');
    }

    /**
     * @deprecated Use AuthContext.login() instead
     */
    async authenticate(email, password) {
        console.error('❌ AuthService.authenticate() is deprecated. Use AuthContext.login() instead.');
        return {
            success: false,
            error: 'This authentication method is deprecated. Please use the main login form.'
        };
    }

    /**
     * @deprecated Supabase authentication removed
     */
    async authenticateWithSupabase(email, password) {
        return {
            success: false,
            error: 'Supabase authentication not available'
        };
    }

    /**
     * @deprecated Local authentication removed for security
     */
    async authenticateLocally(email, password) {
        console.error('❌ Local authentication is disabled for security reasons.');
        return {
            success: false,
            error: 'Local authentication is disabled. Use the backend API.'
        };
    }

    /**
     * @deprecated Session storage removed for security (XSS prevention)
     */
    getSavedSession() {
        console.warn('⚠️ getSavedSession() is deprecated. Sessions are managed via HTTP-only cookies.');
        return null;
    }

    /**
     * @deprecated Session storage removed for security (XSS prevention)
     */
    saveSession(session) {
        console.warn('⚠️ saveSession() is deprecated. Sessions are managed via HTTP-only cookies.');
        // Do nothing - sessions should not be stored in localStorage
    }

    /**
     * @deprecated Use AuthContext.logout() instead
     */
    clearSession() {
        console.warn('⚠️ clearSession() is deprecated. Use AuthContext.logout() instead.');
    }

    /**
     * @deprecated Use AuthContext.logout() instead
     */
    async signOut() {
        console.warn('⚠️ signOut() is deprecated. Use AuthContext.logout() instead.');
    }

    /**
     * @deprecated Use AuthContext for session management
     */
    async getCurrentSession() {
        console.warn('⚠️ getCurrentSession() is deprecated. Use AuthContext instead.');
        return { success: false, session: null };
    }

    /**
     * Get authentication status message
     */
    getAuthStatusMessage() {
        return '🔒 Using secure backend authentication';
    }

    /**
     * @deprecated No longer exposes valid emails
     */
    getValidEmails() {
        console.warn('⚠️ getValidEmails() is deprecated for security reasons.');
        return [];
    }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Also export for backward compatibility
export { authService };
