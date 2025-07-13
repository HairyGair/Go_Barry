/**
 * Logging System Integration & UI Components
 * Integrates comprehensive logging with existing app and adds management UI
 */

// ==================================================
// LOGGING INTEGRATION LAYER
// ==================================================
class LoggingIntegration {
    constructor() {
        this.isInitialized = false;
        this.currentUserId = null;
    }

    initialize() {
        if (this.isInitialized) return;

        // Wait for DOM and existing app to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
        } else {
            this.setupIntegration();
        }

        this.isInitialized = true;
    }

    setupIntegration() {
        // Override existing startDiagnostic function to include logging
        if (typeof window.startDiagnostic === 'function') {
            const originalStartDiagnostic = window.startDiagnostic;
            window.startDiagnostic = (issueId) => {
                const flow = diagnosticFlows[issueId];
                if (flow) {
                    // Start logging session
                    window.sessionManager.startDiagnostic(issueId, flow.title, this.getCurrentUserId());
                }
                return originalStartDiagnostic(issueId);
            };
        }

        // Override existing wizard progression functions
        this.enhanceWizardFunctions();

        // Add logging controls to UI
        this.addLoggingUI();

        // Set up automatic note saving
        this.setupNoteSaving();

        console.log('Logging integration initialized successfully');
    }

    enhanceWizardFunctions() {
        // Enhanced displayStep function with logging
        if (typeof window.displayStep === 'function') {
            const originalDisplayStep = window.displayStep;
            window.displayStep = () => {
                const result = originalDisplayStep();
                
                // Log step progression
                if (window.appState && window.appState.currentIssue && window.sessionManager.currentState) {
                    const flow = diagnosticFlows[window.appState.currentIssue];
                    const step = flow.steps[window.appState.currentStep];
                    
                    window.sessionManager.progressToStep(window.appState.currentStep, {
                        title: step.title,
                        type: step.type,
                        content: step.content
                    });
                }
                
                return result;
            };
        }

        // Enhanced option click handling with decision logging
        if (typeof window.handleOptionClick === 'function') {
            const originalHandleOptionClick = window.handleOptionClick;
            window.handleOptionClick = (option) => {
                // Log the decision
                if (window.sessionManager.currentState) {
                    const flow = diagnosticFlows[window.appState.currentIssue];
                    const step = flow.steps[window.appState.currentStep];
                    
                    const optionIndex = step.options ? step.options.indexOf(option) : -1;
                    
                    window.sessionManager.recordDecision(
                        step.content || step.title,
                        option.text,
                        optionIndex,
                        option.severity
                    );
                }
                
                return originalHandleOptionClick(option);
            };
        }

        // Enhanced completion function with outcome logging
        if (typeof window.completeDiagnosis === 'function') {
            const originalCompleteDiagnosis = window.completeDiagnosis;
            window.completeDiagnosis = () => {
                // Log the final outcome
                if (window.sessionManager.currentState && window.appState.currentIssue) {
                    const flow = diagnosticFlows[window.appState.currentIssue];
                    const currentStep = flow.steps[window.appState.currentStep];
                    
                    if (currentStep && currentStep.type === 'final') {
                        window.sessionManager.completeSession(
                            currentStep.result || currentStep.title,
                            currentStep.severity || 'continue',
                            currentStep.contacts || [],
                            currentStep.actions || [],
                            currentStep.stopReason
                        );
                    }
                }
                
                return originalCompleteDiagnosis();
            };
        }
    }

    addLoggingUI() {
        // Add logging controls to the header
        this.addHeaderControls();
        
        // Add session history modal
        this.addSessionHistoryModal();
        
        // Add export functionality
        this.addExportControls();
        
        // Enhance the existing Recent Logs functionality
        this.enhanceRecentLogs();
    }

    addHeaderControls() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        // Create logging status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'logging-status';
        statusIndicator.innerHTML = `
            <span class="status-icon" id="loggingStatusIcon">📊</span>
            <span class="status-text" id="loggingStatusText">Logging Active</span>
        `;

        // Create session info button
        const sessionInfoBtn = document.createElement('button');
        sessionInfoBtn.className = 'header-button';
        sessionInfoBtn.innerHTML = `
            <span class="icon">📋</span>
            <span class="button-text">Session Logs</span>
        `;
        sessionInfoBtn.addEventListener('click', () => this.showSessionHistory());

        headerActions.appendChild(statusIndicator);
        headerActions.appendChild(sessionInfoBtn);
    }

    addSessionHistoryModal() {
        const modalHTML = `
            <div class="modal" id="sessionHistoryModal" role="dialog" aria-labelledby="sessionHistoryTitle" aria-hidden="true">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h2 id="sessionHistoryTitle">📊 Session History & Logs</h2>
                        <button class="modal-close" id="closeSessionHistoryBtn" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="session-controls">
                            <div class="control-group">
                                <label for="userIdInput">User ID:</label>
                                <input type="text" id="userIdInput" placeholder="Enter your ID" />
                                <button id="setUserIdBtn">Set User ID</button>
                            </div>
                            <div class="control-group">
                                <button id="exportAllBtn" class="btn btn-primary">Export All Sessions</button>
                                <button id="clearLogsBtn" class="btn btn-secondary">Clear All Logs</button>
                            </div>
                        </div>
                        <div class="session-summary" id="sessionSummary">
                            <!-- Summary will be populated here -->
                        </div>
                        <div class="session-list" id="sessionList">
                            <!-- Session list will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        document.getElementById('closeSessionHistoryBtn').addEventListener('click', () => {
            document.getElementById('sessionHistoryModal').style.display = 'none';
        });

        document.getElementById('setUserIdBtn').addEventListener('click', () => {
            const userId = document.getElementById('userIdInput').value.trim();
            if (userId) {
                this.setUserId(userId);
                this.updateLoggingStatus();
            }
        });

        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportAllSessions();
        });

        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all diagnostic logs? This cannot be undone.')) {
                window.diagnosticLogger.clearLogs();
                this.updateSessionHistoryDisplay();
            }
        });
    }

    addExportControls() {
        // Add styles for export functionality
        const exportStyles = `
            <style>
                .logging-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(0, 123, 255, 0.1);
                    border-radius: 6px;
                    font-size: 14px;
                }

                .logging-status.inactive {
                    background: rgba(128, 128, 128, 0.1);
                }

                .large-modal .modal-content {
                    max-width: 800px;
                    width: 90%;
                }

                .session-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .control-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .session-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .summary-card {
                    padding: 15px;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    text-align: center;
                }

                .summary-card h3 {
                    margin: 0 0 10px 0;
                    font-size: 24px;
                    color: #007bff;
                }

                .summary-card p {
                    margin: 0;
                    font-size: 14px;
                    color: #6c757d;
                }

                .session-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    background: white;
                }

                .session-info h4 {
                    margin: 0 0 5px 0;
                    color: #333;
                }

                .session-meta {
                    font-size: 12px;
                    color: #6c757d;
                }

                .session-actions {
                    display: flex;
                    gap: 10px;
                }

                .btn-small {
                    padding: 4px 8px;
                    font-size: 12px;
                    border-radius: 4px;
                }

                .severity-badge {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .severity-continue {
                    background: #d4edda;
                    color: #155724;
                }

                .severity-warning {
                    background: #fff3cd;
                    color: #856404;
                }

                .severity-stop {
                    background: #f8d7da;
                    color: #721c24;
                }

                .severity-critical {
                    background: #f5c6cb;
                    color: #721c24;
                }

                .session-detail-tabs {
                    display: flex;
                    border-bottom: 1px solid #dee2e6;
                    margin-bottom: 20px;
                }
                
                .tab-btn {
                    padding: 10px 20px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                }
                
                .tab-btn.active {
                    border-bottom-color: #007bff;
                    color: #007bff;
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                .detail-grid, .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 15px 0;
                }
                
                .timeline-item {
                    display: flex;
                    padding: 10px;
                    margin: 5px 0;
                    border-left: 4px solid #007bff;
                    background: #f8f9fa;
                }
                
                .timeline-decision {
                    border-left-color: #ffc107;
                }
                
                .timeline-note {
                    border-left-color: #28a745;
                }
                
                .timeline-time {
                    min-width: 80px;
                    font-size: 12px;
                    color: #6c757d;
                }
                
                .decision-item, .note-item {
                    padding: 15px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                
                .decision-meta, .note-header {
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 5px;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', exportStyles);
    }

    enhanceRecentLogs() {
        // Replace the placeholder Recent Logs functionality
        const recentLogsBtn = document.getElementById('recentLogsBtn');
        if (recentLogsBtn) {
            // Remove existing event listeners
            recentLogsBtn.replaceWith(recentLogsBtn.cloneNode(true));
            
            // Add new functionality
            document.getElementById('recentLogsBtn').addEventListener('click', () => {
                this.showSessionHistory();
            });
        }
    }

    showSessionHistory() {
        const modal = document.getElementById('sessionHistoryModal');
        if (modal) {
            modal.style.display = 'block';
            this.updateSessionHistoryDisplay();
        }
    }

    updateSessionHistoryDisplay() {
        const auditTrail = window.diagnosticLogger.generateAuditTrail();
        
        // Update summary
        this.updateSessionSummary(auditTrail);
        
        // Update session list
        this.updateSessionList(auditTrail);
    }

    updateSessionSummary(auditTrail) {
        const summaryContainer = document.getElementById('sessionSummary');
        if (!summaryContainer || !auditTrail) return;

        const summary = auditTrail.summary;
        
        summaryContainer.innerHTML = `
            <div class="summary-card">
                <h3>${summary.totalSessions}</h3>
                <p>Total Sessions</p>
            </div>
            <div class="summary-card">
                <h3>${summary.completedSessions}</h3>
                <p>Completed</p>
            </div>
            <div class="summary-card">
                <h3>${Math.round(summary.averageDuration / 1000)}s</h3>
                <p>Avg Duration</p>
            </div>
            <div class="summary-card">
                <h3>${Math.round(summary.completionRate)}%</h3>
                <p>Completion Rate</p>
            </div>
        `;
    }

    updateSessionList(auditTrail) {
        const listContainer = document.getElementById('sessionList');
        if (!listContainer || !auditTrail) {
            listContainer.innerHTML = '<p>No diagnostic sessions found.</p>';
            return;
        }

        const sessions = auditTrail.sessions.slice(0, 20); // Show latest 20 sessions
        
        listContainer.innerHTML = sessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <h4>${session.issueTitle}</h4>
                    <div class="session-meta">
                        <span>User: ${session.userId}</span> • 
                        <span>Duration: ${session.duration ? Math.round(session.duration / 1000) + 's' : 'N/A'}</span> • 
                        <span>Steps: ${session.steps.length}</span> • 
                        <span>Decisions: ${session.decisions.length}</span>
                        ${session.outcome ? `<span class="severity-badge severity-${session.outcome.severity}">${session.outcome.severity}</span>` : ''}
                    </div>
                    <div class="session-meta">
                        <small>${new Date(session.startTime).toLocaleString()}</small>
                    </div>
                </div>
                <div class="session-actions">
                    <button class="btn btn-small btn-primary" onclick="loggingIntegration.viewSessionDetails('${session.sessionId}')">
                        View Details
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="loggingIntegration.exportSession('${session.sessionId}')">
                        Export
                    </button>
                </div>
            </div>
        `).join('');
    }

    exportSession(sessionId) {
        const csvContent = window.diagnosticLogger.exportToCSV(sessionId);
        if (csvContent) {
            this.downloadCSV(csvContent, `diagnostic-session-${sessionId}.csv`);
        } else {
            alert('Failed to export session');
        }
    }

    exportAllSessions() {
        const csvContent = window.diagnosticLogger.exportToCSV();
        if (csvContent) {
            this.downloadCSV(csvContent, `all-diagnostic-sessions-${new Date().toISOString().split('T')[0]}.csv`);
        } else {
            alert('No sessions to export');
        }
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    setUserId(userId) {
        this.currentUserId = userId;
        localStorage.setItem('breakdownGuide_userId', userId);
    }

    getCurrentUserId() {
        if (!this.currentUserId) {
            this.currentUserId = localStorage.getItem('breakdownGuide_userId') || null;
        }
        return this.currentUserId;
    }

    updateLoggingStatus() {
        const statusIcon = document.getElementById('loggingStatusIcon');
        const statusText = document.getElementById('loggingStatusText');
        const statusContainer = document.querySelector('.logging-status');

        if (window.sessionManager && window.sessionManager.currentState) {
            // Active session
            if (statusIcon) statusIcon.textContent = '🔴';
            if (statusText) statusText.textContent = 'Recording';
            if (statusContainer) statusContainer.classList.remove('inactive');
        } else {
            // No active session
            if (statusIcon) statusIcon.textContent = '📊';
            if (statusText) statusText.textContent = this.currentUserId ? 'Ready' : 'Set User ID';
            if (statusContainer) statusContainer.classList.add('inactive');
        }
    }

    // Public method to start monitoring
    startStatusMonitoring() {
        setInterval(() => {
            this.updateLoggingStatus();
        }, 1000);
    }
}

// ==================================================
// INITIALIZATION
// ==================================================

// Create global instance
const loggingIntegration = new LoggingIntegration();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loggingIntegration.initialize();
        loggingIntegration.startStatusMonitoring();
    });
} else {
    loggingIntegration.initialize();
    loggingIntegration.startStatusMonitoring();
}

// Make it globally available
window.loggingIntegration = loggingIntegration;