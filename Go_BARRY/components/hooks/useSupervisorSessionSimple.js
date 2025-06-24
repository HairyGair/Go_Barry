// Go_BARRY/components/hooks/useSupervisorSessionSimple.js
// Simplified supervisor session management using backend API

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

// API configuration
const API_BASE = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://go-barry.onrender.com/api';

// Session storage service (simplified)
const sessionStorage = {
  storageKey: 'barry_supervisor_session',
  
  saveSession(session) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(session));
      }
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  },
  
  loadSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(this.storageKey);
        if (stored) {
          const session = JSON.parse(stored);
          // Check if session is still valid (24 hours)
          if (session.expiresAt && Date.now() > session.expiresAt) {
            this.clearSession();
            return null;
          }
          return session;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
      return null;
    }
  },
  
  clearSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }
};

export const useSupervisorSession = () => {
  const [supervisorSession, setSupervisorSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load existing session on mount
  useEffect(() => {
    const existingSession = sessionStorage.loadSession();
    if (existingSession) {
      setSupervisorSession(existingSession);
      setIsLoggedIn(true);
    }
  }, []);

  // Update isLoggedIn when session changes
  useEffect(() => {
    setIsLoggedIn(!!supervisorSession?.sessionId);
  }, [supervisorSession]);

  // Login function using backend API
  const login = useCallback(async (loginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { badge, password } = loginData;
      
      if (!badge || !password) {
        throw new Error('Badge and password are required');
      }

      console.log(`🔐 Attempting login with badge: ${badge}`);

      // Call backend API
      const response = await fetch(`${API_BASE}/supervisor/auth/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badge, password }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      // Create session object
      const session = {
        sessionId: result.sessionId,
        supervisor: result.supervisor,
        loginTime: new Date().toISOString(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        authMethod: result.authMethod
      };

      // Save session
      sessionStorage.saveSession(session);
      setSupervisorSession(session);
      
      console.log(`✅ Login successful: ${result.supervisor.name}`);
      
      setIsLoading(false);
      return { success: true, session };

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      setError(error.message);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Call backend logout if we have a session
      if (supervisorSession?.sessionId) {
        try {
          await fetch(`${API_BASE}/supervisor/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: supervisorSession.sessionId }),
          });
        } catch (logoutError) {
          console.warn('Backend logout failed:', logoutError.message);
        }
      }

      // Clear local session
      sessionStorage.clearSession();
      setSupervisorSession(null);
      setError(null);
      
      console.log('👋 Logged out successfully');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession]);

  // Dismiss alert function
  const dismissAlert = useCallback(async (alertId, reason, notes) => {
    if (!supervisorSession?.sessionId) {
      throw new Error('Not logged in');
    }

    try {
      const response = await fetch(`${API_BASE}/supervisor/alerts/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          sessionId: supervisorSession.sessionId,
          reason,
          notes
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to dismiss alert');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to dismiss alert:', error);
      throw error;
    }
  }, [supervisorSession]);

  // Get available supervisors for login UI
  const getSupervisors = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/supervisor/list`);
      const result = await response.json();
      
      if (result.success) {
        return result.supervisors;
      } else {
        throw new Error(result.error || 'Failed to get supervisors');
      }
    } catch (error) {
      console.error('❌ Failed to get supervisors:', error);
      return [];
    }
  }, []);

  return {
    // State
    supervisorSession,
    isLoading,
    error,
    isLoggedIn,
    
    // Computed values
    supervisorName: supervisorSession?.supervisor?.name,
    supervisorRole: supervisorSession?.supervisor?.role,
    supervisorBadge: supervisorSession?.supervisor?.badge,
    
    // Functions
    login,
    logout,
    dismissAlert,
    getSupervisors,
    
    // Clear error
    clearError: () => setError(null)
  };
};

export default useSupervisorSession;