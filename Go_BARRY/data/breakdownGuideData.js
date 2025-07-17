            detail: 'Instruct the driver to STOP immediately and seek assistance from engineering.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Safety First: Ensure the driver stops immediately if there is any doubt about the severity',
      'Record the defect immediately on Go-Check',
      'Fire or Hazard Risk: If oil leak poses fire risk or hazard to other road users, escalate immediately as PG9 may be issued',
      'Service Continuity: Coordinate with engineering to arrange replacement vehicle promptly'
    ],
    relatedIssues: ['non-starter', 'excessive-smoke', 'safety-declaration']
  },

  {
    id: 'broken-windows',
    title: 'Broken Windows',
    category: 'maintenance',
    severity: 'medium',
    description: 'Assessment and response to broken window situations.',
    keywords: ['windows', 'glass', 'broken', 'vandalism', 'safety'],
    steps: [
      {
        title: 'Check Driver Fitness',
        substeps: [
          {
            condition: 'Driver fit and well',
            action: 'Continue Assessment',
            detail: 'Proceed to passenger check.'
          },
          {
            condition: 'Driver not fit',
            action: 'Medical Attention',
            detail: 'Seek medical attention and organise a replacement driver.'
          }
        ]
      },
      {
        title: 'Check Passengers',
        substeps: [
          {
            condition: 'All passengers unharmed',
            action: 'Continue Assessment',
            detail: 'Proceed to vehicle assessment.'
          },
          {
            condition: 'Passengers harmed',
            action: 'Medical Attention',
            detail: 'Seek medical attention.'
          }
        ]
      },
      {
        title: 'Vehicle Safety Assessment',
        substeps: [
          {
            condition: 'Driver view seriously impaired OR danger to occupants OR detachment of loose articles likely',
            action: 'Stop Immediately',
            detail: 'Stop immediately and seek assistance from engineering.'
          },
          {
            condition: 'No immediate danger',
            action: 'Continue to Changeover',
            detail: 'Continue to the next appropriate changeover point. Driver must remain vigilant and stop if situation changes.'
          }
        ]
      },
      {
        title: 'Vandalism Assessment',
        substeps: [
          {
            condition: 'Vehicle vandalized beyond windows affecting brakes, steering, or control systems',
            action: 'Stop Immediately',
            detail: 'The bus must remain stationary.'
          },
          {
            condition: 'Driver disagrees with continuing',
            action: 'Stop and Report',
            detail: 'Advise them to remain where they are. Report to depot management and seek replacement driver.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location',
      'Consider extent of damage: Sharp edges, loose parts, damaged lights, etc.',
      'Consult engineering if you do not believe the vehicle can continue'
    ],
    relatedIssues: ['interior-exterior-damage', 'safety-declaration']
  },

  {
    id: 'doors-not-working',
    title: 'Doors Not Working',
    category: 'operation',
    severity: 'medium',
    description: 'Troubleshooting and assessment of door system issues.',
    keywords: ['doors', 'air pressure', 'control buttons', 'obstruction'],
    steps: [
      {
        title: 'Initial Checks',
        substeps: [
          {
            action: 'Check Door Control Buttons',
            detail: 'Ask the driver to check if any door control buttons are stuck (both inside and outside the bus).'
          },
          {
            action: 'Check for Obstructions',
            detail: 'Confirm there are no obstructions behind or under the doors.'
          }
        ]
      },
      {
        title: 'Air System Check',
        substeps: [
          {
            action: 'Listen for Air Leaks',
            detail: 'Instruct the driver to check for air leaks.'
          },
          {
            action: 'Check Air Pressure',
            detail: 'Ask the driver to monitor air pressure and try to build it up to see if this resolves the issue.'
          }
        ]
      },
      {
        title: 'Critical Door Issues - Stop Immediately',
        substeps: [
          {
            condition: 'Doors are jammed closed',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          },
          {
            condition: 'Doors cannot be retained in closed position',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          },
          {
            condition: 'Door hinges, catches, or pillars loose/insecure/weakened',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          },
          {
            condition: 'Doors are stiff and cannot fully open or close',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          }
        ]
      },
      {
        title: 'Non-Critical Issues',
        substeps: [
          {
            condition: 'None of the critical defects present',
            action: 'Continue to Changeover',
            detail: 'Advise driver to continue in service and proceed to next convenient location for bus changeover.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Safety is the priority - if driver has concerns about continuing, escalate to engineering',
      'If vehicle can safely continue, ensure changeover arranged at earliest opportunity',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location'
    ],
    relatedIssues: ['ramp-stuck', 'air-pressure-issues']
  },

  {
    id: 'exterior-lights',
    title: 'Exterior Lights',
    category: 'electrical',
    severity: 'medium',
    description: 'Assessment and response to exterior lighting issues.',
    keywords: ['headlights', 'indicators', 'brake lights', 'LED', 'darkness'],
    steps: [
      {
        title: 'Headlights',
        substeps: [
          {
            condition: 'Headlight out or less than 50% illuminated in LED unit',
            action: 'Check Operating Hours',
            detail: 'Assess if vehicle is operating in hours of darkness on unrestricted road.'
          },
          {
            condition: 'Operating in darkness on unrestricted road',
            action: 'Must Not Continue',
            detail: 'Vehicle must not continue.'
          },
          {
            condition: 'Not operating in darkness',
            action: 'Arrange Changeover',
            detail: 'Bus can continue but changeover must be arranged before hours of darkness.'
          }
        ]
      },
      {
        title: 'Indicators',
        substeps: [
          {
            condition: 'Direction indicator or side repeater not working',
            action: 'Stop and Wait',
            detail: 'Advise the driver to stop and await engineering attendance.'
          }
        ]
      },
      {
        title: 'Brake Lights',
        substeps: [
          {
            action: 'Assessment Questions',
            detail: 'Ask: Is it a low level brake light? Are brake lights on constantly? Is one or both lights inoperative?'
          },
          {
            condition: 'Both low level brake lights not working OR on constantly',
            action: 'Stop and Wait',
            detail: 'Advise driver to stop and await engineering attendance.'
          },
          {
            condition: 'One brake light not working',
            action: 'Continue to Changeover',
            detail: 'Advise driver to continue in service and proceed to next convenient location for bus changeover.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'If vehicle can safely continue, ensure changeover arranged at earliest opportunity',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location'
    ],
    relatedIssues: ['interior-lights', 'battery-light', 'warning-lights']
  },

  {
    id: 'interior-lights',
    title: 'Interior Lights',
    category: 'electrical',
    severity: 'low',
    description: 'Assessment of interior lighting functionality.',
    keywords: ['interior lights', 'step light', 'doors', 'darkness'],
    steps: [
      {
        title: 'Light Assessment',
        substeps: [
          {
            action: 'Check Coverage',
            detail: 'Are at least 50% of the lights on each deck illuminated? (i.e., at least one side of the lights working)'
          },
          {
            action: 'Check Step Light',
            detail: 'Is the step light working when the doors are open?'
          }
        ]
      },
      {
        title: 'Decision Matrix',
        substeps: [
          {
            condition: 'Both questions answered "yes"',
            action: 'Continue with Changeover',
            detail: 'Bus can continue in service, but changeover should be arranged as soon as possible.'
          },
          {
            condition: 'Either question answered "no"',
            action: 'Immediate Changeover',
            detail: 'Arrange for the bus to be changed over immediately.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Changeover especially important if operating during darkness',
      'Safety is priority - if driver has concerns, escalate to engineering',
      'Record defects on Go-Check System'
    ],
    relatedIssues: ['exterior-lights', 'battery-light']
  },

  {
    id: 'wipers-screenwash',
    title: 'Wipers Not Working / Screen Wash',
    category: 'operation',
    severity: 'medium',
    description: 'Assessment and response to wiper and screen wash issues.',
    keywords: ['wipers', 'screen wash', 'windscreen', 'vision', 'weather'],
    steps: [
      {
        title: 'Assessment Questions',
        substeps: [
          {
            action: 'Damage Assessment',
            detail: 'Is the whole blade or arm missing? Which side of the windscreen is affected?'
          },
          {
            action: 'Functionality Check',
            detail: 'Are the wipers moving at all? Are windscreen washers inoperative or inadequate? Can you hear the wiper motor whirring?'
          }
        ]
      },
      {
        title: 'Vision Impact Assessment',
        substeps: [
          {
            condition: 'Driver vision is impaired',
            action: 'Stop Immediately',
            detail: 'Advise them to stop immediately and await engineering assistance.'
          },
          {
            condition: 'Vision not impaired',
            action: 'Assess Urgency',
            detail: 'Consider weather conditions and route requirements.'
          }
        ]
      },
      {
        title: 'Route and Weather Considerations',
        substeps: [
          {
            condition: 'Long stretches on major roads (A19, A1M) or adverse weather',
            action: 'Prioritise Changeover',
            detail: 'Arrange prioritised changeover due to safety requirements.'
          },
          {
            condition: 'Local routes in good weather',
            action: 'Standard Changeover',
            detail: 'Arrange changeover at convenient location.'
          }
        ]
      },
      {
        title: 'Temporary Measures',
        substeps: [
          {
            action: 'Manual Cleaning',
            detail: 'Advise driver or supervisor to clean windscreen at safe location if conditions allow.'
          },
          {
            action: 'Washer Top-Up',
            detail: 'Arrange for washer system to be topped up at convenient location if necessary.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Ensure planned changeover arranged promptly for vehicles permitted to continue',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location',
      'Escalate persistent, unwarranted wiper-related reports to depot management team'
    ],
    relatedIssues: ['broken-windows', 'demisters-heaters']
  },

  {
    id: 'low-water',
    title: 'Low Water',
    category: 'maintenance',
    severity: 'medium',
    description: 'Water level assessment and top-up procedures.',
    keywords: ['water', 'coolant', 'buzzer', 'leak', 'top-up'],
    steps: [
      {
        title: 'Check for Leaks',
        substeps: [
          {
            condition: 'No leaks present',
            action: 'Check Water Buzzer',
            detail: 'Proceed to Step 2.'
          },
          {
            condition: 'Leak found',
            action: 'Assess Distance',
            detail: 'Assess if bus can safely reach next convenient changeover point. If short distance, advise continue. If not, seek advice from engineering.'
          }
        ]
      },
      {
        title: 'Water Buzzer Status',
        substeps: [
          {
            condition: 'No buzzer',
            action: 'Continue to Changeover',
            detail: 'Advise driver to continue to next convenient changeover point.'
          },
          {
            condition: 'Buzzer sounding',
            action: 'Check Recent Top-Up',
            detail: 'Proceed to Step 3.'
          }
        ]
      },
      {
        title: 'Recent Water Top-Up Check',
        substeps: [
          {
            condition: 'Recently filled at depot',
            action: 'Arrange En-Route Top-Up',
            detail: 'Arrange for top-up en route by authorised staff to see if issue is resolved.'
          },
          {
            condition: 'Filled long time ago or driver unsure',
            action: 'Verify and Top-Up',
            detail: 'Use SDC top up log to verify. Arrange top-up en route if feasible. If not feasible, seek advice from engineering.'
          }
        ]
      },
      {
        title: 'If Top-Up Does Not Resolve Issue',
        substeps: [
          {
            condition: 'Second top-up required',
            action: 'Changeover Required',
            detail: 'Arrange for bus to continue temporarily and schedule changeover at nearest suitable location at earliest opportunity.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Safety is priority - if driver has concerns about continuing, escalate to engineering immediately',
      'If vehicle can safely continue, ensure changeover arranged at earliest opportunity',
      'Ensure all actions including top-ups and changeovers are communicated to driver promptly',
      'Monitor situation and provide updates to driver as needed',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location'
    ],
    relatedIssues: ['overheating', 'excessive-smoke']
  },

  {
    id: 'puncture',
    title: 'Puncture',
    category: 'maintenance',
    severity: 'high',
    description: 'Puncture assessment and immediate response.',
    keywords: ['puncture', 'tire', 'tyre', 'wheel', 'inner', 'outer'],
    steps: [
      {
        title: 'Determine Puncture Position',
        substeps: [
          {
            action: 'Identify Location',
            detail: 'Identify whether it is an inner or outer tire. Determine whether it is on the rear or front, and which side (offside or nearside).'
          }
        ]
      },
      {
        title: 'Driver Action',
        substeps: [
          {
            action: 'Stop and Report',
            detail: 'The driver should stop immediately and seek advice from engineering after providing the above information.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Safety is priority - if driver has concerns about continuing, escalate to engineering immediately',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location'
    ],
    relatedIssues: ['loose-wheel-nuts', 'suspension']
  },

  {
    id: 'loose-wheel-nuts',
    title: 'Loose Wheel Nuts',
    category: 'safety',
    severity: 'critical',
    description: 'Critical wheel safety issue requiring immediate action.',
    keywords: ['wheel nuts', 'loose', 'wheels', 'safety critical'],
    steps: [
      {
        title: 'Immediate Action',
        substeps: [
          {
            action: 'STOP Immediately',
            detail: 'Advise the driver to stop the vehicle safely at the earliest opportunity.'
          },
          {
            action: 'Seek Engineering Assistance',
            detail: 'Contact Engineering immediately to assess the situation and provide assistance.'
          },
          {
            action: 'Do Not Continue',
            detail: 'Under no circumstances should the vehicle continue in service with loose wheel nuts.'
          },
          {
            action: 'Report to Management',
            detail: 'Incidents of loose wheel nuts should be reported to the depot engineering manager, general manager and engineering delivery director.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'This is a critical safety issue',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location',
      'Ensure all management levels are notified immediately'
    ],
    relatedIssues: ['puncture', 'suspension', 'safety-declaration']
  },

  {
    id: 'gear-selection',
    title: 'Gear Selection Issues',
    category: 'operation',
    severity: 'medium',
    description: 'Unable to select gears or gear selection problems.',
    keywords: ['gear', 'selection', 'transmission', 'neutral', 'reset', 'ramp', 'suspension'],
    steps: [
      {
        title: 'System Reset',
        substeps: [
          {
            action: 'Perform System Reset',
            detail: 'Instruct the driver to switch the bus off and re-set it, then attempt to start up in the usual manner.'
          }
        ]
      },
      {
        title: 'Post-Reset Assessment',
        substeps: [
          {
            condition: 'Gears can now be selected normally',
            action: 'Continue in Service',
            detail: 'Issue resolved - continue monitoring gear selection during operation and record resolution in Go-Check.'
          },
          {
            condition: 'Still cannot select gears',
            action: 'Check Ramp Position',
            detail: 'Ask the driver to visually inspect if the ramp is correctly secured in its stowed position.'
          }
        ]
      },
      {
        title: 'Ramp Position Check',
        substeps: [
          {
            action: 'Verify Ramp Stowage',
            detail: 'The driver should lift the ramp and stow it again to ensure it is correctly secured.'
          }
        ]
      },
      {
        title: 'Suspension Light Check',
        substeps: [
          {
            condition: 'Vehicle equipped with suspension light',
            action: 'Reset Suspension Light',
            detail: 'Ask the driver if the suspension light on the dashboard has been re-set before attempting to engage gear.'
          }
        ]
      },
      {
        title: 'Proper Operation Confirmation',
        substeps: [
          {
            action: 'Verify Footbrake Procedure',
            detail: 'Ensure the driver is pressing firmly on the footbrake while selecting the appropriate gear.'
          }
        ]
      },
      {
        title: 'Final Assessment',
        substeps: [
          {
            condition: 'Gears can now be selected after all checks',
            action: 'Continue in Service',
            detail: 'All checks successful - ensure driver follows proper procedure and record resolution in Go-Check.'
          },
          {
            condition: 'Still unable to select gears after all troubleshooting',
            action: 'Engineering Assistance Required',
            detail: 'Stop and await assistance from engineering. Contact using depot extensions: Consett 9286/9287, Riverside 9254/0888, Sunderland 9299, Washington 6123/6327, Percy Main 9413.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Safety is priority - if driver has concerns about continuing, escalate to engineering immediately',
      'Record defects immediately in Go-Check system when stationary and safe',
      'Ensure proper procedure: press footbrake firmly when selecting gear',
      'Arrange changeover at earliest opportunity if Engineering clears for limited operation'
    ],
    relatedIssues: ['suspension', 'doors-not-working', 'non-starter']
  },

  {
    id: 'repeat-defects',
    title: 'Repeat Defects',
    category: 'maintenance',
    severity: 'medium',
    description: 'Escalation procedure for recurring vehicle defects.',
    keywords: ['repeat', 'recurring', 'defects', 'escalation', 'management'],
    steps: [
      {
        title: 'Same-Day Repeat Defects',
        substeps: [
          {
            condition: 'Bus taken out of service due to defects and later reallocated with same unresolved defects',
            action: 'Report Immediately',
            detail: 'Report the issue immediately to the Engineering Delivery Director.'
          },
          {
            action: 'Copy Management',
            detail: 'Ensure copies of the report are sent to the General Manager and Engineering Manager.'
          }
        ]
      },
      {
        title: 'Multi-Day Repeat Defects',
        substeps: [
          {
            condition: 'Bus continues to operate over several days with same unresolved reported defects',
            action: 'Report Immediately',
            detail: 'Report the issue immediately to the Engineering Delivery Director.'
          },
          {
            action: 'Copy Management',
            detail: 'Ensure copies of the report are sent to the General Manager and Engineering Manager.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Report accurately in Go-Check immediately, include pictures if appropriate',
      'Ensure timely communication with engineering and management to prevent service reliability issues',
      'Maintain accurate records of all reported defects',
      'Safety First: Prioritise addressing defects that could compromise safety of passengers, drivers, or other road users'
    ],
    relatedIssues: ['safety-declaration']
  }
];

export default { breakdownGuideData, categories };