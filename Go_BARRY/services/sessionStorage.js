// Go_BARRY/services/sessionStorage.js
// In-memory session storage service for supervisor sessions (Claude artifact compatible)

class SessionStorageService {
  constructor() {
    this.storageKey = 'barry_supervisor_session';
    this.isClient = typeof window !== 'undefined';
    // Use in-memory storage instead of localStorage
    this.memoryStorage = new Map();
  }

  // Save supervisor session
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
  }

  // Load supervisor session
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
  }

  // Clear supervisor session
  clearSession() {
    try {
      this.memoryStorage.delete(this.storageKey);
      console.log('✅ Session cleared from memory storage');
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
