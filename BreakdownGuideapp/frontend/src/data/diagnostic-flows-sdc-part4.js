/**
 * Industry Best-Practice Compliant Diagnostic Flows - PART 4
 * Continuing with operational best practice guidelines - Version 1.3
 * Following recognised safety standards
 */

const additionalFlows4 = {
    'interior-lights': {
        title: 'Interior Lights',
        description: 'Interior lighting system failures affecting passenger safety',
        priority: 3,
        severity: 'warning',
        icon: '💡',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Interior Lights',
                content: 'The vehicle may continue in service if the following conditions are met, but change the bus over at the earliest opportunity, especially if operating during darkness.'
            },
            {
                type: 'question',
                title: 'Lighting Assessment Question 1',
                content: 'Are at least 50% of the lights on each deck illuminated? (i.e., at least one side of the lights working).',
                options: [
                    {
                        text: 'Yes - At least 50% illuminated on each deck',
                        nextStep: 2,
                        severity: 'continue'
                    },
                    {
                        text: 'No - Less than 50% illuminated',
                        nextStep: 'immediate-changeover',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Lighting Assessment Question 2',
                content: 'Is the step light working when the doors are open?',
                options: [
                    {
                        text: 'Yes - Step light working',
                        nextStep: 'both-conditions-met',
                        severity: 'continue'
                    },
                    {
                        text: 'No - Step light not working',
                        nextStep: 'immediate-changeover',
                        severity: 'critical'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Both Conditions Met',
                content: 'If the answer to both questions is "yes," the bus can continue in service, but a changeover should still be arranged as soon as possible.',
                result: 'Continue in service but arrange changeover as soon as possible.',
                severity: 'warning',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            },
            {
                type: 'final',
                title: 'Immediate Changeover Required',
                content: 'If the answer to either question is "no," arrange for the bus to be changed over immediately.',
                result: 'Arrange for immediate bus changeover.',
                severity: 'stop',
                stopReason: 'Insufficient interior lighting presents passenger safety risk, especially during darkness.',
                actions: [
                    'Safety is the priority. If the driver has any concerns about continuing, escalate the issue to engineering immediately.',
                    'If the vehicle can safely continue, ensure a changeover is arranged at the earliest opportunity.',
                    'Ensure that all actions, including top-ups and changeovers, are communicated to the driver promptly.',
                    'Monitor the situation and provide updates to the driver as needed.'
                ]
            }
        ]
    },

    'interior-exterior-damage': {
        title: 'Damage to bus Interior and Exterior',
        description: 'Various types of interior and exterior damage assessment',
        priority: 2,
        severity: 'warning',
        icon: '🔧',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Damage to bus Interior and Exterior',
                content: 'Follow these steps for based on type of damage:'
            },
            {
                type: 'question',
                title: 'Type of Damage',
                content: 'What type of damage has been reported?',
                options: [
                    {
                        text: 'Floor Around the Driver Insecure / Weakened',
                        nextStep: 'floor-damage',
                        severity: 'warning'
                    },
                    {
                        text: 'Driver\'s Seat Loose',
                        nextStep: 'driver-seat',
                        severity: 'warning'
                    },
                    {
                        text: 'Rear View Mirror and/or Glass Missing/Insecure/Damaged',
                        nextStep: 'mirror-damage',
                        severity: 'warning'
                    },
                    {
                        text: 'Horn Missing/Insecure/Inoperative',
                        nextStep: 'horn-damage',
                        severity: 'warning'
                    },
                    {
                        text: 'Passenger Seats Insecure',
                        nextStep: 'passenger-seats',
                        severity: 'warning'
                    },
                    {
                        text: 'Body Panels - Exterior Damaged/Missing/Protruding/Insecure/Corroded',
                        nextStep: 'body-panels',
                        severity: 'warning'
                    },
                    {
                        text: 'Interior Side Panel - Damaged/Missing/Protruding/Insecure',
                        nextStep: 'interior-panels',
                        severity: 'warning'
                    },
                    {
                        text: 'Bumper Bar Insecure/Damaged',
                        nextStep: 'bumper-damage',
                        severity: 'warning'
                    },
                    {
                        text: 'Registration Plate Missing/Incomplete/Insecure/Faded/Obscured',
                        nextStep: 'registration-plate',
                        severity: 'continue'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Floor Around the Driver Insecure / Weakened',
                content: 'Does the floor damage affect the driver\'s control or safety?',
                options: [
                    {
                        text: 'Yes - Affects driver control or safety',
                        nextStep: 'floor-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Does not affect control or safety',
                        nextStep: 'floor-continue',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Driver\'s Seat Loose',
                content: 'Is the seat so loose or weakened that it could cause the driver to lose control of the vehicle?',
                options: [
                    {
                        text: 'Yes - Could cause loss of control',
                        nextStep: 'seat-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Does not affect control',
                        nextStep: 'seat-continue',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Rear View Mirror Damage',
                content: 'Rear View Mirror and/or Glass Missing/Insecure/Damaged: Continue to the nearest suitable changeover point.',
                result: 'Continue to the nearest suitable changeover point.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'Horn Damage',
                content: 'Horn Missing/Insecure/Inoperative: Continue to the nearest suitable changeover point.',
                result: 'Continue to the nearest suitable changeover point.',
                severity: 'warning'
            },
            {
                type: 'question',
                title: 'Passenger Seats Insecure',
                content: 'Is the seat likely to become displaced and can\'t be secured?',
                options: [
                    {
                        text: 'Yes - Likely to become displaced and cannot be secured',
                        nextStep: 'passenger-seat-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Can be secured or not likely to become displaced',
                        nextStep: 'passenger-seat-secure',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Body Panels - Exterior',
                content: 'Is the damage likely to become detached, protrude into the road, or cause injury?',
                options: [
                    {
                        text: 'Yes - Likely to become detached or cause injury',
                        nextStep: 'body-panel-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Can be secured',
                        nextStep: 'body-panel-secure',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Interior Side Panel',
                content: 'Is the damage likely to become detached or cause injury?',
                options: [
                    {
                        text: 'Yes - Likely to become detached or cause injury',
                        nextStep: 'interior-panel-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Can be secured',
                        nextStep: 'interior-panel-secure',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'question',
                title: 'Bumper Bar Insecure/Damaged',
                content: 'Is detachment likely, either partially or completely, or does the bumper have projections or jagged edges likely to cause injury?',
                options: [
                    {
                        text: 'Yes - Detachment likely or jagged edges present',
                        nextStep: 'bumper-critical',
                        severity: 'critical'
                    },
                    {
                        text: 'No - Can be secured',
                        nextStep: 'bumper-secure',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Registration Plate Issues',
                content: 'Registration Plate Missing/Incomplete/Insecure/Faded/Obscured: Record the issue on the reporting device, the vehicle can continue in service. However, the plate should be replaced and repaired when possible, and a changeover should be arranged as soon as feasible.',
                result: 'Continue in service, arrange changeover when feasible.',
                severity: 'continue'
            },

            // Critical outcomes
            {
                type: 'final',
                title: 'Floor Critical',
                content: 'Stop and await assistance from engineering if it affects the driver\'s control or safety.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Floor damage affects driver control and safety.'
            },
            {
                type: 'final',
                title: 'Seat Critical',
                content: 'Stop and await assistance from engineering if it is so loose or weakened that it could cause the driver to lose control of the vehicle.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Loose driver seat could cause loss of vehicle control.'
            },
            {
                type: 'final',
                title: 'Passenger Seat Critical',
                content: 'Stop and await assistance from engineering if the seat is likely to become displaced and can\'t be secured.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Displaced passenger seat presents injury risk.',
                actions: [
                    'Driver may try to secure the seat, and if successful, continue to the next suitable changeover point and arrange a change within 1 hour.',
                    'If the seat damage is likely to cause injury or damage clothing, secure the area if possible.',
                    'If it can\'t be secured, the driver should Stop and await assistance from engineering and seek assistance from Engineering.'
                ]
            },
            {
                type: 'final',
                title: 'Body Panel Critical',
                content: 'Stop and await assistance from engineering if the damage is likely to become detached, protrude into the road, or cause injury.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Body panel damage presents road hazard or injury risk.'
            },
            {
                type: 'final',
                title: 'Interior Panel Critical',
                content: 'Stop and await assistance from engineering if the damage is likely to become detached or cause injury.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Interior panel damage presents passenger injury risk.'
            },
            {
                type: 'final',
                title: 'Bumper Critical',
                content: 'Stop and await assistance from engineering if detachment is likely, either partially or completely, or if the bumper has projections or jagged edges likely to cause injury.',
                result: 'Stop and await engineering assistance.',
                severity: 'stop',
                stopReason: 'Bumper damage presents injury risk or road hazard.'
            },

            // Continue outcomes
            {
                type: 'final',
                title: 'Floor Continue',
                content: 'Otherwise, continue to a suitable changeover point.',
                result: 'Continue to suitable changeover point.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'Seat Continue',
                content: 'Otherwise, continue to a suitable changeover point.',
                result: 'Continue to suitable changeover point.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'Passenger Seat Secure',
                content: 'Driver may try to secure the seat, and if successful, continue to the next suitable changeover point and arrange a change within 1 hour.',
                result: 'Secure seat if possible, continue to changeover point.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'Body Panel Secure',
                content: 'If it can be secured, continue to the next convenient changeover point.',
                result: 'Secure panel and continue to changeover point.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'Interior Panel Secure',
                content: 'Otherwise, secure the panel and continue to the next changeover point.',
                result: 'Secure panel and continue to changeover point.',
                severity: 'warning'
            },
            {
                type: 'final',
                title: 'Bumper Secure',
                content: 'If it can be secured, the driver should attempt to secure it and continue to the next changeover point.',
                result: 'Secure bumper and continue to changeover point.',
                severity: 'warning'
            }
        ]
    },

    'repeat-defects': {
        title: 'Repeat Defects',
        description: 'Management of recurring or persistent vehicle defects',
        priority: 2,
        severity: 'warning',
        icon: '🔄',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Repeat Defects',
                content: 'If a driver reports a defect on a bus that has already been identified earlier or persists over multiple days, follow these steps to ensure proper escalation and resolution:'
            },
            {
                type: 'question',
                title: 'Type of Repeat Defect',
                content: 'What type of repeat defect has been reported?',
                options: [
                    {
                        text: 'Same-Day Repeat Defects',
                        nextStep: 'same-day-repeat',
                        severity: 'warning'
                    },
                    {
                        text: 'Multi-Day Repeat Defects',
                        nextStep: 'multi-day-repeat',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Step 1: Same-Day Repeat Defects',
                content: 'If a bus is taken out of service due to defects and later reallocated with the same unresolved defects:',
                result: 'Report immediately to Engineering Delivery Director.',
                severity: 'warning',
                actions: [
                    'Action: Report the issue immediately to the Engineering Delivery Director.',
                    'Notification: Ensure copies of the report are sent to the General Manager and Engineering Manager.',
                    'Report Accurately: Report on their handheld device immediately, include pictures if appropriate.',
                    'Escalation: Ensure timely communication with engineering and management to prevent service reliability issues and ensure vehicles are roadworthy.',
                    'Documentation: Maintain accurate records of all reported defects are documented',
                    'Safety First: Prioritise addressing defects that could compromise the safety of passengers, drivers, or other road users.'
                ]
            },
            {
                type: 'final',
                title: 'Step 2: Multi-Day Repeat Defects',
                content: 'If a bus continues to operate over several days with the same unresolved reported defects:',
                result: 'Report immediately to Engineering Delivery Director.',
                severity: 'warning',
                actions: [
                    'Action: Report the issue immediately to the Engineering Delivery Director.',
                    'Notification: Ensure copies of the report are sent to the General Manager and Engineering Manager.',
                    'Report Accurately: Report on their handheld device immediately, include pictures if appropriate.',
                    'Escalation: Ensure timely communication with engineering and management to prevent service reliability issues and ensure vehicles are roadworthy.',
                    'Documentation: Maintain accurate records of all reported defects are documented',
                    'Safety First: Prioritise addressing defects that could compromise the safety of passengers, drivers, or other road users.'
                ]
            }
        ]
    },

    'speedo-not-working': {
        title: 'Speedo Not Working',
        description: 'Speedometer failure and tachograph considerations',
        priority: 2,
        severity: 'warning',
        icon: '🌐',
        color: '#f59e0b',
        steps: [
            {
                type: 'info',
                title: 'Speedo Not Working',
                content: 'Steps to follow:'
            },
            {
                type: 'question',
                title: 'Check if the Tacho Head is Closed',
                content: 'Check if the Tacho Head is Closed (if the vehicle is fitted with a tachograph).',
                options: [
                    {
                        text: 'Vehicle has tachograph and tacho head is closed',
                        nextStep: 'tacho-closed',
                        severity: 'continue'
                    },
                    {
                        text: 'Vehicle does not have a tachograph',
                        nextStep: 'no-tachograph',
                        severity: 'warning'
                    }
                ]
            },
            {
                type: 'final',
                title: 'Tachograph Present and Closed',
                content: 'If the tacho head is closed, continue to next step.',
                result: 'May continue with tachograph recording.',
                severity: 'continue'
            },
            {
                type: 'final',
                title: 'No Tachograph Available',
                content: 'If the vehicle does not have a tachograph, arrange a changeover at the next convenient location and time, within a reasonable time frame.',
                result: 'Arrange changeover at next convenient location within reasonable time frame.',
                severity: 'warning',
                actions: [
                    'Reasonable means arranging a changeover at the earliest opportunity, avoiding any unnecessary delay or loss of mileage.',
                    'If the vehicle is going a considerable distance before passing an established changeover point, plan to change the vehicle at a convenient point en-route.',
                    'If the driver must continue without a functioning speedometer to reach the changeover point, they should be instructed to drive with extreme caution and ensure they do not exceed any speed limits.',
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
    Object.assign(diagnosticFlows, additionalFlows4);
} else {
    // Fallback: create global diagnosticFlows if it doesn't exist
    window.diagnosticFlows = additionalFlows4;
}

console.log('Industry best-practice diagnostic flows loaded - Exact text compliance maintained');