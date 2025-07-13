/**
 * SDC Guide Compliant Multi-Step Wizard - STEERING
 * Exact SDC Guide Steps from Page 8
 */

const steeringWizard = {
    'steering': {
        title: 'Steering',
        description: 'Steering system issues and loss of control',
        priority: 1,
        severity: 'critical',
        icon: '🎯',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Steering',
                content: 'If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance:',
                warning: '🚨 SAFETY CRITICAL: Steering issues can cause loss of control'
            },
            {
                type: 'question',
                title: 'Steering System Assessment',
                content: 'Is the driver experiencing any of these steering symptoms?',
                checklist: [
                    'Excessive play in the steering wheel. The DVSA expects the steering system to have no more than 75mm of play at the rim of a steering wheel for vehicles with power steering.',
                    'Difficulty steering or maintaining control of the vehicle.',
                    'Unusual noises when steering (e.g., knocking, grinding, or squealing).',
                    'Vehicle pulling to one side during operation.',
                    'Visible damage to the steering system (e.g., steering column, linkage).',
                    'Leaks from the power steering system.',
                    'Steering becomes stiff or unresponsive.',
                    'Any warning light related to steering is illuminated.'
                ],
                options: [
                    {
                        text: 'Yes - One or more steering symptoms present',
                        nextStep: 2,
                        severity: 'critical',
                        icon: '🚨'
                    },
                    {
                        text: 'No - None of these steering symptoms present',
                        nextStep: 3,
                        severity: 'continue',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Steering System Failure',
                content: 'If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance.',
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Steering faults can cause immediate loss of vehicle control.',
                actions: [
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.',
                    'Report to the depot management team if you feel a particular individual is persistently reporting steering problems that, when investigated by engineering, reveal no fault. This ensures any unnecessary service disruption can be appropriately addressed.'
                ]
            },
            {
                type: 'final',
                title: 'No Steering Issues Detected',
                content: 'No steering symptoms detected.',
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

// Replace the existing steering flow
if (window.diagnosticFlows) {
    window.diagnosticFlows.steering = steeringWizard.steering;
    console.log('✅ Updated Steering wizard with proper multi-step flow');
} else {
    window.diagnosticFlows = steeringWizard;
}

console.log('🎯 SDC Compliant Multi-Step Wizard for Steering loaded');