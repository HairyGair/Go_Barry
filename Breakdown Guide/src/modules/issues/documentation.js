/**
 * Documentation Module
 * Contains reference information, contact details, and procedural guidance
 * Support information for all diagnostic flows
 */

const DOCUMENTATION_MODULE = {
    
    // REPEAT DEFECTS
    'repeat-defects': {
        id: 'repeat-defects', 
        title: 'Repeat Defects Procedure', 
        category: 'documentation', 
        priority: 2,
        estimatedTime: '45-60 seconds', 
        severity: 'administrative', 
        icon: '🔄', 
        color: '#6366f1',
        sdcReference: 'SDC Guide Section 23: Repeat Defects',
        steps: [
            {
                type: 'question', 
                title: 'Type of repeat defect',
                subtitle: 'When did the defect previously occur?',
                options: [
                    { text: '📅 Same day - Bus taken out and reallocated with same defects', nextStep: 1, severity: 'escalate' },
                    { text: '📅 Multi-day - Same defects over several days', nextStep: 2, severity: 'escalate' }
                ]
            },
            {
                type: 'final', 
                title: '🚨 Same-Day Repeat Defect', 
                result: 'Immediate escalation required',
                severity: 'escalate',
                actions: [
                    'Report immediately to Engineering Delivery Director', 
                    'Send copies to General Manager and Engineering Manager', 
                    'Bus should not have been reallocated with unresolved defects', 
                    'Report accurately in Go-Check with pictures if appropriate'
                ],
                contacts: [
                    'Engineering Delivery Director - IMMEDIATE',
                    'General Manager - Copy',
                    'Engineering Manager - Copy'
                ]
            },
            {
                type: 'final', 
                title: '🚨 Multi-Day Repeat Defect', 
                result: 'Escalation for persistent issues',
                severity: 'escalate',
                actions: [
                    'Report immediately to Engineering Delivery Director', 
                    'Send copies to General Manager and Engineering Manager', 
                    'Document pattern of unresolved defects', 
                    'Ensure timely resolution to prevent service reliability issues',
                    'Maintain accurate records of all reported defects'
                ],
                contacts: [
                    'Engineering Delivery Director - IMMEDIATE',
                    'General Manager - Copy', 
                    'Engineering Manager - Copy'
                ]
            }
        ]
    },

    // UNABLE TO SELECT GEARS
    'gear-selection': {
        id: 'gear-selection', 
        title: 'Unable to Select Gears', 
        category: 'documentation', 
        priority: 3,
        estimatedTime: '75-90 seconds', 
        severity: 'moderate', 
        icon: '⚙️', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 24: Unable to Select Gears',
        steps: [
            {
                type: 'action', 
                title: 'System reset procedure',
                instructions: [
                    'Switch bus off completely', 
                    'Reset system', 
                    'Restart in usual manner', 
                    'Attempt gear selection'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Did system reset resolve gear selection?',
                options: [
                    { text: '✅ YES - Gears selecting normally', nextStep: 2, severity: 'continue' },
                    { text: '❌ NO - Still cannot select gears', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Gear Selection Working', 
                result: 'Continue service normally',
                severity: 'continue',
                actions: [
                    'Continue service as normal', 
                    'Monitor gear selection performance', 
                    'Report if problem recurs'
                ]
            },
            {
                type: 'action', 
                title: 'Check ramp position',
                instructions: [
                    'Visually inspect if ramp is correctly secured in stowed position',
                    'Lift ramp and stow again to ensure correct securing'
                ],
                nextStep: 4
            },
            {
                type: 'question', 
                title: 'Check suspension light (if applicable)',
                subtitle: 'Has suspension light been reset before attempting gear engagement?',
                options: [
                    { text: '✅ Suspension light reset', nextStep: 5, severity: 'continue' },
                    { text: '⚠️ Need to reset suspension light', nextStep: 6, severity: 'action' }
                ]
            },
            {
                type: 'action', 
                title: 'Confirm proper operation technique',
                instructions: [
                    'Ensure driver pressing firmly on footbrake while selecting gear',
                    'Verify correct gear selection procedure being followed'
                ],
                nextStep: 7
            },
            {
                type: 'action', 
                title: 'Reset suspension light',
                instructions: [
                    'Reset suspension light on dashboard',
                    'Then attempt gear selection with firm footbrake pressure'
                ],
                nextStep: 7
            },
            {
                type: 'question', 
                title: 'Did troubleshooting resolve the issue?',
                options: [
                    { text: '✅ YES - Can now select gears', nextStep: 2, severity: 'continue' },
                    { text: '❌ NO - Still cannot select gears', nextStep: 8, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Gear Selection Failed', 
                result: 'Stop and await engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop vehicle', 
                    'All troubleshooting steps attempted', 
                    'Contact Engineering for assistance', 
                    'Record on Go-Check when stationary and safe'
                ],
                contacts: ['Engineering Team']
            }
        ]
    },

    // CONTACT INFORMATION
    'contact-information': {
        id: 'contact-information', 
        title: 'Emergency Contact Information', 
        category: 'documentation', 
        priority: 1,
        estimatedTime: '15-30 seconds', 
        severity: 'reference', 
        icon: '📞', 
        color: '#22c55e',
        sdcReference: 'SDC Guide - Contact Information',
        steps: [
            {
                type: 'info', 
                title: 'Engineering Team Extensions',
                content: 'Emergency Engineering Contacts',
                quickCheck: [
                    'Consett: 9286/9287',
                    'Riverside: 9254/0888', 
                    'Sunderland: 9299',
                    'Washington: 6123/6327',
                    'Percy Main: 9413'
                ],
                actions: [
                    'Use appropriate extension for your depot',
                    'For critical emergencies, try multiple extensions',
                    'Always provide clear location and problem description'
                ]
            }
        ]
    },

    // SAFETY DECLARATION REFERENCE
    'safety-declaration': {
        id: 'safety-declaration', 
        title: 'Safety Declaration Reference', 
        category: 'documentation', 
        priority: 1,
        estimatedTime: '30-45 seconds', 
        severity: 'reference', 
        icon: '🛡️', 
        color: '#22c55e',
        sdcReference: 'SDC Guide Section 1: Safety Declaration',
        steps: [
            {
                type: 'info', 
                title: 'Safety is Non-Negotiable',
                content: 'Core safety principles for all decisions',
                quickCheck: [
                    'Safety of everyone—staff, passengers, and public—is highest priority',
                    'Any action that compromises safety is unacceptable',
                    'Vehicle with safety-critical defect must not remain in service',
                    'Once prohibition issued, vehicle cannot be used unless exemption granted',
                    'When in doubt, seek advice from competent engineer'
                ],
                actions: [
                    'Always prioritize safety over service continuity',
                    'Make decisions aligned with DVSA standards',
                    'Maintain communication with drivers at all times',
                    'Refer to DVSA Categorisation of Defects for guidance'
                ]
            }
        ]
    }

};

// Export the module
if (typeof window !== 'undefined') {
    window.DOCUMENTATION_MODULE = DOCUMENTATION_MODULE;
}