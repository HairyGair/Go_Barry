/**
 * SDC Wizard Type Mapping
 * Maps wizard types to detailed step information for dashboard display
 * Based on 33 available standard procedure assessment types
 */

export const WIZARD_TYPE_MAPPING = {
  // Critical Safety Systems
  'steering': {
    displayName: 'Steering System',
    category: 'Critical Safety',
    icon: '🚗',
    priority: 'critical',
    dvsa_reference: 'DVSA 75mm steering play limit',
    typical_steps: [
      'Check steering wheel for excessive play',
      'Test steering response and tracking',
      'Inspect power steering operation',
      'Verify steering lock functionality',
      'Document measurements and findings'
    ],
    estimated_duration: 6,
    stop_criteria: ['Steering play >75mm (DVSA limit)', 'Power steering failure', 'Steering lock malfunction'],
    amber_criteria: ['Minor steering irregularities', 'Slight power steering noise'],
    continue_criteria: ['All steering systems within tolerance', 'No excessive play detected']
  },

  'brakes': {
    displayName: 'Brake System',
    category: 'Critical Safety',
    icon: '🛑',
    priority: 'critical',
    dvsa_reference: 'DVSA brake efficiency standards',
    typical_steps: [
      'Test foot brake effectiveness',
      'Check parking brake operation',
      'Inspect brake fluid levels',
      'Test ABS warning systems',
      'Verify brake balance and response'
    ],
    estimated_duration: 8,
    stop_criteria: ['Brake failure or severe reduction', 'ABS malfunction', 'Low brake fluid'],
    amber_criteria: ['Minor brake irregularities', 'Slight brake noise'],
    continue_criteria: ['All brake systems operational', 'Adequate brake efficiency']
  },

  'abs-light': {
    displayName: 'ABS Warning System',
    category: 'Critical Safety',
    icon: '⚠️',
    priority: 'critical',
    dvsa_reference: 'MOT regulation 1.2.1',
    typical_steps: [
      'Check ABS warning light status',
      'Test ABS sensor operation',
      'Verify diagnostic codes',
      'Test emergency braking',
      'Document system status'
    ],
    estimated_duration: 5,
    stop_criteria: ['ABS system failure', 'Continuous warning light'],
    amber_criteria: ['Intermittent ABS light'],
    continue_criteria: ['ABS system fully operational']
  },

  // Visibility and Lighting
  'exterior-lights': {
    displayName: 'Exterior Lighting',
    category: 'Visibility',
    icon: '💡',
    priority: 'high',
    dvsa_reference: 'Road Vehicle Lighting Regulations',
    typical_steps: [
      'Check all exterior lights function',
      'Test headlight aim and brightness',
      'Verify indicator operation',
      'Check hazard warning lights',
      'Inspect light housings for damage'
    ],
    estimated_duration: 4,
    stop_criteria: ['Multiple light failures', 'Headlight complete failure'],
    amber_criteria: ['Single bulb failure', 'Reduced brightness'],
    continue_criteria: ['All lights operational and compliant']
  },

  'interior-lights': {
    displayName: 'Interior Lighting',
    category: 'Visibility',
    icon: '🔦',
    priority: 'medium',
    dvsa_reference: 'PSV accessibility requirements',
    typical_steps: [
      'Test passenger area lighting',
      'Check driver cab lighting',
      'Verify emergency lighting',
      'Test step lights operation',
      'Check accessibility lighting'
    ],
    estimated_duration: 3,
    stop_criteria: ['Complete lighting failure', 'Emergency light failure'],
    amber_criteria: ['Partial lighting failure'],
    continue_criteria: ['All interior lights functional']
  },

  'warning-lights': {
    displayName: 'Dashboard Warning Lights',
    category: 'Vehicle Systems',
    icon: '⚡',
    priority: 'high',
    dvsa_reference: 'Vehicle dashboard requirements',
    typical_steps: [
      'Check all warning light functions',
      'Test bulb check sequence',
      'Verify warning light meanings',
      'Check for false warnings',
      'Document any active warnings'
    ],
    estimated_duration: 4,
    stop_criteria: ['Critical system warning active', 'Warning system failure'],
    amber_criteria: ['Non-critical warnings present'],
    continue_criteria: ['No active warnings or minor alerts only']
  },

  // Engine and Mechanical
  'oil-warning': {
    displayName: 'Oil Warning System',
    category: 'Engine',
    icon: '🛢️',
    priority: 'critical',
    dvsa_reference: 'Engine lubrication standards',
    typical_steps: [
      'Check oil warning light operation',
      'Verify oil level and pressure',
      'Inspect for oil leaks',
      'Test oil pressure warning',
      'Check oil quality and condition'
    ],
    estimated_duration: 5,
    stop_criteria: ['Low oil pressure', 'Significant oil leak', 'Oil warning active'],
    amber_criteria: ['Minor oil leak', 'Oil level slightly low'],
    continue_criteria: ['Oil system within normal parameters']
  },

  'cooling-system': {
    displayName: 'Cooling System',
    category: 'Engine',
    icon: '🌡️',
    priority: 'critical',
    dvsa_reference: 'Engine temperature management',
    typical_steps: [
      'Check coolant levels',
      'Test temperature warning systems',
      'Inspect for coolant leaks',
      'Verify fan operation',
      'Check radiator condition'
    ],
    estimated_duration: 6,
    stop_criteria: ['Overheating risk', 'Significant coolant loss', 'Fan failure'],
    amber_criteria: ['Minor coolant loss', 'Temperature slightly elevated'],
    continue_criteria: ['Cooling system operating normally']
  },

  'non-starter': {
    displayName: 'Engine Starting Issues',
    category: 'Engine',
    icon: '🔋',
    priority: 'critical',
    dvsa_reference: 'Vehicle starting requirements',
    typical_steps: [
      'Test battery voltage and condition',
      'Check starter motor operation',
      'Verify ignition system',
      'Test fuel system operation',
      'Check electrical connections'
    ],
    estimated_duration: 10,
    stop_criteria: ['Engine will not start', 'Electrical system failure'],
    amber_criteria: ['Difficult starting', 'Slow cranking'],
    continue_criteria: ['Engine starts and runs normally']
  },

  'battery': {
    displayName: 'Battery System',
    category: 'Electrical',
    icon: '🔋',
    priority: 'critical',
    dvsa_reference: 'Electrical system standards',
    typical_steps: [
      'Test battery voltage and charge',
      'Check charging system operation',
      'Inspect battery terminals',
      'Test electrical load capacity',
      'Verify alternator function'
    ],
    estimated_duration: 7,
    stop_criteria: ['Battery failure', 'Charging system malfunction'],
    amber_criteria: ['Reduced battery capacity', 'Minor charging issues'],
    continue_criteria: ['Electrical system functioning correctly']
  },

  // Transmission and Drivetrain
  'gearbox': {
    displayName: 'Gearbox Operation',
    category: 'Drivetrain',
    icon: '⚙️',
    priority: 'high',
    dvsa_reference: 'Transmission operation standards',
    typical_steps: [
      'Test gear selection and operation',
      'Check for unusual noises',
      'Verify smooth gear changes',
      'Test clutch operation (manual)',
      'Check transmission fluid levels'
    ],
    estimated_duration: 8,
    stop_criteria: ['Transmission failure', 'Cannot engage gears'],
    amber_criteria: ['Difficult gear changes', 'Minor transmission noise'],
    continue_criteria: ['Transmission operating smoothly']
  },

  'gear-selection': {
    displayName: 'Gear Selection Issues',
    category: 'Drivetrain',
    icon: '🔄',
    priority: 'high',
    dvsa_reference: 'Gear selection requirements',
    typical_steps: [
      'Test gear selector operation',
      'Check gear indicator accuracy',
      'Verify gear engagement',
      'Test reverse gear operation',
      'Check for selection restrictions'
    ],
    estimated_duration: 6,
    stop_criteria: ['Cannot select gears', 'Gear selector failure'],
    amber_criteria: ['Difficult gear selection', 'Inaccurate indicator'],
    continue_criteria: ['All gears select correctly']
  },

  // Wheels and Suspension
  'suspension': {
    displayName: 'Suspension System',
    category: 'Ride Quality',
    icon: '🏗️',
    priority: 'medium',
    dvsa_reference: 'MOT suspension test standards',
    typical_steps: [
      'Check suspension bounce test',
      'Inspect shock absorber condition',
      'Test ride height measurements',
      'Check for air suspension leaks',
      'Verify suspension operation'
    ],
    estimated_duration: 7,
    stop_criteria: ['Suspension collapse', 'Severe ride quality issues'],
    amber_criteria: ['Minor suspension noise', 'Slight ride deterioration'],
    continue_criteria: ['Suspension within acceptable limits']
  },

  'loose-wheel-nuts': {
    displayName: 'Wheel Nut Security',
    category: 'Wheels',
    icon: '🔩',
    priority: 'critical',
    dvsa_reference: 'Wheel security requirements',
    typical_steps: [
      'Check wheel nut tightness',
      'Inspect for missing nuts',
      'Verify nut condition',
      'Test wheel security',
      'Check for wheel movement'
    ],
    estimated_duration: 4,
    stop_criteria: ['Loose or missing wheel nuts', 'Wheel security compromised'],
    amber_criteria: ['Minor wheel nut issues'],
    continue_criteria: ['All wheels secure and properly fastened']
  },

  'puncture': {
    displayName: 'Tyre Puncture Assessment',
    category: 'Wheels',
    icon: '🛞',
    priority: 'high',
    dvsa_reference: 'Tyre condition requirements',
    typical_steps: [
      'Assess puncture size and location',
      'Check tyre pressure loss',
      'Evaluate repair feasibility',
      'Check spare tyre availability',
      'Plan safe recovery if needed'
    ],
    estimated_duration: 5,
    stop_criteria: ['Major puncture', 'Unsafe tyre condition'],
    amber_criteria: ['Minor puncture suitable for temporary repair'],
    continue_criteria: ['Puncture repaired or tyre suitable for service']
  },

  // Doors and Access
  'doors': {
    displayName: 'Door Operation',
    category: 'Access Systems',
    icon: '🚪',
    priority: 'high',
    dvsa_reference: 'PSV door operation requirements',
    typical_steps: [
      'Test all door operations',
      'Check emergency door releases',
      'Verify door safety systems',
      'Test driver door controls',
      'Check door sealing'
    ],
    estimated_duration: 6,
    stop_criteria: ['Door failure to open/close', 'Emergency system failure'],
    amber_criteria: ['Minor door operation issues'],
    continue_criteria: ['All doors operating correctly']
  },

  'wheelchair-ramp': {
    displayName: 'Wheelchair Accessibility',
    category: 'Accessibility',
    icon: '♿',
    priority: 'high',
    dvsa_reference: 'Disability Discrimination Act compliance',
    typical_steps: [
      'Test ramp deployment',
      'Check ramp load capacity',
      'Verify safety systems',
      'Test wheelchair securement',
      'Check accessibility features'
    ],
    estimated_duration: 8,
    stop_criteria: ['Ramp system failure', 'Safety system malfunction'],
    amber_criteria: ['Minor accessibility issues'],
    continue_criteria: ['Full accessibility functionality']
  },

  // Environmental Systems
  'demisters-heaters': {
    displayName: 'Climate Control',
    category: 'Environmental',
    icon: '❄️',
    priority: 'medium',
    dvsa_reference: 'Vehicle visibility requirements',
    typical_steps: [
      'Test demister effectiveness',
      'Check heating system operation',
      'Verify air conditioning',
      'Test temperature controls',
      'Check air circulation'
    ],
    estimated_duration: 5,
    stop_criteria: ['Complete system failure affecting safety'],
    amber_criteria: ['Reduced effectiveness', 'Partial system failure'],
    continue_criteria: ['Climate control operating adequately']
  },

  'wipers-screenwash': {
    displayName: 'Wiper and Wash System',
    category: 'Visibility',
    icon: '💧',
    priority: 'high',
    dvsa_reference: 'Windscreen visibility requirements',
    typical_steps: [
      'Test wiper blade effectiveness',
      'Check wiper motor operation',
      'Verify screenwash function',
      'Test intermittent settings',
      'Check blade condition'
    ],
    estimated_duration: 4,
    stop_criteria: ['Wiper system failure', 'Windscreen visibility compromised'],
    amber_criteria: ['Reduced wiper effectiveness'],
    continue_criteria: ['Wiper system ensuring good visibility']
  },

  // Communication Systems
  'destination-display': {
    displayName: 'Destination Display',
    category: 'Information Systems',
    icon: '📺',
    priority: 'medium',
    dvsa_reference: 'PSV route information requirements',
    typical_steps: [
      'Test display functionality',
      'Check route information accuracy',
      'Verify display brightness',
      'Test remote control operation',
      'Check information systems'
    ],
    estimated_duration: 4,
    stop_criteria: ['Complete display failure'],
    amber_criteria: ['Partial display malfunction'],
    continue_criteria: ['Display providing adequate passenger information']
  },

  'buzzers': {
    displayName: 'Warning Buzzers',
    category: 'Audio Systems',
    icon: '🔊',
    priority: 'medium',
    dvsa_reference: 'Warning system requirements',
    typical_steps: [
      'Test all buzzer operations',
      'Check volume levels',
      'Verify warning trigger points',
      'Test driver alertness systems',
      'Check passenger information audio'
    ],
    estimated_duration: 3,
    stop_criteria: ['Critical warning buzzer failure'],
    amber_criteria: ['Minor audio system issues'],
    continue_criteria: ['All warning systems audible and functional']
  },

  // Vehicle Structure
  'wing-mirrors': {
    displayName: 'Mirror Systems',
    category: 'Visibility',
    icon: '🪞',
    priority: 'high',
    dvsa_reference: 'Mirror visibility standards',
    typical_steps: [
      'Check mirror adjustment',
      'Test heated mirror function',
      'Verify mirror security',
      'Check for cracks or damage',
      'Test electric adjustment'
    ],
    estimated_duration: 3,
    stop_criteria: ['Mirror missing or severely damaged'],
    amber_criteria: ['Minor mirror adjustment issues'],
    continue_criteria: ['All mirrors providing adequate visibility']
  },

  'broken-windows': {
    displayName: 'Window Damage Assessment',
    category: 'Vehicle Structure',
    icon: '🪟',
    priority: 'high',
    dvsa_reference: 'Windscreen and window safety',
    typical_steps: [
      'Assess window damage extent',
      'Check driver visibility impact',
      'Evaluate safety implications',
      'Check for loose glass',
      'Plan temporary measures'
    ],
    estimated_duration: 4,
    stop_criteria: ['Driver visibility compromised', 'Safety glass failure'],
    amber_criteria: ['Minor window damage not affecting safety'],
    continue_criteria: ['Window damage does not compromise safety']
  },

  'interior-exterior-damage': {
    displayName: 'Vehicle Damage Assessment',
    category: 'Vehicle Structure',
    icon: '🔍',
    priority: 'medium',
    dvsa_reference: 'Vehicle roadworthiness standards',
    typical_steps: [
      'Document damage extent',
      'Assess safety implications',
      'Check structural integrity',
      'Evaluate operational impact',
      'Plan repair requirements'
    ],
    estimated_duration: 6,
    stop_criteria: ['Structural damage affecting safety'],
    amber_criteria: ['Cosmetic damage affecting operation'],
    continue_criteria: ['Damage does not affect safe operation']
  },

  // Fuel and Fluids
  'cutting-out-fuel': {
    displayName: 'Fuel System Issues',
    category: 'Engine',
    icon: '⛽',
    priority: 'critical',
    dvsa_reference: 'Fuel system safety requirements',
    typical_steps: [
      'Check fuel level and supply',
      'Test fuel pump operation',
      'Inspect for fuel leaks',
      'Check fuel filters',
      'Verify fuel injection system'
    ],
    estimated_duration: 8,
    stop_criteria: ['Fuel system failure', 'Fuel leak'],
    amber_criteria: ['Intermittent fuel supply issues'],
    continue_criteria: ['Fuel system operating normally']
  },

  'low-water': {
    displayName: 'Coolant Level Check',
    category: 'Engine',
    icon: '💧',
    priority: 'critical',
    dvsa_reference: 'Engine cooling requirements',
    typical_steps: [
      'Check coolant reservoir level',
      'Inspect for leaks',
      'Test temperature warning',
      'Check radiator condition',
      'Verify cooling system pressure'
    ],
    estimated_duration: 5,
    stop_criteria: ['Critically low coolant', 'Cooling system leak'],
    amber_criteria: ['Coolant level slightly low'],
    continue_criteria: ['Coolant level adequate for operation']
  },

  'excessive-smoke': {
    displayName: 'Exhaust Smoke Analysis',
    category: 'Emissions',
    icon: '💨',
    priority: 'high',
    dvsa_reference: 'Emissions standards compliance',
    typical_steps: [
      'Assess smoke colour and density',
      'Check emission levels',
      'Test engine operation',
      'Verify exhaust system',
      'Check environmental compliance'
    ],
    estimated_duration: 6,
    stop_criteria: ['Excessive emissions', 'Environmental non-compliance'],
    amber_criteria: ['Elevated but acceptable emissions'],
    continue_criteria: ['Emissions within acceptable limits']
  },

  // Instrumentation
  'speedo': {
    displayName: 'Speedometer System',
    category: 'Instrumentation',
    icon: '📏',
    priority: 'high',
    dvsa_reference: 'Speedometer accuracy requirements',
    typical_steps: [
      'Test speedometer accuracy',
      'Check odometer function',
      'Verify speed sensor operation',
      'Test tachograph if fitted',
      'Check instrument lighting'
    ],
    estimated_duration: 5,
    stop_criteria: ['Speedometer failure', 'Significant inaccuracy'],
    amber_criteria: ['Minor speedometer irregularities'],
    continue_criteria: ['Speedometer accurate and functional']
  },

  // Maintenance Issues
  'repeat-defects': {
    displayName: 'Recurring Issues',
    category: 'Maintenance',
    icon: '🔄',
    priority: 'medium',
    dvsa_reference: 'Vehicle maintenance standards',
    typical_steps: [
      'Review defect history',
      'Assess root cause',
      'Check repair quality',
      'Evaluate system reliability',
      'Plan preventive measures'
    ],
    estimated_duration: 7,
    stop_criteria: ['Unresolved safety-critical defects'],
    amber_criteria: ['Recurring non-critical issues'],
    continue_criteria: ['Defects resolved and preventive measures in place']
  },

  // External Incidents
  'road-traffic-incidents': {
    displayName: 'Traffic Incident Assessment',
    category: 'External Factors',
    icon: '🚧',
    priority: 'high',
    dvsa_reference: 'Incident response procedures',
    typical_steps: [
      'Assess vehicle involvement',
      'Check for damage',
      'Evaluate safety implications',
      'Document incident details',
      'Plan recovery or continuation'
    ],
    estimated_duration: 10,
    stop_criteria: ['Vehicle damage affecting safety', 'Unable to continue safely'],
    amber_criteria: ['Minor incident with caution required'],
    continue_criteria: ['No significant impact on vehicle operation']
  },

  // Special Systems
  'tracer-it-helper': {
    displayName: 'TracerIT System Issues',
    category: 'Information Systems',
    icon: '📡',
    priority: 'low',
    dvsa_reference: 'Fleet management system requirements',
    typical_steps: [
      'Check system connectivity',
      'Test GPS functionality',
      'Verify data transmission',
      'Check system diagnostics',
      'Test fleet management features'
    ],
    estimated_duration: 4,
    stop_criteria: ['Complete system failure affecting operations'],
    amber_criteria: ['Reduced system functionality'],
    continue_criteria: ['System operating adequately']
  }
};

