/**
 * Time Utility Functions for SDC Dashboard
 * Provides relative time formatting and human-readable timestamps
 */

/**
 * Convert timestamp to relative time (e.g., "5 mins ago", "2 hours ago")
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} - Human-readable relative time
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 30) return 'Just now';
  if (diffSecs < 60) return `${diffSecs} secs ago`;
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  // For older timestamps, show the date
  return then.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get time elapsed since timestamp in minutes
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {number} - Minutes elapsed
 */
export const getMinutesElapsed = (timestamp) => {
  if (!timestamp) return 0;
  const now = new Date();
  const then = new Date(timestamp);
  return Math.floor((now - then) / 1000 / 60);
};

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (e.g., "5m 30s", "1h 20m")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 && hours === 0) parts.push(`${secs}s`); // Only show seconds if less than an hour

  return parts.join(' ') || '0s';
};

/**
 * Get SLA status based on elapsed time and issue type
 * @param {string} issueType - Type of issue
 * @param {number} minutesElapsed - Minutes elapsed since breakdown reported
 * @param {boolean} isPriorityRoute - Is this a priority route?
 * @returns {object} - SLA status { status: 'ok'|'warning'|'critical', threshold: number, remaining: number }
 */
export const getSLAStatus = (issueType, minutesElapsed, isPriorityRoute = false) => {
  // SLA thresholds in minutes
  const slaThresholds = {
    critical: isPriorityRoute ? 15 : 20,
    high: isPriorityRoute ? 30 : 45,
    normal: isPriorityRoute ? 60 : 90
  };

  // Determine issue severity
  const criticalIssues = [
    'Steering', 'Brakes', 'ABS Light', 'Non Starter',
    'Overheating', 'Oil Warning Light', 'Road Traffic Incidents',
    'Puncture', 'Warning Lights', 'Suspension', 'Gear Selection',
    'Gearbox', 'Cutting Out/Fuel', 'Loose Wheel Nuts'
  ];

  const severity = criticalIssues.includes(issueType) ? 'critical' : 'normal';
  const threshold = slaThresholds[severity];
  const remaining = Math.max(0, threshold - minutesElapsed);
  const percentElapsed = (minutesElapsed / threshold) * 100;

  let status = 'ok';
  if (percentElapsed >= 100) status = 'critical';
  else if (percentElapsed >= 75) status = 'warning';

  return {
    status,
    threshold,
    remaining,
    minutesElapsed,
    percentElapsed: Math.min(100, percentElapsed)
  };
};

/**
 * Get time urgency indicator
 * @param {number} minutesElapsed - Minutes elapsed
 * @returns {object} - Urgency info { level: string, icon: string, color: string }
 */
export const getTimeUrgency = (minutesElapsed) => {
  if (minutesElapsed < 5) {
    return { level: 'new', icon: '🆕', color: '#10b981' };
  } else if (minutesElapsed < 15) {
    return { level: 'recent', icon: '⏱️', color: '#3b82f6' };
  } else if (minutesElapsed < 30) {
    return { level: 'pending', icon: '⏳', color: '#f59e0b' };
  } else {
    return { level: 'urgent', icon: '🚨', color: '#ef4444' };
  }
};

export default {
  getRelativeTime,
  getMinutesElapsed,
  formatDuration,
  getSLAStatus,
  getTimeUrgency
};
