// Go_BARRY/services/supervisorPollingService.js
// Optimized polling service to replace WebSocket communication
// High-frequency polling with smart caching for instant supervisor-display sync

// ALWAYS use production URL - localhost doesn't work in Expo web
const API_BASE = 'https://go-barry.onrender.com';

class SupervisorPollingService {
  constructor() {
    this.pollInterval = null;
    this.listeners = new Set();
    this.cache = {
      acknowledgedAlerts: new Set(),
      priorityOverrides: new Map(),
      supervisorNotes: new Map(),
      customMessages: [],
      dismissedFromDisplay: new Set(),
      lockedOnDisplay: new Set(),
      connectedSupervisors: 0,
      activeSupervisors: [],
      lastUpdate: null
    };
    this.lastHash = null;
    this.pollFrequency = 2000; // 2 seconds for instant feel
    this.retryCount = 0;
    this.maxRetries = 5;
    this.backoffMultiplier = 1.5;
    this.sessionId = null;
  }

  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  // Start optimized polling
  startPolling() {
    if (this.pollInterval) return; // Already polling
    
    console.log('🚀 Starting optimized supervisor polling (2s intervals)');
    this.poll(); // Initial poll
    this.pollInterval = setInterval(() => this.poll(), this.pollFrequency);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('⏹️ Stopped supervisor polling');
    }
  }

  // Add listener for state changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of state changes
  notifyListeners(changes) {
    this.listeners.forEach(callback => {
      try {
        callback(changes);
      } catch (error) {
        console.error('❌ Error notifying polling listener:', error);
      }
    });
  }

  // Main polling function
  async poll() {
    console.log(`📊 Polling supervisor sync-status...`);
    try {
      const url = `${API_BASE}/api/supervisor/sync-status`;
      console.log(`🔗 Making request to: ${url}`);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: 5000 // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Sync-status response:`, {
        connectedSupervisors: data.connectedSupervisors,
        activeSupervisors: data.activeSupervisors?.length || 0
      });
      
      // Quick hash check to see if anything changed
      const currentHash = this.generateDataHash(data);
      if (currentHash === this.lastHash) {
        console.log(`⏭️ No changes detected, skipping update`);
        return;
      }
      
      this.lastHash = currentHash;
      this.retryCount = 0; // Reset retry count on success
      
      // Process changes and update cache
      const changes = this.processUpdates(data);
      
      if (Object.keys(changes).length > 0) {
        console.log('📊 Supervisor state updated:', changes);
        this.notifyListeners(changes);
      }

    } catch (error) {
      console.error('❌ Polling error:', error);
      this.handlePollingError(error);
    }
  }

  // Generate hash for quick change detection
  generateDataHash(data) {
    const hashString = JSON.stringify({
      acknowledgedAlerts: data.acknowledgedAlerts || [],
      priorityOverrides: data.priorityOverrides || {},
      supervisorNotes: data.supervisorNotes || {},
      customMessages: (data.customMessages || []).map(m => ({ id: m.id, timestamp: m.timestamp })),
      dismissedFromDisplay: data.dismissedFromDisplay || [],
      lockedOnDisplay: data.lockedOnDisplay || [],
      connectedSupervisors: data.connectedSupervisors || 0,
      activeSupervisors: (data.activeSupervisors || []).length
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Process updates and detect changes
  processUpdates(data) {
    const changes = {};

    // Check acknowledged alerts
    const newAcknowledged = new Set(data.acknowledgedAlerts || []);
    if (!this.setsEqual(newAcknowledged, this.cache.acknowledgedAlerts)) {
      changes.acknowledgedAlerts = newAcknowledged;
      this.cache.acknowledgedAlerts = newAcknowledged;
    }

    // Check priority overrides
    const newPriorityOverrides = new Map(Object.entries(data.priorityOverrides || {}));
    if (!this.mapsEqual(newPriorityOverrides, this.cache.priorityOverrides)) {
      changes.priorityOverrides = newPriorityOverrides;
      this.cache.priorityOverrides = newPriorityOverrides;
    }

    // Check supervisor notes
    const newSupervisorNotes = new Map(Object.entries(data.supervisorNotes || {}));
    if (!this.mapsEqual(newSupervisorNotes, this.cache.supervisorNotes)) {
      changes.supervisorNotes = newSupervisorNotes;
      this.cache.supervisorNotes = newSupervisorNotes;
    }

    // Check custom messages
    const newCustomMessages = data.customMessages || [];
    if (JSON.stringify(newCustomMessages) !== JSON.stringify(this.cache.customMessages)) {
      changes.customMessages = newCustomMessages;
      this.cache.customMessages = newCustomMessages;
    }

    // Check dismissed from display
    const newDismissedFromDisplay = new Set(data.dismissedFromDisplay || []);
    if (!this.setsEqual(newDismissedFromDisplay, this.cache.dismissedFromDisplay)) {
      changes.dismissedFromDisplay = newDismissedFromDisplay;
      this.cache.dismissedFromDisplay = newDismissedFromDisplay;
    }

    // Check locked on display
    const newLockedOnDisplay = new Set(data.lockedOnDisplay || []);
    if (!this.setsEqual(newLockedOnDisplay, this.cache.lockedOnDisplay)) {
      changes.lockedOnDisplay = newLockedOnDisplay;
      this.cache.lockedOnDisplay = newLockedOnDisplay;
    }

    // Check connected supervisors count
    const newConnectedSupervisors = data.connectedSupervisors || 0;
    if (newConnectedSupervisors !== this.cache.connectedSupervisors) {
      changes.connectedSupervisors = newConnectedSupervisors;
      this.cache.connectedSupervisors = newConnectedSupervisors;
    }

    // Check active supervisors
    const newActiveSupervisors = data.activeSupervisors || [];
    if (JSON.stringify(newActiveSupervisors) !== JSON.stringify(this.cache.activeSupervisors)) {
      changes.activeSupervisors = newActiveSupervisors;
      this.cache.activeSupervisors = newActiveSupervisors;
    }

    // Update last update time
    this.cache.lastUpdate = Date.now();
    
    return changes;
  }

  // Helper to compare sets
  setsEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (let item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  // Helper to compare maps
  mapsEqual(map1, map2) {
    if (map1.size !== map2.size) return false;
    for (let [key, value] of map1) {
      if (!map2.has(key) || JSON.stringify(map2.get(key)) !== JSON.stringify(value)) {
        return false;
      }
    }
    return true;
  }

  // Handle polling errors with exponential backoff
  handlePollingError(error) {
    this.retryCount++;
    
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Max polling retries reached, switching to slower polling');
      this.pollFrequency = 10000; // Slow down to 10 seconds
      this.retryCount = 0;
    } else {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(this.backoffMultiplier, this.retryCount), 10000);
      console.log(`⏳ Retrying poll in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        if (this.pollInterval) { // Only retry if still polling
          this.poll();
        }
      }, delay);
    }

    // Notify listeners of connection issues
    this.notifyListeners({
      error: error.message,
      retryCount: this.retryCount,
      connected: false
    });
  }

  // Supervisor action methods
  async acknowledgeAlert(alertId, reason, notes = '') {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/acknowledge-alert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alertId,
          reason,
          notes,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
      return false;
    }
  }

  async updateAlertPriority(alertId, priority, reason) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/update-priority`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alertId,
          priority: priority.toUpperCase(),
          reason,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to update priority: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error updating alert priority:', error);
      return false;
    }
  }

  async addNoteToAlert(alertId, note) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/add-note`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alertId,
          note,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to add note: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error adding note to alert:', error);
      return false;
    }
  }

  async broadcastMessage(message, priority = 'info', duration = 30000) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/broadcast-message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          priority: priority.toLowerCase(),
          duration,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to broadcast message: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
      return false;
    }
  }

  async dismissFromDisplay(alertId, reason) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/dismiss-from-display`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alertId,
          reason,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to dismiss from display: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error dismissing from display:', error);
      return false;
    }
  }

  async lockOnDisplay(alertId, reason) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/lock-on-display`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alertId,
          reason,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to lock on display: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error locking on display:', error);
      return false;
    }
  }

  async unlockFromDisplay(alertId, reason) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sessionId) {
        headers['x-session-id'] = this.sessionId;
      }

      const response = await fetch(`${API_BASE}/api/supervisor/unlock-from-display`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alertId,
          reason,
          timestamp: Date.now()
        }),
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to unlock from display: ${response.statusText}`);
      }

      // Immediate poll to get updated state
      this.poll();
      return true;

    } catch (error) {
      console.error('❌ Error unlocking from display:', error);
      return false;
    }
  }

  // Get current cached state
  getState() {
    return {
      ...this.cache,
      connected: this.retryCount < this.maxRetries,
      polling: !!this.pollInterval
    };
  }

  // Force immediate poll
  forceRefresh() {
    console.log('🔄 Force refreshing supervisor state...');
    this.lastHash = null; // Force update on next poll
    this.poll();
  }

  // Reset polling frequency to fast mode
  resetToFastPolling() {
    this.pollFrequency = 2000;
    this.retryCount = 0;
    console.log('⚡ Reset to fast polling (2s intervals)');
    
    // Restart polling with new frequency
    if (this.pollInterval) {
      this.stopPolling();
      this.startPolling();
    }
  }
}

// Create singleton instance
const supervisorPollingService = new SupervisorPollingService();

export default supervisorPollingService;
