/**
 * LOW WATER DIAGNOSTIC - Complete SDC Guide Implementation
 */

console.log('💧 Loading Low Water diagnostic...');

// Add complete Low Water diagnostic flow
window.addLowWaterFlow = function() {
    if (!window.diagnosticFlows) {
        window.diagnosticFlows = {};
    }
    
    window.diagnosticFlows['low-water'] = {
        id: 'low-water',
        title: 'Low Water Level',
        description: 'Cooling system water level issues',
        priority: 2,
        severity: 'warning',
        icon: '💧',
        color: '#f59e0b',
        flow: {
            start: 'leak-check',
            steps: {
                'leak-check': {
                    id: 'leak-check',
                    type: 'radio',
                    title: 'Initial Leak Check',
                    content: {
                        description: 'First, check for visible water leaks around the vehicle (SAFELY - do not step into highway):',
                        warning: {
                            type: 'warning',
                            text: '⚠️ SAFETY: Never ask driver to step into highway for inspection'
                        },
                        options: [
                            {
                                id: 'no-leaks',
                                label: 'No leaks present',
                                value: 'no-leaks'
                            },
                            {
                                id: 'leaks-found',
                                label: 'Leak found',
                                value: 'leaks-present'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'no-leaks-proceed',
                            label: 'No Leaks - Check Water Buzzer',
                            type: 'primary',
                            condition: { field: 'value', equals: 'no-leaks' },
                            nextStep: 'buzzer-check'
                        },
                        {
                            id: 'leaks-assess',
                            label: 'Leaks Found - Assess Distance',
                            type: 'warning',
                            condition: { field: 'value', equals: 'leaks-present' },
                            nextStep: 'leak-assessment'
                        }
                    ]
                },
                'leak-assessment': {
                    id: 'leak-assessment',
                    type: 'radio',
                    title: 'Leak Assessment',
                    content: {
                        description: 'Assess if the bus can safely reach the next convenient changeover point:',
                        options: [
                            {
                                id: 'short-distance',
                                label: 'Short distance to changeover point',
                                value: 'short-distance'
                            },
                            {
                                id: 'long-distance',
                                label: 'Long distance or major leak',
                                value: 'long-distance'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'continue-short',
                            label: 'Continue to Changeover',
                            type: 'warning',
                            condition: { field: 'value', equals: 'short-distance' },
                            nextStep: 'changeover-required'
                        },
                        {
                            id: 'seek-engineering',
                            label: 'Seek Engineering Advice',
                            type: 'danger',
                            condition: { field: 'value', equals: 'long-distance' },
                            nextStep: 'engineering-advice'
                        }
                    ]
                },
                'buzzer-check': {
                    id: 'buzzer-check',
                    type: 'radio',
                    title: 'Water Buzzer Status',
                    content: {
                        description: 'Is the water buzzer sounding?',
                        options: [
                            {
                                id: 'no-buzzer',
                                label: 'No buzzer sounding',
                                value: 'no-buzzer'
                            },
                            {
                                id: 'buzzer-sounding',
                                label: 'Yes - buzzer is sounding',
                                value: 'buzzer-on'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'no-buzzer-continue',
                            label: 'Continue to Changeover Point',
                            type: 'success',
                            condition: { field: 'value', equals: 'no-buzzer' },
                            nextStep: 'changeover-required'
                        },
                        {
                            id: 'buzzer-check-recent',
                            label: 'Check Recent Top-Up',
                            type: 'warning',
                            condition: { field: 'value', equals: 'buzzer-on' },
                            nextStep: 'recent-topup-check'
                        }
                    ]
                },
                'recent-topup-check': {
                    id: 'recent-topup-check',
                    type: 'radio',
                    title: 'Recent Water Top-Up Check',
                    content: {
                        description: 'Has the water been topped up recently at the depot?',
                        info: {
                            type: 'info',
                            text: 'Use the SDC top-up log to verify if water was recently filled'
                        },
                        options: [
                            {
                                id: 'recently-filled',
                                label: 'Recently filled at depot',
                                value: 'recently-filled'
                            },
                            {
                                id: 'long-time-ago',
                                label: 'Filled long time ago or driver unsure',
                                value: 'long-ago'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'arrange-topup',
                            label: 'Arrange En-Route Top-Up',
                            type: 'primary',
                            condition: { field: 'value', equals: 'recently-filled' },
                            nextStep: 'enroute-topup'
                        },
                        {
                            id: 'check-sdc-log',
                            label: 'Check SDC Log & Consider Top-Up',
                            type: 'warning',
                            condition: { field: 'value', equals: 'long-ago' },
                            nextStep: 'sdc-log-check'
                        }
                    ]
                },
                'enroute-topup': {
                    id: 'enroute-topup',
                    type: 'info',
                    title: 'Arrange En-Route Water Top-Up',
                    content: {
                        alert: {
                            type: 'info',
                            text: 'Vehicle recently filled but buzzer sounding - arrange authorized top-up'
                        },
                        instructions: [
                            'Arrange for authorized staff to top-up water en route',
                            'Check if the issue is resolved after top-up',
                            'If top-up resolves the issue, continue in service',
                            'If problem persists after top-up, seek engineering advice'
                        ]
                    },
                    actions: [
                        {
                            id: 'topup-arranged',
                            label: 'Top-Up Arranged',
                            type: 'primary',
                            nextStep: 'topup-result'
                        }
                    ]
                },
                'sdc-log-check': {
                    id: 'sdc-log-check',
                    type: 'radio',
                    title: 'SDC Log Verification & Top-Up Decision',
                    content: {
                        description: 'After checking SDC top-up log, what action is feasible?',
                        options: [
                            {
                                id: 'topup-feasible',
                                label: 'En-route top-up is feasible',
                                value: 'topup-feasible'
                            },
                            {
                                id: 'topup-not-feasible',
                                label: 'En-route top-up not feasible',
                                value: 'not-feasible'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'arrange-feasible-topup',
                            label: 'Arrange Top-Up',
                            type: 'primary',
                            condition: { field: 'value', equals: 'topup-feasible' },
                            nextStep: 'topup-result'
                        },
                        {
                            id: 'seek-engineering-advice',
                            label: 'Seek Engineering Advice',
                            type: 'warning',
                            condition: { field: 'value', equals: 'not-feasible' },
                            nextStep: 'engineering-advice'
                        }
                    ]
                },
                'topup-result': {
                    id: 'topup-result',
                    type: 'radio',
                    title: 'Top-Up Result Assessment',
                    content: {
                        description: 'After the water top-up, does this resolve the issue?',
                        warning: {
                            type: 'warning',
                            text: 'In case of a second top-up, changeover should be arranged at earliest opportunity'
                        },
                        options: [
                            {
                                id: 'issue-resolved',
                                label: 'Issue resolved - buzzer stopped',
                                value: 'resolved'
                            },
                            {
                                id: 'issue-persists',
                                label: 'Issue persists - still low water',
                                value: 'persists'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'continue-resolved',
                            label: 'Continue in Service',
                            type: 'success',
                            condition: { field: 'value', equals: 'resolved' },
                            nextStep: 'resolved-continue'
                        },
                        {
                            id: 'arrange-changeover',
                            label: 'Arrange Changeover',
                            type: 'warning',
                            condition: { field: 'value', equals: 'persists' },
                            nextStep: 'changeover-required'
                        }
                    ]
                },
                'resolved-continue': {
                    id: 'resolved-continue',
                    type: 'info',
                    title: '✅ Issue Resolved - Continue Service',
                    content: {
                        alert: {
                            type: 'success',
                            text: 'Water top-up successful - buzzer stopped'
                        },
                        instructions: [
                            'Vehicle may continue in normal service',
                            'Monitor water levels during operation',
                            'Record top-up action in Go-Check system',
                            'Report if issue reoccurs'
                        ]
                    },
                    actions: [
                        {
                            id: 'continue-service',
                            label: 'Continue Normal Service',
                            type: 'success',
                            logAction: 'Low water resolved with top-up - continue service',
                            nextStep: 'complete'
                        }
                    ]
                },
                'changeover-required': {
                    id: 'changeover-required',
                    type: 'info',
                    title: '⚠️ Changeover Required',
                    content: {
                        alert: {
                            type: 'warning',
                            text: 'Vehicle can continue temporarily but changeover needed at earliest suitable location'
                        },
                        instructions: [
                            'Arrange changeover at nearest suitable location',
                            'Vehicle may continue temporarily in service',
                            'Monitor situation and provide updates to driver',
                            'Record defect in Go-Check system'
                        ]
                    },
                    actions: [
                        {
                            id: 'changeover-arranged',
                            label: 'Changeover Arranged',
                            type: 'warning',
                            logAction: 'Low water - changeover arranged',
                            nextStep: 'complete'
                        }
                    ]
                },
                'engineering-advice': {
                    id: 'engineering-advice',
                    type: 'critical-action',
                    title: '🔧 Engineering Advice Required',
                    content: {
                        alert: {
                            type: 'warning',
                            title: 'ENGINEERING ASSESSMENT NEEDED',
                            text: 'Situation requires engineering evaluation'
                        },
                        instructions: [
                            'Contact engineering team for assessment',
                            'Provide details of leak location and severity',
                            'Follow engineering recommendations',
                            'Do not continue if advised to stop'
                        ]
                    },
                    actions: [
                        {
                            id: 'engineering-contacted',
                            label: 'Engineering Contacted',
                            type: 'warning',
                            logAction: 'Low water - engineering advice sought',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'Low Water Diagnostic Complete',
                    content: {
                        description: 'Low water level diagnostic procedure has been completed.'
                    }
                }
            }
        }
    };
    
    console.log('💧 Low Water flow added');
};

// Create Low Water wizard
window.createLowWaterWizard = function(container, flow) {
    console.log('💧 Creating Low Water wizard');
    
    container.innerHTML = `
        <div class="wizard-step" style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div class="step-header" style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #0891b2; margin-bottom: 15px;">💧 Low Water Level Assessment</h2>
                <div style="background: #e5e7eb; height: 6px; border-radius: 3px; margin: 15px 0;">
                    <div style="width: 20%; background: #0891b2; height: 100%; border-radius: 3px; transition: width 0.3s;"></div>
                </div>
                <span style="color: #6b7280;">Step 1 of 5</span>
            </div>
            
            <div style="background: #cffafe; border: 3px solid #0891b2; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <strong style="color: #0891b2; font-size: 18px;">💧 Low Water Level Diagnostic Procedure</strong>
            </div>
            
            <div class="step-content">
                <h3>Initial Safety Check</h3>
                
                <div style="background: #fef3c7; border: 2px solid #d97706; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <h4 style="color: #d97706; margin: 0 0 15px 0;">⚠️ SAFETY WARNING</h4>
                    <p style="margin: 0; font-weight: 600;">NEVER ask driver to step into highway for inspection - ensure safe checking location</p>
                </div>
                
                <h4>First, check for visible water leaks around the vehicle:</h4>
                <p style="margin: 15px 0; color: #6b7280;">Driver should check safely from roadside - never step into traffic</p>
                
                <div style="margin: 20px 0;">
                    <button id="no-leaks-btn" style="
                        background: #059669; 
                        color: white; 
                        padding: 18px 36px; 
                        border: none; 
                        border-radius: 12px; 
                        font-weight: 700; 
                        font-size: 16px;
                        margin: 10px 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        ✅ No Leaks Present
                    </button>
                    
                    <button id="leaks-found-btn" style="
                        background: #dc2626; 
                        color: white; 
                        padding: 18px 36px; 
                        border: none; 
                        border-radius: 12px; 
                        font-weight: 700; 
                        font-size: 16px;
                        margin: 10px 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        🚨 Leak Found
                    </button>
                </div>
                
                <div id="low-water-result" style="margin-top: 30px; display: none;"></div>
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
    const noLeaksBtn = container.querySelector('#no-leaks-btn');
    const leaksFoundBtn = container.querySelector('#leaks-found-btn');
    const resultDiv = container.querySelector('#low-water-result');
    
    // No leaks - check buzzer
    noLeaksBtn.addEventListener('click', function() {
        resultDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #cffafe 0%, #a7f3d0 100%); border: 3px solid #0891b2; padding: 25px; border-radius: 16px;">
                <h3 style="color: #0891b2; margin: 0 0 20px 0;">💧 No Leaks - Check Water Buzzer</h3>
                
                <p style="font-size: 16px; margin-bottom: 20px;">No visible leaks detected. Now check if the water buzzer is sounding:</p>
                
                <div style="margin: 20px 0;">
                    <button onclick="handleBuzzerCheck('no-buzzer')" style="
                        background: #059669; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        margin: 10px;
                        cursor: pointer;
                    ">
                        No Buzzer Sounding
                    </button>
                    
                    <button onclick="handleBuzzerCheck('buzzer-on')" style="
                        background: #dc2626; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        margin: 10px;
                        cursor: pointer;
                    ">
                        Buzzer IS Sounding
                    </button>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Leaks found - assess distance
    leaksFoundBtn.addEventListener('click', function() {
        resultDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 3px solid #dc2626; padding: 25px; border-radius: 16px;">
                <h3 style="color: #dc2626; margin: 0 0 20px 0;">🚨 Water Leak Detected</h3>
                
                <p style="font-size: 16px; margin-bottom: 20px;">Assess if the bus can safely reach the next convenient changeover point:</p>
                
                <div style="margin: 20px 0;">
                    <button onclick="handleLeakAssessment('short-distance')" style="
                        background: #f59e0b; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        margin: 10px;
                        cursor: pointer;
                    ">
                        Short Distance to Changeover
                    </button>
                    
                    <button onclick="handleLeakAssessment('long-distance')" style="
                        background: #dc2626; 
                        color: white; 
                        padding: 15px 30px; 
                        border: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        margin: 10px;
                        cursor: pointer;
                    ">
                        Long Distance or Major Leak
                    </button>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Buzzer check handler
    window.handleBuzzerCheck = function(status) {
        const resultDiv = container.querySelector('#low-water-result');
        
        if (status === 'no-buzzer') {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 3px solid #d97706; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #d97706; margin: 0 0 20px 0;">⚠️ No Buzzer - Changeover Required</h3>
                    
                    <div style="background: #d97706; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>Vehicle can continue to next convenient changeover point</strong>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px;">
                        <h4 style="color: #d97706;">Required Actions:</h4>
                        <ul>
                            <li>Continue to changeover point</li>
                            <li>Monitor water levels continuously</li>
                            <li>Arrange changeover at nearest suitable location</li>
                            <li>Record in Go-Check system</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 3px solid #d97706; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #d97706; margin: 0 0 20px 0;">🔔 Buzzer Sounding - Check Recent Top-Up</h3>
                    
                    <p style="margin-bottom: 20px;">Has the water been topped up recently at the depot? (Check SDC top-up log)</p>
                    
                    <div style="margin: 20px 0;">
                        <button onclick="handleRecentTopUp('recently-filled')" style="
                            background: #0891b2; 
                            color: white; 
                            padding: 15px 30px; 
                            border: none; 
                            border-radius: 8px; 
                            font-weight: 600;
                            margin: 10px;
                            cursor: pointer;
                        ">
                            Recently Filled at Depot
                        </button>
                        
                        <button onclick="handleRecentTopUp('long-ago')" style="
                            background: #dc2626; 
                            color: white; 
                            padding: 15px 30px; 
                            border: none; 
                            border-radius: 8px; 
                            font-weight: 600;
                            margin: 10px;
                            cursor: pointer;
                        ">
                            Long Time Ago or Unsure
                        </button>
                    </div>
                </div>
            `;
        }
        
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Recent top-up handler
    window.handleRecentTopUp = function(status) {
        const resultDiv = container.querySelector('#low-water-result');
        
        if (status === 'recently-filled') {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 3px solid #3b82f6; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #3b82f6; margin: 0 0 20px 0;">💧 Arrange En-Route Top-Up</h3>
                    
                    <div style="background: #3b82f6; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>Vehicle recently filled but buzzer sounding - arrange authorized top-up</strong>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px;">
                        <h4 style="color: #3b82f6;">Required Actions:</h4>
                        <ul>
                            <li>Arrange for authorized staff to top-up water en route</li>
                            <li>Check if issue is resolved after top-up</li>
                            <li>If top-up resolves issue, continue in service</li>
                            <li>If problem persists, seek engineering advice</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; color: #dc2626;">
                        <strong>⚠️ Note: In case of a second top-up, changeover should be arranged at earliest opportunity</strong>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 3px solid #d97706; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #d97706; margin: 0 0 20px 0;">📋 Check SDC Log & Consider Top-Up</h3>
                    
                    <p style="margin-bottom: 20px;">After checking SDC top-up log, what action is feasible?</p>
                    
                    <div style="margin: 20px 0;">
                        <button onclick="handleTopUpFeasibility('feasible')" style="
                            background: #059669; 
                            color: white; 
                            padding: 15px 30px; 
                            border: none; 
                            border-radius: 8px; 
                            font-weight: 600;
                            margin: 10px;
                            cursor: pointer;
                        ">
                            En-Route Top-Up Feasible
                        </button>
                        
                        <button onclick="handleTopUpFeasibility('not-feasible')" style="
                            background: #dc2626; 
                            color: white; 
                            padding: 15px 30px; 
                            border: none; 
                            border-radius: 8px; 
                            font-weight: 600;
                            margin: 10px;
                            cursor: pointer;
                        ">
                            Top-Up Not Feasible
                        </button>
                    </div>
                </div>
            `;
        }
        
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Other handlers would go here...
    window.handleLeakAssessment = function(assessment) {
        const resultDiv = container.querySelector('#low-water-result');
        
        if (assessment === 'short-distance') {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 3px solid #d97706; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #d97706;">⚠️ Continue to Changeover with Monitoring</h3>
                    <p>Short distance assessed - vehicle may continue with careful monitoring</p>
                    <ul><li>Monitor water levels continuously</li><li>Arrange changeover at nearest location</li></ul>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 3px solid #dc2626; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #dc2626;">🔧 Engineering Advice Required</h3>
                    <p>Major leak or long distance - engineering assessment needed</p>
                    <ul><li>Contact engineering team</li><li>Provide leak details</li><li>Follow engineering recommendations</li></ul>
                </div>
            `;
        }
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    };
    
    window.handleTopUpFeasibility = function(feasibility) {
        const resultDiv = container.querySelector('#low-water-result');
        
        if (feasibility === 'feasible') {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 3px solid #059669; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #059669;">✅ Top-Up Arranged</h3>
                    <p>Authorized water top-up arranged - monitor results</p>
                    <ul><li>Check if buzzer stops after top-up</li><li>Continue if resolved</li><li>Seek engineering advice if persists</li></ul>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 3px solid #dc2626; padding: 25px; border-radius: 16px;">
                    <h3 style="color: #dc2626;">🔧 Engineering Advice Required</h3>
                    <p>Top-up not feasible - engineering assessment needed</p>
                </div>
            `;
        }
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    };
};

// Update the createGenericWizardFixed function
const originalCreateGeneric = window.createGenericWizardFixed;
window.createGenericWizardFixed = function(container, flow) {
    if (flow.id === 'battery-light') {
        createBatteryWarningWizard(container, flow);
    } else if (flow.id === 'low-water') {
        createLowWaterWizard(container, flow);
    } else if (originalCreateGeneric) {
        originalCreateGeneric(container, flow);
    } else {
        // Default fallback
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; text-align: center;">
                <h2>${flow.icon} ${flow.title}</h2>
                <p>${flow.description}</p>
                <button onclick="showScreen('category')" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
                    ← Return to Categories
                </button>
            </div>
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('💧 Adding Low Water flow...');
    addLowWaterFlow();
});

console.log('💧 Low Water diagnostic loaded');
