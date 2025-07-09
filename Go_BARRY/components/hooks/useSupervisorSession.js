// Go_BARRY/components/hooks/useSupervisorSessionWithPasswords.js
// Enhanced supervisor session management with mandatory passwords for all users

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Alert } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Password storage service
const passwordStorageService = {
  storageKey: 'barry_supervisor_passwords',
  
  loadPasswords() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      }
      return {};
    } catch (error) {
      console.error('Failed to load passwords:', error);
      return {};
    }
  },
  
  savePassword(supervisorId, password) {
    try {
      const passwords = this.loadPasswords();
      // Simple hash for basic security (not cryptographically secure but better than plaintext)
      const hashedPassword = btoa(password + supervisorId); // Basic encoding
      passwords[supervisorId] = {
        password: hashedPassword,
        setAt: Date.now(),
        isFirstTime: false
      };
      
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(passwords));
      }
      return true;
    } catch (error) {
      console.error('Failed to save password:', error);
      return false;
    }
  },
  
  checkPassword(supervisorId, password) {
    const passwords = this.loadPasswords();
    if (!passwords[supervisorId]) return false;
    
    const hashedPassword = btoa(password + supervisorId);
    return passwords[supervisorId].password === hashedPassword;
  },
  
  hasPassword(supervisorId) {
    const passwords = this.loadPasswords();
    return !!passwords[supervisorId] && !passwords[supervisorId].isFirstTime;
  },
  
  isFirstTimeUser(supervisorId) {
    const passwords = this.loadPasswords();
    return !passwords[supervisorId];
  }
};

// Session storage service with configurable timeout
const sessionStorageService = {
  memoryStorage: new Map(),
  storageKey: 'barry_supervisor_session',
  defaultTimeout: 10 * 60 * 60 * 1000, // 10 hours default
  
  saveSession(sessionData, rememberMe = false) {
    try {
      const timeout = rememberMe ? (10 * 60 * 60 * 1000) : this.defaultTimeout; // 10 hours regardless
      const sessionWithTimestamp = {
        ...sessionData,
        savedAt: Date.now(),
        expiresAt: Date.now() + timeout,
        rememberMe: rememberMe
      };
      
      this.memoryStorage.set(this.storageKey, sessionWithTimestamp);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(this.storageKey, JSON.stringify(sessionWithTimestamp));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  },
  
  loadSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = window.localStorage.getItem(this.storageKey);
          if (stored) {
            const session = JSON.parse(stored);
            
            if (session.expiresAt && Date.now() > session.expiresAt) {
              this.clearSession();
              return null;
            }
            
            this.memoryStorage.set(this.storageKey, session);
            return session;
          }
        } catch (e) {
          console.warn('Could not load from localStorage:', e);
        }
      }
      
      const session = this.memoryStorage.get(this.storageKey);
      if (!session) return null;
      
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
      return null;
    }
  },
  
  clearSession() {
    try {
      this.memoryStorage.delete(this.storageKey);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(this.storageKey);
        } catch (e) {
          console.warn('Could not clear from localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Failed to clear session:', error);
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
      this.saveSession(session);
    }
  }
};

// Create context
const SupervisorContext = createContext();

// FORCE PRODUCTION URL
const API_BASE_URL = 'https://go-barry.onrender.com';

// Supervisor database - ALL now require passwords
const SUPERVISOR_DB = {
  'alex_woodcock': { name: 'Alex Woodcock', role: 'Supervisor' },
  'andrew_cowley': { name: 'Andrew Cowley', role: 'Supervisor' },
  'anthony_gair': { 
    name: 'Anthony Gair', 
    role: 'Developer/Admin', 
    isAdmin: true,
    defaultPassword: 'Anthony123' // Add default for testing
  },
  'claire_fiddler': { name: 'Claire Fiddler', role: 'Supervisor' },
  'david_hall': { name: 'David Hall', role: 'Supervisor' },
  'james_daglish': { 
    name: 'James Daglish', 
    role: 'Supervisor',
    defaultPassword: 'James123'
  },
  'john_paterson': { 
    name: 'John Paterson', 
    role: 'Supervisor',
    defaultPassword: 'John123'
  },
  'simon_glass': { 
    name: 'Simon Glass', 
    role: 'Supervisor',
    defaultPassword: 'Simon123'
  },
  'barry_perryman': { 
    name: 'Barry Perryman', 
    role: 'Service Delivery Controller - Line Manager',
    isAdmin: true,
    defaultPassword: 'Barry123' // Keep Barry's existing password as default
  },
};

