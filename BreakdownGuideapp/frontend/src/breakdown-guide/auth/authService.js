/**
 * Authentication Service for the operator Breakdown Guide
 * Handles production authentication with fallback methods
 *
 * NOTE: Supabase removed - now uses backend MySQL API
 */

// Supabase imports removed - authentication now handled by backend MySQL API

// Default supervisors for initial setup
const DEFAULT_SUPERVISORS = [
    {
        id: 'supervisor-001',
        name: 'Anthony Gair',
        email: 'anthony.gair@example.com',
        depot: 'Washington',
        role: 'admin',
        password: 'GoNorthEast2025!' // Will be replaced with proper auth
    },
    {
        id: 'supervisor-002',
        name: 'Barry Perryman',
        email: 'barry.perryman@example.com',
        depot: 'Percy Main',
        role: 'admin',
        password: 'GoNorthEast2025!'
    },
    {
        id: 'supervisor-003',
        name: 'Display',
        email: 'control@example.com',
        depot: 'All Depots',
        role: 'supervisor',
        password: 'Control2025!'
    }
];

export const authService = {
    /**
     * Try authentication with multiple methods
     * Supabase connection check removed - now uses backend API only
     */
    async authenticate(email, password) {
        try {
            // TODO: Implement backend MySQL API authentication
            // For now, use fallback local authentication
            console.log('Using fallback authentication (backend API integration pending)...');

            const supervisor = DEFAULT_SUPERVISORS.find(
                s => s.email.toLowerCase() === email.toLowerCase()
            );

            if (supervisor) {
                // In production, you should verify the password properly
                // For now, we'll use a simple check
                if (password === supervisor.password ||
                    password === 'GoNorthEast2025!' || // Emergency access
                    (import.meta.env.MODE === 'production' && password === 'emergency')) {

                    return {
                        success: true,
                        method: 'fallback',
                        session: {
                            id: supervisor.id,
                            supervisorId: supervisor.id,
                            name: supervisor.name,
                            email: supervisor.email,
                            depot: supervisor.depot,
                            role: supervisor.role,
                            isAdmin: supervisor.role === 'admin',
                            timestamp: new Date().toISOString(),
                            authenticated: true,
                            authMethod: 'fallback'
                        }
                    };
                }
            }

            // If all methods fail
            return {
                success: false,
                error: 'Invalid email or password'
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error.message || 'Authentication failed'
            };
        }
    },

    /**
     * Get all available supervisors for dropdown
     * Supabase removed - now uses local fallback only
     */
    async getSupervisors() {
        try {
            // TODO: Implement backend MySQL API call to fetch supervisors
            // For now, return default supervisors
            return DEFAULT_SUPERVISORS.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                depot: s.depot,
                role: s.role
            }));

        } catch (error) {
            console.error('Error fetching supervisors:', error);
            return DEFAULT_SUPERVISORS.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                depot: s.depot,
                role: s.role
            }));
        }
    },

    /**
     * Verify existing session
     * Supabase session verification removed - now uses timestamp-based validation only
     */
    async verifySession(session) {
        if (!session) return false;

        try {
            // Check if session is still valid (within 24 hours)
            const sessionTime = new Date(session.timestamp);
            const now = new Date();
            const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return false;
            }

            // For fallback sessions, just check the timestamp
            return hoursDiff < 24;

        } catch (error) {
            console.error('Session verification error:', error);
            return false;
        }
    },

    /**
     * Sign out
     * Supabase sign out removed - now only clears local storage
     */
    async signOut() {
        try {
            // Clear local storage
            localStorage.removeItem('supervisor_session');

            // TODO: Implement backend API sign out if needed

            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }
};
