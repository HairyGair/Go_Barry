/**
 * Emergency Procedures Module
 * Contains diagnostic flows for emergency situations
 * Priority 1 emergency responses and safety procedures
 */

const EMERGENCY_PROCEDURES_MODULE = {
    
    // ROAD TRAFFIC INCIDENTS
    'road-traffic-incident': {
        id: 'road-traffic-incident', 
        title: 'Road Traffic Incident', 
        category: 'emergency', 
        priority: 1,
        estimatedTime: '120-180 seconds', 
        severity: 'critical', 
        icon: '🚨', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 2: Road Traffic Incidents',
        steps: [
            {
                type: 'action', 
                title: 'Check Driver\'s Wellbeing',
                subtitle: 'First priority - driver safety and fitness',
                instructions: [
                    'Assess driver\'s emotional state',
                    'Check if driver seems distressed or unfit to proceed',
                    'Offer reassurance: "Take a moment to gather yourself"',
                    'If driver unwell, arrange supervisor attendance immediately'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Is the driver fit to continue?',
                options: [
                    { text: '✅ YES - Driver is fit and well', nextStep: 2, severity: 'continue' },
                    { text: '🚨 NO - Driver unfit/distressed', nextStep: 10, severity: 'stop' }
                ]
            },
            {
                type: 'question', 
                title: 'Check for injuries on the bus',
                subtitle: 'Ask: "Is anyone on the bus injured?"',
                options: [
                    { text: '🚨 YES - Injuries reported', nextStep: 3, severity: 'medical' },
                    { text: '✅ NO - No injuries', nextStep: 5, severity: 'continue' }
                ]
            },
            {
                type: 'action', 
                title: 'Handle injuries',
                instructions: [
                    'Confirm: "Have you offered to assist them or seek medical help?"',
                    'Follow up: "What response did you get from the injured person?"',
                    'Reassure driver: their role is to assist where possible and remain calm'
                ],
                nextStep: 4
            },
            {
                type: 'action', 
                title: 'Arrange medical assistance',
                instructions: [
                    'Coordinate medical help for injured passengers',
                    'Keep detailed records of incident',
                    'Ensure passenger welfare is priority'
                ],
                nextStep: 5
            },
            {
                type: 'question', 
                title: 'Check police involvement',
                subtitle: 'Ask: "Have the police been notified about the incident?"',
                options: [
                    { text: '✅ YES - Police notified', nextStep: 6, severity: 'continue' },
                    { text: '❌ NO - Police not notified', nextStep: 7, severity: 'action' }
                ]
            },
            {
                type: 'action', 
                title: 'Police attendance confirmed',
                instructions: [
                    'Ask: "Do you know if they are coming to the scene?"',
                    'Advise on next steps based on police response',
                    'Coordinate with police arrival'
                ],
                nextStep: 8
            },
            {
                type: 'action', 
                title: 'Advise police notification',
                instructions: [
                    'If someone injured: "It\'s important to notify police ASAP"',
                    'Offer guidance: "I can help guide you through this if needed"',
                    'Ensure proper reporting procedures followed'
                ],
                nextStep: 6
            },
            {
                type: 'question', 
                title: 'Assess driver\'s physical condition',
                subtitle: 'Ask: "Are you injured in any way? Can you continue duties safely?"',
                options: [
                    { text: '✅ Driver uninjured and able to continue', nextStep: 9, severity: 'continue' },
                    { text: '🚨 Driver injured', nextStep: 11, severity: 'medical' }
                ]
            },
            {
                type: 'action', 
                title: 'Evaluate bus damage',
                subtitle: 'Bus damage assessment and engineering consultation',
                instructions: [
                    'Ask: "Can you describe any damage to the bus?"',
                    'Check for: sharp edges, loose parts, damaged lights',
                    'Advise driver to input damage into Go-Check',
                    'Consult qualified engineering colleague for decision'
                ],
                nextStep: 12
            },
            {
                type: 'final', 
                title: '🚨 Driver Unfit - Immediate Support', 
                result: 'Arrange immediate supervisor attendance',
                severity: 'stop',
                actions: [
                    'Arrange supervisor to attend immediately', 
                    'Provide support and reassurance to driver', 
                    'Ensure driver safety and wellbeing'
                ],
                contacts: ['Supervisor - IMMEDIATE', 'Medical assistance if needed']
            },
            {
                type: 'final', 
                title: '🚨 Driver Injured - Medical Care', 
                result: 'Arrange replacement driver and medical attention',
                severity: 'medical',
                actions: [
                    'Get replacement driver to location', 
                    'Ensure driver gets medical care needed', 
                    'Driver rest and recovery priority'
                ],
                contacts: ['Replacement driver', 'Medical services']
            },
            {
                type: 'action', 
                title: 'Engineering decision and follow-up',
                subtitle: 'Complete incident procedures',
                instructions: [
                    'Engineering will decide if bus can:',
                    '• Continue in service',
                    '• Return to depot out of service', 
                    '• Remain stationary for engineer attendance',
                    'Provide reassurance to driver',
                    'Complete all necessary reports including tracerit within 24 hours',
                    'Record defects on Go-Check System',
                    'Report all personal injuries',
                    'Leave bump card if third party not present'
                ],
                nextStep: 13
            },
            {
                type: 'final', 
                title: '✅ Incident Managed', 
                result: 'All procedures completed safely',
                severity: 'complete',
                actions: [
                    'Communicate engineering decision clearly to driver', 
                    'Provide ongoing reassurance and support', 
                    'Escalate to senior managers if required', 
                    'Ensure all documentation completed', 
                    'Follow up on driver and passenger welfare'
                ]
            }
        ]
    },

    // BROKEN WINDOWS
    'broken-windows': {
        id: 'broken-windows', 
        title: 'Broken Windows', 
        category: 'emergency', 
        priority: 2,
        estimatedTime: '90-120 seconds', 
        severity: 'high', 
        icon: '🪟', 
        color: '#ea580c',
        sdcReference: 'SDC Guide Section 6: Broken Windows Guidance',
        steps: [
            {
                type: 'question', 
                title: 'Check driver fitness',
                subtitle: 'Is the driver fit and well and able to continue?',
                options: [
                    { text: '✅ YES - Driver fit and well', nextStep: 1, severity: 'continue' },
                    { text: '🚨 NO - Driver needs medical attention', nextStep: 6, severity: 'medical' }
                ]
            },
            {
                type: 'question', 
                title: 'Check passenger safety',
                subtitle: 'Are all passengers unharmed?',
                options: [
                    { text: '✅ YES - All passengers unharmed', nextStep: 2, severity: 'continue' },
                    { text: '🚨 NO - Passengers need medical attention', nextStep: 7, severity: 'medical' }
                ]
            },
            {
                type: 'question', 
                title: 'Vehicle safety assessment',
                subtitle: 'Critical safety evaluation',
                content: 'Is the driver\'s view seriously impaired, or does it present danger to occupants? Is detachment of loose articles likely?',
                options: [
                    { text: '🚨 YES - Serious safety risk', nextStep: 3, severity: 'stop' },
                    { text: '✅ NO - Not dangerous', nextStep: 4, severity: 'continue' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Immediate Safety Risk', 
                result: 'Stop immediately and seek engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Serious safety risk to driver/passengers', 
                    'Contact Engineering for assistance', 
                    'Do not continue until assessed'
                ],
                contacts: ['Engineering Team - IMMEDIATE']
            },
            {
                type: 'question', 
                title: 'Damage extent assessment',
                subtitle: 'Evaluate the scope of damage',
                content: 'Consider: Sharp edges, loose parts, damaged lights, etc.',
                quickCheck: [
                    'Extent of damage beyond windows',
                    'Are brakes, steering, or control systems affected?',
                    'Are wheels/tyres affected?'
                ],
                options: [
                    { text: '🚨 Critical systems affected', nextStep: 8, severity: 'stop' },
                    { text: '⚠️ Minor damage only', nextStep: 5, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'Continue to next appropriate changeover point',
                severity: 'changeover',
                actions: [
                    'Continue to next changeover point', 
                    'Driver must remain vigilant', 
                    'Stop if situation changes', 
                    'Record defects on Go-Check when stationary and safe',
                    'If driver disagrees with continuing, remain stationary and seek depot assistance'
                ]
            },
            {
                type: 'final', 
                title: '🚨 Driver Medical Emergency', 
                result: 'Seek immediate medical attention and replacement',
                severity: 'medical',
                actions: [
                    'Arrange immediate medical attention', 
                    'Organize replacement driver', 
                    'Driver safety is priority'
                ],
                contacts: ['Medical services', 'Replacement driver']
            },
            {
                type: 'final', 
                title: '🚨 Passenger Medical Emergency', 
                result: 'Seek immediate medical attention for passengers',
                severity: 'medical',
                actions: [
                    'Arrange immediate medical attention for passengers', 
                    'Coordinate emergency services', 
                    'Document all injuries'
                ],
                contacts: ['Emergency medical services']
            },
            {
                type: 'final', 
                title: '🛑 STOP - Critical Systems Damaged', 
                result: 'Vehicle must remain stationary',
                severity: 'stop',
                actions: [
                    'Bus must remain stationary', 
                    'Critical vehicle systems affected', 
                    'Contact Engineering immediately', 
                    'Do not attempt to move vehicle'
                ],
                contacts: ['Engineering Team - CRITICAL']
            }
        ]
    },

    // FUEL LEAK / CUT OUT
    'fuel-issues': {
        id: 'fuel-issues', 
        title: 'Fuel Leak / Cut Out Issues', 
        category: 'emergency', 
        priority: 1,
        estimatedTime: '90-120 seconds', 
        severity: 'critical', 
        icon: '⛽', 
        color: '#dc2626',
        sdcReference: 'SDC Guide Section 18: Cut Out or Fuel Problem',
        steps: [
            {
                type: 'action', 
                title: 'Check ignition first',
                instructions: [
                    'Confirm ignition is turned on',
                    'Basic system check before proceeding'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Fuel leak inspection',
                subtitle: 'Does driver suspect a fuel leak?',
                content: 'Driver should inspect when safe: fuel tanks, hoses, under vehicle, checking for diesel smell, wet patches, visible drips',
                options: [
                    { text: '⛽ FUEL LEAK IDENTIFIED', nextStep: 2, severity: 'critical' },
                    { text: '✅ NO FUEL LEAK', nextStep: 6, severity: 'moderate' }
                ]
            },
            {
                type: 'action', 
                title: 'IMMEDIATE FUEL LEAK RESPONSE',
                subtitle: 'CRITICAL FIRE HAZARD',
                instructions: [
                    'Stop bus immediately when safe',
                    'Turn off engine to reduce fire risk',
                    'DO NOT start or drive bus again',
                    'Off-board all passengers',
                    'Use spill kits or sand if fuel pooling'
                ],
                nextStep: 3
            },
            {
                type: 'question', 
                title: 'Assess fuel leak severity',
                subtitle: 'Determine emergency response level',
                options: [
                    { text: '🔥 SEVERE LEAK - Pooling fuel', nextStep: 4, severity: 'emergency' },
                    { text: '⛽ MODERATE LEAK - Contained', nextStep: 5, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '🚨 FIRE SERVICES REQUIRED', 
                result: 'Severe fuel leak - fire/environmental emergency',
                severity: 'emergency',
                actions: [
                    'Call FIRE SERVICES immediately', 
                    'Severe spill containment required', 
                    'Notify local authorities for road/bus stop cleanup', 
                    'Evacuate area if necessary', 
                    'Wait for emergency services'
                ],
                contacts: [
                    'FIRE SERVICES - 999', 
                    'Engineering Team', 
                    'Local authorities for cleanup'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Moderate Fuel Leak', 
                result: 'Contained fuel leak - await engineering',
                severity: 'stop',
                actions: [
                    'Keep engine OFF', 
                    'Await engineering assistance', 
                    'Monitor for worsening situation', 
                    'Use spill kits to contain leak'
                ],
                contacts: ['Engineering Team - URGENT']
            },
            {
                type: 'question', 
                title: 'Cut-out frequency assessment',
                subtitle: 'How many times has vehicle cut out?',
                options: [
                    { text: '1️⃣ First-time occurrence', nextStep: 7, severity: 'continue' },
                    { text: '🔄 Persistent problem - continues cutting out', nextStep: 8, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'First occurrence - continue to convenient changeover',
                severity: 'changeover',
                actions: [
                    'Continue to convenient changeover point', 
                    'Monitor engine performance', 
                    'Record on Go-Check when stationary and safe'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Persistent Cut-Out', 
                result: 'Vehicle unreliable - stop and await engineering',
                severity: 'stop',
                actions: [
                    'Stop in safe location', 
                    'Persistent problem indicates serious issue', 
                    'Await engineering assistance', 
                    'Do not continue service'
                ],
                contacts: ['Engineering Team']
            }
        ]
    },

    // BUZZERS SOUNDING
    'various-buzzers': {
        id: 'various-buzzers', 
        title: 'Various Buzzers Sounding', 
        category: 'emergency', 
        priority: 2,
        estimatedTime: '75-90 seconds', 
        severity: 'variable', 
        icon: '🔊', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 26: Various Buzzers Sounding',
        steps: [
            {
                type: 'question', 
                title: 'Identify the buzzer',
                subtitle: 'Which buzzer is sounding and is it consistent or intermittent?',
                options: [
                    { text: '🔍 Buzzer identified', nextStep: 1, severity: 'variable' },
                    { text: '❓ Unknown buzzer', nextStep: 4, severity: 'variable' }
                ]
            },
            {
                type: 'question', 
                title: 'Check for warning lights',
                subtitle: 'Are any warning lights illuminated on dashboard?',
                options: [
                    { text: '⚠️ YES - Warning lights present', nextStep: 2, severity: 'variable' },
                    { text: '✅ NO - No warning lights', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'action', 
                title: 'Consult SDC Guide',
                instructions: [
                    'Refer to relevant section of SDC Guide if buzzer is covered',
                    'Follow specific guidance for identified buzzer',
                    'Determine safety to continue to changeover'
                ],
                nextStep: 5
            },
            {
                type: 'action', 
                title: 'Check buzzer reference',
                instructions: [
                    'Consult dashboard manual if available',
                    'Determine what buzzer indicates',
                    'Assess safety to continue to changeover'
                ],
                nextStep: 6
            },
            {
                type: 'action', 
                title: 'Investigate unknown buzzer',
                instructions: [
                    'Try to identify buzzer source',
                    'Check dashboard manual if available', 
                    'Note: Some vehicles will not drive with certain buzzers sounding'
                ],
                nextStep: 6
            },
            {
                type: 'question', 
                title: 'Can issue be resolved by guidance?',
                options: [
                    { text: '✅ YES - Safe to continue to changeover', nextStep: 7, severity: 'changeover' },
                    { text: '❌ NO - Cannot resolve or unsafe', nextStep: 8, severity: 'stop' }
                ]
            },
            {
                type: 'question', 
                title: 'Will vehicle drive with buzzer?',
                subtitle: 'Some vehicles prevent driving when certain buzzers sound',
                options: [
                    { text: '✅ Vehicle drives normally', nextStep: 7, severity: 'changeover' },
                    { text: '🛑 Vehicle will not drive', nextStep: 8, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'Safe to continue to convenient changeover point',
                severity: 'changeover',
                actions: [
                    'Continue to convenient changeover point', 
                    'Monitor buzzer and any associated systems', 
                    'Record defect on Go-Check when stationary and safe'
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Unresolved Buzzer Issue', 
                result: 'Stop and await engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop vehicle immediately', 
                    'Cannot resolve buzzer issue safely', 
                    'Contact Engineering for assistance', 
                    'Record details on Go-Check'
                ],
                contacts: ['Engineering Team']
            }
        ]
    }

};

// Export the module
if (typeof window !== 'undefined') {
    window.EMERGENCY_PROCEDURES_MODULE = EMERGENCY_PROCEDURES_MODULE;
}