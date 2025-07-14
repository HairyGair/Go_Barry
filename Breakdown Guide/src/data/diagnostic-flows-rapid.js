/**
 * RAPID DECISION DIAGNOSTIC FLOWS
 * Go North East - Breakdown Guide  
 * Optimized for 30-60 second control room decisions
 * Version 2.0 - Rapid Decision Support System
 */

const rapidDiagnosticFlows = {
    
    // ========================================
    // CRITICAL SAFETY ISSUES (Priority 1)
    // Target Time: 30-60 seconds each
    // ========================================
    
    'brakes': {
        id: 'brakes',
        title: 'Brake Issues',
        description: 'Brake system problems requiring immediate attention',
        category: 'safety_critical',
        priority: 1,
        estimatedTime: '30-45 seconds',
        severity: 'critical',
        icon: '🛑',
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 5: Brakes',
        steps: [
            {
                id: 'symptoms',
                type: 'question',
                title: 'Are ANY brake symptoms present?',
                subtitle: 'Quick brake safety check',
                urgency: 'critical',
                content: 'Check for any of these critical brake issues:',
                quickCheck: [
                    'Pedal sinks to floor',
                    'Delayed/ineffective braking', 
                    'Grinding/squealing sounds',
                    'Visible brake fluid leaks',
                    'Grabbing/shuddering',
                    'Red ABS light on'
                ],
                options: [
                    { 
                        text: '🚨 YES - Brake symptoms detected', 
                        next: 'stop_immediate',
                        severity: 'critical',
                        action: 'immediate_stop'
                    },
                    { 
                        text: '✅ NO - Brakes working normally', 
                        next: 'continue_normal',
                        severity: 'continue',
                        action: 'continue'
                    }
                ]
            },
            {
                id: 'stop_immediate',
                type: 'final',
                title: '🛑 STOP IMMEDIATELY',
                subtitle: 'Critical brake system failure',
                result: 'VEHICLE MUST STOP - Brake system failure detected',
                urgency: 'immediate_stop',
                severity: 'critical',
                reasoning: 'Brake failure presents extreme danger to all road users',
                actions: [
                    'Stop vehicle in safe location NOW',
                    'Switch off engine immediately', 
                    'Contact Engineering URGENT',
                    'DO NOT move vehicle'
                ],
                contacts: {
                    primary: 'Engineering Team - IMMEDIATE',
                    extensions: 'Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    escalation: 'Depot Engineering Manager'
                },
                documentation: 'Record in Tranzaura (Go-Check) immediately'
            },
            {
                id: 'continue_normal',
                type: 'final',
                title: '✅ Brakes Normal',
                subtitle: 'No brake issues detected',
                result: 'Continue normal operations',
                severity: 'continue',
                actions: [
                    'Continue service as normal',
                    'Monitor brake performance',
                    'Report any changes immediately'
                ]
            }
        ]
    },

    'steering': {
        id: 'steering',
        title: 'Steering Problems',
        description: 'Steering system issues and loss of control',
        category: 'safety_critical',
        priority: 1,
        estimatedTime: '30-45 seconds',
        severity: 'critical',
        icon: '🎯',
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 26: Steering',
        steps: [
            {
                id: 'symptoms',
                type: 'question',
                title: 'Are ANY steering problems present?',
                subtitle: 'Steering safety assessment',
                urgency: 'critical',
                content: 'Check for any steering system issues:',
                quickCheck: [
                    'Excessive play (>75mm at wheel rim)',
                    'Difficulty steering/maintaining control',
                    'Unusual noises (knocking/grinding)',
                    'Vehicle pulling to one side',
                    'Steering damage visible',
                    'Power steering leaks',
                    'Stiff/unresponsive steering',
                    'Steering warning lights'
                ],
                options: [
                    { 
                        text: '🚨 YES - Steering problems detected', 
                        next: 'stop_immediate',
                        severity: 'critical',
                        action: 'immediate_stop'
                    },
                    { 
                        text: '✅ NO - Steering normal', 
                        next: 'continue_normal',
                        severity: 'continue',
                        action: 'continue'
                    }
                ]
            },
            {
                id: 'stop_immediate',
                type: 'final',
                title: '🛑 STOP IMMEDIATELY',
                subtitle: 'Critical steering system failure',
                result: 'VEHICLE MUST STOP - Steering failure detected',
                urgency: 'immediate_stop',
                severity: 'critical',
                reasoning: 'Steering faults can cause immediate loss of vehicle control',
                actions: [
                    'Stop vehicle safely ASAP',
                    'Switch off engine',
                    'Contact Engineering URGENT',
                    'DO NOT attempt to drive'
                ],
                contacts: {
                    primary: 'Engineering Team - URGENT',
                    extensions: 'Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    escalation: 'Depot Engineering Manager'
                },
                documentation: 'Record in Tranzaura immediately'
            },
            {
                id: 'continue_normal',
                type: 'final',
                title: '✅ Steering Normal',
                subtitle: 'No steering issues detected',
                result: 'Continue normal operations',
                severity: 'continue',
                actions: [
                    'Continue service as normal',
                    'Monitor steering performance'
                ]
            }
        ]
    },

    'oil-warning': {
        id: 'oil-warning',
        title: 'Oil Warning Light',
        description: 'Engine oil pressure warning - immediate action required',
        category: 'safety_critical',
        priority: 1,
        estimatedTime: '45-60 seconds',
        severity: 'critical',
        icon: '🛢️',
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 20: Oil Warning Light',
        steps: [
            {
                id: 'immediate_stop',
                type: 'action',
                title: 'Oil Warning - STOP NOW',
                subtitle: 'Immediate action required',
                urgency: 'immediate_stop',
                content: 'Oil warning requires immediate stop to prevent engine damage',
                instructions: [
                    'Stop in safe location immediately',
                    'Switch off engine NOW',
                    'Do NOT restart engine'
                ],
                nextStep: 'leak_check'
            },
            {
                id: 'leak_check',
                type: 'question',
                title: 'Oil leak visible around vehicle?',
                subtitle: 'Visual inspection check',
                urgency: 'critical',
                content: 'Check for visible oil leaks under or around vehicle',
                options: [
                    { 
                        text: '🛢️ YES - Oil leaks visible', 
                        next: 'leak_hazard',
                        severity: 'critical',
                        action: 'hazmat_protocol'
                    },
                    { 
                        text: '❓ NO - No visible leaks', 
                        next: 'engine_failure',
                        severity: 'critical',
                        action: 'engine_failure'
                    }
                ]
            },
            {
                id: 'leak_hazard',
                type: 'final',
                title: '🛑 OIL LEAK - CRITICAL HAZARD',
                subtitle: 'Fire and environmental risk',
                result: 'CRITICAL HAZARD - Oil leak with warning light',
                urgency: 'immediate_stop',
                severity: 'critical',
                reasoning: 'Oil leak presents fire risk and environmental hazard. Potential PG9 prohibition.',
                actions: [
                    'Keep engine OFF',
                    'Vehicle must remain stationary',
                    'Clear area of ignition sources',
                    'Use spill kits if available',
                    'Call fire services if severe'
                ],
                contacts: {
                    primary: 'Engineering Team - IMMEDIATE',
                    secondary: 'Fire services (if severe leak)',
                    additional: 'Environmental authorities (spill)',
                    police: 'Police (if road affected)'
                },
                documentation: 'Record as URGENT in Tranzaura'
            },
            {
                id: 'engine_failure',
                type: 'final',
                title: '🛑 ENGINE FAILURE',
                subtitle: 'Internal engine damage likely',
                result: 'ENGINE FAILURE - Do not restart',
                urgency: 'immediate_stop',
                severity: 'critical',
                reasoning: 'Internal engine failure likely. Restarting would cause catastrophic damage.',
                actions: [
                    'DO NOT restart engine under any circumstances',
                    'Arrange immediate recovery',
                    'Engine likely requires major repair/replacement'
                ],
                contacts: {
                    primary: 'Engineering Team - IMMEDIATE',
                    secondary: 'Recovery services'
                },
                documentation: 'Record as CRITICAL in Tranzaura'
            }
        ]
    },

    'loose-wheel-nuts': {
        id: 'loose-wheel-nuts',
        title: 'Loose Wheel Nuts',
        description: 'Wheel security issue - zero tolerance',
        category: 'safety_critical',
        priority: 1,
        estimatedTime: '15-30 seconds',
        severity: 'critical',
        icon: '🔩',
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 17: Loose Wheel Nuts',
        steps: [
            {
                id: 'immediate_stop',
                type: 'final',
                title: '🛑 LOOSE WHEEL NUTS - STOP NOW',
                subtitle: 'Zero tolerance safety issue',
                result: 'IMMEDIATE STOP - Loose wheel nuts detected',
                urgency: 'immediate_stop',
                severity: 'critical',
                reasoning: 'Loose wheel nuts present immediate danger of wheel detachment',
                actions: [
                    'STOP vehicle immediately',
                    'DO NOT continue under any circumstances',
                    'Contact ALL management levels',
                    'Immediate engineering inspection required'
                ],
                contacts: {
                    immediate: 'Engineering Team - IMMEDIATE',
                    management: [
                        'Depot Engineering Manager',
                        'General Manager', 
                        'Engineering Delivery Director'
                    ]
                },
                documentation: 'URGENT incident documentation required in Tranzaura',
                escalation: 'Report to all management levels immediately'
            }
        ]
    },

    'abs-light': {
        id: 'abs-light',
        title: 'ABS Light Warning',
        description: 'ABS warning light diagnostic procedure',
        category: 'safety_critical',
        priority: 1,
        estimatedTime: '60-90 seconds',
        severity: 'warning',
        icon: '🚨',
        color: '#f59e0b',
        sdcReference: 'SDC Guide Section 3: ABS Light',
        steps: [
            {
                id: 'light_color',
                type: 'question',
                title: 'What color is the ABS light?',
                subtitle: 'Color determines response level',
                urgency: 'warning',
                content: 'ABS light color affects severity of response required',
                options: [
                    { 
                        text: '🔴 RED ABS Light', 
                        next: 'red_reset',
                        severity: 'critical',
                        action: 'critical_reset'
                    },
                    { 
                        text: '🟡 AMBER ABS Light', 
                        next: 'amber_reset',
                        severity: 'warning',
                        action: 'warning_reset'
                    }
                ]
            },
            {
                id: 'red_reset',
                type: 'action',
                title: 'Red ABS - Reset Procedure',
                subtitle: 'Critical ABS system reset',
                urgency: 'critical',
                instructions: [
                    'Stop vehicle safely',
                    'Complete engine shutdown',
                    'Full system reset',
                    'Restart and drive to 10mph',
                    'Check if light remains'
                ],
                timer: 30,
                nextStep: 'red_check'
            },
            {
                id: 'red_check',
                type: 'question',
                title: 'Red ABS light still on after reset?',
                subtitle: 'Post-reset status check',
                urgency: 'critical',
                content: 'Check light status after reset and 10mph test',
                options: [
                    { 
                        text: '🔴 YES - Light still on', 
                        next: 'red_stop',
                        severity: 'critical',
                        action: 'immediate_stop'
                    },
                    { 
                        text: '✅ NO - Light cleared', 
                        next: 'continue_monitor',
                        severity: 'continue',
                        action: 'continue_monitor'
                    }
                ]
            },
            {
                id: 'amber_reset',
                type: 'action',
                title: 'Amber ABS - Reset Procedure',
                subtitle: 'Standard ABS system reset',
                urgency: 'warning',
                instructions: [
                    'Stop vehicle safely',
                    'Complete engine shutdown',
                    'Full system reset',
                    'Restart and drive to 10mph',
                    'Check if light remains'
                ],
                timer: 30,
                nextStep: 'amber_check'
            },
            {
                id: 'amber_check',
                type: 'question',
                title: 'Amber ABS light still on after reset?',
                subtitle: 'Post-reset status check',
                urgency: 'warning',
                content: 'Check light status after reset and 10mph test',
                options: [
                    { 
                        text: '🟡 YES - Light still on', 
                        next: 'amber_changeover',
                        severity: 'warning',
                        action: 'schedule_changeover'
                    },
                    { 
                        text: '✅ NO - Light cleared', 
                        next: 'continue_monitor',
                        severity: 'continue',
                        action: 'continue_monitor'
                    }
                ]
            },
            {
                id: 'red_stop',
                type: 'final',
                title: '🛑 RED ABS PERSISTENT',
                subtitle: 'Critical brake system failure',
                result: 'STOP IMMEDIATELY - Red ABS light persistent',
                urgency: 'immediate_stop',
                severity: 'critical',
                reasoning: 'Persistent red ABS indicates critical brake system failure',
                actions: [
                    'Stop vehicle immediately',
                    'Contact Engineering URGENT',
                    'Record in Tranzaura',
                    'Await engineering assistance'
                ],
                contacts: {
                    primary: 'Engineering Team - IMMEDIATE',
                    escalation: 'Depot Engineering Manager'
                }
            },
            {
                id: 'amber_changeover',
                type: 'final',
                title: '⚠️ AMBER ABS PERSISTENT',
                subtitle: 'Changeover required',
                result: 'Continue service but changeover at earliest convenience',
                urgency: 'warning',
                severity: 'warning',
                reasoning: 'Persistent amber ABS requires changeover but not immediate stop',
                actions: [
                    'Log in Tranzaura',
                    'Arrange changeover at earliest convenience',
                    'Monitor system carefully',
                    'If changes to red, STOP immediately'
                ],
                contacts: {
                    primary: 'Engineering Team - NON-URGENT',
                    action: 'Arrange changeover'
                }
            },
            {
                id: 'continue_monitor',
                type: 'final',
                title: '✅ ABS LIGHT CLEARED',
                subtitle: 'System reset successful',
                result: 'Continue service with monitoring',
                severity: 'continue',
                actions: [
                    'Log reset in Tranzaura',
                    'Continue normal operations',
                    'Monitor for reoccurrence',
                    'If returns, repeat procedure'
                ]
            }
        ]
    }
};

// Export for use in main application
window.rapidDiagnosticFlows = rapidDiagnosticFlows;

// Enhanced metadata for rapid decision system
const rapidSystemMetadata = {
    version: '2.0',
    type: 'rapid_decision_support',
    targetTime: '30-90 seconds per critical issue',
    optimizedFor: 'control_room_staff',
    lastUpdated: new Date().toISOString(),
    totalFlows: Object.keys(rapidDiagnosticFlows).length,
    criticalFlows: Object.values(rapidDiagnosticFlows).filter(f => f.category === 'safety_critical').length,
    sdcCompliant: true
};

window.rapidSystemMetadata = rapidSystemMetadata;

console.log('Rapid Decision Diagnostic Flows loaded:', rapidSystemMetadata);
