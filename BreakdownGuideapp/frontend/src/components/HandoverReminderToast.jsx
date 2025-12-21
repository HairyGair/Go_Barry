/**
 * HandoverReminderToast Component
 *
 * Phase 4.3 - Handover Reminder
 * Persistent toast notification when active breakdowns exist near shift end
 *
 * Features:
 * - Shows "You have X unresolved breakdowns"
 * - Options: Start handover, Quick resolve, Dismiss
 * - Auto-appears at 30/15/5 min before shift end if breakdowns exist
 * - Can be dismissed but reappears at next warning threshold
 */

import React, { useState, useEffect, useCallback } from 'react';
import './HandoverReminderToast.css';

const HandoverReminderToast = ({
  activeBreakdowns = [],
  currentDuty,
  onStartHandover,
  onQuickResolve,
  onViewBreakdowns,
  isVisible = false
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Calculate time remaining
  useEffect(() => {
    if (!currentDuty) return;

    const updateTime = () => {
      const now = new Date();
      const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);

      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts
      const [startHour] = currentDuty.startTime.split(':').map(Number);
      if (endHour < startHour) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const remaining = Math.floor((endTime - now) / (1000 * 60));
      setTimeRemaining(remaining);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000); // Update every 30 sec
    return () => clearInterval(timer);
  }, [currentDuty]);

  // Reset dismissed state at new warning thresholds
  useEffect(() => {
    if (dismissedAt && timeRemaining !== null) {
      // Re-show at each threshold: 30, 15, 5, 0
      const thresholds = [30, 15, 5, 0];
      const currentThreshold = thresholds.find(t => timeRemaining <= t);
      const dismissedThreshold = thresholds.find(t => dismissedAt <= t);

      if (currentThreshold !== dismissedThreshold) {
        setDismissed(false);
        setDismissedAt(null);
      }
    }
  }, [timeRemaining, dismissedAt]);

  const handleDismiss = () => {
    setDismissed(true);
    setDismissedAt(timeRemaining);
  };

  const handleStartHandover = () => {
    setExpanded(false);
    if (onStartHandover) onStartHandover();
  };

  const handleQuickResolve = (breakdownId) => {
    if (onQuickResolve) onQuickResolve(breakdownId);
  };

  // Don't show if:
  // - No active breakdowns
  // - No duty selected
  // - More than 30 minutes remaining
  // - User dismissed at current threshold
  // - Not visible prop
  if (
    !isVisible ||
    !currentDuty ||
    activeBreakdowns.length === 0 ||
    timeRemaining === null ||
    timeRemaining > 30 ||
    dismissed
  ) {
    return null;
  }

  const getUrgencyClass = () => {
    if (timeRemaining <= 0) return 'critical';
    if (timeRemaining <= 5) return 'urgent';
    if (timeRemaining <= 15) return 'warning';
    return 'info';
  };

  const getTimeMessage = () => {
    if (timeRemaining <= 0) return 'Shift has ended!';
    if (timeRemaining <= 5) return `Only ${timeRemaining} min left!`;
    if (timeRemaining <= 15) return `${timeRemaining} min remaining`;
    return `${timeRemaining} min until shift ends`;
  };

  return (
    <div className={`handover-toast handover-toast--${getUrgencyClass()} ${expanded ? 'expanded' : ''}`}>
      {/* Main Toast */}
      <div className="handover-toast__main" onClick={() => setExpanded(!expanded)}>
        <div className="handover-toast__icon">
          {timeRemaining <= 5 ? '🚨' : '⚠️'}
        </div>

        <div className="handover-toast__content">
          <div className="handover-toast__title">
            {activeBreakdowns.length} Unresolved Breakdown{activeBreakdowns.length > 1 ? 's' : ''}
          </div>
          <div className="handover-toast__subtitle">
            {getTimeMessage()}
          </div>
        </div>

        <div className="handover-toast__badge">
          {activeBreakdowns.length}
        </div>

        <button
          className="handover-toast__close"
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          title="Dismiss (will reappear at next warning)"
        >
          ×
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="handover-toast__expanded">
          {/* Breakdown List */}
          <div className="handover-toast__breakdown-list">
            {activeBreakdowns.slice(0, 5).map((breakdown) => (
              <div key={breakdown.id || breakdown.breakdown_id} className="handover-toast__breakdown-item">
                <div className="handover-toast__breakdown-info">
                  <span className="handover-toast__fleet">
                    {breakdown.fleet_no || 'Unknown'}
                  </span>
                  <span className={`handover-toast__severity handover-toast__severity--${(breakdown.severity || 'amber').toLowerCase()}`}>
                    {breakdown.severity || 'AMBER'}
                  </span>
                  <span className="handover-toast__location">
                    {breakdown.location_description || breakdown.location || 'No location'}
                  </span>
                </div>
                <button
                  className="handover-toast__quick-resolve"
                  onClick={(e) => { e.stopPropagation(); handleQuickResolve(breakdown.id || breakdown.breakdown_id); }}
                  title="Mark as resolved"
                >
                  ✓
                </button>
              </div>
            ))}
            {activeBreakdowns.length > 5 && (
              <div className="handover-toast__more">
                +{activeBreakdowns.length - 5} more breakdown{activeBreakdowns.length - 5 > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="handover-toast__actions">
            <button
              className="handover-toast__btn handover-toast__btn--primary"
              onClick={handleStartHandover}
            >
              🔄 Start Handover
            </button>
            {onViewBreakdowns && (
              <button
                className="handover-toast__btn handover-toast__btn--secondary"
                onClick={() => { setExpanded(false); onViewBreakdowns(); }}
              >
                View All
              </button>
            )}
          </div>

          {/* Note */}
          <div className="handover-toast__note">
            These breakdowns need to be resolved or handed over before your shift ends.
          </div>
        </div>
      )}
    </div>
  );
};

export default HandoverReminderToast;
