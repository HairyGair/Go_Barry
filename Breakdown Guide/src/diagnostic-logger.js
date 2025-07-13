/**
 * Comprehensive Action Logging System
 * Tracks all user decisions, step progressions, and outcomes for audit trails
 * Phase 6 - Enhanced Features
 */

// ==================================================
// DIAGNOSTIC LOGGER CLASS
// ==================================================
class DiagnosticLogger {
    constructor() {
        this.currentSession = null;
        this.sessionHistory = [];
        this.storageKey = 'breakdownGuide_diagnosticLogs';
        this.maxHistoryItems = 100;
        
        // Load existing logs
        this.loadStoredLogs();
    }

    /**
     * Start a new diagnostic session
     */
    startSession(issueId, issueTitle, userId = null) {
        const sessionId = this.generateSessionId();
        
        this.currentSession = {
            sessionId: sessionId,
            issueId: issueId,
            issueTitle: issueTitle,
            userId: userId || 'unknown',
            userAgent: navigator.userAgent,
            startTime: new Date().toISOString(),
            endTime: null,
            steps: [],
            decisions: [],
            notes: [],
            outcome: null,
            duration: null,
            completed: false,
            metadata: {
                browserInfo: this.getBrowserInfo(),
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timestamp: Date.now()
            }
        };

        this.logEvent('SESSION_START', {
            sessionId: sessionId,
            issueId: issueId,
            issueTitle: issueTitle
        });

        return sessionId;
    }

    /**
     * Log a step progression
     */
    logStep(stepNumber, stepTitle, stepType, content) {
        if (!this.currentSession) {
            console.warn('No active session - cannot log step');
            return;
        }

        const stepLog = {
            stepId: `step_${stepNumber}`,
            stepNumber: stepNumber,
            stepTitle: stepTitle,
            stepType: stepType,
            content: content,
            timestamp: new Date().toISOString(),
            timeFromStart: Date.now() - new Date(this.currentSession.startTime).getTime(),
            userInteraction: {
                scrollPosition: window.pageYOffset,
                focusElement: document.activeElement.tagName || 'unknown'
            }
        };

        this.currentSession.steps.push(stepLog);
        
        this.logEvent('STEP_PROGRESSION', {
            stepNumber: stepNumber,
            stepTitle: stepTitle,
            stepType: stepType
        });

        this.saveCurrentSession();
    }

    /**
     * Log a user decision
     */
    logDecision(stepNumber, question, selectedOption, optionIndex, severity = null) {
        if (!this.currentSession) {
            console.warn('No active session - cannot log decision');
            return;
        }

        const decisionLog = {
            decisionId: `decision_${this.currentSession.decisions.length + 1}`,
            stepNumber: stepNumber,
            question: question,
            selectedOption: selectedOption,
            optionIndex: optionIndex,
            severity: severity,
            timestamp: new Date().toISOString(),
            timeFromStart: Date.now() - new Date(this.currentSession.startTime).getTime(),
            hesitationTime: this.calculateHesitationTime(),
            context: {
                previousDecisions: this.currentSession.decisions.length,
                currentPath: this.getCurrentDecisionPath()
            }
        };

        this.currentSession.decisions.push(decisionLog);
        
        this.logEvent('DECISION_MADE', {
            stepNumber: stepNumber,
            selectedOption: selectedOption,
            severity: severity
        });

        this.saveCurrentSession();
    }

    /**
     * Log notes and observations
     */
    logNote(noteText, stepNumber = null, noteType = 'general') {
        if (!this.currentSession) {
            console.warn('No active session - cannot log note');
            return;
        }

        const noteLog = {
            noteId: `note_${this.currentSession.notes.length + 1}`,
            noteText: noteText,
            noteType: noteType, // 'general', 'observation', 'action', 'contact'
            stepNumber: stepNumber,
            timestamp: new Date().toISOString(),
            timeFromStart: Date.now() - new Date(this.currentSession.startTime).getTime(),
            characterCount: noteText.length
        };

        this.currentSession.notes.push(noteLog);
        
        this.logEvent('NOTE_ADDED', {
            noteType: noteType,
            stepNumber: stepNumber,
            characterCount: noteText.length
        });

        this.saveCurrentSession();
    }

