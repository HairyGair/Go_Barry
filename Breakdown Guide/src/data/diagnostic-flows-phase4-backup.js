// BACKUP: Phase 4 Complete - Created before Phase 5 implementation
// This is a safety backup of the working Phase 4 system
// Date: January 14, 2025

/**
 * RAPID DECISION DIAGNOSTIC FLOWS - Phase 4 Complete
 * Go North East - Breakdown Guide  
 * 
 * ✅ PHASE 1: 5 Critical Safety Flows (30-90 seconds)
 * ✅ PHASE 4: 5 High Priority Flows (60-120 seconds) 
 * 
 * Total: 10 comprehensive rapid decision flows
 * Version 2.1 - Phase 4 Implementation Complete
 */

const diagnosticFlows = {
    
    // Critical Safety Issues - Phase 1 ✅
    'brakes': {
        id: 'brakes', title: 'Brake Issues', category: 'safety_critical', priority: 1,
        estimatedTime: '30-45 seconds', severity: 'critical', icon: '🛑', color: '#dc2626',
        sdcReference: 'SDC Guide Section 5: Brakes',
        steps: [
            {
                type: 'question', title: 'Are ANY brake symptoms present?',
                subtitle: 'Quick brake safety check', urgency: 'critical',
                content: 'Check for any critical brake issues:', 
                quickCheck: ['Pedal sinks to floor', 'Delayed/ineffective braking', 'Grinding/squealing sounds', 'Visible brake fluid leaks', 'Grabbing/shuddering', 'Red ABS light on'],
                options: [
                    { text: '🚨 YES - Brake symptoms detected', nextStep: 1, severity: 'critical' },
                    { text: '✅ NO - Brakes working normally', nextStep: 2, severity: 'continue' }
                ]
            },
            {
                type: 'final', title: '🛑 STOP IMMEDIATELY', subtitle: 'Critical brake system failure',
                content: 'VEHICLE MUST STOP - Brake system failure detected',
                result: 'Stop immediately and await engineering assistance',
                severity: 'stop', stopReason: 'Brake failure presents extreme danger',
                actions: ['Stop vehicle NOW', 'Switch off engine', 'Contact Engineering URGENT', 'DO NOT move vehicle'],
                contacts: ['Engineering Team - IMMEDIATE', 'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413']
            },
            {
                type: 'final', title: '✅ Brakes Normal', content: 'Continue normal operations',
                result: 'Vehicle may continue with normal monitoring', severity: 'continue',
                actions: ['Continue service as normal', 'Monitor brake performance']
            }
        ]
    },

    'steering': {
        id: 'steering', title: 'Steering Problems', category: 'safety_critical', priority: 1,
        estimatedTime: '30-45 seconds', severity: 'critical', icon: '🎯', color: '#dc2626',
        sdcReference: 'SDC Guide Section 26: Steering',
        steps: [
            {
                type: 'question', title: 'Are ANY steering problems present?',
                subtitle: 'Steering safety assessment', urgency: 'critical',
                quickCheck: ['Excessive play (>75mm)', 'Difficulty steering', 'Unusual noises', 'Vehicle pulling', 'Visible damage', 'Power steering leaks', 'Stiff steering', 'Warning lights'],
                options: [
                    { text: '🚨 YES - Steering problems detected', nextStep: 1, severity: 'critical' },
                    { text: '✅ NO - Steering normal', nextStep: 2, severity: 'continue' }
                ]
            },
            {
                type: 'final', title: '🛑 STOP IMMEDIATELY', subtitle: 'Critical steering failure',
                result: 'Stop immediately due to steering system failure', severity: 'stop',
                actions: ['Stop safely ASAP', 'Switch off engine', 'Contact Engineering URGENT'],
                contacts: ['Engineering Team - URGENT', 'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413']
            },
            { type: 'final', title: '✅ Steering Normal', result: 'Continue with monitoring', severity: 'continue' }
        ]
    },

    'oil-warning': {
        id: 'oil-warning', title: 'Oil Warning Light', category: 'safety_critical', priority: 1,
        estimatedTime: '45-60 seconds', severity: 'critical', icon: '🛢️', color: '#dc2626',
        sdcReference: 'SDC Guide Section 20: Oil Warning Light',
        steps: [
            { type: 'info', title: 'Oil Warning - STOP NOW', content: 'Oil warning requires immediate stop' },
            { type: 'action', title: 'Immediate Stop', instructions: ['Stop immediately', 'Switch off engine', 'Check for leaks', 'Do NOT restart'], nextStep: 2 },
            {
                type: 'question', title: 'Oil leak visible?',
                options: [
                    { text: '🛢️ YES - Oil leaks visible', nextStep: 3, severity: 'critical' },
                    { text: '❓ NO - No visible leaks', nextStep: 4, severity: 'critical' }
                ]
            },
            {
                type: 'final', title: '🛑 OIL LEAK - CRITICAL HAZARD', severity: 'stop',
                result: 'Vehicle must remain stopped - fire/environmental hazard',
                actions: ['Keep engine OFF', 'Clear ignition sources', 'Use spill kits', 'Call fire services if severe'],
                contacts: ['Engineering - IMMEDIATE', 'Fire services (if severe)', 'Environmental authorities']
            },
            {
                type: 'final', title: '🛑 ENGINE FAILURE', severity: 'stop',
                result: 'Engine failure likely - do not restart',
                actions: ['DO NOT restart engine', 'Arrange recovery']
            }
        ]
    },

    'loose-wheel-nuts': {
        id: 'loose-wheel-nuts', title: 'Loose Wheel Nuts', category: 'safety_critical', priority: 1,
        estimatedTime: '15-30 seconds', severity: 'critical', icon: '🔩', color: '#dc2626',
        sdcReference: 'SDC Guide Section 17: Loose Wheel Nuts',
        steps: [
            {
                type: 'final', title: '🛑 LOOSE WHEEL NUTS - STOP NOW', severity: 'stop',
                result: 'ZERO TOLERANCE - Stop immediately',
                actions: ['STOP immediately', 'DO NOT continue', 'Contact ALL management'],
                contacts: ['Engineering - IMMEDIATE', 'Depot Manager', 'General Manager', 'Engineering Director']
            }
        ]
    },

    'abs-light': {
        id: 'abs-light', title: 'ABS Light Warning', category: 'safety_critical', priority: 1,
        estimatedTime: '60-90 seconds', severity: 'warning', icon: '🚨', color: '#f59e0b',
        sdcReference: 'SDC Guide Section 3: ABS Light',
        steps: [
            {
                type: 'question', title: 'What color is the ABS light?',
                options: [
                    { text: '🔴 RED ABS Light', nextStep: 1, severity: 'critical' },
                    { text: '🟡 AMBER ABS Light', nextStep: 4, severity: 'warning' }
                ]
            },
            { type: 'action', title: 'Red ABS Reset', instructions: ['Stop safely', 'Shutdown', 'Reset', 'Drive 10mph'], nextStep: 2 },
            {
                type: 'question', title: 'Red light still on?',
                options: [
                    { text: '🔴 YES - Still on', nextStep: 3, severity: 'critical' },
                    { text: '✅ NO - Cleared', nextStep: 7, severity: 'continue' }
                ]
            },
            { type: 'final', title: '🛑 RED ABS PERSISTENT', severity: 'stop', result: 'Stop and await engineering' },
            { type: 'action', title: 'Amber ABS Reset', instructions: ['Stop safely', 'Reset', 'Drive 10mph'], nextStep: 5 },
            {
                type: 'question', title: 'Amber light still on?',
                options: [
                    { text: '🟡 YES - Still on', nextStep: 6, severity: 'warning' },
                    { text: '✅ NO - Cleared', nextStep: 7, severity: 'continue' }
                ]
            },
            { type: 'final', title: '⚠️ AMBER PERSISTENT', severity: 'warning', result: 'Continue but arrange changeover' },
            { type: 'final', title: '✅ ABS CLEARED', severity: 'continue', result: 'Continue with monitoring' }
        ]
    },

    // High Priority Issues - Phase 4 ✅
    'overheating': {
        id: 'overheating', title: 'Engine Overheating', category: 'high_priority', priority: 2,
        estimatedTime: '90-120 seconds', severity: 'warning', icon: '🌡️', color: '#f59e0b',
        sdcReference: 'SDC Guide Section 21: Overheating',
        steps: [
            {
                type: 'question', title: 'Current engine temperature?',
                options: [
                    { text: '🟡 80-100°C - Elevated', nextStep: 1, severity: 'warning' },
                    { text: '🔴 Over 100°C - High', nextStep: 2, severity: 'critical' }
                ]
            },
            { type: 'final', title: '⚠️ ELEVATED TEMPERATURE', severity: 'warning', result: 'Continue to changeover with monitoring' },
            {
                type: 'question', title: 'Cause of overheating?',
                options: [
                    { text: '💧 Low Water', nextStep: 3, severity: 'warning' },
                    { text: '❓ Other/Unknown', nextStep: 4, severity: 'critical' }
                ]
            },
            {
                type: 'question', title: 'Water buzzer sounding?',
                options: [
                    { text: '✅ No buzzer', nextStep: 5, severity: 'continue' },
                    { text: '🔔 Buzzer sounding', nextStep: 6, severity: 'warning' }
                ]
            },
            { type: 'action', title: 'Heat Dispersion', instructions: ['Turn on heaters', 'Turn on demisters', 'Monitor'], nextStep: 8 },
            { type: 'final', title: '✅ LOW WATER - CONTINUE', severity: 'warning', result: 'Continue to changeover' },
            {
                type: 'question', title: 'Visible water leaks?',
                options: [
                    { text: '💧 Leaks present', nextStep: 7, severity: 'critical' },
                    { text: '✅ No leaks', nextStep: 4, severity: 'warning' }
                ]
            },
            { type: 'final', title: '🛑 WATER LEAK', severity: 'stop', result: 'Stop immediately' },
            { type: 'final', title: '✅ HEAT DISPERSION SUCCESS', severity: 'continue', result: 'Continue with monitoring' }
        ]
    },

    'battery-warning': {
        id: 'battery-warning', title: 'Battery Warning Light', category: 'high_priority', priority: 2,
        estimatedTime: '60-90 seconds', severity: 'warning', icon: '🔋', color: '#f59e0b',
        sdcReference: 'SDC Guide Section 4: Battery Light',
        steps: [
            { type: 'info', title: 'Battery Warning - Safety First', content: 'Engine OFF for belt inspection' },
            { type: 'action', title: 'Belt Inspection (ENGINE OFF)', instructions: ['Engine OFF', 'Inspect belts safely'], nextStep: 2 },
            {
                type: 'question', title: 'Belt condition?',
                options: [
                    { text: '✅ Belts secure', nextStep: 3, severity: 'warning' },
                    { text: '🔴 Belts damaged', nextStep: 5, severity: 'critical' }
                ]
            },
            {
                type: 'question', title: 'Master switch engaged?',
                options: [
                    { text: '❌ Not engaged', nextStep: 4, severity: 'continue' },
                    { text: '✅ Engaged', nextStep: 6, severity: 'warning' }
                ]
            },
            { type: 'final', title: '✅ SWITCH RESOLVED', severity: 'continue', result: 'Engage switch and continue' },
            {
                type: 'question', title: 'Other warning lights?',
                options: [
                    { text: '❌ No other lights', nextStep: 7, severity: 'warning' },
                    { text: '🚨 Other lights present', nextStep: 8, severity: 'critical' }
                ]
            },
            { type: 'final', title: '⚠️ ELECTRICAL FAILURE', severity: 'warning', result: 'Arrange changeover' },
            { type: 'final', title: '⚠️ BELT FAILURE', severity: 'warning', result: 'Limited movement if needed' },
            { type: 'final', title: '🛑 MULTIPLE FAILURES', severity: 'stop', result: 'Stop immediately' }
        ]
    },

    'doors': {
        id: 'doors', title: 'Door Problems', category: 'high_priority', priority: 2,
        estimatedTime: '90-120 seconds', severity: 'warning', icon: '🚪', color: '#f59e0b',
        sdcReference: 'SDC Guide Section 10: Doors',
        steps: [
            { type: 'action', title: 'Initial Door Checks', instructions: ['Check buttons', 'Clear obstructions', 'Test operation'], nextStep: 1 },
            {
                type: 'question', title: 'Initial checks resolved?',
                options: [
                    { text: '✅ Yes - Working', nextStep: 9, severity: 'continue' },
                    { text: '⚠️ No - Still problems', nextStep: 2, severity: 'warning' }
                ]
            },
            { type: 'action', title: 'Air System Check', instructions: ['Check air leaks', 'Build pressure', 'Test doors'], nextStep: 3 },
            {
                type: 'question', title: 'Air system fixed it?',
                options: [
                    { text: '✅ Yes - Working', nextStep: 9, severity: 'continue' },
                    { text: '⚠️ No - Still problems', nextStep: 4, severity: 'warning' }
                ]
            },
            {
                type: 'question', title: 'Critical safety issues?',
                quickCheck: ['Doors jammed closed', 'Cannot stay closed', 'Loose hinges', 'Weakened doors', 'Cannot open/close'],
                options: [
                    { text: '🚨 Yes - Critical issues', nextStep: 5, severity: 'critical' },
                    { text: '⚠️ No - Not critical', nextStep: 6, severity: 'warning' }
                ]
            },
            { type: 'final', title: '🛑 CRITICAL DOOR ISSUE', severity: 'stop', result: 'Stop immediately - passenger safety risk' },
            {
                type: 'question', title: 'Safe for passenger service?',
                options: [
                    { text: '✅ Yes - Safe enough', nextStep: 7, severity: 'warning' },
                    { text: '🚨 No - Too dangerous', nextStep: 5, severity: 'critical' }
                ]
            },
            { type: 'final', title: '⚠️ CONTINUE WITH CAUTION', severity: 'warning', result: 'Continue to changeover with monitoring' },
            { type: 'question', title: 'Monitor for recurrence', options: [{ text: '✅ Continue monitoring', nextStep: 8, severity: 'continue' }] },
            { type: 'final', title: '✅ DOOR PROBLEM RESOLVED', severity: 'continue', result: 'Continue normal operations' }
        ]
    },

    'non-starter': {
        id: 'non-starter', title: 'Vehicle Won\'t Start', category: 'high_priority', priority: 2,
        estimatedTime: '90-120 seconds', severity: 'warning', icon: '🔑', color: '#f59e0b',
        sdcReference: 'SDC Guide Section 19: Non Starter',
        steps: [
            { type: 'action', title: 'System Reset', instructions: ['Neutral', 'Check gear lights', 'Turn off all', 'Engine bay closed', 'Restart'], nextStep: 1 },
            {
                type: 'question', title: 'Started after reset?',
                options: [
                    { text: '✅ Yes - Started', nextStep: 8, severity: 'continue' },
                    { text: '⚠️ No - Still won\'t start', nextStep: 2, severity: 'warning' }
                ]
            },
            {
                type: 'question', title: 'Safe for rear start?',
                quickCheck: ['Area clear', 'Driver trained', 'No loose clothing', 'Safe access'],
                options: [
                    { text: '✅ Yes - Safe', nextStep: 3, severity: 'warning' },
                    { text: '🚨 No - Not safe', nextStep: 6, severity: 'warning' }
                ]
            },
            { type: 'action', title: 'Rear Start (SAFETY CRITICAL)', instructions: ['Secure loose items', 'Stay clear of belts', 'Attempt start'], nextStep: 4 },
            {
                type: 'question', title: 'Rear start worked?',
                options: [
                    { text: '✅ Yes - Running', nextStep: 5, severity: 'warning' },
                    { text: '🔴 No - Still won\'t start', nextStep: 6, severity: 'warning' }
                ]
            },
            { type: 'final', title: '⚠️ REAR START SUCCESS', severity: 'warning', result: 'Keep running, arrange changeover ASAP' },
            { type: 'action', title: 'Diagnostic Gathering', instructions: ['Check oil light', 'Check smoke', 'Note sounds'], nextStep: 7 },
            { type: 'final', title: '🔧 ENGINEERING REQUIRED', severity: 'stop', result: 'Contact engineering, arrange replacement' },
            { type: 'final', title: '✅ STARTED SUCCESSFULLY', severity: 'continue', result: 'Continue normal operations' }
        ]
    },

    'low-water': {
        id: 'low-water', title: 'Low Water Warning', category: 'high_priority', priority: 2,
        estimatedTime: '60-90 seconds', severity: 'warning', icon: '💧', color: '#f59e0b',
        sdcReference: 'SDC Guide Section 18: Low Water',
        steps: [
            {
                type: 'question', title: 'Visible water leaks?',
                options: [
                    { text: '💧 Yes - Leaks found', nextStep: 1, severity: 'warning' },
                    { text: '✅ No - No leaks', nextStep: 2, severity: 'continue' }
                ]
            },
            {
                type: 'question', title: 'Safe to reach changeover?',
                options: [
                    { text: '✅ Yes - Manageable', nextStep: 6, severity: 'warning' },
                    { text: '🔴 No - Severe leak', nextStep: 7, severity: 'critical' }
                ]
            },
            {
                type: 'question', title: 'Water buzzer sounding?',
                options: [
                    { text: '✅ No buzzer', nextStep: 6, severity: 'continue' },
                    { text: '🔔 Yes - Buzzer', nextStep: 3, severity: 'warning' }
                ]
            },
            {
                type: 'question', title: 'Recently topped up?',
                options: [
                    { text: '✅ Yes - Recent fill', nextStep: 4, severity: 'warning' },
                    { text: '❓ No/Unsure', nextStep: 4, severity: 'warning' }
                ]
            },
            {
                type: 'question', title: 'Top-up available en route?',
                options: [
                    { text: '✅ Yes - Available', nextStep: 5, severity: 'warning' },
                    { text: '❌ No - Not feasible', nextStep: 7, severity: 'warning' }
                ]
            },
            {
                type: 'question', title: 'Top-up resolved issue?',
                options: [
                    { text: '✅ Yes - Resolved', nextStep: 8, severity: 'continue' },
                    { text: '🔔 No - Still buzzing', nextStep: 9, severity: 'warning' }
                ]
            },
            { type: 'final', title: '⚠️ CONTINUE TO CHANGEOVER', severity: 'warning', result: 'Manageable - continue to changeover' },
            { type: 'final', title: '🔧 SEEK ENGINEERING ADVICE', severity: 'warning', result: 'Contact engineering for guidance' },
            { type: 'final', title: '✅ WATER ISSUE RESOLVED', severity: 'continue', result: 'Continue with monitoring' },
            { type: 'final', title: '⚠️ SECOND TOP-UP REQUIRED', severity: 'warning', result: 'Arrange changeover - persistent loss' }
        ]
    }
};

