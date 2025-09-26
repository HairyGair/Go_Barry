// Global Polling Manager - Singleton Pattern
// Prevents multiple polling instances from running simultaneously

class GlobalPollingManager {
  constructor() {
    // Check if there's already an active instance
    if (window.__GLOBAL_POLLING_INSTANCE__) {
      console.log('⚠️ GlobalPollingManager: Instance already exists, returning existing one');
      return window.__GLOBAL_POLLING_INSTANCE__;
    }

    this.isPolling = false;
    this.pollingInterval = null;
    this.subscribers = new Set();
    this.lastData = null;
    this.instanceId = `polling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();

    console.log(`🔧 GlobalPollingManager created with ID: ${this.instanceId}`);

    // Store this instance globally to prevent duplicates
    window.__GLOBAL_POLLING_INSTANCE__ = this;

    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('❌ GlobalPollingManager: Callback must be a function');
      return () => {};
    }

    console.log(`📡 GlobalPollingManager: Adding subscriber (total: ${this.subscribers.size + 1})`);
    this.subscribers.add(callback);

    // If we have cached data, send it immediately
    if (this.lastData) {
      callback(this.lastData);
    }

    // Start polling if not already started
    this.startPolling();

    // Return unsubscribe function
    return () => {
      console.log(`📡 GlobalPollingManager: Removing subscriber (remaining: ${this.subscribers.size - 1})`);
      this.subscribers.delete(callback);

      // Stop polling if no subscribers
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  async startPolling() {
    // Double-check that we're still the active instance
    if (window.__GLOBAL_POLLING_INSTANCE__ !== this) {
      console.log('⚠️ GlobalPollingManager: This instance is not the active one, aborting start');
      return;
    }

    if (this.isPolling) {
      console.log('⚠️ GlobalPollingManager: Polling already active, skipping start');
      return;
    }

    // Check if there's already a global polling interval running
    if (window.__GLOBAL_POLLING_INTERVAL__) {
      console.log('⚠️ GlobalPollingManager: Global polling interval already exists, clearing it first');
      clearInterval(window.__GLOBAL_POLLING_INTERVAL__);
      window.__GLOBAL_POLLING_INTERVAL__ = null;
    }

    console.log(`🚀 GlobalPollingManager: Starting polling (ID: ${this.instanceId})`);
    this.isPolling = true;

    // Import the fetch function dynamically to avoid circular imports
    const { fetchDashboardData } = await import('./fetchDashboardData.js');

    // Fetch initial data immediately
    this.fetchAndNotify(fetchDashboardData);

    // Set up interval for subsequent fetches
    this.pollingInterval = setInterval(() => {
      // Verify we're still the active instance before fetching
      if (window.__GLOBAL_POLLING_INSTANCE__ === this) {
        this.fetchAndNotify(fetchDashboardData);
      } else {
        console.log('⚠️ GlobalPollingManager: No longer active instance, stopping polling');
        this.stopPolling();
      }
    }, 10000); // 10 second interval

    // Store the interval globally for additional safety
    window.__GLOBAL_POLLING_INTERVAL__ = this.pollingInterval;
  }

  async fetchAndNotify(fetchFunction) {
    try {
      const data = await fetchFunction();
      this.lastData = data;

      // Notify all subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ GlobalPollingManager: Error in subscriber callback:', error);
        }
      });

      console.log(`📊 GlobalPollingManager: Updated ${this.subscribers.size} subscribers`);
    } catch (error) {
      console.error('❌ GlobalPollingManager: Fetch error:', error);
    }
  }

  stopPolling() {
    if (!this.isPolling) {
      console.log('⚠️ GlobalPollingManager: Polling already stopped');
      return;
    }

    console.log(`🛑 GlobalPollingManager: Stopping polling (ID: ${this.instanceId})`);
    this.isPolling = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // Clear global interval reference
    if (window.__GLOBAL_POLLING_INTERVAL__ === this.pollingInterval) {
      window.__GLOBAL_POLLING_INTERVAL__ = null;
    }
  }

  cleanup() {
    console.log(`🧹 GlobalPollingManager: Cleaning up (ID: ${this.instanceId})`);
    this.stopPolling();
    this.subscribers.clear();

    // Clear global references if they point to this instance
    if (window.__GLOBAL_POLLING_INSTANCE__ === this) {
      window.__GLOBAL_POLLING_INSTANCE__ = null;
    }
    if (window.__GLOBAL_POLLING_INTERVAL__) {
      clearInterval(window.__GLOBAL_POLLING_INTERVAL__);
      window.__GLOBAL_POLLING_INTERVAL__ = null;
    }
  }

  getStatus() {
    return {
      isPolling: this.isPolling,
      subscriberCount: this.subscribers.size,
      instanceId: this.instanceId,
      hasData: !!this.lastData
    };
  }
}

// Create singleton instance
let globalPollingManagerInstance = null;

export function getGlobalPollingManager() {
  // First check if there's a global instance
  if (window.__GLOBAL_POLLING_INSTANCE__) {
    console.log('🔄 GlobalPollingManager: Using existing global instance');
    return window.__GLOBAL_POLLING_INSTANCE__;
  }

  // If no instance exists, create a new one
  if (!globalPollingManagerInstance) {
    console.log('🆕 GlobalPollingManager: Creating new instance');
    globalPollingManagerInstance = new GlobalPollingManager();
  }

  return globalPollingManagerInstance;
}

// Clean up on hot module reload in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Clean up any existing instances when this module reloads
  if (window.__GLOBAL_POLLING_INSTANCE__) {
    console.log('🔥 HMR: Cleaning up existing polling manager');
    window.__GLOBAL_POLLING_INSTANCE__.cleanup();
  }

  // Clear any dangling intervals
  if (window.__GLOBAL_POLLING_INTERVAL__) {
    console.log('🔥 HMR: Clearing dangling polling interval');
    clearInterval(window.__GLOBAL_POLLING_INTERVAL__);
    window.__GLOBAL_POLLING_INTERVAL__ = null;
  }
}

// For debugging - allow access from browser console
if (typeof window !== 'undefined') {
  window.getPollingManagerStatus = () => {
    const instance = window.__GLOBAL_POLLING_INSTANCE__ || globalPollingManagerInstance;
    if (instance) {
      return {
        ...instance.getStatus(),
        globalInstanceExists: !!window.__GLOBAL_POLLING_INSTANCE__,
        localInstanceExists: !!globalPollingManagerInstance,
        globalIntervalExists: !!window.__GLOBAL_POLLING_INTERVAL__
      };
    }
    return { error: 'No polling manager instance exists' };
  };

  // Allow manual cleanup from console
  window.cleanupPollingManager = () => {
    if (window.__GLOBAL_POLLING_INSTANCE__) {
      window.__GLOBAL_POLLING_INSTANCE__.cleanup();
    }
    if (globalPollingManagerInstance) {
      globalPollingManagerInstance.cleanup();
      globalPollingManagerInstance = null;
    }
    console.log('🧹 Manual cleanup completed');
  };
}