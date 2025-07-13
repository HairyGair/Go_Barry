/**
 * Enhanced Diagnostic Wizard Engine - Go North East Breakdown Guide
 * Beautiful UI components with smooth animations and enhanced UX
 * Version 4.0 - Complete UI Overhaul
 */

class EnhancedDiagnosticWizard {
    constructor() {
        this.currentFlow = null;
        this.currentStepIndex = 0;
        this.responses = {};
        this.history = [];
        this.startTime = null;
        this.sessionId = null;
    }

    /**
     * Initialize and start a diagnostic flow
     */
    startDiagnosis(flowId) {
        console.log(`🔧 Starting diagnosis for: ${flowId}`);
        
        if (!diagnosticFlows[flowId]) {
            console.error(`❌ Flow not found: ${flowId}`);
            this.showError('Diagnostic flow not found');
            return;
        }
        
        this.currentFlow = diagnosticFlows[flowId];
        this.currentStepIndex = 0;
        this.responses = {};
        this.history = [];
        this.startTime = new Date();
        
        // Initialize session with enhanced logger if available
        if (window.enhancedDiagnosticLogger) {
            this.sessionId = window.enhancedDiagnosticLogger.startSession(
                flowId, 
                this.currentFlow.title, 
                this.getCurrentUser()
            );
        } else if (window.diagnosticLogger) {
            this.sessionId = window.diagnosticLogger.startSession(flowId, this.currentFlow.title);
        }
        
        // Show wizard screen
        this.showWizardScreen();
        
        // Render first step
        this.renderCurrentStep();
        
        console.log(`✅ Diagnosis started - Session: ${this.sessionId}`);
    }

    /**
     * Show the wizard screen
     */
    showWizardScreen() {
        // Hide other screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show wizard screen
        const wizardScreen = document.getElementById('wizardScreen');
        if (wizardScreen) {
            wizardScreen.classList.add('active');
        }
    }

    /**
     * Render the current step
     */
    renderCurrentStep() {
        const step = this.currentFlow.steps[this.currentStepIndex];
        if (!step) {
            console.error('❌ Step not found:', this.currentStepIndex);
            return;
        }

        // Update header
        this.updateWizardHeader(step);
        
        // Get content container
        const container = document.getElementById('wizardContent');
        if (!container) {
            console.error('❌ Wizard content container not found');
            return;
        }

        // Log step progression
        this.logStepProgression(step);

        // Clear container with fade effect
        container.style.opacity = '0';
        
        setTimeout(() => {
            container.innerHTML = '';
            
            // Render step based on type
            const stepElement = this.createStepElement(step);
            container.appendChild(stepElement);
            
            // Fade in new content
            container.style.opacity = '1';
            
            // Update navigation
            this.updateNavigation();
        }, 150);
    }

