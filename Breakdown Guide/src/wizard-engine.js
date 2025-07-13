/**
 * Go North East - Breakdown Guide
 * Diagnostic Wizard Engine
 * Handles diagnostic flow execution and UI rendering
 */

class DiagnosticWizard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.currentFlow = null;
        this.currentStepId = null;
        this.responses = {};
        this.history = [];
        this.startTime = null;
    }

    /**
     * Load a diagnostic flow
     */
    loadFlow(flowId) {
        console.log(`Loading diagnostic flow: ${flowId}`);
        
        if (!diagnosticFlows[flowId]) {
            console.error(`Flow not found: ${flowId}`);
            this.showError('Diagnostic flow not found');
            return;
        }
        
        this.currentFlow = diagnosticFlows[flowId];
        this.currentStepId = this.currentFlow.flow.start;
        this.responses = {};
        this.history = [];
        this.startTime = new Date();
        
        // Start session
        sessionManager?.startSession({
            issueId: flowId,
            issueTitle: this.currentFlow.title,
            issuePriority: this.currentFlow.priority
        });
        
        this.renderStep();
    }

    /**
     * Render current step
     */
    renderStep() {
        const step = this.currentFlow.flow.steps[this.currentStepId];
        if (!step) {
            console.error(`Step not found: ${this.currentStepId}`);
            return;
        }
        
        // Update wizard title and progress
        this.updateHeader(step);
        
        // Clear container
        this.container.innerHTML = '';
        
        // Render based on step type
        switch (step.type) {
            case 'checklist':
                this.renderChecklist(step);
                break;
            case 'radio':
                this.renderRadio(step);
                break;
            case 'critical-action':
                this.renderCriticalAction(step);
                break;
            case 'timer-action':
                this.renderTimerAction(step);
                break;
            case 'info':
                this.renderInfo(step);
                break;
            case 'summary':
                this.renderSummary(step);
                break;
            default:
                this.renderGeneric(step);
        }
        
        // Update navigation
        this.updateNavigation();
        
        // Save progress
        sessionManager?.updateSession({
            currentStep: this.currentStepId,
            responses: this.responses
        });
    }

    /**
     * Update header information
     */
    updateHeader(step) {
        const wizardTitle = document.getElementById('wizardTitle');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const breadcrumb = document.getElementById('breadcrumbTrail');
        
        if (wizardTitle) {
            wizardTitle.textContent = this.currentFlow.title;
        }
        
        if (breadcrumb) {
            const category = issueCategories.find(c => c.id === this.currentFlow.id);
            breadcrumb.textContent = `Home > ${category ? category.name : this.currentFlow.title} > ${step.title}`;
        }
        
        // Calculate progress
        const totalSteps = Object.keys(this.currentFlow.flow.steps).filter(s => s !== 'complete').length;
        const currentStepIndex = this.history.length + 1;
        const progress = Math.min((currentStepIndex / totalSteps) * 100, 100);
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = step.type === 'summary' 
                ? 'Complete' 
                : `Step ${currentStepIndex} of ${totalSteps}`;
        }
    }

    /**
     * Render checklist step
     */
    renderChecklist(step) {
        const html = `
            <div class="step-container">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                </div>
                
                ${step.content.warning ? this.renderWarning(step.content.warning) : ''}
                
                <div class="step-content">
                    <p class="step-description">${step.content.description}</p>
                    
                    <div class="checklist-container">
                        ${step.content.items.map((item, index) => `
                            <label class="checkbox-item ${item.critical ? 'critical' : ''}">
                                <input type="checkbox" 
                                       id="check-${item.id}" 
                                       value="${item.id}"
                                       ${this.responses[this.currentStepId]?.includes(item.id) ? 'checked' : ''}>
                                <span class="checkbox-label">${item.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="step-actions">
                    ${this.renderActions(step.actions)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachChecklistHandlers(step);
    }

    /**
     * Render radio step
     */
    renderRadio(step) {
        const html = `
            <div class="step-container">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                </div>
                
                ${step.content.warning ? this.renderWarning(step.content.warning) : ''}
                ${step.content.info ? this.renderInfo(step.content.info) : ''}
                
                <div class="step-content">
                    <p class="step-description">${step.content.description}</p>
                    
                    <div class="radio-container">
                        ${step.content.options.map((option, index) => `
                            <label class="radio-item">
                                <input type="radio" 
                                       name="radio-${this.currentStepId}" 
                                       id="radio-${option.id}" 
                                       value="${option.value}"
                                       ${this.responses[this.currentStepId] === option.value ? 'checked' : ''}>
                                <span class="radio-label">${option.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="step-actions">
                    ${this.renderActions(step.actions)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachRadioHandlers(step);
    }

    /**
     * Render critical action step
     */
    renderCriticalAction(step) {
        const html = `
            <div class="step-container critical-container">
                ${step.content.alert ? this.renderAlert(step.content.alert) : ''}
                
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                </div>
                
                <div class="step-content">
                    ${step.content.instructions ? `
                        <div class="instructions-list">
                            <ol>
                                ${step.content.instructions.map(instruction => `
                                    <li>${instruction}</li>
                                `).join('')}
                            </ol>
                        </div>
                    ` : ''}
                    
                    ${step.content.additionalInfo ? `
                        <div class="additional-info">
                            <h3>${step.content.additionalInfo.title}</h3>
                            <ul>
                                ${step.content.additionalInfo.items.map(item => `
                                    <li>${item}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${step.content.warning ? this.renderWarning(step.content.warning) : ''}
                </div>
                
                ${step.requiresConfirmation ? `
                    <div class="confirmation-section">
                        <label class="confirmation-label">
                            <input type="checkbox" id="confirmCheck">
                            <span>${step.confirmationText}</span>
                        </label>
                    </div>
                ` : ''}
                
                <div class="step-actions">
                    ${this.renderActions(step.actions)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachCriticalHandlers(step);
    }

    /**
     * Render timer action step
     */
    renderTimerAction(step) {
        const html = `
            <div class="step-container timer-container">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                </div>
                
                ${step.content.alert ? this.renderAlert(step.content.alert) : ''}
                
                <div class="step-content">
                    ${step.content.instructions ? `
                        <div class="instructions-list">
                            <ol>
                                ${step.content.instructions.map(instruction => `
                                    <li>${instruction}</li>
                                `).join('')}
                            </ol>
                        </div>
                    ` : ''}
                    
                    ${step.content.timerDuration ? `
                        <div class="timer-section">
                            <div class="timer-display" id="timerDisplay">${step.content.timerDuration}s</div>
                            <p class="timer-message">${step.content.timerMessage || 'Please wait...'}</p>
                            <button class="btn btn-secondary" id="startTimerBtn">Start Timer</button>
                        </div>
                    ` : ''}
                    
                    ${step.content.warning ? this.renderWarning(step.content.warning) : ''}
                </div>
                
                ${step.requiresConfirmation ? `
                    <div class="confirmation-section">
                        <label class="confirmation-label">
                            <input type="checkbox" id="confirmCheck">
                            <span>${step.confirmationText}</span>
                        </label>
                    </div>
                ` : ''}
                
                <div class="step-actions">
                    ${this.renderActions(step.actions)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachTimerHandlers(step);
    }

    /**
     * Render info step
     */
    renderInfo(step) {
        const html = `
            <div class="step-container info-container">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                </div>
                
                ${step.content.alert ? this.renderAlert(step.content.alert) : ''}
                
                <div class="step-content">
                    ${step.content.instructions ? `
                        <div class="instructions-list">
                            <ul>
                                ${step.content.instructions.map(instruction => `
                                    <li>${instruction}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${step.content.reminder ? `
                        <div class="reminder-box">
                            <p>${step.content.reminder}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="step-actions">
                    ${this.renderActions(step.actions)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachInfoHandlers(step);
    }

    /**
     * Render summary step
     */
    renderSummary(step) {
        const summary = this.generateSummary();
        
        const html = `
            <div class="step-container summary-container">
                <div class="step-header">
                    <h2 class="step-title">Diagnostic Complete</h2>
                </div>
                
                ${step.content?.alert ? this.renderAlert(step.content.alert) : ''}
                
                <div class="summary-content">
                    <div class="summary-section">
                        <h3>Issue</h3>
                        <p>${this.currentFlow.title}</p>
                    </div>
                    
                    <div class="summary-section">
                        <h3>Duration</h3>
                        <p>${this.calculateDuration()}</p>
                    </div>
                    
                    <div class="summary-section">
                        <h3>Outcome</h3>
                        <p>${summary.outcome}</p>
                    </div>
                    
                    ${summary.actions.length > 0 ? `
                        <div class="summary-section">
                            <h3>Actions Taken</h3>
                            <ul>
                                ${summary.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="summary-section">
                        <h3>Next Steps</h3>
                        <ul>
                            <li>Log all defects in Go-Check</li>
                            <li>Complete any required paperwork</li>
                            <li>Follow up with engineering as needed</li>
                        </ul>
                    </div>
                </div>
                
                <div class="step-actions">
                    <button class="btn btn-success" onclick="completeDiagnostic()">
                        Complete & Return to Categories
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Mark session as complete
        sessionManager?.completeSession({
            outcome: summary.outcome,
            actions: summary.actions
        });
        
        // Call completion callback
        if (this.options.onComplete) {
            this.options.onComplete(summary);
        }
    }

    /**
     * Helper methods for rendering components
     */
    renderWarning(warning) {
        return `
            <div class="alert alert-${warning.type || 'warning'}">
                <div class="alert-content">${warning.text}</div>
            </div>
        `;
    }

    renderAlert(alert) {
        return `
            <div class="alert alert-${alert.type || 'info'}">
                ${alert.title ? `<h3 class="alert-title">${alert.title}</h3>` : ''}
                <div class="alert-content">${alert.text}</div>
            </div>
        `;
    }

    renderInfo(info) {
        return `
            <div class="info-box info-${info.type || 'info'}">
                <div class="info-content">${info.text}</div>
            </div>
        `;
    }

    renderActions(actions) {
        return actions.map(action => `
            <button class="btn btn-${action.type || 'primary'}" 
                    id="action-${action.id}"
                    data-action-id="${action.id}"
                    data-next-step="${action.nextStep}"
                    data-requires-confirmation="${action.requiresConfirmation || false}"
                    ${action.disabled ? 'disabled' : ''}>
                ${action.label}
            </button>
        `).join('');
    }

    /**
     * Event handlers
     */
    attachChecklistHandlers(step) {
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    const checked = Array.from(document.querySelectorAll('.checklist-container input:checked'))
                        .map(cb => cb.value);
                    
                    // Check condition
                    let shouldProceed = true;
                    if (action.condition === 'anySelected' && checked.length === 0) {
                        shouldProceed = false;
                    }
                    if (action.condition === 'noneSelected' && checked.length > 0) {
                        shouldProceed = false;
                    }
                    
                    if (shouldProceed) {
                        this.responses[this.currentStepId] = checked;
                        this.handleAction(action);
                    }
                });
            }
        });
        
        // Update button states on checkbox change
        document.querySelectorAll('.checklist-container input').forEach(cb => {
            cb.addEventListener('change', () => this.updateActionButtons(step));
        });
        
        this.updateActionButtons(step);
    }

    attachRadioHandlers(step) {
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    const selected = document.querySelector(`input[name="radio-${this.currentStepId}"]:checked`);
                    if (!selected && step.validation?.required) {
                        alert('Please select an option');
                        return;
                    }
                    
                    this.responses[this.currentStepId] = selected?.value;
                    this.handleAction(action);
                });
            }
        });
        
        // Update button states on radio change
        document.querySelectorAll(`.radio-container input`).forEach(radio => {
            radio.addEventListener('change', () => this.updateActionButtons(step));
        });
        
        this.updateActionButtons(step);
    }

    attachCriticalHandlers(step) {
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (action.requiresConfirmation) {
                        this.showSafetyConfirmation(action, step);
                    } else {
                        this.handleAction(action);
                    }
                });
            }
        });
        
        // Handle confirmation checkbox
        const confirmCheck = document.getElementById('confirmCheck');
        if (confirmCheck) {
            confirmCheck.addEventListener('change', () => this.updateActionButtons(step));
        }
        
        this.updateActionButtons(step);
    }

    attachTimerHandlers(step) {
        const startBtn = document.getElementById('startTimerBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTimer(step.content.timerDuration);
            });
        }
        
        this.attachCriticalHandlers(step); // Reuse for actions
    }

    attachInfoHandlers(step) {
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (btn) {
                btn.addEventListener('click', () => this.handleAction(action));
            }
        });
    }

    /**
     * Handle action execution
     */
    handleAction(action) {
        // Log action
        if (action.logAction) {
            logAction(action.logAction, {
                stepId: this.currentStepId,
                responses: this.responses[this.currentStepId]
            });
        }
        
        // Save to history
        this.history.push({
            stepId: this.currentStepId,
            action: action.id,
            timestamp: new Date()
        });
        
        // Navigate to next step
        if (action.nextStep) {
            this.currentStepId = action.nextStep;
            this.renderStep();
        }
        
        // Call step change callback
        if (this.options.onStepChange) {
            this.options.onStepChange(this.currentStepId);
        }
    }

    /**
     * Show safety confirmation modal
     */
    showSafetyConfirmation(action, step) {
        if (typeof SafetyConfirmation !== 'undefined') {
            const safety = new SafetyConfirmation();
            safety.show({
                title: 'Safety Confirmation Required',
                message: `You are confirming: "${step.confirmationText}"`,
                severity: 'critical',
                confirmText: step.confirmationText,
                onConfirm: () => this.handleAction(action),
                onCancel: () => console.log('Confirmation cancelled')
            });
        } else {
            // Fallback confirmation
            if (confirm(`Please confirm: ${step.confirmationText}`)) {
                this.handleAction(action);
            }
        }
    }

    /**
     * Update action button states
     */
    updateActionButtons(step) {
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (!btn) return;
            
            let enabled = true;
            
            // Check conditions
            if (action.condition) {
                if (action.condition === 'anySelected') {
                    const checked = document.querySelectorAll('.checklist-container input:checked');
                    enabled = checked.length > 0;
                } else if (action.condition === 'noneSelected') {
                    const checked = document.querySelectorAll('.checklist-container input:checked');
                    enabled = checked.length === 0;
                } else if (action.condition.field === 'value') {
                    const selected = document.querySelector(`input[name="radio-${this.currentStepId}"]:checked`);
                    enabled = selected && selected.value === action.condition.equals;
                } else if (action.condition.field === 'selections' && action.condition.minCount) {
                    const checked = document.querySelectorAll('.checklist-container input:checked');
                    enabled = checked.length >= action.condition.minCount;
                }
            }
            
            // Check confirmation requirement
            if (step.requiresConfirmation && action.requiresConfirmation) {
                const confirmCheck = document.getElementById('confirmCheck');
                enabled = enabled && confirmCheck && confirmCheck.checked;
            }
            
            btn.disabled = !enabled;
        });
    }

    /**
     * Navigation methods
     */
    canGoBack() {
        return this.history.length > 0;
    }

    goBack() {
        if (!this.canGoBack()) return;
        
        const lastStep = this.history.pop();
        this.currentStepId = lastStep.stepId;
        this.renderStep();
    }

    updateNavigation() {
        const previousBtn = document.getElementById('previousStepBtn');
        if (previousBtn) {
            previousBtn.disabled = !this.canGoBack();
        }
        
        if (this.options.onNavigationUpdate) {
            this.options.onNavigationUpdate(this.canGoBack());
        }
    }

    /**
     * Timer functionality
     */
    startTimer(duration) {
        const display = document.getElementById('timerDisplay');
        const startBtn = document.getElementById('startTimerBtn');
        
        if (!display || !startBtn) return;
        
        startBtn.disabled = true;
        startBtn.textContent = 'Timer Running...';
        
        let remaining = duration;
        const interval = setInterval(() => {
            remaining--;
            display.textContent = `${remaining}s`;
            
            if (remaining <= 0) {
                clearInterval(interval);
                display.textContent = 'Complete!';
                startBtn.textContent = 'Timer Complete';
                
                // Enable confirmation
                const confirmCheck = document.getElementById('confirmCheck');
                if (confirmCheck) {
                    confirmCheck.disabled = false;
                }
            }
        }, 1000);
    }

    /**
     * Generate summary
     */
    generateSummary() {
        const actions = [];
        let outcome = 'Diagnostic completed';
        
        // Analyze history for outcome
        this.history.forEach(item => {
            const step = this.currentFlow.flow.steps[item.stepId];
            if (step && step.actions) {
                const action = step.actions.find(a => a.id === item.action);
                if (action && action.logAction) {
                    actions.push(action.logAction);
                    
                    // Determine outcome
                    if (action.logAction.includes('CRITICAL')) {
                        outcome = 'Vehicle stopped - Critical safety issue';
                    } else if (action.logAction.includes('changeover') && outcome === 'Diagnostic completed') {
                        outcome = 'Changeover required';
                    }
                }
            }
        });
        
        return {
            outcome,
            actions,
            duration: this.calculateDuration(),
            responses: this.responses
        };
    }

    /**
     * Calculate duration
     */
    calculateDuration() {
        if (!this.startTime) return 'Unknown';
        
        const duration = Date.now() - this.startTime.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        return `${minutes}m ${seconds}s`;
    }

    /**
     * Show error
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Error</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="showScreen('category')">
                    Return to Categories
                </button>
            </div>
        `;
    }
}

// Global function for completing diagnostic
function completeDiagnostic() {
    showScreen('category');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticWizard;
}