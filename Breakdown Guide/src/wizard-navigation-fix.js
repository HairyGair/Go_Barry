/**
 * Complete Navigation and Wizard State Fix
 * Fixes navigation issues and ensures proper state reset between diagnostics
 */

// Enhanced wizard management with proper state reset
class BreakdownGuideWizard {
    constructor() {
        this.currentFlow = null;
        this.currentStep = 0;
        this.previousSteps = [];
        this.startTime = null;
        this.isInitialized = false;
    }

    // Initialize wizard for a specific diagnostic
    init(issueId) {
        console.log(`🚀 Initializing wizard for: ${issueId}`);
        
        // Validate flow exists
        if (!diagnosticFlows || !diagnosticFlows[issueId]) {
            console.error(`❌ Flow not found: ${issueId}`);
            this.showError('Diagnostic flow not found');
            return false;
        }

        // Complete reset
        this.reset();
        
        // Set new state
        this.currentFlow = diagnosticFlows[issueId];
        this.currentStep = 0;
        this.previousSteps = [];
        this.startTime = new Date();
        this.isInitialized = true;

        // Update app state
        appState.currentIssue = issueId;
        appState.currentStep = 0;
        appState.sessionStart = this.startTime;

        return true;
    }

    // Complete state reset
    reset() {
        console.log('🔄 Resetting wizard state');
        
        this.currentFlow = null;
        this.currentStep = 0;
        this.previousSteps = [];
        this.startTime = null;
        this.isInitialized = false;

        // Clear UI elements
        this.clearWizardContent();
        this.resetProgress();
        this.resetNavigation();
    }

