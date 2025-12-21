/**
 * Go BARRY Breakdown Management System - Duty Manager
 *
 * Manages supervisor duty shifts, including:
 * - Duty configuration and validation
 * - Shift start/end tracking
 * - Shift end warnings
 * - Shift history
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import { from, insert, update } from '../utils/queryHelpers.js';

// Duty shift configurations (SECURITY FIX: Use numeric codes to prevent injection)
export const DUTY_SHIFTS = {
  '100': {
    code: '100',
    displayName: 'Duty 100 - Early Shift',
    startTime: '06:00',
    endTime: '15:30',
    description: 'Early shift (06:00 - 15:30)'
  },
  '200': {
    code: '200',
    displayName: 'Duty 200 - Day Shift',
    startTime: '07:30',
    endTime: '17:00',
    description: 'Day shift (07:30 - 17:00)'
  },
  '400': {
    code: '400',
    displayName: 'Duty 400 - Late Shift',
    startTime: '12:30',
    endTime: '22:00',
    description: 'Late shift (12:30 - 22:00)'
  },
  '500': {
    code: '500',
    displayName: 'Duty 500 - Night Shift',
    startTime: '14:45',
    endTime: '00:15',
    description: 'Night shift (14:45 - 00:15)',
    crossesMidnight: true
  }
};

// Warning time before shift ends (minutes)
const SHIFT_END_WARNING_MINUTES = 15;

/**
 * Get duty display name from code
 * @param {string} dutyCode - Duty code (e.g., '100', 'Duty 100')
 * @returns {string} - Display name (e.g., 'Early Shift')
 */
export function getDutyName(dutyCode) {
  // Handle null/undefined
  if (!dutyCode) return 'Unknown';

  // Normalize the code first
  const normalizedCode = dutyCode.toString().replace('Duty ', '');
  const duty = DUTY_SHIFTS[normalizedCode];

  if (!duty) return `Duty ${normalizedCode}`;

  // Extract just the shift name (e.g., 'Early Shift' from 'Duty 100 - Early Shift')
  const namePart = duty.displayName.split(' - ')[1] || duty.displayName;
  return namePart;
}

/**
 * Normalize duty code to numeric format
 * Accepts both 'Duty 100' and '100' formats, returns '100'
 * SECURITY FIX: Prevents duty code injection by standardizing to numeric format
 * @param {string} dutyCode - Duty code in any format
 * @returns {string} - Normalized numeric duty code
 */
export function normalizeDutyCode(dutyCode) {
  if (!dutyCode) {
    throw new Error('Duty code is required');
  }

  // If it starts with 'Duty ', strip that prefix
  if (typeof dutyCode === 'string' && dutyCode.startsWith('Duty ')) {
    const normalized = dutyCode.substring(5); // Remove 'Duty ' prefix
    if (DUTY_SHIFTS[normalized]) {
      return normalized;
    }
  }

  // If it's already numeric, verify it exists
  if (DUTY_SHIFTS[dutyCode]) {
    return dutyCode.toString();
  }

  // Otherwise, invalid
  throw new Error(`Invalid duty code: ${dutyCode}`);
}

/**
 * Calculate shift end time from duty code
 * @param {string} dutyCode - Duty code (e.g., 'Duty 100')
 * @returns {Date} - Shift end datetime
 */
