/**
 * Complete SDC Guide Compliant Diagnostic Flows
 * Merged from all parts - Version 1.3
 * EXACT text from SDC Guide - NO modifications allowed
 */

const diagnosticFlows = {
    // CRITICAL ISSUES (Priority 1) - Exact SDC Guide Text
    'brakes': {
        title: 'Brakes',
        description: 'Brake system problems requiring immediate attention',
        priority: 1,
        severity: 'critical',
        icon: '🛑',
        color: '#dc2626',
        steps: [
            {
                type: 'final',
                title: 'Brakes',
                content: 'If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance:',
                checklist: [
                    'Brake pedal sinks to the floor with little or no resistance.',
                    'Braking response is delayed or ineffective.',
                    'Unusual noises (e.g., grinding or squealing) during braking.',
                    'Visible leaks in the brake system (e.g., brake fluid).',
                    'Brakes are grabbing or shuddering.',
                    'Red ABS/EBS light is illuminated.'
                ],
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Brake system failure presents extreme danger to passengers, driver, and public.',
                actions: [
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.'
                ]
            }
        ]
    },

    'steering': {
        title: 'Steering',
        description: 'Steering system issues and loss of control',
        priority: 1,
        severity: 'critical',
        icon: '🎯',
        color: '#dc2626',
        steps: [
            {
                type: 'final',
                title: 'Steering',
                content: 'If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance:',
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
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                actions: [
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.'
                ]
            }
        ]
    },

    'oil-warning': {
        title: 'Oil Warning Light On',
        description: 'Engine oil pressure warning requiring immediate attention',
        priority: 1,
        severity: 'critical',
        icon: '🛢️',
        color: '#dc2626',
        steps: [
            {
                type: 'final',
                title: 'Oil Warning Light On',
                content: 'If a driver reports an oil warning light issue, follow these steps:',
                checklist: [
                    'Step 1: Instruct the Driver to Stop Immediately - Ensure the vehicle is stopped in a safe location.',
                    'Step 2: Check for Oil Leaks - Ask the driver to inspect for visible oil leaks.',
                    'If a Leak is Visible: The vehicle must remain STOPPED with the engine switched off. Await assistance from engineering.',
                    'If No Leak is Visible: Oil Warning Light On or Intermittent - Instruct the driver to STOP immediately and seek assistance from engineering.'
                ],
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                actions: [
                    'Safety First: Ensure the driver stops immediately if there is any doubt about the severity of the issue.',
                    'Fire or Hazard Risk: If the oil leak or spillage poses a potential fire risk or hazard to other road users, escalate immediately as a PG9 (Prohibition Notice) may be issued.',
                    'Record the defect immediately on Go-Check.'
                ]
            }
        ]
    },

    'loose-wheel-nuts': {
        title: 'Loose Wheel Nuts',
        description: 'Critical wheel assembly safety issue',
        priority: 1,
        severity: 'critical',
        icon: '🔩',
        color: '#dc2626',
        steps: [
            {
                type: 'final',
                title: 'Loose Wheel Nuts',
                content: 'If a driver reports loose wheel nuts, follow these steps:',
                checklist: [
                    '1. STOP immediately - Advise the driver to stop the vehicle safely at the earliest opportunity.',
                    '2. Seek assistance from Engineering - Contact Engineering immediately to assess the situation and provide assistance.',
                    '3. Do not allow the vehicle to continue in service - Under no circumstances should the vehicle continue in service with loose wheel nuts.',
                    '4. Report to appropriate management - Incidents of loose wheel nuts should be reported to the depot engineering manager, general manager and engineering delivery director.'
                ],
                result: 'Vehicle must stop immediately. Do not continue under any circumstances.',
                severity: 'stop',
                actions: [
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    // HIGH PRIORITY ISSUES (Priority 2)
    'abs-light': {
        title: 'ABS Light On',
        description: 'Anti-lock braking system warning lights',
        priority: 2,
        severity: 'high',
        icon: '🚨',
        color: '#f59e0b',
        steps: [
            {
                type: 'decision',
                title: 'ABS Light Assessment',
                content: 'If the ABS light comes on, follow these steps to assess the situation:',
                question: 'What color is the ABS light?',
                choices: [
                    {
                        text: 'Amber ABS Light',
                        action: 'amber-abs'
                    },
                    {
                        text: 'Red ABS Light',
                        action: 'red-abs'
                    }
                ]
            },
            {
                type: 'procedure',
                id: 'amber-abs',
                title: 'AMBER ABS Light Procedure',
                content: 'Follow these steps for amber ABS warning:',
                steps: [
                    'Step 1: Stop - The driver should stop and shut down the vehicle, performing a full reset.',
                    'Step 2a: If amber ABS light is no longer illuminated (once the vehicle achieves 10mph) - The vehicle may remain in service, but the defect should be logged on GoCheck. If the light reappears seek further advice.',
                    'Step 2b: If amber ABS light remains illuminated (once the vehicle achieves 10mph) - The vehicle may remain in service, but changeover at the earliest convenience.'
                ],
                actions: [
                    'Record any defects immediately on the Go-Check System.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.'
                ]
            },
            {
                type: 'procedure',
                id: 'red-abs',
                title: 'RED ABS Light Procedure',
                content: 'Follow these steps for red ABS warning:',
                steps: [
                    'Step 1: Stop - The driver should stop and shut down the vehicle, performing a full reset.',
                    'Step 2a: If red ABS light is no longer illuminated (once the vehicle achieves 10mph) - The vehicle may remain in service, but changeover at the earliest convenience.',
                    'Step 2b: If red ABS light remains illuminated (once the vehicle achieves 10mph) - The driver should stop and wait for engineering assistance.'
                ],
                result: 'If red light persists after reset and 10mph check, stop and await engineering.',
                severity: 'stop-conditional',
                actions: [
                    'Record any defects immediately on the Go-Check System.',
                    'Safety is the priority. Any light regarding an ABS fault must be checked over by an engineer.'
                ]
            }
        ]
    },

    'non-starter': {
        title: 'Non Starter',
        description: 'Vehicle will not start - troubleshooting steps',
        priority: 2,
        severity: 'medium',
        icon: '🔑',
        color: '#f59e0b',
        steps: [
            {
                type: 'procedure',
                title: 'Initial Troubleshooting',
                content: 'If a driver reports a non-starting vehicle, follow these steps:',
                steps: [
                    'Ensure the vehicle is out of gear and in neutral.',
                    'Are any lights illuminated or flashing on the gear selector.',
                    'Turn off all instruments, including the main switch, to reset the bus.',
                    'Confirm the engine bay door is closed and secure.',
                    'Turn the vehicle back on and attempt to start the engine.'
                ],
                nextStep: 'rear-start-check'
            },
            {
                type: 'decision',
                id: 'rear-start-check',
                title: 'Rear Start Assessment',
                content: 'If the vehicle fails to start after initial troubleshooting:',
                question: 'Is it safe to attempt a rear start?',
                choices: [
                    {
                        text: 'Yes - Safe to attempt rear start',
                        action: 'rear-start-procedure'
                    },
                    {
                        text: 'No - Not safe or still not starting',
                        action: 'diagnostic-questions'
                    }
                ]
            },
            {
                type: 'procedure',
                id: 'rear-start-procedure',
                title: 'Rear Start Procedure',
                content: 'Safety precautions for rear start:',
                steps: [
                    'Confirm it is safe to attempt a rear start.',
                    'Advise the driver to exercise caution when attempting a rear start.',
                    'Ensure that items such as ties and lanyards are either removed or securely placed over the shoulder to prevent entanglement in the belt.',
                    'If the engine starts, instruct the driver to leave it running until an engineer attends. Arrange a changeover if necessary.'
                ],
                nextStep: 'diagnostic-questions'
            },
            {
                type: 'info',
                id: 'diagnostic-questions',
                title: 'Diagnostic Information',
                content: 'Ask the driver the following questions to assist engineers:',
                questions: [
                    'Is the oil light illuminated?',
                    'Was there smoke coming from the exhaust?',
                    'Is the engine trying to start, or is it completely unresponsive?'
                ],
                actions: [
                    'Ensure vehicles permitted to continue have a planned changeover organised promptly.',
                    'Escalate persistent, unwarranted non-starter reports to the depot management team.'
                ]
            }
        ]
    },

    'overheating': {
        title: 'Overheating',
        description: 'Engine temperature issues and cooling system problems',
        priority: 2,
        severity: 'high',
        icon: '🌡️',
        color: '#f59e0b',
        steps: [
            {
                type: 'decision',
                title: 'Temperature Gauge Check',
                content: 'If a driver reports an overheating issue, first check the temperature gauge:',
                question: 'What is the temperature reading?',
                choices: [
                    {
                        text: '80–100°C',
                        action: 'continue-normal',
                        result: 'Advise the driver they can continue to a convenient changeover point.'
                    },
                    {
                        text: 'Over 100°C',
                        action: 'check-cause'
                    }
                ]
            },
            {
                type: 'decision',
                id: 'check-cause',
                title: 'Identify the Cause',
                content: 'Determine the cause of overheating:',
                question: 'What appears to be causing the overheating?',
                choices: [
                    {
                        text: 'Low Water',
                        action: 'low-water-check'
                    },
                    {
                        text: 'General Overheating',
                        action: 'buzzer-check'
                    }
                ]
            },
            {
                type: 'decision',
                id: 'buzzer-check',
                title: 'Water Buzzer Check',
                content: 'Check if the water buzzer is sounding:',
                question: 'Is the water buzzer sounding?',
                choices: [
                    {
                        text: 'No Buzzer',
                        action: 'continue-changeover',
                        result: 'Advise the driver to continue to the next changeover point.'
                    },
                    {
                        text: 'Buzzer Sounding',
                        action: 'check-leaks'
                    }
                ]
            },
            {
                type: 'decision',
                id: 'check-leaks',
                title: 'Inspect for Water Leaks',
                content: 'Ask the driver to check for visible signs of water leaks. NEVER ask a driver to step into the highway, ensure they stay safe at all times.',
                question: 'Are there visible water leaks?',
                choices: [
                    {
                        text: 'Leaks Present',
                        action: 'stop-engineering',
                        result: 'Advise the driver to stop immediately and await engineering assistance.',
                        severity: 'stop'
                    },
                    {
                        text: 'No Leaks',
                        action: 'heat-dispersion'
                    }
                ]
            },
            {
                type: 'procedure',
                id: 'heat-dispersion',
                title: 'Mitigate Using Heaters and Demisters',
                content: 'Instruct the driver to turn on the heaters and demisters to disperse heat in the system.',
                result: 'If this resolves the issue: Continue to next convenient changeover point. If problem persists: Stop and await engineering assistance.',
                actions: [
                    'Never advise drivers to remove the radiator cap.',
                    'If driver is uncertain about safety of continuing, instruct them to stop.',
                    'Record defect immediately on Go-Check.'
                ]
            }
        ]
    },

    'doors': {
        title: 'Doors Not Working',
        description: 'Door system malfunctions and passenger safety issues',
        priority: 2,
        severity: 'medium',
        icon: '🚪',
        color: '#f59e0b',
        steps: [
            {
                type: 'procedure',
                title: 'Initial Checks',
                content: 'If a driver reports an issue with the doors, start with these checks:',
                steps: [
                    'Door Control Buttons: Ask the driver to check if any of the door control buttons are stuck (both inside and outside the bus).',
                    'Obstructions: Confirm there are no obstructions behind or under the doors.'
                ],
                nextStep: 'air-system-check'
            },
            {
                type: 'procedure',
                id: 'air-system-check',
                title: 'Air System Check',
                content: 'Check the air system:',
                steps: [
                    'Listen for Air Leaks: Instruct the driver to check for air leaks.',
                    'Check Air Pressure: Ask the driver to monitor the air pressure and try to build it up to see if this resolves the issue.'
                ],
                nextStep: 'critical-assessment'
            },
            {
                type: 'assessment',
                id: 'critical-assessment',
                title: 'Critical Door Assessment',
                content: 'STOP and Seek Engineering Assistance if ANY of the Following Defects Are Present:',
                criticalDefects: [
                    'Doors are jammed closed.',
                    'Doors cannot be retained in the closed position.',
                    'Door hinges, catches, or pillars are loose, insecure, weakened, or make the doors difficult to shut or likely to open inadvertently.',
                    'Doors are stiff and cannot fully open or close.'
                ],
                nonCriticalAction: 'If None of the Above Defects Are Present: Advise the driver to continue in service and proceed to the next convenient location for a bus changeover.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'battery-light': {
        title: 'Battery Light On',
        description: 'Electrical charging system warning',
        priority: 2,
        severity: 'medium',
        icon: '🔋',
        color: '#f59e0b',
        steps: [
            {
                type: 'procedure',
                title: 'Initial Safety Check',
                content: 'If the battery light is on, follow these safety steps:',
                warning: 'ALWAYS advise the driver to steer clear of moving belts and turn the engine off before inspection.',
                nextStep: 'belt-check'
            },
            {
                type: 'decision',
                id: 'belt-check',
                title: 'Check Belts',
                content: 'With the engine off, check the belt condition:',
                question: 'Are all belts in place and secure?',
                choices: [
                    {
                        text: 'Belts in place',
                        action: 'master-switch-check'
                    },
                    {
                        text: 'Belt(s) come off',
                        action: 'belt-failure',
                        result: 'Wait for engineering assistance. If no other warning lights (e.g., temperature warning) are on, the vehicle may be moved a short distance if needed for safety.'
                    }
                ]
            },
            {
                type: 'decision',
                id: 'master-switch-check',
                title: 'Check Master Switch',
                content: 'Check the master switch status:',
                question: 'Is the master switch engaged?',
                choices: [
                    {
                        text: 'Master switch not engaged',
                        action: 'engage-switch',
                        result: 'Engage the master switch and continue.'
                    },
                    {
                        text: 'Master switch engaged',
                        action: 'engineering-assistance',
                        result: 'Wait for engineering assistance as there is a possibility that transmission drive may be lost, and other electrical components may fail.'
                    }
                ]
            }
        ]
    }
};

// Ensure global availability
if (typeof window !== 'undefined') {
    window.diagnosticFlows = diagnosticFlows;
}
