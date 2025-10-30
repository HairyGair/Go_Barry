/**
 * Complete Industry Best-Practice Compliant Diagnostic Flows
 * All categories with interactive wizards - Version 1.3
 * Operational best practice guidelines - NO modifications allowed
 */

const diagnosticFlows = {
    // CRITICAL ISSUES (Priority 1) - Safety Critical
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
                title: 'SAFETY CRITICAL - Brake Information',
                content: `CRITICAL SAFETY INFORMATION:

WHY BRAKES ARE SAFETY CRITICAL:
Brake system failures present extreme danger to passengers, drivers, and the public. Brake failures can result in loss of vehicle control, collisions, and serious injury or death.

IMMEDIATE STOPPING CRITERIA:
If ANY of the following occur, advise the driver to switch off the vehicle and await engineering attendance immediately. Safety is NON-NEGOTIABLE.

LEGAL IMPLICATIONS:
Continuing service with known brake defects could result in PG9 prohibition notices and legal consequences. DVSA expects immediate action on brake defects.`,
                warning: '⚠️ SAFETY IS NON-NEGOTIABLE - If any brake defect is confirmed, the vehicle must stop immediately.',
                nextStep: 1
            },
            {
                type: 'info',
                title: 'Industry Best Practice Guidelines Reference',
                content: `OPERATIONAL SAFETY PROCEDURES - BRAKES SECTION:

"If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance:

• Brake pedal sinks to the floor with little or no resistance.
• Braking response is delayed or ineffective.
• Unusual noises (e.g., grinding or squealing) during braking.
• Visible leaks in the brake system (e.g., brake fluid).
• Brakes are grabbing or shuddering.
• Red ABS/EBS light is illuminated."

COMPLIANCE NOTE:
This is the exact criteria from the official operational safety procedures that must be followed. These symptoms indicate potential brake system failure. Failure to follow these criteria could result in safety incidents and regulatory action.`,
                warning: 'These criteria must be followed exactly as written in operational procedures.',
                nextStep: 2
            },
            {
                type: 'info',
                title: 'Understanding Brake System Failures',
                content: `TECHNICAL CONTEXT - BRAKE SYSTEM FAILURES:

PEDAL SINKING TO FLOOR:
• Technical Cause: Master cylinder failure, brake line rupture, or severe brake fluid loss
• Progression Risk: Can progress from partial to complete brake failure within minutes
• Engineering Priority: Immediate attendance required - potential PG9 prohibition

DELAYED OR INEFFECTIVE BRAKING:
• Technical Cause: Brake pad wear, hydraulic pressure loss, or system contamination
• Progression Risk: Progressive deterioration leading to total brake failure
• Engineering Priority: Critical - immediate assessment required

GRINDING OR SQUEALING NOISES:
• Technical Cause: Severe brake pad wear, rotor damage, or component failure
• Progression Risk: Rapid progression to brake system damage and failure
• Engineering Priority: Immediate inspection required

SYSTEM OVERVIEW:
Vehicle brake systems use hydraulic pressure to apply brake pads to rotors. Any compromise to this system affects stopping ability and vehicle control. Brake failures are unpredictable and can occur without warning.`,
                nextStep: 3
            },
            {
                type: 'action',
                title: 'Brake Assessment - Driver Questions',
                content: 'Systematically assess the brake issue by asking the driver these specific diagnostic questions:',
                checklist: [
                    'Ask: "Can you describe exactly what you\'re experiencing with the brakes?" - Listen for any mention of the 6 critical symptoms',
                    'Ask: "Does the brake pedal feel normal when you press it?" - Any abnormal pedal feel indicates hydraulic problems',
                    'Ask: "Is the braking performance normal - does the bus stop as expected?" - Any reduction in performance is critical',
                    'Ask: "Are you hearing any unusual noises when braking?" - Grinding or squealing indicates potential failure'
                ],
                safety: 'Any positive response to critical symptoms requires immediate stopping. Uncertainty about brake performance requires conservative approach - stop vehicle.',
                nextStep: 4
            },
            {
                type: 'question',
                title: 'Critical Brake Symptoms Assessment',
                content: 'Based on the driver\'s responses to your questions, assess if ANY of the critical operational safety symptoms are present:',
                options: [
                    {
                        text: 'CRITICAL FAILURE - Brake pedal sinks to floor OR braking is delayed/ineffective',
                        nextStep: 5,
                        severity: 'critical'
                    },
                    {
                        text: 'BRAKE DEFECT - Unusual noises, visible leaks, grabbing/shuddering, OR red warning light',
                        nextStep: 6,
                        severity: 'critical'
                    },
                    {
                        text: 'MINOR CONCERN - None of the critical symptoms, very minor issue only',
                        nextStep: 7
                    }
                ]
            },
            {
                type: 'final',
                title: 'CRITICAL BRAKE FAILURE - IMMEDIATE STOP',
                content: 'CRITICAL BRAKE SYSTEM FAILURE - COMPLETE LOSS OF BRAKING',
                result: 'Advise the driver to switch off the vehicle and await engineering attendance immediately.',
                severity: 'stop',
                stopReason: 'Complete brake system failure presents extreme danger - potential total loss of braking ability.',
                contacts: [
                    'Contact engineering immediately - URGENT attendance required',
                    'Report to depot management immediately',
                    'Consider passenger evacuation if necessary'
                ],
                actions: [
                    'Record as CRITICAL BRAKE SYSTEM FAILURE in Go-Check',
                    'EP Morris: URG - Urgent Please Read - Complete Brake System Failure',
                    'Vehicle must NOT move under any circumstances',
                    'Complete incident report within 24 hours',
                    'Engineering investigation required before return to service'
                ]
            },
            {
                type: 'final',
                title: 'BRAKE DEFECT - IMMEDIATE STOP REQUIRED',
                content: 'BRAKE SYSTEM DEFECT - IMMEDIATE STOP REQUIRED',
                result: 'Advise the driver to switch off the vehicle and await engineering attendance immediately.',
                severity: 'stop',
                stopReason: 'Brake system defects indicate potential brake failure and must be treated as serious safety issues.',
                contacts: [
                    'Contact engineering for brake system inspection',
                    'Notify depot control of service disruption'
                ],
                actions: [
                    'Record as BRAKE DEFECT in Go-Check with specific symptoms',
                    'EP Morris: BDBR - Brake Defect requiring immediate attention',
                    'Document exact symptoms and driver observations',
                    'Engineering inspection required before return to service',
                    'Arrange passenger transfer if required'
                ]
            },
            {
                type: 'final',
                title: 'MINOR BRAKE ISSUE - PLANNED CHANGEOVER',
                content: 'Minor brake issue identified - no immediate safety risk but requires attention.',
                result: 'Vehicle may continue to the next convenient changeover point with a planned changeover organised at the earliest opportunity.',
                stopReason: 'This option should only be used when completely confident the issue has no safety impact whatsoever.',
                contacts: [
                    'Arrange planned changeover at convenient location',
                    'Schedule engineering inspection at depot'
                ],
                actions: [
                    'Record as MINOR BRAKE ISSUE in Go-Check',
                    'EP Morris: BDBR - Minor Brake Issue requiring inspection',
                    'Driver must monitor brake performance continuously',
                    'Stop immediately if ANY change in brake performance occurs',
                    'Engineering inspection required at depot'
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
                type: 'safety',
                title: 'SAFETY CRITICAL - Steering',
                content: 'Steering system failures can result in immediate loss of vehicle control. Any steering defect requires immediate assessment.',
                warning: '⚠️ SAFETY IS NON-NEGOTIABLE - If any steering defect is confirmed, the vehicle must stop immediately.',
                nextStep: 'steering-assessment'
            },
            {
                type: 'decision',
                id: 'steering-assessment',
                title: 'Steering System Assessment',
                content: 'Ask the driver to describe the steering issue. Check if ANY of the following conditions are present:',
                question: 'Are ANY of the critical steering conditions present?',
                choices: [
                    {
                        text: 'YES - Excessive play, difficulty steering, or loss of control',
                        action: 'immediate-stop',
                        severity: 'stop'
                    },
                    {
                        text: 'NO - Minor steering concern only',
                        action: 'planned-changeover'
                    }
                ]
            },
            {
                type: 'final',
                id: 'immediate-stop',
                title: 'IMMEDIATE STOP REQUIRED',
                content: 'CRITICAL STEERING DEFECT IDENTIFIED',
                result: 'Advise the driver to switch off the vehicle and await engineering attendance immediately.',
                severity: 'stop',
                safetyNote: 'Steering failures can result in loss of directional control and serious collisions.'
            },
            {
                type: 'final',
                id: 'planned-changeover',
                title: 'PLANNED CHANGEOVER REQUIRED',
                content: 'Minor steering issue identified.',
                result: 'Vehicle may continue with planned changeover at earliest opportunity.',
                safetyNote: 'Monitor steering performance continuously.'
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
                type: 'safety',
                title: 'SAFETY CRITICAL - Oil Warning Light',
                content: 'Oil pressure warnings indicate potential engine failure and fire risk. Immediate action required.',
                warning: '⚠️ SAFETY IS NON-NEGOTIABLE - Oil warning lights require immediate stopping and assessment.',
                nextStep: 'immediate-stop-instruction'
            },
            {
                type: 'final',
                id: 'immediate-stop-instruction',
                title: 'IMMEDIATE STOP REQUIRED',
                content: 'OIL WARNING LIGHT ACTIVE',
                result: 'Instruct the driver to STOP immediately and seek assistance from engineering.',
                severity: 'stop',
                safetyNote: 'Oil pressure loss can cause catastrophic engine failure and fire risk.'
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
                type: 'safety',
                title: 'EXTREME SAFETY CRITICAL - Loose Wheel Nuts',
                content: 'Loose wheel nuts present immediate risk of catastrophic wheel failure and loss of control.',
                warning: '⚠️ ABSOLUTE ZERO TOLERANCE - Vehicle must NEVER move with loose wheel nuts under ANY circumstances.',
                nextStep: 'immediate-stop-instruction'
            },
            {
                type: 'final',
                id: 'immediate-stop-instruction',
                title: 'IMMEDIATE STOP REQUIRED',
                content: 'LOOSE WHEEL NUTS - CRITICAL DANGER',
                result: 'Advise the driver to stop the vehicle safely at the earliest opportunity and await engineering assistance.',
                severity: 'stop',
                safetyNote: 'Loose wheel nuts can cause wheels to detach while driving, resulting in loss of control and potentially fatal accidents.'
            }
        ]
    },

    'puncture': {
        title: 'Puncture',
        description: 'Tire puncture assessment and response',
        priority: 1,
        severity: 'critical',
        icon: '🛞',
        color: '#dc2626',
        steps: [
            {
                type: 'safety',
                title: 'SAFETY CRITICAL - Puncture',
                content: 'Tire punctures can cause immediate loss of vehicle control and present serious safety risks.',
                warning: '⚠️ SAFETY IS NON-NEGOTIABLE - Any suspected puncture requires immediate stopping and assessment.',
                nextStep: 'immediate-stop-instruction'
            },
            {
                type: 'final',
                id: 'immediate-stop-instruction',
                title: 'IMMEDIATE STOP REQUIRED',
                content: 'TIRE PUNCTURE IDENTIFIED',
                result: 'The driver should stop immediately and seek advice from engineering.',
                severity: 'stop',
                safetyNote: 'Driving on punctured tires can cause tire blowouts, loss of control, and potential accidents.'
            }
        ]
    },

    'road-traffic-incidents': {
        title: 'Road Traffic Incidents',
        description: 'Collision and incident response procedures',
        priority: 1,
        severity: 'critical',
        icon: '🚨',
        color: '#dc2626',
        steps: [
            {
                type: 'safety',
                title: 'SAFETY CRITICAL - Road Traffic Incident',
                content: 'Road traffic incidents require immediate and comprehensive response to ensure safety of all involved.',
                warning: '⚠️ SAFETY FIRST - Systematic assessment of driver, passengers, and vehicle condition required.',
                nextStep: 'incident-assessment'
            },
            {
                type: 'procedure',
                id: 'incident-assessment',
                title: 'Incident Assessment',
                content: 'Follow systematic assessment procedure for road traffic incidents.',
                steps: [
                    'Check driver wellbeing and fitness to continue',
                    'Assess passenger injuries',
                    'Confirm police involvement',
                    'Evaluate vehicle damage',
                    'Complete all required documentation'
                ],
                nextStep: 'incident-response'
            },
            {
                type: 'final',
                id: 'incident-response',
                title: 'Incident Response Complete',
                content: 'Follow-up actions completed.',
                result: 'Incident documented with appropriate actions taken for all safety concerns.',
                safetyNote: 'Thorough documentation is essential for insurance, legal, and safety improvement purposes.'
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
                type: 'safety',
                title: 'SAFETY IMPORTANT - ABS Light',
                content: 'ABS lights indicate potential braking system faults that require assessment.',
                warning: '⚠️ ABS faults affect braking safety - All ABS lights must be checked over by an engineer.',
                nextStep: 'abs-assessment'
            },
            {
                type: 'decision',
                id: 'abs-assessment',
                title: 'ABS Light Assessment',
                content: 'Determine the colour and behaviour of the ABS light.',
                question: 'What colour is the ABS light?',
                choices: [
                    {
                        text: 'RED ABS Light',
                        action: 'red-abs-response'
                    },
                    {
                        text: 'AMBER ABS Light',
                        action: 'amber-abs-response'
                    }
                ]
            },
            {
                type: 'final',
                id: 'red-abs-response',
                title: 'RED ABS LIGHT - STOP REQUIRED',
                content: 'Red ABS light indicates serious braking system fault.',
                result: 'Stop and wait for engineering assistance if light remains on after reset.',
                severity: 'stop'
            },
            {
                type: 'final',
                id: 'amber-abs-response',
                title: 'AMBER ABS LIGHT - CHANGEOVER REQUIRED',
                content: 'Amber ABS light indicates ABS system fault.',
                result: 'Continue with changeover at earliest convenience.'
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
                type: 'safety',
                title: 'SAFETY IMPORTANT - Battery Light',
                content: 'Battery warning lights indicate electrical charging system problems.',
                warning: '⚠️ Battery faults can cause loss of electrical power and vehicle breakdown.',
                nextStep: 'battery-assessment'
            },
            {
                type: 'final',
                id: 'battery-assessment',
                title: 'BATTERY LIGHT RESPONSE',
                content: 'Battery charging system fault.',
                result: 'Wait for engineering assistance as electrical systems may fail.',
                severity: 'stop'
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
                type: 'safety',
                title: 'SAFETY IMPORTANT - Non Starter',
                content: 'Non-starting vehicles require systematic troubleshooting.',
                warning: '⚠️ Follow safety procedures during all troubleshooting steps.',
                nextStep: 'troubleshooting'
            },
            {
                type: 'procedure',
                id: 'troubleshooting',
                title: 'Initial Troubleshooting',
                content: 'Complete systematic troubleshooting steps.',
                steps: [
                    'Ensure vehicle is out of gear and in neutral',
                    'Turn off all instruments and reset the bus',
                    'Confirm engine bay door is closed',
                    'Attempt to start the engine'
                ],
                nextStep: 'troubleshooting-result'
            },
            {
                type: 'final',
                id: 'troubleshooting-result',
                title: 'TROUBLESHOOTING COMPLETE',
                content: 'Initial troubleshooting completed.',
                result: 'If vehicle starts, continue in service. If not, contact engineering.'
            }
        ]
    },

    'overheating': {
        title: 'Overheating',
        description: 'Engine overheating assessment and response',
        priority: 2,
        severity: 'medium',
        icon: '🌡️',
        color: '#f59e0b',
        steps: [
            {
                type: 'safety',
                title: 'SAFETY IMPORTANT - Overheating',
                content: 'Engine overheating can cause serious engine damage and breakdown.',
                warning: '⚠️ Monitor temperature carefully and follow cooling procedures.',
                nextStep: 'temperature-check'
            },
            {
                type: 'assessment',
                id: 'temperature-check',
                title: 'Temperature Assessment',
                content: 'Check the temperature gauge reading.',
                nextStep: 'temperature-response'
            },
            {
                type: 'final',
                id: 'temperature-response',
                title: 'OVERHEATING RESPONSE',
                content: 'Engine overheating identified.',
                result: 'Follow temperature-based response protocol and contact engineering if severe.'
            }
        ]
    },

    'doors': {
        title: 'Doors Not Working',
        description: 'Door operation issues and safety concerns',
        priority: 2,
        severity: 'medium',
        icon: '🚪',
        color: '#f59e0b',
        steps: [
            {
                type: 'safety',
                title: 'SAFETY IMPORTANT - Doors',
                content: 'Door malfunctions can affect passenger safety and service operation.',
                warning: '⚠️ Ensure doors can be secured in closed position for safe operation.',
                nextStep: 'door-assessment'
            },
            {
                type: 'decision',
                id: 'door-assessment',
                title: 'Door System Assessment',
                content: 'Assess the door malfunction severity.',
                question: 'Can the doors be secured in the closed position?',
                choices: [
                    {
                        text: 'NO - Doors cannot be secured closed',
                        action: 'door-stop-required',
                        severity: 'stop'
                    },
                    {
                        text: 'YES - Doors can be secured but not operating normally',
                        action: 'door-changeover'
                    }
                ]
            },
            {
                type: 'final',
                id: 'door-stop-required',
                title: 'DOOR FAILURE - STOP REQUIRED',
                content: 'Doors cannot be secured - safety risk.',
                result: 'Stop and seek engineering assistance immediately.',
                severity: 'stop'
            },
            {
                type: 'final',
                id: 'door-changeover',
                title: 'DOOR ISSUE - CHANGEOVER REQUIRED',
                content: 'Door system malfunction but doors can be secured.',
                result: 'Continue to convenient changeover point.'
            }
        ]
    },

    // MEDIUM PRIORITY ISSUES (Priority 3)
    'non-starter': {
        title: 'Non-Starter',
        description: 'Engine will not start - troubleshooting required',
        priority: 2,
        severity: 'high',
        icon: '🔋',
        color: '#ef4444',
        steps: [
            {
                type: 'safety',
                title: 'Non-Starter Assessment',
                content: 'Vehicle will not start - systematic troubleshooting required.',
                nextStep: 'non-starter-assessment'
            },
            {
                type: 'final',
                id: 'non-starter-assessment',
                title: 'NON-STARTER RESPONSE',
                content: 'Non-starter issue identified.',
                result: 'Follow SDC troubleshooting steps and contact engineering if needed.'
            }
        ]
    },

    'low-water': {
        title: 'Low Water',
        description: 'Cooling system water level issues',
        priority: 3,
        severity: 'medium',
        icon: '💧',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Low Water Assessment',
                content: 'Low water levels can lead to engine overheating.',
                nextStep: 'water-assessment'
            },
            {
                type: 'final',
                id: 'water-assessment',
                title: 'LOW WATER RESPONSE',
                content: 'Low water level identified.',
                result: 'Check for leaks and arrange water top-up or changeover as appropriate.'
            }
        ]
    },

    'excessive-smoke': {
        title: 'Excessive Smoke',
        description: 'Exhaust smoke assessment and response',
        priority: 3,
        severity: 'medium',
        icon: '💨',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Excessive Smoke Assessment',
                content: 'Excessive smoke can indicate engine problems.',
                nextStep: 'smoke-assessment'
            },
            {
                type: 'final',
                id: 'smoke-assessment',
                title: 'EXCESSIVE SMOKE RESPONSE',
                content: 'Excessive smoke identified.',
                result: 'Assess smoke severity and arrange appropriate response.'
            }
        ]
    },

    'broken-windows': {
        title: 'Broken Windows',
        description: 'Window damage assessment and safety response',
        priority: 3,
        severity: 'medium',
        icon: '🪟',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Broken Window Assessment',
                content: 'Assess window damage for safety implications.',
                nextStep: 'window-assessment'
            },
            {
                type: 'final',
                id: 'window-assessment',
                title: 'BROKEN WINDOW RESPONSE',
                content: 'Window damage identified.',
                result: 'Assess safety impact and continue or changeover as appropriate.'
            }
        ]
    },

    'wipers-screenwash': {
        title: 'Wipers/Screenwash',
        description: 'Windscreen wiper and washer system issues',
        priority: 3,
        severity: 'medium',
        icon: '🌧️',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Wiper/Screenwash Assessment',
                content: 'Assess impact on driver visibility.',
                nextStep: 'wiper-assessment'
            },
            {
                type: 'final',
                id: 'wiper-assessment',
                title: 'WIPER/SCREENWASH RESPONSE',
                content: 'Wiper or screenwash issue identified.',
                result: 'Assess visibility impact and arrange appropriate response.'
            }
        ]
    },

    'gear-selection': {
        title: 'Gear Selection',
        description: 'Transmission gear selection problems',
        priority: 3,
        severity: 'medium',
        icon: '⚙️',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Gear Selection Assessment',
                content: 'Assess gear selection problems.',
                nextStep: 'gear-assessment'
            },
            {
                type: 'final',
                id: 'gear-assessment',
                title: 'GEAR SELECTION RESPONSE',
                content: 'Gear selection issue identified.',
                result: 'Follow reset procedures and contact engineering if unresolved.'
            }
        ]
    },

    'gearbox-temperature': {
        title: 'Gearbox Temperature',
        description: 'Transmission overheating concerns',
        priority: 3,
        severity: 'medium',
        icon: '🌡️',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Gearbox Temperature Assessment',
                content: 'Assess gearbox overheating.',
                nextStep: 'gearbox-assessment'
            },
            {
                type: 'final',
                id: 'gearbox-assessment',
                title: 'GEARBOX TEMPERATURE RESPONSE',
                content: 'Gearbox temperature issue identified.',
                result: 'Monitor temperature and arrange changeover if severe.'
            }
        ]
    },

    'demisters-heaters': {
        title: 'Demisters/Heaters',
        description: 'Climate control system problems',
        priority: 3,
        severity: 'medium',
        icon: '🔥',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Demister/Heater Assessment',
                content: 'Assess climate control issues.',
                nextStep: 'climate-assessment'
            },
            {
                type: 'final',
                id: 'climate-assessment',
                title: 'CLIMATE CONTROL RESPONSE',
                content: 'Climate control issue identified.',
                result: 'Assess visibility and comfort impact.'
            }
        ]
    },

    'cutting-out-fuel': {
        title: 'Cutting Out/Fuel',
        description: 'Engine cutting out or fuel system problems',
        priority: 3,
        severity: 'medium',
        icon: '⛽',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Cutting Out/Fuel Assessment',
                content: 'Assess engine cutting out or fuel issues.',
                nextStep: 'fuel-assessment'
            },
            {
                type: 'final',
                id: 'fuel-assessment',
                title: 'FUEL SYSTEM RESPONSE',
                content: 'Fuel system issue identified.',
                result: 'Check for leaks and assess engine performance.'
            }
        ]
    },

    'ramp': {
        title: 'Ramp',
        description: 'Wheelchair ramp operation issues',
        priority: 3,
        severity: 'medium',
        icon: '♿',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Ramp Assessment',
                content: 'Assess ramp operation issues.',
                nextStep: 'ramp-assessment'
            },
            {
                type: 'final',
                id: 'ramp-assessment',
                title: 'RAMP RESPONSE',
                content: 'Ramp issue identified.',
                result: 'Attempt reset and contact engineering if needed.'
            }
        ]
    },

    'exterior-lights': {
        title: 'Exterior Lights',
        description: 'External lighting system problems',
        priority: 3,
        severity: 'medium',
        icon: '💡',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Exterior Lights Assessment',
                content: 'Assess exterior lighting issues.',
                nextStep: 'lights-assessment'
            },
            {
                type: 'final',
                id: 'lights-assessment',
                title: 'EXTERIOR LIGHTS RESPONSE',
                content: 'Exterior lighting issue identified.',
                result: 'Assess safety impact and arrange changeover if needed.'
            }
        ]
    },

    'wing-mirrors': {
        title: 'Wing Mirrors',
        description: 'Mirror damage or adjustment issues',
        priority: 3,
        severity: 'medium',
        icon: '🪞',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Wing Mirror Assessment',
                content: 'Assess mirror damage or issues.',
                nextStep: 'mirror-assessment'
            },
            {
                type: 'final',
                id: 'mirror-assessment',
                title: 'WING MIRROR RESPONSE',
                content: 'Wing mirror issue identified.',
                result: 'Assess visibility impact and safety concerns.'
            }
        ]
    },

    'interior-lights': {
        title: 'Interior Lights',
        description: 'Internal lighting system problems',
        priority: 3,
        severity: 'medium',
        icon: '🔦',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Interior Lights Assessment',
                content: 'Assess interior lighting issues.',
                nextStep: 'interior-lights-assessment'
            },
            {
                type: 'final',
                id: 'interior-lights-assessment',
                title: 'INTERIOR LIGHTS RESPONSE',
                content: 'Interior lighting issue identified.',
                result: 'Check minimum lighting requirements and arrange changeover if needed.'
            }
        ]
    },

    'suspension': {
        title: 'Suspension',
        description: 'Vehicle suspension system problems',
        priority: 3,
        severity: 'medium',
        icon: '🔧',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Suspension Assessment',
                content: 'Assess suspension system issues.',
                nextStep: 'suspension-assessment'
            },
            {
                type: 'final',
                id: 'suspension-assessment',
                title: 'SUSPENSION RESPONSE',
                content: 'Suspension issue identified.',
                result: 'Assess vehicle stability and ride quality.'
            }
        ]
    },

    'warning-lights': {
        title: 'Warning Lights',
        description: 'Dashboard warning light assessment',
        priority: 3,
        severity: 'medium',
        icon: '⚠️',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Warning Lights Assessment',
                content: 'Assess dashboard warning lights.',
                nextStep: 'warning-lights-assessment'
            },
            {
                type: 'final',
                id: 'warning-lights-assessment',
                title: 'WARNING LIGHTS RESPONSE',
                content: 'Warning light issue identified.',
                result: 'Identify light type and severity for appropriate response.'
            }
        ]
    },

    'buzzers': {
        title: 'Buzzers Sounding',
        description: 'Vehicle buzzer and alarm assessment',
        priority: 3,
        severity: 'medium',
        icon: '🔊',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Buzzer Assessment',
                content: 'Assess buzzer alerts and warnings.',
                nextStep: 'buzzer-assessment'
            },
            {
                type: 'final',
                id: 'buzzer-assessment',
                title: 'BUZZER RESPONSE',
                content: 'Buzzer alert identified.',
                result: 'Identify buzzer type and follow appropriate response.'
            }
        ]
    },

    'interior-exterior-damage': {
        title: 'Interior/Exterior Damage',
        description: 'Vehicle damage assessment and safety impact',
        priority: 3,
        severity: 'medium',
        icon: '🔨',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Damage Assessment',
                content: 'Assess vehicle damage for safety impact.',
                nextStep: 'damage-assessment'
            },
            {
                type: 'final',
                id: 'damage-assessment',
                title: 'DAMAGE RESPONSE',
                content: 'Vehicle damage identified.',
                result: 'Assess safety impact and passenger risk.'
            }
        ]
    },

    'repeat-defects': {
        title: 'Repeat Defects',
        description: 'Recurring vehicle defects requiring escalation',
        priority: 3,
        severity: 'medium',
        icon: '🔄',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Repeat Defects Assessment',
                content: 'Address recurring vehicle defects.',
                nextStep: 'repeat-defects-assessment'
            },
            {
                type: 'final',
                id: 'repeat-defects-assessment',
                title: 'REPEAT DEFECTS RESPONSE',
                content: 'Repeat defect identified.',
                result: 'Escalate to engineering management for investigation.'
            }
        ]
    },

    'speedo': {
        title: 'Speedo Not Working',
        description: 'Speedometer malfunction assessment',
        priority: 3,
        severity: 'medium',
        icon: '📊',
        color: '#3b82f6',
        steps: [
            {
                type: 'safety',
                title: 'Speedometer Assessment',
                content: 'Assess speedometer malfunction.',
                nextStep: 'speedo-assessment'
            },
            {
                type: 'final',
                id: 'speedo-assessment',
                title: 'SPEEDOMETER RESPONSE',
                content: 'Speedometer issue identified.',
                result: 'Check tachograph operation and arrange changeover.'
            }
        ]
    }
};

// Export for use in other files
export const wizards = diagnosticFlows;
export default diagnosticFlows;
