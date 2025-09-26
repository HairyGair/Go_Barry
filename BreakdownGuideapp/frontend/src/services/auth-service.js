// Enhanced Authentication Service with Fallback Support
// This provides both Supabase and local authentication methods

import { supabase, authHelpers, supabaseHelpers } from './supabase-client.js';

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
        try {
            // Quick test to see if Supabase is reachable
            const { error } = await Promise.race([
                supabase.from('supervisors').select('count', { count: 'exact', head: true }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
            
            this.supabaseAvailable = !error;
            console.log('Supabase availability:', this.supabaseAvailable ? '✅ Available' : '❌ Not available');
            return this.supabaseAvailable;
        } catch (error) {
            console.log('Supabase check failed:', error.message);
            this.supabaseAvailable = false;
            return false;
        }
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
        try {
            const authResult = await authHelpers.signInWithPassword(email, password);
            
            if (!authResult.supervisor) {
                // If no supervisor profile, check if we can create one
                const localSupervisor = FALLBACK_SUPERVISORS.find(s => s.email === email);
                if (localSupervisor && localSupervisor.password === password) {
                    // Create a session with local data
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
                            authMethod: 'supabase-fallback'
                        }
                    };
                }
                throw new Error('Supervisor profile not found');
            }
            
            return {
                success: true,
                session: {
                    id: authResult.supervisor.id,
                    supervisorId: authResult.supervisor.id,
                    name: authResult.supervisor.name,
                    email: authResult.supervisor.email,
                    depot: authResult.supervisor.depot,
                    role: authResult.supervisor.role,
                    isAdmin: authResult.supervisor.role === 'admin',
                    timestamp: new Date().toISOString(),
                    authenticated: true,
                    authMethod: 'supabase',
                    supabaseSession: authResult.session
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
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
        
        if (this.supabaseAvailable) {
            try {
                await authHelpers.signOut();
            } catch (error) {
                console.warn('Supabase sign out failed:', error);
            }
        }
    }

    // Get current session (check both saved and Supabase)
    async getCurrentSession() {
        // First check saved session
        const savedSession = this.getSavedSession();
        if (savedSession) {
            return { success: true, session: savedSession };
        }
        
        // Then check Supabase if available
        if (this.supabaseAvailable) {
            try {
                const { session, supervisor } = await authHelpers.getCurrentSession();
                if (session && supervisor) {
                    const sessionData = {
                        id: supervisor.id,
                        supervisorId: supervisor.id,
                        name: supervisor.name,
                        email: supervisor.email,
                        depot: supervisor.depot,
                        role: supervisor.role,
                        isAdmin: supervisor.role === 'admin',
                        timestamp: new Date().toISOString(),
                        authenticated: true,
                        authMethod: 'supabase',
                        supabaseSession: session
                    };
                    return { success: true, session: sessionData };
                }
            } catch (error) {
                console.warn('Failed to get Supabase session:', error);
            }
        }
        
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
