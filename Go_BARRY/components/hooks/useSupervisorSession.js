// Go_BARRY/components/hooks/useSupervisorSession.js
// Enhanced supervisor session management with inline storage

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Alert } from 'react-native';

// Inline session storage to avoid import issues
const sessionStorageService = {
  memoryStorage: new Map(),
  storageKey: 'barry_supervisor_session',
  
  saveSession(sessionData) {
    try {
      const sessionWithTimestamp = {
        ...sessionData,
        savedAt: Date.now(),
        expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
      };
      
      this.memoryStorage.set(this.storageKey, sessionWithTimestamp);
      console.log('✅ Session saved to memory storage');
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  },
  
  loadSession() {
    try {
      const session = this.memoryStorage.get(this.storageKey);
      if (!session) return null;
      
      // Check if session has expired
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
      console.log('✅ Session cleared from memory storage');
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

// Create context for supervisor session
const SupervisorContext = createContext();

// FORCE PRODUCTION URL - Never use localhost
const API_BASE_URL = 'https://go-barry.onrender.com';

// Supervisor database
const SUPERVISOR_DB = {
  'alex_woodcock': { name: 'Alex Woodcock', role: 'Supervisor', requiresPassword: false },
  'andrew_cowley': { name: 'Andrew Cowley', role: 'Supervisor', requiresPassword: false },
  'anthony_gair': { name: 'Anthony Gair', role: 'Developer/Admin', requiresPassword: false, isAdmin: true },
  'claire_fiddler': { name: 'Claire Fiddler', role: 'Supervisor', requiresPassword: false },
  'david_hall': { name: 'David Hall', role: 'Supervisor', requiresPassword: false },
  'james_daglish': { name: 'James Daglish', role: 'Supervisor', requiresPassword: false },
  'john_paterson': { name: 'John Paterson', role: 'Supervisor', requiresPassword: false },
  'simon_glass': { name: 'Simon Glass', role: 'Supervisor', requiresPassword: false },
  'barry_perryman': { 
    name: 'Barry Perryman', 
    role: 'Service Delivery Controller - Line Manager', 
    requiresPassword: true, 
    password: 'Barry123', 
    isAdmin: true 
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

// Activity tracking
let activityLog = [];

// Supervisor session hook with persistence
export const useSupervisorSession = () => {
  const [supervisorSession, setSupervisorSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize session from storage on mount
  useEffect(() => {
    const savedSession = sessionStorageService.loadSession();
    if (savedSession) {
      setSupervisorSession(savedSession);
      console.log('✅ Restored supervisor session:', savedSession.supervisor?.name);
    }
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
    // Keep only last 100 activities
    if (activityLog.length > 100) {
      activityLog = activityLog.slice(0, 100);
    }

    sessionStorageService.updateActivity();
    console.log('📝 Activity logged:', type, details);
  }, [supervisorSession]);

  // Login function with enhanced persistence
  const login = useCallback(async (loginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate supervisor locally first
      const supervisor = SUPERVISOR_DB[loginData.supervisorId];
      if (!supervisor) {
        throw new Error('Supervisor not found');
      }

      // Check password if required
      if (supervisor?.requiresPassword) {
        if (!loginData.password || loginData.password !== supervisor.password) {
          throw new Error('Incorrect password for Line Manager access');
        }
      }

      // **NEW: Authenticate with backend**
      console.log('🔐 Authenticating with backend...');
      console.log('🌐 Using API URL:', API_BASE_URL);
      
      // Map frontend IDs to backend IDs and badges
      const backendMapping = {
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
      
      const backendSupervisor = backendMapping[loginData.supervisorId];
      if (!backendSupervisor) {
        throw new Error('Backend mapping not found for supervisor');
      }
      
      // Add timeout to prevent hanging (increased for Render.com wake-up)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45 seconds
      
      try {
        // Wake up backend first with health check
        console.log('🏥 Checking backend health first...');
        try {
          const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (healthResponse.ok) {
            console.log('✅ Backend is awake and healthy');
          } else {
            console.warn('⚠️ Backend health check returned non-OK status, continuing with auth');
          }
        } catch (healthError) {
          console.warn('⚠️ Health check failed, continuing with auth:', healthError.message);
        }
        
        // Authenticate with backend
        const authUrl = `${API_BASE_URL}/api/supervisor/login`;
        console.log('🔐 Authenticating with backend...', authUrl);
        
        const authResponse = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supervisorId: backendSupervisor.id,
            badge: backendSupervisor.badge
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('📡 Auth response status:', authResponse.status);
        
        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          console.error('❌ Auth response error:', errorText);
          throw new Error(`Backend authentication failed: ${authResponse.status} - ${errorText}`);
        }
        
        const authResult = await authResponse.json();
        console.log('📋 Auth result:', authResult);
        
        if (!authResult.success) {
          throw new Error(authResult.error || 'Backend authentication failed');
        }
        
        console.log('✅ Backend authentication successful:', authResult.sessionId);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('❌ Fetch error details:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Login timeout - backend may be waking up, please try again in a moment');
        }
        
        // Don't fallback to local auth - require backend authentication
        throw new Error(`Backend authentication required but failed: ${fetchError.message}`);
      }

      // Create session with backend sessionId
      const session = {
        sessionId: authResult.sessionId, // Use backend session ID
        supervisor: {
          id: loginData.supervisorId, // Keep frontend ID for UI
          name: supervisor?.name || 'Unknown Supervisor',
          role: supervisor?.role || 'Supervisor',
          duty: DUTY_OPTIONS.find((d) => d.id === loginData.duty) || { id: loginData.duty, name: loginData.duty },
          isAdmin: supervisor?.isAdmin || false,
          permissions: supervisor?.isAdmin ? 
            ['dismiss_alerts', 'view_all_activity', 'manage_supervisors', 'create_incidents', 'send_messages'] : 
            ['dismiss_alerts', 'create_incidents'],
          backendId: backendSupervisor?.id, // Store backend ID for WebSocket
          badge: backendSupervisor?.badge
        },
        loginTime: new Date().toISOString(),
        lastActivity: Date.now(),
      };
      
      // Save to persistent storage
      const saved = sessionStorageService.saveSession(session);
      if (!saved) {
        console.warn('⚠️ Failed to save session to storage, session will not persist');
      }

      setSupervisorSession(session);
      
      // Log login activity
      logActivity('LOGIN', `${supervisor?.name || 'Unknown'} logged in on ${loginData.duty?.name || 'Unknown Duty'}`);
      
      console.log('✅ Supervisor logged in:', supervisor?.name || 'Unknown', 'Duty:', loginData.duty?.name, 'Session:', authResult.sessionId);
      return { success: true, session };
      
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('❌ Login error:', err);
      console.error('❌ Error stack:', err.stack);
      
      // Additional debugging info
      console.log('🔍 Debug info:');
      console.log('- API_BASE_URL:', API_BASE_URL);
      console.log('- loginData:', loginData);
      console.log('- supervisor found:', !!SUPERVISOR_DB[loginData.supervisorId]);
      console.log('- isClient:', typeof window !== 'undefined');
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [logActivity]);

  // Logout function
  const logout = useCallback(async () => {
    if (!supervisorSession) return;

    setIsLoading(true);
    
    try {
      // Log logout activity
      logActivity('LOGOUT', `${supervisorSession.supervisor.name} logged out`);
      
      // Clear persistent storage
      sessionStorageService.clearSession();
      
      setSupervisorSession(null);
      setError(null);
      console.log('✅ Supervisor logged out');
    } catch (err) {
      console.error('❌ Logout error:', err);
      // Still clear session even if logging fails
      sessionStorageService.clearSession();
      setSupervisorSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession, logActivity]);

  // Dismiss alert function
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
      // Create dismissal record
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

      // Log dismissal activity
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

    // Return activities for current supervisor
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
    supervisorSession, // Add this so we can access backendId
    isLoading,
    error,
    login,
    logout,
    dismissAlert,
    getSupervisorActivity,
    getAllActivity,
    logActivity,
    isLoggedIn: !!supervisorSession,
    supervisorName: supervisorSession?.supervisor?.name,
    supervisorRole: supervisorSession?.supervisor?.role,
    supervisorId: supervisorSession?.supervisor?.id, // Frontend ID
    supervisorDuty: supervisorSession?.supervisor?.duty?.name,
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