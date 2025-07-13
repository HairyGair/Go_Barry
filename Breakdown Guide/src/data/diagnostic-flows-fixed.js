                            condition: { field: 'value', equals: 'still-on' },
                            nextStep: 'amber-persistent-changeover'
                        },
                        {
                            id: 'amber-cleared',
                            label: 'Light Cleared - Continue',
                            type: 'success',
                            condition: { field: 'value', equals: 'cleared' },
                            nextStep: 'light-cleared-success'
                        }
                    ]
                },
                'amber-persistent-changeover': {
                    id: 'amber-persistent-changeover',
                    type: 'info',
                    title: '⚠️ AMBER ABS LIGHT PERSISTENT',
                    content: {
                        alert: {
                            type: 'warning',
                            text: 'Amber ABS light remains on after reset. Vehicle may continue but changeover required.'
                        },
                        instructions: [
                            'Log defect in Go-Check system',
                            'Arrange changeover at earliest convenience',
                            'Monitor system carefully',
                            'If light changes to red, stop immediately'
                        ],
                        reminder: 'Continue monitoring ABS system during operation'
                    },
                    actions: [
                        {
                            id: 'arrange-changeover',
                            label: 'Arrange Changeover',
                            type: 'warning',
                            logAction: 'Amber ABS persistent - changeover required',
                            nextStep: 'complete'
                        }
                    ]
                },
                'light-cleared-success': {
                    id: 'light-cleared-success',
                    type: 'summary',
                    title: '✅ ABS LIGHT CLEARED',
                    content: {
                        alert: {
                            type: 'success',
                            text: 'ABS light has cleared after reset. Vehicle may continue with monitoring.'
                        }
                    },
                    actions: [
                        {
                            id: 'continue-monitoring',
                            label: 'Continue Service with Monitoring',
                            type: 'success',
                            logAction: 'ABS light cleared - continue with monitoring',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'ABS Light Diagnostic Complete',
                    content: {
                        description: 'ABS light diagnostic procedure has been completed.'
                    }
                }
            }
        }
    },

    'oil-warning': {
        id: 'oil-warning',
        title: 'Oil Warning Light',
        description: 'Engine oil pressure warning - immediate action required',
        priority: 1,
        severity: 'critical',
        icon: '🛢️',
        color: '#dc2626',
        flow: {
            start: 'immediate-stop',
            steps: {
                'immediate-stop': {
                    id: 'immediate-stop',
                    type: 'critical-action',
                    title: '🛑 OIL WARNING - STOP IMMEDIATELY',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'CRITICAL ENGINE WARNING',
                            text: 'Oil warning light requires immediate stop to prevent engine damage'
                        },
                        instructions: [
                            'Stop vehicle in safe location immediately',
                            'Switch off engine',
                            'Check for visible oil leaks around vehicle',
                            'Do not restart engine',
                            'Contact engineering immediately'
                        ],
                        warning: {
                            type: 'critical',
                            text: '🚨 CRITICAL: Stop immediately when oil warning appears'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Vehicle stopped and engine switched off',
                    actions: [
                        {
                            id: 'stopped-check-leaks',
                            label: 'Vehicle Stopped - Check for Leaks',
                            type: 'danger',
                            requiresConfirmation: true,
                            nextStep: 'leak-check'
                        }
                    ]
                },
                'leak-check': {
                    id: 'leak-check',
                    type: 'radio',
                    title: 'Oil Leak Inspection',
                    content: {
                        description: 'Are there visible oil leaks under or around the vehicle?',
                        options: [
                            {
                                id: 'leaks-visible',
                                label: 'Yes - Oil leaks visible',
                                value: 'leaks-present'
                            },
                            {
                                id: 'no-leaks',
                                label: 'No - No visible leaks',
                                value: 'no-leaks'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'leaks-detected',
                            label: 'Leaks Detected - Critical Hazard',
                            type: 'danger',
                            condition: { field: 'value', equals: 'leaks-present' },
                            nextStep: 'oil-leak-critical'
                        },
                        {
                            id: 'no-leaks-detected',
                            label: 'No Leaks - Engine Failure',
                            type: 'danger',
                            condition: { field: 'value', equals: 'no-leaks' },
                            nextStep: 'engine-failure'
                        }
                    ]
                },
                'oil-leak-critical': {
                    id: 'oil-leak-critical',
                    type: 'critical-action',
                    title: '🛑 OIL LEAK - CRITICAL HAZARD',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'ENVIRONMENTAL & FIRE HAZARD',
                            text: 'Oil leak detected with warning light - Critical fire and environmental hazard'
                        },
                        instructions: [
                            'Keep engine switched off',
                            'Ensure vehicle remains stationary',
                            'Clear area of ignition sources',
                            'Use spill kits if available',
                            'Contact fire services if leak is severe',
                            'Notify local authorities for road cleanup if needed'
                        ],
                        additionalInfo: {
                            title: 'Emergency Contacts',
                            items: [
                                'Engineering Team - IMMEDIATE',
                                'Fire services (if severe leak)',
                                'Environmental authorities (for spill)',
                                'Police (if road affected)'
                            ]
                        },
                        warning: {
                            type: 'critical',
                            text: 'Oil leak presents fire risk and environmental hazard. May result in PG9 prohibition.'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'All safety measures implemented and authorities contacted',
                    actions: [
                        {
                            id: 'complete-hazard-response',
                            label: 'Complete Hazard Response',
                            type: 'danger',
                            requiresConfirmation: true,
                            logAction: 'CRITICAL HAZARD - Oil leak with environmental risk',
                            nextStep: 'complete'
                        }
                    ]
                },
                'engine-failure': {
                    id: 'engine-failure',
                    type: 'critical-action',
                    title: '🛑 ENGINE FAILURE - NO LEAKS',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'INTERNAL ENGINE FAILURE',
                            text: 'Oil warning without visible leaks indicates internal engine failure'
                        },
                        instructions: [
                            'Do not restart engine under any circumstances',
                            'Arrange immediate recovery',
                            'Engine likely requires major repair or replacement'
                        ],
                        warning: {
                            type: 'critical',
                            text: 'Internal engine failure likely. Running engine would cause catastrophic damage.'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Recovery arranged and engine will not be restarted',
                    actions: [
                        {
                            id: 'complete-engine-failure',
                            label: 'Complete Engine Failure Protocol',
                            type: 'danger',
                            requiresConfirmation: true,
                            logAction: 'CRITICAL FAILURE - Internal engine failure',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'Oil Warning Diagnostic Complete',
                    content: {
                        description: 'Oil warning light diagnostic has been completed. Vehicle must remain out of service.'
                    }
                }
            }
        }
    },

    'loose-wheel-nuts': {
        id: 'loose-wheel-nuts',
        title: 'Loose Wheel Nuts',
        description: 'Wheel security issue - zero tolerance',
        priority: 1,
        severity: 'critical',
        icon: '🔩',
        color: '#dc2626',
        flow: {
            start: 'immediate-stop',
            steps: {
                'immediate-stop': {
                    id: 'immediate-stop',
                    type: 'critical-action',
                    title: '🛑 LOOSE WHEEL NUTS - STOP IMMEDIATELY',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'ZERO TOLERANCE - WHEEL SECURITY',
                            text: 'Loose wheel nuts present immediate danger of wheel detachment'
                        },
                        instructions: [
                            'Stop vehicle immediately',
                            'Do not continue under any circumstances',
                            'Contact multiple levels of management',
                            'Arrange immediate engineering inspection',
                            'Complete incident documentation'
                        ],
                        additionalInfo: {
                            title: 'Required Contacts',
                            items: [
                                'Engineering Team - IMMEDIATE',
                                'Depot Engineering Manager',
                                'General Manager', 
                                'Engineering Delivery Director'
                            ]
                        },
                        warning: {
                            type: 'critical',
                            text: 'Loose wheel nuts present immediate danger of wheel detachment - Zero tolerance policy'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Vehicle stopped and all required management levels contacted',
                    actions: [
                        {
                            id: 'complete-wheel-nut-stop',
                            label: 'Complete Zero-Tolerance Protocol',
                            type: 'danger',
                            requiresConfirmation: true,
                            logAction: 'CRITICAL SAFETY - Loose wheel nuts detected',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'Loose Wheel Nuts Protocol Complete',
                    content: {
                        description: 'Zero tolerance protocol for loose wheel nuts has been completed. Vehicle must remain out of service until full inspection.'
                    }
                }
            }
        }
    },

    'steering': {
        id: 'steering',
        title: 'Steering Problems',
        description: 'Steering system issues and loss of control',
        priority: 1,
        severity: 'critical',
        icon: '🎯',
        color: '#dc2626',
        flow: {
            start: 'initial-assessment',
            steps: {
                'initial-assessment': {
                    id: 'initial-assessment',
                    type: 'info',
                    title: 'Steering Assessment',
                    content: {
                        description: 'Steering problems can result in immediate loss of vehicle control.',
                        warning: {
                            type: 'critical',
                            text: '🚨 SAFETY CRITICAL: Steering issues can cause loss of control'
                        }
                    },
                    actions: [
                        {
                            id: 'check-symptoms',
                            label: 'Check Steering Symptoms',
                            type: 'primary',
                            nextStep: 'symptoms-check'
                        }
                    ]
                },
                'symptoms-check': {
                    id: 'symptoms-check',
                    type: 'checklist',
                    title: 'Steering Symptoms Check',
                    content: {
                        description: 'Check if any of these steering symptoms are present:',
                        items: [
                            {
                                id: 'excessive-play',
                                label: 'Excessive play in steering wheel (more than 75mm at rim)',
                                critical: true
                            },
                            {
                                id: 'difficulty-steering',
                                label: 'Difficulty steering or maintaining control',
                                critical: true
                            },
                            {
                                id: 'unusual-noises',
                                label: 'Unusual noises when steering (knocking, grinding, squealing)',
                                critical: true
                            },
                            {
                                id: 'pulling-to-side',
                                label: 'Vehicle pulling to one side during operation',
                                critical: true
                            },
                            {
                                id: 'visible-damage',
                                label: 'Visible damage to steering system',
                                critical: true
                            },
                            {
                                id: 'power-steering-leaks',
                                label: 'Leaks from power steering system',
                                critical: true
                            },
                            {
                                id: 'stiff-unresponsive',
                                label: 'Steering becomes stiff or unresponsive',
                                critical: true
                            },
                            {
                                id: 'warning-lights',
                                label: 'Any warning light related to steering',
                                critical: true
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'steering-problems',
                            label: 'Steering Problems Present - STOP',
                            type: 'danger',
                            condition: 'anySelected',
                            nextStep: 'steering-stop',
                            requiresConfirmation: true
                        },
                        {
                            id: 'steering-normal',
                            label: 'Steering Normal',
                            type: 'success',
                            condition: 'noneSelected',
                            nextStep: 'steering-ok'
                        }
                    ]
                },
                'steering-stop': {
                    id: 'steering-stop',
                    type: 'critical-action',
                    title: '🛑 STOP IMMEDIATELY - STEERING FAULT',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'STEERING SYSTEM FAILURE',
                            text: 'Steering system failure detected - Loss of control risk'
                        },
                        instructions: [
                            'Stop vehicle safely as soon as possible',
                            'Switch off engine',
                            'Contact engineering immediately',
                            'Do not attempt to drive vehicle'
                        ],
                        warning: {
                            type: 'critical',
                            text: 'Steering faults can cause immediate loss of vehicle control.'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Vehicle stopped and engineering contacted',
                    actions: [
                        {
                            id: 'complete-steering-stop',
                            label: 'Complete Steering Stop Protocol',
                            type: 'danger',
                            requiresConfirmation: true,
                            logAction: 'CRITICAL STOP - Steering system failure',
                            nextStep: 'complete'
                        }
                    ]
                },
                'steering-ok': {
                    id: 'steering-ok',
                    type: 'summary',
                    title: '✅ Steering Normal',
                    content: {
                        alert: {
                            type: 'success',
                            text: 'No steering issues detected. Vehicle may continue with normal monitoring.'
                        }
                    },
                    actions: [
                        {
                            id: 'continue-normal',
                            label: 'Continue Normal Operations',
                            type: 'success',
                            logAction: 'Steering normal - continue service',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'Steering Diagnostic Complete',
                    content: {
                        description: 'Steering system diagnostic has been completed.'
                    }
                }
            }
        }
    },

    'overheating': {
        id: 'overheating',
        title: 'Engine Overheating',
        description: 'Engine temperature issues and cooling system problems',
        priority: 2,
        severity: 'warning',
        icon: '🌡️',
        color: '#f59e0b',
        flow: {
            start: 'temperature-check',
            steps: {
                'temperature-check': {
                    id: 'temperature-check',
                    type: 'radio',
                    title: 'Engine Temperature Check',
                    content: {
                        description: 'What is the current engine temperature reading?',
                        options: [
                            {
                                id: 'temp-80-100',
                                label: '80-100°C',
                                value: '80-100'
                            },
                            {
                                id: 'temp-over-100',
                                label: 'Over 100°C',
                                value: 'over-100'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'elevated-temp',
                            label: 'Elevated Temperature - Continue to Changeover',
                            type: 'warning',
                            condition: { field: 'value', equals: '80-100' },
                            nextStep: 'elevated-continue'
                        },
                        {
                            id: 'high-temp',
                            label: 'High Temperature - Assess Cause',
                            type: 'danger',
                            condition: { field: 'value', equals: 'over-100' },
                            nextStep: 'cause-assessment'
                        }
                    ]
                },
                'elevated-continue': {
                    id: 'elevated-continue',
                    type: 'info',
                    title: '⚠️ ELEVATED TEMPERATURE',
                    content: {
                        alert: {
                            type: 'warning',
                            text: 'Temperature 80-100°C detected - Monitor and arrange changeover'
                        },
                        instructions: [
                            'Continue to next convenient changeover point',
                            'Monitor temperature continuously',
                            'Arrange changeover',
                            'If temperature rises above 100°C, stop immediately'
                        ]
                    },
                    actions: [
                        {
                            id: 'arrange-changeover',
                            label: 'Arrange Changeover',
                            type: 'warning',
                            logAction: 'Elevated temperature - changeover arranged',
                            nextStep: 'complete'
                        }
                    ]
                },
                'cause-assessment': {
                    id: 'cause-assessment',
                    type: 'radio',
                    title: 'Overheating Cause Assessment',
                    content: {
                        description: 'What appears to be causing the overheating?',
                        options: [
                            {
                                id: 'low-water',
                                label: 'Low Water Level',
                                value: 'low-water'
                            },
                            {
                                id: 'other-cause',
                                label: 'Other/Unknown Cause',
                                value: 'other'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'water-issue',
                            label: 'Low Water - Check Buzzer',
                            type: 'warning',
                            condition: { field: 'value', equals: 'low-water' },
                            nextStep: 'water-buzzer-check'
                        },
                        {
                            id: 'other-issue',
                            label: 'Other Cause - Heat Dispersion',
                            type: 'warning',
                            condition: { field: 'value', equals: 'other' },
                            nextStep: 'heat-dispersion'
                        }
                    ]
                },
                'water-buzzer-check': {
                    id: 'water-buzzer-check',
                    type: 'radio',
                    title: 'Water Buzzer Status',
                    content: {
                        description: 'Is the water buzzer sounding?',
                        options: [
                            {
                                id: 'no-buzzer',
                                label: 'No buzzer sounding',
                                value: 'no-buzzer'
                            },
                            {
                                id: 'buzzer-sounding',
                                label: 'Buzzer is sounding',
                                value: 'buzzer-on'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'no-buzzer-continue',
                            label: 'Continue to Changeover',
                            type: 'primary',
                            condition: { field: 'value', equals: 'no-buzzer' },
                            nextStep: 'continue-changeover'
                        },
                        {
                            id: 'buzzer-leak-check',
                            label: 'Check for Water Leaks',
                            type: 'warning',
                            condition: { field: 'value', equals: 'buzzer-on' },
                            nextStep: 'leak-inspection'
                        }
                    ]
                },
                'leak-inspection': {
                    id: 'leak-inspection',
                    type: 'radio',
                    title: 'Water Leak Inspection',
                    content: {
                        description: 'Check for visible water leaks (SAFELY - do not step into highway):',
                        options: [
                            {
                                id: 'leaks-present',
                                label: 'Leaks present',
                                value: 'leaks'
                            },
                            {
                                id: 'no-leaks',
                                label: 'No leaks visible',
                                value: 'no-leaks'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'leak-detected',
                            label: 'Water Leak - STOP',
                            type: 'danger',
                            condition: { field: 'value', equals: 'leaks' },
                            nextStep: 'water-leak-stop'
                        },
                        {
                            id: 'no-leak-detected',
                            label: 'No Leaks - Heat Dispersion',
                            type: 'warning',
                            condition: { field: 'value', equals: 'no-leaks' },
                            nextStep: 'heat-dispersion'
                        }
                    ]
                },
                'water-leak-stop': {
                    id: 'water-leak-stop',
                    type: 'critical-action',
                    title: '🛑 WATER LEAK DETECTED',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'COOLING SYSTEM FAILURE',
                            text: 'Water leak identified with buzzer sounding'
                        },
                        instructions: [
                            'Stop vehicle immediately',
                            'Switch off engine',
                            'Contact engineering team',
                            'Do not attempt to continue'
                        ],
                        warning: {
                            type: 'critical',
                            text: 'Water leak with buzzer indicates immediate cooling system failure.'
                        }
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Vehicle stopped and engineering contacted',
                    actions: [
                        {
                            id: 'complete-leak-stop',
                            label: 'Complete Water Leak Protocol',
                            type: 'danger',
                            requiresConfirmation: true,
                            logAction: 'CRITICAL STOP - Water leak with cooling failure',
                            nextStep: 'complete'
                        }
                    ]
                },
                'heat-dispersion': {
                    id: 'heat-dispersion',
                    type: 'timer-action',
                    title: 'Heat Dispersion Procedure',
                    content: {
                        alert: {
                            type: 'info',
                            title: 'HEAT DISPERSION ATTEMPT',
                            text: 'Use heaters and demisters to disperse heat from the cooling system'
                        },
                        instructions: [
                            'Turn on all heaters to maximum',
                            'Turn on all demisters',
                            'Monitor temperature gauge carefully',
                            'Wait for temperature stabilization'
                        ],
                        timerDuration: 60,
                        timerMessage: 'Monitoring heat dispersion - please wait'
                    },
                    actions: [
                        {
                            id: 'heat-dispersion-result',
                            label: 'Check Heat Dispersion Result',
                            type: 'primary',
                            nextStep: 'dispersion-result'
                        }
                    ]
                },
                'dispersion-result': {
                    id: 'dispersion-result',
                    type: 'radio',
                    title: 'Heat Dispersion Result',
                    content: {
                        description: 'Has the heat dispersion procedure stabilized the temperature?',
                        options: [
                            {
                                id: 'temp-stabilized',
                                label: 'Temperature stabilized',
                                value: 'stabilized'
                            },
                            {
                                id: 'temp-persistent',
                                label: 'Problem persists',
                                value: 'persistent'
                            }
                        ]
                    },
                    actions: [
                        {
                            id: 'dispersion-success',
                            label: 'Continue with Heat Dispersion',
                            type: 'success',
                            condition: { field: 'value', equals: 'stabilized' },
                            nextStep: 'dispersion-success'
                        },
                        {
                            id: 'dispersion-failed',
                            label: 'Heat Dispersion Failed - STOP',
                            type: 'danger',
                            condition: { field: 'value', equals: 'persistent' },
                            nextStep: 'overheating-stop'
                        }
                    ]
                },
                'dispersion-success': {
                    id: 'dispersion-success',
                    type: 'info',
                    title: '✅ HEAT DISPERSION SUCCESSFUL',
                    content: {
                        alert: {
                            type: 'success',
                            text: 'Temperature controlled using heat dispersion'
                        },
                        instructions: [
                            'Continue to convenient changeover point',
                            'Keep heaters and demisters on',
                            'Monitor temperature continuously'
                        ]
                    },
                    actions: [
                        {
                            id: 'continue-monitoring',
                            label: 'Continue with Monitoring',
                            type: 'success',
                            logAction: 'Overheating controlled - continue with monitoring',
                            nextStep: 'complete'
                        }
                    ]
                },
                'overheating-stop': {
                    id: 'overheating-stop',
                    type: 'critical-action',
                    title: '🛑 OVERHEATING PERSISTS - STOP',
                    content: {
                        alert: {
                            type: 'critical',
                            title: 'COOLING SYSTEM FAILURE',
                            text: 'Heat dispersion failed - cooling system failure'
                        },
                        instructions: [
                            'Stop vehicle immediately',
                            'Switch off engine',
                            'Contact engineering assistance',
                            'Do not attempt to restart'
                        ]
                    },
                    requiresConfirmation: true,
                    confirmationText: 'Vehicle stopped due to persistent overheating',
                    actions: [
                        {
                            id: 'complete-overheating-stop',
                            label: 'Complete Overheating Protocol',
                            type: 'danger',
                            requiresConfirmation: true,
                            logAction: 'CRITICAL STOP - Persistent overheating',
                            nextStep: 'complete'
                        }
                    ]
                },
                'continue-changeover': {
                    id: 'continue-changeover',
                    type: 'info',
                    title: '✅ CONTINUE TO CHANGEOVER',
                    content: {
                        alert: {
                            type: 'success',
                            text: 'No immediate danger, but changeover needed'
                        },
                        instructions: [
                            'Continue to changeover point',
                            'Monitor temperature continuously'
                        ]
                    },
                    actions: [
                        {
                            id: 'arrange-changeover',
                            label: 'Arrange Changeover',
                            type: 'warning',
                            logAction: 'Low water level - changeover required',
                            nextStep: 'complete'
                        }
                    ]
                },
                'complete': {
                    id: 'complete',
                    type: 'summary',
                    title: 'Overheating Diagnostic Complete',
                    content: {
                        description: 'Engine overheating diagnostic has been completed.'
                    }
                }
            }
        }
    }
};

// Make diagnosticFlows globally available
window.diagnosticFlows = diagnosticFlows;

console.log('Fixed Diagnostic Flows loaded with', Object.keys(diagnosticFlows).length, 'issues');
