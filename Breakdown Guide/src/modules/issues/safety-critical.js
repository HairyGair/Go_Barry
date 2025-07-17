/**
 * Safety Critical Issues Module
 * Contains all critical safety diagnostic flows
 * These are the highest priority issues that require immediate action
 */

const SAFETY_CRITICAL_MODULE = {
    
    // BRAKES - Critical Priority 1
    'brakes': {
        id: 'brakes', 
        title: 'Brake Issues', 
        category: 'safety_critical', 
        priority: 1,
        estimatedTime: '30-45 seconds', 
        severity: 'critical', 
        icon: '🛑', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 5: Brakes',
        steps: [
            {
                type: 'question', 
                title: 'Are ANY brake symptoms present?',
                subtitle: 'Quick brake safety check', 
                urgency: 'critical',
                content: 'Check for any critical brake issues:', 
                quickCheck: [
                    'Pedal sinks to floor', 
                    'Delayed/ineffective braking', 
                    'Grinding/squealing sounds', 
                    'Visible brake fluid leaks', 
                    'Grabbing/shuddering', 
                    'Red ABS light on'
                ],
                options: [
                    { text: '🚨 YES - Brake symptoms detected', nextStep: 1, severity: 'critical' },
                    { text: '✅ NO - Brakes working normally', nextStep: 2, severity: 'continue' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP IMMEDIATELY', 
                subtitle: 'Critical brake system failure',
                content: 'VEHICLE MUST STOP - Brake system failure detected',
                result: 'Stop immediately and await engineering assistance',
                severity: 'stop', 
                stopReason: 'Brake failure presents extreme danger',
                actions: [
                    'Stop vehicle NOW', 
                    'Switch off engine', 
                    'Contact Engineering URGENT', 
                    'DO NOT move vehicle'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE', 
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413'
                ]
            },
            {
                type: 'final', 
                title: '✅ Brakes Normal', 
                content: 'Continue normal operations',
                result: 'Vehicle may continue with normal monitoring', 
                severity: 'continue',
                actions: [
                    'Continue service as normal', 
                    'Monitor brake performance'
                ]
            }
        ]
    },

    // STEERING - Critical Priority 1
    'steering': {
        id: 'steering', 
        title: 'Steering Problems', 
        category: 'safety_critical', 
        priority: 1,
        estimatedTime: '30-45 seconds', 
        severity: 'critical', 
        icon: '🎯', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 26: Steering',
        steps: [
            {
                type: 'question', 
                title: 'Are ANY steering problems present?',
                subtitle: 'Steering safety assessment', 
                urgency: 'critical',
                quickCheck: [
                    'Excessive play (>75mm)', 
                    'Difficulty steering', 
                    'Unusual noises', 
                    'Vehicle pulling', 
                    'Visible damage', 
                    'Power steering leaks', 
                    'Stiff steering', 
                    'Warning lights'
                ],
                options: [
                    { text: '🚨 YES - Steering problems detected', nextStep: 1, severity: 'critical' },
                    { text: '✅ NO - Steering normal', nextStep: 2, severity: 'continue' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP IMMEDIATELY', 
                subtitle: 'Critical steering failure',
                result: 'Stop immediately due to steering system failure', 
                severity: 'stop',
                actions: [
                    'Stop safely ASAP', 
                    'Switch off engine', 
                    'Contact Engineering URGENT'
                ],
                contacts: [
                    'Engineering Team - URGENT', 
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413'
                ]
            },
            { 
                type: 'final', 
                title: '✅ Steering Normal', 
                result: 'Continue with monitoring', 
                severity: 'continue' 
            }
        ]
    },

    // OIL WARNING - Critical Priority 1
    'oil-warning': {
        id: 'oil-warning', 
        title: 'Oil Warning Light', 
        category: 'safety_critical', 
        priority: 1,
        estimatedTime: '45-60 seconds', 
        severity: 'critical', 
        icon: '🛢️', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 20: Oil Warning Light',
        steps: [
            { 
                type: 'info', 
                title: 'Oil Warning - STOP NOW', 
                content: 'Oil warning requires immediate stop' 
            },
            { 
                type: 'action', 
                title: 'Immediate Stop', 
                instructions: [
                    'Stop immediately', 
                    'Switch off engine', 
                    'Check for leaks', 
                    'Do NOT restart'
                ], 
                nextStep: 2 
            },
            {
                type: 'question', 
                title: 'Oil leak visible?',
                options: [
                    { text: '🛢️ YES - Oil leaks visible', nextStep: 3, severity: 'critical' },
                    { text: '❓ NO - No visible leaks', nextStep: 4, severity: 'critical' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 OIL LEAK - CRITICAL HAZARD', 
                severity: 'stop',
                result: 'Vehicle must remain stopped - fire/environmental hazard',
                actions: [
                    'Keep engine OFF', 
                    'Clear ignition sources', 
                    'Use spill kits', 
                    'Call fire services if severe'
                ],
                contacts: [
                    'Engineering - IMMEDIATE', 
                    'Fire services (if severe)', 
                    'Environmental authorities'
                ]
            },
            {
                type: 'final', 
                title: '🛑 ENGINE FAILURE', 
                severity: 'stop',
                result: 'Engine failure likely - do not restart',
                actions: [
                    'DO NOT restart engine', 
                    'Arrange recovery'
                ]
            }
        ]
    },

    // LOOSE WHEEL NUTS - Critical Priority 1
    'loose-wheel-nuts': {
        id: 'loose-wheel-nuts', 
        title: 'Loose Wheel Nuts', 
        category: 'safety_critical', 
        priority: 1,
        estimatedTime: '30-45 seconds', 
        severity: 'critical', 
        icon: '⚙️', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 17: Loose Wheel Nuts',
        steps: [
            {
                type: 'final', 
                title: '🛑 STOP IMMEDIATELY', 
                subtitle: 'Wheel detachment risk',
                content: 'CRITICAL SAFETY RISK - Wheel may detach',
                result: 'Stop immediately - wheel detachment imminent',
                severity: 'stop',
                actions: [
                    'STOP vehicle immediately', 
                    'Contact Engineering URGENT', 
                    'DO NOT continue under any circumstances', 
                    'Report to depot engineering manager, general manager and engineering delivery director'
                ],
                contacts: [
                    'Engineering Team - CRITICAL EMERGENCY', 
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413'
                ]
            }
        ]
    },

    // EXCESSIVE SMOKE - Critical Priority 1
    'excessive-smoke': {
        id: 'excessive-smoke', 
        title: 'Excessive Smoke', 
        category: 'safety_critical', 
        priority: 1,
        estimatedTime: '45-60 seconds', 
        severity: 'critical', 
        icon: '💨', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 12: Excessive Smoke',
        steps: [
            {
                type: 'question', 
                title: 'What type of smoke issue?',
                subtitle: 'Assess smoke severity and location',
                options: [
                    { text: '🔥 Fumes entering vehicle interior', nextStep: 1, severity: 'critical' },
                    { text: '💨 Exhaust becoming detached', nextStep: 1, severity: 'critical' },
                    { text: '👁️ Smoke obscuring vision/creating danger', nextStep: 1, severity: 'critical' },
                    { text: '🌫️ Continuous dense blue/black smoke', nextStep: 1, severity: 'critical' },
                    { text: '✅ Minor smoke - not dangerous', nextStep: 2, severity: 'monitor' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP IMMEDIATELY', 
                subtitle: 'Dangerous smoke detected',
                result: 'Stop immediately - smoke presents safety risk',
                severity: 'stop',
                actions: [
                    'Stop vehicle immediately', 
                    'Switch off engine', 
                    'Contact Engineering URGENT', 
                    'Monitor for fire risk'
                ],
                contacts: [
                    'Engineering Team - URGENT', 
                    'Fire services if fire risk present'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Monitor and Change Over', 
                result: 'Continue to nearest changeover point with monitoring',
                severity: 'changeover',
                actions: [
                    'Continue to changeover point', 
                    'Monitor smoke levels', 
                    'Stop if situation worsens'
                ]
            }
        ]
    }

};

// Export the module
if (typeof window !== 'undefined') {
    window.SAFETY_CRITICAL_MODULE = SAFETY_CRITICAL_MODULE;
}