// Duty options
export const DUTY_OPTIONS = [
  { id: '100', name: 'Duty 100 (6am-3:30pm)', shift: 'Early' },
  { id: '200', name: 'Duty 200 (7:30am-5pm)', shift: 'Day' },
  { id: '400', name: 'Duty 400 (12:30pm-10pm)', shift: 'Late' },
  { id: '500', name: 'Duty 500 (2:45pm-12:15am)', shift: 'Night' },
  { id: 'xops', name: 'XOps', shift: 'Operations' },
];

// Backend mapping
const BACKEND_MAPPING = {
  'alex_woodcock': { id: 'supervisor001', badge: 'AW001' },
  'andrew_cowley': { id: 'supervisor002', badge: 'AC002' },
  'anthony_gair': { id: 'supervisor003', badge: 'AG003' },
  'claire_fiddler': { id: 'supervisor004', badge: 'CF004' },
  'david_hall': { id: 'supervisor005', badge: 'DH005' },
  'james_daglish': { id: 'supervisor006', badge: 'JD006' },
  'john_paterson': { id: 'supervisor007', badge: 'JP007' },
  'simon_glass': { id: 'supervisor008', badge: 'SG008' },
  'barry_perryman': { id: 'supervisor009', badge: 'BP009' },
};

// Activity tracking
let activityLog = [];

