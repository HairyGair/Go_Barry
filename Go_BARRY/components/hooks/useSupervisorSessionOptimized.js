import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Alert } from 'react-native';
import { isTokenExpired, willExpireSoon, getTokenMetadata } from '../../utils/tokenManager';

// Session storage service - secure token management with refresh support
const sessionStorageService = {
  memoryStorage: new Map(),
  sessionKey: 'barry_supervisor_session',
  // Access token stored in memory only (NOT localStorage for security)
  accessTokenMemory: null,

  // Save session data (without access token for security)
  saveSession(sessionData, rememberMe = false) {
    try {
      const sessionWithTimestamp = {
        ...sessionData,
        savedAt: Date.now(),
        rememberMe: rememberMe,
        // Never save access token to storage
        accessToken: undefined,
      };

      this.memoryStorage.set(this.sessionKey, sessionWithTimestamp);

      // Save minimal session info to localStorage (no tokens)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(this.sessionKey, JSON.stringify(sessionWithTimestamp));
        } catch (e) {
          console.warn('⚠️ Could not save to localStorage:', e.message);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      return false;
    }
  },

  loadSession() {
    try {
      // Try memory first
      let session = this.memoryStorage.get(this.sessionKey);

      // Fall back to localStorage
      if (!session && typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = window.localStorage.getItem(this.sessionKey);
          if (stored) {
            session = JSON.parse(stored);
            this.memoryStorage.set(this.sessionKey, session);
          }
        } catch (e) {
          console.warn('⚠️ Could not load from localStorage:', e.message);
        }
      }

      return session || null;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      this.clearSession();
      return null;
    }
  },

  // Store access token in memory only (NEVER in localStorage)
  setAccessToken(token) {
    this.accessTokenMemory = token;
  },

  getAccessToken() {
    return this.accessTokenMemory;
  },

  clearAccessToken() {
    this.accessTokenMemory = null;
  },

  clearSession() {
    try {
      this.memoryStorage.delete(this.sessionKey);
      this.clearAccessToken();

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(this.sessionKey);
        } catch (e) {
          console.warn('⚠️ Could not clear from localStorage:', e.message);
        }
      }
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  },

  isSessionValid() {
    const session = this.loadSession();
    return session !== null;
  },

  updateActivity() {
    const session = this.loadSession();
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session, session.rememberMe);
    }
  }
};

// Create context
const SupervisorContext = createContext();

// API base URL - use environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://go-barry.onrender.com';

// Duty options
export const DUTY_OPTIONS = [
  { id: '100', name: 'Duty 100 (6am-3:30pm)', shift: 'Early' },
  { id: '200', name: 'Duty 200 (7:30am-5pm)', shift: 'Day' },
  { id: '400', name: 'Duty 400 (12:30pm-10pm)', shift: 'Late' },
  { id: '500', name: 'Duty 500 (2:45pm-12:15am)', shift: 'Night' },
  { id: 'xops', name: 'XOps', shift: 'Operations' },
];

// Activity tracking
let activityLog = [];

/**
 * Simplified supervisor session hook using JWT authentication
 * No Convex dependencies - pure backend JWT auth
 */
