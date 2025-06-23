// Go_BARRY/utils/dateTime.js
// Centralized date and time formatting utilities for UK format consistency

/**
 * Format time in 24-hour format (HH:MM)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string
 */
export const formatTime24 = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format time in 24-hour format with seconds (HH:MM:SS)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string
 */
export const formatTime24WithSeconds = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Format date in UK format (DD/MM/YYYY)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export const formatDateUK = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format date with full month name (DD Month YYYY)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export const formatDateLong = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format date with weekday (Weekday, DD Month YYYY)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export const formatDateWithWeekday = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format date and time together in UK format (DD/MM/YYYY, HH:MM)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeUK = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format date and time with full month name (DD Month YYYY at HH:MM)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeLong = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return `${datePart} at ${timePart}`;
};

/**
 * Get relative time (e.g., "2 minutes ago", "in 3 hours")
 * @param {Date|string} date - Date object or date string
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // For older dates, return the formatted date
  return formatDateUK(d);
};

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Check if a date is today
 * @param {Date|string} date - Date object or date string
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

/**
 * Format date/time for display based on context
 * Shows time only if today, otherwise shows date
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted string
 */
export const formatSmartDateTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  
  if (isToday(d)) {
    return formatTime24(d);
  }
  
  return formatDateUK(d);
};

// Export all functions as default object for convenience
export default {
  formatTime24,
  formatTime24WithSeconds,
  formatDateUK,
  formatDateLong,
  formatDateWithWeekday,
  formatDateTimeUK,
  formatDateTimeLong,
  getRelativeTime,
  formatDuration,
  isToday,
  formatSmartDateTime
};