// Supervisor session hook with password management
export const useSupervisorSession = () => {
  const [supervisorSession, setSupervisorSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to indicate checking session
  const [error, setError] = useState(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState(null);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  
  // Convex mutations
  const convexLogin = useMutation(api.supervisors.login);
  const convexLogout = useMutation(api.supervisors.logout);

  // Initialize session from storage on mount
  useEffect(() => {
    console.log('[useSupervisorSession] Initializing session from storage...');
    const savedSession = sessionStorageService.loadSession();
    if (savedSession) {
      setSupervisorSession(savedSession);
      console.log('✅ Restored supervisor session:', savedSession.supervisor?.name);
    } else {
      console.log('❌ No saved session found in storage');
    }
    // Mark session check as complete and stop loading
    setSessionCheckComplete(true);
    setIsLoading(false);
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

  // Set password for first-time users
  const setPassword = useCallback(async (newPassword) => {
    if (!pendingLoginData) {
      setError('No pending login data');
      return { success: false, error: 'Invalid state' };
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return { success: false, error: 'Password too short' };
    }

    // Save the password
    const saved = passwordStorageService.savePassword(pendingLoginData.supervisorId, newPassword);
    if (!saved) {
      setError('Failed to save password');
      return { success: false, error: 'Password save failed' };
    }

    // Continue with login using the new password
    const loginResult = await login({
      ...pendingLoginData,
      password: newPassword,
      isPasswordSetup: true
    });

    if (loginResult.success) {
      setNeedsPasswordSetup(false);
      setPendingLoginData(null);
    }

    return loginResult;
  }, [pendingLoginData]);

  // Update session timeout
  const updateSessionTimeout = useCallback((newTimeout) => {
    const session = sessionStorageService.loadSession();
    if (session) {
      session.expiresAt = Date.now() + newTimeout;
      sessionStorageService.saveSession(session, session.rememberMe);
    }
  }, []);

  // Login function with password check and remember me
  const login = useCallback(async (loginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate supervisor
      const supervisor = SUPERVISOR_DB[loginData.supervisorId];
      if (!supervisor) {
        throw new Error('Supervisor not found');
      }

      // Check if this is a first-time user who needs password setup
      if (!loginData.isPasswordSetup && passwordStorageService.isFirstTimeUser(loginData.supervisorId)) {
        // Special case for users with default passwords - auto-migrate them
        if (supervisor.defaultPassword && ['barry_perryman', 'anthony_gair', 'james_daglish', 'john_paterson', 'simon_glass'].includes(loginData.supervisorId)) {
          passwordStorageService.savePassword(loginData.supervisorId, supervisor.defaultPassword);
        } else {
          // Show password setup screen for other users
          setNeedsPasswordSetup(true);
          setPendingLoginData(loginData);
          setIsLoading(false);
          return { success: false, needsPasswordSetup: true };
        }
      }

      // Validate password
      if (!loginData.password) {
        throw new Error('Password is required');
      }

      // Check password (special case for users with default passwords)
      const isValidPassword = passwordStorageService.checkPassword(loginData.supervisorId, loginData.password) ||
        (supervisor.defaultPassword && ['barry_perryman', 'anthony_gair', 'james_daglish', 'john_paterson', 'simon_glass'].includes(loginData.supervisorId) && loginData.password === supervisor.defaultPassword);

      if (!isValidPassword) {
        throw new Error('Incorrect password');
      }

      // Get backend mapping
      const backendSupervisor = BACKEND_MAPPING[loginData.supervisorId];
      if (!backendSupervisor) {
        throw new Error('Backend mapping not found for supervisor');
      }
      
      // Find the selected duty
      let finalDuty;
      if (typeof loginData.duty === 'object' && loginData.duty?.id) {
        finalDuty = loginData.duty;
      } else if (typeof loginData.duty === 'string') {
        finalDuty = DUTY_OPTIONS.find(d => d.id === loginData.duty) || { id: loginData.duty, name: loginData.duty };
      } else {
        throw new Error('Please select a duty to continue');
      }
      
      console.log('✅ Duty selected:', finalDuty);
      
      // Create session
      const session = {
        sessionId: `session-${Date.now()}`,
        supervisor: {
          id: loginData.supervisorId,
          name: supervisor.name,
          role: supervisor.role,
          duty: finalDuty,
          isAdmin: supervisor.isAdmin || false,
          permissions: supervisor.isAdmin ? 
            ['dismiss_alerts', 'view_all_activity', 'manage_supervisors', 'create_incidents', 'send_messages'] : 
            ['dismiss_alerts', 'create_incidents'],
          backendId: backendSupervisor.id,
          badge: backendSupervisor.badge
        },
        loginTime: new Date().toISOString(),
        lastActivity: Date.now(),
      };
      
      // Save and set session with remember me option
      sessionStorageService.saveSession(session, loginData.rememberMe);
      setSupervisorSession(session);
      
      // Force a state update to ensure all components re-render
      console.log('✅ Session state updated:', session.supervisor.name);
      
      // Log activity
      logActivity('LOGIN', `${supervisor.name} logged in on ${finalDuty.name}`);
      
      // Try Convex sync (non-blocking)
      try {
        console.log('🔄 Syncing with Convex...');
        const convexResult = await convexLogin({
          supervisorId: backendSupervisor.id,
          badge: backendSupervisor.badge,
          password: loginData.password,
          duty: finalDuty
        });
        
        if (convexResult?.success) {
          console.log('✅ Convex sync successful');
          const updatedSession = { ...session, convexSessionId: convexResult.sessionId };
          sessionStorageService.saveSession(updatedSession, loginData.rememberMe);
          setSupervisorSession(updatedSession);
        }
      } catch (convexError) {
        console.warn('⚠️ Convex sync error (non-blocking):', convexError.message);
      }
      
      // Try backend auth (non-blocking)
      try {
        console.log('🔐 Authenticating with backend...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const authResponse = await fetch(`${API_BASE_URL}/api/supervisor/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supervisorId: backendSupervisor.id,
            badge: backendSupervisor.badge
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (authResponse.ok) {
          const responseData = await authResponse.json();
          if (responseData?.success) {
            console.log('✅ Backend authentication successful');
            const updatedSession = { ...session, backendSessionId: responseData.sessionId };
            sessionStorageService.saveSession(updatedSession, loginData.rememberMe);
            setSupervisorSession(updatedSession);
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend auth error (non-blocking):', backendError.message);
      }
      
      return { success: true, session };
      
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('❌ Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [logActivity, convexLogin]);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!supervisorSession) {
      return { success: false, error: 'Not logged in' };
    }

    // Validate current password
    const isValid = passwordStorageService.checkPassword(supervisorSession.supervisor.id, currentPassword);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    // Save new password
    const saved = passwordStorageService.savePassword(supervisorSession.supervisor.id, newPassword);
    if (!saved) {
      return { success: false, error: 'Failed to save new password' };
    }

    logActivity('PASSWORD_CHANGE', 'Password changed successfully');
    
    return { success: true };
  }, [supervisorSession, logActivity]);

  // Logout function
  const logout = useCallback(async () => {
    if (!supervisorSession) return;

    setIsLoading(true);
    
    try {
      // Log logout activity
      logActivity('LOGOUT', `${supervisorSession.supervisor.name} logged out`);
      
      // Try Convex logout (non-blocking)
      if (supervisorSession.convexSessionId) {
        try {
          await convexLogout({ sessionId: supervisorSession.convexSessionId });
          console.log('✅ Convex logout successful');
        } catch (convexError) {
          console.warn('⚠️ Convex logout error:', convexError);
        }
      }
      
      // Clear session
      sessionStorageService.clearSession();
      setSupervisorSession(null);
      setError(null);
      console.log('✅ Supervisor logged out');
    } catch (err) {
      console.error('❌ Logout error:', err);
      sessionStorageService.clearSession();
      setSupervisorSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession, logActivity, convexLogout]);

  // Other methods remain the same...
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

      console.log('✅ Alert dismissed:', alertId, 'by', supervisorSession.supervisor.name);
      
      const successMessage = `Alert has been dismissed by ${supervisorSession.supervisor.name}`;
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
      } else {
        alert(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession, logActivity]);

  // Get supervisor activity
  const getSupervisorActivity = useCallback(async (limit = 20) => {
    if (!supervisorSession) return [];

    const supervisorActivities = activityLog
      .filter(activity => activity.supervisorId === supervisorSession.supervisor.id)
      .slice(0, limit);

    return supervisorActivities;
  }, [supervisorSession]);

  // Get all activity (admin only)
  const getAllActivity = useCallback(async (limit = 50) => {
    if (!supervisorSession?.supervisor?.isAdmin) return [];
    
    return activityLog.slice(0, limit);
  }, [supervisorSession]);

  // Update activity periodically
  useEffect(() => {
    if (supervisorSession) {
      const interval = setInterval(() => {
        sessionStorageService.updateActivity();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [supervisorSession]);

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
    isLoading,
    error,
    login,
    logout,
    dismissAlert,
    getSupervisorActivity,
    getAllActivity,
    logActivity,
    setPassword,
    changePassword,
    needsPasswordSetup,
    updateSessionTimeout,
    isLoggedIn: !!supervisorSession,
    supervisorName: supervisorSession?.supervisor?.name,
    supervisorRole: supervisorSession?.supervisor?.role,
    supervisorId: supervisorSession?.supervisor?.id,
    supervisorDuty: supervisorSession?.supervisor?.duty?.name,
    sessionId: supervisorSession?.backendSessionId || supervisorSession?.sessionId,
    isAdmin: supervisorSession?.supervisor?.isAdmin || false,
    hasPermission: (permission) => {
      return supervisorSession?.supervisor?.permissions?.includes(permission) ?? false;
    },
  };
};

// Context Provider Component
export const SupervisorProvider = ({ children }) => {
  const supervisorSession = useSupervisorSession();
  
  // Debug logging for context state
  useEffect(() => {
    console.log('[SupervisorProvider] Context state:', {
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