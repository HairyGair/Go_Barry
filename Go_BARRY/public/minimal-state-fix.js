/**
 * MINIMAL STATE RESET FIX
 * This is a lightweight fix that only addresses the state persistence issue
 * without interfering with existing code
 */

(function() {
    'use strict';
    
    console.log('🔧 MINIMAL FIX: Loading state reset patch...');
    
    // Wait for everything to load
    function waitForAppReady() {
        return new Promise((resolve) => {
            function check() {
                if (window.diagnosticFlows && document.getElementById('wizardContent')) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            }
            check();
        });
    }
    
    // Simple state reset function
    function resetWizardState() {
        console.log('🔄 Resetting wizard state');
        
        // Clear wizard content
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            wizardContent.innerHTML = '';
        }
        
        // Reset progress
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = '';
        }
        
        // Reset titles
        const wizardTitle = document.getElementById('wizardTitle');
        if (wizardTitle) {
            wizardTitle.textContent = '';
        }
        
        const breadcrumbTrail = document.getElementById('breadcrumbTrail');
        if (breadcrumbTrail) {
            breadcrumbTrail.textContent = '';
        }
        
        // Reset app state if it exists
        if (window.appState) {
            window.appState.currentIssue = null;
            window.appState.currentStep = 0;
        }
        
        console.log('✅ Wizard state reset complete');
    }
    
    // Simple diagnostic starter
    function startDiagnosticClean(issueId) {
        console.log(`🚀 Starting clean diagnostic: ${issueId}`);
        
        // Force reset first
        resetWizardState();
        
        // Validate flow exists
        if (!window.diagnosticFlows || !window.diagnosticFlows[issueId]) {
            console.error(`❌ Flow not found: ${issueId}`);
            alert(`Diagnostic '${issueId}' not found`);
            return;
        }
        
        const flow = window.diagnosticFlows[issueId];
        console.log(`✅ Found flow: ${flow.title}`);
        
        // Set state
        if (window.appState) {
            window.appState.currentIssue = issueId;
            window.appState.currentStep = 0;
        }
        
        // Show wizard screen
        showWizardScreen();
        
        // Small delay then display
        setTimeout(() => {
            displayCleanStep(issueId, 0);
        }, 100);
    }
    
    // Simple screen switcher
    function showWizardScreen() {
        console.log('🖥️ Showing wizard screen');
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const wizardScreen = document.getElementById('wizardScreen');
        if (wizardScreen) {
            wizardScreen.classList.add('active');
        }
    }
    
    // Simple step display
    function displayCleanStep(issueId, stepIndex) {
        const flow = window.diagnosticFlows[issueId];
        const step = flow.steps[stepIndex];
        
        console.log(`📋 Displaying: ${step.title}`);
        
        // Update header
        const wizardTitle = document.getElementById('wizardTitle');
        if (wizardTitle) {
            wizardTitle.textContent = flow.title;
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
        
        // Render content
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContent) {
            const html = generateStepHTML(step, issueId, stepIndex);
            wizardContent.innerHTML = html;
            
            // Add event listeners
            addStepEventListeners(step, issueId, stepIndex);
        }
    }
    
    // Generate HTML for step
    function generateStepHTML(step, issueId, stepIndex) {
        // This will be overridden by enhanced styling if available
        let html = `
            <div class="step-container">
                <h2 class="step-title">${step.title}</h2>
                ${step.warning ? `<div class="warning-box">⚠️ ${step.warning}</div>` : ''}
                <div class="step-content">${step.content}</div>
                ${step.info ? `<div class="info-box">ℹ️ ${step.info}</div>` : ''}
        `;
        
        // Add type-specific content
        if (step.type === 'question') {
            if (step.checklist) {
                html += '<div class="checklist-container"><h3>Check for these symptoms:</h3><ul class="checklist">';
                step.checklist.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += '</ul></div>';
            }
            
            if (step.options) {
                html += '<div class="options-container">';
                step.options.forEach((option, index) => {
                    const severityClass = option.severity || '';
                    const buttonText = option.icon ? `${option.icon} ${option.text}` : option.text;
                    html += `<button class="option-button ${severityClass}" data-option="${index}">${buttonText}</button>`;
                });
                html += '</div>';
            }
        } else if (step.type === 'action') {
            if (step.instructions) {
                html += '<div class="instructions-container"><h3>Follow these steps:</h3><ol class="instructions-list">';
                step.instructions.forEach(instruction => {
                    html += `<li>${instruction}</li>`;
                });
                html += '</ol></div>';
            }
            html += '<button class="btn btn-primary continue-btn">✅ Continue</button>';
        } else if (step.type === 'final') {
            html += `<div class="final-result ${step.severity}">`;
            html += `<div class="result-text">${step.result}</div>`;
            
            if (step.severity === 'stop' && step.stopReason) {
                html += `<div class="stop-alert"><h3>🛑 VEHICLE MUST STOP</h3><p>${step.stopReason}</p></div>`;
            }
            
            if (step.actions) {
                html += '<div class="actions-section"><h3>Required Actions:</h3><ul>';
                step.actions.forEach(action => {
                    html += `<li>${action}</li>`;
                });
                html += '</ul></div>';
            }
            
            if (step.contacts) {
                html += '<div class="contacts-section"><h3>Required Contacts:</h3><ul>';
                step.contacts.forEach(contact => {
                    html += `<li>${contact}</li>`;
                });
                html += '</ul></div>';
            }
            
            html += '</div>';
            html += '<button class="btn btn-primary complete-btn">✅ Complete Diagnosis</button>';
        } else {
            // Info step
            html += '<button class="btn btn-primary next-btn">➡️ Next</button>';
        }
        
        html += '</div>';
        return html;
    }
    
    // Make generateStepHTML globally available for enhancement
    window.generateStepHTML = generateStepHTML;
    
    // Add event listeners to step elements
    function addStepEventListeners(step, issueId, stepIndex) {
        // Option buttons
        const optionButtons = document.querySelectorAll('.option-button');
        optionButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const option = step.options[index];
                console.log(`🔄 Option clicked: ${option.text}`);
                
                if (typeof option.nextStep === 'number') {
                    displayCleanStep(issueId, option.nextStep);
                } else {
                    completeCleanDiagnostic();
                }
            });
        });
        
        // Continue button
        const continueBtn = document.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                const nextStep = step.nextStep !== undefined ? step.nextStep : stepIndex + 1;
                displayCleanStep(issueId, nextStep);
            });
        }
        
        // Next button
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                displayCleanStep(issueId, stepIndex + 1);
            });
        }
        
        // Complete button
        const completeBtn = document.querySelector('.complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', completeCleanDiagnostic);
        }
    }
    
    // Complete diagnostic
    function completeCleanDiagnostic() {
        console.log('✅ Completing diagnostic');
        alert('✅ Diagnosis completed');
        
        resetWizardState();
        
        // Return to categories
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const categoryScreen = document.getElementById('categoryScreen');
        if (categoryScreen) {
            categoryScreen.classList.add('active');
        }
    }
    
    // Fix category cards
    function fixCategoryCards() {
        console.log('🔧 Fixing category cards...');
        
        const categoryCards = document.querySelectorAll('.category-card');
        console.log(`Found ${categoryCards.length} category cards`);
        
        categoryCards.forEach(card => {
            // Remove existing listeners by cloning
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add new listener
            newCard.addEventListener('click', () => {
                const titleElement = newCard.querySelector('.category-title');
                if (titleElement) {
                    const title = titleElement.textContent.trim();
                    console.log(`🎯 Category clicked: ${title}`);
                    
                    // Map titles to IDs
                    const titleMap = {
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
                    
                    const issueId = titleMap[title];
                    if (issueId) {
                        console.log(`→ Mapped to: ${issueId}`);
                        startDiagnosticClean(issueId);
                    } else {
                        console.warn(`⚠️ No mapping for: ${title}`);
                    }
                }
            });
        });
        
        console.log('✅ Category cards fixed');
    }
    
    // Fix navigation buttons
    function fixNavigationButtons() {
        const returnBtn = document.getElementById('returnToCategoriesBtn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                console.log('🔙 Return to categories');
                resetWizardState();
                
                document.querySelectorAll('.screen').forEach(screen => {
                    screen.classList.remove('active');
                });
                
                const categoryScreen = document.getElementById('categoryScreen');
                if (categoryScreen) {
                    categoryScreen.classList.add('active');
                }
            });
        }
    }
    
    // Initialize when ready
    waitForAppReady().then(() => {
        console.log('✅ App ready, applying minimal fixes...');
        
        // Override the startDiagnostic function
        window.startDiagnostic = startDiagnosticClean;
        
        // Fix UI elements
        setTimeout(() => {
            fixCategoryCards();
            fixNavigationButtons();
            console.log('✅ Minimal fixes applied successfully');
        }, 500);
        
        // Try again after a longer delay in case of dynamic content
        setTimeout(() => {
            fixCategoryCards();
        }, 2000);
    });
    
    console.log('🔧 MINIMAL FIX: Loaded successfully');
    
})();