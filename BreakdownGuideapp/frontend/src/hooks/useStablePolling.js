// React Hook for Stable Polling - Prevents StrictMode and HMR issues
import { useEffect, useRef } from 'react';
import { getGlobalPollingManager } from '../utils/globalPollingManager.js';

// Global tracking to prevent React StrictMode double-subscriptions
if (!window.__POLLING_SUBSCRIPTIONS__) {
  window.__POLLING_SUBSCRIPTIONS__ = new Set();
}

export function useStablePolling(callback, isAuthenticated) {
  const callbackRef = useRef(callback);
  const subscriptionRef = useRef(null);
  const componentIdRef = useRef(`component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up if not authenticated
      if (subscriptionRef.current) {
        console.log(`🧹 useStablePolling: Cleaning up subscription for ${componentIdRef.current} (not authenticated)`);
        subscriptionRef.current();
        subscriptionRef.current = null;
        window.__POLLING_SUBSCRIPTIONS__.delete(componentIdRef.current);
      }
      return;
    }

    // Check if we already have an active subscription for this component
    if (subscriptionRef.current) {
      console.log(`⚠️ useStablePolling: Already subscribed for ${componentIdRef.current}, skipping`);
      return;
    }

    // Check if this component is already tracked globally
    if (window.__POLLING_SUBSCRIPTIONS__.has(componentIdRef.current)) {
      console.log(`⚠️ useStablePolling: Component ${componentIdRef.current} already tracked globally, skipping`);
      return;
    }

    console.log(`🔌 useStablePolling: Creating subscription for ${componentIdRef.current}`);

    // Track this component globally
    window.__POLLING_SUBSCRIPTIONS__.add(componentIdRef.current);

    // Create stable wrapper callback
    const stableCallback = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    // Get polling manager and subscribe
    const pollingManager = getGlobalPollingManager();
    const unsubscribe = pollingManager.subscribe(stableCallback);

    subscriptionRef.current = () => {
      console.log(`📤 useStablePolling: Unsubscribing ${componentIdRef.current}`);
      unsubscribe();
      window.__POLLING_SUBSCRIPTIONS__.delete(componentIdRef.current);
    };

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log(`🧹 useStablePolling: Effect cleanup for ${componentIdRef.current}`);
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        console.log(`🏁 useStablePolling: Component unmount cleanup for ${componentIdRef.current}`);
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array - only runs on mount/unmount
}

// Debug utility
if (typeof window !== 'undefined') {
  window.getActiveSubscriptions = () => {
    return {
      count: window.__POLLING_SUBSCRIPTIONS__.size,
      componentIds: Array.from(window.__POLLING_SUBSCRIPTIONS__),
      pollingStatus: window.getPollingManagerStatus?.() || 'Polling manager not available'
    };
  };

  window.clearAllSubscriptions = () => {
    window.__POLLING_SUBSCRIPTIONS__.clear();
    console.log('🧹 Cleared all subscription tracking');
  };
}