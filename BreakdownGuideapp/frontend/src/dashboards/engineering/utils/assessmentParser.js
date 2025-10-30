/**
 * Assessment Parser Utility
 * Extracts and formats wizard assessment data for engineering dashboard
 *
 * @author Anthony Gair
 * @license Proprietary
 */

/**
 * Parse wizard assessment responses into Q&A pairs
 * @param {Object} wizard_assessment_data - Raw wizard data from breakdown
 * @returns {Array} Array of {question, answer, importance} objects
 */
export function parseWizardResponses(wizard_assessment_data) {
  if (!wizard_assessment_data || typeof wizard_assessment_data !== 'object') {
    return [];
  }

  const responses = [];

  // Map of field names to user-friendly questions
  const questionMap = {
    // Location & Route
    'location': { question: 'Vehicle Location', importance: 'critical' },
    'location_description': { question: 'Location Description', importance: 'critical' },
    'route': { question: 'Route Number', importance: 'high' },
    'routeName': { question: 'Route Name', importance: 'high' },

    // Issue Details
    'issue_category': { question: 'Issue Category', importance: 'critical' },
    'symptoms': { question: 'Symptoms Observed', importance: 'critical' },
    'description': { question: 'Problem Description', importance: 'high' },
    'driver_observations': { question: 'Driver Observations', importance: 'high' },

    // Safety
    'safety_critical': { question: 'Safety Critical Issue', importance: 'critical' },
    'immediate_danger': { question: 'Immediate Danger', importance: 'critical' },
    'passengers_onboard': { question: 'Passengers On Board', importance: 'high' },
    'can_continue': { question: 'Can Vehicle Continue', importance: 'critical' },

    // Vehicle State
    'vehicle_driveable': { question: 'Vehicle Driveable', importance: 'high' },
    'warning_lights': { question: 'Warning Lights Active', importance: 'high' },
    'fluid_leaks': { question: 'Fluid Leaks Detected', importance: 'high' },
    'smoke_steam': { question: 'Smoke/Steam Present', importance: 'critical' },
    'unusual_sounds': { question: 'Unusual Sounds', importance: 'medium' },
    'vibration': { question: 'Vibration Detected', importance: 'medium' },

    // Brakes Specific
    'brake_pedal_feel': { question: 'Brake Pedal Feel', importance: 'critical' },
    'brake_noise': { question: 'Brake Noise', importance: 'high' },
    'brake_effectiveness': { question: 'Brake Effectiveness', importance: 'critical' },
    'parking_brake': { question: 'Parking Brake Functional', importance: 'high' },

    // Engine Specific
    'engine_start': { question: 'Engine Starts', importance: 'critical' },
    'engine_running': { question: 'Engine Running Normally', importance: 'critical' },
    'power_loss': { question: 'Power Loss', importance: 'high' },
    'overheating': { question: 'Overheating', importance: 'critical' },
    'check_engine_light': { question: 'Check Engine Light', importance: 'high' },

    // Electrical
    'battery_light': { question: 'Battery Warning Light', importance: 'high' },
    'dashboard_lights': { question: 'Dashboard Lights Working', importance: 'medium' },
    'wipers_working': { question: 'Wipers Functional', importance: 'medium' },
    'lights_working': { question: 'Lights Functional', importance: 'high' },

    // HVAC
    'heating_working': { question: 'Heating System', importance: 'medium' },
    'cooling_working': { question: 'Cooling System', importance: 'medium' },
    'defroster_working': { question: 'Defroster Functional', importance: 'high' },

    // Timing
    'when_noticed': { question: 'When Problem Noticed', importance: 'medium' },
    'problem_started': { question: 'When Problem Started', importance: 'medium' },
    'gradual_sudden': { question: 'Gradual or Sudden', importance: 'high' },

    // Actions Taken
    'driver_attempted_fix': { question: 'Driver Attempted Fix', importance: 'medium' },
    'actions_taken': { question: 'Actions Taken', importance: 'medium' },
    'recommended_action': { question: 'Recommended Action', importance: 'high' },

    // Service Impact
    'service_delay_minutes': { question: 'Service Delay (minutes)', importance: 'high' },
    'passengers_affected': { question: 'Passengers Affected', importance: 'medium' },
    'alternative_service': { question: 'Alternative Service Available', importance: 'medium' }
  };

  // Extract all fields from wizard data
  Object.entries(wizard_assessment_data).forEach(([key, value]) => {
    // Skip null, undefined, or system fields
    if (value === null || value === undefined || key.startsWith('_')) {
      return;
    }

    const mapping = questionMap[key];
    const question = mapping?.question || formatFieldName(key);
    const importance = mapping?.importance || 'low';

    responses.push({
      key,
      question,
      answer: formatAnswer(value),
      rawValue: value,
      importance
    });
  });

  // Sort by importance
  const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  responses.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);

  return responses;
}

