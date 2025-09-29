// SDC Engineering Issues Guide v1.3 Reference
// This file provides a complete mapping of all SDC Guide sections for quick reference

export const SDC_GUIDE_REFERENCE = {
  // Safety Critical Issues - STOP Required
  CRITICAL_DEFECTS: {
    'Steering': {
      icon: '🚗',
      section: 'Section 8',
      page: 8,
      dvsa_category: 'Dangerous',
      immediate_action: 'STOP - Await engineering',
      key_checks: [
        'Excessive play (>75mm)',
        'Difficulty steering',
        'Unusual noises',
        'Vehicle pulling',
        'Power steering leaks'
      ]
    },
    'Brakes': {
      icon: '🛑',
      section: 'Section 7',
      page: 7,
      dvsa_category: 'Dangerous',
      immediate_action: 'STOP - Await engineering',
      key_checks: [
        'Pedal sinks to floor',
        'Delayed response',
        'Grinding/squealing',
        'Brake fluid leaks',
        'Red ABS/EBS light'
      ]
    },
    'Non Starter': {
      icon: '🔑',
      section: 'Section 19',
      page: 9,
      immediate_action: 'Follow 3-step process',
      steps: [
        '1. Initial troubleshooting',
        '2. Rear start attempt (with safety precautions)',
        '3. Gather diagnostic info'
      ]
    },
    'Oil Warning Light': {
      icon: '🛢️',
      section: 'Section 20',
      page: 22,
      dvsa_category: 'Dangerous',
      immediate_action: 'STOP immediately',
      key_checks: [
        'Check for oil leaks',
        'Engine must be off',
        'Fire hazard risk'
      ]
    },
    'Loose Wheel Nuts': {
      icon: '⚠️',
      section: 'Section 17',
      page: 28,
      dvsa_category: 'Dangerous',
      immediate_action: 'STOP immediately - Do not continue',
      reporting: 'Notify depot manager, general manager, engineering director'
    }
  },

  // Conditional Issues - Assessment Required
  CONDITIONAL_DEFECTS: {
    'ABS Light': {
      icon: '⚠️',
      section: 'Section 3',
      page: 14,
      process: {
        'Amber ABS': {
          reset_successful: 'Continue with monitoring',
          reset_failed: 'Changeover at earliest convenience'
        },
        'Red ABS': {
          reset_successful: 'Changeover at earliest convenience',
          reset_failed: 'STOP - Await engineering'
        }
      }
    },
    'Battery Light': {
      icon: '🔋',
      section: 'Section 4',
      page: 13,
      process: {
        'Belts off': 'STOP (can move short distance if safe)',
        'Master switch not engaged': 'Engage and continue',
        'Master switch engaged': 'STOP - Transmission loss risk'
      },
      safety_note: 'Engine OFF before belt inspection'
    },
    'Overheating': {
      icon: '🌡️',
      section: 'Section 21',
      page: 11,
      temperature_ranges: {
        '80-100°C': 'Continue to changeover point',
        'Over 100°C': 'Check for leaks',
        'With buzzer': 'Check for leaks or use heaters'
      },
      warning: 'Never remove radiator cap'
    },
    'Low Water': {
      icon: '💧',
      section: 'Section 18',
      page: 16,
      process: {
        'No leaks + No buzzer': 'Continue to changeover',
        'No leaks + Buzzer': 'Top up en route',
        'Leaks present': 'Assess distance to changeover'
      }
    }
  },

  // Service Affecting - Changeover Required
  SERVICE_DEFECTS: {
    'Doors': {
      icon: '🚪',
      section: 'Section 10',
      page: 17,
      stop_conditions: [
        'Doors jammed closed',
        'Cannot retain closed position',
        'Hinges/catches insecure',
        'Likely to open inadvertently'
      ]
    },
    'Wipers/Screenwash': {
      icon: '🌧️',
      section: 'Section 30',
      page: 12,
      assessment: 'Vision impairment determines action',
      priority_routes: 'A19, A1M require immediate changeover'
    },
    'Exterior Lights': {
      icon: '💡',
      section: 'Section 11',
      page: 35,
      headlights: {
        'During darkness': 'Cannot continue',
        'During daylight': 'Change before dark'
      },
      indicators: 'STOP - Await engineering',
      brake_lights: {
        'Both out': 'STOP',
        'One out': 'Changeover at convenience'
      }
    },
    'Interior Lights': {
      icon: '💡',
      section: 'Section 15',
      page: 33,
      requirement: 'At least 50% per deck must work',
      step_light: 'Must work when doors open'
    },
    'Demisters/Heaters': {
      icon: '🌬️',
      section: 'Section 9',
      page: 15,
      temperature_threshold: '16°C minimum',
      vision_priority: 'If vision affected, do not continue'
    },
    'Ramp': {
      icon: '♿',
      section: 'Section 23',
      page: 20,
      stuck_out: {
        'Reset vehicle': 'Try first',
        'Manual retraction': 'Only if risk assessed',
        'Cannot retract': 'STOP - Await engineering'
      }
    }
  },

  // Special Procedures
  SPECIAL_PROCEDURES: {
    'Road Traffic Incidents': {
      icon: '🚨',
      section: 'Section 2',
      page: 4,
      priority_checks: [
        'Driver wellbeing',
        'Passenger injuries',
        'Police notification',
        'Vehicle damage assessment'
      ],
      reporting: 'Tracerit report within 24 hours',
      documentation: 'Go-Check system immediately'
    },
    'Puncture': {
      icon: '🔧',
      section: 'Section 22',
      page: 32,
      immediate_action: 'STOP - Identify position',
      information_needed: [
        'Inner or outer tyre',
        'Front or rear',
        'Offside or nearside'
      ]
    },
    'Repeat Defects': {
      icon: '🔄',
      section: 'Section 24',
      page: 23,
      escalation: {
        same_day: 'Report to Engineering Delivery Director',
        multi_day: 'Report to Engineering Delivery Director',
        copy_to: ['General Manager', 'Engineering Manager']
      }
    }
  },

  // Quick Decision Matrix
  DECISION_MATRIX: {
    STOP: {
      color: '#dc2626',
      icon: '🛑',
      description: 'Vehicle must not continue',
      actions: [
        'Switch off vehicle',
        'Await engineering',
        'Do not attempt to move'
      ]
    },
    AMBER: {
      color: '#f59e0b',
      icon: '⚠️',
      description: 'Changeover at earliest convenience',
      actions: [
        'Continue to safe changeover point',
        'Monitor condition',
        'Log in Go-Check'
      ]
    },
    CONTINUE: {
      color: '#10b981',
      icon: '✅',
      description: 'Can continue in service',
      actions: [
        'Log defect',
        'Monitor condition',
        'Schedule inspection'
      ]
    }
  },

  // SLA Timings
  SLA_TARGETS: {
    critical: {
      warning: 30, // minutes
      breach: 45   // minutes
    },
    standard: {
      warning: 60,  // minutes
      breach: 90    // minutes
    },
    priority_routes: {
      warning: 20,  // minutes
      breach: 30    // minutes
    }
  },

  // Go-Check Integration
  GO_CHECK_CODES: {
    'Steering': 'STR',
    'Brakes': 'BRK',
    'ABS Light': 'ABS',
    'Battery Light': 'BAT',
    'Non Starter': 'NST',
    'Oil Warning': 'OIL',
    'Overheating': 'OVH',
    'Doors': 'DOR',
    'Lights': 'LGT',
    'Wipers': 'WIP',
    'Puncture': 'PUN',
    'Damage': 'DMG'
  }
};

