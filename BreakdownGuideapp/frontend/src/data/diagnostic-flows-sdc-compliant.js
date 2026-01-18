/**
 * Industry Best-Practice Compliant Diagnostic Flows - Go North East Breakdown Guide
 * Operational best practice guidelines - Version 1.3
 * Following recognised safety standards
 */

const diagnosticFlows = {
    // CRITICAL ISSUES (Priority 1) - Operational best practice guidelines
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
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.',
                    'Report to the depot management team if you feel a particular individual is persistently reporting steering problems that, when investigated by engineering, reveal no fault. This ensures any unnecessary service disruption can be appropriately addressed.'
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
                stopReason: 'Steering faults can cause immediate loss of vehicle control.',
                actions: [
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity.',
                    'Report to the depot management team if you feel a particular individual is persistently reporting steering problems that, when investigated by engineering, reveal no fault. This ensures any unnecessary service disruption can be appropriately addressed.'
                ]
            }
        ]
    },

    'oil-warning': {
        title: 'Oil Warning Light',
        description: 'Engine oil pressure warning - immediate action required',
        priority: 1,
        severity: 'critical',
        icon: '🛢️',
        color: '#dc2626',
        steps: [
            {
                type: 'action',
                title: 'Oil Warning Light On',
                content: 'If a driver reports an oil warning light issue, follow these steps to assess and respond appropriately:',
                instructions: [
                    'Instruct the Driver to Stop Immediately',
                    'Ensure the vehicle is stopped in a safe location.'
                ],
                nextStep: 1
            },
            {
                type: 'question',
                title: 'Check for Oil Leaks',
                content: 'Ask the driver to inspect for visible oil leaks:',
                options: [
                    {
                        text: 'If a Leak is Visible',
                        nextStep: 2,
                        severity: 'critical'
                    },
                    {
                        text: 'If No Leak is Visible',
                        nextStep: 3,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Oil Leak Detected',
                content: 'If a Leak is Visible:',
                result: 'The vehicle must remain STOPPED with the engine switched off. Await assistance from engineering.',
                severity: 'stop',
                stopReason: 'Oil leak presents fire risk and environmental hazard. May result in PG9 prohibition.'
            },
            {
                type: 'question',
                title: 'Light Status While Moving',
                content: 'If No Leak is Visible continue to Step 3.',
                options: [
                    {
                        text: 'Oil Warning Light On or Intermittent',
                        nextStep: 4,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Oil Warning Light Failure',
                content: 'Oil Warning Light On or Intermittent:',
                result: 'Instruct the driver to STOP immediately and seek assistance from engineering.',
                severity: 'stop',
                stopReason: 'Internal engine failure likely. Running engine would cause catastrophic damage.',
                actions: [
                    'Safety First: Ensure the driver stops immediately if there is any doubt about the severity of the issue. Record the defect immediately on the defect reporting system.',
                    'Fire or Hazard Risk: If the oil leak or spillage poses a potential fire risk or hazard to other road users, escalate the issue immediately as a PG9 (Prohibition Notice) may be issued.',
                    'Service Continuity: Coordinate with engineering to arrange for a replacement vehicle promptly to minimise service disruption.'
                ]
            }
        ]
    },

    'loose-wheel-nuts': {
        title: 'Loose Wheel Nuts',
        description: 'Wheel security issue - zero tolerance',
        priority: 1,
        severity: 'critical',
        icon: '🔩',
        color: '#dc2626',
        steps: [
            {
                type: 'final',
                title: 'Loose Wheel Nuts',
                content: 'If a driver reports loose wheel nuts, follow these steps:',
                result: 'STOP immediately. Advise the driver to stop the vehicle safely at the earliest opportunity.',
                severity: 'stop',
                stopReason: 'Under no circumstances should the vehicle continue in service with loose wheel nuts.',
                actions: [
                    'Seek assistance from Engineering. Contact Engineering immediately to assess the situation and provide assistance.',
                    'Do not allow the vehicle to continue in service. Under no circumstances should the vehicle continue in service with loose wheel nuts.',
                    'Report to appropriate management. Incidents of loose wheel nuts should be reported to the depot engineering manager, general manager and engineering delivery director.'
                ],
                additionalGuidance: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

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
                title: 'ABS Light Color',
                content: 'What color is the ABS warning light?',
                options: [
                    {
                        text: 'AMBER ABS',
                        nextStep: 2,
                        severity: 'warning',
                        icon: '🟡'
                    },
                    {
                        text: 'RED ABS',
                        nextStep: 6,
                        severity: 'critical',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'action',
                title: 'AMBER ABS - Step 1: Stop',
                content: 'The driver should stop and shut down the vehicle, performing a full reset.',
                nextStep: 3
            },
            {
                type: 'question',
                title: 'AMBER ABS - Reset Result',
                content: 'After reset, check the result once the vehicle achieves 10mph:',
                options: [
                    {
                        text: 'Amber ABS light is no longer illuminated',
                        nextStep: 4,
                        severity: 'continue'
                    },
                    {
                        text: 'Amber ABS light remains illuminated',
                        nextStep: 5,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'AMBER ABS - Light Cleared',
                content: 'Amber ABS light is no longer illuminated (once the vehicle achieves 10mph)',
                result: 'The vehicle may remain in service, but the defect should be logged on their handheld device. If the light reappears seek further advice.',
                severity: 'continue'
            },
            {
                type: 'final',
                title: 'AMBER ABS - Light Remains',
                content: 'Amber ABS light remains illuminated (once the vehicle achieves 10mph)',
                result: 'The vehicle may remain in service, but changeover at the earliest convenience.',
                severity: 'warning'
            },
            {
                type: 'action',
                title: 'RED ABS - Step 1: Stop',
                content: 'The driver should stop and shut down the vehicle, performing a full reset.',
                nextStep: 7
            },
            {
                type: 'question',
                title: 'RED ABS - Reset Result',
                content: 'After reset, check the result once the vehicle achieves 10mph:',
                options: [
                    {
                        text: 'Red ABS light is no longer illuminated',
                        nextStep: 8,
                        severity: 'warning'
                    },
                    {
                        text: 'Red ABS light remains illuminated',
                        nextStep: 9,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'RED ABS - Light Cleared',
                content: 'Red ABS light is no longer illuminated (once the vehicle achieves 10mph)',
                result: 'The vehicle may remain in service, but changeover at the earliest convenience.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'RED ABS - Light Remains',
                content: 'Red ABS light remains illuminated (once the vehicle achieves 10mph)',
                result: 'The driver should stop and wait for engineering assistance.',
                severity: 'stop',
                stopReason: 'Persistent red ABS light indicates critical brake system failure.',
                actions: [
                    'Record any defects immediately on the the defect reporting system System.',
                    'Safety is the priority. Any light regarding an ABS fault must be checked over by an engineer.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            }
        ]
    },

    // HIGH PRIORITY ISSUES (Priority 2) - Operational best practice guidelines
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
                        severity: 'warning'
                    },
                    {
                        text: 'Over 100°C',
                        nextStep: 3,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: '80–100°C Temperature',
                content: '80–100°C: Advise the driver they can continue to a convenient changeover point.',
                result: 'Continue to convenient changeover point.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 2: Identify the Cause',
                content: 'Over 100°C: Proceed to Step 2. Identify the cause:',
                options: [
                    {
                        text: 'Low Water',
                        nextStep: 4,
                        severity: 'warning'
                    },
                    {
                        text: 'Overheating',
                        nextStep: 5,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Low Water Identified',
                content: 'Low Water: Determine if the driver can safely reach the next location to top up the water.',
                result: 'Vehicle may continue if driver can safely reach next location for water top-up.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 3: Determine if the Water Buzzer is Sounding',
                content: 'Overheating: Proceed to Step 3. Is the water buzzer sounding?',
                options: [
                    {
                        text: 'No Buzzer',
                        nextStep: 6,
                        severity: 'warning'
                    },
                    {
                        text: 'Buzzer Sounding',
                        nextStep: 7,
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'No Buzzer Sounding',
                content: 'No Buzzer: Advise the driver to continue to the next changeover point.',
                result: 'Continue to next changeover point.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Step 4: Inspect for Water Leaks',
                content: 'Buzzer Sounding: Proceed to Step 4. Ask the driver to check for visible signs of water leaks. NEVER ask a driver to step into the highway, ensure they stay safe at all times.',
                options: [
                    {
                        text: 'Leaks Present',
                        nextStep: 8,
                        severity: 'critical'
                    },
                    {
                        text: 'No Leaks',
                        nextStep: 9,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Water Leaks Present',
                content: 'Leaks Present: Advise the driver to stop immediately and await engineering assistance.',
                result: 'Stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Water leak with buzzer indicates immediate cooling system failure.'
            },
            {
                type: 'action',
                title: 'Step 5: Mitigate the Issue Using Heaters and Demisters',
                content: 'No Leaks: Proceed to Step 5. Instruct the driver to turn on the heaters and demisters to disperse heat in the system.',
                instructions: [
                    'If this resolves the issue: Advise the driver to continue to the next convenient changeover point.',
                    'If the problem persists: Instruct the driver to stop and await engineering assistance.'
                ],
                nextStep: 10
            },
            {
                type: 'final',
                title: 'Heat Dispersion Result',
                content: 'Additional Guidance:',
                result: 'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity, record the defect immediately on the defect reporting system.',
                severity: 'warning',
                actions: [
                    'Never advise drivers to remove the radiator cap.',
                    'If the driver is uncertain about the safety of continuing, instruct them to stop and await further guidance from engineering.',
                    'Escalate any complex or unresolved situations to the relevant engineering team for further assessment.'
                ]
            }
        ]
    }
};

// Make diagnosticFlows globally available
window.diagnosticFlows = diagnosticFlows;

console.log('Industry Best-Practice Compliant Diagnostic Flows loaded with', Object.keys(diagnosticFlows).length, 'issues');