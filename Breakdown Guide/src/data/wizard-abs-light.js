/**
 * SDC Guide Compliant Multi-Step Wizard - ABS LIGHT ON
 * Exact SDC Guide Steps from Page 14
 */

const absLightWizard = {
    'abs-light': {
        title: 'ABS Light On',
        description: 'ABS warning light diagnostic procedure',
        priority: 1,
        severity: 'warning',
        icon: '🚨',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'ABS Light On',
                content: 'If the ABS light comes on, follow these steps to assess the situation and determine the appropriate course of action:'
            },
            {
                type: 'question',
                title: 'ABS Light Color Identification',
                content: 'What color is the ABS light that is illuminated?',
                options: [
                    {
                        text: 'AMBER ABS',
                        nextStep: 2,
                        severity: 'warning',
                        icon: '🟡'
                    },
                    {
                        text: 'RED ABS',
                        nextStep: 7,
                        severity: 'critical',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'action',
                title: 'AMBER ABS - Step 1: Stop',
                content: 'AMBER ABS Step 1: Stop',
                instructions: [
                    'The driver should stop and shut down the vehicle, performing a full reset.'
                ],
                nextStep: 3
            },
            {
                type: 'question',
                title: 'AMBER ABS - Reset Result Check',
                content: 'After the reset, once the vehicle achieves 10mph, check the amber ABS light status:',
                options: [
                    {
                        text: 'Step 2a: Amber ABS light is no longer illuminated (once the vehicle achieves 10mph)',
                        nextStep: 4,
                        severity: 'continue',
                        icon: '✅'
                    },
                    {
                        text: 'Step 2b: Amber ABS light remains illuminated (once the vehicle achieves 10mph)',
                        nextStep: 5,
                        severity: 'warning',
                        icon: '🟡'
                    }
                ]
            },
            {
                type: 'final',
                title: 'AMBER ABS - Light Cleared',
                content: 'Step 2a: Amber ABS light is no longer illuminated (once the vehicle achieves 10mph)',
                result: 'The vehicle may remain in service, but the defect should be logged on GoCheck. If the light reappears seek further advice.',
                severity: 'continue',
                actions: [
                    'Record any defects immediately on the Go-Check System.',
                    'Safety is the priority. Any light regarding an ABS fault must be checked over by an engineer.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            },
            {
                type: 'final',
                title: 'AMBER ABS - Light Remains',
                content: 'Step 2b: Amber ABS light remains illuminated (once the vehicle achieves 10mph)',
                result: 'The vehicle may remain in service, but changeover at the earliest convenience.',
                severity: 'warning',
                actions: [
                    'Record any defects immediately on the Go-Check System.',
                    'Safety is the priority. Any light regarding an ABS fault must be checked over by an engineer.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            },
            {
                type: 'info',
                title: 'Additional Guidance',
                content: 'Additional Guidance for AMBER ABS completed.',
                nextStep: 6
            },
            {
                type: 'action',
                title: 'RED ABS - Step 1: Stop',
                content: 'RED ABS Step 1: Stop',
                instructions: [
                    'The driver should stop and shut down the vehicle, performing a full reset.'
                ],
                nextStep: 8
            },
            {
                type: 'question',
                title: 'RED ABS - Reset Result Check',
                content: 'After the reset, once the vehicle achieves 10mph, check the red ABS light status:',
                options: [
                    {
                        text: 'Step 2a: Red ABS light is no longer illuminated (once the vehicle achieves 10mph)',
                        nextStep: 9,
                        severity: 'warning',
                        icon: '⚠️'
                    },
                    {
                        text: 'Step 2b: Red ABS light remains illuminated (once the vehicle achieves 10mph)',
                        nextStep: 10,
                        severity: 'critical',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'final',
                title: 'RED ABS - Light Cleared',
                content: 'Step 2a: Red ABS light is no longer illuminated (once the vehicle achieves 10mph)',
                result: 'The vehicle may remain in service, but changeover at the earliest convenience.',
                severity: 'warning',
                actions: [
                    'Record any defects immediately on the Go-Check System.',
                    'Safety is the priority. Any light regarding an ABS fault must be checked over by an engineer.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            },
            {
                type: 'final',
                title: 'RED ABS - Light Remains',
                content: 'Step 2b: Red ABS light remains illuminated (once the vehicle achieves 10mph)',
                result: 'The driver should stop and wait for engineering assistance.',
                severity: 'stop',
                stopReason: 'Persistent red ABS light indicates critical brake system failure.',
                actions: [
                    'Record any defects immediately on the Go-Check System.',
                    'Safety is the priority. Any light regarding an ABS fault must be checked over by an engineer.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            }
        ]
    }
};

// Replace the existing abs-light flow
if (window.diagnosticFlows) {
    window.diagnosticFlows['abs-light'] = absLightWizard['abs-light'];
    console.log('✅ Updated ABS Light wizard with proper multi-step flow');
} else {
    window.diagnosticFlows = absLightWizard;
}

console.log('🚨 SDC Compliant Multi-Step Wizard for ABS Light loaded');