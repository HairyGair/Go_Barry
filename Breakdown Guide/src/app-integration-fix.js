/**
 * Fixed App.js Integration for Breakdown Guide
 * This replaces the broken integration with working wizard initialization
 */

// Global wizard instance
let wizardInstance = null;

// Fixed startDiagnostic function
function startDiagnostic(issueId) {
    console.log('Starting diagnostic for:', issueId);
    
    if (typeof diagnosticFlows === 'undefined' || !diagnosticFlows[issueId]) {
        showError('Diagnostic flow not found: ' + issueId);
        return;
    }
    
    // Update application state
    appState.currentIssue = issueId;
    appState.currentStep = 0;
    appState.sessionStart = new Date();
    appState.notes = '';
    
    // Track recent usage
    if (!appState.recentCategories.includes(issueId)) {
        appState.recentCategories.unshift(issueId);
        if (appState.recentCategories.length > MAX_RECENT_ITEMS) {
            appState.recentCategories.pop();
        }
    }
    
    // Show wizard screen
    showScreen('wizard');
    
    // Initialize wizard with proper options
    initializeWizard(issueId);
    
    saveState();
}

// Fixed wizard initialization
function initializeWizard(issueId) {
    console.log('Initializing wizard for:', issueId);
    
    try {
        // Create new wizard instance
        wizardInstance = new DiagnosticWizard('wizardContent', {
            onStepChange: (stepId) => {
                console.log('Step changed to:', stepId);
                updateWizardNavigation();
            },
            onComplete: (summary) => {
                console.log('Diagnostic complete:', summary);
                handleDiagnosticComplete(summary);
            },
            onNavigationUpdate: (canGoBack) => {
                updatePreviousButton(canGoBack);
            }
        });
        
        // Load the flow
        wizardInstance.loadFlow(issueId);
        
        // Update UI
        updateWizardHeader(issueId);
        
    } catch (error) {
        console.error('Error initializing wizard:', error);
        showError('Failed to initialize diagnostic wizard: ' + error.message);
    }
}

// Update wizard header with flow information
function updateWizardHeader(issueId) {
    const flow = diagnosticFlows[issueId];
    if (!flow) return;
    
    // Update title
    if (elements.wizardTitle) {
        elements.wizardTitle.textContent = flow.title;
    }
    
    // Update breadcrumb
    if (elements.breadcrumbTrail) {
        elements.breadcrumbTrail.textContent = `Home > Categories > ${flow.title}`;
    }
    
    // Set title color based on severity
    if (elements.wizardTitle) {
        elements.wizardTitle.className = `wizard-title ${flow.severity || 'normal'}`;
    }
}

// Handle wizard navigation updates
function updateWizardNavigation() {
    // Enable/disable previous button based on wizard state
    if (wizardInstance && elements.previousStepBtn) {
        elements.previousStepBtn.disabled = !wizardInstance.canGoBack();
    }
}

// Update previous button state
function updatePreviousButton(canGoBack) {
    if (elements.previousStepBtn) {
        elements.previousStepBtn.disabled = !canGoBack;
    }
}

// Handle wizard back button
function handleWizardBack() {
    if (wizardInstance && wizardInstance.canGoBack()) {
        wizardInstance.goBack();
    } else {
        // Go back to categories
        showScreen('category');
        populateCategories();
    }
}

// Handle diagnostic completion
function handleDiagnosticComplete(summary) {
    // Save to history
    const session = {
        id: Date.now(),
        issueId: appState.currentIssue,
        issueTitle: diagnosticFlows[appState.currentIssue].title,
        startTime: appState.sessionStart,
        endTime: new Date(),
        notes: appState.notes,
        completed: true,
        outcome: summary.outcome,
        actions: summary.actions,
        duration: summary.duration
    };
    
    appState.diagnosticHistory.unshift(session);
    if (appState.diagnosticHistory.length > 50) {
        appState.diagnosticHistory = appState.diagnosticHistory.slice(0, 50);
    }
    
    saveState();
    
    // Show completion notification
    showCompletionNotification(summary);
}

