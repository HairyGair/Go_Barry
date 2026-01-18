/**
 * Industry Best-Practice Compliant Diagnostic Flows - PART 3
 * Remaining categories with operational best practice guidelines - Version 1.3
 * Following recognised safety standards
 */

// Additional flows with operational best practice guidelines
const additionalFlows = {
    'broken-windows': {
        title: 'Broken Windows',
        description: 'Window damage assessment and safety protocols',
        priority: 2,
        severity: 'warning',
        icon: '🪟',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Broken Windows Guidance',
                content: 'Follow this assessment to determine if the vehicle can continue safely.'
            },
            {
                type: 'question',
                title: 'Driver',
                content: 'Is this driver fit and well and able to continue in service?',
                options: [
                    {
                        text: 'Yes: Continue to next question',
                        nextStep: 2,
                        severity: 'continue'
                    },
                    {
                        text: 'No: Seek medical attention and organise a replacement driver',
                        nextStep: 'driver-medical',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Passengers',
                content: 'Are all passengers unharmed?',
                options: [
                    {
                        text: 'Yes: Continue to next question',
                        nextStep: 3,
                        severity: 'continue'
                    },
                    {
                        text: 'No: Seek medical attention',
                        nextStep: 'passenger-medical',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Vehicle',
                content: 'Is the driver\'s view seriously impaired, or does it present a danger to occupants? Is detachment of loose articles likely?',
                options: [
                    {
                        text: 'Yes: Stop immediately and seek assistance from engineering.',
                        nextStep: 'vehicle-unsafe',
                        severity: 'critical'
                    },
                    {
                        text: 'No: Continue to the next appropriate changeover point. The driver must remain vigilant and stop if the situation changes',
                        nextStep: 'vehicle-safe',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Driver Medical Attention Required',
                content: 'Seek medical attention and organise a replacement driver.',
                result: 'Driver requires medical attention and replacement.',
                severity: 'stop',
                stopReason: 'Driver medical emergency requires immediate attention.'
            },
            {
                type: 'final',
                title: 'Passenger Medical Attention Required',
                content: 'Seek medical attention for passengers.',
                result: 'Passengers require medical attention.',
                severity: 'stop',
                stopReason: 'Passenger medical emergency requires immediate attention.'
            },
            {
                type: 'final',
                title: 'Vehicle Unsafe to Continue',
                content: 'Stop immediately and seek assistance from engineering.',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Serious vision impairment or danger to occupants from loose articles.',
                actions: [
                    'The extent of the damage: Sharp edges, loose parts, damaged lights, etc.',
                    'Consult engineering if you don\'t believe the vehicle can continue',
                    'If the driver disagrees with continuing: Advise them to remain where they are.',
                    'Report the situation to the relevant depot management for further investigation.',
                    'Seek depot assistance for a replacement driver.',
                    'If the vehicle has been vandalized beyond the windows and brakes, steering, or control systems are affected (including wheels/tyres), the bus must remain stationary.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Continue with Caution',
                content: 'Continue to the next appropriate changeover point. The driver must remain vigilant and stop if the situation changes.',
                result: 'Vehicle may continue to changeover point with vigilance.',
                severity: 'warning',
                actions: [
                    'The extent of the damage: Sharp edges, loose parts, damaged lights, etc.',
                    'Consult engineering if you don\'t believe the vehicle can continue',
                    'If the driver disagrees with continuing: Advise them to remain where they are.',
                    'Report the situation to the relevant depot management for further investigation.',
                    'Seek depot assistance for a replacement driver.',
                    'If the vehicle has been vandalized beyond the windows and brakes, steering, or control systems are affected (including wheels/tyres), the bus must remain stationary.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'buzzers-sounding': {
        title: 'Various Buzzers Sounding',
        description: 'Buzzer identification and response procedures',
        priority: 3,
        severity: 'warning',
        icon: '🔊',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Various Buzzers Sounding',
                content: 'If a driver reports any buzzing sound from the vehicle, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Identify the Buzzer',
                content: 'Which buzzer is sounding?',
                instructions: [
                    'Ask the driver to identify which specific buzzer is sounding and whether it\'s consistent or intermittent.'
                ],
                nextStep: 2
            },
            {
                type: 'action',
                title: 'Step 2: Check for Warning Lights',
                content: 'Are any warning lights illuminated?',
                instructions: [
                    'Ask the driver to check the dashboard for any illuminated warning lights that may correspond with the buzzer sound.'
                ],
                nextStep: 3
            },
            {
                type: 'action',
                title: 'Step 3: Refer to operational procedures (if applicable)',
                content: 'Consult this guide (if applicable):',
                instructions: [
                    'If any buzzers referenced in this guide are shown, refer to the guidance given and determine whether it is safe to continue to the next convenient changeover point.'
                ],
                nextStep: 4
            },
            {
                type: 'action',
                title: 'Step 4: Refer to the Dashboard Manual (if available)',
                content: 'Consult the manual (if available):',
                instructions: [
                    'Check the dashboard manual to determine what the buzzer indicates and assess whether it is safe to continue to the next convenient changeover point.'
                ],
                note: 'Some vehicles will not drive with a buzzer sounding, in this case stop and await assistance from engineering.',
                nextStep: 5
            },
            {
                type: 'question',
                title: 'Step 5: Take Action',
                content: 'Can the issue be resolved by the above steps?',
                options: [
                    {
                        text: 'Yes - Issue resolved or safe to continue',
                        nextStep: 'buzzer-resolved',
                        severity: 'continue'
                    },
                    {
                        text: 'No - Issue cannot be resolved',
                        nextStep: 'buzzer-unresolved',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Buzzer Issue Resolved',
                content: 'Issue resolved or determined safe to continue.',
                result: 'Continue to next convenient changeover point.',
                severity: 'warning',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Buzzer Issue Unresolved',
                content: 'If the issue cannot be resolved by the above steps: Instruct the driver to stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Unidentified buzzer may indicate critical system failure.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'cutting-out-fuel': {
        title: 'Cut Out or Fuel Problem',
        description: 'Engine cutting out and fuel system issues',
        priority: 2,
        severity: 'warning',
        icon: '⛽',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Cut Out or Fuel Problem',
                content: 'If a driver reports a cut-out or fuel issue, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Check the Ignition',
                content: 'Confirm that the ignition is turned on.',
                nextStep: 2
            },
            {
                type: 'action',
                title: 'Step 2: Inspect for Fuel Leaks',
                content: 'If a driver suspects a fuel leak, they should visually inspect around the bus when in a safe location to do so, paying attention to fuel tanks, hoses, and under the vehicle.',
                instructions: [
                    'Drivers should check for a strong smell of diesel, wet patches, or visible drips.'
                ],
                nextStep: 3
            },
            {
                type: 'question',
                title: 'Fuel Leak Assessment',
                content: 'Has a fuel leak been identified?',
                options: [
                    {
                        text: 'Fuel Leak Identified',
                        nextStep: 'fuel-leak-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No Fuel Leak: Proceed to Step 3',
                        nextStep: 4,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Step 3: Assess the Situation',
                content: 'Is this a first-time occurrence or persistent problem?',
                options: [
                    {
                        text: 'First-Time Occurrence',
                        nextStep: 'first-time-occurrence',
                        severity: 'warning'
                    },
                    {
                        text: 'Persistent Problem',
                        nextStep: 'persistent-problem',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'CRITICAL: Fuel Leak Identified',
                content: 'Fuel Leak Identified:',
                result: 'Stop the bus as soon as it is safe.',
                severity: 'stop',
                stopReason: 'Fuel leak presents immediate fire risk and environmental hazard.',
                actions: [
                    'Stop the bus as soon as it is safe.',
                    'Turn off the engine to reduce fire risk.',
                    'Do not start or drive the bus again.',
                    'Off-board passengers.',
                    'Await engineering assistance.',
                    'If fuel is pooling, drivers should use spill kits (if available) or sand to prevent spreading.',
                    'If the leak is severe, fire services may be required to assist with spill containment.',
                    'If a bus stop or roadway is affected, SDC should notify local authorities to arrange clean-up.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.'
                ]
            },
            {
                type: 'final',
                title: 'First-Time Occurrence',
                content: 'First-Time Occurrence: Advise the driver to continue to a convenient changeover point.',
                result: 'Continue to convenient changeover point.',
                severity: 'warning',
                actions: [
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            },
            {
                type: 'final',
                title: 'Persistent Problem',
                content: 'Persistent Problem: If the vehicle continues to cut out after initial contact, instruct the driver to STOP in a safe location and await engineering assistance.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Persistent cutting out indicates serious mechanical failure requiring immediate attention.',
                actions: [
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            }
        ]
    },

    'excessive-smoke': {
        title: 'Excessive Smoke',
        description: 'Exhaust smoke and emission problems',
        priority: 2,
        severity: 'warning',
        icon: '💨',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Excessive Smoke',
                content: 'If a driver reports excessive smoke, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'question',
                title: 'Smoke Assessment',
                content: 'Advise the driver to switch off the vehicle and await engineering attendance if any of the following apply:',
                checklist: [
                    'Fumes are entering the vehicle interior.',
                    'The exhaust is becoming detached.',
                    'Smoke levels are sufficient to obscure vision or create danger for other road users.',
                    'There is a continuous stream of dense blue or clearly visible black smoke.'
                ],
                options: [
                    {
                        text: 'Yes - One or more critical conditions present',
                        nextStep: 'smoke-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - None of the above conditions apply',
                        nextStep: 'smoke-manageable',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Critical Smoke Conditions',
                content: 'Advise the driver to switch off the vehicle and await engineering attendance.',
                result: 'Vehicle must stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Critical smoke conditions present immediate danger to passengers and other road users.',
                actions: [
                    'Ensure a planned changeover is arranged promptly for vehicles permitted to continue.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Escalate persistent, unwarranted smoke-related reports to the depot management team. This ensures patterns of unnecessary service disruption are addressed appropriately.'
                ]
            },
            {
                type: 'final',
                title: 'Manageable Smoke',
                content: 'Smoke levels are manageable and do not present immediate danger.',
                result: 'Continue to next convenient changeover point.',
                severity: 'warning',
                actions: [
                    'Ensure a planned changeover is arranged promptly for vehicles permitted to continue.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.',
                    'Escalate persistent, unwarranted smoke-related reports to the depot management team. This ensures patterns of unnecessary service disruption are addressed appropriately.'
                ]
            }
        ]
    },

    'gearbox-temperature': {
        title: 'Gearbox Temperature',
        description: 'Transmission overheating and temperature warnings',
        priority: 2,
        severity: 'warning',
        icon: '🌡️',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Gearbox Temperature',
                content: 'If a driver reports a gearbox temperature issue, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Reset the Vehicle',
                content: 'Instruct the driver to switch off the bus and re-set it.',
                instructions: [
                    'If this clears the issue, advise the driver to continue in service.',
                    'If the problem persists, proceed to Step 2.'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Reset Result',
                content: 'Did the reset clear the gearbox temperature issue?',
                options: [
                    {
                        text: 'Yes - Issue cleared, continue in service',
                        nextStep: 'temperature-cleared',
                        severity: 'continue'
                    },
                    {
                        text: 'No - Problem persists',
                        nextStep: 3,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Step 2: Check for Coolant Leaks',
                content: 'Ask the driver to check for visible signs of water leaks:',
                instructions: [
                    'NEVER ask a driver to step into the road, ensure they always stay safe.'
                ],
                nextStep: 4
            },
            {
                type: 'question',
                title: 'Coolant Leak Assessment',
                content: 'Are there visible signs of water/coolant leaks?',
                options: [
                    {
                        text: 'Leaks Present',
                        nextStep: 'coolant-leak-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No Leaks: Proceed to Step 3',
                        nextStep: 5,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Step 2: Assess the Terrain',
                content: 'Has the vehicle recently operated on hilly terrain?',
                options: [
                    {
                        text: 'Hilly Terrain Just Operated',
                        nextStep: 'hilly-terrain',
                        severity: 'warning'
                    },
                    {
                        text: 'No Hilly Terrain Operated',
                        nextStep: 6,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'No Hilly Terrain - Distance Assessment',
                content: 'Assess whether the bus can safely reach the nearest changeover point.',
                options: [
                    {
                        text: 'Can safely reach changeover point',
                        nextStep: 'safe-changeover',
                        severity: 'warning'
                    },
                    {
                        text: 'Changeover point too far to safely drive',
                        nextStep: 'distance-too-far',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Temperature Issue Cleared',
                content: 'Issue cleared after reset, continue in service.',
                result: 'Vehicle may continue normal operations.',
                severity: 'continue'
            },
            {
                type: 'final',
                title: 'Critical: Coolant Leak Present',
                content: 'Leaks Present: Advise the driver to stop immediately and await engineering assistance.',
                result: 'Stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Coolant leak can lead to complete engine failure and overheating.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Hilly Terrain - Monitor and Changeover',
                content: 'Hilly Terrain Just Operated: Advise the driver to continue in service for a short time to monitor if the issue persists. Arrange for a changeover at the next convenient location.',
                result: 'Continue with monitoring, arrange changeover at next convenient location.',
                severity: 'warning',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Safe to Reach Changeover',
                content: 'Bus can safely reach the nearest changeover point.',
                result: 'Continue to nearest changeover point.',
                severity: 'warning',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Step 3: Evaluate Risk',
                content: 'If the changeover point is too far to safely drive the bus stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Distance to changeover point presents risk of gearbox failure.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the the defect reporting system System when the bus is stationary and in a safe location.'
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