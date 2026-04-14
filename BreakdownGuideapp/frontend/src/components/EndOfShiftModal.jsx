/**
 * EndOfShiftModal Component
 * Fullscreen modal that appears when shift ends
 *
 * Features:
 * - Progressive warnings (30/15/5 min before end)
 * - Fullscreen takeover at shift end
 * - Options: Extend shift, Start handover, End shift
 * - Shows active breakdown count
 * - Cannot be dismissed without action
 */

import React, { useState, useEffect, useCallback } from 'react';
import './EndOfShiftModal.css';

// Warning thresholds in minutes
const WARNING_THRESHOLDS = [30, 15, 5, 0];

const EndOfShiftModal = ({
  currentDuty,
  activeBreakdowns = 0,
  onExtendShift,
  onStartHandover,
  onEndShift,
  isVisible = false,
  warningLevel = null // 30, 15, 5, or 0
}) => {
  const [countdown, setCountdown] = useState('');
  const [showAcknowledge, setShowAcknowledge] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!currentDuty || currentDuty.viewOnly || !currentDuty.endTime || !isVisible) return;

    const updateCountdown = () => {
      const now = new Date();
      const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);

      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts
      const [startHour] = currentDuty.startTime.split(':').map(Number);
      if (endHour < startHour) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const remaining = endTime - now;
      const remainingMinutes = Math.floor(remaining / (1000 * 60));
      const remainingSecs = Math.floor((remaining % (1000 * 60)) / 1000);

      if (remaining <= 0) {
        const overtime = Math.abs(remainingMinutes);
        setCountdown(`${overtime}+ minutes overtime`);
      } else if (remainingMinutes < 1) {
        setCountdown(`${remainingSecs} seconds`);
      } else {
        setCountdown(`${remainingMinutes} min ${remainingSecs}s`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentDuty, isVisible]);

  // Reset acknowledged when warning level changes
  useEffect(() => {
    if (warningLevel !== 0) {
      setAcknowledged(false);
    }
  }, [warningLevel]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    // For non-zero warnings, allow dismissal after acknowledgment
    if (warningLevel !== 0) {
      setTimeout(() => {
        setShowAcknowledge(false);
      }, 300);
    }
  };

  if (!isVisible || !currentDuty) return null;

  // Determine severity and messaging
  const isUrgent = warningLevel <= 5;
  const isShiftEnded = warningLevel === 0;
  const hasActiveBreakdowns = activeBreakdowns > 0;

  const getWarningTitle = () => {
    switch (warningLevel) {
      case 30:
        return '30 Minutes Remaining';
      case 15:
        return '15 Minutes Remaining';
      case 5:
        return '5 Minutes Remaining!';
      case 0:
        return 'Shift Has Ended';
      default:
        return 'Shift Warning';
    }
  };

  const getWarningIcon = () => {
    switch (warningLevel) {
      case 30:
        return '⏰';
      case 15:
        return '⚠️';
      case 5:
        return '🚨';
      case 0:
        return '🛑';
      default:
        return '⏰';
    }
  };

  const getWarningMessage = () => {
    if (isShiftEnded) {
      if (hasActiveBreakdowns) {
        return `Your shift has ended. You have ${activeBreakdowns} active breakdown${activeBreakdowns > 1 ? 's' : ''} that need attention.`;
      }
      return 'Your shift has ended. Please complete any remaining tasks and hand over or end your shift.';
    }

    if (warningLevel === 5) {
      return hasActiveBreakdowns
        ? `Only 5 minutes left! Please wrap up your ${activeBreakdowns} active breakdown${activeBreakdowns > 1 ? 's' : ''}.`
        : 'Only 5 minutes left! Please complete any urgent tasks.';
    }

    if (warningLevel === 15) {
      return hasActiveBreakdowns
        ? `15 minutes remaining. You have ${activeBreakdowns} active breakdown${activeBreakdowns > 1 ? 's' : ''} to address.`
        : '15 minutes remaining. Consider wrapping up current tasks.';
    }

    return hasActiveBreakdowns
      ? `30 minutes remaining. You have ${activeBreakdowns} active breakdown${activeBreakdowns > 1 ? 's' : ''}.`
      : '30 minutes remaining in your shift.';
  };

  // For pre-warnings (30/15/5), show dismissible notification
  // For shift end (0), show fullscreen modal that requires action
  if (warningLevel !== 0 && (acknowledged || !isVisible)) {
    return null;
  }

  return (
    <div className={`end-of-shift-modal ${isUrgent ? 'urgent' : ''} ${isShiftEnded ? 'ended' : ''}`}>
      <div className="end-of-shift-modal__backdrop" role="presentation" />

      <div className="end-of-shift-modal__container" role="alertdialog" aria-modal="true" aria-labelledby="eos-title" aria-describedby="eos-countdown">
        <div className="end-of-shift-modal__card">
          {/* Header */}
          <div className="end-of-shift-modal__header">
            <span className="end-of-shift-modal__icon" aria-hidden="true">{getWarningIcon()}</span>
            <h2 className="end-of-shift-modal__title" id="eos-title">{getWarningTitle()}</h2>
          </div>

          {/* Countdown */}
          <div className="end-of-shift-modal__countdown" id="eos-countdown" aria-live="polite" aria-atomic="true">
            <span className="end-of-shift-modal__countdown-label">
              {isShiftEnded ? 'Overtime' : 'Time Remaining'}
            </span>
            <span className="end-of-shift-modal__countdown-value">{countdown}</span>
          </div>

          {/* Message */}
          <p className="end-of-shift-modal__message">{getWarningMessage()}</p>

          {/* Active Breakdowns Alert */}
          {hasActiveBreakdowns && (
            <div className="end-of-shift-modal__breakdowns-alert">
              <span className="end-of-shift-modal__breakdowns-icon">🚌</span>
              <div className="end-of-shift-modal__breakdowns-info">
                <strong>{activeBreakdowns} Active Breakdown{activeBreakdowns > 1 ? 's' : ''}</strong>
                <span>These need to be resolved or handed over</span>
              </div>
            </div>
          )}

          {/* Duty Info */}
          <div className="end-of-shift-modal__duty-info">
            <span>Duty {currentDuty.code}</span>
            <span className="end-of-shift-modal__duty-separator">•</span>
            <span>{currentDuty.startTime} - {currentDuty.endTime}</span>
          </div>

          {/* Actions */}
          <div className="end-of-shift-modal__actions">
            {isShiftEnded ? (
              <>
                {/* Fullscreen actions - must take action */}
                {hasActiveBreakdowns && onStartHandover && (
                  <button
                    className="end-of-shift-modal__btn end-of-shift-modal__btn--handover"
                    onClick={onStartHandover}
                  >
                    🔄 Start Handover
                  </button>
                )}

                {onExtendShift && (
                  <button
                    className="end-of-shift-modal__btn end-of-shift-modal__btn--extend"
                    onClick={onExtendShift}
                  >
                    ➕ Extend 30 Minutes
                  </button>
                )}

                <button
                  className="end-of-shift-modal__btn end-of-shift-modal__btn--end"
                  onClick={onEndShift}
                >
                  🚪 End Shift
                </button>
              </>
            ) : (
              <>
                {/* Pre-warning - can acknowledge and continue */}
                <button
                  className="end-of-shift-modal__btn end-of-shift-modal__btn--acknowledge"
                  onClick={handleAcknowledge}
                >
                  ✓ Got it, continue working
                </button>

                {isUrgent && hasActiveBreakdowns && onStartHandover && (
                  <button
                    className="end-of-shift-modal__btn end-of-shift-modal__btn--handover-secondary"
                    onClick={onStartHandover}
                  >
                    🔄 Start Handover Now
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer note for fullscreen */}
          {isShiftEnded && (
            <p className="end-of-shift-modal__footer-note">
              You must take an action to continue. Working overtime should be recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndOfShiftModal;
