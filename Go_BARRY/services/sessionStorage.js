// Go_BARRY/services/sessionStorage.js
// Browser-compatible session storage service for supervisor sessions

class SessionStorageService {
  constructor() {
    this.storageKey = 'barry_supervisor_session';
    this.isClient = typeof window !== 'undefined';
  }

  // Save supervisor session
  saveSession(sessionData) {
    if (!this.isClient) return false;
    
    try {
      const sessionWithTimestamp = {
        ...sessionData,
        savedAt: Date.now(),
        expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(sessionWithTimestamp));
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  // Load supervisor session
  loadSession() {
    if (!this.isClient) return null;
    
    try {
      const sessionStr = localStorage.getItem(this.storageKey);
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      
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
  }

  // Clear supervisor session
  clearSession() {
    if (!this.isClient) return;
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Check if session is valid
  isSessionValid() {
    const session = this.loadSession();
    return session !== null;
  }

  // Update session activity
  updateActivity() {
    const session = this.loadSession();
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session);
    }
  }
}

export default new SessionStorageService();
