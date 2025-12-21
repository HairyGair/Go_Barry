/**
 * Go BARRY Breakdown Management System
 * Phase 7.4: Shift Ending Badge Component
 *
 * Displays warning when shift is ending soon
 * Shows on breakdown cards to prioritize completion
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React from 'react';
import useShiftTimeRemaining from '../hooks/useShiftTimeRemaining';
import './ShiftEndingBadge.css';

const ShiftEndingBadge = ({ compact = false }) => {
  const {
    hasActiveShift,
    isEndingSoon,
    isCritical,
    minutesRemaining,
    message,
    formattedTime
  } = useShiftTimeRemaining();

  // Don't show if no active shift or not ending soon
  if (!hasActiveShift || !isEndingSoon) {
    return null;
  }

  const badgeClass = isCritical ? 'shift-ending-badge critical' : 'shift-ending-badge warning';

  if (compact) {
    return (
      <div className={`${badgeClass} compact`} title={formattedTime}>
        <span className="badge-icon">⏰</span>
        <span className="badge-time">{minutesRemaining}m</span>
      </div>
    );
  }

  return (
    <div className={badgeClass}>
      <span className="badge-icon">{isCritical ? '⚡' : '⏰'}</span>
      <span className="badge-text">{message}</span>
      <span className="badge-time">{formattedTime}</span>
    </div>
  );
};

export default ShiftEndingBadge;
