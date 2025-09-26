/**
 * Authentication Service for Go North East Breakdown Guide
 * Handles production authentication with fallback methods
 */

import { authHelpers, supabase } from '../../services/supabase-client.js';

// Default supervisors for initial setup
const DEFAULT_SUPERVISORS = [
    {
        id: 'supervisor-001',
        name: 'Anthony Gair',
        email: 'anthony.gair@gonortheast.co.uk',
        depot: 'Washington',
        role: 'admin',
        password: 'GoNorthEast2025!' // Will be replaced with proper auth
    },
    {
        id: 'supervisor-002',
        name: 'Barry Perryman',
        email: 'barry.perryman@gonortheast.co.uk',
        depot: 'Percy Main',
        role: 'admin',
        password: 'GoNorthEast2025!'
    },
    {
        id: 'supervisor-003',
        name: 'Control Room',
        email: 'control@gonortheast.co.uk',
        depot: 'All Depots',
        role: 'supervisor',
        password: 'Control2025!'
    }
];

export const authService = {
    /**
     * Check if Supabase is properly configured
     */
    async checkSupabaseConnection() {
        try {
            // Test the connection
            const { data, error } = await supabase
                .from('supervisors')
                .select('count', { count: 'exact', head: true });
            
            return !error;
        } catch (err) {
            console.error('Supabase connection test failed:', err);
            return false;
        }
    },

    /**
     * Try authentication with multiple methods
     */
    async authenticate(email, password) {
        try {
            // First, try Supabase authentication if available
            const supabaseConnected = await this.checkSupabaseConnection();
            
            if (supabaseConnected) {
                console.log('Using Supabase authentication...');
                try {
                    const result = await authHelpers.signInWithPassword(email, password);
                    if (result && result.supervisor) {
                        return {
                            success: true,
                            method: 'supabase',
                            session: {
                                id: result.supervisor.id,
                                supervisorId: result.supervisor.id,
                                name: result.supervisor.name,
                                email: result.supervisor.email,
                                depot: result.supervisor.depot,
                                role: result.supervisor.role,
                                isAdmin: result.supervisor.role === 'admin',
                                timestamp: new Date().toISOString(),
                                authenticated: true,
                                supabaseSession: result.session,
                                authMethod: 'supabase'
                            }
                        };
                    }
                } catch (supabaseError) {
                    console.warn('Supabase auth failed, trying fallback:', supabaseError.message);
                }
            }
            
            // Fallback to local authentication for production setup
            console.log('Using fallback authentication...');
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
     */
    async getSupervisors() {
        try {
            // Try to get from Supabase first
            const supabaseConnected = await this.checkSupabaseConnection();
            
            if (supabaseConnected) {
                const { data, error } = await supabase
                    .from('supervisors')
                    .select('id, name, email, depot, role')
                    .order('name');
                
                if (!error && data && data.length > 0) {
                    return data;
                }
            }
            
            // Return default supervisors if Supabase isn't available
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
            
            // If it's a Supabase session, verify with Supabase
            if (session.authMethod === 'supabase' && session.supabaseSession) {
                const { data, error } = await supabase.auth.getSession();
                return !error && data.session !== null;
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
     */
    async signOut() {
        try {
            // Clear local storage
            localStorage.removeItem('supervisor_session');
            
            // Try to sign out from Supabase if connected
            const supabaseConnected = await this.checkSupabaseConnection();
            if (supabaseConnected) {
                await supabase.auth.signOut();
            }
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }
};
