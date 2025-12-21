/**
 * Go BARRY Breakdown Management System
 * Phase 7.4: Shift Time Remaining Hook
 *
 * Calculates time remaining in current duty shift
 * Returns warning state when <1 hour remaining
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import { useState, useEffect, useMemo } from 'react';

// Standard duty shift definitions (matching backend)
const DUTY_SHIFTS = {
  '100': { name: 'Early Shift', start: '06:00', end: '15:30' },
  '200': { name: 'Day Shift', start: '07:30', end: '17:00' },
  '400': { name: 'Late Shift', start: '12:30', end: '22:00' },
  '500': { name: 'Night Shift', start: '14:45', end: '00:15' }
};

/**
 * Parse time string to minutes since midnight
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {number} Minutes since midnight
 */
const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Get current time as minutes since midnight
 * @returns {number} Current time in minutes
 */
const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/**
 * Calculate minutes remaining in shift
 * @param {string} endTime - Shift end time "HH:MM"
 * @returns {number} Minutes remaining (negative if past end)
 */
const calculateMinutesRemaining = (endTime) => {
  const currentMinutes = getCurrentMinutes();
  let endMinutes = parseTimeToMinutes(endTime);

  // Handle overnight shifts (end time is next day)
  if (endMinutes < parseTimeToMinutes('06:00')) {
    // Shift ends after midnight
    if (currentMinutes < endMinutes) {
      // It's past midnight, but before end time
      return endMinutes - currentMinutes;
    } else if (currentMinutes >= parseTimeToMinutes('14:00')) {
      // It's still the same day (after shift started)
      return (24 * 60 - currentMinutes) + endMinutes;
    }
  }

  return endMinutes - currentMinutes;
};

/**
 * Hook to track time remaining in current duty shift
 * @returns {Object} Shift time status and helpers
 */
const useShiftTimeRemaining = () => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Get current duty from sessionStorage
  const currentDuty = useMemo(() => {
    const stored = sessionStorage.getItem('currentDuty');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [updateTrigger]);

  // Get shift info based on duty code
  const shiftInfo = useMemo(() => {
    if (!currentDuty?.code) return null;
    return DUTY_SHIFTS[currentDuty.code] || null;
  }, [currentDuty]);

  // Calculate time remaining
  useEffect(() => {
    if (!shiftInfo) {
      setTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      const minutes = calculateMinutesRemaining(shiftInfo.end);
      setTimeRemaining(minutes);
    };

    // Initial calculation
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [shiftInfo]);

  // Calculate status flags
  const status = useMemo(() => {
    if (timeRemaining === null) {
      return {
        hasActiveShift: false,
        isEndingSoon: false,
        isCritical: false,
        minutesRemaining: null,
        formattedTime: null,
        shiftName: null,
        dutyCode: null,
        message: null
      };
    }

    const hours = Math.floor(Math.abs(timeRemaining) / 60);
    const minutes = Math.abs(timeRemaining) % 60;
    const isNegative = timeRemaining < 0;

    const formattedTime = isNegative
      ? `${hours}h ${minutes}m overtime`
      : `${hours}h ${minutes}m remaining`;

    // Warning at 60 minutes, critical at 30 minutes
    const isEndingSoon = timeRemaining > 0 && timeRemaining <= 60;
    const isCritical = timeRemaining > 0 && timeRemaining <= 30;

    let message = null;
    if (isCritical) {
      message = 'Complete before shift ends!';
    } else if (isEndingSoon) {
      message = 'Shift ending soon';
    } else if (isNegative) {
      message = 'Shift has ended';
    }

    return {
      hasActiveShift: true,
      isEndingSoon,
      isCritical,
      minutesRemaining: timeRemaining,
      formattedTime,
      shiftName: shiftInfo?.name || currentDuty?.name,
      dutyCode: currentDuty?.code,
      message
    };
  }, [timeRemaining, shiftInfo, currentDuty]);

  // Force refresh function (e.g., when duty changes)
  const refresh = () => setUpdateTrigger(prev => prev + 1);

  return {
    ...status,
    refresh
  };
};

export default useShiftTimeRemaining;
