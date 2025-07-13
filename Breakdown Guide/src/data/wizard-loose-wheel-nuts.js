/**
 * SDC Guide Compliant Multi-Step Wizard - LOOSE WHEEL NUTS
 * Exact SDC Guide Steps from Page 28
 */

const looseWheelNutsWizard = {
    'loose-wheel-nuts': {
        title: 'Loose Wheel Nuts',
        description: 'Wheel security issue - zero tolerance',
        priority: 1,
        severity: 'critical',
        icon: '🔩',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Loose Wheel Nuts',
                content: 'If a driver reports loose wheel nuts, follow these steps:',
                warning: '🚨 ZERO TOLERANCE: Under no circumstances should the vehicle continue in service with loose wheel nuts'
            },
            {
                type: 'action',
                title: '1. STOP immediately',
                content: '1. STOP immediately',
                instructions: [
                    'Advise the driver to stop the vehicle safely at the earliest opportunity.'
                ],
                nextStep: 2
            },
            {
                type: 'action',
                title: '2. Seek assistance from Engineering',
                content: '2. Seek assistance from Engineering',
                instructions: [
                    'Contact Engineering immediately to assess the situation and provide assistance.'
                ],
                nextStep: 3
            },
            {
                type: 'action',
                title: '3. Do not allow the vehicle to continue in service',
                content: '3. Do not allow the vehicle to continue in service',
                instructions: [
                    'Under no circumstances should the vehicle continue in service with loose wheel nuts.'
                ],
                nextStep: 4
            },
            {
                type: 'action',
                title: '4. Report to appropriate management',
                content: '4. Report to appropriate management.',
                instructions: [
                    'Incidents of loose wheel nuts should be reported to the depot engineering manager, general manager and engineering delivery director.'
                ],
                nextStep: 5
            },
            {
                type: 'final',
                title: 'Loose Wheel Nuts - Critical Safety Issue',
                content: 'All steps completed for loose wheel nuts incident.',
                result: 'Vehicle must remain stopped. Multiple levels of management have been notified.',
                severity: 'stop',
                stopReason: 'Loose wheel nuts present immediate danger of wheel detachment.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Depot Engineering Manager',
                    'General Manager',
                    'Engineering Delivery Director'
                ]
            }
        ]
    }
};

// Replace the existing loose-wheel-nuts flow
if (window.diagnosticFlows) {
    window.diagnosticFlows['loose-wheel-nuts'] = looseWheelNutsWizard['loose-wheel-nuts'];
    console.log('✅ Updated Loose Wheel Nuts wizard with proper multi-step flow');
} else {
    window.diagnosticFlows = looseWheelNutsWizard;
}

console.log('🔩 SDC Compliant Multi-Step Wizard for Loose Wheel Nuts loaded');