/**
 * SDC Guide Compliant Multi-Step Wizard - BRAKES
 * Exact SDC Guide Steps from Page 7
 */

const brakesWizard = {
    'brakes': {
        title: 'Brakes',
        description: 'Brake system problems requiring immediate attention',
        priority: 1,
        severity: 'critical',
        icon: '🛑',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Brakes',
                content: 'If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance:',
                warning: '🚨 SAFETY CRITICAL: Brake issues require immediate attention'
            },
            {
                type: 'question',
                title: 'Brake System Assessment',
                content: 'Is the driver experiencing any of these brake symptoms?',
                checklist: [
                    'Brake pedal sinks to the floor with little or no resistance.',
                    'Braking response is delayed or ineffective.',
                    'Unusual noises (e.g., grinding or squealing) during braking.',
                    'Visible leaks in the brake system (e.g., brake fluid).',
                    'Brakes are grabbing or shuddering.',
                    'Red ABS/EBS light is illuminated.'
                ],
                options: [
                    {
                        text: 'Yes - One or more symptoms present',
                        nextStep: 2,
                        severity: 'critical',
                        icon: '🚨'
                    },
                    {
                        text: 'No - None of these symptoms present',
                        nextStep: 3,
                        severity: 'continue',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Brake System Failure',
                content: 'If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance.',
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Brake system failure presents extreme danger to passengers, driver, and public.',
                actions: [
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.',
                    'Report to the depot management team if you feel a particular individual is persistently reporting steering problems that, when investigated by engineering, reveal no fault. This ensures any unnecessary service disruption can be appropriately addressed.'
                ]
            },
            {
                type: 'final',
                title: 'No Brake Issues Detected',
                content: 'No brake symptoms detected.',
                result: 'Vehicle may continue normal operations with standard monitoring.',
                severity: 'continue',
                actions: [
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.',
                    'Report to the depot management team if you feel a particular individual is persistently reporting steering problems that, when investigated by engineering, reveal no fault. This ensures any unnecessary service disruption can be appropriately addressed.'
                ]
            }
        ]
    }
};

// Replace the existing brakes flow
if (window.diagnosticFlows) {
    window.diagnosticFlows.brakes = brakesWizard.brakes;
    console.log('✅ Updated Brakes wizard with proper multi-step flow');
} else {
    window.diagnosticFlows = brakesWizard;
}

console.log('🛑 SDC Compliant Multi-Step Wizard for Brakes loaded');