/**
 * RAPID WIZARD ENGINE
 * Optimized for 30-90 second control room decisions
 * Works with the new rapid diagnostic flows structure
 */

class RapidWizardEngine {
    constructor() {
        this.currentFlow = null;
        this.currentStepIndex = 0;
        this.startTime = null;
        this.responses = [];
        this.sessionId = null;
    }

    /**
     * Start a diagnostic flow
     */
    startDiagnostic(flowId) {
        console.log(`Starting rapid diagnostic: ${flowId}`);
        
        if (!window.diagnosticFlows || !window.diagnosticFlows[flowId]) {
            this.showError(`Flow not found: ${flowId}`);
            return;
        }

        this.currentFlow = window.diagnosticFlows[flowId];
        this.currentStepIndex = 0;
        this.startTime = new Date();
        this.responses = [];
        this.sessionId = Date.now().toString();

        // Show wizard screen
        if (typeof showScreen === 'function') {
            showScreen('wizard');
        }

        // Render first step
        this.renderCurrentStep();

        // Log session start
        console.log(`Rapid diagnostic started: ${this.currentFlow.title} (Target: ${this.currentFlow.estimatedTime})`);
    }

    /**
     * Render the current step
     */
    renderCurrentStep() {
        const step = this.currentFlow.steps[this.currentStepIndex];
        if (!step) {
            console.error('Step not found:', this.currentStepIndex);
            return;
        }

        this.updateHeader(step);
        this.renderStepContent(step);
        this.updateProgress();
    }