    /**
     * Log final outcome
     */
    logOutcome(outcome, severity, contacts = [], actions = [], stopReason = null) {
        if (!this.currentSession) {
            console.warn('No active session - cannot log outcome');
            return;
        }

        const outcomeLog = {
            outcome: outcome,
            severity: severity, // 'continue', 'warning', 'stop', 'critical'
            stopReason: stopReason,
            contacts: contacts,
            actions: actions,
            timestamp: new Date().toISOString(),
            timeFromStart: Date.now() - new Date(this.currentSession.startTime).getTime(),
            totalSteps: this.currentSession.steps.length,
            totalDecisions: this.currentSession.decisions.length,
            decisionPath: this.getCurrentDecisionPath()
        };

        this.currentSession.outcome = outcomeLog;
        
        this.logEvent('OUTCOME_REACHED', {
            outcome: outcome,
            severity: severity,
            totalSteps: this.currentSession.steps.length
        });

        this.saveCurrentSession();
    }

    /**
     * Complete the current session
     */
    completeSession() {
        if (!this.currentSession) {
            console.warn('No active session to complete');
            return;
        }

        const endTime = new Date().toISOString();
        const duration = Date.now() - new Date(this.currentSession.startTime).getTime();

        this.currentSession.endTime = endTime;
        this.currentSession.duration = duration;
        this.currentSession.completed = true;

        // Calculate session statistics
        this.currentSession.statistics = this.calculateSessionStatistics();

        // Add to history
        this.sessionHistory.unshift(this.currentSession);
        
        // Limit history size
        if (this.sessionHistory.length > this.maxHistoryItems) {
            this.sessionHistory = this.sessionHistory.slice(0, this.maxHistoryItems);
        }

        this.logEvent('SESSION_COMPLETE', {
            sessionId: this.currentSession.sessionId,
            duration: duration,
            totalSteps: this.currentSession.steps.length,
            totalDecisions: this.currentSession.decisions.length
        });

        // Save to storage
        this.saveToStorage();

        // Clear current session
        const completedSession = this.currentSession;
        this.currentSession = null;

        return completedSession;
    }

    /**
     * Generate audit trail report
     */
    generateAuditTrail(sessionId = null) {
        let sessions = sessionId ? 
            [this.getSession(sessionId)] : 
            this.sessionHistory;

        if (!sessions || sessions.length === 0) {
            return null;
        }

        const auditTrail = {
            reportGenerated: new Date().toISOString(),
            reportType: sessionId ? 'single_session' : 'full_history',
            totalSessions: sessions.length,
            sessions: sessions.map(session => this.formatSessionForAudit(session)),
            summary: this.generateAuditSummary(sessions)
        };

        return auditTrail;
    }

    /**
     * Export logs to CSV format
     */
    exportToCSV(sessionId = null) {
        const auditTrail = this.generateAuditTrail(sessionId);
        if (!auditTrail) return null;

        let csvContent = '';
        
        // Headers
        csvContent += 'Session ID,Issue,User,Start Time,End Time,Duration (ms),Steps,Decisions,Outcome,Severity,Completed\n';
        
        // Session data
        auditTrail.sessions.forEach(session => {
            csvContent += [
                session.sessionId,
                `"${session.issueTitle}"`,
                session.userId,
                session.startTime,
                session.endTime || 'N/A',
                session.duration || 'N/A',
                session.steps.length,
                session.decisions.length,
                `"${session.outcome ? session.outcome.outcome : 'N/A'}"`,
                session.outcome ? session.outcome.severity : 'N/A',
                session.completed
            ].join(',') + '\n';
        });

        return csvContent;
    }

