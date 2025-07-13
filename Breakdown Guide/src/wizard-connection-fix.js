/**
 * WIZARD CONNECTION FIX - Make the diagnostic wizards actually work
 * This connects the beautiful categories to the working diagnostic flows
 */

console.log('🧙‍♂️ Loading wizard connection fix...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧙‍♂️ Applying wizard connection fixes...');
    
    // Enhanced startDiagnostic function that actually starts the wizard
    window.startDiagnostic = function(issueId) {
        console.log('🧙‍♂️ Starting REAL diagnostic for:', issueId);
        
        // Show loading indicator
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Check if we have the diagnostic flow
        if (!window.diagnosticFlows || !window.diagnosticFlows[issueId]) {
            console.error('🧙‍♂️ No diagnostic flow found for:', issueId);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            showDiagnosticPreview(issueId);
            return;
        }
        
        // Update app state
        if (!window.appState) {
            window.appState = {
                currentIssue: null,
                currentStep: 0,
                sessionStart: null,
                notes: '',
                recentCategories: []
            };
        }
        
        window.appState.currentIssue = issueId;
        window.appState.currentStep = 0;
        window.appState.sessionStart = new Date();
        window.appState.notes = '';
        
        // Track recent usage
        if (!window.appState.recentCategories.includes(issueId)) {
            window.appState.recentCategories.unshift(issueId);
            if (window.appState.recentCategories.length > 5) {
                window.appState.recentCategories.pop();
            }
        }
        
        // Hide loading after a brief moment
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Switch to wizard screen
            console.log('🧙‍♂️ Switching to wizard screen...');
            if (typeof showScreen === 'function') {
                showScreen('wizard');
            } else {
                // Manual screen switching
                document.querySelectorAll('.screen').forEach(screen => {
                    screen.classList.remove('active');
                });
                const wizardScreen = document.getElementById('wizardScreen');
                if (wizardScreen) {
                    wizardScreen.classList.add('active');
                }
            }
            
            // Initialize the wizard
            initializeWorkingWizard(issueId);
            
        }, 300);
    };
    
    // Working wizard initialization
    window.initializeWorkingWizard = function(issueId) {
        console.log('🧙‍♂️ Initializing working wizard for:', issueId);
        
        const flow = window.diagnosticFlows[issueId];
        const wizardContent = document.getElementById('wizardContent');
        const wizardTitle = document.getElementById('wizardTitle');
        const breadcrumbTrail = document.getElementById('breadcrumbTrail');
        
        if (!wizardContent) {
            console.error('🧙‍♂️ No wizardContent element found');
            return;
        }
        
        // Update header
        if (wizardTitle) {
            wizardTitle.textContent = flow.title;
            wizardTitle.className = `wizard-title ${flow.severity}`;
        }
        
        if (breadcrumbTrail) {
            breadcrumbTrail.textContent = `Home > Categories > ${flow.title}`;
        }
        
        // Check if we have the advanced flow structure
        if (flow.flow && flow.flow.steps) {
            console.log('🧙‍♂️ Using advanced wizard engine...');
            
            try {
                // Try to use the DiagnosticWizard class
                if (typeof DiagnosticWizard !== 'undefined') {
                    const wizard = new DiagnosticWizard('wizardContent', {
                        onStepChange: (stepId) => {
                            console.log('🧙‍♂️ Step changed to:', stepId);
                            updateWizardNavigation();
                        },
                        onComplete: (summary) => {
                            console.log('🧙‍♂️ Diagnostic complete:', summary);
                            handleDiagnosticComplete(summary);
                        }
                    });
                    
                    wizard.loadFlow(issueId);
                    window.wizardInstance = wizard;
                    
                } else {
                    console.log('🧙‍♂️ DiagnosticWizard not available, using simple wizard...');
                    createSimpleWizard(issueId, flow);
                }
            } catch (error) {
                console.error('🧙‍♂️ Error with advanced wizard:', error);
                createSimpleWizard(issueId, flow);
            }
        } else {
            console.log('🧙‍♂️ Using simple wizard structure...');
            createSimpleWizard(issueId, flow);
        }
    };
    
    // Simple wizard implementation for immediate functionality
    window.createSimpleWizard = function(issueId, flow) {
        console.log('🧙‍♂️ Creating simple wizard for:', issueId);
        
        const wizardContent = document.getElementById('wizardContent');
        
        // Create wizard based on issue type
        if (issueId === 'brakes') {
            createBrakeWizard(wizardContent, flow);
        } else if (issueId === 'abs-light') {
            createABSWizard(wizardContent, flow);
        } else if (issueId === 'oil-warning') {
            createOilWarningWizard(wizardContent, flow);
        } else if (issueId === 'loose-wheel-nuts') {
            createLooseWheelNutsWizard(wizardContent, flow);
        } else if (issueId === 'steering') {
            createSteeringWizard(wizardContent, flow);
        } else {
            createGenericWizard(wizardContent, flow);
        }
    };
    
    // Brake Issues Wizard
    window.createBrakeWizard = function(container, flow) {
        container.innerHTML = `
            <div class="wizard-step">
                <div class="step-header">
                    <h2>🛑 Brake System Assessment</h2>
                    <div class="progress-bar" style="width: 100%; background: #e5e7eb; height: 6px; border-radius: 3px; margin: 10px 0;">
                        <div style="width: 33%; background: #dc2626; height: 100%; border-radius: 3px; transition: width 0.3s;"></div>
                    </div>
                    <span class="step-indicator">Step 1 of 3</span>
                </div>
                
                <div class="alert-critical" style="background: #fee2e2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong>🚨 SAFETY CRITICAL:</strong> Brake issues require immediate attention
                </div>
                
                <div class="step-content">
                    <h3>Check if the driver is experiencing any of these brake symptoms:</h3>
                    
                    <div class="symptoms-checklist" style="margin: 20px 0;">
                        <label class="symptom-item" style="display: block; margin: 12px 0; padding: 15px; border: 2px solid #dc2626; border-radius: 8px; background: #fef2f2; cursor: pointer;">
                            <input type="checkbox" id="pedal-sinks" style="margin-right: 12px; transform: scale(1.3);">
                            <strong style="color: #dc2626;">🚨 Brake pedal sinks to the floor with little or no resistance</strong>
                        </label>
                        
                        <label class="symptom-item" style="display: block; margin: 12px 0; padding: 15px; border: 2px solid #dc2626; border-radius: 8px; background: #fef2f2; cursor: pointer;">
                            <input type="checkbox" id="delayed-response" style="margin-right: 12px; transform: scale(1.3);">
                            <strong style="color: #dc2626;">🚨 Braking response is delayed or ineffective</strong>
                        </label>
                        
                        <label class="symptom-item" style="display: block; margin: 12px 0; padding: 15px; border: 2px solid #dc2626; border-radius: 8px; background: #fef2f2; cursor: pointer;">
                            <input type="checkbox" id="unusual-noises" style="margin-right: 12px; transform: scale(1.3);">
                            <strong style="color: #dc2626;">🚨 Unusual noises (grinding or squealing) during braking</strong>
                        </label>
                        
                        <label class="symptom-item" style="display: block; margin: 12px 0; padding: 15px; border: 2px solid #dc2626; border-radius: 8px; background: #fef2f2; cursor: pointer;">
                            <input type="checkbox" id="visible-leaks" style="margin-right: 12px; transform: scale(1.3);">
                            <strong style="color: #dc2626;">🚨 Visible leaks in the brake system</strong>
                        </label>
                        
                        <label class="symptom-item" style="display: block; margin: 12px 0; padding: 15px; border: 2px solid #dc2626; border-radius: 8px; background: #fef2f2; cursor: pointer;">
                            <input type="checkbox" id="grabbing-shuddering" style="margin-right: 12px; transform: scale(1.3);">
                            <strong style="color: #dc2626;">🚨 Brakes are grabbing or shuddering</strong>
                        </label>
                    </div>
                    
                    <div class="wizard-actions" style="text-align: center; margin: 30px 0;">
                        <button id="symptoms-present" class="btn-danger" style="
                            background: #dc2626; 
                            color: white; 
                            padding: 15px 30px; 
                            border: none; 
                            border-radius: 8px; 
                            font-weight: 600; 
                            font-size: 16px;
                            margin: 0 10px;
                            cursor: pointer;
                            opacity: 0.5;
                        " disabled>
                            Symptoms Present - STOP VEHICLE
                        </button>
                        
                        <button id="no-symptoms" class="btn-success" style="
                            background: #059669; 
                            color: white; 
                            padding: 15px 30px; 
                            border: none; 
                            border-radius: 8px; 
                            font-weight: 600; 
                            font-size: 16px;
                            margin: 0 10px;
                            cursor: pointer;
                        ">
                            No Symptoms Present
                        </button>
                    </div>
                    
                    <div id="diagnosis-result" style="margin-top: 30px; display: none;"></div>
                </div>
                
                <div class="wizard-footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <button onclick="showScreen('category')" style="
                        background: #6b7280; 
                        color: white; 
                        padding: 12px 24px; 
                        border: none; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        ← Return to Categories
                    </button>
                </div>
            </div>
        `;
        
        // Add event handlers
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const symptomsBtn = container.querySelector('#symptoms-present');
        const noSymptomsBtn = container.querySelector('#no-symptoms');
        const resultDiv = container.querySelector('#diagnosis-result');
        
        function updateButtons() {
            const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
            const hasSymptoms = checkedBoxes.length > 0;
            
            symptomsBtn.disabled = !hasSymptoms;
            symptomsBtn.style.opacity = hasSymptoms ? '1' : '0.5';
            symptomsBtn.style.cursor = hasSymptoms ? 'pointer' : 'not-allowed';
            
            noSymptomsBtn.disabled = hasSymptoms;
            noSymptomsBtn.style.opacity = hasSymptoms ? '0.5' : '1';
            noSymptomsBtn.style.cursor = hasSymptoms ? 'not-allowed' : 'pointer';
        }
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateButtons);
        });
        
        symptomsBtn.addEventListener('click', function() {
            const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
            if (checkedBoxes.length === 0) return;
            
            if (confirm('CRITICAL SAFETY ISSUE DETECTED!\\n\\nBrake system symptoms require IMMEDIATE VEHICLE STOP.\\n\\nClick OK to confirm stop procedure.')) {
                resultDiv.innerHTML = `
                    <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 12px;">
                        <h3 style="color: #dc2626; margin: 0 0 15px 0;">🛑 VEHICLE MUST STOP IMMEDIATELY</h3>
                        <p><strong>Critical brake symptoms detected:</strong> ${checkedBoxes.length} safety issue(s)</p>
                        <h4 style="color: #dc2626;">Required Immediate Actions:</h4>
                        <ul style="margin: 10px 0;">
                            <li>Switch off the vehicle immediately</li>
                            <li>Ensure vehicle is in a safe location</li>
                            <li>Contact engineering team immediately</li>
                            <li>Do not move vehicle under any circumstances</li>
                        </ul>
                        <div style="background: #dc2626; color: white; padding: 10px; border-radius: 6px; margin: 15px 0; text-align: center;">
                            <strong>⚠️ This vehicle must not return to service until fully inspected by engineering!</strong>
                        </div>
                        <p style="margin-top: 15px;"><strong>Emergency Contacts:</strong></p>
                        <ul>
                            <li>Engineering Team - IMMEDIATE RESPONSE REQUIRED</li>
                            <li>Depot Engineering Manager</li>
                            <li>General Manager (if after hours)</li>
                        </ul>
                    </div>
                `;
                resultDiv.style.display = 'block';
            }
        });
        
        noSymptomsBtn.addEventListener('click', function() {
            resultDiv.innerHTML = `
                <div style="background: #ecfdf5; border: 3px solid #059669; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #059669; margin: 0 0 15px 0;">✅ No Brake Issues Detected</h3>
                    <p><strong>Assessment Result:</strong> No immediate brake problems identified</p>
                    <p><strong>Recommended Action:</strong> Vehicle may continue in service with normal monitoring</p>
                    <div style="background: #059669; color: white; padding: 10px; border-radius: 6px; margin: 15px 0; text-align: center;">
                        <strong>✅ Vehicle approved for continued service</strong>
                    </div>
                    <p style="margin-top: 15px;"><strong>Ongoing Requirements:</strong></p>
                    <ul>
                        <li>Continue to monitor brake performance</li>
                        <li>Report any changes immediately</li>
                        <li>Follow normal maintenance schedule</li>
                    </ul>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
    };
    
    // ABS Light Wizard
    window.createABSWizard = function(container, flow) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>🚨 ABS Light Diagnostic</h2>
                <div class="alert-warning" style="background: #fef3c7; border: 2px solid #d97706; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong>⚠️ ABS WARNING:</strong> Follow reset procedure carefully
                </div>
                
                <h3>What color is the ABS warning light?</h3>
                
                <div style="margin: 20px 0;">
                    <label style="display: block; margin: 15px 0; padding: 15px; border: 2px solid #dc2626; border-radius: 8px; background: #fef2f2; cursor: pointer;">
                        <input type="radio" name="abs-color" value="red" style="margin-right: 12px; transform: scale(1.3);">
                        <strong style="color: #dc2626;">🔴 Red ABS Light</strong>
                    </label>
                    
                    <label style="display: block; margin: 15px 0; padding: 15px; border: 2px solid #d97706; border-radius: 8px; background: #fffbeb; cursor: pointer;">
                        <input type="radio" name="abs-color" value="amber" style="margin-right: 12px; transform: scale(1.3);">
                        <strong style="color: #d97706;">🟡 Amber ABS Light</strong>
                    </label>
                </div>
                
                <button id="proceed-abs" style="
                    background: #3b82f6; 
                    color: white; 
                    padding: 15px 30px; 
                    border: none; 
                    border-radius: 8px; 
                    font-weight: 600;
                    cursor: pointer;
                    opacity: 0.5;
                " disabled>
                    Proceed with Reset Procedure
                </button>
                
                <div id="abs-result" style="margin-top: 20px; display: none;"></div>
                
                <div style="margin-top: 40px;">
                    <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer;">
                        ← Return to Categories
                    </button>
                </div>
            </div>
        `;
        
        const radios = container.querySelectorAll('input[type="radio"]');
        const proceedBtn = container.querySelector('#proceed-abs');
        const resultDiv = container.querySelector('#abs-result');
        
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                proceedBtn.disabled = false;
                proceedBtn.style.opacity = '1';
            });
        });
        
        proceedBtn.addEventListener('click', function() {
            const selected = container.querySelector('input[name="abs-color"]:checked');
            if (!selected) return;
            
            const isRed = selected.value === 'red';
            
            resultDiv.innerHTML = `
                <div style="background: ${isRed ? '#fee2e2' : '#fef3c7'}; border: 2px solid ${isRed ? '#dc2626' : '#d97706'}; padding: 20px; border-radius: 8px;">
                    <h3>${isRed ? '🔴 RED ABS LIGHT' : '🟡 AMBER ABS LIGHT'} - Reset Procedure</h3>
                    <ol style="margin: 15px 0;">
                        <li>Stop the vehicle safely</li>
                        <li>Shut down the vehicle completely</li>
                        <li>Perform a full system reset</li>
                        <li>Restart the vehicle</li>
                        <li>Drive at 10mph to allow system check</li>
                    </ol>
                    
                    <div style="background: ${isRed ? '#dc2626' : '#d97706'}; color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <strong>${isRed ? '🛑 If light persists after reset: STOP VEHICLE and contact engineering' : '⚠️ If light persists: Arrange changeover at earliest convenience'}</strong>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Log defect in Go-Check system</li>
                        <li>${isRed ? 'Contact engineering immediately if light returns' : 'Arrange vehicle changeover if light remains on'}</li>
                        <li>Monitor system carefully during operation</li>
                    </ul>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
    };
    
    // Oil Warning Wizard
    window.createOilWarningWizard = function(container, flow) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>🛢️ Oil Warning Light - CRITICAL</h2>
                
                <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <h3 style="color: #dc2626; margin: 0 0 15px 0;">🛑 IMMEDIATE ACTION REQUIRED</h3>
                    <p><strong>Oil warning light requires immediate vehicle stop to prevent engine damage</strong></p>
                </div>
                
                <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0;">Required Immediate Actions:</h3>
                    <ol>
                        <li>Stop vehicle in safe location immediately</li>
                        <li>Switch off engine</li>
                        <li>Check for visible oil leaks around vehicle</li>
                        <li>Do not restart engine</li>
                        <li>Contact engineering immediately</li>
                    </ol>
                </div>
                
                <h3>Are there visible oil leaks under or around the vehicle?</h3>
                
                <div style="margin: 20px 0;">
                    <button id="leaks-yes" style="background: #dc2626; color: white; padding: 15px 30px; border: none; border-radius: 8px; margin: 10px; cursor: pointer; font-weight: 600;">
                        Yes - Oil leaks visible
                    </button>
                    <button id="leaks-no" style="background: #d97706; color: white; padding: 15px 30px; border: none; border-radius: 8px; margin: 10px; cursor: pointer; font-weight: 600;">
                        No - No visible leaks
                    </button>
                </div>
                
                <div id="oil-result" style="margin-top: 20px; display: none;"></div>
                
                <div style="margin-top: 40px;">
                    <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer;">
                        ← Return to Categories
                    </button>
                </div>
            </div>
        `;
        
        const leaksYes = container.querySelector('#leaks-yes');
        const leaksNo = container.querySelector('#leaks-no');
        const resultDiv = container.querySelector('#oil-result');
        
        leaksYes.addEventListener('click', function() {
            resultDiv.innerHTML = `
                <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #dc2626;">🛑 OIL LEAK - CRITICAL HAZARD</h3>
                    <p><strong>Environmental & Fire Hazard Detected</strong></p>
                    
                    <div style="background: #dc2626; color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <strong>⚠️ IMMEDIATE ACTIONS REQUIRED:</strong>
                    </div>
                    
                    <ul>
                        <li>Keep engine switched off</li>
                        <li>Ensure vehicle remains stationary</li>
                        <li>Clear area of ignition sources</li>
                        <li>Use spill kits if available</li>
                        <li>Contact fire services if leak is severe</li>
                        <li>Notify authorities for road cleanup if needed</li>
                    </ul>
                    
                    <p style="color: #dc2626; font-weight: bold; margin-top: 15px;">
                        Oil leak presents fire risk and environmental hazard. May result in PG9 prohibition.
                    </p>
                    
                    <p><strong>Emergency Contacts:</strong></p>
                    <ul>
                        <li>Engineering Team - IMMEDIATE</li>
                        <li>Fire services (if severe leak)</li>
                        <li>Environmental authorities (for spill)</li>
                    </ul>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
        
        leaksNo.addEventListener('click', function() {
            resultDiv.innerHTML = `
                <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #dc2626;">🛑 ENGINE FAILURE - NO LEAKS</h3>
                    <p><strong>Internal Engine Failure Likely</strong></p>
                    
                    <div style="background: #dc2626; color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <strong>⚠️ CRITICAL: Do not restart engine under any circumstances</strong>
                    </div>
                    
                    <ul>
                        <li>Do not restart engine - will cause catastrophic damage</li>
                        <li>Arrange immediate recovery</li>
                        <li>Engine likely requires major repair or replacement</li>
                    </ul>
                    
                    <p style="color: #dc2626; font-weight: bold; margin-top: 15px;">
                        Internal engine failure likely. Running engine would cause catastrophic damage.
                    </p>
                    
                    <p><strong>Required Contacts:</strong></p>
                    <ul>
                        <li>Engineering Team - IMMEDIATE</li>
                        <li>Recovery services</li>
                    </ul>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
    };
    
    // Generic wizard for other issues
    window.createGenericWizard = function(container, flow) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>${flow.icon} ${flow.title}</h2>
                <p style="font-size: 16px; margin: 20px 0;">${flow.description}</p>
                
                <div style="background: #f3f4f6; border: 2px solid #d1d5db; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Diagnostic Procedure</h3>
                    <p>This issue requires a detailed diagnostic procedure that will be implemented in the full system.</p>
                    <p>The diagnostic would guide you through specific steps to assess and resolve <strong>${flow.title.toLowerCase()}</strong>.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <button onclick="alert('Full diagnostic procedure will be implemented here')" style="
                        background: #3b82f6; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Start ${flow.title} Assessment
                    </button>
                </div>
                
                <div style="margin-top: 40px;">
                    <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer;">
                        ← Return to Categories
                    </button>
                </div>
            </div>
        `;
    };
    
    // Update the modal's "Start Diagnostic" button to call the real wizard
    window.showDiagnosticPreview = function(issueId) {
        const issueInfo = {
            'brakes': {
                title: 'Brake Issues',
                icon: '🛑',
                preview: 'This diagnostic will check for brake system problems including pedal feel, unusual noises, and visible leaks. Critical safety issue requiring immediate attention.'
            },
            'abs-light': {
                title: 'ABS Light Warning',
                icon: '🚨', 
                preview: 'This diagnostic will guide you through ABS light reset procedures and determine if the vehicle can continue or requires immediate attention.'
            },
            'oil-warning': {
                title: 'Oil Warning Light',
                icon: '🛢️',
                preview: 'This diagnostic addresses oil pressure warnings requiring immediate vehicle stop to prevent engine damage.'
            }
        };
        
        const info = issueInfo[issueId] || { 
            title: window.diagnosticFlows[issueId]?.title || issueId, 
            icon: window.diagnosticFlows[issueId]?.icon || '❓', 
            preview: window.diagnosticFlows[issueId]?.description || 'Diagnostic procedure for this issue.'
        };
        
        // Create modal preview
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">${info.icon}</div>
                <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">${info.title}</h2>
                <p style="color: #6b7280; margin-bottom: 30px; line-height: 1.6;">${info.preview}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="this.closest('.modal').remove()" style="
                        background: #6b7280;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Back to Categories</button>
                    <button onclick="this.closest('.modal').remove(); startDiagnostic('${issueId}');" style="
                        background: #3b82f6;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Start Diagnostic</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };
    
    console.log('🧙‍♂️ Wizard connection fixes applied!');
});

console.log('🧙‍♂️ Wizard connection fix script loaded');
