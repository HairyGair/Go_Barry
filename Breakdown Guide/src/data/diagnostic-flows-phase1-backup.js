/**
 * RAPID DECISION DIAGNOSTIC FLOWS - Main System
 * Go North East - Breakdown Guide  
 * Optimized for 30-60 second control room decisions
 * Version 2.0 - Rapid Decision Support System
 * 
 * PHASE 1 IMPLEMENTATION: Critical Safety Flows
 * Based on SDC Guide and rapid decision requirements
 */

const diagnosticFlows = {
    
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
                        nextStep: 1,
                        severity: 'critical',
                        action: 'immediate_stop'
                    },
                    { 
                        text: '✅ NO - Brakes working normally', 
                        nextStep: 2,
                        severity: 'continue',
                        action: 'continue'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 STOP IMMEDIATELY',
                subtitle: 'Critical brake system failure',
                content: 'VEHICLE MUST STOP - Brake system failure detected',
                result: 'Stop immediately and await engineering assistance',
                urgency: 'immediate_stop',
                severity: 'stop',
                stopReason: 'Brake failure presents extreme danger to all road users',
                actions: [
                    'Stop vehicle in safe location NOW',
                    'Switch off engine immediately', 
                    'Contact Engineering URGENT',
                    'DO NOT move vehicle'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE RESPONSE',
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    'Escalation: Depot Engineering Manager'
                ],
                documentation: 'Record in Tranzaura (Go-Check) immediately'
            },
            {
                type: 'final',
                title: '✅ Brakes Normal',
                subtitle: 'No brake issues detected',
                content: 'Continue normal operations',
                result: 'Vehicle may continue with normal monitoring',
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
                        nextStep: 1,
                        severity: 'critical',
                        action: 'immediate_stop'
                    },
                    { 
                        text: '✅ NO - Steering normal', 
                        nextStep: 2,
                        severity: 'continue',
                        action: 'continue'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 STOP IMMEDIATELY',
                subtitle: 'Critical steering system failure',
                content: 'VEHICLE MUST STOP - Steering failure detected',
                result: 'Stop immediately due to steering system failure',
                urgency: 'immediate_stop',
                severity: 'stop',
                stopReason: 'Steering faults can cause immediate loss of vehicle control',
                actions: [
                    'Stop vehicle safely ASAP',
                    'Switch off engine',
                    'Contact Engineering URGENT',
                    'DO NOT attempt to drive'
                ],
                contacts: [
                    'Engineering Team - URGENT',
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    'Escalation: Depot Engineering Manager'
                ],
                documentation: 'Record in Tranzaura immediately'
            },
            {
                type: 'final',
                title: '✅ Steering Normal',
                subtitle: 'No steering issues detected',
                content: 'Continue normal operations',
                result: 'Vehicle may continue with normal monitoring',
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
                type: 'info',
                title: 'Oil Warning - STOP NOW',
                subtitle: 'Immediate action required',
                content: 'Oil warning requires immediate stop to prevent engine damage',
                warning: '🚨 CRITICAL: Stop immediately when oil warning appears'
            },
            {
                type: 'action',
                title: 'Immediate Stop Procedure',
                content: 'Follow these steps immediately:',
                instructions: [
                    'Stop in safe location immediately',
                    'Switch off engine NOW',
                    'Check for oil leaks around vehicle',
                    'Do NOT restart engine'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Oil leak visible around vehicle?',
                subtitle: 'Visual inspection check',
                urgency: 'critical',
                content: 'Check for visible oil leaks under or around vehicle',
                options: [
                    { 
                        text: '🛢️ YES - Oil leaks visible', 
                        nextStep: 3,
                        severity: 'critical',
                        action: 'hazmat_protocol'
                    },
                    { 
                        text: '❓ NO - No visible leaks', 
                        nextStep: 4,
                        severity: 'critical',
                        action: 'engine_failure'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 OIL LEAK - CRITICAL HAZARD',
                subtitle: 'Fire and environmental risk',
                content: 'Oil leak detected with warning light',
                result: 'Vehicle must remain stopped. Critical fire and environmental hazard.',
                urgency: 'immediate_stop',
                severity: 'stop',
                stopReason: 'Oil leak presents fire risk and environmental hazard. May result in PG9 prohibition.',
                actions: [
                    'Keep engine OFF',
                    'Vehicle must remain stationary',
                    'Clear area of ignition sources',
                    'Use spill kits if available',
                    'Call fire services if severe leak',
                    'Notify authorities for road cleanup if needed'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    'Fire services (if severe leak)',
                    'Environmental authorities (spill)',
                    'Police (if road affected)'
                ]
            },
            {
                type: 'final',
                title: '🛑 ENGINE FAILURE',
                subtitle: 'Internal engine damage likely',
                content: 'Oil warning without visible leaks indicates engine failure',
                result: 'Engine failure likely. Vehicle must not be restarted.',
                urgency: 'immediate_stop',
                severity: 'stop',
                stopReason: 'Internal engine failure likely. Running engine would cause catastrophic damage.',
                actions: [
                    'DO NOT restart engine under any circumstances',
                    'Arrange immediate recovery',
                    'Engine likely requires major repair/replacement'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Recovery services'
                ]
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
                type: 'final',
                title: '🛑 LOOSE WHEEL NUTS - STOP NOW',
                subtitle: 'Zero tolerance safety issue',
                content: 'Loose wheel nuts detected',
                result: 'Vehicle must stop immediately. Zero tolerance for wheel security issues.',
                urgency: 'immediate_stop',
                severity: 'stop',
                stopReason: 'Loose wheel nuts present immediate danger of wheel detachment',
                actions: [
                    'STOP vehicle immediately',
                    'DO NOT continue under any circumstances',
                    'Contact ALL management levels',
                    'Immediate engineering inspection required',
                    'Complete incident documentation'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    'Depot Engineering Manager',
                    'General Manager',
                    'Engineering Delivery Director'
                ],
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
                type: 'question',
                title: 'What color is the ABS light?',
                subtitle: 'Color determines response level',
                urgency: 'warning',
                content: 'ABS light color affects severity of response required',
                options: [
                    { 
                        text: '🔴 RED ABS Light', 
                        nextStep: 1,
                        severity: 'critical',
                        action: 'critical_reset'
                    },
                    { 
                        text: '🟡 AMBER ABS Light', 
                        nextStep: 4,
                        severity: 'warning',
                        action: 'warning_reset'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Red ABS - Reset Procedure',
                subtitle: 'Critical ABS system reset',
                urgency: 'critical',
                content: 'Follow this reset procedure for red ABS light:',
                instructions: [
                    'Stop vehicle safely',
                    'Complete engine shutdown',
                    'Full system reset',
                    'Restart and drive to 10mph',
                    'Check if light remains'
                ],
                timer: 30,
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Red ABS light still on after reset?',
                subtitle: 'Post-reset status check',
                urgency: 'critical',
                content: 'Check light status after reset and 10mph test',
                options: [
                    { 
                        text: '🔴 YES - Light still on', 
                        nextStep: 3,
                        severity: 'critical',
                        action: 'immediate_stop'
                    },
                    { 
                        text: '✅ NO - Light cleared', 
                        nextStep: 7,
                        severity: 'continue',
                        action: 'continue_monitor'
                    }
                ]
            },
            {
                type: 'final',
                title: '🛑 RED ABS PERSISTENT',
                subtitle: 'Critical brake system failure',
                content: 'Red ABS light remains on after reset',
                result: 'Vehicle must stop and await engineering assistance.',
                urgency: 'immediate_stop',
                severity: 'stop',
                stopReason: 'Persistent red ABS indicates critical brake system failure',
                actions: [
                    'Stop vehicle immediately',
                    'Contact Engineering URGENT',
                    'Record in Tranzaura',
                    'Await engineering assistance'
                ],
                contacts: [
                    'Engineering Team - IMMEDIATE',
                    'Extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413',
                    'Escalation: Depot Engineering Manager'
                ]
            },
            {
                type: 'action',
                title: 'Amber ABS - Reset Procedure',
                subtitle: 'Standard ABS system reset',
                urgency: 'warning',
                content: 'Follow this reset procedure for amber ABS light:',
                instructions: [
                    'Stop vehicle safely',
                    'Complete engine shutdown',
                    'Full system reset',
                    'Restart and drive to 10mph',
                    'Check if light remains'
                ],
                timer: 30,
                nextStep: 5
            },
            {
                type: 'question',
                title: 'Amber ABS light still on after reset?',
                subtitle: 'Post-reset status check',
                urgency: 'warning',
                content: 'Check light status after reset and 10mph test',
                options: [
                    { 
                        text: '🟡 YES - Light still on', 
                        nextStep: 6,
                        severity: 'warning',
                        action: 'schedule_changeover'
                    },
                    { 
                        text: '✅ NO - Light cleared', 
                        nextStep: 7,
                        severity: 'continue',
                        action: 'continue_monitor'
                    }
                ]
            },
            {
                type: 'final',
                title: '⚠️ AMBER ABS PERSISTENT',
                subtitle: 'Changeover required',
                content: 'Amber ABS light remains on after reset',
                result: 'Vehicle may continue but changeover required at earliest convenience.',
                urgency: 'warning',
                severity: 'warning',
                actions: [
                    'Log in Tranzaura',
                    'Arrange changeover at earliest convenience',
                    'Monitor system carefully',
                    'If changes to red, STOP immediately'
                ],
                contacts: [
                    'Engineering Team - NON-URGENT',
                    'Arrange changeover'
                ]
            },
            {
                type: 'final',
                title: '✅ ABS LIGHT CLEARED',
                subtitle: 'System reset successful',
                content: 'ABS light has cleared after reset',
                result: 'Vehicle may continue in service with monitoring.',
                severity: 'continue',
                actions: [
                    'Log reset procedure in Tranzaura',
                    'Continue normal operations',
                    'Monitor for reoccurrence',
                    'If returns, repeat procedure'
                ]
            }
        ]
    }
};

// Make diagnosticFlows globally available
window.diagnosticFlows = diagnosticFlows;

// Enhanced metadata for rapid decision system
const systemMetadata = {
    version: '2.0',
    type: 'rapid_decision_support',
    targetTime: '30-90 seconds per critical issue',
    optimizedFor: 'control_room_staff',
    lastUpdated: new Date().toISOString(),
    totalFlows: Object.keys(diagnosticFlows).length,
    criticalFlows: Object.values(diagnosticFlows).filter(f => f.category === 'safety_critical').length,
    sdcCompliant: true,
    phase: 'Phase 1 - Critical Safety Flows Complete'
};

window.systemMetadata = systemMetadata;

console.log('Rapid Decision Diagnostic Flows loaded - Phase 1:', systemMetadata);
console.log('Critical flows available:', Object.keys(diagnosticFlows));
