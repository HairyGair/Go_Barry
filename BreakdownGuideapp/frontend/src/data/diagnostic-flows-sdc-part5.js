/**
 * Industry Best-Practice Compliant Diagnostic Flows - PART 5 (FINAL)
 * Final remaining categories with operational best practice guidelines - Version 1.3
 * Following recognised safety standards
 */

const additionalFlows5 = {
    'puncture': {
        title: 'Puncture',
        description: 'Tire puncture assessment and immediate response',
        priority: 1,
        severity: 'critical',
        icon: '🛞',
        color: '#dc2626',
        steps: [
            {
                type: 'info',
                title: 'Puncture',
                content: 'When a puncture is reported, immediate assessment is required.'
            },
            {
                type: 'action',
                title: '1. Determine the Position of the Puncture:',
                content: 'Gather the following information:',
                instructions: [
                    'Identify whether it is an inner or outer tire.',
                    'Determine whether it is on the rear or front, and which side (offside or nearside).'
                ],
                nextStep: 2
            },
            {
                type: 'final',
                title: '2. Driver Action:',
                content: 'The driver should stop immediately and seek advice from engineering after providing the above information.',
                result: 'Stop immediately and contact engineering with puncture position details.',
                severity: 'stop',
                stopReason: 'Punctured tire compromises vehicle stability and safety.',
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

    'suspension': {
        title: 'Suspension',
        description: 'Suspension system faults and air pressure issues',
        priority: 2,
        severity: 'warning',
        icon: '🔧',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Suspension',
                content: 'If a driver reports a suspension fault ask the following:'
            },
            {
                type: 'action',
                title: 'Suspension Fault Assessment',
                content: 'Ask the driver the following questions:',
                instructions: [
                    'Are there any warning lights relating to suspension on the dashboard? Are they red or amber',
                    'Does the bus lean to one side or another, or is one corner of the bus riding low or high?',
                    'Prior to the issue, was there an audible bang or loud escape of air?',
                    'Is the air pressure within normal parameters or does the vehicle fail to build or hold air pressure?',
                    'Is the ride quality acceptable or has the driver reported an excessively hard or soft ride?',
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.'
                ],
                nextStep: 2
            },
            {
                type: 'action',
                title: 'Step 1: Reset the Vehicle',
                content: 'Instruct the driver to switch off the ignition and re-set the vehicle.',
                instructions: [
                    'If this clears the issue, advise the driver to continue in service.'
                ],
                nextStep: 3
            },
            {
                type: 'question',
                title: 'Reset Result',
                content: 'Did the reset clear the suspension issue?',
                options: [
                    {
                        text: 'Yes - Issue cleared, continue in service',
                        nextStep: 'suspension-cleared',
                        severity: 'continue'
                    },
                    {
                        text: 'No - Problem persists',
                        nextStep: 'suspension-persistent',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Suspension Issue Cleared',
                content: 'Issue cleared after reset, continue in service.',
                result: 'Vehicle may continue normal operations.',
                severity: 'continue',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Step 2: If the problem persists',
                content: 'Instruct the driver to stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Persistent suspension fault compromises vehicle stability and passenger comfort.',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'exterior-lights': {
        title: 'Exterior lights',
        description: 'External lighting system failures and safety requirements',
        priority: 2,
        severity: 'warning',
        icon: '💡',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Exterior lights',
                content: 'Assessment of various exterior lighting defects:'
            },
            {
                type: 'question',
                title: 'Type of Light Defect',
                content: 'What type of exterior light defect has been reported?',
                options: [
                    {
                        text: 'Headlights',
                        nextStep: 'headlights',
                        severity: 'warning'
                    },
                    {
                        text: 'Indicators',
                        nextStep: 'indicators',
                        severity: 'critical'
                    },
                    {
                        text: 'Brake lights',
                        nextStep: 'brake-lights',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Headlights',
                content: 'If a driver reports a headlight out (or less than 50% illuminated in an LED unit), take the following actions. Is the vehicle operating in hours of darkness on an unrestricted road?',
                options: [
                    {
                        text: 'Yes - Operating in hours of darkness on unrestricted road',
                        nextStep: 'headlight-darkness',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Not in hours of darkness',
                        nextStep: 'headlight-daylight',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Indicators',
                content: 'If a driver reports a direction indicator (or side repeater) not working, advise the driver to stop and await engineering attendance.',
                result: 'Stop and await engineering attendance.',
                severity: 'stop',
                stopReason: 'Non-functioning indicators present immediate road safety hazard.',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'action',
                title: 'Brake lights',
                content: 'If a report is made of a defective brake light or lights, ask the following:',
                instructions: [
                    'Is it a low level brake light?',
                    'Are the brake lights on constantly?',
                    'Is one or both lights inoperative?'
                ],
                nextStep: 7
            },
            {
                type: 'question',
                title: 'Brake Light Assessment',
                content: 'Based on the brake light assessment:',
                options: [
                    {
                        text: 'Both low level brake lights are not working OR are on constantly',
                        nextStep: 'brake-lights-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'One brake light is not working',
                        nextStep: 'brake-lights-single',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Headlight - Hours of Darkness',
                content: 'If yes, the vehicle must not continue, if no, the bus can continue but a changeover arranged before hours of darkness.',
                result: 'Vehicle must not continue during hours of darkness.',
                severity: 'stop',
                stopReason: 'Operating without adequate headlights during darkness presents extreme safety risk.',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Headlight - Daylight Hours',
                content: 'If no, the bus can continue but a changeover arranged before hours of darkness.',
                result: 'Continue but arrange changeover before hours of darkness.',
                severity: 'warning',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Brake Lights Critical',
                content: 'If both low level brake lights are not working or are on constantly advise the driver to stop and await engineering attendance.',
                result: 'Stop and await engineering attendance.',
                severity: 'stop',
                stopReason: 'Brake light failure presents serious safety hazard to following traffic.',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            },
            {
                type: 'final',
                title: 'Single Brake Light',
                content: 'If one brake light is not working, advise the driver to continue in service and proceed to the next convenient location for a bus changeover.',
                result: 'Continue to next convenient location for changeover.',
                severity: 'warning',
                actions: [
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            }
        ]
    },

    'wing-mirrors': {
        title: 'Damage to Wing Mirror',
        description: 'Wing mirror damage assessment and visibility considerations',
        priority: 2,
        severity: 'warning',
        icon: '🪞',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Damage to Wing Mirror',
                content: 'If a driver reports damage to a wing mirror, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'question',
                title: 'Step 1: Assess the Extent of the Damage',
                content: 'Is it only the glass, or both the glass and arm damaged?',
                options: [
                    {
                        text: 'Only the glass is damaged',
                        nextStep: 2,
                        severity: 'warning'
                    },
                    {
                        text: 'Both glass and arm are damaged',
                        nextStep: 3,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Glass Only Damage Assessment',
                content: 'If the damage is only to the glass, assess whether the driver can continue using the mirror satisfactorily.',
                options: [
                    {
                        text: 'Driver can continue using the mirror satisfactorily',
                        nextStep: 'mirror-usable',
                        severity: 'warning'
                    },
                    {
                        text: 'Driver cannot continue using the mirror satisfactorily',
                        nextStep: 'mirror-unusable',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Step 2: Determine Which Side of the Vehicle the Damage is On',
                content: 'Which side of the vehicle is it?',
                options: [
                    {
                        text: 'Nearside mirror damage',
                        nextStep: 'nearside-damage',
                        severity: 'warning'
                    },
                    {
                        text: 'Offside mirror damage',
                        nextStep: 'offside-damage',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Step 3: Check for Additional Damage to the Vehicle',
                content: 'Is there any other damage to the bus?',
                instructions: [
                    'If additional damage to the vehicle is present, consider whether it affects the safety or operation of the bus. If so, stop and await assistance from engineering.'
                ],
                nextStep: 7
            },
            {
                type: 'final',
                title: 'Mirror Usable',
                content: 'Driver can continue using the mirror satisfactorily: Advise the driver to continue to the nearest convenient relief point.',
                result: 'Continue to nearest convenient relief point.',
                severity: 'warning',
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
                title: 'Mirror Unusable',
                content: 'Driver cannot continue using the mirror satisfactorily: Instruct the driver to stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Mirror damage impairs driver visibility and safety.',
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
                title: 'Nearside Mirror Damage',
                content: 'If the damage is to the nearside mirror, it may be less critical, but the decision should still be made by the driver based on their comfort and safety.',
                result: 'Driver decision based on comfort and safety assessment.',
                severity: 'warning',
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
                title: 'Offside Mirror Damage',
                content: 'If the damage is to the offside mirror, it may pose a higher risk, especially regarding visibility and safe driving. In this case, the driver should stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Offside mirror damage poses higher risk to visibility and safe driving.',
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

    'wipers-screenwash': {
        title: 'Wipers Not Working / Screen Wash',
        description: 'Windscreen wiper and washer system failures',
        priority: 2,
        severity: 'warning',
        icon: '🌧️',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Wipers Not Working / Screen Wash',
                content: 'If a driver reports issues with wipers or screen wash, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Key Questions:',
                content: 'Ask the driver the following questions:',
                instructions: [
                    'Is the whole blade or arm missing?',
                    'Which side of the windscreen is affected?',
                    'Are the wipers moving at all?',
                    'Are the windscreen washers inoperative or inadequate?',
                    'Can you hear the wiper motor whirring?'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Vision Assessment',
                content: 'Is the driver\'s vision impaired?',
                options: [
                    {
                        text: 'Yes - Driver\'s vision is impaired',
                        nextStep: 'vision-impaired',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Vision is not impaired',
                        nextStep: 3,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Assess Urgency',
                content: 'If vision is not impaired, assess the urgency of the situation based on:',
                instructions: [
                    'Weather conditions.',
                    'The route (e.g., long stretches on major roads like A19 or A1M require prioritised changeovers).'
                ],
                nextStep: 4
            },
            {
                type: 'action',
                title: 'Temporary Measures:',
                content: 'Consider temporary measures:',
                instructions: [
                    'Advise the driver or supervisor to clean the windscreen at a safe location if conditions allow.',
                    'Arrange for the washer system to be topped up at a convenient location, if necessary.'
                ],
                nextStep: 'wiper-temporary'
            },
            {
                type: 'final',
                title: 'Vision Impaired - Stop Immediately',
                content: 'If the driver\'s vision is impaired, advise them to stop immediately and await engineering assistance.',
                result: 'Stop immediately and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Impaired driver vision presents immediate safety risk to all road users.',
                actions: [
                    'Ensure a planned changeover is arranged promptly for vehicles permitted to continue.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.',
                    'Escalate persistent, unwarranted wiper-related reports to the depot management team. This ensures patterns of unnecessary service disruption are addressed appropriately.'
                ]
            },
            {
                type: 'final',
                title: 'Temporary Measures Applied',
                content: 'Temporary measures have been applied. Continue with caution.',
                result: 'Continue to next convenient changeover point with temporary measures.',
                severity: 'warning',
                actions: [
                    'Ensure a planned changeover is arranged promptly for vehicles permitted to continue.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.',
                    'Escalate persistent, unwarranted wiper-related reports to the depot management team. This ensures patterns of unnecessary service disruption are addressed appropriately.'
                ]
            }
        ]
    },

    'ramp-stuck-out': {
        title: 'Ramp Stuck Out',
        description: 'Wheelchair ramp deployment and retraction issues',
        priority: 2,
        severity: 'warning',
        icon: '♿',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Ramp Stuck Out',
                content: 'If a driver reports that the ramp is stuck out, follow these steps to assess and respond appropriately:'
            },
            {
                type: 'action',
                title: 'Step 1: Reset the Vehicle',
                content: 'Instruct the driver to switch off the ignition and re-set the vehicle.',
                instructions: [
                    'If this clears the issue, advise the driver to continue in service.',
                    'If the problem persists, proceed to Step 2.'
                ],
                nextStep: 2
            },
            {
                type: 'question',
                title: 'Reset Result',
                content: 'Did the reset clear the ramp issue?',
                options: [
                    {
                        text: 'Yes - Issue cleared, continue in service',
                        nextStep: 'ramp-cleared',
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
                type: 'question',
                title: 'Step 2: Assess Driver Training for Manual Retraction',
                content: 'Is the driver risk assessed for manual retraction?',
                options: [
                    {
                        text: 'Not Risk Assessed for Manual Retraction',
                        nextStep: 'not-risk-assessed',
                        severity: 'critical'
                    },
                    {
                        text: 'Risk Assessed for Manual Retraction',
                        nextStep: 4,
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'action',
                title: 'Manual Retraction Attempt',
                content: 'Risk Assessed for Manual Retraction: Instruct the driver to attempt retracting the ramp manually using the method they were trained on.',
                nextStep: 5
            },
            {
                type: 'question',
                title: 'Manual Retraction Result',
                content: 'Was the manual retraction successful?',
                options: [
                    {
                        text: 'Yes - Ramp successfully retracted',
                        nextStep: 'manual-success',
                        severity: 'continue'
                    },
                    {
                        text: 'No - Problem persists',
                        nextStep: 'manual-failed',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Ramp Issue Cleared',
                content: 'Issue cleared after reset, continue in service.',
                result: 'Vehicle may continue normal operations.',
                severity: 'continue'
            },
            {
                type: 'final',
                title: 'Not Risk Assessed',
                content: 'Not Risk Assessed for Manual Retraction: Advise the driver to STOP and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Driver not risk assessed for manual ramp retraction.',
                note: 'Being trained to use manual ramps is not the same as being risk assessed to manually retract a stuck ramp.',
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
                title: 'Manual Retraction Successful',
                content: 'Ramp successfully retracted manually. Continue with caution.',
                result: 'Continue to next convenient changeover point.',
                severity: 'warning',
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
                title: 'Step 3: If the Problem Persists',
                content: 'Instruct the driver to stop and await assistance from engineering.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Ramp cannot be retracted presents accessibility and safety concerns.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.',
                    'Record any defects immediately on the reporting device when the bus is stationary and in a safe location.'
                ]
            }
        ]
    }
};

// Merge with existing flows
if (typeof diagnosticFlows !== 'undefined') {
    Object.assign(diagnosticFlows, additionalFlows5);
} else {
    // Fallback: create global diagnosticFlows if it doesn't exist
    window.diagnosticFlows = additionalFlows5;
}

console.log('Industry best-practice diagnostic flows loaded - Final categories with exact text compliance maintained');