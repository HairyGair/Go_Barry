/**
 * Navigation and State Reset Fix
 * Fixes the issue where previous diagnostic state persists when switching categories
 */

// Enhanced startDiagnostic function with proper state reset
function startDiagnostic(issueId) {
    if (typeof diagnosticFlows === 'undefined' || !diagnosticFlows[issueId]) {
        showError('Diagnostic flow not found');
        return;
    }
    
    console.log(`🚀 Starting diagnostic: ${issueId}`);
    
    // COMPLETE STATE RESET - This was missing!
    resetWizardState();
    
    // Set new state
    appState.currentIssue = issueId;
    appState.currentStep = 0;
    appState.sessionStart = new Date();
    appState.notes = '';
    
    // Clear any previous wizard content
    if (elements.wizardContent) {
        elements.wizardContent.innerHTML = '';
    }
    
    // Track recent usage
    if (!appState.recentCategories.includes(issueId)) {
        appState.recentCategories.unshift(issueId);
        if (appState.recentCategories.length > MAX_RECENT_ITEMS) {
            appState.recentCategories.pop();
        }
    }
    
    // Show wizard screen
    showScreen('wizard');
    
    // Initialize and display first step
    displayStep();
    
    saveState();
}

// New function to completely reset wizard state
function resetWizardState() {
    console.log('🔄 Resetting wizard state');
    
    // Reset app state
    appState.currentIssue = null;
    appState.currentStep = 0;
    appState.notes = '';
    
    // Clear wizard content
    if (elements.wizardContent) {
        elements.wizardContent.innerHTML = '<div class="loading">Loading diagnostic...</div>';
    }
    
    // Reset progress indicators
    if (elements.progressBar) {
        elements.progressBar.style.width = '0%';
    }
    if (elements.progressText) {
        elements.progressText.textContent = '';
    }
    if (elements.breadcrumbTrail) {
        elements.breadcrumbTrail.textContent = '';
    }
    if (elements.wizardTitle) {
        elements.wizardTitle.textContent = '';
    }
    
    // Clear notes
    if (elements.notesInput) {
        elements.notesInput.value = '';
    }
    
    // Reset navigation buttons
    if (elements.previousStepBtn) {
        elements.previousStepBtn.disabled = true;
    }
}

// Enhanced returnToCategoriesBtn handler with proper reset
function returnToCategories() {
    console.log('🔙 Returning to categories');
    
    // Reset wizard state completely
    resetWizardState();
    
    // Show categories screen
    showScreen('category');
    populateCategories();
}

// Enhanced handleWizardBack with better state management
function handleWizardBack() {
    if (appState.currentStep > 0) {
        previousStep();
    } else {
        // If at first step, return to categories with state reset
        returnToCategories();
    }
}

// Fixed displayStep function with better error handling
function displayStep() {
    const flow = diagnosticFlows[appState.currentIssue];
    if (!flow) {
        console.error('❌ No flow found for:', appState.currentIssue);
        showError('Diagnostic flow not found');
        return;
    }
    
    const step = flow.steps[appState.currentStep];
    if (!step) {
        console.error('❌ No step found:', appState.currentStep, 'in flow:', appState.currentIssue);
        showError('Diagnostic step not found');
        return;
    }
    
    console.log(`📋 Displaying step ${appState.currentStep + 1} of ${flow.steps.length}: ${step.title}`);
    
    // Update header with null checks
    if (elements.wizardTitle) {
        elements.wizardTitle.textContent = flow.title;
    }
    if (elements.breadcrumbTrail) {
        elements.breadcrumbTrail.textContent = `Home > ${flow.title} > Step ${appState.currentStep + 1}`;
    }
    
    // Update progress with null checks
    const progress = ((appState.currentStep + 1) / flow.steps.length) * 100;
    if (elements.progressBar) {
        elements.progressBar.style.width = progress + '%';
    }
    if (elements.progressText) {
        elements.progressText.textContent = `Step ${appState.currentStep + 1} of ${flow.steps.length}`;
    }
    
    // Clear and update content
    if (!elements.wizardContent) {
        console.error('❌ wizardContent element not found');
        return;
    }
    
    elements.wizardContent.innerHTML = '';
    
    // Create step container
    const stepContainer = document.createElement('div');
    stepContainer.className = 'step-container';
    
    // Step title
    const stepTitle = document.createElement('h2');
    stepTitle.className = 'step-title';
    stepTitle.textContent = step.title;
    stepContainer.appendChild(stepTitle);
    
    // Warning box
    if (step.warning) {
        const warningBox = document.createElement('div');
        warningBox.className = 'warning-box';
        warningBox.innerHTML = `⚠️ ${step.warning}`;
        stepContainer.appendChild(warningBox);
    }
    
    // Step content
    const stepContent = document.createElement('div');
    stepContent.className = 'step-content';
    stepContent.innerHTML = step.content; // Use innerHTML to support rich text
    stepContainer.appendChild(stepContent);
    
    // Add info text if present
    if (step.info) {
        const infoBox = document.createElement('div');
        infoBox.className = 'info-box';
        infoBox.innerHTML = `ℹ️ ${step.info}`;
        stepContainer.appendChild(infoBox);
    }
    
    // Handle different step types
    switch(step.type) {
        case 'question':
            renderQuestionStep(step, stepContainer);
            break;
        case 'action':
            renderActionStep(step, stepContainer);
            break;
        case 'final':
            renderFinalStep(step, stepContainer);
            break;
        case 'info':
            renderInfoStep(step, stepContainer);
            break;
        default:
            console.warn('⚠️ Unknown step type:', step.type);
            renderInfoStep(step, stepContainer); // Fallback
    }
    
    elements.wizardContent.appendChild(stepContainer);
    
    // Update button states
    if (elements.previousStepBtn) {
        elements.previousStepBtn.disabled = appState.currentStep === 0;
    }
    
    // Scroll to top of content
    elements.wizardContent.scrollTop = 0;
}

