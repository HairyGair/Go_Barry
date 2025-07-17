/**
 * Electrical Issues Module
 * Contains diagnostic flows for electrical problems
 * Priority 2-4 issues affecting electrical systems
 */

const ELECTRICAL_ISSUES_MODULE = {
    
    // BATTERY LIGHT
    'battery-light': {
        id: 'battery-light', 
        title: 'Battery Light On', 
        category: 'electrical', 
        priority: 2,
        estimatedTime: '45-75 seconds', 
        severity: 'high', 
        icon: '🔋', 
        color: '#ea580c',
        sdcReference: 'SDC Guide Section 13: Battery Light On',
        steps: [
            {
                type: 'action', 
                title: 'Safety First - Engine Off',
                subtitle: 'ALWAYS turn engine off before inspection',
                content: 'CRITICAL: Advise driver to steer clear of moving belts',
                instructions: [
                    'Turn engine OFF before any inspection', 
                    'NEVER inspect with engine running', 
                    'Stay clear of moving parts'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Check drive belts',
                subtitle: 'Are all belts in place and secure?',
                options: [
                    { text: '✅ Belts in place and secure', nextStep: 2, severity: 'moderate' },
                    { text: '❌ Belt(s) come off or damaged', nextStep: 3, severity: 'high' }
                ]
            },
            {
                type: 'question', 
                title: 'Check master switch',
                subtitle: 'Is the master switch properly engaged?',
                options: [
                    { text: '❌ Master switch not engaged', nextStep: 4, severity: 'simple' },
                    { text: '✅ Master switch engaged', nextStep: 5, severity: 'high' }
                ]
            },
            {
                type: 'question', 
                title: 'Belt damage assessment',
                subtitle: 'Check for other warning lights',
                content: 'Are there other warning lights (e.g., temperature warning)?',
                options: [
                    { text: '⚠️ Other warning lights on', nextStep: 6, severity: 'stop' },
                    { text: '🔋 Only battery light', nextStep: 7, severity: 'limited' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Engage Master Switch', 
                result: 'Engage master switch and continue',
                severity: 'continue',
                actions: [
                    'Engage the master switch', 
                    'Continue service normally', 
                    'Monitor electrical systems'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Electrical System Failure', 
                result: 'Stop and await engineering - transmission may be lost',
                severity: 'stop',
                actions: [
                    'Wait for Engineering assistance', 
                    'Do not attempt to continue', 
                    'Risk of transmission drive loss and electrical failure'
                ],
                contacts: ['Engineering Team - HIGH PRIORITY']
            },
            {
                type: 'final', 
                title: '🛑 STOP - Multiple System Failure', 
                result: 'Stop immediately - multiple systems affected',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Wait for Engineering assistance', 
                    'Multiple system failure likely'
                ],
                contacts: ['Engineering Team - URGENT']
            },
            {
                type: 'final', 
                title: '⚠️ Limited Movement Only', 
                result: 'Vehicle may be moved short distance if needed for safety',
                severity: 'limited',
                actions: [
                    'Can move short distance for safety only', 
                    'Arrange Engineering assistance', 
                    'Do not continue normal service'
                ],
                contacts: ['Engineering Team']
            }
        ]
    },

    // ABS LIGHT
    'abs-light': {
        id: 'abs-light', 
        title: 'ABS Light On', 
        category: 'electrical', 
        priority: 2,
        estimatedTime: '60-90 seconds', 
        severity: 'moderate', 
        icon: '🚨', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 14: ABS Light On',
        steps: [
            {
                type: 'question', 
                title: 'What color is the ABS light?',
                subtitle: 'Identify the ABS warning light color',
                options: [
                    { text: '🟡 AMBER ABS light', nextStep: 1, severity: 'moderate' },
                    { text: '🔴 RED ABS light', nextStep: 5, severity: 'high' }
                ]
            },
            {
                type: 'action', 
                title: 'AMBER ABS - Reset procedure',
                instructions: [
                    'Driver should stop safely', 
                    'Shut down vehicle completely', 
                    'Perform full system reset', 
                    'Restart and drive to 10mph to check'
                ],
                nextStep: 2
            },
            {
                type: 'question', 
                title: 'AMBER ABS status after reset (at 10mph)',
                options: [
                    { text: '✅ Light cleared - not illuminated', nextStep: 3, severity: 'continue' },
                    { text: '🟡 Light remains on', nextStep: 4, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '✅ AMBER ABS Cleared', 
                result: 'Vehicle may remain in service',
                severity: 'continue',
                actions: [
                    'Log defect on GoCheck', 
                    'Continue service', 
                    'If light reappears, seek further advice'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ AMBER ABS - Change Over', 
                result: 'Continue but arrange changeover at earliest convenience',
                severity: 'changeover',
                actions: [
                    'Vehicle may remain in service', 
                    'Changeover at earliest convenience', 
                    'Log on GoCheck'
                ]
            },
            {
                type: 'action', 
                title: 'RED ABS - Reset procedure',
                instructions: [
                    'Driver should stop safely', 
                    'Shut down vehicle completely', 
                    'Perform full system reset', 
                    'Restart and drive to 10mph to check'
                ],
                nextStep: 6
            },
            {
                type: 'question', 
                title: 'RED ABS status after reset (at 10mph)',
                options: [
                    { text: '✅ Red light cleared', nextStep: 7, severity: 'changeover' },
                    { text: '🔴 Red light remains on', nextStep: 8, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ RED ABS Cleared - Change Over', 
                result: 'Continue but changeover at earliest convenience',
                severity: 'changeover',
                actions: [
                    'Vehicle may remain in service', 
                    'Changeover at earliest convenience', 
                    'Safety priority - ABS fault must be checked by engineer'
                ]
            },
            {
                type: 'final', 
                title: '🛑 RED ABS - STOP', 
                result: 'Stop and wait for engineering assistance',
                severity: 'stop',
                actions: [
                    'Driver should stop', 
                    'Wait for engineering assistance', 
                    'Record on Go-Check immediately'
                ],
                contacts: ['Engineering Team']
            }
        ]
    },

    // WARNING LIGHTS (MULTIPLE)
    'warning-lights': {
        id: 'warning-lights', 
        title: 'Multiple Warning Lights', 
        category: 'electrical', 
        priority: 3,
        estimatedTime: '45-90 seconds', 
        severity: 'variable', 
        icon: '⚠️', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 25: Warning Lights On',
        steps: [
            {
                type: 'question', 
                title: 'Identify warning light details',
                subtitle: 'Gather information about the warning lights',
                content: 'Ask driver to describe:',
                quickCheck: [
                    'What do the lights refer to?',
                    'Where are they on the dashboard?',
                    'Are they RED or AMBER?',
                    'Upload image to Go-Check if possible'
                ],
                options: [
                    { text: '🔴 RED warning lights', nextStep: 1, severity: 'high' },
                    { text: '🟡 AMBER warning lights', nextStep: 5, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'RED light behavior',
                subtitle: 'Are the red lights continuous or intermittent?',
                options: [
                    { text: '🔴 Continuous red lights', nextStep: 2, severity: 'stop' },
                    { text: '📱 Intermittent red lights', nextStep: 3, severity: 'high' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Continuous Red Lights', 
                result: 'Stop and await engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Contact Engineering', 
                    'Upload image to Go-Check', 
                    'Do not continue'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'action', 
                title: 'Intermittent red lights - Reset test',
                instructions: [
                    'Stop in safe location', 
                    'Restart vehicle', 
                    'Observe if lights remain off'
                ],
                nextStep: 4
            },
            {
                type: 'question', 
                title: 'After restart - do red lights persist?',
                options: [
                    { text: '✅ Lights remain off', nextStep: 6, severity: 'changeover' },
                    { text: '🔴 Lights reappear or persist', nextStep: 2, severity: 'stop' }
                ]
            },
            {
                type: 'question', 
                title: 'AMBER lights - System affected',
                subtitle: 'Do amber lights affect safety critical systems?',
                content: 'Check if lights relate to:',
                quickCheck: [
                    'ABS system (see ABS guide)',
                    'Braking systems', 
                    'Steering systems', 
                    'Control systems'
                ],
                options: [
                    { text: '🚨 Safety critical systems affected', nextStep: 2, severity: 'stop' },
                    { text: '⚠️ Non-critical systems only', nextStep: 7, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'Continue to next convenient changeover point',
                severity: 'changeover',
                actions: [
                    'Continue to changeover point', 
                    'Monitor warning lights', 
                    'Stop if situation worsens', 
                    'Record on Go-Check'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ AMBER - Change Over Soon', 
                result: 'Continue but arrange changeover at next convenient point',
                severity: 'changeover',
                actions: [
                    'If ABS light, follow ABS guidance', 
                    'Continue to convenient changeover', 
                    'Record on Go-Check'
                ]
            }
        ]
    },

    // INTERIOR LIGHTS
    'interior-lights': {
        id: 'interior-lights', 
        title: 'Interior Lights Not Working', 
        category: 'electrical', 
        priority: 4,
        estimatedTime: '30-45 seconds', 
        severity: 'low', 
        icon: '💡', 
        color: '#22c55e',
        sdcReference: 'SDC Guide Section 33: Interior Lights',
        steps: [
            {
                type: 'question', 
                title: 'Interior lighting assessment',
                subtitle: 'Check lighting coverage on each deck',
                content: 'Assess the interior lighting situation:',
                quickCheck: [
                    'Are at least 50% of lights working on each deck?',
                    'Is at least one side of lights working?',
                    'Is the step light working when doors open?'
                ],
                options: [
                    { text: '✅ YES to both questions', nextStep: 1, severity: 'continue' },
                    { text: '❌ NO to either question', nextStep: 2, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Sufficient Lighting', 
                result: 'Continue with changeover when convenient',
                severity: 'continue',
                actions: [
                    'Bus can continue in service', 
                    'Arrange changeover soon, especially if operating during darkness', 
                    'Monitor lighting situation'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Insufficient Lighting', 
                result: 'Arrange immediate changeover',
                severity: 'changeover',
                actions: [
                    'Change over bus immediately', 
                    'Insufficient lighting for safe passenger service', 
                    'Especially critical during darkness'
                ]
            }
        ]
    },

    // EXTERIOR LIGHTS
    'exterior-lights': {
        id: 'exterior-lights', 
        title: 'Exterior Lights Not Working', 
        category: 'electrical', 
        priority: 2,
        estimatedTime: '45-60 seconds', 
        severity: 'variable', 
        icon: '🔦', 
        color: '#ea580c',
        sdcReference: 'SDC Guide Section 35: Exterior Lights',
        steps: [
            {
                type: 'question', 
                title: 'Which exterior lights are affected?',
                subtitle: 'Identify the specific light issue',
                options: [
                    { text: '💡 Headlights not working', nextStep: 1, severity: 'high' },
                    { text: '🔄 Direction indicators not working', nextStep: 4, severity: 'stop' },
                    { text: '🔴 Brake lights not working', nextStep: 5, severity: 'variable' }
                ]
            },
            {
                type: 'question', 
                title: 'Headlight operating conditions',
                subtitle: 'When is the vehicle operating?',
                content: 'Is the vehicle operating in hours of darkness on an unrestricted road?',
                options: [
                    { text: '🌙 YES - Operating in darkness on unrestricted road', nextStep: 2, severity: 'stop' },
                    { text: '☀️ NO - Daylight or restricted roads', nextStep: 3, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Darkness Operation Unsafe', 
                result: 'Vehicle must not continue in darkness',
                severity: 'stop',
                actions: [
                    'Vehicle must not continue', 
                    'Unsafe for darkness operation', 
                    'Contact Engineering'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'final', 
                title: '⚠️ Change Before Darkness', 
                result: 'Continue but changeover before hours of darkness',
                severity: 'changeover',
                actions: [
                    'Bus can continue', 
                    'MUST arrange changeover before darkness', 
                    'Record on Go-Check'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Indicators Critical', 
                result: 'Stop and await engineering attendance',
                severity: 'stop',
                actions: [
                    'Direction indicators are critical safety equipment', 
                    'Stop and await engineering assistance', 
                    'Do not continue without working indicators'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Brake light assessment',
                subtitle: 'Which brake lights are affected?',
                content: 'Identify the brake light issue:',
                quickCheck: [
                    'Is it a low level brake light?',
                    'Are brake lights on constantly?',
                    'Is one or both lights inoperative?'
                ],
                options: [
                    { text: '🔴 Both low level brake lights not working', nextStep: 4, severity: 'stop' },
                    { text: '🔴 Brake lights on constantly', nextStep: 4, severity: 'stop' },
                    { text: '🔴 One brake light not working', nextStep: 6, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Single Brake Light - Change Over', 
                result: 'Continue to next convenient changeover location',
                severity: 'changeover',
                actions: [
                    'Continue in service', 
                    'Proceed to next convenient changeover', 
                    'Record on Go-Check'
                ]
            }
        ]
    }

};

// Export the module
if (typeof window !== 'undefined') {
    window.ELECTRICAL_ISSUES_MODULE = ELECTRICAL_ISSUES_MODULE;
}