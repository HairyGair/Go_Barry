/**
 * SECURE Duty Manager - Standardized Duty Code Format
 * Uses consistent duty codes: '100', '200', '400', '500' (no "Duty " prefix)
 */

import { from, insert, update } from '../utils/queryHelpers.js';

// Duty shift configurations - STANDARDIZED FORMAT
export const DUTY_SHIFTS = {
  '100': {
    code: '100',
    name: 'Early Shift',
    displayName: 'Duty 100 - Early Shift',
    startTime: '06:00',
    endTime: '15:30',
    description: 'Early shift (06:00 - 15:30)'
  },
  '200': {
    code: '200',
    name: 'Day Shift',
    displayName: 'Duty 200 - Day Shift',
    startTime: '07:30',
    endTime: '17:00',
    description: 'Day shift (07:30 - 17:00)'
  },
  '400': {
    code: '400',
    name: 'Late Shift',
    displayName: 'Duty 400 - Late Shift',
    startTime: '12:30',
    endTime: '22:00',
    description: 'Late shift (12:30 - 22:00)'
  },
  '500': {
    code: '500',
    name: 'Night Shift',
    displayName: 'Duty 500 - Night Shift',
    startTime: '14:45',
    endTime: '00:15',
    description: 'Night shift (14:45 - 00:15)',
    crossesMidnight: true
  }
};

// Valid duty codes for validation
export const VALID_DUTY_CODES = ['100', '200', '400', '500'];

// Warning time before shift ends (minutes)
const SHIFT_END_WARNING_MINUTES = 15;

/**
 * Validate duty code format
 * @param {string} dutyCode - Duty code to validate
 * @returns {boolean} - True if valid
 */
export function isValidDutyCode(dutyCode) {
  return VALID_DUTY_CODES.includes(dutyCode);
}

/**
 * Normalize duty code (remove "Duty " prefix if present)
 * @param {string} dutyCode - Raw duty code
 * @returns {string} - Normalized code ('100', '200', etc.)
 */
export function normalizeDutyCode(dutyCode) {
  if (!dutyCode) return null;

  // Remove "Duty " prefix if present
  const normalized = dutyCode.replace(/^Duty\s+/i, '');

  // Validate the normalized code
  if (!isValidDutyCode(normalized)) {
    throw new Error(`Invalid duty code: ${dutyCode}`);
  }

  return normalized;
}

/**
 * Get display name for duty code
 * @param {string} dutyCode - Normalized duty code
 * @returns {string} - Display name for UI
 */
export function getDutyDisplayName(dutyCode) {
  const duty = DUTY_SHIFTS[dutyCode];
  return duty ? duty.displayName : `Duty ${dutyCode}`;
}

/**
 * Calculate shift end time from duty code
 * @param {string} dutyCode - Normalized duty code
 * @returns {Date} - Shift end datetime
 */
export function calculateShiftEndTime(dutyCode) {
  const normalizedCode = normalizeDutyCode(dutyCode);
  const duty = DUTY_SHIFTS[normalizedCode];

  if (!duty) {
    throw new Error(`Unknown duty code: ${dutyCode}`);
  }

  const now = new Date();
  const [endHours, endMinutes] = duty.endTime.split(':').map(Number);
  const [startHours] = duty.startTime.split(':').map(Number);

  const endTime = new Date();
  endTime.setHours(endHours, endMinutes, 0, 0);

  // If shift crosses midnight, handle carefully
  if (duty.crossesMidnight || endHours < startHours) {
    const currentHour = now.getHours();

    if (currentHour >= startHours) {
      // We started today, ends tomorrow
      endTime.setDate(endTime.getDate() + 1);
    }
  }

  return endTime;
}

/**
 * Start a supervisor's shift (SECURE VERSION)
 * @param {Object} params - Shift parameters
 * @param {string} params.supervisorId - Supervisor ID
 * @param {string} params.supervisorName - Supervisor name
 * @param {string} params.supervisorBadge - Supervisor badge number
 * @param {string} params.duty - Duty code (will be normalized)
 * @returns {Promise<Object>} - Created shift record
 */
export async function startShift({ supervisorId, supervisorName, supervisorBadge, duty }) {
  try {
    // Normalize and validate duty code
    const normalizedDuty = normalizeDutyCode(duty);

    if (!normalizedDuty) {
      throw new Error('Invalid duty code provided');
    }

    const shiftStart = new Date();
    const shiftEnd = calculateShiftEndTime(normalizedDuty);

    // End any existing active shift for this supervisor
    try {
      await update('supervisor_shift_history', {
        shift_end: shiftStart.toISOString(),
        updated_at: shiftStart.toISOString()
      }, {
        supervisor_id: supervisorId,
        shift_end: null
      });
    } catch (updateError) {
      console.warn('No existing shift to end or error ending shift:', updateError.message);
    }

    // Create new shift record
    const shiftData = {
      supervisor_id: supervisorId,
      supervisor_name: supervisorName,
      supervisor_badge: supervisorBadge,
      duty: normalizedDuty, // Store normalized code
      shift_start: shiftStart.toISOString(),
      shift_end: null,
      breakdowns_handled: 0,
      assessments_completed: 0
    };

    const { data, error } = await insert('supervisor_shift_history', shiftData);

    if (error) {
      throw error;
    }

    // Update supervisor's current duty (store normalized code)
    await update('supervisors', {
      current_duty: normalizedDuty,
      duty_start_time: shiftStart.toISOString(),
      duty_end_time: shiftEnd.toISOString()
    }, {
      id: supervisorId
    });

    console.log(`✅ Shift started: ${supervisorName} on duty ${normalizedDuty} (${getDutyDisplayName(normalizedDuty)})`);

    return {
      id: data?.id,
      duty: normalizedDuty,
      displayName: getDutyDisplayName(normalizedDuty),
      shiftStart,
      shiftEnd,
      warningTime: calculateWarningTime(shiftEnd)
    };
  } catch (error) {
    console.error('Error starting shift:', error);
    throw error;
  }
}

/**
 * Calculate warning time (15 minutes before shift ends)
 * @param {Date} shiftEndTime - Shift end time
 * @returns {Date} - Warning time
 */
export function calculateWarningTime(shiftEndTime) {
  const warningTime = new Date(shiftEndTime);
  warningTime.setMinutes(warningTime.getMinutes() - SHIFT_END_WARNING_MINUTES);
  return warningTime;
}

// Export all functions as default object
export default {
  DUTY_SHIFTS,
  VALID_DUTY_CODES,
  isValidDutyCode,
  normalizeDutyCode,
  getDutyDisplayName,
  calculateShiftEndTime,
  calculateWarningTime,
  startShift
};