    /**
     * Update wizard header
     */
    updateWizardHeader(step) {
        // Update title
        const titleElement = document.getElementById('wizardTitle');
        if (titleElement) {
            titleElement.textContent = this.currentFlow.title;
            titleElement.style.color = this.currentFlow.color || '#1a2b5a';
        }

        // Update breadcrumb
        const breadcrumbElement = document.getElementById('breadcrumbTrail');
        if (breadcrumbElement) {
            breadcrumbElement.textContent = `Home > ${this.currentFlow.title} > Step ${this.currentStepIndex + 1}`;
        }

        // Update progress
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            const progress = ((this.currentStepIndex + 1) / this.currentFlow.steps.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Step ${this.currentStepIndex + 1} of ${this.currentFlow.steps.length}`;
        }
    }

    /**
     * Create step element based on type
     */
    createStepElement(step) {
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container enhanced-step';
        
        // Add step header
        const header = this.createStepHeader(step);
        stepContainer.appendChild(header);

        // Add step content based on type
        switch (step.type) {
            case 'info':
                stepContainer.appendChild(this.createInfoStep(step));
                break;
            case 'question':
                stepContainer.appendChild(this.createQuestionStep(step));
                break;
            case 'action':
                stepContainer.appendChild(this.createActionStep(step));
                break;
            case 'final':
                stepContainer.appendChild(this.createFinalStep(step));
                break;
            default:
                stepContainer.appendChild(this.createGenericStep(step));
        }

        return stepContainer;
    }

    /**
     * Create step header
     */
    createStepHeader(step) {
        const header = document.createElement('div');
        header.className = 'step-header';

        // Priority indicator
        if (this.currentFlow.priority === 1) {
            const priorityBadge = document.createElement('div');
            priorityBadge.className = 'priority-badge critical';
            priorityBadge.innerHTML = '🚨 SAFETY CRITICAL';
            header.appendChild(priorityBadge);
        }

        // Step title
        const title = document.createElement('h2');
        title.className = 'step-title';
        title.innerHTML = `${this.currentFlow.icon || '🔧'} ${step.title}`;
        header.appendChild(title);

        // Warning if present
        if (step.warning) {
            const warning = document.createElement('div');
            warning.className = 'step-warning';
            warning.innerHTML = step.warning;
            header.appendChild(warning);
        }

        return header;
    }

    /**
     * Create info step
     */
    createInfoStep(step) {
        const content = document.createElement('div');
        content.className = 'step-content info-step';

        // Main content
        const text = document.createElement('p');
        text.className = 'step-text';
        text.textContent = step.content;
        content.appendChild(text);

        // Continue button
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary enhanced-btn';
        continueBtn.innerHTML = '▶️ Continue';
        continueBtn.addEventListener('click', () => this.nextStep());
        content.appendChild(continueBtn);

        return content;
    }

    /**
     * Create question step
     */
    createQuestionStep(step) {
        const content = document.createElement('div');
        content.className = 'step-content question-step';

        // Question text
        const questionText = document.createElement('p');
        questionText.className = 'step-text question-text';
        questionText.textContent = step.content;
        content.appendChild(questionText);

        // Checklist if present
        if (step.checklist) {
            const checklistContainer = document.createElement('div');
            checklistContainer.className = 'checklist-container';
            
            const checklistTitle = document.createElement('h4');
            checklistTitle.textContent = 'Check for these symptoms:';
            checklistContainer.appendChild(checklistTitle);

            const checklist = document.createElement('ul');
            checklist.className = 'symptoms-checklist';
            
            step.checklist.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span class="checklist-icon">⚠️</span> ${item}`;
                checklist.appendChild(listItem);
            });
            