    // ==================================================
    // UTILITY METHODS
    // ==================================================

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    logEvent(eventType, data) {
        // Console logging for debugging
        console.log(`[DiagnosticLogger] ${eventType}:`, data);
        
        // Could be extended to send to analytics service
    }

    calculateHesitationTime() {
        // Simple hesitation calculation - could be enhanced with mouse tracking
        return Math.random() * 5000; // Placeholder
    }

    getCurrentDecisionPath() {
        if (!this.currentSession) return [];
        
        return this.currentSession.decisions.map(decision => ({
            step: decision.stepNumber,
            option: decision.optionIndex,
            severity: decision.severity
        }));
    }

    calculateSessionStatistics() {
        if (!this.currentSession) return null;

        return {
            averageStepTime: this.currentSession.duration / this.currentSession.steps.length,
            criticalDecisions: this.currentSession.decisions.filter(d => d.severity === 'critical').length,
            notesTaken: this.currentSession.notes.length,
            completionRate: this.currentSession.completed ? 100 : 
                (this.currentSession.steps.length / this.getExpectedStepCount()) * 100
        };
    }

    getExpectedStepCount() {
        // This would be determined by the diagnostic flow
        return 10; // Placeholder
    }

    formatSessionForAudit(session) {
        return {
            sessionId: session.sessionId,
            issueId: session.issueId,
            issueTitle: session.issueTitle,
            userId: session.userId,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            steps: session.steps,
            decisions: session.decisions,
            notes: session.notes,
            outcome: session.outcome,
            completed: session.completed,
            statistics: session.statistics
        };
    }

    generateAuditSummary(sessions) {
        const completedSessions = sessions.filter(s => s.completed);
        const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        
        return {
            totalSessions: sessions.length,
            completedSessions: completedSessions.length,
            averageDuration: completedSessions.length > 0 ? totalDuration / completedSessions.length : 0,
            mostCommonIssues: this.getMostCommonIssues(sessions),
            severityDistribution: this.getSeverityDistribution(sessions),
            completionRate: (completedSessions.length / sessions.length) * 100
        };
    }

    getMostCommonIssues(sessions) {
        const issueCounts = {};
        sessions.forEach(session => {
            issueCounts[session.issueTitle] = (issueCounts[session.issueTitle] || 0) + 1;
        });
        
        return Object.entries(issueCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
    }

    getSeverityDistribution(sessions) {
        const distribution = { continue: 0, warning: 0, stop: 0, critical: 0 };
        sessions.forEach(session => {
            if (session.outcome && session.outcome.severity) {
                distribution[session.outcome.severity]++;
            }
        });
        return distribution;
    }

    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    getSession(sessionId) {
        return this.sessionHistory.find(session => session.sessionId === sessionId);
    }

    saveCurrentSession() {
        if (this.currentSession) {
            localStorage.setItem('breakdownGuide_currentSession', JSON.stringify(this.currentSession));
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.sessionHistory));
        } catch (e) {
            console.error('Failed to save diagnostic logs:', e);
        }
    }

    loadStoredLogs() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.sessionHistory = JSON.parse(stored);
            }
            
            // Load current session if exists
            const currentStored = localStorage.getItem('breakdownGuide_currentSession');
            if (currentStored) {
                this.currentSession = JSON.parse(currentStored);
            }
        } catch (e) {
            console.error('Failed to load diagnostic logs:', e);
            this.sessionHistory = [];
        }
    }

    clearLogs() {
        this.sessionHistory = [];
        this.currentSession = null;
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem('breakdownGuide_currentSession');
    }
}

// ==================================================
// ENHANCED SESSION MANAGER
// ==================================================
class EnhancedSessionManager {
    constructor(logger) {
        this.logger = logger;
        this.currentState = null;
        this.stateHistory = [];
        this.maxStateHistory = 50;
    }