/**
 * Get wizard information by type
 */
export const getWizardInfo = (wizardType) => {
  const normalizedType = wizardType?.toLowerCase().replace(/[_\s-]/g, '-');
  return WIZARD_TYPE_MAPPING[normalizedType] || {
    displayName: wizardType || 'Unknown Assessment',
    category: 'General',
    icon: '🔧',
    priority: 'medium',
    dvsa_reference: 'General vehicle standards',
    typical_steps: ['Assessment in progress...'],
    estimated_duration: 5,
    stop_criteria: ['Safety-critical issues identified'],
    amber_criteria: ['Issues requiring attention'],
    continue_criteria: ['No significant issues found']
  };
};

/**
 * Get step description based on wizard type and current step
 */
export const getStepDescription = (wizardType, currentStepNum, totalSteps) => {
  const wizardInfo = getWizardInfo(wizardType);
  const stepIndex = Math.min(currentStepNum - 1, wizardInfo.typical_steps.length - 1);
  
  if (stepIndex >= 0 && stepIndex < wizardInfo.typical_steps.length) {
    return wizardInfo.typical_steps[stepIndex];
  }
  
  return `Step ${currentStepNum} of ${totalSteps} - Assessment in progress`;
};

/**
 * Get estimated completion time
 */
export const getEstimatedDuration = (wizardType) => {
  const wizardInfo = getWizardInfo(wizardType);
  return `${wizardInfo.estimated_duration} mins`;
};

/**
 * Get priority level for wizard type
 */
export const getWizardPriority = (wizardType) => {
  const wizardInfo = getWizardInfo(wizardType);
  return wizardInfo.priority;
};

/**
 * Get all wizard types grouped by category
 */
export const getWizardsByCategory = () => {
  const categories = {};
  Object.entries(WIZARD_TYPE_MAPPING).forEach(([key, wizard]) => {
    if (!categories[wizard.category]) {
      categories[wizard.category] = [];
    }
    categories[wizard.category].push({ key, ...wizard });
  });
  return categories;
};

export default WIZARD_TYPE_MAPPING;