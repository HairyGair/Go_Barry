/**
 * Go North East - Breakdown Guide
 * Session Manager
 * Handles persistent storage, session recovery, and data management
 */

class SessionManager {
    constructor() {
        this.STORAGE_PREFIX = 'gne_breakdown_';
        this.SESSION_KEY = this.STORAGE_PREFIX + 'sessions';
        this.PREFERENCES_KEY = this.STORAGE_PREFIX + 'preferences';
        this.MAX_SESSIONS = 10;
        this.SESSION_EXPIRY_DAYS = 30;
    }

    // Initialize session manager
    init() {
        this.cleanupOldSessions();
        this.migrateOldData();
    }

    // Save a diagnostic session
    saveSession(sessionData) {
        const sessions = this.getAllSessions();
        
        const session = {
            id: this.generateSessionId(),
            timestamp: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: sessionData.status || 'in-progress', // in-progress, completed, abandoned
            issue: sessionData.issue,
            issueTitle: sessionData.issueTitle,
            currentStep: sessionData.currentStep,
            totalSteps: sessionData.totalSteps,
            responses: sessionData.responses || {},
            notes: sessionData.notes || '',
            outcome: sessionData.outcome || null,
            duration: sessionData.duration || 0,
            ...sessionData
        };

        // Update existing or add new
        const existingIndex = sessions.findIndex(s => 
            s.issue === session.issue && s.status === 'in-progress'
        );
        
        if (existingIndex !== -1) {
            sessions[existingIndex] = session;
        } else {
            sessions.unshift(session); // Add to beginning
        }

        // Keep only MAX_SESSIONS
        if (sessions.length > this.MAX_SESSIONS) {
            sessions.length = this.MAX_SESSIONS;
        }

        this.saveSessions(sessions);
        return session.id;
    }

    // Get all sessions
    getAllSessions() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load sessions:', error);
            return [];
        }
    }

    // Get in-progress sessions
    getInProgressSessions() {
        return this.getAllSessions().filter(s => s.status === 'in-progress');
    }

    // Get completed sessions
    getCompletedSessions() {
        return this.getAllSessions().filter(s => s.status === 'completed');
    }

    // Get session by ID
    getSessionById(id) {
        return this.getAllSessions().find(s => s.id === id);
    }

    // Get most recent session for an issue
    getRecentSessionForIssue(issueId) {
        const sessions = this.getAllSessions();
        return sessions.find(s => s.issue === issueId && s.status === 'in-progress');
    }

    // Update session status
    updateSessionStatus(id, status, additionalData = {}) {
        const sessions = this.getAllSessions();
        const session = sessions.find(s => s.id === id);
        
        if (session) {
            session.status = status;
            session.lastUpdated = new Date().toISOString();
            Object.assign(session, additionalData);
            this.saveSessions(sessions);
        }
    }

    // Delete session
    deleteSession(id) {
        const sessions = this.getAllSessions();
        const filtered = sessions.filter(s => s.id !== id);
        this.saveSessions(filtered);
    }

    // Save user preferences
    savePreferences(preferences) {
        try {
            const current = this.getPreferences();
            const updated = { ...current, ...preferences };
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    // Get user preferences
    getPreferences() {
        try {
            const data = localStorage.getItem(this.PREFERENCES_KEY);
            return data ? JSON.parse(data) : this.getDefaultPreferences();
        } catch (error) {
            console.error('Failed to load preferences:', error);
            return this.getDefaultPreferences();
        }
    }

    // Get default preferences
    getDefaultPreferences() {
        return {
            viewMode: 'grid', // grid or list
            sortBy: 'priority', // priority, alphabetical, recent
            showRecentSection: true,
            autoSaveInterval: 30000, // 30 seconds
            confirmExit: true,
            pinnedIssues: [],
            theme: 'light' // for future dark mode
        };
    }

    // Clean up old sessions
    cleanupOldSessions() {
        const sessions = this.getAllSessions();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.SESSION_EXPIRY_DAYS);
        
        const filtered = sessions.filter(session => {
            const sessionDate = new Date(session.lastUpdated || session.timestamp);
            return sessionDate > cutoffDate;
        });
        
        if (filtered.length < sessions.length) {
            console.log(`Cleaned up ${sessions.length - filtered.length} old sessions`);
            this.saveSessions(filtered);
        }
    }

    // Export session data
    exportSession(id) {
        const session = this.getSessionById(id);
        if (!session) return null;
        
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            session: session
        };
        
        return {
            filename: `diagnostic_${session.issue}_${session.id}.json`,
            data: JSON.stringify(exportData, null, 2)
        };
    }

    // Export all sessions
    exportAllSessions() {
        const sessions = this.getAllSessions();
        const preferences = this.getPreferences();
        
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            sessions: sessions,
            preferences: preferences
        };
        
        return {
            filename: `breakdown_guide_export_${new Date().toISOString().split('T')[0]}.json`,
            data: JSON.stringify(exportData, null, 2)
        };
    }

    // Import sessions
    importSessions(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.version !== '1.0') {
                throw new Error('Incompatible version');
            }
            
            if (data.sessions) {
                // Merge with existing sessions
                const existing = this.getAllSessions();
                const imported = data.sessions;
                
                // Add imported sessions that don't exist
                imported.forEach(importedSession => {
                    if (!existing.find(s => s.id === importedSession.id)) {
                        existing.push(importedSession);
                    }
                });
                
                this.saveSessions(existing);
            }
            
            if (data.preferences) {
                this.savePreferences(data.preferences);
            }
            
            return { success: true, count: data.sessions ? data.sessions.length : 0 };
        } catch (error) {
            console.error('Failed to import sessions:', error);
            return { success: false, error: error.message };
        }
    }

    // Get storage usage info
    getStorageInfo() {
        let totalSize = 0;
        
        for (let key in localStorage) {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        
        return {
            usedBytes: totalSize,
            usedKB: (totalSize / 1024).toFixed(2),
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            sessionCount: this.getAllSessions().length,
            estimatedLimit: '10 MB' // Browser typical limit
        };
    }

    // Clear all data
    clearAllData() {
        const keys = [];
        for (let key in localStorage) {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                keys.push(key);
            }
        }
        
        keys.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keys.length} storage items`);
    }

    // Private methods
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveSessions(sessions) {
        try {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessions));
        } catch (error) {
            console.error('Failed to save sessions:', error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
        }
    }

    handleQuotaExceeded() {
        // Remove oldest completed sessions
        const sessions = this.getAllSessions();
        const completed = sessions.filter(s => s.status === 'completed')
            .sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
        
        if (completed.length > 0) {
            // Remove oldest 25% of completed sessions
            const toRemove = Math.ceil(completed.length * 0.25);
            const remaining = sessions.filter(s => 
                !completed.slice(0, toRemove).find(c => c.id === s.id)
            );
            
            this.saveSessions(remaining);
            console.log(`Removed ${toRemove} old sessions due to storage quota`);
        }
    }

    migrateOldData() {
        // Migrate any old format data to new format
        // This ensures backward compatibility
        try {
            // Check for old wizard progress data
            for (let key in localStorage) {
                if (key.includes('wizard_progress_') && !key.startsWith(this.STORAGE_PREFIX)) {
                    const oldData = localStorage.getItem(key);
                    const newKey = this.STORAGE_PREFIX + key;
                    localStorage.setItem(newKey, oldData);
                    localStorage.removeItem(key);
                    console.log(`Migrated ${key} to new format`);
                }
            }
        } catch (error) {
            console.error('Migration error:', error);
        }
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}