/**
 * Get key symptoms from wizard data for quick summary
 * @param {Object} wizard_data - Wizard assessment data
 * @returns {Array} Array of critical symptom strings
 */
export function getKeySymptoms(wizard_data) {
  if (!wizard_data) return [];

  const symptoms = [];

  // Direct symptom fields
  if (wizard_data.symptoms) {
    if (Array.isArray(wizard_data.symptoms)) {
      symptoms.push(...wizard_data.symptoms);
    } else {
      symptoms.push(wizard_data.symptoms);
    }
  }

  // Driver observations
  if (wizard_data.driver_observations) {
    symptoms.push(wizard_data.driver_observations);
  }

  // Problem description
  if (wizard_data.description) {
    symptoms.push(wizard_data.description);
  }

  // Warning lights
  if (wizard_data.warning_lights && wizard_data.warning_lights !== 'none') {
    symptoms.push(`Warning: ${wizard_data.warning_lights}`);
  }

  // Unusual sounds
  if (wizard_data.unusual_sounds && wizard_data.unusual_sounds !== 'none') {
    symptoms.push(`Sound: ${wizard_data.unusual_sounds}`);
  }

  // Fluid leaks
  if (wizard_data.fluid_leaks === true || wizard_data.fluid_leaks === 'yes') {
    symptoms.push('Fluid leak detected');
  }

  // Smoke/steam
  if (wizard_data.smoke_steam) {
    symptoms.push(`Smoke/steam: ${wizard_data.smoke_steam}`);
  }

  return symptoms.filter(Boolean).slice(0, 5); // Top 5 symptoms
}

/**
 * Extract safety flags and concerns
 * @param {Object} wizard_data - Wizard assessment data
 * @returns {Object} Safety information object
 */
export function getSafetyFlags(wizard_data) {
  if (!wizard_data) return { hasConcerns: false, flags: [] };

  const flags = [];

  // Safety critical
  if (wizard_data.safety_critical === true) {
    flags.push({ severity: 'critical', message: 'SAFETY CRITICAL ISSUE' });
  }

  // Immediate danger
  if (wizard_data.immediate_danger === true) {
    flags.push({ severity: 'critical', message: 'IMMEDIATE DANGER TO SAFETY' });
  }

  // Cannot continue
  if (wizard_data.can_continue === false || wizard_data.can_continue === 'no') {
    flags.push({ severity: 'critical', message: 'VEHICLE CANNOT CONTINUE SERVICE' });
  }

  // Passengers on board
  if (wizard_data.passengers_onboard === true || wizard_data.passengers_onboard === 'yes') {
    flags.push({ severity: 'high', message: 'Passengers currently on board' });
  }

  // Smoke or steam
  if (wizard_data.smoke_steam) {
    flags.push({ severity: 'critical', message: `Smoke/steam detected: ${wizard_data.smoke_steam}` });
  }

  // Not driveable
  if (wizard_data.vehicle_driveable === false || wizard_data.vehicle_driveable === 'no') {
    flags.push({ severity: 'high', message: 'Vehicle not driveable' });
  }

  return {
    hasConcerns: flags.length > 0,
    flags,
    criticalCount: flags.filter(f => f.severity === 'critical').length
  };
}

/**
 * Calculate service impact score
 * @param {Object} breakdown - Complete breakdown object
 * @returns {Object} Service impact analysis
 */