export const useSupervisorSession = () => {
  const [supervisorSession, setSupervisorSession] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

  // Initialize session from storage on mount
  useEffect(() => {
    const initializeSession = async () => {
      console.log('[useSupervisorSession] 🔄 Initializing session from storage...');
      const savedSession = sessionStorageService.loadSession();
      const savedToken = sessionStorageService.getAccessToken();

      if (savedSession) {
        setSupervisorSession(savedSession);
        console.log('✅ Session restored:', savedSession.supervisor?.name);

        // Try to restore or refresh access token
        if (savedToken && !isTokenExpired(savedToken)) {
          setAccessToken(savedToken);
          console.log('✅ Access token restored from memory');
        } else if (savedToken) {
          // Access token expired, try to refresh via API
          console.log('⚠️ Access token expired, attempting refresh...');
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.token) {
                sessionStorageService.setAccessToken(data.token);
                setAccessToken(data.token);
                console.log('✅ Access token refreshed on startup');
              }
            } else {
              console.warn('⚠️ Could not refresh token on startup');
              sessionStorageService.clearSession();
              setSupervisorSession(null);
            }
          } catch (error) {
            console.error('❌ Token refresh error on startup:', error.message);
            // Don't clear session on network error
          }
        }
      } else {
        console.log('ℹ️ No saved session found');
      }

      setSessionCheckComplete(true);
      setIsLoading(false);
    };

    initializeSession();
  }, []);

  // Log activity
  const logActivity = useCallback((type, details, alertId = null) => {
    if (!supervisorSession) return;

    const activity = {
      id: Date.now().toString(),
      type,
      details,
      alertId,
      timestamp: new Date().toISOString(),
      supervisorId: supervisorSession.supervisor.id,
      supervisorName: supervisorSession.supervisor.name,
      duty: supervisorSession.supervisor.duty?.name,
    };

    activityLog.unshift(activity);
    if (activityLog.length > 100) {
      activityLog = activityLog.slice(0, 100);
    }

    sessionStorageService.updateActivity();
  }, [supervisorSession]);

  // Refresh access token using refresh token (from HttpOnly cookie)
  const refreshAccessToken = useCallback(async () => {
    try {
      console.log('🔄 Refreshing access token...');

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookie with refresh token
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          // Store new access token in memory only
          sessionStorageService.setAccessToken(data.token);
          setAccessToken(data.token);
          console.log('✅ Access token refreshed successfully');

          // Get token metadata for logging
          const metadata = getTokenMetadata(data.token);
          if (metadata) {
            console.log(`📊 New token expires in: ${metadata.timeRemaining}ms`);
          }

          return { success: true, token: data.token };
        }
      }

      // Handle 401 - refresh token expired or invalid
      if (response.status === 401) {
        console.warn('⚠️ Refresh token expired - session ended');
        sessionStorageService.clearSession();
        setSupervisorSession(null);
        setAccessToken(null);
        setError('Session expired - please log in again');
        return { success: false, error: 'Session expired' };
      }

      // Other errors
      console.error('❌ Token refresh failed:', response.status);
      return { success: false, error: 'Token refresh failed' };

    } catch (error) {
      // Network errors - don't logout, might be temporary
      console.error('❌ Token refresh network error:', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Login function
  const login = useCallback(async (loginData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!loginData.badge || !loginData.password) {
        throw new Error('Badge and password are required');
      }

      // Call backend authentication endpoint
      const authResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          badge: loginData.badge,
          password: loginData.password
        })
      });

      const authData = await authResponse.json();

      // Handle errors
      if (!authResponse.ok || !authData.success) {
        throw new Error(authData.error || 'Authentication failed');
      }

      // Store access token in memory only (refresh token is in HttpOnly cookie)
      if (authData.token) {
        sessionStorageService.setAccessToken(authData.token);
        setAccessToken(authData.token);

        // Log token info
        const metadata = getTokenMetadata(authData.token);
        if (metadata) {
          console.log(`📊 Access token expires in: ${metadata.timeRemaining}ms`);
        }
      }

      console.log('✅ Authentication successful:', authData.user?.name);

      // Find or create duty
      let finalDuty;
      if (typeof loginData.duty === 'object' && loginData.duty?.id) {
        finalDuty = loginData.duty;
      } else if (typeof loginData.duty === 'string') {
        finalDuty = DUTY_OPTIONS.find(d => d.id === loginData.duty) || { id: loginData.duty, name: loginData.duty };
      } else {
        throw new Error('Please select a duty to continue');
      }

      // Create session object
      const isAdmin = authData.user?.role === 'admin';
      const session = {
        sessionId: `session-${Date.now()}`,
        supervisor: {
          id: authData.user?.id,
          badge: authData.user?.badge,
          name: authData.user?.name,
          email: authData.user?.email,
          role: authData.user?.role,
          depot: authData.user?.depot,
          duty: finalDuty,
          isAdmin: isAdmin,
          permissions: isAdmin ?
            ['dismiss_alerts', 'view_all_activity', 'manage_supervisors', 'create_incidents', 'send_messages'] :
            ['dismiss_alerts', 'create_incidents']
        },
        loginTime: new Date().toISOString(),
        lastActivity: Date.now(),
      };

      // Save session
      sessionStorageService.saveSession(session, loginData.rememberMe);
      setSupervisorSession(session);

      console.log('✅ Session created:', session.supervisor.name);

      // Log activity
      logActivity('LOGIN', `${authData.user?.name} logged in on ${finalDuty.name}`);

      return { success: true, session };

    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('❌ Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [logActivity]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!supervisorSession) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      // Ensure we have a valid access token
      let token = accessToken;
      if (!token || isTokenExpired(token)) {
        const refreshResult = await refreshAccessToken();
        if (!refreshResult.success) {
          return { success: false, error: 'Session expired - please log in again' };
        }
        token = refreshResult.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update session
        const updatedSession = {
          ...supervisorSession,
          supervisor: {
            ...supervisorSession.supervisor,
            passwordLastChanged: data.lastChanged
          }
        };
        setSupervisorSession(updatedSession);
        sessionStorageService.saveSession(updatedSession);
      }

      return data;
    } catch (error) {
      console.error('❌ Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }, [supervisorSession, accessToken, refreshAccessToken]);

  // Logout function
  const logout = useCallback(async () => {
    if (!supervisorSession) return;

    setIsLoading(true);

    try {
      logActivity('LOGOUT', `${supervisorSession.supervisor.name} logged out`);

      // Call logout endpoint to clear refresh token cookie
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include', // Send cookies to clear refresh token
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Server logout successful - refresh token cleared');
      } catch (logoutError) {
        console.warn('⚠️ Server logout error (non-blocking):', logoutError.message);
      }

      // Clear local session and tokens
      sessionStorageService.clearSession();
      setSupervisorSession(null);
      setAccessToken(null);
      setError(null);

      console.log('✅ Local session cleared');
    } catch (err) {
      console.error('❌ Logout error:', err);
      // Force clear even on error
      sessionStorageService.clearSession();
      setSupervisorSession(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession, logActivity]);

  // Dismiss alert
  const dismissAlert = useCallback(async (alertId, reason, notes = '') => {
    if (!supervisorSession) {
      const alertMessage = 'Please log in as a supervisor to dismiss alerts.';
      if (typeof Alert !== 'undefined') {
        Alert.alert('Error', alertMessage);
      } else {
        alert(alertMessage);
      }
      return { success: false, error: 'Not logged in' };
    }

    setIsLoading(true);

    try {
      const dismissal = {
        id: 'dismiss_' + Date.now(),
        alertId,
        reason,
        notes,
        supervisorId: supervisorSession.supervisor.id,
        supervisorName: supervisorSession.supervisor.name,
        timestamp: new Date().toISOString(),
        duty: supervisorSession.supervisor.duty?.name,
      };

      logActivity('DISMISS_ALERT', `Dismissed alert ${alertId}: ${reason}`, alertId);

      console.log('✅ Alert dismissed:', alertId);

      const successMessage = `Alert dismissed by ${supervisorSession.supervisor.name}`;
      if (typeof Alert !== 'undefined') {
        Alert.alert('Alert Dismissed', successMessage);
      } else {
        alert(successMessage);
      }

      return { success: true, dismissal };
    } catch (err) {
      const errorMessage = 'Failed to dismiss alert';
      setError(errorMessage);
      console.error('❌ Dismissal error:', err);

      if (typeof Alert !== 'undefined') {
        Alert.alert('Error', errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession, logActivity]);

  // Get supervisor activity
  const getSupervisorActivity = useCallback(async (limit = 20) => {
    if (!supervisorSession) return [];

    return activityLog
      .filter(activity => activity.supervisorId === supervisorSession.supervisor.id)
      .slice(0, limit);
  }, [supervisorSession]);

  // Get all activity (admin only)
  const getAllActivity = useCallback(async (limit = 50) => {
    if (!supervisorSession?.supervisor?.isAdmin) return [];
    return activityLog.slice(0, limit);
  }, [supervisorSession]);

  // Update activity periodically and refresh access token
  useEffect(() => {
    if (supervisorSession && accessToken) {
      // Update activity every 30 seconds
      const activityInterval = setInterval(() => {
        sessionStorageService.updateActivity();
      }, 30000);

      // Check token expiry every minute and refresh if needed
      const tokenCheckInterval = setInterval(() => {
        // If token expires in < 5 minutes, refresh it
        if (willExpireSoon(accessToken, 5)) {
          console.log('⏰ Access token expiring soon, refreshing...');
          refreshAccessToken().catch(err => {
            console.error('❌ Automatic token refresh failed:', err.message);
          });
        }
      }, 60000); // Check every minute

      return () => {
        clearInterval(activityInterval);
        clearInterval(tokenCheckInterval);
      };
    }
  }, [supervisorSession, accessToken, refreshAccessToken]);

  // Check for session expiry
  useEffect(() => {
    const checkExpiry = () => {
      if (supervisorSession && !sessionStorageService.isSessionValid()) {
        setSupervisorSession(null);
        setError('Session expired - please log in again');
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [supervisorSession]);

  return {
    supervisorSession,
    accessToken,
    isLoading,
    error,
    login,
    logout,
    dismissAlert,
    getSupervisorActivity,
    getAllActivity,
    logActivity,
    changePassword,
    refreshAccessToken,
    // Session properties
    isLoggedIn: !!supervisorSession,
    supervisorName: supervisorSession?.supervisor?.name,
    supervisorRole: supervisorSession?.supervisor?.role,
    supervisorId: supervisorSession?.supervisor?.id,
    supervisorEmail: supervisorSession?.supervisor?.email,
    supervisorDuty: supervisorSession?.supervisor?.duty?.name,
    supervisorDepot: supervisorSession?.supervisor?.depot,
    sessionId: supervisorSession?.sessionId,
    isAdmin: supervisorSession?.supervisor?.isAdmin || false,
    hasPermission: (permission) => {
      return supervisorSession?.supervisor?.permissions?.includes(permission) ?? false;
    },
  };
};

// Context Provider Component
export const SupervisorProvider = ({ children }) => {
  const supervisorSession = useSupervisorSession();

  useEffect(() => {
    console.log('[SupervisorProvider] 📊 Context state:', {
      isLoggedIn: supervisorSession.isLoggedIn,
      supervisorName: supervisorSession.supervisorName || 'Not logged in'
    });
  }, [supervisorSession.isLoggedIn, supervisorSession.supervisorName]);

  return (
    <SupervisorContext.Provider value={supervisorSession}>
      {children}
    </SupervisorContext.Provider>
  );
};

// Hook to use supervisor context
export const useSupervisor = () => {
  const context = useContext(SupervisorContext);
  if (!context) {
    throw new Error('useSupervisor must be used within a SupervisorProvider');
  }
  return context;
};

export default useSupervisorSession;
