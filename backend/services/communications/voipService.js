// backend/services/communications/voipService.js
// 8x8 VoIP Service for web-based calling integration
// Handles call logging, emergency numbers, and quick dial

class VoIPService {
  constructor() {
    this.webURL = process.env.EIGHTBYEIGHT_WEB_URL || 'https://apps.8x8.com/';
    this.activeCalls = new Map(); // sessionId -> call data
    this.callHistory = [];
    this.emergencyNumbers = [
      { name: 'Emergency Services', number: '999', type: 'emergency' },
      { name: 'Police', number: '101', type: 'emergency' },
      { name: 'NHS Direct', number: '111', type: 'emergency' },
      { name: 'Go North East Control', number: '0191 420 3000', type: 'internal' },
      { name: 'Nexus Travel Hotline', number: '0191 20 50 060', type: 'transport' }
    ];
    this.quickDialNumbers = [
      { name: 'Depot - Blyth', number: '01670 540 123', depot: 'BLY' },
      { name: 'Depot - Chester-le-Street', number: '0191 388 7272', depot: 'CHE' },
      { name: 'Depot - Consett', number: '01207 503 204', depot: 'CON' },
      { name: 'Depot - Hexham', number: '01434 600 599', depot: 'HEX' },
      { name: 'Depot - Peterlee', number: '0191 586 2992', depot: 'PMT' },
      { name: 'Depot - Riverside', number: '0191 420 3000', depot: 'RIV' },
      { name: 'Depot - Stanley', number: '01207 232 179', depot: 'STN' },
      { name: 'Depot - Washington', number: '0191 416 8262', depot: 'WAS' },
      { name: 'Depot - Winlaton', number: '0191 414 2318', depot: 'WBY' }
    ];
    
    console.log('📞 VoIP Service initialized with web URL:', this.webURL);
  }

  /**
   * Initialize VoIP service
   */
  async initialize() {
    try {
      console.log('📞 VoIP Service using web login approach');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize VoIP Service:', error);
      return false;
    }
  }

  /**
   * Log call session (for tracking purposes)
   */
  async logCallSession({ supervisorId, supervisorName, to, from, type = 'outbound' }) {
    const sessionId = this.generateSessionId();
    const callData = {
      sessionId,
      supervisorId,
      supervisorName,
      to,
      from,
      type,
      status: 'initiated',
      startedAt: Date.now(),
      isEmergency: this.isEmergencyNumber(to)
    };

    this.activeCalls.set(sessionId, callData);
    
    console.log(`📞 Call session logged: ${sessionId} (${supervisorName} -> ${to})`);
    
    // If emergency call, log with high priority
    if (callData.isEmergency) {
      console.log(`🚨 EMERGENCY CALL INITIATED: ${sessionId}`);
      this.handleEmergencyCall(callData);
    }

    return sessionId;
  }

  /**
   * Update call status
   */
  async updateCallStatus(sessionId, status, additionalData = {}) {
    const call = this.activeCalls.get(sessionId);
    if (!call) {
      console.warn(`⚠️ Call session not found: ${sessionId}`);
      return false;
    }

    call.status = status;
    call.lastUpdated = Date.now();
    
    // Update timing based on status
    switch (status) {
      case 'connected':
        call.connectedAt = Date.now();
        break;
      case 'ended':
        call.endedAt = Date.now();
        call.duration = call.connectedAt ? 
          Math.round((call.endedAt - call.connectedAt) / 1000) : 0;
        
        // Move to history and remove from active
        this.callHistory.unshift(call);
        this.activeCalls.delete(sessionId);
        
        // Keep only last 100 calls in memory
        if (this.callHistory.length > 100) {
          this.callHistory = this.callHistory.slice(0, 100);
        }
        break;
      case 'failed':
        call.endedAt = Date.now();
        call.duration = 0;
        call.failureReason = additionalData.reason || 'Unknown';
        
        // Move to history
        this.callHistory.unshift(call);
        this.activeCalls.delete(sessionId);
        break;
    }

    // Add any additional data
    Object.assign(call, additionalData);

    console.log(`📞 Call ${sessionId} status updated: ${status}`);
    return true;
  }