    // Clear wizard content area
    clearWizardContent() {
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            wizardContent.innerHTML = '';
        }
    }

    // Reset progress indicators
    resetProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const breadcrumbTrail = document.getElementById('breadcrumbTrail');
        const wizardTitle = document.getElementById('wizardTitle');

        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '';
        if (breadcrumbTrail) breadcrumbTrail.textContent = '';
        if (wizardTitle) wizardTitle.textContent = '';
    }

    // Reset navigation buttons
    resetNavigation() {
        const previousStepBtn = document.getElementById('previousStepBtn');
        if (previousStepBtn) {
            previousStepBtn.disabled = true;
        }
    }

    // Display current step
    displayStep() {
        if (!this.isInitialized || !this.currentFlow) {
            console.error('❌ Wizard not initialized');
            return;
        }

        const step = this.currentFlow.steps[this.currentStep];
        if (!step) {
            console.error('❌ Step not found:', this.currentStep);
            return;
        }

        console.log(`📋 Displaying step ${this.currentStep + 1}: ${step.title}`);

        // Update header
        this.updateHeader();

        // Update progress
        this.updateProgress();

        // Render step content
        this.renderStep(step);

        // Update navigation
        this.updateNavigation();

        // Scroll to top
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            wizardContent.scrollTop = 0;
        }
    }

    // Update wizard header
    updateHeader() {
        const wizardTitle = document.getElementById('wizardTitle');
        const breadcrumbTrail = document.getElementById('breadcrumbTrail');

        if (wizardTitle) {
            wizardTitle.textContent = this.currentFlow.title;
        }
        if (breadcrumbTrail) {
            breadcrumbTrail.textContent = `Home > ${this.currentFlow.title} > Step ${this.currentStep + 1}`;
        }
    }

    // Update progress indicators
    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        const progress = ((this.currentStep + 1) / this.currentFlow.steps.length) * 100;
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1} of ${this.currentFlow.steps.length}`;
        }
    }

    // Render step content
    renderStep(step) {
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) {
            console.error('❌ wizardContent element not found');
            return;
        }

        // Clear content
        wizardContent.innerHTML = '';

        // Create container
        const container = document.createElement('div');
        container.className = 'step-container';

        // Add step title
        const title = document.createElement('h2');
        title.className = 'step-title';
        title.textContent = step.title;
        container.appendChild(title);

        // Add warning if present
        if (step.warning) {
            const warning = document.createElement('div');
            warning.className = 'warning-box';
            warning.innerHTML = `⚠️ ${step.warning}`;
            container.appendChild(warning);
        }

        // Add content
        const content = document.createElement('div');
        content.className = 'step-content';
        content.innerHTML = step.content;
        container.appendChild(content);

        // Add info if present
        if (step.info) {
            const info = document.createElement('div');
            info.className = 'info-box';
            info.innerHTML = `ℹ️ ${step.info}`;
            container.appendChild(info);
        }

        // Render based on step type
        switch (step.type) {
            case 'question':
                this.renderQuestion(step, container);
                break;
            case 'action':
                this.renderAction(step, container);
                break;
            case 'final':
                this.renderFinal(step, container);
                break;
            case 'info':
            default:
                this.renderInfo(step, container);
                break;
        }

        wizardContent.appendChild(container);
    }

    // Render question step
    renderQuestion(step, container) {
        // Add checklist if present
        if (step.checklist) {
            const checklistContainer = document.createElement('div');
            checklistContainer.className = 'checklist-container';
            
            const checklistTitle = document.createElement('h3');
            checklistTitle.textContent = 'Check for these symptoms:';
            checklistContainer.appendChild(checklistTitle);
            
            const checklist = document.createElement('ul');
            checklist.className = 'checklist';
            
            step.checklist.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                checklist.appendChild(li);
            });
            
            checklistContainer.appendChild(checklist);
            container.appendChild(checklistContainer);
        }

        // Add options
        if (step.options) {
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container';
            
            step.options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'option-button';
                
                // Add severity classes
                if (option.severity === 'critical') {
                    button.classList.add('critical');
                } else if (option.severity === 'warning') {
                    button.classList.add('warning');
                } else if (option.severity === 'continue') {
                    button.classList.add('continue');
                }
                
                // Add content
                const buttonText = option.icon ? `${option.icon} ${option.text}` : option.text;
                button.innerHTML = buttonText;
                
                // Add click handler
                button.addEventListener('click', () => {
                    this.handleOptionClick(option);
                });
                
                optionsContainer.appendChild(button);
            });
            
            container.appendChild(optionsContainer);
        }
    }

    // Render action step
    renderAction(step, container) {
        // Add instructions if present
        if (step.instructions) {
            const instructionsContainer = document.createElement('div');
            instructionsContainer.className = 'instructions-container';
            
            const instructionsTitle = document.createElement('h3');
            instructionsTitle.textContent = 'Follow these steps:';
            instructionsContainer.appendChild(instructionsTitle);
            
            const list = document.createElement('ol');
            list.className = 'instructions-list';
            
            step.instructions.forEach(instruction => {
                const li = document.createElement('li');
                li.textContent = instruction;
                list.appendChild(li);
            });
            
            instructionsContainer.appendChild(list);
            container.appendChild(instructionsContainer);
        }

        // Add timer if present
        if (step.timer) {
            const timerContainer = document.createElement('div');
            timerContainer.className = 'timer-container';
            timerContainer.innerHTML = `
                <div class="timer-display">
                    <span class="timer-icon">⏱️</span>
                    <span class="timer-text">Allow ${step.timer} seconds for completion</span>
                </div>
            `;
            container.appendChild(timerContainer);
        }

        // Add continue button
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary continue-btn';
        continueBtn.innerHTML = '✅ Continue';
        continueBtn.addEventListener('click', () => {
            this.nextStep(step.nextStep);
        });
        container.appendChild(continueBtn);
    }

    // Render final step
    renderFinal(step, container) {
        const resultContainer = document.createElement('div');
        resultContainer.className = 'final-result';
        
        if (step.severity === 'stop') {
            resultContainer.classList.add('stop');
        } else if (step.severity === 'warning') {
            resultContainer.classList.add('warning');
        } else {
            resultContainer.classList.add('continue');
        }

        // Add result
        const result = document.createElement('div');
        result.className = 'result-text';
        result.innerHTML = step.result;
        resultContainer.appendChild(result);

        // Add stop alert if critical
        if (step.severity === 'stop' && step.stopReason) {
            const stopAlert = document.createElement('div');
            stopAlert.className = 'stop-alert';
            stopAlert.innerHTML = `
                <h3>🛑 VEHICLE MUST STOP</h3>
                <p>${step.stopReason}</p>
            `;
            resultContainer.appendChild(stopAlert);
        }

        // Add actions if present
        if (step.actions && step.actions.length > 0) {
            const actionsSection = document.createElement('div');
            actionsSection.className = 'actions-section';
            actionsSection.innerHTML = '<h3>Required Actions:</h3>';
            
            const actionsList = document.createElement('ul');
            step.actions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action;
                actionsList.appendChild(li);
            });
            actionsSection.appendChild(actionsList);
            resultContainer.appendChild(actionsSection);
        }

        // Add contacts if present
        if (step.contacts && step.contacts.length > 0) {
            const contactsSection = document.createElement('div');
            contactsSection.className = 'contacts-section';
            contactsSection.innerHTML = '<h3>Required Contacts:</h3>';
            
            const contactsList = document.createElement('ul');
            step.contacts.forEach(contact => {
                const li = document.createElement('li');
                li.textContent = contact;
                contactsList.appendChild(li);
            });
            contactsSection.appendChild(contactsList);
            resultContainer.appendChild(contactsSection);
        }

        container.appendChild(resultContainer);

        // Add completion button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-primary complete-btn';
        completeBtn.innerHTML = '✅ Complete Diagnosis';
        completeBtn.addEventListener('click', () => {
            this.completeDiagnosis();
        });
        container.appendChild(completeBtn);
    }

    // Render info step
    renderInfo(step, container) {
        // Add next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-primary next-btn';
        nextBtn.innerHTML = '➡️ Next';
        nextBtn.addEventListener('click', () => {
            this.nextStep();
        });
        container.appendChild(nextBtn);
    }

    // Handle option click
    handleOptionClick(option) {
        console.log('🔄 Option selected:', option.text);
        
        if (typeof option.nextStep === 'number') {
            this.goToStep(option.nextStep);
        } else {
            // No specific next step - likely end of flow
            this.completeDiagnosis();
        }
    }

    // Go to specific step
    goToStep(stepNumber) {
        if (stepNumber >= 0 && stepNumber < this.currentFlow.steps.length) {
            this.previousSteps.push(this.currentStep);
            this.currentStep = stepNumber;
            appState.currentStep = stepNumber;
            this.displayStep();
        } else {
            console.error('❌ Invalid step number:', stepNumber);
        }
    }

    // Go to next step
    nextStep(specificStep) {
        if (typeof specificStep === 'number') {
            this.goToStep(specificStep);
        } else if (this.currentStep < this.currentFlow.steps.length - 1) {
            this.goToStep(this.currentStep + 1);
        } else {
            this.completeDiagnosis();
        }
    }

    // Go to previous step
    previousStep() {
        if (this.previousSteps.length > 0) {
            this.currentStep = this.previousSteps.pop();
            appState.currentStep = this.currentStep;
            this.displayStep();
        }
    }

    // Update navigation buttons
    updateNavigation() {
        const previousStepBtn = document.getElementById('previousStepBtn');
        if (previousStepBtn) {
            previousStepBtn.disabled = this.previousSteps.length === 0;
        }
    }

    // Complete diagnosis
    completeDiagnosis() {
        console.log('✅ Diagnosis completed');
        
        // Save to history
        const session = {
            id: Date.now(),
            issueId: appState.currentIssue,
            issueTitle: this.currentFlow.title,
            startTime: this.startTime,
            endTime: new Date(),
            completed: true
        };
        
        if (!appState.diagnosticHistory) {
            appState.diagnosticHistory = [];
        }
        
        appState.diagnosticHistory.unshift(session);
        if (appState.diagnosticHistory.length > 50) {
            appState.diagnosticHistory = appState.diagnosticHistory.slice(0, 50);
        }
        
        saveState();
        
        alert('✅ Diagnosis completed and logged.');
        this.returnToCategories();
    }

    // Return to categories with complete reset
    returnToCategories() {
        console.log('🔙 Returning to categories');
        this.reset();
        showScreen('category');
        populateCategories();
    }

    // Show error
    showError(message) {
        console.error('❌ Wizard error:', message);
        alert('Error: ' + message);
    }
}

// Create global wizard instance
const wizard = new BreakdownGuideWizard();

// Enhanced startDiagnostic function
function startDiagnostic(issueId) {
    console.log(`🚀 Starting diagnostic: ${issueId}`);
    
    if (wizard.init(issueId)) {
        showScreen('wizard');
        wizard.displayStep();
        saveState();
    }
}

// Enhanced navigation functions
function handleWizardBack() {
    if (wizard.previousSteps.length > 0) {
        wizard.previousStep();
    } else {
        wizard.returnToCategories();
    }
}

function returnToCategories() {
    wizard.returnToCategories();
}

// Enhanced event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update return to categories button
    const returnToCategoriesBtn = document.getElementById('returnToCategoriesBtn');
    if (returnToCategoriesBtn) {
        returnToCategoriesBtn.addEventListener('click', returnToCategories);
    }
    
    // Update wizard back button
    const wizardBackBtn = document.getElementById('wizardBackBtn');
    if (wizardBackBtn) {
        wizardBackBtn.addEventListener('click', handleWizardBack);
    }
    
    // Update previous step button
    const previousStepBtn = document.getElementById('previousStepBtn');
    if (previousStepBtn) {
        previousStepBtn.addEventListener('click', () => {
            wizard.previousStep();
        });
    }
    
    console.log('✅ Enhanced wizard navigation loaded');
});

// Export for global access
window.wizard = wizard;
window.startDiagnostic = startDiagnostic;

console.log('🔧 Complete wizard fix loaded - navigation and state management enhanced');