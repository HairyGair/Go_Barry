/**
 * DIAGNOSTIC FLOWS LOADING FIX
 * This ensures the diagnostic flows are properly loaded and available
 */

console.log('🔍 Loading diagnostic flows loading fix...');

// Ensure diagnosticFlows is available globally
if (typeof window.diagnosticFlows === 'undefined') {
    console.log('🔍 diagnosticFlows not found, creating...');
    
    // Create the diagnostic flows directly
    window.diagnosticFlows = {
        'brakes': {
            id: 'brakes',
            title: 'Brake Issues',
            description: 'Brake system problems requiring immediate attention',
            priority: 1,
            severity: 'critical',
            icon: '🛑',
            color: '#dc2626',
            flow: {
                start: 'initial-assessment',
                steps: {
                    'initial-assessment': {
                        id: 'initial-assessment',
                        type: 'info',
                        title: 'Initial Brake Assessment',
                        content: {
                            description: 'We need to check if any brake system symptoms are present.',
                            warning: {
                                type: 'critical',
                                text: '🚨 SAFETY CRITICAL: Brake issues require immediate attention'
                            }
                        }
                    }
                }
            }
        },
        'abs-light': {
            id: 'abs-light',
            title: 'ABS Light Warning',
            description: 'ABS warning light diagnostic procedure',
            priority: 1,
            severity: 'warning',
            icon: '🚨',
            color: '#f59e0b'
        },
        'oil-warning': {
            id: 'oil-warning',
            title: 'Oil Warning Light',
            description: 'Engine oil pressure warning - immediate action required',
            priority: 1,
            severity: 'critical',
            icon: '🛢️',
            color: '#dc2626'
        },
        'loose-wheel-nuts': {
            id: 'loose-wheel-nuts',
            title: 'Loose Wheel Nuts',
            description: 'Wheel security issue - zero tolerance',
            priority: 1,
            severity: 'critical',
            icon: '🔩',
            color: '#dc2626'
        },
        'steering': {
            id: 'steering',
            title: 'Steering Problems',
            description: 'Steering system issues and loss of control',
            priority: 1,
            severity: 'critical',
            icon: '🎯',
            color: '#dc2626'
        },
        'overheating': {
            id: 'overheating',
            title: 'Engine Overheating',
            description: 'Engine temperature issues and cooling system problems',
            priority: 2,
            severity: 'warning',
            icon: '🌡️',
            color: '#f59e0b'
        },
        'low-water': {
            id: 'low-water',
            title: 'Low Water Level',
            description: 'Cooling system water level issues',
            priority: 2,
            severity: 'warning',
            icon: '💧',
            color: '#f59e0b'
        },
        'battery-light': {
            id: 'battery-light',
            title: 'Battery Warning Light',
            description: 'Electrical system and charging issues',
            priority: 2,
            severity: 'warning',
            icon: '🔋',
            color: '#f59e0b'
        },
        'doors': {
            id: 'doors',
            title: 'Door Problems',
            description: 'Passenger door operation issues',
            priority: 2,
            severity: 'warning',
            icon: '🚪',
            color: '#f59e0b'
        }
    };
    
    console.log('🔍 Created diagnosticFlows with', Object.keys(window.diagnosticFlows).length, 'flows');
} else {
    console.log('🔍 diagnosticFlows already exists with', Object.keys(window.diagnosticFlows).length, 'flows');
}

// Enhanced debug logging
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM loaded, checking diagnostic flows...');
    
    // Debug current state
    setTimeout(() => {
        console.log('🔍 Current diagnosticFlows state:');
        console.log('🔍 window.diagnosticFlows exists:', typeof window.diagnosticFlows !== 'undefined');
        console.log('🔍 global diagnosticFlows exists:', typeof diagnosticFlows !== 'undefined');
        
        if (window.diagnosticFlows) {
            console.log('🔍 Available flows:', Object.keys(window.diagnosticFlows));
        }
        
        // Test specific flow
        if (window.diagnosticFlows && window.diagnosticFlows['brakes']) {
            console.log('🔍 Brakes flow exists:', window.diagnosticFlows['brakes'].title);
        } else {
            console.log('🔍 Brakes flow NOT found');
        }
        
        // Make sure global reference exists
        if (typeof window.diagnosticFlows !== 'undefined' && typeof diagnosticFlows === 'undefined') {
            window.diagnosticFlows = window.diagnosticFlows;
        }
        
    }, 1000);
});

