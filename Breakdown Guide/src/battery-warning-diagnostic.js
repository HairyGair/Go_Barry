/**
 * COMPLETE BATTERY WARNING LIGHT DIAGNOSTIC
 * Based on SDC Guide requirements
 */

console.log('🔋 Loading Battery Warning Light diagnostic...');

// Add the complete Battery Warning Light flow
window.addBatteryWarningLightFlow = function() {
    if (!window.diagnosticFlows) {
        window.diagnosticFlows = {};
    }
    
    window.diagnosticFlows['battery-light'] = {
        id: 'battery-light',
        title: 'Battery Warning Light',
        description: 'Electrical system and charging issues',
        priority: 2,
        severity: 'warning',
        icon: '🔋',
        color: '#f59e0b',
        flow: {
            start: 'initial-assessment',
            steps: {
                'initial-assessment': {
                    id: 'initial-assessment',
                    type: 'info',
                    title: 'Battery Warning Light Assessment',
                    content: {
                        description: 'Battery warning light indicates potential electrical system issues. We need to check belts and master switch.',
                        warning: {
                            type: 'warning',
                            text: '⚠️ WARNING: Battery issues can affect vehicle systems'
                        }
                    },
                    actions: [
                        {
                            id: 'continue-assessment',
                            label: 'Continue Assessment',
                            type: 'primary',
                            nextStep: 'belt-check'
                        }
                    ]
                },
                'belt-check': {
                    id: 'belt-check',
                    type: 'critical-action',
                    title: 'Belt Inspection - SAFETY FIRST',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'SAFETY WARNING',
                            text: 'ALWAYS advise the driver to steer clear of moving belts and turn the engine off before inspection'
                        },
                        instructions: [
                            'Turn engine OFF before inspection',
                            'Ensure driver stays clear of moving parts',
                            'Visually inspect all belts',
                            'Check for belt displacement or damage'
                        ],
                        warning: {
                            type: 'critical',
                            text: '🚨 NEVER inspect belts while engine is running'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Engine is OFF and belt inspection completed safely',
                    actions: [
                        {
                            id: 'belts-in-place',
                            label: 'Belts in Place',
                            type: 'success',
                            requiresConfirmation: true,
                            nextStep: 'master-switch-check'
                        },
                        {
                            id: 'belts-off',
                            label: 'Belt(s) Come Off',
                            type: 'danger',
                            requiresConfirmation: true,
                            nextStep: 'belt-failure'
                        }
                    ]
                },
                'belt-failure': {
                    id: 'belt-failure',
                    type: 'critical-action',
                    title: '🛑 BELT FAILURE DETECTED',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'BELT SYSTEM FAILURE',
                            text: 'Belt displacement detected - Vehicle requires engineering assistance'
                        },
                        instructions: [
                            'Wait for engineering assistance',
                            'Check for other warning lights (temperature, etc.)',
                            'If no other warning lights present, vehicle may be moved short distance for safety if needed'
                        ],
                        additionalInfo: {
                            title: 'Important Notes',
                            items: [
                                'Do not attempt to replace or adjust belts',
                                'Monitor for additional warning lights',
                                'Keep engine off until engineering arrives'
                            ]
                        }
                    },
                    actions: [
                        {
                            id: 'complete-belt-failure',
                            label: 'Engineering Contacted',
                            type: 'danger',
                            logAction: 'Belt failure - engineering assistance required',
                            nextStep: 'complete'
                        }
                    ]
                },
                'master-switch-check': {
                    id: 'master-switch-check',
                    type: 'radio',
                    title: 'Master Switch Status',
                    content: {
                        description: 'Check the master switch status:',
                        options: [
                            {
                                id: 'master-not-engaged',
                                label: 'Master switch NOT engaged',
                                value: 'not-engaged'
                            },
                            {
                                id: 'master-engaged',
                                label: 'Master switch IS engaged',
                                value: 'engaged'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'switch-not-engaged',
                            label: 'Master Switch Not Engaged',
                            type: 'success',
                            condition: { field: 'value', equals: 'not-engaged' },
                            nextStep: 'engage-switch'
                        },
                        {
                            id: 'switch-engaged',
                            label: 'Master Switch Already Engaged',
                            type: 'warning',
                            condition: { field: 'value', equals: 'engaged' },
                            nextStep: 'electrical-failure'
                        }
                    ]
                },
                'engage-switch': {
                    id: 'engage-switch',
                    type: 'info',
                    title: '✅ ENGAGE MASTER SWITCH',
                    content: {
                        alert: {
                            type: 'success',
                            text: 'Master switch was not engaged - this is likely the cause'
                        },
                        instructions: [
                            'Engage the master switch',
                            'Check if battery warning light clears',
                            'Vehicle may continue in service'
                        ],
                        reminder: 'Monitor electrical systems for proper operation'
                    },
                    actions: [
                        {
                            id: 'switch-engaged-continue',
                            label: 'Master Switch Engaged - Continue Service',
                            type: 'success',
                            logAction: 'Master switch engaged - battery warning resolved',
                            nextStep: 'complete'
                        }
                    ]
                },
                'electrical-failure': {
                    id: 'electrical-failure',
                    type: 'critical-action',
                    title: '⚠️ ELECTRICAL SYSTEM FAILURE',
                    content: {
                        alert: {
                            type: 'warning',
                            title: 'ELECTRICAL SYSTEM ISSUE',
                            text: 'Master switch engaged but battery light on - electrical system failure likely'
                        },
                        instructions: [
                            'Wait for engineering assistance',
                            'Monitor for loss of transmission drive',
                            'Watch for other electrical component failures',
                            'Vehicle systems may fail progressively'
                        ],
                        warning: {
                            type: 'warning',
                            text: '⚠️ Transmission drive may be lost and other electrical components may fail'
                        }
                    },
                    actions: [
                        {
                            id: 'electrical-assistance',
                            label: 'Contact Engineering',
                            type: 'warning',
                            logAction: 'Electrical system failure - engineering assistance required',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'Battery Warning Light Diagnostic Complete',
                    content: {
                        description: 'Battery warning light diagnostic procedure has been completed.'
                    }
                }
            }
        }
    };
    
    console.log('🔋 Battery Warning Light flow added');
};

// Enhanced wizard creator specifically for Battery Warning Light
window.createBatteryWarningWizard = function(container, flow) {
    console.log('🔋 Creating Battery Warning Light wizard');
    
    container.innerHTML = `
        <div class="wizard-step" style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div class="step-header" style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #d97706; margin-bottom: 15px;">🔋 Battery Warning Light Assessment</h2>
                <div style="background: #e5e7eb; height: 6px; border-radius: 3px; margin: 15px 0;">
                    <div style="width: 25%; background: #d97706; height: 100%; border-radius: 3px; transition: width 0.3s;"></div>
                </div>
                <span style="color: #6b7280;">Step 1 of 4</span>
            </div>
            
            <div style="background: #fef3c7; border: 3px solid #d97706; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <strong style="color: #d97706; font-size: 18px;">⚠️ WARNING: Battery issues can affect vehicle electrical systems</strong>
            </div>
            
            <div class="step-content">
                <h3>Battery Light Diagnostic Procedure</h3>
                <p style="font-size: 16px; margin: 20px 0;">The battery warning light indicates potential electrical system issues. We need to systematically check the charging system components.</p>
                
                <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <h4 style="color: #dc2626; margin: 0 0 15px 0;">🚨 CRITICAL SAFETY WARNING</h4>
                    <p style="margin: 0; font-weight: 600;">ALWAYS advise the driver to steer clear of moving belts and turn the engine OFF before any inspection</p>
                </div>
                
                <h4>First, we need to safely inspect the belt system:</h4>
                
                <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h5 style="color: #1e293b;">Safe Belt Inspection Procedure:</h5>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li><strong>Turn engine OFF</strong> before inspection</li>
                        <li>Ensure driver stays clear of moving parts</li>
                        <li>Visually inspect all belts for displacement or damage</li>
                        <li>Check belt tension and alignment</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <label style="display: block; margin: 20px auto; max-width: 600px; text-align: left;">
                        <input type="checkbox" id="safety-confirmed" style="margin-right: 15px; transform: scale(1.3);">
                        <strong style="color: #dc2626;">I confirm the engine is OFF and belt inspection has been completed safely</strong>
                    </label>
                </div>
                
                <h4>Belt Inspection Result:</h4>
                
                <div style="margin: 20px 0;">
                    <button id="belts-in-place" style="
                        background: #059669; 
                        color: white; 
                        padding: 18px 36px; 
                        border: none; 
                        border-radius: 12px; 
                        font-weight: 700; 
                        font-size: 16px;
                        margin: 10px 15px;
                        cursor: pointer;
                        opacity: 0.4;
                        transition: all 0.3s;
                    " disabled>
                        ✅ Belts in Place and Secure
                    </button>
                    
                    <button id="belts-off" style="
                        background: #dc2626; 
                        color: white; 
                        padding: 18px 36px; 
                        border: none; 
                        border-radius: 12px; 
                        font-weight: 700; 
                        font-size: 16px;
                        margin: 10px 15px;
                        cursor: pointer;
                        opacity: 0.4;
                        transition: all 0.3s;
                    " disabled>
                        🚨 Belt(s) Come Off or Damaged
                    </button>
                </div>
                
                <div id="battery-result" style="margin-top: 30px; display: none;"></div>
            </div>
            
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
    
    // Add functionality
    const safetyCheckbox = container.querySelector('#safety-confirmed');
    const beltsInPlaceBtn = container.querySelector('#belts-in-place');
    const beltsOffBtn = container.querySelector('#belts-off');
    const resultDiv = container.querySelector('#battery-result');
    
    // Enable buttons only when safety is confirmed
    safetyCheckbox.addEventListener('change', function() {
        const confirmed = this.checked;
        
        beltsInPlaceBtn.disabled = !confirmed;
        beltsInPlaceBtn.style.opacity = confirmed ? '1' : '0.4';
        beltsInPlaceBtn.style.cursor = confirmed ? 'pointer' : 'not-allowed';
        
        beltsOffBtn.disabled = !confirmed;
        beltsOffBtn.style.opacity = confirmed ? '1' : '0.4';
        beltsOffBtn.style.cursor = confirmed ? 'pointer' : 'not-allowed';
    });
    
    // Belts in place - proceed to master switch check
    beltsInPlaceBtn.addEventListener('click', function() {
        if (!safetyCheckbox.checked) return;
        
        resultDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 3px solid #d97706; padding: 25px; border-radius: 16px;">
                <h3 style="color: #d97706; margin: 0 0 20px 0;">🔋 Belts Secure - Check Master Switch</h3>
                
                <p style="font-size: 16px; margin-bottom: 20px;">Belts are in place. Now check the master switch status:</p>
                
                <div style="margin: 20px 0;">
                    <button onclick="handleMasterSwitch('not-engaged')" style="
                        background: #059669; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        margin: 10px;
                        cursor: pointer;
                    ">
                        Master Switch NOT Engaged
                    </button>
                    
                    <button onclick="handleMasterSwitch('engaged')" style="
                        background: #dc2626; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        margin: 10px;
                        cursor: pointer;
                    ">
                        Master Switch IS Engaged
                    </button>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Belt failure
    beltsOffBtn.addEventListener('click', function() {
        if (!safetyCheckbox.checked) return;
        
        resultDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 4px solid #dc2626; padding: 30px; border-radius: 16px;">
                <h3 style="color: #dc2626; margin: 0 0 20px 0;">🛑 BELT FAILURE DETECTED</h3>
                
                <div style="background: #dc2626; color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <h4 style="margin: 0 0 15px 0;">⚠️ REQUIRED IMMEDIATE ACTIONS:</h4>
                    <ul style="text-align: left; margin: 0; padding-left: 20px;">
                        <li>Wait for engineering assistance</li>
                        <li>Do not attempt to replace or adjust belts</li>
                        <li>Check for other warning lights (temperature, etc.)</li>
                        <li>Keep engine off until engineering arrives</li>
                    </ul>
                </div>
                
                <div style="background: #f59e0b; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <strong>Note:</strong> If no other warning lights are present, vehicle may be moved short distance for safety if needed
                </div>
                
                <div style="text-align: left; margin-top: 20px;">
                    <h4 style="color: #dc2626;">Emergency Contacts:</h4>
                    <ul>
                        <li>Engineering Team - IMMEDIATE</li>
                        <li>Depot Engineering Manager</li>
                    </ul>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Master switch handler
    window.handleMasterSwitch = function(status) {
        const resultDiv = container.querySelector('#battery-result');
        
        if (status === 'not-engaged') {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 4px solid #059669; padding: 30px; border-radius: 16px; text-align: center;">
                    <h3 style="color: #059669; margin: 0 0 20px 0;">✅ MASTER SWITCH SOLUTION</h3>
                    
                    <div style="background: #059669; color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <strong style="font-size: 18px;">✅ Master switch was not engaged - this is likely the cause</strong>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px;">
                        <h4 style="color: #059669;">Required Actions:</h4>
                        <ul>
                            <li>Engage the master switch</li>
                            <li>Check if battery warning light clears</li>
                            <li>Vehicle may continue in service</li>
                            <li>Monitor electrical systems for proper operation</li>
                        </ul>
                    </div>
                    
                    <div style="background: #ffffff; border: 2px solid #059669; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong style="color: #059669;">✅ Vehicle approved for continued service</strong>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 4px solid #d97706; padding: 30px; border-radius: 16px;">
                    <h3 style="color: #d97706; margin: 0 0 20px 0;">⚠️ ELECTRICAL SYSTEM FAILURE</h3>
                    
                    <div style="background: #d97706; color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <strong>Master switch engaged but battery light on - electrical system failure likely</strong>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px;">
                        <h4 style="color: #d97706;">Required Actions:</h4>
                        <ul>
                            <li>Wait for engineering assistance</li>
                            <li>Monitor for loss of transmission drive</li>
                            <li>Watch for other electrical component failures</li>
                            <li>Vehicle systems may fail progressively</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; color: #dc2626;">
                        <strong>⚠️ WARNING: Transmission drive may be lost and other electrical components may fail</strong>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px;">
                        <h4 style="color: #d97706;">Emergency Contacts:</h4>
                        <ul>
                            <li>Engineering Team - IMMEDIATE</li>
                            <li>Depot Engineering Manager</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    };
};

// Override the createGenericWizardFixed function to handle Battery Warning Light specifically
const originalCreateGenericWizardFixed = window.createGenericWizardFixed;

window.createGenericWizardFixed = function(container, flow) {
    if (flow.id === 'battery-light') {
        createBatteryWarningWizard(container, flow);
    } else {
        if (originalCreateGenericWizardFixed) {
            originalCreateGenericWizardFixed(container, flow);
        } else {
            // Fallback for other generic wizards
            container.innerHTML = `
                <div style="max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
                    <h2>${flow.icon} ${flow.title}</h2>
                    <p style="font-size: 18px; margin: 30px 0;">${flow.description}</p>
                    
                    <div style="background: #f3f4f6; padding: 30px; border-radius: 16px; margin: 30px 0;">
                        <h3>Complete Diagnostic Procedure Available</h3>
                        <p>Full implementation for ${flow.title} will include detailed step-by-step procedures.</p>
                    </div>
                    
                    <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
                        ← Return to Categories
                    </button>
                </div>
            `;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔋 Adding Battery Warning Light flow...');
    addBatteryWarningLightFlow();
});

console.log('🔋 Battery Warning Light diagnostic loaded');