  /**
   * Handle emergency call logging
   */
  handleEmergencyCall(callData) {
    // Log emergency call with timestamp and supervisor details
    const emergencyLog = {
      timestamp: new Date().toISOString(),
      sessionId: callData.sessionId,
      supervisorId: callData.supervisorId,
      supervisorName: callData.supervisorName,
      number: callData.to,
      emergencyType: this.getEmergencyType(callData.to)
    };

    // This would typically be logged to a secure emergency call database
    console.log('🚨 EMERGENCY CALL LOG:', emergencyLog);
  }

  /**
   * Get emergency numbers list
   */
  getEmergencyNumbers() {
    return this.emergencyNumbers;
  }

  /**
   * Get quick dial numbers
   */
  getQuickDialNumbers() {
    return this.quickDialNumbers;
  }

  /**
   * Get quick dial numbers by depot
   */
  getQuickDialByDepot(depot) {
    return this.quickDialNumbers.filter(entry => entry.depot === depot);
  }

  /**
   * Add custom quick dial number
   */
  addQuickDialNumber(name, number, category = 'custom') {
    const entry = {
      name,
      number,
      category,
      addedAt: Date.now()
    };
    
    this.quickDialNumbers.push(entry);
    console.log(`📞 Quick dial number added: ${name} (${number})`);
    return entry;
  }

  /**
   * Get active calls
   */
  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  /**
   * Get call history
   */
  getCallHistory(limit = 50) {
    return this.callHistory.slice(0, limit);
  }

  /**
   * Get call statistics
   */
  getCallStats() {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    
    const todaysCalls = this.callHistory.filter(call => call.startedAt >= today);
    const emergencyCalls = this.callHistory.filter(call => call.isEmergency);
    
    const totalDuration = this.callHistory.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = this.callHistory.length > 0 ? totalDuration / this.callHistory.length : 0;

    return {
      totalCalls: this.callHistory.length,
      activeCalls: this.activeCalls.size,
      todaysCalls: todaysCalls.length,
      emergencyCalls: emergencyCalls.length,
      totalDuration: totalDuration,
      averageDuration: Math.round(avgDuration),
      lastCall: this.callHistory[0]?.startedAt || null
    };
  }

  /**
   * Check if number is emergency number
   */
  isEmergencyNumber(number) {
    const cleanNumber = number.replace(/\D/g, '');
    return ['999', '101', '111'].includes(cleanNumber) ||
           this.emergencyNumbers.some(em => em.number.replace(/\D/g, '') === cleanNumber);
  }

  /**
   * Get emergency type from number
   */
  getEmergencyType(number) {
    const emergency = this.emergencyNumbers.find(em => 
      em.number.replace(/\D/g, '') === number.replace(/\D/g, '')
    );
    return emergency?.type || 'emergency';
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `voip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get web URL for 8x8 login
   */
  getWebURL() {
    return this.webURL;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'VoIP Service',
      status: 'Ready',
      provider: '8x8 (Web Login)',
      webURL: this.webURL,
      activeCalls: this.activeCalls.size,
      totalNumbers: this.quickDialNumbers.length + this.emergencyNumbers.length,
      lastActivity: new Date().toISOString()
    };
  }

  /**
   * Search contacts/numbers
   */
  searchNumbers(query) {
    const searchTerm = query.toLowerCase();
    const results = [];

    // Search emergency numbers
    this.emergencyNumbers.forEach(entry => {
      if (entry.name.toLowerCase().includes(searchTerm) || 
          entry.number.includes(query)) {
        results.push({ ...entry, category: 'emergency' });
      }
    });

    // Search quick dial numbers
    this.quickDialNumbers.forEach(entry => {
      if (entry.name.toLowerCase().includes(searchTerm) || 
          entry.number.includes(query)) {
        results.push({ ...entry, category: entry.depot ? 'depot' : 'quick_dial' });
      }
    });

    return results;
  }
}

// Export singleton instance
export const voipService = new VoIPService();
export default voipService;