export function getServiceImpact(breakdown) {
  const impact = {
    score: 0,
    level: 'LOW',
    factors: []
  };

  // Priority routes
  const priorityRoutes = {
    'X10': { points: 5, label: 'Critical express route' },
    'X21': { points: 5, label: 'Critical express route' },
    '21': { points: 4, label: 'High frequency route' },
    '56': { points: 4, label: 'Key corridor route' },
    '1': { points: 4, label: 'Main urban route' },
    'X9': { points: 5, label: 'Critical express route' },
    'X12': { points: 4, label: 'Express route' }
  };

  const route = breakdown.wizard_assessment_data?.route || breakdown.route;
  if (route && priorityRoutes[route]) {
    impact.score += priorityRoutes[route].points;
    impact.factors.push(priorityRoutes[route].label);
  }

  // Peak time detection (6-9am, 4-7pm weekdays)
  const createdAt = new Date(breakdown.created_at);
  const hour = createdAt.getHours();
  const day = createdAt.getDay(); // 0=Sunday, 6=Saturday
  const isWeekday = day >= 1 && day <= 5;
  const isPeakMorning = hour >= 6 && hour < 9;
  const isPeakEvening = hour >= 16 && hour < 19;

  if (isWeekday && (isPeakMorning || isPeakEvening)) {
    impact.score += 3;
    impact.factors.push('Peak service hours');
  }

  // Severity
  const severity = breakdown.severity || breakdown.wizard_decision;
  if (severity === 'STOP') {
    impact.score += 3;
    impact.factors.push('Vehicle stopped');
  } else if (severity === 'AMBER') {
    impact.score += 2;
    impact.factors.push('Service affected');
  }

  // Service delay
  const delayMinutes = breakdown.wizard_assessment_data?.service_delay_minutes;
  if (delayMinutes > 30) {
    impact.score += 2;
    impact.factors.push(`${delayMinutes} min delay`);
  } else if (delayMinutes > 15) {
    impact.score += 1;
    impact.factors.push(`${delayMinutes} min delay`);
  }

  // Passengers affected
  const passengersAffected = breakdown.wizard_assessment_data?.passengers_affected;
  if (passengersAffected > 50) {
    impact.score += 2;
    impact.factors.push(`${passengersAffected}+ passengers affected`);
  }

  // Determine level
  if (impact.score >= 10) {
    impact.level = 'CRITICAL';
  } else if (impact.score >= 7) {
    impact.level = 'HIGH';
  } else if (impact.score >= 4) {
    impact.level = 'MEDIUM';
  }

  return impact;
}

/**
 * Get suggested engineer skills based on issue category
 * @param {String} issue_category - Breakdown issue category
 * @returns {Array} Required skills
 */
export function getSuggestedSkills(issue_category) {
  const skillMap = {
    'Brakes': ['brake_systems', 'hydraulics', 'pneumatics'],
    'Engine': ['diesel_engine', 'diagnostics', 'electrical'],
    'Steering': ['power_steering', 'hydraulics', 'suspension'],
    'Suspension': ['suspension', 'mechanical'],
    'HVAC': ['air_conditioning', 'heating_systems', 'electrical'],
    'Electrical': ['electrical_systems', 'diagnostics', 'wiring'],
    'Transmission': ['transmission', 'mechanical', 'diagnostics'],
    'Fuel System': ['fuel_systems', 'diesel_engine', 'diagnostics'],
    'Cooling System': ['cooling_systems', 'mechanical'],
    'Exhaust': ['exhaust_systems', 'mechanical'],
    'Doors': ['door_systems', 'pneumatics', 'electrical'],
    'Wheelchair Ramp': ['accessibility_systems', 'hydraulics', 'electrical'],
    'Windscreen': ['glazing', 'mechanical'],
    'Tyres': ['tyres', 'wheels', 'mechanical'],
    'Lights': ['electrical_systems', 'lighting'],
    'Body Damage': ['body_repair', 'mechanical']
  };

  return skillMap[issue_category] || ['general_mechanical'];
}

/**
 * Format field name into readable text
 * @param {String} fieldName - Raw field name
 * @returns {String} Formatted question
 */
function formatFieldName(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format answer value for display
 * @param {*} value - Answer value
 * @returns {String} Formatted answer
 */
function formatAnswer(value) {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

/**
 * Create assessment summary for quick overview
 * @param {Object} breakdown - Complete breakdown object
 * @returns {Object} Assessment summary
 */
export function createAssessmentSummary(breakdown) {
  const wizard_data = breakdown.wizard_assessment_data || {};

  return {
    issue: breakdown.issue_category || 'General',
    severity: breakdown.severity || breakdown.wizard_decision || 'Unknown',
    symptoms: getKeySymptoms(wizard_data),
    safety: getSafetyFlags(wizard_data),
    serviceImpact: getServiceImpact(breakdown),
    suggestedSkills: getSuggestedSkills(breakdown.issue_category),
    canContinue: wizard_data.can_continue !== false && wizard_data.can_continue !== 'no',
    isDriveable: wizard_data.vehicle_driveable !== false && wizard_data.vehicle_driveable !== 'no',
    hasPassengers: wizard_data.passengers_onboard === true || wizard_data.passengers_onboard === 'yes'
  };
}
