/**
 * ShiftReminderSettings Component
 *
 * Phase 4.1 - Settings panel for shift reminder notifications
 *
 * Features:
 * - Enable/disable shift reminders
 * - Select which shifts user works
 * - Configure reminder timing
 * - Test notification button
 * - Permission status display
 */

import React, { useState, useEffect, useCallback } from 'react';
import shiftReminderService, { SHIFTS } from '../services/shiftReminderService';
import './ShiftReminderSettings.css';

const ShiftReminderSettings = () => {
  const [preferences, setPreferences] = useState(shiftReminderService.getPreferences());
  const [permissionStatus, setPermissionStatus] = useState(shiftReminderService.getPermissionStatus());
  const [isSupported, setIsSupported] = useState(shiftReminderService.isSupported());
  const [testResult, setTestResult] = useState(null);
  const [nextShift, setNextShift] = useState(null);

  // Update next shift info
  useEffect(() => {
    const updateNextShift = () => {
      setNextShift(shiftReminderService.getNextShift());
    };

    updateNextShift();
    const interval = setInterval(updateNextShift, 60000);
    return () => clearInterval(interval);
  }, [preferences.shifts]);

  // Handle enabling reminders
  const handleEnableToggle = async () => {
    if (!preferences.enabled && permissionStatus !== 'granted') {
      // Need to request permission first
      const result = await shiftReminderService.requestPermission();
      setPermissionStatus(result.status);

      if (!result.success) {
        setTestResult({ type: 'error', message: result.message });
        setTimeout(() => setTestResult(null), 3000);
        return;
      }
    }

    const newEnabled = !preferences.enabled;
    const newPrefs = { ...preferences, enabled: newEnabled };
    shiftReminderService.savePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  // Handle shift selection
  const handleShiftToggle = (shiftCode) => {
    let newShifts;
    if (preferences.shifts.includes(shiftCode)) {
      newShifts = preferences.shifts.filter(s => s !== shiftCode);
    } else {
      newShifts = [...preferences.shifts, shiftCode];
    }

    const newPrefs = { ...preferences, shifts: newShifts };
    shiftReminderService.savePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  // Handle reminder timing change
  const handleTimingChange = (minutes) => {
    const newPrefs = { ...preferences, reminderMinutes: minutes };
    shiftReminderService.savePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newPrefs = { ...preferences, sound: !preferences.sound };
    shiftReminderService.savePreferences(newPrefs);
    setPreferences(newPrefs);
  };

  // Send test notification
  const handleTestNotification = async () => {
    setTestResult({ type: 'info', message: 'Sending test notification...' });

    const result = await shiftReminderService.sendTestNotification();
    setTestResult({
      type: result.success ? 'success' : 'error',
      message: result.message
    });

    setTimeout(() => setTestResult(null), 3000);
  };

  // Request permission
  const handleRequestPermission = async () => {
    const result = await shiftReminderService.requestPermission();
    setPermissionStatus(result.status);
    setTestResult({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  // Format minutes until shift
  const formatTimeUntil = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  // Get permission status badge
  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <span className="permission-badge granted">✅ Enabled</span>;
      case 'denied':
        return <span className="permission-badge denied">🚫 Blocked</span>;
      case 'default':
        return <span className="permission-badge default">⚠️ Not Set</span>;
      case 'unsupported':
        return <span className="permission-badge unsupported">❌ Not Supported</span>;
      default:
        return null;
    }
  };

  if (!isSupported) {
    return (
      <div className="shift-reminder-settings">
        <div className="settings-header">
          <h3>🔔 Shift Reminders</h3>
        </div>
        <div className="unsupported-message">
          <span className="unsupported-icon">❌</span>
          <p>Your browser does not support push notifications.</p>
          <p className="unsupported-hint">Try using Chrome, Firefox, or Edge for full functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-reminder-settings">
      <div className="settings-header">
        <div className="settings-title">
          <h3>🔔 Shift Reminders</h3>
          {getPermissionBadge()}
        </div>
        <p className="settings-description">
          Get notified before your shift starts so you're ready to go.
        </p>
      </div>

      {/* Permission Warning */}
      {permissionStatus === 'denied' && (
        <div className="permission-warning">
          <span className="warning-icon">⚠️</span>
          <div className="warning-content">
            <strong>Notifications Blocked</strong>
            <p>You'll need to enable notifications in your browser settings to use shift reminders.</p>
          </div>
        </div>
      )}

      {/* Enable Toggle */}
      <div className="settings-section">
        <div className="setting-row toggle-row">
          <div className="setting-info">
            <span className="setting-label">Enable Shift Reminders</span>
            <span className="setting-hint">Receive notifications before your shift starts</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={handleEnableToggle}
              disabled={permissionStatus === 'denied'}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Shift Selection */}
      <div className={`settings-section ${!preferences.enabled ? 'disabled' : ''}`}>
        <h4>Your Shifts</h4>
        <p className="section-hint">Select the shifts you regularly work</p>

        <div className="shift-grid">
          {Object.entries(SHIFTS).map(([code, shift]) => (
            <button
              key={code}
              className={`shift-card ${preferences.shifts.includes(code) ? 'selected' : ''}`}
              onClick={() => handleShiftToggle(code)}
              disabled={!preferences.enabled}
            >
              <span className="shift-icon">{shift.icon}</span>
              <span className="shift-code">Duty {code}</span>
              <span className="shift-name">{shift.name}</span>
              <span className="shift-time">{shift.start} - {shift.end}</span>
              {preferences.shifts.includes(code) && (
                <span className="selected-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder Timing */}
      <div className={`settings-section ${!preferences.enabled ? 'disabled' : ''}`}>
        <h4>Reminder Timing</h4>
        <div className="timing-options">
          {[5, 10, 15, 30, 60].map(minutes => (
            <button
              key={minutes}
              className={`timing-btn ${preferences.reminderMinutes === minutes ? 'active' : ''}`}
              onClick={() => handleTimingChange(minutes)}
              disabled={!preferences.enabled}
            >
              {minutes < 60 ? `${minutes} min` : '1 hour'}
            </button>
          ))}
        </div>
        <p className="section-hint">
          You'll be notified {preferences.reminderMinutes} minutes before your shift starts
        </p>
      </div>

      {/* Sound Toggle */}
      <div className={`settings-section ${!preferences.enabled ? 'disabled' : ''}`}>
        <div className="setting-row toggle-row">
          <div className="setting-info">
            <span className="setting-label">Notification Sound</span>
            <span className="setting-hint">Play a sound with the reminder</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.sound}
              onChange={handleSoundToggle}
              disabled={!preferences.enabled}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Next Shift Info */}
      {preferences.enabled && nextShift && (
        <div className="next-shift-info">
          <span className="next-shift-icon">{nextShift.icon}</span>
          <div className="next-shift-details">
            <strong>Next Shift: {nextShift.name}</strong>
            <span>Starts in {formatTimeUntil(nextShift.minutesUntil)}</span>
          </div>
        </div>
      )}

      {/* Test Button */}
      <div className="settings-actions">
        {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
          <button
            className="action-btn permission-btn"
            onClick={handleRequestPermission}
          >
            🔓 Enable Notifications
          </button>
        )}

        <button
          className="action-btn test-btn"
          onClick={handleTestNotification}
          disabled={permissionStatus !== 'granted'}
        >
          🧪 Send Test Notification
        </button>
      </div>

      {/* Result Message */}
      {testResult && (
        <div className={`result-message ${testResult.type}`}>
          {testResult.type === 'success' ? '✅' : testResult.type === 'error' ? '❌' : 'ℹ️'}
          {testResult.message}
        </div>
      )}
    </div>
  );
};

export default ShiftReminderSettings;
