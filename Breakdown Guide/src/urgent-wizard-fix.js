/**
 * URGENT FIX: Wizard State Reset Issue
 * This fixes the critical bug where previous diagnostic content persists when switching categories
 */

// Override the existing startDiagnostic function to force proper state reset
(function() {
    'use strict';
    
    console.log('🚨 URGENT FIX: Loading wizard state reset patch...');
    
    // Store original functions if they exist
    const originalStartDiagnostic = window.startDiagnostic;
    const originalShowScreen = window.showScreen;
    
    // Enhanced state reset function
    function forceResetWizardState() {
        console.log('🔄 FORCE RESET: Clearing all wizard state');
        
        // Reset global app state
        if (window.appState) {
            window.appState.currentIssue = null;
            window.appState.currentStep = 0;
            window.appState.notes = '';
            window.appState.sessionStart = null;
        }
        
        // Clear all wizard content areas
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            wizardContent.innerHTML = '<div class="loading-state">Initializing diagnostic...</div>';
        }
        
        // Reset all progress indicators
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = '';
        }
        
        const breadcrumbTrail = document.getElementById('breadcrumbTrail');
        if (breadcrumbTrail) {
            breadcrumbTrail.textContent = '';
        }
        
        const wizardTitle = document.getElementById('wizardTitle');
        if (wizardTitle) {
            wizardTitle.textContent = '';
        }
        
        // Clear notes
        const notesInput = document.getElementById('notesInput');
        if (notesInput) {
            notesInput.value = '';
        }
        
        // Reset navigation buttons
        const previousStepBtn = document.getElementById('previousStepBtn');
        if (previousStepBtn) {
            previousStepBtn.disabled = true;
        }
        
        // Clear any cached wizard instances
        if (window.wizard) {
            window.wizard.currentFlow = null;
            window.wizard.currentStep = 0;
            window.wizard.previousSteps = [];
            window.wizard.isInitialized = false;
        }
        
        console.log('✅ FORCE RESET: Wizard state cleared');
    }
    
    // Enhanced startDiagnostic function with forced state reset
    function fixedStartDiagnostic(issueId) {
        console.log(`🚀 FIXED START: Starting diagnostic for ${issueId}`);
        
        // CRITICAL: Force complete state reset first
        forceResetWizardState();
        
        // Validate diagnostic exists
        if (!window.diagnosticFlows || !window.diagnosticFlows[issueId]) {
            console.error(`❌ Diagnostic flow not found: ${issueId}`);
            alert(`Error: Diagnostic '${issueId}' not found`);
            return;
        }
        
        const flow = window.diagnosticFlows[issueId];
        console.log(`✅ Found flow: ${flow.title} (${flow.steps.length} steps)`);
        
        // Set new state after reset
        if (window.appState) {
            window.appState.currentIssue = issueId;
            window.appState.currentStep = 0;
            window.appState.sessionStart = new Date();
            window.appState.notes = '';
        }
        
        // Initialize wizard if available
        if (window.wizard && typeof window.wizard.init === 'function') {
            console.log('🧙‍♂️ Initializing enhanced wizard');
            if (window.wizard.init(issueId)) {
                showScreen('wizard');
                window.wizard.displayStep();
                return;
            }
        }
        
        // Fallback to basic wizard display
        console.log('📋 Using fallback wizard display');
        showScreen('wizard');
        
        // Small delay to ensure screen transition, then display step
        setTimeout(() => {
            displayStepFixed(issueId, 0);
        }, 100);
    }
    
    // Enhanced displayStep function that forces correct content
    function displayStepFixed(issueId, stepIndex) {
        console.log(`📋 DISPLAY STEP: ${issueId} step ${stepIndex}`);
        
        const flow = window.diagnosticFlows[issueId];
        if (!flow) {
            console.error(`❌ Flow not found: ${issueId}`);
            return;
        }
        
        const step = flow.steps[stepIndex];
        if (!step) {
            console.error(`❌ Step ${stepIndex} not found in ${issueId}`);
            return;
        }
        
        console.log(`✅ Displaying: ${step.title}`);
        
        // Update header information
        const wizardTitle = document.getElementById('wizardTitle');
        if (wizardTitle) {
            wizardTitle.textContent = flow.title;
            console.log(`📝 Title set: ${flow.title}`);
        }
        
        const breadcrumbTrail = document.getElementById('breadcrumbTrail');
        if (breadcrumbTrail) {
            breadcrumbTrail.textContent = `Home > ${flow.title} > Step ${stepIndex + 1}`;
        }
        
        // Update progress
        const progress = ((stepIndex + 1) / flow.steps.length) * 100;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = `Step ${stepIndex + 1} of ${flow.steps.length}`;
        }
        
        // Render step content
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            wizardContent.innerHTML = ''; // Clear first
            
            const container = document.createElement('div');
            container.className = 'step-container';
            
            // Step title
            const title = document.createElement('h2');
            title.className = 'step-title';
            title.textContent = step.title;
            container.appendChild(title);
            
            // Warning if present
            if (step.warning) {
                const warning = document.createElement('div');
                warning.className = 'warning-box';
                warning.innerHTML = `⚠️ ${step.warning}`;
                container.appendChild(warning);
            }
            
            // Step content
            const content = document.createElement('div');
            content.className = 'step-content';
            content.innerHTML = step.content;
            container.appendChild(content);
            
            // Render based on step type
            renderStepContent(step, container, issueId, stepIndex);
            
            wizardContent.appendChild(container);
            console.log(`✅ Content rendered for step: ${step.title}`);
        }
        
        // Update navigation
        const previousStepBtn = document.getElementById('previousStepBtn');
        if (previousStepBtn) {
            previousStepBtn.disabled = stepIndex === 0;
        }
    }
    
    // Render step content based on type
    function renderStepContent(step, container, issueId, stepIndex) {
        switch (step.type) {
            case 'question':
                renderQuestionContent(step, container, issueId);
                break;
            case 'action':
                renderActionContent(step, container, issueId, stepIndex);
                break;
            case 'final':
                renderFinalContent(step, container);
                break;
            case 'info':
            default:
                renderInfoContent(step, container, issueId, stepIndex);
                break;
        }
    }
    
    // Render question step
    function renderQuestionContent(step, container, issueId) {
        // Add checklist if present
        if (step.checklist) {
            const checklistDiv = document.createElement('div');
            checklistDiv.className = 'checklist-container';
            checklistDiv.innerHTML = '<h3>Check for these symptoms:</h3>';
            
            const list = document.createElement('ul');
            list.className = 'checklist';
            step.checklist.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
            checklistDiv.appendChild(list);
            container.appendChild(checklistDiv);
        }
        
        // Add options
        if (step.options) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options-container';
            
            step.options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-button';
                
                if (option.severity === 'critical') {
                    btn.classList.add('critical');
                } else if (option.severity === 'warning') {
                    btn.classList.add('warning');
                }
                
                const buttonText = option.icon ? `${option.icon} ${option.text}` : option.text;
                btn.innerHTML = buttonText;
                
                btn.addEventListener('click', () => {
                    console.log(`🔄 Option selected: ${option.text} -> Step ${option.nextStep}`);
                    
                    if (typeof option.nextStep === 'number') {
                        // Update app state
                        if (window.appState) {
                            window.appState.currentStep = option.nextStep;
                        }
                        
                        // Display next step
                        displayStepFixed(issueId, option.nextStep);
                    } else {
                        console.log('🏁 End of flow reached');
                        completeDiagnostic(issueId);
                    }
                });
                
                optionsDiv.appendChild(btn);
            });
            
            container.appendChild(optionsDiv);
        }
    }
    
    // Render action step
    function renderActionContent(step, container, issueId, stepIndex) {
        if (step.instructions) {
            const instructionsDiv = document.createElement('div');
            instructionsDiv.className = 'instructions-container';
            instructionsDiv.innerHTML = '<h3>Follow these steps:</h3>';
            
            const list = document.createElement('ol');
            step.instructions.forEach(instruction => {
                const li = document.createElement('li');
                li.textContent = instruction;
                list.appendChild(li);
            });
            instructionsDiv.appendChild(list);
            container.appendChild(instructionsDiv);
        }
        
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary';
        continueBtn.innerHTML = '✅ Continue';
        continueBtn.addEventListener('click', () => {
            const nextStep = step.nextStep !== undefined ? step.nextStep : stepIndex + 1;
            console.log(`➡️ Continuing to step ${nextStep}`);
            
            if (window.appState) {
                window.appState.currentStep = nextStep;
            }
            
            displayStepFixed(issueId, nextStep);
        });
        container.appendChild(continueBtn);
    }
    
    // Render final step
    function renderFinalContent(step, container) {
        const resultDiv = document.createElement('div');
        resultDiv.className = `final-result ${step.severity}`;
        
        const resultText = document.createElement('div');
        resultText.className = 'result-text';
        resultText.innerHTML = step.result;
        resultDiv.appendChild(resultText);
        
        if (step.severity === 'stop' && step.stopReason) {
            const stopAlert = document.createElement('div');
            stopAlert.className = 'stop-alert';
            stopAlert.innerHTML = `<h3>🛑 VEHICLE MUST STOP</h3><p>${step.stopReason}</p>`;
            resultDiv.appendChild(stopAlert);
        }
        
        if (step.actions) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions-section';
            actionsDiv.innerHTML = '<h3>Required Actions:</h3>';
            
            const actionsList = document.createElement('ul');
            step.actions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action;
                actionsList.appendChild(li);
            });
            actionsDiv.appendChild(actionsList);
            resultDiv.appendChild(actionsDiv);
        }
        
        if (step.contacts) {
            const contactsDiv = document.createElement('div');
            contactsDiv.className = 'contacts-section';
            contactsDiv.innerHTML = '<h3>Required Contacts:</h3>';
            
            const contactsList = document.createElement('ul');
            step.contacts.forEach(contact => {
                const li = document.createElement('li');
                li.textContent = contact;
                contactsList.appendChild(li);
            });
            contactsDiv.appendChild(contactsList);
            resultDiv.appendChild(contactsDiv);
        }
        
        container.appendChild(resultDiv);
        
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-primary';
        completeBtn.innerHTML = '✅ Complete Diagnosis';
        completeBtn.addEventListener('click', () => {
            completeDiagnostic();
        });
        container.appendChild(completeBtn);
    }
    
    // Render info step
    function renderInfoContent(step, container, issueId, stepIndex) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-primary';
        nextBtn.innerHTML = '➡️ Next';
        nextBtn.addEventListener('click', () => {
            const nextStep = stepIndex + 1;
            console.log(`➡️ Moving to next step: ${nextStep}`);
            
            if (window.appState) {
                window.appState.currentStep = nextStep;
            }
            
            displayStepFixed(issueId, nextStep);
        });
        container.appendChild(nextBtn);
    }
    
    // Complete diagnostic
    function completeDiagnostic(issueId) {
        console.log('✅ Completing diagnostic');
        alert('✅ Diagnosis completed successfully');
        
        // Reset and return to categories
        forceResetWizardState();
        showScreen('category');
        if (typeof populateCategories === 'function') {
            populateCategories();
        }
    }
    
    // Enhanced showScreen function
    function showScreen(screenName) {
        console.log(`🖥️ Showing screen: ${screenName}`);
        
        // If switching to wizard, ensure clean state
        if (screenName === 'wizard') {
            console.log('🧙‍♂️ Preparing wizard screen');
        }
        
        // Call original showScreen if it exists
        if (originalShowScreen) {
            originalShowScreen(screenName);
        } else {
            // Fallback implementation
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            const targetScreen = document.getElementById(screenName + 'Screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
            }
        }
    }
    
    // Override global functions
    window.startDiagnostic = fixedStartDiagnostic;
    window.showScreen = showScreen;
    window.forceResetWizardState = forceResetWizardState;
    
    // Override category card click handlers
    function fixCategoryCardHandlers() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const categoryCards = document.querySelectorAll('.category-card');
            categoryCards.forEach(card => {
                // Remove existing click handlers
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
                
                // Add fixed click handler
                newCard.addEventListener('click', () => {
                    const title = newCard.querySelector('.category-title');
                    if (title) {
                        const categoryTitle = title.textContent.trim();
                        
                        // Map titles to IDs
                        const titleToId = {
                            'Brake Issues': 'brakes',
                            'Steering Problems': 'steering',
                            'ABS Light Warning': 'abs-light',
                            'Oil Warning Light': 'oil-warning',
                            'Loose Wheel Nuts': 'loose-wheel-nuts',
                            'Engine Overheating': 'overheating',
                            'Door Problems': 'doors',
                            'Vehicle Won\'t Start': 'non-starter',
                            'Gear Selection Problems': 'gear-selection',
                            'Demisters/Heaters Not Working': 'demisters-heaters',
                            'Exterior Lights Problems': 'exterior-lights'
                        };
                        
                        const issueId = titleToId[categoryTitle];
                        if (issueId) {
                            console.log(`🎯 Category clicked: ${categoryTitle} -> ${issueId}`);
                            fixedStartDiagnostic(issueId);
                        } else {
                            console.warn(`⚠️ Unknown category: ${categoryTitle}`);
                        }
                    }
                });
            });
            
            console.log(`✅ Fixed ${categoryCards.length} category card handlers`);
        }, 1000);
    }
    
    // Fix navigation buttons
    function fixNavigationButtons() {
        const returnToCategoriesBtn = document.getElementById('returnToCategoriesBtn');
        if (returnToCategoriesBtn) {
            returnToCategoriesBtn.addEventListener('click', () => {
                console.log('🔙 Returning to categories with state reset');
                forceResetWizardState();
                showScreen('category');
                if (typeof populateCategories === 'function') {
                    populateCategories();
                }
            });
        }
        
        const wizardBackBtn = document.getElementById('wizardBackBtn');
        if (wizardBackBtn) {
            wizardBackBtn.addEventListener('click', () => {
                console.log('🔙 Wizard back button clicked');
                forceResetWizardState();
                showScreen('category');
                if (typeof populateCategories === 'function') {
                    populateCategories();
                }
            });
        }
    }
    
    // Initialize fixes
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔧 Applying urgent wizard fixes...');
        fixNavigationButtons();
        fixCategoryCardHandlers();
        console.log('✅ Urgent wizard fixes applied');
    });
    
    // Also fix when DOM is already loaded
    if (document.readyState === 'loading') {
        // DOM not ready yet
    } else {
        // DOM is ready
        setTimeout(() => {
            fixNavigationButtons();
            fixCategoryCardHandlers();
        }, 500);
    }
    
    console.log('🚨 URGENT FIX: Wizard state reset patch loaded successfully');
    
})();