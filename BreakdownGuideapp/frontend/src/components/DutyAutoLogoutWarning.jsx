/**
 * Duty Auto-Logout Warning Component
 * Shows 15 minutes before duty ends with automatic logout countdown
 *
 * Features:
 * - Cannot be dismissed (stays on screen until action taken)
 * - Shows exact logout time
 * - Options: "Ask for Extension" or "Logout Now"
 * - Browser notification support
 * - Automatic logout when time expires
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './DutyAutoLogoutWarning.css';

const DutyAutoLogoutWarning = ({ currentDuty, onExtensionRequest }) => {
  const { logout } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!currentDuty || currentDuty.viewOnly || !currentDuty.endTime) return;

    const checkWarning = () => {
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

      // Show warning if 15 minutes or less remaining
      if (diffMinutes <= 15 && diffMinutes > 0) {
        setIsVisible(true);

        const mins = diffMinutes;
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

        setTimeRemaining(`${mins}:${String(secs).padStart(2, '0')}`);

        // Send browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted' && diffMinutes === 15) {
          new Notification('Shift Ending Soon', {
            body: 'Your shift ends in 15 minutes. You will be logged out automatically.',
            icon: '/favicon.ico',
            requireInteraction: true
          });
        }
      } else if (diffMinutes <= 0) {
        // Time expired - auto logout
        handleAutoLogout();
      } else {
        setIsVisible(false);
      }
    };

    checkWarning();
    const timer = setInterval(checkWarning, 1000); // Check every second

    return () => clearInterval(timer);
  }, [currentDuty]);

  const handleAutoLogout = async () => {
    console.log('⏰ Duty time expired - automatic logout');
    await logout();
    window.location.href = '/';
  };

  const handleLogoutNow = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleExtension = () => {
    if (onExtensionRequest) {
      onExtensionRequest();
    }
  };

  if (!isVisible) return null;

  const [endHour, endMin] = currentDuty.endTime.split(':');
  const endTimeDisplay = `${endHour}:${endMin}`;

  return (
    <div className="duty-auto-logout-warning">
      <div className="warning-container">
        <div className="warning-icon">⏰</div>
        <div className="warning-content">
          <h3 className="warning-title">Shift Ending Soon</h3>
          <p className="warning-message">
            Your shift ends at <strong>{endTimeDisplay}</strong>.
            You will be logged out automatically in <strong>{timeRemaining}</strong>.
          </p>
        </div>
        <div className="warning-actions">
          <button
            className="btn-extension"
            onClick={handleExtension}
            title="Request shift extension"
          >
            🕐 Ask for Extension
          </button>
          <button
            className="btn-logout-now"
            onClick={handleLogoutNow}
            title="Logout immediately"
          >
            🚪 Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DutyAutoLogoutWarning;
