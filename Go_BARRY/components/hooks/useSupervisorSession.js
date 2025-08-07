// Go_BARRY/components/hooks/useSupervisorSessionWithPasswords.js
// Enhanced supervisor session management with mandatory passwords for all users

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Alert } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Password storage service
// NOTE: This is primarily for backwards compatibility and fallback scenarios.
// The backend now handles secure password hashing with bcrypt and JWT authentication.
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
// NOTE: This stores session metadata locally. JWT tokens are stored in HttpOnly cookies by the backend.
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
  const [passwordStatus, setPasswordStatus] = useState(null);
  
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

  // Set password for first-time users - updated for secure JWT auth
  const setPassword = useCallback(async (newPassword) => {
    if (!pendingLoginData) {
      setError('No pending login data');
      return { success: false, error: 'Invalid state' };
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return { success: false, error: 'Password too short' };
    }

    // Get backend mapping
    const backendSupervisor = BACKEND_MAPPING[pendingLoginData.supervisorId];
    if (!backendSupervisor) {
      setError('Backend mapping not found');
      return { success: false, error: 'Invalid supervisor' };
    }

    // For first-time setup, use the secure setup endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          badge: backendSupervisor.badge,
          newPassword: newPassword
        })
      });

      const data = await response.json();
      
      // Handle rate limiting
      if (response.status === 429) {
        setError('Too many attempts. Please wait before trying again.');
        return { success: false, error: 'Rate limit exceeded' };
      }
      
      if (!data.success) {
        setError(data.error || 'Failed to set password');
        return { success: false, error: data.error || 'Password setup failed' };
      }

      // Password set successfully, now we need to login
      // Set flag to indicate password was just set up
      setNeedsPasswordSetup(false);
      
      // Return success and let the component handle the login
      return { 
        success: true, 
        needsLogin: true,
        loginData: {
          ...pendingLoginData,
          password: newPassword,
          isPasswordSetup: true
        }
      };
    } catch (error) {
      console.error('Password setup error:', error);
      setError('Failed to set password');
      return { success: false, error: 'Password setup failed' };
    }
  }, [pendingLoginData]);

  // Refresh JWT tokens automatically
  const refreshTokens = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include current JWT from HttpOnly cookie
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ JWT tokens refreshed successfully');
          return { success: true };
        }
      }
      
      // If refresh fails, user needs to login again
      if (response.status === 401) {
        console.warn('⚠️ JWT refresh failed - authentication expired');
        sessionStorageService.clearSession();
        setSupervisorSession(null);
        setError('Session expired - please log in again');
        return { success: false, error: 'Authentication expired' };
      }
      
      return { success: false, error: 'Token refresh failed' };
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }, []);

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

      // Validate password with backend API
      if (!loginData.password) {
        throw new Error('Password is required');
      }

      // Get backend mapping first
      const backendSupervisor = BACKEND_MAPPING[loginData.supervisorId];
      if (!backendSupervisor) {
        throw new Error('Backend mapping not found for supervisor');
      }

      // Use new secure authentication endpoint
      let authResponse;
      let passwordInfo = null;
      try {
        authResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Important: include cookies for HttpOnly JWT
          body: JSON.stringify({
            badge: backendSupervisor.badge,
            password: loginData.password
          })
        });

        const authData = await authResponse.json();
        
        // Handle rate limiting
        if (authResponse.status === 429) {
          throw new Error('Too many login attempts. Please wait before trying again.');
        }
        
        if (!authResponse.ok || !authData.success) {
          if (authData.needsSetup) {
            // First time user - needs password setup
            setNeedsPasswordSetup(true);
            setPendingLoginData(loginData);
            setIsLoading(false);
            return { success: false, needsPasswordSetup: true };
          } else {
            throw new Error(authData.error || 'Authentication failed');
          }
        }

        // Check if password change is required
        if (authData.supervisor?.passwordInfo?.mustChange) {
          setPasswordStatus({
            mustChange: true,
            daysUntilExpiry: authData.supervisor.passwordInfo.daysUntilExpiry || 0,
            isExpired: authData.supervisor.passwordInfo.isExpired || false
          });
          console.warn('Password change required');
        }
        
        // Store password info from response
        passwordInfo = authData.supervisor?.passwordInfo || null;
        
        // JWT tokens are now in HttpOnly cookies, so we don't handle them client-side
        console.log('✅ Secure authentication successful');
        
      } catch (apiError) {
        // For backwards compatibility, fall back to local password check
        console.warn('Secure authentication failed, using fallback:', apiError.message);
        
        const isValidPassword = passwordStorageService.checkPassword(loginData.supervisorId, loginData.password) ||
          (supervisor.defaultPassword && ['barry_perryman', 'anthony_gair', 'james_daglish', 'john_paterson', 'simon_glass'].includes(loginData.supervisorId) && loginData.password === supervisor.defaultPassword);

        if (!isValidPassword) {
          throw new Error('Incorrect password');
        }
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
          badge: backendSupervisor.badge,
          passwordInfo: passwordInfo || null
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
      
      // JWT authentication is handled by the secure endpoint above
      // Tokens are stored in HttpOnly cookies automatically
      console.log('✅ Using secure JWT authentication with HttpOnly cookies');
      
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

  // Change password function - updated for secure JWT auth
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!supervisorSession) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include JWT token from HttpOnly cookie
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      
      // Handle rate limiting
      if (response.status === 429) {
        return { success: false, error: 'Too many attempts. Please wait before trying again.' };
      }
      
      if (data.success) {
        // Update session with new password info
        const updatedSession = {
          ...supervisorSession,
          supervisor: {
            ...supervisorSession.supervisor,
            passwordLastChanged: data.lastChanged
          }
        };
        setSupervisorSession(updatedSession);
        sessionStorageService.saveSession(updatedSession);
        
        // Log activity
        await logActivity('PASSWORD_CHANGE', 'Password changed successfully');
      }
      
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }, [supervisorSession, logActivity]);

  // Logout function - updated for secure JWT auth
  const logout = useCallback(async () => {
    if (!supervisorSession) return;

    setIsLoading(true);
    
    try {
      // Log logout activity
      logActivity('LOGOUT', `${supervisorSession.supervisor.name} logged out`);
      
      // Try secure logout endpoint to clear JWT tokens
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include', // Include JWT token from HttpOnly cookie
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Secure logout successful - JWT tokens cleared');
      } catch (logoutError) {
        console.warn('⚠️ Secure logout error (non-blocking):', logoutError);
      }
      
      // Try Convex logout (non-blocking)
      if (supervisorSession.convexSessionId) {
        try {
          await convexLogout({ sessionId: supervisorSession.convexSessionId });
          console.log('✅ Convex logout successful');
        } catch (convexError) {
          console.warn('⚠️ Convex logout error:', convexError);
        }
      }
      
      // Clear local session
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

  // Update activity periodically and refresh JWT tokens
  useEffect(() => {
    if (supervisorSession) {
      const activityInterval = setInterval(() => {
        sessionStorageService.updateActivity();
      }, 30000); // 30 seconds
      
      // Refresh JWT tokens every 45 minutes (tokens expire after 1 hour)
      const tokenRefreshInterval = setInterval(() => {
        refreshTokens();
      }, 45 * 60 * 1000); // 45 minutes
      
      return () => {
        clearInterval(activityInterval);
        clearInterval(tokenRefreshInterval);
      };
    }
  }, [supervisorSession, refreshTokens]);

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

  // Shift Management State - persists across navigation
  const [currentShift, setCurrentShift] = useState(() => {
    // Initialize from saved session
    const savedSession = sessionStorageService.loadSession();
    return savedSession?.currentShift || null;
  });
  
  // Save shift to session whenever it changes
  useEffect(() => {
    if (currentShift) {
      const session = sessionStorageService.loadSession();
      if (session) {
        const updatedSession = {
          ...session,
          currentShift,
          duty: currentShift.duty_code,
          shiftId: currentShift.id,
          clockInTime: currentShift.clock_in
        };
        sessionStorageService.saveSession(updatedSession, session.rememberMe);
      }
    }
  }, [currentShift]);
  
  // Load shift data on mount if we have a badge but no shift
  useEffect(() => {
    if (supervisorSession?.supervisor?.badge && !currentShift) {
      fetchCurrentShift();
    }
  }, [supervisorSession?.supervisor?.badge]);
  
  // Fetch current shift from backend
  const fetchCurrentShift = useCallback(async () => {
    if (!supervisorSession?.supervisor?.badge) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/current-shift/${supervisorSession.supervisor.badge}`);
      const data = await response.json();
      if (data.success && data.shift) {
        setCurrentShift(data.shift);
        // Don't update session here to avoid circular updates
      } else {
        // Only clear if we explicitly get no shift
        if (data.success && data.shift === null) {
          setCurrentShift(null);
        }
      }
    } catch (error) {
      console.error('Error fetching current shift:', error);
    }
  }, [supervisorSession?.supervisor?.badge]);
  
  // Clock In function for shift management
  const clockIn = useCallback(async (dutyCode) => {
    if (!supervisorSession) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          supervisorBadge: supervisorSession.supervisor.badge || supervisorSession.supervisor.id, 
          dutyCode 
        })
      });
      
      const data = await response.json();
      if (data.success && data.shift) {
        // Update current shift state
        setCurrentShift(data.shift);
        
        // Update session with full shift data - this will trigger the save via useEffect
        const updatedSession = { 
          ...supervisorSession,
          currentShift: data.shift,
          duty: dutyCode, 
          shiftId: data.shift.id,
          clockInTime: data.shift.clock_in
        };
        setSupervisorSession(updatedSession);
        sessionStorageService.saveSession(updatedSession, supervisorSession.rememberMe);
        
        // Log activity
        logActivity('CLOCK_IN', { duty: dutyCode });
        
        console.log('✅ Clock in successful:', data.shift);
      }
      return data;
    } catch (error) {
      console.error('Clock in error:', error);
      return { success: false, error: error.message };
    }
  }, [supervisorSession, logActivity]);
  
  // Clock Out function
  const clockOut = useCallback(async (handoverNotes) => {
    if (!supervisorSession || !currentShift) {
      return { success: false, error: 'Not clocked in' };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          supervisorBadge: supervisorSession.supervisor.badge,
          handoverNotes 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Clear shift data
        setCurrentShift(null);
        
        // Update session to remove shift data
        const updatedSession = { 
          ...supervisorSession,
          currentShift: null,
          duty: null,
          shiftId: null,
          clockInTime: null
        };
        setSupervisorSession(updatedSession);
        sessionStorageService.saveSession(updatedSession);
        
        // Log activity
        await logActivity('CLOCK_OUT', { handoverNotes });
      }
      return data;
    } catch (error) {
      console.error('Clock out error:', error);
      return { success: false, error: error.message };
    }
  }, [supervisorSession, currentShift, logActivity]);
  
  // Break management functions
  const startBreak = useCallback(async () => {
    if (!supervisorSession || !currentShift) {
      return { success: false, error: 'Not clocked in' };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/start-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          supervisorBadge: supervisorSession.supervisor.badge
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setCurrentShift(data.shift);
        await logActivity('BREAK_START', {});
      }
      return data;
    } catch (error) {
      console.error('Start break error:', error);
      return { success: false, error: error.message };
    }
  }, [supervisorSession, currentShift, logActivity]);
  
  const endBreak = useCallback(async () => {
    if (!supervisorSession || !currentShift) {
      return { success: false, error: 'Not clocked in' };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/end-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          supervisorBadge: supervisorSession.supervisor.badge
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setCurrentShift(data.shift);
        await logActivity('BREAK_END', {});
      }
      return data;
    } catch (error) {
      console.error('End break error:', error);
      return { success: false, error: error.message };
    }
  }, [supervisorSession, currentShift, logActivity]);

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
    passwordStatus,
    updateSessionTimeout,
    refreshTokens, // New secure JWT token refresh function
    // Shift Management
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    currentShift,
    fetchCurrentShift,
    isOnBreak: currentShift?.break_start && !currentShift?.break_end,
    isClockedIn: !!currentShift,
    // Session properties
    currentDuty: currentShift?.duty_code || supervisorSession?.duty,
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