    /**
     * Update wizard header
     */
    updateHeader(step) {
        const wizardTitle = document.getElementById('wizardTitle');
        const breadcrumb = document.getElementById('breadcrumbTrail');

        if (wizardTitle) {
            wizardTitle.textContent = `${this.currentFlow.icon} ${this.currentFlow.title}`;
        }

        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span>Home</span> > 
                <span>${this.currentFlow.title}</span> > 
                <span>${step.title || step.subtitle || `Step ${this.currentStepIndex + 1}`}</span>
                <span class="estimated-time">${this.currentFlow.estimatedTime}</span>
            `;
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        const totalSteps = this.currentFlow.steps.length;
        const currentStep = this.currentStepIndex + 1;
        const progress = (currentStep / totalSteps) * 100;

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
        }
    }

    /**
     * Render step content based on type
     */
    renderStepContent(step) {
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) return;

        let html = '';

        switch (step.type) {
            case 'question':
                html = this.renderQuestion(step);
                break;
            case 'action':
                html = this.renderAction(step);
                break;
            case 'info':
                html = this.renderInfo(step);
                break;
            case 'final':
                html = this.renderFinal(step);
                break;
            default:
                html = this.renderGeneric(step);
        }

        wizardContent.innerHTML = html;
        this.attachEventHandlers(step);
    }

    /**
     * Render question step (rapid decision)
     */
    renderQuestion(step) {
        const urgencyClass = step.urgency === 'critical' ? 'critical' : 
                           step.urgency === 'warning' ? 'warning' : 'normal';

        return `
            <div class="rapid-step-container ${urgencyClass}">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                    ${step.subtitle ? `<p class="step-subtitle">${step.subtitle}</p>` : ''}
                </div>

                ${step.urgency === 'critical' ? `
                    <div class="urgency-banner critical">
                        🚨 SAFETY CRITICAL - Immediate decision required
                    </div>
                ` : ''}

                <div class="step-content">
                    ${step.content ? `<p class="step-description">${step.content}</p>` : ''}
                    
                    ${step.quickCheck ? `
                        <div class="quick-check-box">
                            <h4>Quick Check:</h4>
                            <ul class="quick-check-list">
                                ${step.quickCheck.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <div class="rapid-options">
                    ${step.options.map((option, index) => `
                        <button class="rapid-option ${option.severity}" 
                                data-next-step="${option.nextStep || index + 1}"
                                data-action="${option.action || 'continue'}">
                            <span class="option-text">${option.text}</span>
                            ${option.severity === 'critical' ? '<span class="urgent-indicator">URGENT</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render action step (procedures)
     */
    renderAction(step) {
        return `
            <div class="rapid-step-container action">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                    ${step.subtitle ? `<p class="step-subtitle">${step.subtitle}</p>` : ''}
                </div>

                <div class="step-content">
                    ${step.content ? `<p class="step-description">${step.content}</p>` : ''}
                    
                    ${step.instructions ? `
                        <div class="instructions-box">
                            <h4>Follow these steps:</h4>
                            <ol class="instructions-list">
                                ${step.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}

                    ${step.timer ? `
                        <div class="timer-display">
                            <p>⏱️ Allow ${step.timer} seconds for completion</p>
                        </div>
                    ` : ''}
                </div>

                <div class="rapid-options">
                    <button class="rapid-option continue" data-next-step="${step.nextStep || this.currentStepIndex + 1}">
                        <span class="option-text">✅ Completed - Continue</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render final step (results)
     */
    renderFinal(step) {
        const severityClass = step.severity === 'stop' ? 'critical' : 
                             step.severity === 'warning' ? 'warning' : 'continue';

        return `
            <div class="rapid-step-container final ${severityClass}">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                    ${step.subtitle ? `<p class="step-subtitle">${step.subtitle}</p>` : ''}
                </div>

                <div class="result-summary">
                    <div class="result-box ${severityClass}">
                        <h3>Decision: ${step.result}</h3>
                        ${step.stopReason ? `<p class="stop-reason"><strong>Reason:</strong> ${step.stopReason}</p>` : ''}
                    </div>
                </div>

                <div class="step-content">
                    ${step.content ? `<p class="step-description">${step.content}</p>` : ''}
                    
                    ${step.actions ? `
                        <div class="actions-box">
                            <h4>Required Actions:</h4>
                            <ul class="actions-list">
                                ${step.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${step.contacts ? `
                        <div class="contacts-box">
                            <h4>Contacts:</h4>
                            <ul class="contacts-list">
                                ${step.contacts.map(contact => `<li>${contact}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${step.documentation ? `
                        <div class="documentation-box">
                            <h4>Documentation:</h4>
                            <p>${step.documentation}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="session-summary">
                    <h4>Session Summary:</h4>
                    <p><strong>Issue:</strong> ${this.currentFlow.title}</p>
                    <p><strong>Time taken:</strong> ${this.getSessionDuration()}</p>
                    <p><strong>Target time:</strong> ${this.currentFlow.estimatedTime}</p>
                    <p><strong>SDC Reference:</strong> ${this.currentFlow.sdcReference}</p>
                </div>

                <div class="rapid-options">
                    <button class="rapid-option secondary" onclick="showScreen('category')">
                        <span class="option-text">🏠 Return to Categories</span>
                    </button>
                    <button class="rapid-option continue" onclick="showScreen('welcome')">
                        <span class="option-text">✅ Complete Session</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render generic step
     */
    renderGeneric(step) {
        return `
            <div class="rapid-step-container">
                <div class="step-header">
                    <h2 class="step-title">${step.title || 'Diagnostic Step'}</h2>
                </div>
                <div class="step-content">
                    <p>${step.content || 'Processing...'}</p>
                </div>
            </div>
        `;
    }

    /**
     * Attach event handlers to step elements
     */
    attachEventHandlers(step) {
        const buttons = document.querySelectorAll('.rapid-option');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const nextStep = parseInt(e.currentTarget.dataset.nextStep);
                const action = e.currentTarget.dataset.action;
                
                // Record response
                this.responses.push({
                    stepIndex: this.currentStepIndex,
                    stepType: step.type,
                    response: e.currentTarget.textContent.trim(),
                    action: action,
                    timestamp: new Date()
                });

                // Navigate to next step
                if (!isNaN(nextStep)) {
                    this.goToStep(nextStep);
                }
            });
        });
    }

    /**
     * Navigate to specific step
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.currentFlow.steps.length) {
            this.currentStepIndex = stepIndex;
            this.renderCurrentStep();
        } else {
            console.error('Invalid step index:', stepIndex);
        }
    }

    /**
     * Get session duration
     */
    getSessionDuration() {
        if (!this.startTime) return 'Unknown';
        const duration = Math.round((new Date() - this.startTime) / 1000);
        return `${duration} seconds`;
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Rapid Wizard Error:', message);
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            wizardContent.innerHTML = `
                <div class="error-container">
                    <h2>⚠️ Error</h2>
                    <p>${message}</p>
                    <button class="rapid-option secondary" onclick="showScreen('category')">
                        Return to Categories
                    </button>
                </div>
            `;
        }
    }
}

// Initialize rapid wizard
const rapidWizard = new RapidWizardEngine();

// Global function for compatibility with existing app
function startDiagnostic(flowId) {
    rapidWizard.startDiagnostic(flowId);
}

// Export for use
window.rapidWizard = rapidWizard;
window.startDiagnostic = startDiagnostic;

console.log('Rapid Wizard Engine loaded');