// Helper functions for quick SDC Guide reference
export const getSDCGuidance = (issueType) => {
  // Search through all categories
  const allCategories = {
    ...SDC_GUIDE_REFERENCE.CRITICAL_DEFECTS,
    ...SDC_GUIDE_REFERENCE.CONDITIONAL_DEFECTS,
    ...SDC_GUIDE_REFERENCE.SERVICE_DEFECTS,
    ...SDC_GUIDE_REFERENCE.SPECIAL_PROCEDURES
  };
  
  return allCategories[issueType] || null;
};

export const getDecisionForIssue = (issueType, assessmentDetails = {}) => {
  const guidance = getSDCGuidance(issueType);
  
  if (!guidance) {
    return SDC_GUIDE_REFERENCE.DECISION_MATRIX.CONTINUE;
  }
  
  // Critical defects always STOP
  if (SDC_GUIDE_REFERENCE.CRITICAL_DEFECTS[issueType]) {
    return SDC_GUIDE_REFERENCE.DECISION_MATRIX.STOP;
  }
  
  // Conditional defects need assessment
  if (SDC_GUIDE_REFERENCE.CONDITIONAL_DEFECTS[issueType]) {
    // Logic would be based on assessment details
    // This is simplified - actual logic would check specific conditions
    if (assessmentDetails.severity === 'high') {
      return SDC_GUIDE_REFERENCE.DECISION_MATRIX.STOP;
    } else if (assessmentDetails.severity === 'medium') {
      return SDC_GUIDE_REFERENCE.DECISION_MATRIX.AMBER;
    } else {
      return SDC_GUIDE_REFERENCE.DECISION_MATRIX.CONTINUE;
    }
  }
  
  // Service defects usually AMBER
  if (SDC_GUIDE_REFERENCE.SERVICE_DEFECTS[issueType]) {
    return SDC_GUIDE_REFERENCE.DECISION_MATRIX.AMBER;
  }
  
  // Default to CONTINUE
  return SDC_GUIDE_REFERENCE.DECISION_MATRIX.CONTINUE;
};

export const getSLAForIssue = (issueType, isPriorityRoute = false) => {
  if (isPriorityRoute) {
    return SDC_GUIDE_REFERENCE.SLA_TARGETS.priority_routes;
  }
  
  if (SDC_GUIDE_REFERENCE.CRITICAL_DEFECTS[issueType]) {
    return SDC_GUIDE_REFERENCE.SLA_TARGETS.critical;
  }
  
  return SDC_GUIDE_REFERENCE.SLA_TARGETS.standard;
};

export const getGoCheckCode = (issueType) => {
  // Try to find exact match
  if (SDC_GUIDE_REFERENCE.GO_CHECK_CODES[issueType]) {
    return SDC_GUIDE_REFERENCE.GO_CHECK_CODES[issueType];
  }
  
  // Try partial match
  for (const [key, code] of Object.entries(SDC_GUIDE_REFERENCE.GO_CHECK_CODES)) {
    if (issueType.toLowerCase().includes(key.toLowerCase())) {
      return code;
    }
  }
  
  return 'GEN'; // General code
};

// Export for use in other components
export default SDC_GUIDE_REFERENCE;