            checklistContainer.appendChild(checklist);
            content.appendChild(checklistContainer);
        }

        // Options
        if (step.options) {
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container';

            step.options.forEach((option, index) => {
                const optionBtn = document.createElement('button');
                optionBtn.className = `option-button enhanced-option ${option.severity}`;
                optionBtn.innerHTML = `
                    <span class="option-icon">${option.icon || '▶️'}</span>
                    <span class="option-text">${option.text}</span>
                `;
                
                optionBtn.addEventListener('click', () => {
                    this.selectOption(option, index);
                });
                
                optionsContainer.appendChild(optionBtn);
            });

            content.appendChild(optionsContainer);
        }

        return content;
    }

    /**
     * Create action step
     */
    createActionStep(step) {
        const content = document.createElement('div');
        content.className = 'step-content action-step';

        // Action description
        const description = document.createElement('p');
        description.className = 'step-text';
        description.textContent = step.content;
        content.appendChild(description);

        // Instructions
        if (step.instructions) {
            const instructionsContainer = document.createElement('div');
            instructionsContainer.className = 'instructions-container';
            
            const instructionsTitle = document.createElement('h4');
            instructionsTitle.textContent = 'Follow these steps:';
            instructionsContainer.appendChild(instructionsTitle);

            const instructionsList = document.createElement('ol');
            instructionsList.className = 'instructions-list';
            
            step.instructions.forEach(instruction => {
                const listItem = document.createElement('li');
                listItem.textContent = instruction;
                instructionsList.appendChild(listItem);
            });
            
            instructionsContainer.appendChild(instructionsList);
            content.appendChild(instructionsContainer);
        }

        // Timer if present
        if (step.timer) {
            const timerContainer = document.createElement('div');
            timerContainer.className = 'timer-container';
            timerContainer.innerHTML = `
                <div class="timer-display">
                    <span class="timer-icon">⏱️</span>
                    <span class="timer-text">Allow ${step.timer} seconds for completion</span>
                </div>
            `;
            content.appendChild(timerContainer);
        }

        // Continue button
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary enhanced-btn';
        continueBtn.innerHTML = '✅ Steps Completed';
        continueBtn.addEventListener('click', () => {
            if (step.nextStep !== undefined) {
                this.goToStep(step.nextStep);
            } else {
                this.nextStep();
            }
        });
        content.appendChild(continueBtn);

        return content;
    }

    /**
     * Create final step
     */
    createFinalStep(step) {
        const content = document.createElement('div');
        content.className = `step-content final-step ${step.severity}`;

        // Result header
        const resultHeader = document.createElement('div');
        resultHeader.className = `result-header ${step.severity}`;
        
        let headerIcon = '✅';
        if (step.severity === 'stop' || step.severity === 'critical') {
            headerIcon = '🛑';
        } else if (step.severity === 'warning') {
            headerIcon = '⚠️';
        }
        
        resultHeader.innerHTML = `
            <span class="result-icon">${headerIcon}</span>
            <h3 class="result-title">${step.title}</h3>
        `;
        content.appendChild(resultHeader);

        // Result content
        const resultContent = document.createElement('p');
        resultContent.className = 'result-content';
        resultContent.textContent = step.content || step.result;
        content.appendChild(resultContent);

        // Stop reason if present
        if (step.stopReason) {
            const stopReason = document.createElement('div');
            stopReason.className = 'stop-reason';
            stopReason.innerHTML = `<strong>Why vehicle must stop:</strong> ${step.stopReason}`;
            content.appendChild(stopReason);
        }

        // Actions if present
        if (step.actions && step.actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'actions-container';
            
            const actionsTitle = document.createElement('h4');
            actionsTitle.textContent = 'Required Actions:';
            actionsContainer.appendChild(actionsTitle);

            const actionsList = document.createElement('ul');
            actionsList.className = 'actions-list';
            
            step.actions.forEach(action => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span class="action-icon">📋</span> ${action}`;
                actionsList.appendChild(listItem);
            });
            
            actionsContainer.appendChild(actionsList);
            content.appendChild(actionsContainer);
        }

        // Contacts if present
        if (step.contacts && step.contacts.length > 0) {
            const contactsContainer = document.createElement('div');
            contactsContainer.className = 'contacts-container';
            
            const contactsTitle = document.createElement('h4');
            contactsTitle.textContent = 'Required Contacts:';
            contactsContainer.appendChild(contactsTitle);

            const contactsList = document.createElement('ul');
            contactsList.className = 'contacts-list';
            
            step.contacts.forEach(contact => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span class="contact-icon">📞</span> ${contact}`;
                contactsList.appendChild(listItem);
            });
            
            contactsContainer.appendChild(contactsList);
            content.appendChild(contactsContainer);
        }

        // Complete button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-primary enhanced-btn complete-btn';
        completeBtn.innerHTML = '✅ Complete Diagnosis';
        completeBtn.addEventListener('click', () => this.completeDiagnosis(step));
        content.appendChild(completeBtn);

        return content;
    }

    /**
     * Create generic step fallback
     */
    createGenericStep(step) {
        const content = document.createElement('div');
        content.className = 'step-content generic-step';

        const text = document.createElement('p');
        text.textContent = step.content || 'Step content not available';
        content.appendChild(text);

        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary enhanced-btn';
        continueBtn.textContent = 'Continue';
        continueBtn.addEventListener('click', () => this.nextStep());
        content.appendChild(continueBtn);

        return content;
    }

    /**
     * Handle option selection
     */
    selectOption(option, optionIndex) {
        console.log(`📝 Option selected:`, option.text);
        
        // Log decision
        this.logDecision(option, optionIndex);
        
        // Store response
        this.responses[this.currentStepIndex] = {
            option: option,
            optionIndex: optionIndex,
            timestamp: new Date()
        };
        
        // Add to history
        this.history.push({
            stepIndex: this.currentStepIndex,
            response: option
        });

        // Navigate to next step
        if (option.nextStep !== undefined) {
            this.goToStep(option.nextStep);
        } else {
            this.nextStep();
        }
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStepIndex < this.currentFlow.steps.length - 1) {
            this.currentStepIndex++;
            this.renderCurrentStep();
        } else {
            this.completeDiagnosis();
        }
    }

    /**
     * Go to specific step
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.currentFlow.steps.length) {
            this.currentStepIndex = stepIndex;
            this.renderCurrentStep();
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.renderCurrentStep();
        }
    }

    /**
     * Update navigation buttons
     */
    updateNavigation() {
        const prevBtn = document.getElementById('previousStepBtn');
        if (prevBtn) {
            prevBtn.disabled = this.currentStepIndex === 0;
            prevBtn.onclick = () => this.previousStep();
        }
    }

    /**
     * Complete diagnosis
     */
    completeDiagnosis(finalStep = null) {
        console.log('🏁 Completing diagnosis...');
        
        // Log completion
        if (window.enhancedDiagnosticLogger && finalStep) {
            window.enhancedDiagnosticLogger.logOutcome(
                finalStep.result || finalStep.content,
                finalStep.severity || 'continue',
                finalStep.contacts || [],
                finalStep.actions || [],
                finalStep.stopReason
            );
            
            const completedSession = window.enhancedDiagnosticLogger.completeSession();
            console.log('✅ Session completed:', completedSession);
        }

        // Show completion message
        setTimeout(() => {
            alert(`Diagnosis completed!\n\nIssue: ${this.currentFlow.title}\nTime taken: ${this.getSessionDuration()}\n\nSession logged for audit trail.`);
            
            // Return to categories
            this.returnToCategories();
        }, 1000);
    }

    /**
     * Return to categories screen
     */
    returnToCategories() {
        // Hide wizard screen
        document.getElementById('wizardScreen')?.classList.remove('active');
        
        // Show category screen
        document.getElementById('categoryScreen')?.classList.add('active');
        
        // Refresh categories if needed
        if (window.populateCategories) {
            window.populateCategories();
        }
    }

    /**
     * Log step progression
     */
    logStepProgression(step) {
        if (window.enhancedDiagnosticLogger) {
            window.enhancedDiagnosticLogger.logStep(
                this.currentStepIndex,
                step.title,
                step.type,
                step.content
            );
        }
    }

    /**
     * Log decision
     */
    logDecision(option, optionIndex) {
        if (window.enhancedDiagnosticLogger) {
            const currentStep = this.currentFlow.steps[this.currentStepIndex];
            window.enhancedDiagnosticLogger.logDecision(
                this.currentStepIndex,
                currentStep.content || currentStep.title,
                option.text,
                optionIndex,
                option.severity
            );
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return localStorage.getItem('gne_user_id') || 
               localStorage.getItem('breakdownGuide_userId') || 
               'supervisor_' + Date.now();
    }

    /**
     * Get session duration
     */
    getSessionDuration() {
        if (!this.startTime) return 'Unknown';
        
        const duration = Date.now() - this.startTime.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(`Error: ${message}`);
        console.error('❌ Wizard Error:', message);
    }
}

// Initialize wizard and make it globally available
window.diagnosticWizard = new EnhancedDiagnosticWizard();

// Override the existing startDiagnostic function
window.startDiagnostic = function(issueId) {
    console.log('🚀 Starting enhanced diagnosis for:', issueId);
    window.diagnosticWizard.startDiagnosis(issueId);
};

// Wizard navigation functions
window.wizardGoToCategories = function() {
    window.diagnosticWizard.returnToCategories();
};

window.wizardPreviousStep = function() {
    window.diagnosticWizard.previousStep();
};

console.log('✅ Enhanced Diagnostic Wizard ready!');
