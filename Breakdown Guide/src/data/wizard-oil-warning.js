/**
 * SDC Guide Compliant Multi-Step Wizard - OIL WARNING LIGHT
 * Exact SDC Guide Steps from Page 22
 */

const oilWarningWizard = {
    'oil-warning': {
        title: 'Oil Warning Light On',
        description: 'Engine oil pressure warning - immediate action required',
        priority: 1,
        severity: 'critical',
        icon: '🛢️',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Oil Warning Light On',
                content: 'If a driver reports an oil warning light issue, follow these steps to assess and respond appropriately:',
                warning: '🚨 SAFETY CRITICAL: Oil warning light requires immediate stop'
            },
            {
                type: 'action',
                title: 'Step 1: Instruct the Driver to Stop Immediately',
                content: 'Step 1: Instruct the Driver to Stop Immediately',
                instructions: [
                    'Ensure the vehicle is stopped in a safe location.'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Step 2: Check for Oil Leaks',
                content: 'Ask the driver to inspect for visible oil leaks:',
                options: [
                    {
                        text: 'If a Leak is Visible',
                        nextStep: 3,
                        severity: 'critical',
                        icon: '🛢️'
                    },
                    {
                        text: 'If No Leak is Visible',
                        nextStep: 4,
                        severity: 'critical',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: 'If a Leak is Visible',
                content: 'If a Leak is Visible:',
                result: 'The vehicle must remain STOPPED with the engine switched off. Await assistance from engineering.',
                severity: 'stop',
                stopReason: 'Oil leak poses potential fire risk and hazard to other road users. PG9 (Prohibition Notice) may be issued.',
                actions: [
                    'Safety First: Ensure the driver stops immediately if there is any doubt about the severity of the issue. Record the defect immediately on Go-Check.',
                    'Fire or Hazard Risk: If the oil leak or spillage poses a potential fire risk or hazard to other road users, escalate the issue immediately as a PG9 (Prohibition Notice) may be issued.',
                    'Service Continuity: Coordinate with engineering to arrange for a replacement vehicle promptly to minimise service disruption.'
                ]
            },
            {
                type: 'question',
                title: 'Step 3: Light Status While Moving',
                content: 'If No Leak is Visible continue to Step 3. Light Status While Moving:',
                options: [
                    {
                        text: 'Oil Warning Light On or Intermittent',
                        nextStep: 5,
                        severity: 'critical',
                        icon: '🚨'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Oil Warning Light On or Intermittent',
                content: 'Oil Warning Light On or Intermittent:',
                result: 'Instruct the driver to STOP immediately and seek assistance from engineering.',
                severity: 'stop',
                stopReason: 'Internal engine failure likely. Running engine would cause catastrophic damage.',
                actions: [
                    'Safety First: Ensure the driver stops immediately if there is any doubt about the severity of the issue. Record the defect immediately on Go-Check.',
                    'Fire or Hazard Risk: If the oil leak or spillage poses a potential fire risk or hazard to other road users, escalate the issue immediately as a PG9 (Prohibition Notice) may be issued.',
                    'Service Continuity: Coordinate with engineering to arrange for a replacement vehicle promptly to minimise service disruption.'
                ]
            }
        ]
    }
};

// Replace the existing oil-warning flow
if (window.diagnosticFlows) {
    window.diagnosticFlows['oil-warning'] = oilWarningWizard['oil-warning'];
    console.log('✅ Updated Oil Warning Light wizard with proper multi-step flow');
} else {
    window.diagnosticFlows = oilWarningWizard;
}

console.log('🛢️ SDC Compliant Multi-Step Wizard for Oil Warning Light loaded');