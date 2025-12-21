/**
 * DutyAwareNotificationSettings Component
 * Phase 7.5: Settings for duty-aware notification behavior
 *
 * Features:
 * - Enable/disable duty-aware notifications
 * - Emergency override toggle
 * - Current duty status display
 * - Test notification button
 */

import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService.js';
import './DutyAwareNotificationSettings.css';

const DutyAwareNotificationSettings = () => {
  const [settings, setSettings] = useState({
    dutyAwareEnabled: true,
    emergencyOverrideEnabled: true,
    isOnDuty: false
  });
  const [testSending, setTestSending] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = notificationService.getSettings();
    setSettings(loadedSettings);

    // Update on-duty status every minute
    const interval = setInterval(() => {
      setSettings(prev => ({
        ...prev,
        isOnDuty: notificationService.isOnDuty()
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Toggle duty-aware mode
  const handleDutyAwareToggle = () => {
    const newValue = !settings.dutyAwareEnabled;
    notificationService.setDutyAwareEnabled(newValue);
    setSettings(prev => ({
      ...prev,
      dutyAwareEnabled: newValue
    }));
  };

  // Toggle emergency override
  const handleEmergencyOverrideToggle = () => {
    const newValue = !settings.emergencyOverrideEnabled;
    notificationService.setEmergencyOverrideEnabled(newValue);
    setSettings(prev => ({
      ...prev,
      emergencyOverrideEnabled: newValue
    }));
  };

  // Send test notification
  const handleTestNotification = () => {
    setTestSending(true);

    notificationService.sendBrowserNotification(
      'Test Notification',
      {
        body: 'This is a test notification from Go BARRY',
        tag: 'test-notification',
        isEmergency: false
      }
    );

    setTimeout(() => {
      setTestSending(false);
    }, 2000);
  };

  // Send test emergency notification
  const handleTestEmergency = () => {
    setTestSending(true);

    notificationService.sendBrowserNotification(
      'Emergency Test',
      {
        body: 'This is an emergency test notification (bypasses duty check)',
        tag: 'test-emergency',
        isEmergency: true
      }
    );

    setTimeout(() => {
      setTestSending(false);
    }, 2000);
  };

  // Get current duty info
  const getDutyInfo = () => {
    try {
      const stored = sessionStorage.getItem('currentDuty');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  };

  const dutyInfo = getDutyInfo();

  return (
    <div className="duty-aware-settings">
      <div className="duty-aware-settings__header">
        <span className="duty-aware-settings__icon">&#x1F514;</span>
        <div>
          <h3 className="duty-aware-settings__title">Duty-Aware Notifications</h3>
          <p className="duty-aware-settings__subtitle">
            Control when notifications are sent based on your duty status
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="duty-aware-settings__status">
        <div className={`duty-status-indicator ${settings.isOnDuty ? 'on-duty' : 'off-duty'}`}>
          <span className="duty-status-indicator__icon">
            {settings.isOnDuty ? '&#x2705;' : '&#x26D4;'}
          </span>
          <div className="duty-status-indicator__text">
            <span className="duty-status-indicator__label">Current Status</span>
            <span className="duty-status-indicator__value">
              {settings.isOnDuty ? 'On Duty' : 'Off Duty'}
            </span>
          </div>
        </div>

        {dutyInfo && (
          <div className="duty-status-indicator duty-info">
            <span className="duty-status-indicator__icon">&#x1F4CB;</span>
            <div className="duty-status-indicator__text">
              <span className="duty-status-indicator__label">Current Duty</span>
              <span className="duty-status-indicator__value">
                Duty {dutyInfo.code} ({dutyInfo.name})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Toggles */}
      <div className="duty-aware-settings__options">
        {/* Duty-Aware Toggle */}
        <div className="duty-aware-settings__option">
          <div className="option-info">
            <div className="option-header">
              <span className="option-icon">&#x1F551;</span>
              <span className="option-title">Duty-Aware Mode</span>
            </div>
            <p className="option-description">
              Only show notifications during your active shift. Reduces off-duty spam.
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.dutyAwareEnabled}
              onChange={handleDutyAwareToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Emergency Override Toggle */}
        <div className={`duty-aware-settings__option ${!settings.dutyAwareEnabled ? 'disabled' : ''}`}>
          <div className="option-info">
            <div className="option-header">
              <span className="option-icon">&#x1F6A8;</span>
              <span className="option-title">Emergency Override</span>
            </div>
            <p className="option-description">
              Always receive critical/emergency notifications, even when off duty.
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.emergencyOverrideEnabled}
              onChange={handleEmergencyOverrideToggle}
              disabled={!settings.dutyAwareEnabled}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="duty-aware-settings__info-box">
        <span className="info-icon">&#x1F4A1;</span>
        <div className="info-content">
          <strong>How it works:</strong>
          <ul>
            <li>When duty-aware mode is on, notifications are only shown during your shift hours</li>
            <li>Emergency override ensures you never miss critical breakdowns</li>
            <li>Your duty is detected from the shift you selected at login</li>
          </ul>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="duty-aware-settings__tests">
        <h4>Test Notifications</h4>
        <div className="test-buttons">
          <button
            className="test-button test-button--normal"
            onClick={handleTestNotification}
            disabled={testSending}
          >
            {testSending ? '...' : '&#x1F514;'} Send Test
          </button>
          <button
            className="test-button test-button--emergency"
            onClick={handleTestEmergency}
            disabled={testSending}
          >
            {testSending ? '...' : '&#x1F6A8;'} Test Emergency
          </button>
        </div>
        <p className="test-description">
          {settings.dutyAwareEnabled && !settings.isOnDuty
            ? 'Normal test may be suppressed (you are off duty). Emergency test should always appear.'
            : 'Both tests should appear as notifications.'}
        </p>
      </div>
    </div>
  );
};

export default DutyAwareNotificationSettings;
