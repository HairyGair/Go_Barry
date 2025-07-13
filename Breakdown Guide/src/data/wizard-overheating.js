/**
 * SDC Guide Compliant Multi-Step Wizards
 * Starting with OVERHEATING - Exact SDC Guide Steps
 */

const sdcCompliantWizards = {
    'overheating': {
        title: 'Overheating',
        description: 'Engine temperature issues and cooling system problems',
        priority: 2,
        severity: 'warning',
        icon: '🌡️',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Overheating',
                content: 'If a driver reports an overheating issue, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'question',
                title: 'Step 1: Check the Temperature Gauge',
                content: 'What is the current engine temperature reading?',
                options: [
                    {
                        text: '80–100°C',
                        nextStep: 2,
                        severity: 'warning',
                        icon: '🟡'
                    },
                    {
                        text: 'Over 100°C',
                        nextStep: 3,
                        severity: 'critical',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'final',
                title: '80–100°C',
                content: '80–100°C: Advise the driver they can continue to a convenient changeover point.',
                result: 'Advise the driver they can continue to a convenient changeover point.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 2: Identify the Cause',
                content: 'Identify the cause:',
                options: [
                    {
                        text: 'Low Water',
                        nextStep: 4,
                        severity: 'warning',
                        icon: '💧'
                    },
                    {
                        text: 'Overheating',
                        nextStep: 5,
                        severity: 'critical',
                        icon: '🌡️'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Low Water',
                content: 'Low Water: Determine if the driver can safely reach the next location to top up the water.',
                result: 'Determine if the driver can safely reach the next location to top up the water.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 3: Determine if the Water Buzzer is Sounding',
                content: 'Determine if the Water Buzzer is Sounding:',
                options: [
                    {
                        text: 'No Buzzer',
                        nextStep: 6,
                        severity: 'warning',
                        icon: '🔇'
                    },
                    {
                        text: 'Buzzer Sounding',
                        nextStep: 7,
                        severity: 'critical',
                        icon: '🔔'
                    }
                ]
            },
            {
                type: 'final',
                title: 'No Buzzer',
                content: 'No Buzzer: Advise the driver to continue to the next changeover point.',
                result: 'Advise the driver to continue to the next changeover point.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 4: Inspect for Water Leaks',
                content: 'Ask the driver to check for visible signs of water leaks: NEVER ask a driver to step into the highway, ensure they stay safe at all times.',
                options: [
                    {
                        text: 'Leaks Present',
                        nextStep: 8,
                        severity: 'critical',
                        icon: '💧'
                    },
                    {
                        text: 'No Leaks',
                        nextStep: 9,
                        severity: 'warning',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Leaks Present',
                content: 'Leaks Present: Advise the driver to stop immediately and await engineering assistance.',
                result: 'Advise the driver to stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Water leak with buzzer indicates immediate cooling system failure.'
            },
            {
                type: 'question',
                title: 'Step 5: Mitigate the Issue Using Heaters and Demisters',
                content: 'Instruct the driver to turn on the heaters and demisters to disperse heat in the system.',
                options: [
                    {
                        text: 'If this resolves the issue',
                        nextStep: 10,
                        severity: 'continue',
                        icon: '✅'
                    },
                    {
                        text: 'If the problem persists',
                        nextStep: 11,
                        severity: 'critical',
                        icon: '❌'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Issue Resolved',
                content: 'If this resolves the issue: Advise the driver to continue to the next convenient changeover point.',
                result: 'Advise the driver to continue to the next convenient changeover point.',
                severity: 'warning',
                actions: [
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity, record the defect immediately on Go-Check.',
                    'Never advise drivers to remove the radiator cap.',
                    'If the driver is uncertain about the safety of continuing, instruct them to stop and await further guidance from engineering.',
                    'Escalate any complex or unresolved situations to the relevant engineering team for further assessment.'
                ]
            },
            {
                type: 'final',
                title: 'Problem Persists',
                content: 'If the problem persists: Instruct the driver to stop and await engineering assistance.',
                result: 'Instruct the driver to stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Heat dispersion failed to resolve overheating issue.',
                actions: [
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity, record the defect immediately on Go-Check.',
                    'Never advise drivers to remove the radiator cap.',
                    'If the driver is uncertain about the safety of continuing, instruct them to stop and await further guidance from engineering.',
                    'Escalate any complex or unresolved situations to the relevant engineering team for further assessment.'
                ]
            }
        ]
    }
};

// Replace the existing overheating flow
if (window.diagnosticFlows) {
    window.diagnosticFlows.overheating = sdcCompliantWizards.overheating;
    console.log('✅ Updated Overheating wizard with proper multi-step flow');
} else {
    window.diagnosticFlows = sdcCompliantWizards;
}

console.log('🧙‍♂️ SDC Compliant Multi-Step Wizard for Overheating loaded');