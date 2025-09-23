// Global polling manager to prevent duplicate intervals in React Strict Mode
class PollingManager {
  constructor() {
    // Use window-level storage to survive hot module reloads and StrictMode
    if (!window.pollingManagerState) {
      window.pollingManagerState = {
        activePollers: new Map(),
        pollerErrors: new Map(), // Track errors per poller
        pendingCleanups: new Map() // Track pending cleanups from StrictMode
      };
    }
    this.activePollers = window.pollingManagerState.activePollers;
    this.pollerErrors = window.pollingManagerState.pollerErrors;
    this.pendingCleanups = window.pollingManagerState.pendingCleanups;
  }

  startPolling(pollerId, callback, baseInterval = 30000) {
    // If already polling with this ID, just return the existing one
    if (this.activePollers.has(pollerId)) {
      if (window.DEBUG_POLLING) {
        console.log(`⚠️ PollingManager: Poller "${pollerId}" already active, using existing`);
      }
      return pollerId;
    }

    console.log(`🔄 PollingManager: Starting NEW poller "${pollerId}" with ${baseInterval}ms base interval`);

    // Initialize error tracking
    this.pollerErrors.set(pollerId, {
      count: 0,
      lastError: null,
      backoffMultiplier: 1
    });

    // Create a stable reference to the callback
    const stableCallback = async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`PollingManager: Error in ${pollerId}:`, error);
      }
    };

    // Execute immediately
    this.executeCallback(pollerId, stableCallback);

    // Set up interval with error-aware scheduling
    const scheduleNext = () => {
      const errorInfo = this.pollerErrors.get(pollerId);
      if (!errorInfo) return; // Poller was stopped
      
      const currentInterval = baseInterval * errorInfo.backoffMultiplier;
      
      const timeoutId = setTimeout(() => {
        // Only continue if this poller is still active
        if (this.activePollers.has(pollerId)) {
          this.executeCallback(pollerId, stableCallback);
          scheduleNext(); // Schedule next execution
        }
      }, currentInterval);

      // Store the timeout ID
      this.activePollers.set(pollerId, timeoutId);
    };

    // Start the polling cycle
    scheduleNext();

    return pollerId;
  }

  async executeCallback(pollerId, callback) {
    try {
      // Only log in development if debug flag is set
      if (window.DEBUG_POLLING) {
        console.log(`⏰ PollingManager: Executing poller "${pollerId}"`);
      }
      await callback();
      
      // Reset error count on success
      const errorInfo = this.pollerErrors.get(pollerId);
      if (errorInfo && errorInfo.count > 0) {
        console.log(`✅ PollingManager: Poller "${pollerId}" recovered from errors`);
        errorInfo.count = 0;
        errorInfo.backoffMultiplier = 1;
      }
    } catch (error) {
      const errorInfo = this.pollerErrors.get(pollerId);
      if (errorInfo) {
        errorInfo.count++;
        errorInfo.lastError = error;
        
        // Exponential backoff: double the interval up to 5 minutes
        errorInfo.backoffMultiplier = Math.min(Math.pow(2, errorInfo.count - 1), 10);
        
        console.warn(`❌ PollingManager: Poller "${pollerId}" error #${errorInfo.count}, next retry in ${errorInfo.backoffMultiplier}x interval`);
      }
    }
  }

  stopPolling(pollerId, silent = false) {
    const timeoutId = this.activePollers.get(pollerId);
    if (timeoutId) {
      if (!silent) {
        console.log(`🛑 PollingManager: Stopping poller "${pollerId}"`);
      }
      clearTimeout(timeoutId);
      this.activePollers.delete(pollerId);
      this.pollerErrors.delete(pollerId);
      return true;
    }
    if (!silent && window.DEBUG_POLLING) {
      console.log(`⚠️ PollingManager: Poller "${pollerId}" not found`);
    }
    return false;
  }

  stopAllPolling() {
    console.log(`🛑 PollingManager: Stopping all ${this.activePollers.size} active pollers`);
    this.activePollers.forEach((timeoutId, pollerId) => {
      clearTimeout(timeoutId);
      console.log(`🛑 PollingManager: Stopped poller "${pollerId}"`);
    });
    this.activePollers.clear();
    this.pollerErrors.clear();
  }

  getActivePollers() {
    return Array.from(this.activePollers.keys());
  }

  isPolling(pollerId) {
    return this.activePollers.has(pollerId);
  }

  getPollerStatus(pollerId) {
    if (!this.activePollers.has(pollerId)) {
      return null;
    }
    
    const errorInfo = this.pollerErrors.get(pollerId);
    return {
      active: true,
      errorCount: errorInfo?.count || 0,
      lastError: errorInfo?.lastError || null,
      backoffMultiplier: errorInfo?.backoffMultiplier || 1
    };
  }
}

// Export singleton instance
export const pollingManager = new PollingManager();

// Helper hook for React components
export function usePolling(pollerId, callback, interval = 30000, dependencies = []) {
  const React = require('react');

  React.useEffect(() => {
    pollingManager.startPolling(pollerId, callback, interval);

    return () => {
      pollingManager.stopPolling(pollerId);
    };
  }, dependencies);
}