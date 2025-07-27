// Go_BARRY/hooks/useNavigationGuard.js
// Custom hook for safe navigation with Expo Router timing guards

import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSupervisor } from '../components/hooks/useSupervisorSession';

/**
 * Custom hook that handles navigation timing issues with Expo Router
 * Ensures router is ready and authentication state is determined before navigation
 * 
 * @param {string} redirectPath - Path to redirect to when not authenticated (default: '/')
 * @returns {object} - Navigation state and safe navigation functions
 */
export const useNavigationGuard = (redirectPath = '/') => {
  const router = useRouter();
  const segments = useSegments();
  const { isLoggedIn, isLoading: authLoading } = useSupervisor();
  
  const [routerReady, setRouterReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Check router readiness
  useEffect(() => {
    if (segments !== undefined) {
      setRouterReady(true);
    }
  }, [segments]);

  // Auth guard effect - automatically redirect when not authenticated
  useEffect(() => {
    // Wait for both router readiness and auth completion
    if (!routerReady || authLoading || isNavigating) {
      return;
    }

    // Only navigate after router is mounted and auth check is complete
    if (!isLoggedIn) {
      console.log('[NavigationGuard] Not authenticated, redirecting...');
      safeNavigate(redirectPath);
    }
  }, [isLoggedIn, authLoading, routerReady, redirectPath, isNavigating]);

  /**
   * Safe navigation function that waits for router readiness
   * @param {string} path - Path to navigate to
   * @param {object} options - Navigation options
   */
  const safeNavigate = (path, options = {}) => {
    if (!routerReady) {
      console.warn('[NavigationGuard] Router not ready, delaying navigation');
      return;
    }

    setIsNavigating(true);
    
    // Use setTimeout to ensure navigation happens after current render cycle
    setTimeout(() => {
      try {
        if (options.replace !== false) {
          router.replace(path);
        } else {
          router.push(path);
        }
      } catch (error) {
        console.error('[NavigationGuard] Navigation error:', error);
      } finally {
        setIsNavigating(false);
      }
    }, 0);
  };

  /**
   * Safe logout with navigation
   * @param {function} logoutFn - Logout function from supervisor hook
   * @param {string} logoutRedirectPath - Path to redirect after logout
   */
  const safeLogout = async (logoutFn, logoutRedirectPath = '/') => {
    try {
      await logoutFn();
      safeNavigate(logoutRedirectPath);
    } catch (error) {
      console.error('[NavigationGuard] Logout error:', error);
      // Still try to navigate home on error
      safeNavigate(logoutRedirectPath);
    }
  };

  return {
    // State flags
    isReady: routerReady && !authLoading,
    isNavigating,
    routerReady,
    authLoading,
    isAuthenticated: isLoggedIn,
    
    // Navigation functions
    safeNavigate,
    safeLogout,
    
    // Helper functions
    canRender: () => routerReady && !authLoading && (isLoggedIn || isNavigating),
    shouldShowLoading: () => !routerReady || authLoading || isNavigating,
  };
};

export default useNavigationGuard;