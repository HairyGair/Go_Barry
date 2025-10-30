// Enhanced Authentication Service with Fallback Support
// This provides local authentication methods
// Supabase removed - now uses backend MySQL API

// Hardcoded supervisor list for fallback authentication
// These are the authorized supervisors who can access the system
const FALLBACK_SUPERVISORS = [
    {
        id: 'local-001',
        email: 'anthony.gair@gonortheast.co.uk',
        password: 'GoNorthEast2025!',
        name: 'Anthony Gair',
        depot: 'Washington',
        role: 'admin'
    },
    {
        id: 'local-002',
        email: 'lee.mutch@gonortheast.co.uk',
        password: 'Engineering2025!',
        name: 'Lee Mutch',
        depot: 'Washington',
        role: 'admin'
    },
    {
        id: 'local-003',
        email: 'joshua.devlin@gonortheast.co.uk',
        password: 'Operations2025!',
        name: 'Joshua Devlin',
        depot: 'Washington',
        role: 'admin'
    },
    {
        id: 'local-004',
        email: 'supervisor@gonortheast.co.uk',
        password: 'Supervisor2025!',
        name: 'Test Supervisor',
        depot: 'Washington',
        role: 'supervisor'
    },
    {
        id: 'local-005',
        email: 'admin@gonortheast.co.uk',
        password: 'Admin2025!',
        name: 'System Admin',
        depot: 'Washington',
        role: 'admin'
    }
];

class AuthService {
    constructor() {
        this.useSupabase = true;
        this.supabaseAvailable = false;
        this.checkSupabaseAvailability();
    }

    // Check if Supabase is available
    async checkSupabaseAvailability() {
        // Supabase removed - now uses backend MySQL API
        this.supabaseAvailable = false;
        return false;
    }

    // Main authentication method
    async authenticate(email, password) {
        console.log('🔐 Attempting authentication for:', email);

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase().trim();

        // First validate against local supervisor list
        const localSupervisor = FALLBACK_SUPERVISORS.find(
            s => s.email === normalizedEmail && s.password === password
        );

        if (!localSupervisor) {
            return {
                success: false,
                error: 'Invalid email or password'
            };
        }

        // Valid credentials found, now try to get/create Supabase record
        if (this.useSupabase && this.supabaseAvailable) {
            try {
                const supabaseResult = await this.authenticateWithSupabase(normalizedEmail, password);
                if (supabaseResult.success) {
                    console.log('✅ Supabase authentication successful');
                    return supabaseResult;
                }
            } catch (error) {
                console.warn('Supabase authentication failed, using local data:', error.message);
            }
        }

        // Use local authentication with validated credentials
        console.log('📋 Using local authentication for validated supervisor');
        return {
            success: true,
            session: {
                id: localSupervisor.id,
                supervisorId: localSupervisor.id,
                name: localSupervisor.name,
                email: localSupervisor.email,
                depot: localSupervisor.depot,
                role: localSupervisor.role,
                isAdmin: localSupervisor.role === 'admin',
                timestamp: new Date().toISOString(),
                authenticated: true,
                authMethod: 'local-validated'
            }
        };
    }

    // Supabase authentication
    async authenticateWithSupabase(email, password) {
        // Supabase removed - now uses backend MySQL API
        // This method is no longer used
        return {
            success: false,
            error: 'Supabase authentication not available'
        };
    }

    // Local fallback authentication
    async authenticateLocally(email, password) {
        // Simulate async for consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const supervisor = FALLBACK_SUPERVISORS.find(
            s => s.email === email && s.password === password
        );
        
        if (supervisor) {
            return {
                success: true,
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
                    authMethod: 'local'
                }
            };
        }
        
        return {
            success: false,
            error: 'Invalid email or password'
        };
    }

    // Get saved session from localStorage
    getSavedSession() {
        try {
            const savedSession = localStorage.getItem('supervisor_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                
                // Check if session is still valid (24 hours)
                const sessionTime = new Date(session.timestamp);
                const now = new Date();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    return session;
                } else {
                    localStorage.removeItem('supervisor_session');
                }
            }
        } catch (error) {
            console.error('Error reading saved session:', error);
            localStorage.removeItem('supervisor_session');
        }
        return null;
    }

    // Save session to localStorage
    saveSession(session) {
        try {
            localStorage.setItem('supervisor_session', JSON.stringify(session));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // Clear session
    clearSession() {
        localStorage.removeItem('supervisor_session');
    }

    // Sign out
    async signOut() {
        this.clearSession();

        // Supabase removed - now uses backend MySQL API
        // No Supabase sign out needed
    }

    // Get current session (check saved session only)
    async getCurrentSession() {
        // Check saved session
        const savedSession = this.getSavedSession();
        if (savedSession) {
            return { success: true, session: savedSession };
        }

        // Supabase removed - now uses backend MySQL API
        // No Supabase session check needed

        return { success: false, session: null };
    }

    // Get authentication status message
    getAuthStatusMessage() {
        if (this.supabaseAvailable) {
            return '🟢 Connected to database';
        } else {
            return '🟡 Using offline mode';
        }
    }

    // Get list of valid email addresses for UI hints
    getValidEmails() {
        return FALLBACK_SUPERVISORS.map(s => s.email);
    }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Also export for backward compatibility
export { authService };
