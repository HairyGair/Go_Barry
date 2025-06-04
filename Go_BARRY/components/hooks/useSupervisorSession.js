// Go_BARRY/components/hooks/useSupervisorSession.js
// Supervisor session management hook for mobile app

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Alert } from 'react-native';

// Create context for supervisor session
const SupervisorContext = createContext();

// API configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001' 
  : 'https://go-barry.onrender.com';

// Supervisor session hook
export const useSupervisorSession = () => {
  const [supervisorSession, setSupervisorSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login function
  const login = useCallback(async (supervisorId, badge) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/supervisor/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisorId, badge }),
      });

      const result = await response.json();

      if (result.success) {
        const session = {
          sessionId: result.sessionId,
          supervisor: result.supervisor,
          loginTime: new Date().toISOString(),
        };
        
        setSupervisorSession(session);
        console.log('✅ Supervisor logged in:', result.supervisor.name);
        return { success: true, session };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Failed to connect to server';
      setError(errorMessage);
      console.error('❌ Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    if (!supervisorSession) return;

    setIsLoading(true);
    
    try {
      await fetch(`${API_BASE_URL}/api/supervisor/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: supervisorSession.sessionId }),
      });

      setSupervisorSession(null);
      setError(null);
      console.log('✅ Supervisor logged out');
    } catch (err) {
      console.error('❌ Logout error:', err);
      // Still clear session even if server call fails
      setSupervisorSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession]);

  // Validate session function
  const validateSession = useCallback(async () => {
    if (!supervisorSession) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/supervisor/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: supervisorSession.sessionId }),
      });

      const result = await response.json();

      if (!result.success) {
        setSupervisorSession(null);
        setError('Session expired');
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Session validation error:', err);
      return false;
    }
  }, [supervisorSession]);

  // Dismiss alert function
  const dismissAlert = useCallback(async (alertId, reason, notes = '') => {
    if (!supervisorSession) {
      Alert.alert('Error', 'Please log in as a supervisor to dismiss alerts.');
      return { success: false, error: 'Not logged in' };
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/supervisor/alerts/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          sessionId: supervisorSession.sessionId,
          reason,
          notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Alert dismissed:', alertId, 'by', supervisorSession.supervisor.name);
        Alert.alert(
          'Alert Dismissed', 
          `Alert has been dismissed by ${supervisorSession.supervisor.name}`
        );
        return { success: true, dismissal: result.dismissal };
      } else {
        setError(result.error);
        Alert.alert('Dismissal Failed', result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'Failed to dismiss alert';
      setError(errorMessage);
      console.error('❌ Dismissal error:', err);
      Alert.alert('Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supervisorSession]);

  // Get supervisor activity
  const getSupervisorActivity = useCallback(async (limit = 20) => {
    if (!supervisorSession) return [];

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supervisor/supervisors/${supervisorSession.supervisor.id}/activity?limit=${limit}`
      );
      
      const result = await response.json();
      
      if (result.success) {
        return result.activity;
      }
      
      return [];
    } catch (err) {
      console.error('❌ Failed to fetch supervisor activity:', err);
      return [];
    }
  }, [supervisorSession]);

  // Auto-validate session periodically
  useEffect(() => {
    if (supervisorSession) {
      const interval = setInterval(validateSession, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [supervisorSession, validateSession]);

  return {
    supervisorSession,
    isLoading,
    error,
    login,
    logout,
    validateSession,
    dismissAlert,
    getSupervisorActivity,
    isLoggedIn: !!supervisorSession,
    supervisorName: supervisorSession?.supervisor?.name,
    supervisorRole: supervisorSession?.supervisor?.role,
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
