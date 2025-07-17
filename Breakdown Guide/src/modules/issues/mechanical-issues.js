/**
 * Mechanical Issues Module
 * Contains diagnostic flows for mechanical problems
 * Priority 2-3 issues that may affect vehicle operation
 */

const MECHANICAL_ISSUES_MODULE = {
    
    // OVERHEATING - High Priority
    'overheating': {
        id: 'overheating', 
        title: 'Engine Overheating', 
        category: 'mechanical', 
        priority: 2,
        estimatedTime: '60-90 seconds', 
        severity: 'high', 
        icon: '🌡️', 
        color: '#ea580c',
        sdcReference: 'SDC Guide Section 21: Overheating',
        steps: [
            {
                type: 'question', 
                title: 'Check temperature gauge reading',
                subtitle: 'What does the temperature gauge show?',
                options: [
                    { text: '🌡️ 80-100°C - Normal range', nextStep: 1, severity: 'continue' },
                    { text: '🔥 Over 100°C - Overheating', nextStep: 2, severity: 'high' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Temperature Normal', 
                result: 'Continue to convenient changeover point',
                severity: 'continue',
                actions: [
                    'Continue service normally', 
                    'Monitor temperature gauge'
                ]
            },
            {
                type: 'question', 
                title: 'Identify overheating cause',
                subtitle: 'What is causing the overheating?',
                options: [
                    { text: '💧 Low water level', nextStep: 3, severity: 'moderate' },
                    { text: '🔥 General overheating', nextStep: 4, severity: 'high' }
                ]
            },
            {
                type: 'question', 
                title: 'Can driver safely reach water top-up location?',
                options: [
                    { text: '✅ YES - Short distance to top-up', nextStep: 7, severity: 'continue' },
                    { text: '❌ NO - Too far/unsafe', nextStep: 5, severity: 'stop' }
                ]
            },
            {
                type: 'question', 
                title: 'Is the water buzzer sounding?',
                options: [
                    { text: '🔊 YES - Buzzer sounding', nextStep: 5, severity: 'high' },
                    { text: '🔇 NO - No buzzer', nextStep: 6, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'Check for water leaks',
                subtitle: 'NEVER ask driver to step into highway - safety first',
                content: 'Ask driver to check for visible water leaks from safe position',
                options: [
                    { text: '💧 Leaks present', nextStep: 8, severity: 'stop' },
                    { text: '✅ No leaks visible', nextStep: 9, severity: 'moderate' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'Continue to next convenient changeover point',
                severity: 'changeover',
                actions: [
                    'Continue to changeover point', 
                    'Monitor temperature', 
                    'Record defect on Go-Check'
                ]
            },
            {
                type: 'final', 
                title: '✅ Top Up Water', 
                result: 'Proceed to water top-up location',
                severity: 'continue',
                actions: [
                    'Proceed to top-up location', 
                    'Monitor temperature', 
                    'Arrange changeover after top-up'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Water Leak', 
                result: 'Stop immediately due to water leak',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Contact Engineering', 
                    'Do not continue'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'action', 
                title: 'Try heaters and demisters',
                instructions: [
                    'Turn on heaters and demisters', 
                    'This helps disperse heat in system', 
                    'Monitor if this resolves issue'
                ],
                nextStep: 10
            },
            {
                type: 'question', 
                title: 'Did heaters/demisters resolve the issue?',
                options: [
                    { text: '✅ YES - Issue resolved', nextStep: 6, severity: 'continue' },
                    { text: '❌ NO - Still overheating', nextStep: 8, severity: 'stop' }
                ]
            }
        ]
    },

    // SUSPENSION ISSUES
    'suspension': {
        id: 'suspension', 
        title: 'Suspension Problems', 
        category: 'mechanical', 
        priority: 3,
        estimatedTime: '45-75 seconds', 
        severity: 'moderate', 
        icon: '🔧', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 34: Suspension',
        steps: [
            {
                type: 'question', 
                title: 'Suspension fault assessment',
                subtitle: 'Check all suspension indicators',
                content: 'Assess the suspension system status',
                quickCheck: [
                    'Warning lights on dashboard (red/amber)?',
                    'Bus leaning to one side?',
                    'One corner riding low/high?',
                    'Audible bang or air escape?',
                    'Air pressure within normal parameters?',
                    'Ride quality acceptable?'
                ],
                options: [
                    { text: '🚨 Multiple serious symptoms', nextStep: 2, severity: 'high' },
                    { text: '⚠️ Minor symptoms only', nextStep: 1, severity: 'moderate' }
                ]
            },
            {
                type: 'action', 
                title: 'Reset vehicle system',
                instructions: [
                    'Switch off ignition', 
                    'Reset vehicle completely', 
                    'Restart and check if issue cleared'
                ],
                nextStep: 3
            },
            {
                type: 'final', 
                title: '🛑 STOP - Serious Suspension Fault', 
                result: 'Stop and await engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop vehicle immediately', 
                    'Contact Engineering', 
                    'Record on Go-Check'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Did reset clear the issue?',
                options: [
                    { text: '✅ YES - Issue cleared', nextStep: 4, severity: 'continue' },
                    { text: '❌ NO - Problem persists', nextStep: 2, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Continue Service', 
                result: 'Continue normal operations',
                severity: 'continue',
                actions: [
                    'Continue service', 
                    'Monitor suspension performance', 
                    'Report any recurrence'
                ]
            }
        ]
    },

    // GEARBOX TEMPERATURE
    'gearbox-temperature': {
        id: 'gearbox-temperature', 
        title: 'Gearbox Temperature', 
        category: 'mechanical', 
        priority: 3,
        estimatedTime: '60-90 seconds', 
        severity: 'moderate', 
        icon: '⚙️', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 21: Gearbox Temperature',
        steps: [
            {
                type: 'action', 
                title: 'Reset vehicle system',
                instructions: [
                    'Switch off bus completely', 
                    'Reset system', 
                    'Restart and check if issue cleared'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Did reset clear the temperature issue?',
                options: [
                    { text: '✅ YES - Issue cleared', nextStep: 5, severity: 'continue' },
                    { text: '❌ NO - Problem persists', nextStep: 2, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'Check for coolant leaks',
                subtitle: 'NEVER ask driver to step into road - safety first',
                content: 'Ask driver to check for visible water leaks from safe position',
                options: [
                    { text: '💧 Leaks present', nextStep: 6, severity: 'stop' },
                    { text: '✅ No leaks visible', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'Recent terrain assessment',
                subtitle: 'Has the bus recently operated on hilly terrain?',
                options: [
                    { text: '⛰️ YES - Hilly terrain recently', nextStep: 4, severity: 'moderate' },
                    { text: '🛣️ NO - Flat terrain only', nextStep: 7, severity: 'high' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Monitor and Change Over', 
                result: 'Continue briefly and arrange changeover',
                severity: 'changeover',
                actions: [
                    'Continue for short time', 
                    'Monitor temperature', 
                    'Arrange changeover at next convenient location'
                ]
            },
            {
                type: 'final', 
                title: '✅ Continue Service', 
                result: 'Continue normal operations',
                severity: 'continue',
                actions: [
                    'Continue service normally', 
                    'Monitor gearbox temperature'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Coolant Leak', 
                result: 'Stop immediately due to coolant leak',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Contact Engineering', 
                    'Do not continue'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Distance to changeover point',
                subtitle: 'Can bus safely reach nearest changeover?',
                options: [
                    { text: '✅ YES - Close changeover point', nextStep: 4, severity: 'changeover' },
                    { text: '❌ NO - Too far to drive safely', nextStep: 6, severity: 'stop' }
                ]
            }
        ]
    },

    // PUNCTURE
    'puncture': {
        id: 'puncture', 
        title: 'Puncture/Tire Issue', 
        category: 'mechanical', 
        priority: 2,
        estimatedTime: '30-45 seconds', 
        severity: 'high', 
        icon: '🛞', 
        color: '#ea580c',
        sdcReference: 'SDC Guide Section 32: Puncture',
        steps: [
            {
                type: 'question', 
                title: 'Determine puncture location',
                subtitle: 'Identify the position of the puncture',
                content: 'Driver should identify:',
                quickCheck: [
                    'Inner or outer tire?',
                    'Front or rear?',
                    'Offside or nearside?'
                ],
                options: [
                    { text: '📍 Location identified', nextStep: 1, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP IMMEDIATELY', 
                subtitle: 'Puncture requires immediate stop',
                result: 'Stop immediately and seek engineering advice',
                severity: 'stop',
                actions: [
                    'Stop vehicle immediately', 
                    'Provide puncture location details to Engineering', 
                    'Await engineering assistance', 
                    'Record details on Go-Check'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE', 
                    'Provide exact location and tire details'
                ]
            }
        ]
    }

};

// Export the module
if (typeof window !== 'undefined') {
    window.MECHANICAL_ISSUES_MODULE = MECHANICAL_ISSUES_MODULE;
}