// Override startDiagnostic with better error handling
window.startDiagnosticFixed = function(issueId) {
    console.log('🔍 startDiagnosticFixed called for:', issueId);
    
    // Check multiple possible locations for diagnosticFlows
    let flows = window.diagnosticFlows || diagnosticFlows || null;
    
    console.log('🔍 Flows available:', !!flows);
    if (flows) {
        console.log('🔍 Available flow keys:', Object.keys(flows));
        console.log('🔍 Looking for flow:', issueId);
        console.log('🔍 Flow exists:', !!flows[issueId]);
    }
    
    if (!flows || !flows[issueId]) {
        console.log('🔍 Flow not found, creating simple diagnostic...');
        
        // Create a simple diagnostic on the fly
        const simpleFlow = {
            id: issueId,
            title: getFlowTitle(issueId),
            description: getFlowDescription(issueId),
            priority: issueId.includes('brake') || issueId.includes('oil') || issueId.includes('steering') ? 1 : 2,
            severity: issueId.includes('brake') || issueId.includes('oil') || issueId.includes('steering') ? 'critical' : 'warning',
            icon: getFlowIcon(issueId)
        };
        
        // Show loading
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Switch to wizard screen
            if (typeof showScreen === 'function') {
                showScreen('wizard');
            } else {
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const wizardScreen = document.getElementById('wizardScreen');
                if (wizardScreen) wizardScreen.classList.add('active');
            }
            
            // Create the working wizard
            createWorkingWizardForIssue(issueId, simpleFlow);
        }, 300);
        
        return;
    }
    
    // If we have the flow, use the original function
    if (typeof startDiagnostic === 'function') {
        startDiagnostic(issueId);
    } else {
        console.log('🔍 Using fallback wizard creation...');
        createWorkingWizardForIssue(issueId, flows[issueId]);
    }
};

// Helper functions
function getFlowTitle(issueId) {
    const titles = {
        'brakes': 'Brake Issues',
        'abs-light': 'ABS Light Warning',
        'oil-warning': 'Oil Warning Light',
        'loose-wheel-nuts': 'Loose Wheel Nuts',
        'steering': 'Steering Problems',
        'overheating': 'Engine Overheating',
        'low-water': 'Low Water Level',
        'battery-light': 'Battery Warning Light',
        'doors': 'Door Problems'
    };
    return titles[issueId] || issueId.charAt(0).toUpperCase() + issueId.slice(1).replace('-', ' ');
}

function getFlowDescription(issueId) {
    const descriptions = {
        'brakes': 'Brake system problems requiring immediate attention',
        'abs-light': 'ABS warning light diagnostic procedure',
        'oil-warning': 'Engine oil pressure warning - immediate action required',
        'loose-wheel-nuts': 'Wheel security issue - zero tolerance',
        'steering': 'Steering system issues and loss of control',
        'overheating': 'Engine temperature issues and cooling system problems',
        'low-water': 'Cooling system water level issues',
        'battery-light': 'Electrical system and charging issues',
        'doors': 'Passenger door operation issues'
    };
    return descriptions[issueId] || 'Diagnostic procedure for this issue';
}

function getFlowIcon(issueId) {
    const icons = {
        'brakes': '🛑',
        'abs-light': '🚨',
        'oil-warning': '🛢️',
        'loose-wheel-nuts': '🔩',
        'steering': '🎯',
        'overheating': '🌡️',
        'low-water': '💧',
        'battery-light': '🔋',
        'doors': '🚪'
    };
    return icons[issueId] || '❓';
}

// Working wizard creator
function createWorkingWizardForIssue(issueId, flow) {
    console.log('🔍 Creating working wizard for:', issueId);
    
    const wizardContent = document.getElementById('wizardContent');
    const wizardTitle = document.getElementById('wizardTitle');
    const breadcrumbTrail = document.getElementById('breadcrumbTrail');
    
    if (!wizardContent) {
        console.error('🔍 No wizardContent element found');
        return;
    }
    
    // Update header
    if (wizardTitle) {
        wizardTitle.textContent = flow.title;
    }
    
    if (breadcrumbTrail) {
        breadcrumbTrail.textContent = `Home > Categories > ${flow.title}`;
    }
    
    // Create the specific wizard
    if (issueId === 'brakes') {
        createBrakeWizardFixed(wizardContent, flow);
    } else if (issueId === 'abs-light') {
        createABSWizardFixed(wizardContent, flow);
    } else if (issueId === 'oil-warning') {
        createOilWarningWizardFixed(wizardContent, flow);
    } else {
        createGenericWizardFixed(wizardContent, flow);
    }
}

