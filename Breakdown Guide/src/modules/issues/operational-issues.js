/**
 * Operational Issues Module
 * Contains diagnostic flows for operational problems
 * Priority 3-4 issues affecting day-to-day operations
 */

const OPERATIONAL_ISSUES_MODULE = {
    
    // NON-STARTER
    'non-starter': {
        id: 'non-starter', 
        title: 'Vehicle Won\'t Start', 
        category: 'operational', 
        priority: 3,
        estimatedTime: '90-120 seconds', 
        severity: 'moderate', 
        icon: '🔑', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 9: Non Starter',
        steps: [
            {
                type: 'action', 
                title: 'Initial troubleshooting checks',
                subtitle: 'Complete these basic checks first',
                instructions: [
                    'Ensure vehicle is out of gear and in neutral',
                    'Check if any lights illuminated/flashing on gear selector',
                    'Turn off all instruments including main switch',
                    'Confirm engine bay door is closed and secure',
                    'Turn vehicle back on and attempt to start'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Did the vehicle start after reset?',
                options: [
                    { text: '✅ YES - Vehicle started', nextStep: 2, severity: 'continue' },
                    { text: '❌ NO - Still won\'t start', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Vehicle Started', 
                result: 'Continue in service normally',
                severity: 'continue',
                actions: [
                    'Continue service as normal', 
                    'Monitor starting performance', 
                    'Report if problem recurs'
                ]
            },
            {
                type: 'question', 
                title: 'Is it safe to attempt a rear start?',
                subtitle: 'Safety assessment for rear start procedure',
                content: 'SAFETY WARNING: Driver must exercise caution',
                quickCheck: [
                    'Remove ties and lanyards or secure over shoulder',
                    'Prevent entanglement in belt',
                    'Ensure safe working position'
                ],
                options: [
                    { text: '✅ YES - Safe to attempt rear start', nextStep: 4, severity: 'moderate' },
                    { text: '❌ NO - Unsafe conditions', nextStep: 6, severity: 'stop' }
                ]
            },
            {
                type: 'action', 
                title: 'Rear start attempt',
                instructions: [
                    'Ensure all safety precautions taken',
                    'Attempt rear start carefully',
                    'If engine starts, leave it running'
                ],
                nextStep: 5
            },
            {
                type: 'question', 
                title: 'Did rear start work?',
                options: [
                    { text: '✅ YES - Engine started', nextStep: 7, severity: 'changeover' },
                    { text: '❌ NO - Still won\'t start', nextStep: 6, severity: 'stop' }
                ]
            },
            {
                type: 'action', 
                title: 'Gather diagnostic information',
                subtitle: 'Collect information for engineering',
                instructions: [
                    'Ask: Is the oil light illuminated?',
                    'Ask: Was there smoke from exhaust?',
                    'Ask: Is engine trying to start or completely unresponsive?'
                ],
                nextStep: 8
            },
            {
                type: 'final', 
                title: '⚠️ Engine Started - Arrange Changeover', 
                result: 'Leave engine running and arrange changeover',
                severity: 'changeover',
                actions: [
                    'Leave engine running until engineer attends', 
                    'Arrange changeover if necessary', 
                    'Do not switch off engine'
                ],
                contacts: ['Engineering Team for inspection']
            },
            {
                type: 'final', 
                title: '🛑 Vehicle Immobilized', 
                result: 'Await engineering assistance',
                severity: 'stop',
                actions: [
                    'Provide diagnostic information to Engineering', 
                    'Await engineering assistance', 
                    'Arrange alternative service'
                ],
                contacts: ['Engineering Team with diagnostic details']
            }
        ]
    },

    // DEMISTERS/HEATERS
    'demisters-heaters': {
        id: 'demisters-heaters', 
        title: 'Demisters/Heaters Not Working', 
        category: 'operational', 
        priority: 4,
        estimatedTime: '75-90 seconds', 
        severity: 'moderate', 
        icon: '🌡️', 
        color: '#f59e0b',
        sdcReference: 'SDC Guide Section 15: Demisters/Heaters Not Working',
        steps: [
            {
                type: 'question', 
                title: 'Check demister operation',
                subtitle: 'Are the demisters blowing air?',
                options: [
                    { text: '❄️ Not blowing at all', nextStep: 1, severity: 'moderate' },
                    { text: '🌬️ Blowing cold air only', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'Vision impairment check',
                subtitle: 'Is driver\'s visibility affected?',
                content: 'Also check for blockages (bags, newspapers, etc.)',
                options: [
                    { text: '👁️ YES - Visibility impaired', nextStep: 2, severity: 'stop' },
                    { text: '✅ NO - Visibility not affected', nextStep: 4, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Vision Impaired', 
                result: 'Vehicle should not continue with impaired vision',
                severity: 'stop',
                actions: [
                    'Driver\'s vision is priority', 
                    'Vehicle should not continue', 
                    'Contact Engineering'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Check saloon temperature',
                subtitle: 'What is the current saloon temperature?',
                content: 'Vehicle should have had adequate warm-up time (at least 1 hour in service)',
                options: [
                    { text: '🌡️ 16 degrees or above', nextStep: 5, severity: 'continue' },
                    { text: '❄️ Below 16 degrees', nextStep: 6, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Take to Changeover', 
                result: 'Continue until replacement available',
                severity: 'changeover',
                actions: [
                    'Take to nearest changeover point', 
                    'Continue until replacement becomes available', 
                    'Changeover not urgent if visibility OK'
                ]
            },
            {
                type: 'final', 
                title: '✅ Continue - Not Urgent', 
                result: 'Continue until replacement available',
                severity: 'continue',
                actions: [
                    'Continue in service', 
                    'Changeover not urgent', 
                    'Temperature acceptable for passenger comfort'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Cold Bus - Priority Changeover', 
                result: 'Change over as soon as possible',
                severity: 'changeover',
                actions: [
                    'Vehicle should be changed over ASAP', 
                    'Check with engineering hourly if immediate changeover not possible', 
                    'Report to Depot Manager if situation unreasonable'
                ]
            }
        ]
    },

    // DOORS NOT WORKING
    'doors': {
        id: 'doors', 
        title: 'Door Problems', 
        category: 'operational', 
        priority: 3,
        estimatedTime: '75-90 seconds', 
        severity: 'moderate', 
        icon: '🚪', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 17: Doors Not Working',
        steps: [
            {
                type: 'action', 
                title: 'Initial door system checks',
                subtitle: 'Check basic door controls and obstructions',
                instructions: [
                    'Check if door control buttons are stuck (inside and outside)',
                    'Confirm no obstructions behind or under doors',
                    'Listen for air leaks',
                    'Check air pressure and try building it up'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Did basic checks resolve the issue?',
                options: [
                    { text: '✅ YES - Doors working normally', nextStep: 2, severity: 'continue' },
                    { text: '❌ NO - Problem persists', nextStep: 3, severity: 'variable' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Doors Working', 
                result: 'Continue service normally',
                severity: 'continue',
                actions: [
                    'Continue normal operations', 
                    'Monitor door performance', 
                    'Report any recurrence'
                ]
            },
            {
                type: 'question', 
                title: 'Critical door safety assessment',
                subtitle: 'Are any of these critical defects present?',
                content: 'STOP if ANY of these defects are present:',
                quickCheck: [
                    'Doors jammed closed',
                    'Doors cannot be retained in closed position',
                    'Hinges, catches, or pillars loose/insecure',
                    'Doors difficult to shut or likely to open inadvertently',
                    'Doors stiff and cannot fully open or close'
                ],
                options: [
                    { text: '🚨 YES - Critical defects present', nextStep: 4, severity: 'stop' },
                    { text: '✅ NO - No critical defects', nextStep: 5, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Critical Door Defect', 
                result: 'Stop and seek engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Critical door safety defect present', 
                    'Contact Engineering', 
                    'Record on Go-Check'
                ],
                contacts: ['Engineering Team - Door Safety Issue']
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'Continue to next convenient changeover location',
                severity: 'changeover',
                actions: [
                    'Continue to next convenient changeover', 
                    'Monitor door operation', 
                    'Record defect on Go-Check'
                ]
            }
        ]
    },

    // LOW WATER
    'low-water': {
        id: 'low-water', 
        title: 'Low Water Level', 
        category: 'operational', 
        priority: 3,
        estimatedTime: '90-120 seconds', 
        severity: 'moderate', 
        icon: '💧', 
        color: '#3b82f6',
        sdcReference: 'SDC Guide Section 16: Low Water',
        steps: [
            {
                type: 'question', 
                title: 'Check for water leaks',
                subtitle: 'Inspect for visible water leaks',
                options: [
                    { text: '💧 Leaks present', nextStep: 1, severity: 'variable' },
                    { text: '✅ No leaks found', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'Can bus reach next changeover point safely?',
                subtitle: 'Distance assessment with leak present',
                options: [
                    { text: '✅ YES - Short distance to changeover', nextStep: 2, severity: 'changeover' },
                    { text: '❌ NO - Too far or unsafe', nextStep: 9, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover with Leak', 
                result: 'Continue carefully to nearest changeover',
                severity: 'changeover',
                actions: [
                    'Continue to changeover point', 
                    'Monitor water levels', 
                    'Stop if situation worsens'
                ]
            },
            {
                type: 'question', 
                title: 'Is the water buzzer sounding?',
                options: [
                    { text: '🔇 NO - No buzzer', nextStep: 4, severity: 'continue' },
                    { text: '🔊 YES - Buzzer sounding', nextStep: 5, severity: 'moderate' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Continue to Changeover', 
                result: 'Continue to next convenient changeover point',
                severity: 'changeover',
                actions: [
                    'Continue to changeover point', 
                    'Monitor water levels', 
                    'Record on Go-Check'
                ]
            },
            {
                type: 'question', 
                title: 'Recent water top-up status',
                subtitle: 'When was the water last topped up?',
                content: 'Check SDC top-up log if driver unsure',
                options: [
                    { text: '⏰ Recently filled at depot', nextStep: 6, severity: 'moderate' },
                    { text: '❓ Long time ago or unsure', nextStep: 7, severity: 'moderate' }
                ]
            },
            {
                type: 'action', 
                title: 'Arrange en-route top-up',
                instructions: [
                    'Arrange water top-up by authorized staff',
                    'See if this resolves the issue',
                    'Monitor buzzer status'
                ],
                nextStep: 8
            },
            {
                type: 'question', 
                title: 'Top-up feasibility',
                subtitle: 'Can a top-up be arranged en-route?',
                options: [
                    { text: '✅ YES - Top-up feasible', nextStep: 6, severity: 'moderate' },
                    { text: '❌ NO - Not feasible', nextStep: 9, severity: 'stop' }
                ]
            },
            {
                type: 'question', 
                title: 'Did top-up resolve the issue?',
                options: [
                    { text: '✅ YES - Issue resolved', nextStep: 4, severity: 'continue' },
                    { text: '❌ NO - Problem persists', nextStep: 10, severity: 'changeover' },
                    { text: '🔄 Second top-up needed', nextStep: 10, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Seek Engineering Advice', 
                result: 'Stop and contact engineering',
                severity: 'stop',
                actions: [
                    'Contact Engineering for advice', 
                    'Situation too complex for standard procedure', 
                    'Safety priority'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'final', 
                title: '⚠️ Continue with Planned Changeover', 
                result: 'Arrange changeover at earliest opportunity',
                severity: 'changeover',
                actions: [
                    'Continue temporarily', 
                    'Schedule changeover at nearest suitable location', 
                    'Monitor water levels closely', 
                    'In case of second top-up, changeover is mandatory'
                ]
            }
        ]
    },

    // WIPERS/SCREENWASH
    'wipers-screenwash': {
        id: 'wipers-screenwash', 
        title: 'Wipers/Screen Wash Issues', 
        category: 'operational', 
        priority: 3,
        estimatedTime: '60-75 seconds', 
        severity: 'moderate', 
        icon: '🧽', 
        color: '#3b82f6',
        sdcReference: 'SDC Guide Section 12: Wipers/Screen Wash',
        steps: [
            {
                type: 'question', 
                title: 'Wiper system assessment',
                subtitle: 'Identify the specific wiper/wash issue',
                content: 'Gather information about the problem:',
                quickCheck: [
                    'Is whole blade or arm missing?',
                    'Which side of windscreen affected?',
                    'Are wipers moving at all?',
                    'Are windscreen washers inoperative/inadequate?',
                    'Can you hear wiper motor whirring?'
                ],
                options: [
                    { text: '👁️ Driver\'s vision impaired', nextStep: 1, severity: 'stop' },
                    { text: '✅ Vision not impaired', nextStep: 2, severity: 'moderate' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Vision Impaired', 
                result: 'Stop immediately due to impaired vision',
                severity: 'stop',
                actions: [
                    'Stop immediately', 
                    'Driver\'s vision safety is critical', 
                    'Contact Engineering assistance'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Assess urgency based on conditions',
                subtitle: 'Consider weather and route factors',
                content: 'Evaluate the situation urgency:',
                quickCheck: [
                    'Current weather conditions',
                    'Route type (A19, A1M require priority)',
                    'Long stretches on major roads'
                ],
                options: [
                    { text: '🚨 Urgent - Bad weather/major roads', nextStep: 3, severity: 'changeover' },
                    { text: '⚠️ Moderate - Acceptable conditions', nextStep: 4, severity: 'continue' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Priority Changeover', 
                result: 'Arrange priority changeover due to conditions',
                severity: 'changeover',
                actions: [
                    'Prioritized changeover needed', 
                    'Weather/route conditions require immediate action', 
                    'Clean windscreen at safe location if possible'
                ]
            },
            {
                type: 'action', 
                title: 'Temporary measures',
                instructions: [
                    'Clean windscreen at safe location if conditions allow',
                    'Top up washer system at convenient location if necessary',
                    'Arrange changeover when convenient'
                ],
                nextStep: 5
            },
            {
                type: 'final', 
                title: '⚠️ Continue with Changeover', 
                result: 'Continue but arrange changeover promptly',
                severity: 'changeover',
                actions: [
                    'Continue service temporarily', 
                    'Arrange changeover at convenient time', 
                    'Record defect on Go-Check'
                ]
            }
        ]
    },

    // DEMISTERS/HEATERS
    'demisters-heaters': {
        id: 'demisters-heaters', 
        title: 'Demisters/Heaters Not Working', 
        category: 'operational', 
        priority: 4,
        estimatedTime: '75-90 seconds', 
        severity: 'moderate', 
        icon: '🌡️', 
        color: '#f59e0b',
        sdcReference: 'SDC Guide Section 15: Demisters/Heaters Not Working',
        steps: [
            {
                type: 'question', 
                title: 'Check demister operation',
                subtitle: 'Are the demisters blowing air?',
                options: [
                    { text: '❄️ Not blowing at all', nextStep: 1, severity: 'moderate' },
                    { text: '🌬️ Blowing cold air only', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'question', 
                title: 'Vision impairment check',
                subtitle: 'Is driver\'s visibility affected?',
                content: 'Also check for blockages (bags, newspapers, etc.)',
                options: [
                    { text: '👁️ YES - Visibility impaired', nextStep: 2, severity: 'stop' },
                    { text: '✅ NO - Visibility not affected', nextStep: 4, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '🛑 STOP - Vision Impaired', 
                result: 'Vehicle should not continue with impaired vision',
                severity: 'stop',
                actions: [
                    'Driver\'s vision is priority', 
                    'Vehicle should not continue', 
                    'Contact Engineering'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Check saloon temperature',
                subtitle: 'What is the current saloon temperature?',
                content: 'Vehicle should have had adequate warm-up time (at least 1 hour in service)',
                options: [
                    { text: '🌡️ 16 degrees or above', nextStep: 5, severity: 'continue' },
                    { text: '❄️ Below 16 degrees', nextStep: 6, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Take to Changeover', 
                result: 'Continue until replacement available',
                severity: 'changeover',
                actions: [
                    'Take to nearest changeover point', 
                    'Continue until replacement becomes available', 
                    'Changeover not urgent if visibility OK'
                ]
            },
            {
                type: 'final', 
                title: '✅ Continue - Not Urgent', 
                result: 'Continue until replacement available',
                severity: 'continue',
                actions: [
                    'Continue in service', 
                    'Changeover not urgent', 
                    'Temperature acceptable for passenger comfort'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Cold Bus - Priority Changeover', 
                result: 'Change over as soon as possible',
                severity: 'changeover',
                actions: [
                    'Vehicle should be changed over ASAP', 
                    'Check with engineering hourly if immediate changeover not possible', 
                    'Report to Depot Manager if situation unreasonable'
                ]
            }
        ]
    },

    // SPEEDO NOT WORKING
    'speedo': {
        id: 'speedo', 
        title: 'Speedometer Not Working', 
        category: 'operational', 
        priority: 3,
        estimatedTime: '45-60 seconds', 
        severity: 'moderate', 
        icon: '⏱️', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 31: Speedo Not Working',
        steps: [
            {
                type: 'question', 
                title: 'Check tachograph status',
                subtitle: 'Is the vehicle fitted with a tachograph?',
                options: [
                    { text: '📊 YES - Vehicle has tachograph', nextStep: 1, severity: 'moderate' },
                    { text: '❌ NO - No tachograph fitted', nextStep: 3, severity: 'changeover' }
                ]
            },
            {
                type: 'question', 
                title: 'Is the tacho head closed?',
                options: [
                    { text: '✅ YES - Tacho head closed', nextStep: 2, severity: 'continue' },
                    { text: '❌ NO - Tacho head not closed', nextStep: 3, severity: 'changeover' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Continue with Tachograph', 
                result: 'Continue - tachograph provides speed reference',
                severity: 'continue',
                actions: [
                    'Continue service normally', 
                    'Tachograph provides adequate speed monitoring', 
                    'Arrange repair when convenient'
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Arrange Changeover', 
                result: 'Arrange changeover at earliest opportunity',
                severity: 'changeover',
                actions: [
                    'Arrange changeover at earliest opportunity', 
                    'Avoid unnecessary delay or loss of mileage', 
                    'If considerable distance to changeover, plan en-route change', 
                    'Driver must drive with EXTREME CAUTION', 
                    'Ensure speed limits not exceeded'
                ]
            }
        ]
    },

    // RAMP STUCK OUT
    'ramp-stuck': {
        id: 'ramp-stuck', 
        title: 'Ramp Stuck Out', 
        category: 'operational', 
        priority: 3,
        estimatedTime: '60-75 seconds', 
        severity: 'moderate', 
        icon: '♿', 
        color: '#eab308',
        sdcReference: 'SDC Guide Section 20: Ramp Stuck Out',
        steps: [
            {
                type: 'action', 
                title: 'Reset vehicle system',
                instructions: [
                    'Switch off ignition completely', 
                    'Reset the vehicle', 
                    'Restart and check if ramp retracts'
                ],
                nextStep: 1
            },
            {
                type: 'question', 
                title: 'Did reset clear the ramp issue?',
                options: [
                    { text: '✅ YES - Ramp retracted', nextStep: 2, severity: 'continue' },
                    { text: '❌ NO - Ramp still stuck', nextStep: 3, severity: 'moderate' }
                ]
            },
            {
                type: 'final', 
                title: '✅ Ramp Working', 
                result: 'Continue in service normally',
                severity: 'continue',
                actions: [
                    'Continue service normally', 
                    'Monitor ramp operation', 
                    'Report if problem recurs'
                ]
            },
            {
                type: 'question', 
                title: 'Driver training assessment',
                subtitle: 'Is driver risk assessed for manual ramp retraction?',
                content: 'IMPORTANT: Training to use manual ramps is NOT the same as being risk assessed to manually retract a stuck ramp',
                options: [
                    { text: '✅ YES - Risk assessed for manual retraction', nextStep: 4, severity: 'moderate' },
                    { text: '❌ NO - Not risk assessed', nextStep: 5, severity: 'stop' }
                ]
            },
            {
                type: 'action', 
                title: 'Attempt manual retraction',
                instructions: [
                    'Use the trained method for manual retraction', 
                    'Follow safety procedures', 
                    'Attempt to retract ramp manually'
                ],
                nextStep: 6
            },
            {
                type: 'final', 
                title: '🛑 STOP - Await Engineering', 
                result: 'Stop and await engineering assistance',
                severity: 'stop',
                actions: [
                    'Stop vehicle', 
                    'Driver not qualified for manual retraction', 
                    'Contact Engineering for assistance'
                ],
                contacts: ['Engineering Team']
            },
            {
                type: 'question', 
                title: 'Did manual retraction work?',
                options: [
                    { text: '✅ YES - Ramp retracted manually', nextStep: 7, severity: 'changeover' },
                    { text: '❌ NO - Manual retraction failed', nextStep: 5, severity: 'stop' }
                ]
            },
            {
                type: 'final', 
                title: '⚠️ Manual Retraction Success', 
                result: 'Continue but arrange changeover for repair',
                severity: 'changeover',
                actions: [
                    'Ramp manually retracted', 
                    'Arrange changeover for proper repair', 
                    'Record incident on Go-Check'
                ]
            }
        ]
    }

};

// Export the module
if (typeof window !== 'undefined') {
    window.OPERATIONAL_ISSUES_MODULE = OPERATIONAL_ISSUES_MODULE;
}