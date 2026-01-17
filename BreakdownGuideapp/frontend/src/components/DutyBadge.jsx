/**
 * Duty Badge Component
 * Displays current duty shift in header with countdown timer
 *
 * Features:
 * - Color-coded by duty (blue/green/amber/purple)
 * - Live countdown timer (updates every second)
 * - Warning state when < 30 min remaining
 * - Glassmorphic design matching design system
 * - Tooltip with full duty details
 * - Responsive (hidden on mobile)
 * - Updated January 2026: Custom SVG badge icons
 */

import React, { useState, useEffect } from 'react';
import { DutyBadge as DutyBadgeIcon } from './icons/DutyBadgeIcons';
import './DutyBadge.css';

// Duty shift definitions (matching DutySelectionModal)
const DUTY_CONFIG = {
  '100': {
    name: 'Early Shift',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)'
  },
  '200': {
    name: 'Day Shift',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)'
  },
  '400': {
    name: 'Late Shift',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #FCD34D)'
  },
  '500': {
    name: 'Night Shift',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
  }
};

const DutyBadge = ({ currentDuty, onClick }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!currentDuty) return;

    const updateCountdown = () => {
      const now = new Date();
      const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);

      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts
      if (endTime < now) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const diffMs = endTime - now;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;

      // Set warning state if < 30 min remaining
      setIsWarning(diffMinutes < 30);

      if (diffHours > 0) {
        setTimeRemaining(`${diffHours}h ${mins}m`);
      } else if (diffMinutes > 0) {
        setTimeRemaining(`${diffMinutes}m`);
      } else {
        setTimeRemaining('Ending');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(timer);
  }, [currentDuty]);

  if (!currentDuty) return null;

  const dutyConfig = DUTY_CONFIG[currentDuty.code] || DUTY_CONFIG['200'];

  return (
    <div
      className={`duty-badge ${isWarning ? 'warning' : ''}`}
      style={{
        '--duty-color': dutyConfig.color,
        '--duty-gradient': dutyConfig.gradient
      }}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="duty-badge-content">
        <span className="duty-icon">
          <DutyBadgeIcon dutyCode={currentDuty.code} size={28} />
        </span>
        <div className="duty-info">
          <span className="duty-label">Duty {currentDuty.code}</span>
          <span className="duty-countdown">{timeRemaining}</span>
        </div>
        {currentDuty.locked && (
          <span className="duty-lock-icon" title="Duty locked">🔒</span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="duty-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-icon">
              <DutyBadgeIcon dutyCode={currentDuty.code} size={24} />
            </span>
            <span className="tooltip-title">Duty {currentDuty.code} - {dutyConfig.name}</span>
          </div>
          <div className="tooltip-time">
            <span>Start: {currentDuty.startTime}</span>
            <span>End: {currentDuty.endTime}</span>
          </div>
          <div className="tooltip-duration">
            Duration: {currentDuty.duration || '9h 30m'}
          </div>
          <div className={`tooltip-status ${isWarning ? 'warning' : 'active'}`}>
            {isWarning ? '⚠️ Ending Soon' : '✓ Active'}
          </div>
        </div>
      )}
    </div>
  );
};

export default DutyBadge;