// Make flows globally available
window.diagnosticFlows = diagnosticFlows;

// System metadata
const systemMetadata = {
    version: '2.1',
    type: 'rapid_decision_support',
    targetTime: '30-120 seconds per issue',
    optimizedFor: 'control_room_staff',
    lastUpdated: new Date().toISOString(),
    totalFlows: Object.keys(diagnosticFlows).length,
    criticalFlows: Object.values(diagnosticFlows).filter(f => f.category === 'safety_critical').length,
    highPriorityFlows: Object.values(diagnosticFlows).filter(f => f.category === 'high_priority').length,
    sdcCompliant: true,
    phase: 'Phase 4 Complete ✅ - 10 Flows Operational',
    phaseProgress: {
        phase1: { status: 'complete', flows: 5, description: 'Critical Safety Flows (30-90 sec)' },
        phase4: { status: 'complete', flows: 5, description: 'High Priority Flows (60-120 sec)' },
        phase5: { status: 'pending', flows: 0, description: 'Standard Issues (awaiting)' }
    }
};

window.systemMetadata = systemMetadata;

console.log('🎆 Phase 4 COMPLETE - 10 Rapid Decision Flows Operational!');
console.log('Critical flows:', Object.keys(diagnosticFlows).filter(k => diagnosticFlows[k].category === 'safety_critical'));
console.log('High priority flows:', Object.keys(diagnosticFlows).filter(k => diagnosticFlows[k].category === 'high_priority'));
console.log('Total flows operational:', Object.keys(diagnosticFlows).length);
