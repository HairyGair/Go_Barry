/**
 * Go North East - Breakdown Guide
 * Recent Sessions Handler
 * Manages display of recent diagnostic sessions
 */

function showRecentLogs() {
    console.log('Showing recent logs');
    
    // Get recent sessions from sessionManager
    const sessions = sessionManager?.getRecentSessions() || [];
    
    // Create modal content
    const modalContent = `
        <div class="modal active" id="recentLogsModal">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2>Recent Diagnostic Sessions</h2>
                    <button class="modal-close" onclick="document.getElementById('recentLogsModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${sessions.length > 0 ? renderSessionsList(sessions) : renderEmptyState()}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('recentLogsModal').remove()">Close</button>
                    ${sessions.length > 0 ? '<button class="btn btn-primary" onclick="exportSessions()">Export All</button>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('recentLogsModal');
    if (existingModal) existingModal.remove();
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function renderSessionsList(sessions) {
    return `
        <div class="sessions-list">
            ${sessions.map(session => `
                <div class="session-card">
                    <div class="session-header">
                        <h3>${session.issueTitle || session.issueId}</h3>
                        <span class="session-status ${session.status}">${session.status}</span>
                    </div>
                    <div class="session-details">
                        <p><strong>Started:</strong> ${new Date(session.startTime).toLocaleString()}</p>
                        ${session.endTime ? `<p><strong>Completed:</strong> ${new Date(session.endTime).toLocaleString()}</p>` : ''}
                        ${session.outcome ? `<p><strong>Outcome:</strong> ${session.outcome}</p>` : ''}
                        ${session.notes ? `<p><strong>Notes:</strong> ${session.notes}</p>` : ''}
                    </div>
                    <div class="session-actions">
                        ${session.status === 'in-progress' ? 
                            `<button class="btn btn-primary btn-sm" onclick="resumeSession('${session.id}')">Resume</button>` : 
                            `<button class="btn btn-secondary btn-sm" onclick="viewSession('${session.id}')">View Details</button>`
                        }
                        <button class="btn btn-danger btn-sm" onclick="deleteSession('${session.id}')">Delete</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderEmptyState() {
    return `
        <div class="empty-state">
            <p class="empty-message">No diagnostic sessions found</p>
            <p>Start a new diagnosis to begin tracking your work</p>
            <button class="btn btn-primary" onclick="document.getElementById('recentLogsModal').remove(); showScreen('category')">
                Start New Diagnosis
            </button>
        </div>
    `;
}

function resumeSession(sessionId) {
    console.log('Resuming session:', sessionId);
    const session = sessionManager?.getSession(sessionId);
    if (session) {
        // Close modal
        document.getElementById('recentLogsModal')?.remove();
        
        // Restore session state
        appState.currentIssue = session.issueId;
        appState.currentStep = session.currentStep || 0;
        appState.notes = session.notes || '';
        
        // Navigate to wizard
        showScreen('wizard');
        startDiagnostic(session.issueId);
    }
}

function viewSession(sessionId) {
    console.log('Viewing session:', sessionId);
    const session = sessionManager?.getSession(sessionId);
    if (session) {
        alert(`Session Details:\n\nIssue: ${session.issueTitle}\nStatus: ${session.status}\nStarted: ${new Date(session.startTime).toLocaleString()}\n\nFull viewing functionality coming soon!`);
    }
}

function deleteSession(sessionId) {
    if (confirm('Are you sure you want to delete this session?')) {
        sessionManager?.deleteSession(sessionId);
        showRecentLogs(); // Refresh the modal
    }
}

function exportSessions() {
    const sessions = sessionManager?.getRecentSessions() || [];
    const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: APP_VERSION,
        sessions: sessions
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breakdown-guide-sessions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Help modal
function showHelp() {
    const modalContent = `
        <div class="modal active" id="helpModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Help & About</h2>
                    <button class="modal-close" onclick="document.getElementById('helpModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Breakdown Guide v${APP_VERSION}</h3>
                    <p>Digital diagnostic wizard for Go North East bus engineering issues.</p>
                    
                    <h4>How to Use:</h4>
                    <ol>
                        <li><strong>Start Diagnosis</strong> - Select the issue category</li>
                        <li><strong>Follow Steps</strong> - Answer each question carefully</li>
                        <li><strong>Safety First</strong> - Red warnings mean immediate stop</li>
                        <li><strong>Log Everything</strong> - Use Go-Check for all defects</li>
                    </ol>
                    
                    <h4>Priority Levels:</h4>
                    <ul>
                        <li><span style="color: #dc2626;">🛑 Critical</span> - Immediate stop required</li>
                        <li><span style="color: #f59e0b;">⚠️ High</span> - Changeover at next stop</li>
                        <li><span style="color: #3b82f6;">ℹ️ Normal</span> - Monitor and schedule</li>
                    </ul>
                    
                    <h4>Emergency Contacts:</h4>
                    <ul>
                        <li>Engineering: 0191 XXX XXXX</li>
                        <li>Control Room: 0191 XXX XXXX</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('helpModal').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}