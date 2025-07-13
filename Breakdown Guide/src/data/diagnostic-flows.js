/**
 * Enhanced Diagnostic Flows - Go North East Breakdown Guide
 * Complete diagnostic workflows with prettier UI components
 * Version 4.0 - Enhanced UI Implementation
 */

const diagnosticFlows = {
    // CRITICAL ISSUES (Priority 1)
    'brakes': {
        title: 'Brake Issues',
        description: 'Brake system problems requiring immediate attention',
        priority: 1,
        severity: 'critical',
        icon: '🛑',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Initial Brake Assessment',
                content: 'We need to check if any brake system symptoms are present. Brake issues are always safety critical.',
                warning: '🚨 SAFETY CRITICAL: Brake issues require immediate attention'
            },
            {
                type: 'question',
                title: 'Brake Symptoms Check',
                content: 'Is the driver experiencing any of these symptoms?',
                checklist: [
                    'Brake pedal sinks to the floor with little or no resistance',
                    'Braking response is delayed or ineffective',
                    'Unusual noises (grinding or squealing) during braking',
                    'Visible leaks in the brake system',
                    'Brakes are grabbing or shuddering',
                    'Red ABS/EBS light is illuminated'
                ],
                options: [
                    { 
                        text: 'Yes - One or more symptoms present', 
                        nextStep: 2, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'No - None of these symptoms', 
                        nextStep: 3, 
                        severity: 'continue',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 VEHICLE MUST STOP IMMEDIATELY',
                content: 'Critical brake system failure detected.',
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Brake system failure presents extreme danger to passengers, driver, and public.',
                actions: [
                    'Switch off the vehicle immediately',
                    'Ensure vehicle is in a safe location',
                    'Contact engineering team immediately',
                    'Do not move vehicle under any circumstances'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE RESPONSE REQUIRED',
                    'Depot Engineering Manager',
                    'General Manager (if after hours)',
                    'Arrange immediate vehicle recovery'
                ]
            },
            {
                type: 'final',
                title: '✅ No Brake Issues Detected',
                content: 'No immediate brake problems identified.',
                result: 'Vehicle may continue in service with normal monitoring.',
                severity: 'continue',
                actions: [
                    'Continue normal operations',
                    'Monitor brake performance',
                    'Report any changes immediately'
                ]
            }
        ]
    },

    'steering': {
        title: 'Steering Problems',
        description: 'Steering system issues and loss of control',
        priority: 1,
        severity: 'critical',
        icon: '🎯',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Steering Assessment',
                content: 'Steering problems can result in immediate loss of vehicle control.',
                warning: '🚨 SAFETY CRITICAL: Steering issues can cause loss of control'
            },
            {
                type: 'question',
                title: 'Steering Symptoms',
                content: 'Check if any of these steering symptoms are present:',
                checklist: [
                    'Excessive play in steering wheel (more than 75mm at rim)',
                    'Difficulty steering or maintaining control',
                    'Unusual noises when steering (knocking, grinding, squealing)',
                    'Vehicle pulling to one side during operation',
                    'Visible damage to steering system',
                    'Leaks from power steering system',
                    'Steering becomes stiff or unresponsive',
                    'Any warning light related to steering'
                ],
                options: [
                    { 
                        text: 'Yes - Steering symptoms present', 
                        nextStep: 2, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'No - Steering normal', 
                        nextStep: 3, 
                        severity: 'continue',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 STOP IMMEDIATELY - STEERING FAULT',
                content: 'Steering system failure detected.',
                result: 'Vehicle must stop immediately due to steering system failure.',
                severity: 'stop',
                stopReason: 'Steering faults can cause immediate loss of vehicle control.',
                actions: [
                    'Stop vehicle safely as soon as possible',
                    'Switch off engine',
                    'Contact engineering immediately',
                    'Do not attempt to drive vehicle'
                ],
                contacts: [
                    'Engineering Team - URGENT',
                    'Depot Engineering Manager'
                ]
            },
            {
                type: 'final',
                title: '✅ Steering Normal',
                content: 'No steering issues detected.',
                result: 'Vehicle may continue with normal monitoring.',
                severity: 'continue'
            }
        ]
    },

    'abs-light': {
        title: 'ABS Light Warning',
        description: 'ABS warning light diagnostic procedure',
        priority: 1,
        severity: 'warning',
        icon: '🚨',
        color: '#f59e0b',
        steps: [
            {
                type: 'question',
                title: 'ABS Light Color',
                content: 'What color is the ABS warning light?',
                options: [
                    { 
                        text: 'Red ABS Light', 
                        nextStep: 1, 
                        severity: 'critical',
                        icon: '🔴'
                    },
                    { 
                        text: 'Amber ABS Light', 
                        nextStep: 4, 
                        severity: 'warning',
                        icon: '🟡'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Red ABS Light - Reset Procedure',
                content: 'Follow this reset procedure for red ABS light:',
                instructions: [
                    'Stop the vehicle safely',
                    'Shut down the vehicle completely',
                    'Perform a full system reset',
                    'Restart the vehicle',
                    'Check if light remains on',
                    'Drive at 10mph to allow system check'
                ],
                nextStep: 2,
                timer: 30
            },
            {
                type: 'question',
                title: 'Reset Result Check',
                content: 'After reset and driving at 10mph, is the red ABS light still on?',
                options: [
                    { 
                        text: 'Yes - Light still on', 
                        nextStep: 3, 
                        severity: 'critical',
                        icon: '🔴'
                    },
                    { 
                        text: 'No - Light cleared', 
                        nextStep: 7, 
                        severity: 'continue',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 RED ABS LIGHT PERSISTENT',
                content: 'Red ABS light remains on after reset.',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Persistent red ABS light indicates critical brake system failure.',
                actions: [
                    'Stop vehicle immediately',
                    'Contact engineering team',
                    'Record defect in Go-Check system',
                    'Await engineering assistance'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Depot Engineering Manager'
                ]
            },
            {
                type: 'action',
                title: 'Amber ABS Light - Reset Procedure',
                content: 'Follow this reset procedure for amber ABS light:',
                instructions: [
                    'Stop the vehicle safely',
                    'Shut down the vehicle completely', 
                    'Perform a full system reset',
                    'Restart the vehicle',
                    'Drive at 10mph to allow system check'
                ],
                nextStep: 5,
                timer: 30
            },
            {
                type: 'question',
                title: 'Amber Light Reset Result',
                content: 'After reset and 10mph check, is the amber ABS light still on?',
                options: [
                    { 
                        text: 'Yes - Light still on', 
                        nextStep: 6, 
                        severity: 'warning',
                        icon: '🟡'
                    },
                    { 
                        text: 'No - Light cleared', 
                        nextStep: 7, 
                        severity: 'continue',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ AMBER ABS LIGHT PERSISTENT',
                content: 'Amber ABS light remains on after reset.',
                result: 'Vehicle may continue but changeover required at earliest convenience.',
                severity: 'warning',
                actions: [
                    'Log defect in Go-Check system',
                    'Arrange changeover at earliest convenience',
                    'Monitor system carefully',
                    'If light changes to red, stop immediately'
                ],
                contacts: [
                    'Engineering Team - NON-URGENT',
                    'Arrange changeover'
                ]
            },
            {
                type: 'final',
                title: '✅ ABS LIGHT CLEARED',
                content: 'ABS light has cleared after reset.',
                result: 'Vehicle may continue in service with monitoring.',
                severity: 'continue',
                actions: [
                    'Log reset procedure in Go-Check',
                    'Continue normal operations',
                    'Monitor for reoccurrence',
                    'If light returns, follow procedure again'
                ]
            }
        ]
    },

    'overheating': {
        title: 'Engine Overheating',
        description: 'Engine temperature issues and cooling system problems',
        priority: 2,
        severity: 'warning',
        icon: '🌡️',
        color: '#f59e0b',
        steps: [
            {
                type: 'question',
                title: 'Temperature Reading',
                content: 'What is the current engine temperature reading?',
                options: [
                    { 
                        text: '80-100°C', 
                        nextStep: 1, 
                        severity: 'warning',
                        icon: '🟡'
                    },
                    { 
                        text: 'Over 100°C', 
                        nextStep: 2, 
                        severity: 'critical',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ ELEVATED TEMPERATURE',
                content: 'Temperature 80-100°C detected.',
                result: 'Continue to convenient changeover point.',
                severity: 'warning',
                actions: [
                    'Continue to next convenient changeover point',
                    'Monitor temperature continuously',
                    'Arrange changeover',
                    'If temperature rises above 100°C, stop immediately'
                ]
            },
            {
                type: 'question',
                title: 'Cause Assessment',
                content: 'What appears to be causing the overheating?',
                options: [
                    { 
                        text: 'Low Water Level', 
                        nextStep: 3, 
                        severity: 'warning',
                        icon: '💧'
                    },
                    { 
                        text: 'Other/Unknown Cause', 
                        nextStep: 4, 
                        severity: 'critical',
                        icon: '❓'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Water Buzzer Check',
                content: 'Is the water buzzer sounding?',
                options: [
                    { 
                        text: 'No buzzer sounding', 
                        nextStep: 5, 
                        severity: 'continue',
                        icon: '✅'
                    },
                    { 
                        text: 'Buzzer is sounding', 
                        nextStep: 6, 
                        severity: 'warning',
                        icon: '🔔'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Heat Dispersion Procedure',
                content: 'Use heaters and demisters to disperse heat:',
                instructions: [
                    'Turn on all heaters to maximum',
                    'Turn on all demisters',
                    'Monitor temperature gauge',
                    'Continue if temperature stabilizes',
                    'If problem persists, stop and seek engineering help'
                ],
                nextStep: 8
            },
            {
                type: 'final',
                title: '✅ CONTINUE TO CHANGEOVER',
                content: 'No immediate danger, but changeover needed.',
                result: 'Continue to next convenient changeover point.',
                severity: 'warning',
                actions: [
                    'Continue to changeover point',
                    'Monitor temperature continuously'
                ]
            },
            {
                type: 'question',
                title: 'Water Leak Inspection',
                content: 'Check for visible water leaks (SAFELY - do not step into highway):',
                options: [
                    { 
                        text: 'Leaks present', 
                        nextStep: 7, 
                        severity: 'critical',
                        icon: '💧'
                    },
                    { 
                        text: 'No leaks visible', 
                        nextStep: 4, 
                        severity: 'warning',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 WATER LEAK DETECTED',
                content: 'Water leak identified with buzzer sounding.',
                result: 'Stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Water leak with buzzer indicates immediate cooling system failure.',
                actions: [
                    'Stop vehicle immediately',
                    'Switch off engine',
                    'Contact engineering team',
                    'Do not attempt to continue'
                ],
                contacts: [
                    'Engineering Team - URGENT'
                ]
            },
            {
                type: 'final',
                title: '✅ HEAT DISPERSION SUCCESSFUL',
                content: 'Temperature controlled using heat dispersion.',
                result: 'Continue to changeover point with monitoring.',
                severity: 'continue',
                actions: [
                    'Continue to convenient changeover point',
                    'Keep heaters and demisters on',
                    'Monitor temperature continuously'
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
                type: 'info',
                title: 'Oil Warning - IMMEDIATE ACTION',
                content: 'Oil warning light requires immediate stop to prevent engine damage.',
                warning: '🚨 CRITICAL: Stop immediately when oil warning appears'
            },
            {
                type: 'action',
                title: 'Immediate Stop Procedure',
                content: 'Follow these steps immediately:',
                instructions: [
                    'Stop vehicle in safe location immediately',
                    'Switch off engine',
                    'Check for visible oil leaks around vehicle',
                    'Do not restart engine',
                    'Contact engineering immediately'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Oil Leak Check',
                content: 'Are there visible oil leaks under or around the vehicle?',
                options: [
                    { 
                        text: 'Yes - Oil leaks visible', 
                        nextStep: 3, 
                        severity: 'critical',
                        icon: '🛢️'
                    },
                    { 
                        text: 'No - No visible leaks', 
                        nextStep: 4, 
                        severity: 'critical',
                        icon: '❓'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 OIL LEAK - CRITICAL HAZARD',
                content: 'Oil leak detected with warning light.',
                result: 'Vehicle must remain stopped. Critical fire and environmental hazard.',
                severity: 'stop',
                stopReason: 'Oil leak presents fire risk and environmental hazard. May result in PG9 prohibition.',
                actions: [
                    'Keep engine switched off',
                    'Ensure vehicle remains stationary',
                    'Clear area of ignition sources',
                    'Use spill kits if available',
                    'Contact fire services if leak is severe',
                    'Notify local authorities for road cleanup if needed'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Fire services (if severe leak)',
                    'Environmental authorities (for spill)',
                    'Police (if road affected)'
                ]
            },
            {
                type: 'final',
                title: '🛑 ENGINE FAILURE - NO LEAKS',
                content: 'Oil warning without visible leaks indicates engine failure.',
                result: 'Engine failure likely. Vehicle must not be restarted.',
                severity: 'stop',
                stopReason: 'Internal engine failure likely. Running engine would cause catastrophic damage.',
                actions: [
                    'Do not restart engine under any circumstances',
                    'Arrange immediate recovery',
                    'Engine likely requires major repair or replacement'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Recovery services'
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
                title: '🛑 LOOSE WHEEL NUTS - STOP IMMEDIATELY',
                content: 'Loose wheel nuts detected.',
                result: 'Vehicle must stop immediately. Zero tolerance for wheel security issues.',
                severity: 'stop',
                stopReason: 'Loose wheel nuts present immediate danger of wheel detachment.',
                actions: [
                    'Stop vehicle immediately',
                    'Do not continue under any circumstances',
                    'Contact multiple levels of management',
                    'Arrange immediate engineering inspection',
                    'Complete incident documentation'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Depot Engineering Manager',
                    'General Manager',
                    'Engineering Delivery Director'
                ]
            }
        ]
    },

    'doors': {
        title: 'Door Problems',
        description: 'Door system malfunctions and passenger safety issues',
        priority: 2,
        severity: 'warning',
        icon: '🚪',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Door System Assessment',
                content: 'Door problems can affect passenger safety and service operation. We need to check the door system thoroughly.',
                warning: '⚠️ SAFETY IMPORTANT: Door issues can affect passenger boarding safety'
            },
            {
                type: 'action',
                title: 'Initial Door Checks',
                content: 'Have the driver perform these initial checks:',
                instructions: [
                    'Check if any door control buttons are stuck (inside and outside)',
                    'Confirm there are no obstructions behind or under the doors',
                    'Clear any visible obstructions if safe to do so',
                    'Test door operation after clearing obstructions'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Initial Checks Result',
                content: 'Did the initial checks resolve the door problem?',
                options: [
                    { 
                        text: 'Yes - Doors now working normally', 
                        nextStep: 9, 
                        severity: 'continue',
                        icon: '✅'
                    },
                    { 
                        text: 'No - Problem persists', 
                        nextStep: 3, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Air System Diagnostic',
                content: 'Have the driver check the air system:',
                instructions: [
                    'Listen carefully for air leaks from door area',
                    'Check air pressure gauge reading',
                    'Try to build up air pressure if low',
                    'Test door operation after pressure builds up',
                    'Note any unusual hissing or air escape sounds'
                ],
                nextStep: 4
            },
            {
                type: 'question',
                title: 'Air System Check Result',
                content: 'Did the air system checks resolve the problem?',
                options: [
                    { 
                        text: 'Yes - Doors working after air pressure fix', 
                        nextStep: 9, 
                        severity: 'continue',
                        icon: '✅'
                    },
                    { 
                        text: 'No - Still having door problems', 
                        nextStep: 5, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Critical Door Safety Assessment',
                content: 'Are any of these CRITICAL door safety issues present?',
                checklist: [
                    'Doors are jammed closed (cannot open)',
                    'Doors cannot be retained in the closed position',
                    'Door hinges, catches, or pillars are loose or insecure',
                    'Doors are weakened and likely to open inadvertently', 
                    'Doors are stiff and cannot fully open or close',
                    'Doors make driving difficult or unsafe'
                ],
                options: [
                    { 
                        text: 'Yes - One or more critical issues present', 
                        nextStep: 6, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'No - None of these critical issues', 
                        nextStep: 7, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 CRITICAL DOOR SAFETY ISSUE',
                content: 'Critical door safety defect identified.',
                result: 'Vehicle must stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Critical door defects present immediate passenger safety risks.',
                actions: [
                    'Stop vehicle in safe location immediately',
                    'Do not allow passenger boarding/alighting until resolved',
                    'Contact engineering team immediately',
                    'Record defect in Go-Check system',
                    'Arrange immediate engineering inspection'
                ],
                contacts: [
                    'Engineering Team - URGENT',
                    'Depot Engineering Manager'
                ]
            },
            {
                type: 'question',
                title: 'Service Impact Assessment',
                content: 'Can the door problem be managed safely for passenger service?',
                info: 'Consider if doors can open/close sufficiently for safe passenger boarding while maintaining security.',
                options: [
                    { 
                        text: 'Yes - Doors functional enough for safe passenger service', 
                        nextStep: 8, 
                        severity: 'warning',
                        icon: '⚠️'
                    },
                    { 
                        text: 'No - Doors too problematic for passenger safety', 
                        nextStep: 6, 
                        severity: 'critical',
                        icon: '🚨'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ DOOR ISSUE - CONTINUE WITH CAUTION',
                content: 'Door problem identified but safe to continue temporarily.',
                result: 'Vehicle may continue to next convenient changeover point with careful monitoring.',
                severity: 'warning',
                actions: [
                    'Continue to next convenient changeover location',
                    'Monitor door operation continuously',
                    'Instruct driver to test doors at each stop',
                    'Record defect in Go-Check system immediately',
                    'Arrange changeover at earliest opportunity',
                    'If problem worsens, stop immediately'
                ],
                contacts: [
                    'Arrange changeover - NON-URGENT',
                    'Engineering Team - scheduled inspection'
                ]
            },
            {
                type: 'final',
                title: '✅ DOOR PROBLEM RESOLVED',
                content: 'Door system now functioning normally.',
                result: 'Vehicle may continue normal operations with monitoring.',
                severity: 'continue',
                actions: [
                    'Continue normal operations',
                    'Log the resolution in Go-Check system',
                    'Monitor door operation for remainder of journey',
                    'If problem recurs, follow procedure again'
                ]
            }
        ]
    },

    'non-starter': {
        title: 'Vehicle Won\'t Start',
        description: 'Engine starting problems and troubleshooting',
        priority: 2,
        severity: 'warning',
        icon: '🔑',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Non-Starter Diagnostic',
                content: 'When a vehicle won\'t start, we need to systematically troubleshoot the issue.',
                warning: '⚠️ SAFETY: Follow all safety procedures when troubleshooting'
            },
            {
                type: 'action',
                title: 'Initial System Checks',
                content: 'Have the driver perform these initial troubleshooting steps:',
                instructions: [
                    'Ensure the vehicle is out of gear and in neutral',
                    'Check if any lights are illuminated or flashing on the gear selector',
                    'Turn off all instruments, including the main switch, to reset the bus',
                    'Confirm the engine bay door is closed and secure',
                    'Turn the vehicle back on and attempt to start the engine'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Initial Reset Result',
                content: 'Did the vehicle start after the system reset?',
                options: [
                    { 
                        text: 'Yes - Vehicle started successfully', 
                        nextStep: 9, 
                        severity: 'continue',
                        icon: '✅'
                    },
                    { 
                        text: 'No - Vehicle still won\'t start', 
                        nextStep: 3, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'info',
                title: 'Rear Start Safety Warning',
                content: 'Before attempting a rear start, ensure safety measures are in place.',
                warning: '🚨 SAFETY CRITICAL: Remove ties, lanyards, and loose clothing. Keep clear of moving belts.'
            },
            {
                type: 'question',
                title: 'Rear Start Safety Check',
                content: 'Is it safe to attempt a rear start procedure?',
                info: 'Check: Is the area clear? Are safety precautions in place? Is the driver properly trained?',
                options: [
                    { 
                        text: 'Yes - Safe to attempt rear start', 
                        nextStep: 5, 
                        severity: 'warning',
                        icon: '⚠️'
                    },
                    { 
                        text: 'No - Not safe for rear start', 
                        nextStep: 7, 
                        severity: 'warning',
                        icon: '🚨'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Rear Start Procedure',
                content: 'Carefully perform the rear start procedure:',
                instructions: [
                    'Exercise extreme caution around moving belts',
                    'Ensure all loose items (ties, lanyards) are removed or secured',
                    'Place loose clothing and lanyards over the shoulder',
                    'Attempt the rear start following trained procedure',
                    'If engine starts, leave it running'
                ],
                nextStep: 6
            },
            {
                type: 'question',
                title: 'Rear Start Result',
                content: 'Did the rear start procedure work?',
                options: [
                    { 
                        text: 'Yes - Engine started and running', 
                        nextStep: 10, 
                        severity: 'warning',
                        icon: '⚠️'
                    },
                    { 
                        text: 'No - Still won\'t start', 
                        nextStep: 7, 
                        severity: 'warning',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Diagnostic Information Gathering',
                content: 'Gather this diagnostic information to assist engineers:',
                instructions: [
                    'Check if the oil light is illuminated',
                    'Look for any smoke coming from the exhaust',
                    'Determine if the engine is trying to start or completely unresponsive',
                    'Note any unusual sounds during start attempts',
                    'Check for any error codes or warning lights'
                ],
                nextStep: 8
            },
            {
                type: 'final',
                title: '🔧 ENGINEERING ASSISTANCE REQUIRED',
                content: 'Vehicle won\'t start despite troubleshooting attempts.',
                result: 'Contact engineering team with diagnostic information gathered.',
                severity: 'stop',
                stopReason: 'Vehicle unable to start requires engineering diagnosis and repair.',
                actions: [
                    'Provide all diagnostic information to engineering',
                    'Do not continue attempting to start',
                    'Arrange alternative vehicle for service',
                    'Record all troubleshooting steps in Go-Check',
                    'Await engineering assistance'
                ],
                contacts: [
                    'Engineering Team - NON-URGENT',
                    'Arrange replacement vehicle',
                    'Service Control - route coverage'
                ]
            },
            {
                type: 'final',
                title: '✅ VEHICLE STARTED SUCCESSFULLY',
                content: 'Vehicle started after initial system reset.',
                result: 'Vehicle may continue normal operations.',
                severity: 'continue',
                actions: [
                    'Continue normal operations',
                    'Log the reset procedure in Go-Check',
                    'Monitor starting performance',
                    'If problem recurs, follow full diagnostic again'
                ]
            },
            {
                type: 'final',
                title: '⚠️ REAR START SUCCESSFUL',
                content: 'Vehicle started using rear start procedure.',
                result: 'Keep engine running and arrange changeover as soon as possible.',
                severity: 'warning',
                actions: [
                    'Keep engine running until changeover',
                    'Do not switch off engine',
                    'Arrange changeover at earliest opportunity',
                    'Contact engineering team to inspect starting system',
                    'Record rear start procedure in Go-Check'
                ],
                contacts: [
                    'Engineering Team - scheduled inspection',
                    'Arrange changeover - URGENT'
                ]
            }
        ]
    },

    'gear-selection': {
        title: 'Gear Selection Problems',
        description: 'Unable to select gears and transmission issues',
        priority: 2,
        severity: 'warning',
        icon: '⚙️',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Gear Selection Diagnostic',
                content: 'When gears cannot be selected, follow this systematic troubleshooting process.',
                warning: '⚠️ SAFETY: Ensure vehicle is stationary and secure before troubleshooting'
            },
            {
                type: 'action',
                title: 'System Reset Procedure',
                content: 'Have the driver perform a complete system reset:',
                instructions: [
                    'Switch the bus off completely',
                    'Wait 10 seconds for systems to reset',
                    'Restart the vehicle in the usual manner',
                    'Ensure vehicle is in park/neutral',
                    'Try to select gear again'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'System Reset Result',
                content: 'Can gears be selected normally after the system reset?',
                options: [
                    { 
                        text: 'Yes - Gear selection working normally', 
                        nextStep: 8, 
                        severity: 'continue',
                        icon: '✅'
                    },
                    { 
                        text: 'No - Still cannot select gears', 
                        nextStep: 3, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Ramp Position Check',
                content: 'Check and adjust the ramp position:',
                instructions: [
                    'Visually inspect if the ramp is correctly secured in stowed position',
                    'Manually lift the ramp and stow it again to ensure proper securing',
                    'Ensure ramp is fully retracted and locked',
                    'Check for any ramp warning lights',
                    'Try gear selection again after ramp adjustment'
                ],
                nextStep: 4
            },
            {
                type: 'question',
                title: 'Ramp Adjustment Result',
                content: 'Did adjusting the ramp position resolve the gear selection issue?',
                options: [
                    { 
                        text: 'Yes - Gears can now be selected', 
                        nextStep: 8, 
                        severity: 'continue',
                        icon: '✅'
                    },
                    { 
                        text: 'No - Gear selection still not working', 
                        nextStep: 5, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Suspension Light Reset',
                content: 'Check and reset the suspension system if applicable:',
                instructions: [
                    'Check if the suspension light on dashboard needs resetting',
                    'Reset the suspension light if illuminated',
                    'Wait for system to complete reset cycle',
                    'Ensure proper suspension operation',
                    'Attempt gear selection after suspension reset'
                ],
                nextStep: 6
            },
            {
                type: 'action',
                title: 'Footbrake Operation Check',
                content: 'Verify proper footbrake operation:',
                instructions: [
                    'Ensure driver is pressing firmly on the footbrake',
                    'Check that footbrake is fully depressed',
                    'Hold footbrake down while selecting gear',
                    'Verify footbrake warning lights are functioning',
                    'Try gear selection with proper footbrake technique'
                ],
                nextStep: 7
            },
            {
                type: 'final',
                title: '🔧 TRANSMISSION PROBLEM - ENGINEERING REQUIRED',
                content: 'Gear selection problem persists despite troubleshooting.',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Transmission system failure prevents safe vehicle operation.',
                actions: [
                    'Stop vehicle safely and remain stationary',
                    'Do not force gear selection',
                    'Record all troubleshooting steps in Go-Check',
                    'Contact engineering team with full diagnostic details',
                    'Arrange replacement vehicle for service'
                ],
                contacts: [
                    'Engineering Team - URGENT',
                    'Service Control - replacement vehicle',
                    'Depot Engineering Manager'
                ]
            },
            {
                type: 'final',
                title: '✅ GEAR SELECTION RESTORED',
                content: 'Gear selection is now working normally.',
                result: 'Vehicle may continue normal operations with monitoring.',
                severity: 'continue',
                actions: [
                    'Continue normal operations',
                    'Log the resolution method in Go-Check',
                    'Monitor gear selection performance',
                    'If problem recurs, follow full diagnostic procedure again',
                    'Report any irregular gear operation immediately'
                ]
            }
        ]
    },

    'demisters-heaters': {
        title: 'Demisters/Heaters Not Working',
        description: 'Heating and demisting system problems affecting visibility and comfort',
        priority: 2,
        severity: 'warning',
        icon: '🌬️',
        color: '#f59e0b',
        steps: [
            {
                type: 'question',
                title: 'Driver Vision Assessment',
                content: 'Is the driver\'s vision affected by the demister/heater problem?',
                info: 'Check if windscreen is misting up or visibility is impaired.',
                options: [
                    { 
                        text: 'Yes - Vision is impaired', 
                        nextStep: 1, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'No - Vision is clear', 
                        nextStep: 2, 
                        severity: 'warning',
                        icon: '✅'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 VISION IMPAIRED - STOP IMMEDIATELY',
                content: 'Driver\'s vision is affected by demister failure.',
                result: 'Vehicle must not continue in service with impaired visibility.',
                severity: 'stop',
                stopReason: 'Impaired driver vision presents immediate safety risk to all road users.',
                actions: [
                    'Stop vehicle in safe location immediately',
                    'Do not continue with impaired visibility',
                    'Attempt manual clearing of windscreen if safe',
                    'Contact engineering team for immediate assistance',
                    'Arrange replacement vehicle'
                ],
                contacts: [
                    'Engineering Team - URGENT',
                    'Service Control - replacement vehicle required'
                ]
            },
            {
                type: 'question',
                title: 'Demister Airflow Check',
                content: 'Are the demisters blowing air at all?',
                options: [
                    { 
                        text: 'Not blowing at all', 
                        nextStep: 3, 
                        severity: 'warning',
                        icon: '🚫'
                    },
                    { 
                        text: 'Blowing but only cold air', 
                        nextStep: 5, 
                        severity: 'warning',
                        icon: '❄️'
                    },
                    { 
                        text: 'Blowing but not effectively', 
                        nextStep: 4, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Airflow Obstruction Check',
                content: 'Check for blockages affecting demister airflow:',
                instructions: [
                    'Look for obstructions like bags, newspapers, or debris',
                    'Check demister vents for blockages',
                    'Clear any visible obstructions safely',
                    'Test demister operation after clearing blockages',
                    'If no obstructions found, continue to changeover point'
                ],
                nextStep: 8
            },
            {
                type: 'action',
                title: 'Demister Blockage Check',
                content: 'Check for blockages reducing demister effectiveness:',
                instructions: [
                    'Inspect demister vents for partial blockages',
                    'Check for bags, newspapers, or other obstructions',
                    'Clear any blockages if safe to do so',
                    'Test improved demister effectiveness'
                ],
                nextStep: 8
            },
            {
                type: 'question',
                title: 'Vehicle Warm-Up Time',
                content: 'Has the vehicle been in service for at least 1 hour to warm up?',
                info: 'Heating systems need adequate time to reach operating temperature.',
                options: [
                    { 
                        text: 'Yes - Vehicle has been running over 1 hour', 
                        nextStep: 6, 
                        severity: 'warning',
                        icon: '✅'
                    },
                    { 
                        text: 'No - Vehicle started recently (under 1 hour)', 
                        nextStep: 9, 
                        severity: 'continue',
                        icon: '🕑'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Saloon Temperature Check',
                content: 'What is the current temperature inside the passenger saloon?',
                options: [
                    { 
                        text: '16 degrees or above', 
                        nextStep: 7, 
                        severity: 'continue',
                        icon: '🌡️'
                    },
                    { 
                        text: 'Below 16 degrees', 
                        nextStep: 8, 
                        severity: 'warning',
                        icon: '❄️'
                    }
                ]
            },
            {
                type: 'final',
                title: '✅ TEMPERATURE ACCEPTABLE',
                content: 'Saloon temperature is within acceptable range.',
                result: 'Vehicle may continue until replacement becomes available, but changeover is not urgent.',
                severity: 'continue',
                actions: [
                    'Continue normal operations',
                    'Monitor passenger comfort',
                    'Arrange changeover when convenient',
                    'Log heating issue in Go-Check for future maintenance'
                ]
            },
            {
                type: 'final',
                title: '⚠️ CHANGEOVER REQUIRED',
                content: 'Heating/demisting system issue requires changeover.',
                result: 'Arrange changeover as soon as possible.',
                severity: 'warning',
                actions: [
                    'Continue to next changeover point',
                    'Arrange changeover as soon as possible',
                    'Monitor system performance continuously',
                    'Check with engineering hourly for changeover status',
                    'Report to Depot Manager if changeover delayed unreasonably',
                    'Record issue in Go-Check system'
                ],
                contacts: [
                    'Arrange changeover - URGENT',
                    'Engineering Team - scheduled repair'
                ]
            },
            {
                type: 'final',
                title: '✅ NORMAL WARM-UP PERIOD',
                content: 'Vehicle needs more time to warm up - this is normal.',
                result: 'Continue operations and reassess after adequate warm-up time.',
                severity: 'continue',
                actions: [
                    'Continue normal operations',
                    'Allow vehicle to warm up naturally',
                    'Reassess heating performance after 1 hour total runtime',
                    'If still inadequate after warm-up, arrange changeover'
                ]
            }
        ]
    },

    'exterior-lights': {
        title: 'Exterior Lights Problems',
        description: 'Headlights, indicators, and brake lights malfunctions',
        priority: 2,
        severity: 'warning',
        icon: '💡',
        color: '#f59e0b',
        steps: [
            {
                type: 'question',
                title: 'Light Type Identification',
                content: 'Which type of exterior light is not working?',
                options: [
                    { 
                        text: 'Headlights', 
                        nextStep: 1, 
                        severity: 'warning',
                        icon: '🔦'
                    },
                    { 
                        text: 'Direction Indicators', 
                        nextStep: 8, 
                        severity: 'critical',
                        icon: '➡️'
                    },
                    { 
                        text: 'Brake Lights', 
                        nextStep: 9, 
                        severity: 'warning',
                        icon: '🔴'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Headlight Assessment',
                content: 'What is the extent of the headlight problem?',
                info: 'For LED units, less than 50% illuminated counts as not working.',
                options: [
                    { 
                        text: 'One headlight out (or less than 50% LED illuminated)', 
                        nextStep: 2, 
                        severity: 'warning',
                        icon: '⚠️'
                    },
                    { 
                        text: 'Both headlights out', 
                        nextStep: 2, 
                        severity: 'critical',
                        icon: '🚨'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Hours of Darkness Check',
                content: 'Is the vehicle currently operating in hours of darkness on an unrestricted road?',
                info: 'Hours of darkness: 30 minutes after sunset to 30 minutes before sunrise.',
                options: [
                    { 
                        text: 'Yes - Operating in hours of darkness', 
                        nextStep: 3, 
                        severity: 'critical',
                        icon: '🌙'
                    },
                    { 
                        text: 'No - Daylight hours', 
                        nextStep: 4, 
                        severity: 'warning',
                        icon: '☀️'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 LIGHTS REQUIRED - STOP IMMEDIATELY',
                content: 'Headlight defect during hours of darkness on unrestricted road.',
                result: 'Vehicle must not continue in hours of darkness without proper lighting.',
                severity: 'stop',
                stopReason: 'Operating without proper headlights in darkness is illegal and extremely dangerous.',
                actions: [
                    'Stop vehicle in safe location immediately',
                    'Do not continue until lighting is restored',
                    'Contact engineering team for immediate assistance',
                    'Consider recovery if lights cannot be quickly repaired',
                    'Arrange replacement vehicle for service'
                ],
                contacts: [
                    'Engineering Team - URGENT',
                    'Service Control - immediate replacement required'
                ]
            },
            {
                type: 'question',
                title: 'Daylight Operations Planning',
                content: 'Will the vehicle need to operate during hours of darkness later today?',
                options: [
                    { 
                        text: 'Yes - Will operate in darkness later', 
                        nextStep: 5, 
                        severity: 'warning',
                        icon: '🌙'
                    },
                    { 
                        text: 'No - Finishing before darkness', 
                        nextStep: 6, 
                        severity: 'continue',
                        icon: '☀️'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ CHANGEOVER BEFORE DARKNESS',
                content: 'Headlight defect - changeover required before hours of darkness.',
                result: 'Vehicle may continue in daylight but must be changed before darkness.',
                severity: 'warning',
                actions: [
                    'Continue operations in daylight only',
                    'Arrange changeover before hours of darkness',
                    'Calculate exact sunset time for your location',
                    'Ensure changeover completed 30 minutes after sunset',
                    'Record defect in Go-Check system'
                ],
                contacts: [
                    'Arrange changeover - BEFORE DARKNESS',
                    'Engineering Team - scheduled repair'
                ]
            },
            {
                type: 'final',
                title: '✅ DAYLIGHT OPERATIONS ONLY',
                content: 'Headlight defect noted - daylight operations only.',
                result: 'Vehicle may continue as it will finish before darkness.',
                severity: 'continue',
                actions: [
                    'Continue normal daylight operations',
                    'Ensure duty finishes before hours of darkness',
                    'Log defect in Go-Check for next day repair',
                    'Inform next driver of headlight defect'
                ]
            },
            {
                type: 'question',
                title: 'Route Risk Assessment',
                content: 'What type of route is the vehicle operating on?',
                info: 'Consider the safety implications for the specific route type.',
                options: [
                    { 
                        text: 'Urban routes with good street lighting', 
                        nextStep: 7, 
                        severity: 'warning',
                        icon: '🏢'
                    },
                    { 
                        text: 'Rural/motorway routes (A19, A1M, etc.)', 
                        nextStep: 5, 
                        severity: 'critical',
                        icon: '🛛'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ URBAN ROUTE - CHANGEOVER NEEDED',
                content: 'Headlight defect on urban route.',
                result: 'Arrange changeover at next convenient opportunity.',
                severity: 'warning',
                actions: [
                    'Continue to next convenient changeover point',
                    'Arrange changeover at earliest opportunity', 
                    'Use extra caution in areas with poor lighting',
                    'Record defect in Go-Check system'
                ]
            },
            {
                type: 'final',
                title: '🛑 INDICATOR FAILURE - STOP IMMEDIATELY',
                content: 'Direction indicator or side repeater not working.',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Non-functioning indicators present immediate danger to other road users.',
                actions: [
                    'Stop vehicle in safe location immediately',
                    'Do not continue with defective indicators',
                    'Contact engineering team for urgent repair',
                    'Indicators are essential for safe road operation'
                ],
                contacts: [
                    'Engineering Team - URGENT'
                ]
            },
            {
                type: 'question',
                title: 'Brake Light Assessment',
                content: 'Which brake lights are affected?',
                options: [
                    { 
                        text: 'Both low level brake lights not working', 
                        nextStep: 11, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'Both low level brake lights on constantly', 
                        nextStep: 11, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'One brake light not working', 
                        nextStep: 12, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Low Level Brake Light Type',
                content: 'Are these high-level brake lights or low-level brake lights?',
                info: 'Low-level brake lights are the main brake lights. High-level are supplementary.',
                options: [
                    { 
                        text: 'Low-level (main) brake lights', 
                        nextStep: 13, 
                        severity: 'critical',
                        icon: '🚨'
                    },
                    { 
                        text: 'High-level (supplementary) brake lights', 
                        nextStep: 12, 
                        severity: 'warning',
                        icon: '⚠️'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ SINGLE BRAKE LIGHT - CHANGEOVER NEEDED',
                content: 'One brake light not working.',
                result: 'Vehicle may continue to next convenient changeover location.',
                severity: 'warning',
                actions: [
                    'Continue to next convenient changeover location',
                    'Use extra caution when braking',
                    'Record defect in Go-Check system',
                    'Arrange changeover at earliest opportunity'
                ],
                contacts: [
                    'Arrange changeover - NON-URGENT'
                ]
            },
            {
                type: 'final',
                title: '🛑 MAIN BRAKE LIGHTS FAILURE',
                content: 'Both main brake lights not working or constantly on.',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Main brake light failure prevents other drivers from knowing when vehicle is braking.',
                actions: [
                    'Stop vehicle in safe location immediately',
                    'Contact engineering team for urgent repair',
                    'Do not continue without functioning brake lights',
                    'Extremely dangerous to operate without brake light signals'
                ],
                contacts: [
                    'Engineering Team - URGENT'
                ]
            }
        ]
    }
};

// Make diagnosticFlows globally available
window.diagnosticFlows = diagnosticFlows;

console.log('Enhanced Diagnostic Flows loaded with', Object.keys(diagnosticFlows).length, 'issues');