// Show completion notification
function showCompletionNotification(summary) {
    const modal = document.createElement('div');
    modal.className = 'modal completion-modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>✅ Diagnostic Complete</h2>
            </div>
            <div class="modal-body">
                <div class="completion-summary">
                    <h3>Issue: ${diagnosticFlows[appState.currentIssue].title}</h3>
                    <p><strong>Outcome:</strong> ${summary.outcome}</p>
                    <p><strong>Duration:</strong> ${summary.duration}</p>
                    ${summary.actions.length > 0 ? `
                        <div class="actions-taken">
                            <h4>Actions Taken:</h4>
                            <ul>
                                ${summary.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="closeCompletionModal()">
                        Return to Categories
                    </button>
                    <button class="btn btn-secondary" onclick="startNewDiagnostic()">
                        Start New Diagnostic
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 10 seconds if not clicked
    setTimeout(() => {
        if (modal.parentNode) {
            closeCompletionModal();
        }
    }, 10000);
}

// Close completion modal
function closeCompletionModal() {
    const modal = document.querySelector('.completion-modal');
    if (modal) {
        modal.remove();
    }
    
    // Return to categories
    showScreen('category');
    populateCategories();
}

// Start new diagnostic
function startNewDiagnostic() {
    closeCompletionModal();
    showScreen('category');
    populateCategories();
}

// Enhanced error handling
function showError(message) {
    console.error('Breakdown Guide Error:', message);
    
    // Create error modal
    const modal = document.createElement('div');
    modal.className = 'modal error-modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>❌ Error</h2>
            </div>
            <div class="modal-body">
                <p class="error-message">${message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="closeErrorModal()">
                        Return to Categories
                    </button>
                    <button class="btn btn-secondary" onclick="retryLastAction()">
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close error modal
function closeErrorModal() {
    const modal = document.querySelector('.error-modal');
    if (modal) {
        modal.remove();
    }
    
    showScreen('category');
    populateCategories();
}

// Retry last action
function retryLastAction() {
    const modal = document.querySelector('.error-modal');
    if (modal) {
        modal.remove();
    }
    
    // Try to restart current diagnostic if available
    if (appState.currentIssue) {
        startDiagnostic(appState.currentIssue);
    } else {
        showScreen('category');
        populateCategories();
    }
}

// Enhanced save notes function
function saveNotes() {
    const notesText = elements.notesInput?.value || '';
    appState.notes = notesText;
    
    // Also update wizard session if available
    if (wizardInstance && typeof sessionManager !== 'undefined') {
        sessionManager.updateSession({ notes: notesText });
    }
    
    saveState();
    
    // Show brief confirmation
    showBriefNotification('Notes saved successfully', 'success');
}

// Show brief notification
function showBriefNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        borderRadius: '6px',
        zIndex: '10000',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Update event listeners for wizard navigation
function updateEventListeners() {
    // Previous step button
    if (elements.previousStepBtn) {
        elements.previousStepBtn.removeEventListener('click', previousStep);
        elements.previousStepBtn.addEventListener('click', () => {
            if (wizardInstance) {
                wizardInstance.goBack();
            }
        });
    }
    
    // Wizard back button
    if (elements.wizardBackBtn) {
        elements.wizardBackBtn.removeEventListener('click', handleWizardBack);
        elements.wizardBackBtn.addEventListener('click', handleWizardBack);
    }
    
    // Save notes button
    if (elements.saveNotesBtn) {
        elements.saveNotesBtn.removeEventListener('click', saveNotes);
        elements.saveNotesBtn.addEventListener('click', saveNotes);
    }
}

// Initialize fixed integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing fixed breakdown guide integration...');
    
    // Wait for diagnostic flows to load
    if (typeof diagnosticFlows === 'undefined') {
        console.log('Waiting for diagnostic flows to load...');
        const checkFlows = setInterval(() => {
            if (typeof diagnosticFlows !== 'undefined') {
                clearInterval(checkFlows);
                console.log('Diagnostic flows loaded, updating event listeners');
                updateEventListeners();
            }
        }, 100);
    } else {
        updateEventListeners();
    }
});

// Export for debugging
window.wizardDebug = {
    wizardInstance: () => wizardInstance,
    appState: () => appState,
    diagnosticFlows: () => typeof diagnosticFlows !== 'undefined' ? diagnosticFlows : null,
    restartWizard: (issueId) => {
        if (issueId && diagnosticFlows[issueId]) {
            startDiagnostic(issueId);
        }
    }
};

console.log('Fixed app integration loaded');