export function calculateShiftEndTime(dutyCode) {
  const duty = DUTY_SHIFTS[dutyCode];
  if (!duty) {
    throw new Error(`Unknown duty code: ${dutyCode}`);
  }

  const now = new Date();
  const [endHours, endMinutes] = duty.endTime.split(':').map(Number);
  const [startHours] = duty.startTime.split(':').map(Number);

  const endTime = new Date();
  endTime.setHours(endHours, endMinutes, 0, 0);

  // If shift crosses midnight (endHours < startHours), handle carefully
  if (duty.crossesMidnight || endHours < startHours) {
    // If we're currently before the end time (early morning), end time is today
    // If we're currently after the start time (late evening), end time is tomorrow
    const currentHour = now.getHours();

    if (currentHour >= startHours) {
      // We started today, ends tomorrow
      endTime.setDate(endTime.getDate() + 1);
    }
    // else: We're in the morning after midnight, end time is today
  }

  return endTime;
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

/**
 * Start a supervisor's shift
 * @param {Object} params - Shift parameters
 * @param {string} params.supervisorId - Supervisor ID
 * @param {string} params.supervisorName - Supervisor name
 * @param {string} params.supervisorBadge - Supervisor badge number
 * @param {string} params.duty - Duty code
 * @returns {Promise<Object>} - Created shift record
 */
export async function startShift({ supervisorId, supervisorName, supervisorBadge, duty }) {
  // Input validation
  if (!supervisorId || !supervisorName || !duty) {
    throw new Error('Missing required parameters');
  }

  // SECURITY FIX: Normalize duty code to prevent injection
  let normalizedDuty;
  try {
    normalizedDuty = normalizeDutyCode(duty);
  } catch (error) {
    throw new Error(`Invalid duty code: ${duty}`);
  }

  // Validate badge format (e.g., AG003, BP009)
  if (supervisorBadge && !/^[A-Z]{2}\d{3}$/.test(supervisorBadge)) {
    console.warn(`Invalid badge format: ${supervisorBadge}, continuing anyway`);
  }

  // Check for existing active shift (race condition protection)
  const { data: existingShift, error: checkError } = await from('supervisors')
    .select('current_duty, duty_start_time')
    .eq('id', supervisorId)
    .notNull('current_duty')
    .single();

  if (existingShift && !checkError) {
    console.warn(`Supervisor ${supervisorName} already has active shift: ${existingShift.current_duty}`);
    // End the existing shift first
    try {
      await endShift(supervisorId);
    } catch (endError) {
      console.error('Error ending existing shift:', endError);
    }
  }

  const shiftStart = new Date();
  const shiftEnd = calculateShiftEndTime(normalizedDuty);

  // Convert to MySQL datetime format
  const toMySQLDatetime = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Update supervisor's current duty (using normalized numeric code)
  await update('supervisors', { id: supervisorId }, {
    current_duty: normalizedDuty,
    duty_start_time: toMySQLDatetime(shiftStart),
    duty_end_time: toMySQLDatetime(shiftEnd)
  });

  // Create shift history record (using normalized numeric code)
  const shiftHistory = {
    supervisor_id: supervisorId,
    supervisor_name: supervisorName,
    supervisor_badge: supervisorBadge,
    duty: normalizedDuty,
    shift_start: toMySQLDatetime(shiftStart),
    shift_end: null, // Will be filled when shift ends
    breakdowns_handled: 0,
    assessments_completed: 0
  };

  const result = await insert('supervisor_shift_history', shiftHistory);

  console.log(`✅ Shift started: ${supervisorName} (${supervisorBadge}) on Duty ${normalizedDuty}`);

  return {
    shiftHistoryId: result.insertId,
    duty: normalizedDuty,
    shiftStart,
    shiftEnd,
    warningTime: calculateWarningTime(shiftEnd)
  };
}

/**
 * End a supervisor's shift
 * @param {string} supervisorId - Supervisor ID
 * @returns {Promise<Object>} - Ended shift data
 */
export async function endShift(supervisorId) {
  // Get supervisor's current shift
  const { data: supervisor, error } = await from('supervisors')
    .select('id, current_duty, duty_start_time, badge_number, name')
    .eq('id', supervisorId)
    .single();

  if (error || !supervisor || !supervisor.current_duty) {
    throw new Error('No active shift found for supervisor');
  }

  const shiftEnd = new Date();
  const toMySQLDatetime = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Update shift history record
  const { data: historyRecords } = await from('supervisor_shift_history')
    .select('*')
    .eq('supervisor_id', supervisorId)
    .eq('duty', supervisor.current_duty)
    .gte('shift_start', supervisor.duty_start_time)
    .isNull('shift_end')
    .order('shift_start', 'DESC')
    .limit(1)
    .execute();

  if (historyRecords && historyRecords.length > 0) {
    const historyRecord = historyRecords[0];

    // Count breakdowns handled during shift
    const { data: breakdowns } = await from('breakdowns')
      .select('COUNT(*) as count')
      .eq('supervisor_badge', supervisor.badge_number)
      .gte('created_at', supervisor.duty_start_time)
      .lte('created_at', toMySQLDatetime(shiftEnd))
      .execute();

    const breakdownCount = breakdowns?.[0]?.count || 0;

    await update('supervisor_shift_history', { id: historyRecord.id }, {
      shift_end: toMySQLDatetime(shiftEnd),
      breakdowns_handled: breakdownCount
    });
  }

  // Clear supervisor's current duty
  await update('supervisors', { id: supervisorId }, {
    current_duty: null,
    duty_start_time: null,
    duty_end_time: null
  });

  console.log(`✅ Shift ended: ${supervisor.name} (${supervisor.badge_number}) from ${supervisor.current_duty}`);

  return {
    supervisorName: supervisor.name,
    duty: supervisor.current_duty,
    shiftEnd
  };
}

/**
 * Check if supervisor should receive shift-ending warning
 * @param {string} supervisorId - Supervisor ID
 * @returns {Promise<Object|null>} - Warning info or null
 */
export async function checkShiftEndingWarning(supervisorId) {
  const { data: supervisor, error } = await from('supervisors')
    .select('id, name, current_duty, duty_end_time')
    .eq('id', supervisorId)
    .single();

  if (error || !supervisor || !supervisor.current_duty || !supervisor.duty_end_time) {
    return null;
  }

  const now = new Date();
  const dutyEndTime = new Date(supervisor.duty_end_time);
  const warningTime = calculateWarningTime(dutyEndTime);

  // Check if we're within the warning window
  if (now >= warningTime && now < dutyEndTime) {
    const minutesRemaining = Math.floor((dutyEndTime - now) / 60000);

    return {
      shouldWarn: true,
      duty: supervisor.current_duty,
      minutesRemaining,
      message: `Your shift (${supervisor.current_duty}) ends in ${minutesRemaining} minutes. Please ensure your EPM entries are complete - handover if not able to Miles Post any entries.`
    };
  }

  return null;
}

/**
 * Get active supervisors on shift
 * @param {string} dutyCode - Optional duty filter
 * @returns {Promise<Array>} - Active supervisors
 */
export async function getActiveSupervisors(dutyCode = null) {
  let query = from('supervisors')
    .select('id, name, email, badge_number, current_duty, duty_start_time, duty_end_time')
    .notNull('current_duty');

  if (dutyCode) {
    query = query.eq('current_duty', dutyCode);
  }

  const { data, error } = await query.execute();

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get shift history for reporting
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - Shift history records
 */
export async function getShiftHistory(filters = {}) {
  let query = from('supervisor_shift_history')
    .select('*')
    .order('shift_start', 'DESC');

  if (filters.supervisorId) {
    query = query.eq('supervisor_id', filters.supervisorId);
  }

  if (filters.duty) {
    query = query.eq('duty', filters.duty);
  }

  if (filters.startDate) {
    query = query.gte('shift_start', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('shift_start', filters.endDate);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.execute();

  if (error) {
    throw error;
  }

  return data || [];
}

export default {
  DUTY_SHIFTS,
  getDutyName,
  normalizeDutyCode,
  calculateShiftEndTime,
  calculateWarningTime,
  startShift,
  endShift,
  checkShiftEndingWarning,
  getActiveSupervisors,
  getShiftHistory
};