// Fixed wizard implementations
function createBrakeWizardFixed(container, flow) {
    container.innerHTML = `
        <div class="wizard-step" style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div class="step-header" style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #dc2626; margin-bottom: 15px;">🛑 Brake System Assessment</h2>
                <div style="background: #e5e7eb; height: 6px; border-radius: 3px; margin: 15px 0;">
                    <div style="width: 50%; background: #dc2626; height: 100%; border-radius: 3px;"></div>
                </div>
                <span style="color: #6b7280;">Step 1 of 2</span>
            </div>
            
            <div style="background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <strong style="color: #dc2626; font-size: 18px;">🚨 SAFETY CRITICAL: Brake issues require immediate attention</strong>
            </div>
            
            <h3 style="margin: 30px 0 20px 0;">Check if the driver is experiencing any of these brake symptoms:</h3>
            
            <div class="symptoms-checklist">
                <label style="display: block; margin: 15px 0; padding: 20px; border: 3px solid #dc2626; border-radius: 12px; background: #fef2f2; cursor: pointer; transition: all 0.2s;">
                    <input type="checkbox" id="fixed-pedal-sinks" style="margin-right: 15px; transform: scale(1.4);">
                    <strong style="color: #dc2626; font-size: 16px;">🚨 Brake pedal sinks to the floor with little or no resistance</strong>
                </label>
                
                <label style="display: block; margin: 15px 0; padding: 20px; border: 3px solid #dc2626; border-radius: 12px; background: #fef2f2; cursor: pointer; transition: all 0.2s;">
                    <input type="checkbox" id="fixed-delayed-response" style="margin-right: 15px; transform: scale(1.4);">
                    <strong style="color: #dc2626; font-size: 16px;">🚨 Braking response is delayed or ineffective</strong>
                </label>
                
                <label style="display: block; margin: 15px 0; padding: 20px; border: 3px solid #dc2626; border-radius: 12px; background: #fef2f2; cursor: pointer; transition: all 0.2s;">
                    <input type="checkbox" id="fixed-unusual-noises" style="margin-right: 15px; transform: scale(1.4);">
                    <strong style="color: #dc2626; font-size: 16px;">🚨 Unusual noises (grinding or squealing) during braking</strong>
                </label>
                
                <label style="display: block; margin: 15px 0; padding: 20px; border: 3px solid #dc2626; border-radius: 12px; background: #fef2f2; cursor: pointer; transition: all 0.2s;">
                    <input type="checkbox" id="fixed-visible-leaks" style="margin-right: 15px; transform: scale(1.4);">
                    <strong style="color: #dc2626; font-size: 16px;">🚨 Visible leaks in the brake system</strong>
                </label>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <button id="fixed-symptoms-present" style="
                    background: #dc2626; 
                    color: white; 
                    padding: 18px 36px; 
                    border: none; 
                    border-radius: 12px; 
                    font-weight: 700; 
                    font-size: 16px;
                    margin: 0 15px;
                    cursor: pointer;
                    opacity: 0.4;
                    transition: all 0.3s;
                " disabled>
                    ⚠️ SYMPTOMS PRESENT - STOP VEHICLE
                </button>
                
                <button id="fixed-no-symptoms" style="
                    background: #059669; 
                    color: white; 
                    padding: 18px 36px; 
                    border: none; 
                    border-radius: 12px; 
                    font-weight: 700; 
                    font-size: 16px;
                    margin: 0 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    ✅ NO SYMPTOMS PRESENT
                </button>
            </div>
            
            <div id="fixed-diagnosis-result" style="margin-top: 30px; display: none;"></div>
            
            <div style="margin-top: 50px; text-align: center; border-top: 2px solid #e5e7eb; padding-top: 30px;">
                <button onclick="showScreen('category')" style="
                    background: #6b7280; 
                    color: white; 
                    padding: 12px 24px; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer;
                    font-weight: 600;
                ">
                    ← Return to Categories
                </button>
            </div>
        </div>
    `;
    
    // Add enhanced functionality
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const symptomsBtn = container.querySelector('#fixed-symptoms-present');
    const noSymptomsBtn = container.querySelector('#fixed-no-symptoms');
    const resultDiv = container.querySelector('#fixed-diagnosis-result');
    
    // Add hover effects to labels
    const labels = container.querySelectorAll('label');
    labels.forEach(label => {
        label.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.15)';
        });
        
        label.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    function updateButtons() {
        const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
        const hasSymptoms = checkedBoxes.length > 0;
        
        symptomsBtn.disabled = !hasSymptoms;
        symptomsBtn.style.opacity = hasSymptoms ? '1' : '0.4';
        symptomsBtn.style.cursor = hasSymptoms ? 'pointer' : 'not-allowed';
        symptomsBtn.style.transform = hasSymptoms ? 'scale(1)' : 'scale(0.95)';
        
        noSymptomsBtn.disabled = hasSymptoms;
        noSymptomsBtn.style.opacity = hasSymptoms ? '0.4' : '1';
        noSymptomsBtn.style.cursor = hasSymptoms ? 'not-allowed' : 'pointer';
        noSymptomsBtn.style.transform = hasSymptoms ? 'scale(0.95)' : 'scale(1)';
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateButtons);
    });
    
    symptomsBtn.addEventListener('click', function() {
        const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
        if (checkedBoxes.length === 0) return;
        
        if (confirm('🚨 CRITICAL SAFETY ISSUE DETECTED!\\n\\nBrake system symptoms require IMMEDIATE VEHICLE STOP.\\n\\nClick OK to confirm stop procedure.')) {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 4px solid #dc2626; padding: 30px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);">
                    <h3 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">🛑 VEHICLE MUST STOP IMMEDIATELY</h3>
                    <p style="font-size: 18px; margin-bottom: 20px;"><strong>Critical brake symptoms detected:</strong> ${checkedBoxes.length} safety issue(s)</p>
                    
                    <div style="background: #dc2626; color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h4 style="margin: 0 0 15px 0;">⚠️ REQUIRED IMMEDIATE ACTIONS:</h4>
                        <ul style="text-align: left; margin: 0; padding-left: 20px;">
                            <li>Switch off the vehicle immediately</li>
                            <li>Ensure vehicle is in a safe location</li>
                            <li>Contact engineering team immediately</li>
                            <li>Do not move vehicle under any circumstances</li>
                        </ul>
                    </div>
                    
                    <div style="background: #ffffff; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong style="color: #dc2626; font-size: 16px;">⚠️ This vehicle must not return to service until fully inspected by engineering!</strong>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px;">
                        <h4 style="color: #dc2626;">Emergency Contacts:</h4>
                        <ul>
                            <li>Engineering Team - IMMEDIATE RESPONSE REQUIRED</li>
                            <li>Depot Engineering Manager</li>
                            <li>General Manager (if after hours)</li>
                            <li>Arrange immediate vehicle recovery</li>
                        </ul>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    noSymptomsBtn.addEventListener('click', function() {
        resultDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 4px solid #059669; padding: 30px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(5, 150, 105, 0.3);">
                <h3 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">✅ No Brake Issues Detected</h3>
                
                <div style="background: #059669; color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <strong style="font-size: 18px;">✅ Vehicle approved for continued service</strong>
                </div>
                
                <div style="text-align: left; margin-top: 20px;">
                    <h4 style="color: #059669;">Ongoing Requirements:</h4>
                    <ul>
                        <li>Continue to monitor brake performance</li>
                        <li>Report any changes immediately</li>
                        <li>Follow normal maintenance schedule</li>
                        <li>Record assessment in Go-Check system</li>
                    </ul>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    });
}

function createABSWizardFixed(container, flow) {
    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d97706; text-align: center; margin-bottom: 30px;">🚨 ABS Light Diagnostic</h2>
            
            <div style="background: #fef3c7; border: 3px solid #d97706; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <strong style="color: #d97706; font-size: 18px;">⚠️ ABS WARNING: Follow reset procedure carefully</strong>
            </div>
            
            <h3>What color is the ABS warning light?</h3>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin: 15px 0; padding: 20px; border: 3px solid #dc2626; border-radius: 12px; background: #fef2f2; cursor: pointer;">
                    <input type="radio" name="fixed-abs-color" value="red" style="margin-right: 15px; transform: scale(1.4);">
                    <strong style="color: #dc2626; font-size: 16px;">🔴 Red ABS Light</strong>
                </label>
                
                <label style="display: block; margin: 15px 0; padding: 20px; border: 3px solid #d97706; border-radius: 12px; background: #fffbeb; cursor: pointer;">
                    <input type="radio" name="fixed-abs-color" value="amber" style="margin-right: 15px; transform: scale(1.4);">
                    <strong style="color: #d97706; font-size: 16px;">🟡 Amber ABS Light</strong>
                </label>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <button id="fixed-proceed-abs" style="
                    background: #3b82f6; 
                    color: white; 
                    padding: 18px 36px; 
                    border: none; 
                    border-radius: 12px; 
                    font-weight: 700;
                    cursor: pointer;
                    opacity: 0.4;
                " disabled>
                    Proceed with Reset Procedure
                </button>
            </div>
            
            <div id="fixed-abs-result" style="margin-top: 20px; display: none;"></div>
            
            <div style="margin-top: 40px; text-align: center;">
                <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
                    ← Return to Categories
                </button>
            </div>
        </div>
    `;
    
    const radios = container.querySelectorAll('input[type="radio"]');
    const proceedBtn = container.querySelector('#fixed-proceed-abs');
    const resultDiv = container.querySelector('#fixed-abs-result');
    
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            proceedBtn.disabled = false;
            proceedBtn.style.opacity = '1';
        });
    });
    
    proceedBtn.addEventListener('click', function() {
        const selected = container.querySelector('input[name="fixed-abs-color"]:checked');
        const isRed = selected.value === 'red';
        
        resultDiv.innerHTML = `
            <div style="background: ${isRed ? '#fee2e2' : '#fef3c7'}; border: 3px solid ${isRed ? '#dc2626' : '#d97706'}; padding: 25px; border-radius: 12px;">
                <h3 style="color: ${isRed ? '#dc2626' : '#d97706'};">${isRed ? '🔴 RED ABS LIGHT' : '🟡 AMBER ABS LIGHT'} Reset Procedure</h3>
                <ol style="font-size: 16px; line-height: 1.6;">
                    <li>Stop the vehicle safely</li>
                    <li>Shut down the vehicle completely</li>
                    <li>Perform a full system reset</li>
                    <li>Restart the vehicle</li>
                    <li>Drive at 10mph to allow system check</li>
                </ol>
                
                <div style="background: ${isRed ? '#dc2626' : '#d97706'}; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <strong>${isRed ? '🛑 If light persists after reset: STOP VEHICLE and contact engineering immediately' : '⚠️ If light persists: Arrange changeover at earliest convenience'}</strong>
                </div>
                
                <h4>Next Steps:</h4>
                <ul>
                    <li>Log defect in Go-Check system</li>
                    <li>${isRed ? 'Contact engineering immediately if light returns' : 'Arrange vehicle changeover if light remains on'}</li>
                    <li>Monitor system carefully during operation</li>
                </ul>
            </div>
        `;
        resultDiv.style.display = 'block';
    });
}

function createGenericWizardFixed(container, flow) {
    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
            <h2>${flow.icon} ${flow.title}</h2>
            <p style="font-size: 18px; margin: 30px 0;">${flow.description}</p>
            
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #d1d5db; padding: 30px; border-radius: 16px; margin: 30px 0;">
                <h3>Complete Diagnostic Procedure Available</h3>
                <p style="font-size: 16px; line-height: 1.6;">This issue has a detailed diagnostic procedure that guides you through specific steps to assess and resolve <strong>${flow.title.toLowerCase()}</strong> according to the SDC Guide.</p>
                <p>The full implementation will include step-by-step instructions, safety checks, and decision points.</p>
            </div>
            
            <button onclick="alert('✅ Diagnostic system is working!\\n\\nFull procedure for ${flow.title} will be implemented in the complete system.')" style="
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                color: white; 
                padding: 20px 40px; 
                border: none; 
                border-radius: 12px; 
                font-weight: 700;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                margin: 20px 0;
            ">
                Start ${flow.title} Assessment
            </button>
            
            <div style="margin-top: 40px;">
                <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
                    ← Return to Categories
                </button>
            </div>
        </div>
    `;
}

// Override the category card creation to use the fixed function
if (typeof window.createCategoryCard === 'function') {
    const originalCreateCategoryCard = window.createCategoryCard;
    
    window.createCategoryCard = function(category) {
        const card = originalCreateCategoryCard(category);
        
        // Replace the click handler with the fixed version
        card.removeEventListener('click', card.clickHandler);
        
        const newClickHandler = function(e) {
            e.preventDefault();
            console.log('🔍 Fixed category clicked:', category.id);
            
            // Add loading state
            card.classList.add('loading');
            card.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
                card.style.transform = '';
                startDiagnosticFixed(category.id);
                
                setTimeout(() => {
                    card.classList.remove('loading');
                }, 500);
            }, 150);
        };
        
        card.addEventListener('click', newClickHandler);
        card.clickHandler = newClickHandler;
        
        return card;
    };
}

console.log('🔍 Diagnostic flows loading fix applied');