// Enhanced renderQuestionStep with better option handling
function renderQuestionStep(step, container) {
    if (!step.options) {
        console.warn('⚠️ Question step missing options');
        return;
    }
    
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
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    step.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-button';
        
        // Add severity styling
        if (option.severity === 'critical') {
            optionBtn.classList.add('critical');
        } else if (option.severity === 'warning') {
            optionBtn.classList.add('warning');
        } else if (option.severity === 'continue') {
            optionBtn.classList.add('continue');
        }
        
        // Add icon if present
        const buttonText = option.icon ? `${option.icon} ${option.text}` : option.text;
        optionBtn.innerHTML = buttonText;
        
        optionBtn.addEventListener('click', () => {
            handleOptionClick(option);
        });
        
        optionsContainer.appendChild(optionBtn);
    });
    
    container.appendChild(optionsContainer);
}

// Enhanced renderActionStep with improved instructions display
function renderActionStep(step, container) {
    // Add instructions if present
    if (step.instructions) {
        const instructionsContainer = document.createElement('div');
        instructionsContainer.className = 'instructions-container';
        
        const instructionsTitle = document.createElement('h3');
        instructionsTitle.textContent = 'Follow these steps:';
        instructionsContainer.appendChild(instructionsTitle);
        
        const instructionsList = document.createElement('ol');
        instructionsList.className = 'instructions-list';
        
        step.instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsList.appendChild(li);
        });
        
        instructionsContainer.appendChild(instructionsList);
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
    continueBtn.className = 'btn btn-primary';
    continueBtn.textContent = '✅ Continue';
    continueBtn.addEventListener('click', () => {
        if (step.nextStep !== undefined) {
            appState.currentStep = step.nextStep;
            displayStep();
        } else {
            nextStep();
        }
    });
    container.appendChild(continueBtn);
}

// Apply the fixes by updating event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update return to categories button
    const returnToCategoriesBtn = document.getElementById('returnToCategoriesBtn');
    if (returnToCategoriesBtn) {
        // Remove existing listeners and add new one
        returnToCategoriesBtn.replaceWith(returnToCategoriesBtn.cloneNode(true));
        const newBtn = document.getElementById('returnToCategoriesBtn');
        newBtn.addEventListener('click', returnToCategories);
    }
    
    // Update wizard back button  
    const wizardBackBtn = document.getElementById('wizardBackBtn');
    if (wizardBackBtn) {
        wizardBackBtn.replaceWith(wizardBackBtn.cloneNode(true));
        const newBackBtn = document.getElementById('wizardBackBtn');
        newBackBtn.addEventListener('click', handleWizardBack);
    }
    
    console.log('✅ Navigation and state reset fixes applied');
});

console.log('🔧 Navigation fix loaded - wizard state will now reset properly between diagnostics');