    startDiagnostic(issueId, issueTitle, userId = null) {
        // Start logging session
        const sessionId = this.logger.startSession(issueId, issueTitle, userId);
        
        // Initialize state
        this.currentState = {
            sessionId: sessionId,
            issueId: issueId,
            currentStep: 0,
            stepHistory: [],
            userInputs: {},
            notes: '',
            startTime: new Date().toISOString()
        };

        // Log initial state
        this.logger.logStep(0, 'Diagnostic Started', 'start', `Starting diagnostic for ${issueTitle}`);
        
        return sessionId;
    }

    progressToStep(stepNumber, stepData) {
        if (!this.currentState) {
            throw new Error('No active diagnostic session');
        }

        // Log step progression
        this.logger.logStep(
            stepNumber, 
            stepData.title || `Step ${stepNumber}`, 
            stepData.type || 'unknown',
            stepData.content || ''
        );

        // Update state
        this.currentState.stepHistory.push({
            stepNumber: this.currentState.currentStep,
            timestamp: new Date().toISOString()
        });
        
        this.currentState.currentStep = stepNumber;
        
        // Save state
        this.saveState();
    }

    recordDecision(question, selectedOption, optionIndex, severity = null) {
        if (!this.currentState) {
            throw new Error('No active diagnostic session');
        }

        // Log decision
        this.logger.logDecision(
            this.currentState.currentStep,
            question,
            selectedOption,
            optionIndex,
            severity
        );

        // Store decision in state
        this.currentState.userInputs[`step_${this.currentState.currentStep}`] = {
            question: question,
            selectedOption: selectedOption,
            optionIndex: optionIndex,
            severity: severity,
            timestamp: new Date().toISOString()
        };

        this.saveState();
    }

    addNote(noteText, noteType = 'general') {
        if (!this.currentState) {
            throw new Error('No active diagnostic session');
        }

        // Log note
        this.logger.logNote(noteText, this.currentState.currentStep, noteType);
        
        // Update state notes
        this.currentState.notes = noteText;
        this.saveState();
    }

    completeSession(outcome, severity, contacts = [], actions = [], stopReason = null) {
        if (!this.currentState) {
            throw new Error('No active diagnostic session');
        }

        // Log outcome
        this.logger.logOutcome(outcome, severity, contacts, actions, stopReason);
        
        // Complete logging session
        const completedSession = this.logger.completeSession();
        
        // Add to state history
        this.stateHistory.unshift({
            ...this.currentState,
            outcome: outcome,
            severity: severity,
            completed: true,
            endTime: new Date().toISOString()
        });

        // Limit history
        if (this.stateHistory.length > this.maxStateHistory) {
            this.stateHistory = this.stateHistory.slice(0, this.maxStateHistory);
        }

        // Clear current state
        this.currentState = null;
        this.clearCurrentState();

        return completedSession;
    }

    saveState() {
        if (this.currentState) {
            localStorage.setItem('breakdownGuide_sessionState', JSON.stringify(this.currentState));
        }
    }

    loadState() {
        try {
            const stored = localStorage.getItem('breakdownGuide_sessionState');
            if (stored) {
                this.currentState = JSON.parse(stored);
                return this.currentState;
            }
        } catch (e) {
            console.error('Failed to load session state:', e);
        }
        return null;
    }

    clearCurrentState() {
        localStorage.removeItem('breakdownGuide_sessionState');
    }

    getCurrentState() {
        return this.currentState;
    }

    getStateHistory() {
        return this.stateHistory;
    }
}

// ==================================================
// INITIALIZATION AND EXPORT
// ==================================================

// Initialize global instances
window.diagnosticLogger = new DiagnosticLogger();
window.sessionManager = new EnhancedSessionManager(window.diagnosticLogger);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DiagnosticLogger,
        EnhancedSessionManager
    };
}