/**
 * Industry Best-Practice Compliant Diagnostic Flows - PART 2
 * Continuing with operational best practice guidelines for remaining diagnostics
 */

// Add to existing diagnosticFlows object
const additionalFlows = {
    'doors': {
        title: 'Doors Not Working',
        description: 'Door system malfunctions and passenger safety issues',
        priority: 2,
        severity: 'warning',
        icon: '🚪',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Doors Not Working',
                content: 'If a driver reports an issue with the doors, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Initial Checks',
                content: 'Initial Checks:',
                instructions: [
                    'Door Control Buttons: Ask the driver to check if any of the door control buttons are stuck (both inside and outside the bus).',
                    'Obstructions: Confirm there are no obstructions behind or under the doors.'
                ],
                nextStep: 2
            },
            {
                type: 'action',
                title: 'Step 2: Air System Check',
                content: 'Air System Check:',
                instructions: [
                    'Listen for Air Leaks: Instruct the driver to check for air leaks.',
                    'Check Air Pressure: Ask the driver to monitor the air pressure and try to build it up to see if this resolves the issue.'
                ],
                nextStep: 3
            },
            {
                type: 'info',
                title: 'Step 3: Escalation',
                content: 'If the above steps do not resolve the issue, proceed to the assessment below.',
                nextStep: 4
            },
            {
                type: 'question',
                title: 'Door Safety Assessment',
                content: 'STOP and Seek Engineering Assistance if Any of the Following Defects Are Present:',
                checklist: [
                    'Doors are jammed closed.',
                    'Doors cannot be retained in the closed position.',
                    'Door hinges, catches, or pillars are loose, insecure, weakened, or make the doors difficult to shut or likely to open inadvertently.',
                    'Doors are stiff and cannot fully open or close.'
                ],
                options: [
                    {
                        text: 'Yes - One or more critical defects present',
                        nextStep: 5,
                        severity: 'critical'
                    },
                    {
                        text: 'No - None of the above defects are present',
                        nextStep: 6,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Critical Door Defects',
                content: 'STOP and Seek Engineering Assistance',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Critical door defects present immediate passenger safety risks.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Minor Door Issues',
                content: 'If None of the Above Defects Are Present:',
                result: 'Advise the driver to continue in service and proceed to the next convenient location for a bus changeover.',
                severity: 'warning',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'non-starter': {
        title: 'Non Starter',
        description: 'Engine starting problems and troubleshooting',
        priority: 2,
        severity: 'warning',
        icon: '🔑',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Non Starter',
                content: 'If a driver reports a non-starting vehicle, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Initial Troubleshooting',
                content: 'Instruct the driver to complete the following checks:',
                instructions: [
                    'Ensure the vehicle is out of gear and in neutral.',
                    'Are any lights illuminated or flashing on the gear selector.',
                    'Turn off all instruments, including the main switch, to reset the bus.',
                    'Confirm the engine bay door is closed and secure.',
                    'Turn the vehicle back on and attempt to start the engine.'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Initial Troubleshooting Result',
                content: 'After completing the initial checks:',
                options: [
                    {
                        text: 'If the vehicle starts',
                        nextStep: 8,
                        severity: 'continue'
                    },
                    {
                        text: 'If the vehicle fails to start',
                        nextStep: 3,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Step 2: Rear Start Attempt',
                content: 'Rear Start Attempt:',
                instructions: [
                    'Confirm it is safe to attempt a rear start.',
                    'Advise the driver to exercise caution when attempting a rear start. Ensure that items such as ties and lanyards are either removed or securely placed over the shoulder to prevent entanglement in the belt.'
                ],
                nextStep: 4
            },
            {
                type: 'question',
                title: 'Rear Start Result',
                content: 'After attempting rear start:',
                options: [
                    {
                        text: 'If the engine starts',
                        nextStep: 5,
                        severity: 'warning'
                    },
                    {
                        text: 'If the vehicle still fails to start',
                        nextStep: 6,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Rear Start Successful',
                content: 'If the engine starts, instruct the driver to leave it running until an engineer attends. Arrange a changeover if necessary.',
                result: 'Vehicle started with rear start. Keep running and arrange changeover.',
                severity: 'warning'
            },
            {
                type: 'action',
                title: 'Step 3: Gather Diagnostic Information',
                content: 'Ask the driver the following questions to assist engineers in diagnosing the issue:',
                instructions: [
                    'Is the oil light illuminated?',
                    'Was there smoke coming from the exhaust?',
                    'Is the engine trying to start, or is it completely unresponsive?'
                ],
                nextStep: 7
            },
            {
                type: 'final',
                title: 'Engineering Assistance Required',
                content: 'If the vehicle still fails to start, proceed to Step 3.',
                result: 'Contact engineering team with diagnostic information.',
                severity: 'stop',
                stopReason: 'Vehicle unable to start requires engineering diagnosis and repair.',
                actions: [
                    'Ensure vehicles permitted to continue have a planned changeover organised promptly.',
                    'Escalate persistent, unwarranted non-starter reports to the depot management team to address any unnecessary service disruptions effectively.'
                ]
            },
            {
                type: 'final',
                title: 'Vehicle Started Successfully',
                content: 'If the vehicle starts: Advise the driver to continue in service.',
                result: 'Vehicle may continue normal operations.',
                severity: 'continue',
                actions: [
                    'Ensure vehicles permitted to continue have a planned changeover organised promptly.',
                    'Escalate persistent, unwarranted non-starter reports to the depot management team to address any unnecessary service disruptions effectively.'
                ]
            }
        ]
    },

    'gear-selection': {
        title: 'Unable to Select Gears',
        description: 'Unable to select gears and transmission issues',
        priority: 2,
        severity: 'warning',
        icon: '⚙️',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Unable to Select Gears',
                content: 'If a driver reports an issue with gear selection, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Attempt a System Reset',
                content: 'Instruct the driver to switch the bus off and re-set it, then attempt to start up in the usual manner.',
                nextStep: 2
            },
            {
                type: 'action',
                title: 'Step 2: Check Ramp is Correctly Stowed',
                content: 'Ask the driver to visually inspect if the ramp is correctly secured in its stowed position. The driver should lift the ramp and stow it again to ensure it is correctly secured.',
                nextStep: 3
            },
            {
                type: 'action',
                title: 'Step 2: Check Suspension Light (if applicable)',
                content: 'Ask the driver if the suspension light on the dashboard has been re-set before attempting to engage gear.',
                nextStep: 4
            },
            {
                type: 'action',
                title: 'Step 3: Confirm Proper Operation',
                content: 'Ensure the driver is pressing firmly on the footbrake while selecting the appropriate gear.',
                nextStep: 5
            },
            {
                type: 'question',
                title: 'Gear Selection Success',
                content: 'Can gears now be selected normally?',
                options: [
                    {
                        text: 'Yes - Gears can be selected',
                        nextStep: 6,
                        severity: 'continue'
                    },
                    {
                        text: 'No - Still cannot select gears',
                        nextStep: 7,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Gear Selection Restored',
                content: 'Problem resolved.',
                result: 'Vehicle may continue normal operations.',
                severity: 'continue',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Step 4: Escalate if Unresolved',
                content: 'If none of the above steps resolve the problem stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Transmission system failure prevents safe vehicle operation.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'demisters-heaters': {
        title: 'Demisters / Heaters Not Working',
        description: 'Heating and demisting system problems affecting visibility and comfort',
        priority: 2,
        severity: 'warning',
        icon: '🌬️',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Demisters / Heaters Not Working',
                content: 'If the demisters or heaters are not working, assess the situation based on whether the driver\'s vision is affected.'
            },
            {
                type: 'question',
                title: 'Driver Vision Check',
                content: 'Is the driver\'s vision affected?',
                options: [
                    {
                        text: 'Yes - Vision is affected',
                        nextStep: 2,
                        severity: 'critical'
                    },
                    {
                        text: 'No - Vision is not affected',
                        nextStep: 3,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Vision Affected',
                content: 'The driver\'s vision is the priority. If it is affected, the vehicle should not continue in service.',
                result: 'Vehicle must not continue in service.',
                severity: 'stop',
                stopReason: 'Impaired driver vision presents immediate safety risk to all road users.'
            },
            {
                type: 'question',
                title: 'Step 1: Check if the Demisters are Blowing',
                content: 'Are the demisters blowing?',
                options: [
                    {
                        text: 'Not blowing at all',
                        nextStep: 4,
                        severity: 'warning'
                    },
                    {
                        text: 'Blowing cold air only',
                        nextStep: 5,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Demisters Not Blowing',
                content: 'Not blowing at all: Advise the driver to take the bus to the nearest changeover point or continue until a replacement becomes available, only if visibility is not impaired. Ask the driver to check for blockages (e.g., bags, newspapers, etc.) if the demisters are blowing but not effectively.',
                result: 'Continue to changeover point if visibility not impaired.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 2: Check the Saloon Temperature',
                content: 'Blowing cold air only: Proceed to Step 2. What is the saloon temperature?',
                options: [
                    {
                        text: '16 degrees or above',
                        nextStep: 6,
                        severity: 'continue'
                    },
                    {
                        text: 'Below 16 degrees',
                        nextStep: 7,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Acceptable Temperature',
                content: '16 degrees or above: Advise the driver to continue in service until a replacement vehicle becomes available, but a changeover is not urgent.',
                result: 'Continue in service, changeover not urgent.',
                severity: 'continue'
            },
            {
                type: 'final',
                title: 'Cold Temperature',
                content: 'Below 16 degrees: The vehicle should be changed over as soon as possible.',
                result: 'Changeover required as soon as possible.',
                severity: 'warning',
                actions: [
                    'Ensure the vehicle has had adequate time to warm up, typically after at least 1 hour in service.',
                    'In the case of a cold bus, if the vehicle cannot be changed over immediately, check with engineering at least once an hour to ascertain when the vehicle can be changed and inform the driver accordingly.',
                    'If the situation is unreasonable, report it to the relevant Depot Manager for further investigation.'
                ]
            }
        ]
    }
};

// Merge with existing flows
if (typeof diagnosticFlows !== 'undefined') {
    Object.assign(diagnosticFlows, additionalFlows);
} else {
    // Fallback: create global diagnosticFlows if it doesn't exist
    window.diagnosticFlows = additionalFlows;
}

console.log('Industry best-practice diagnostic flows loaded - Exact text compliance maintained');