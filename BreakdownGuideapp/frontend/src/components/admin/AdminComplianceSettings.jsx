/**
 * AdminComplianceSettings Component
 * Phase 9.1: Mandatory Duty Selection & Compliance Configuration
 *
 * Features:
 * - Toggle mandatory duty selection
 * - Configure session timeout settings
 * - View current compliance status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api-client.js';
import './AdminComplianceSettings.css';

const AdminComplianceSettings = () => {
    const [settings, setSettings] = useState({
        mandatoryDutySelection: false,
        gracePeriodMinutes: 5,
        sessionTimeoutMinutes: 480,
        sessionTimeoutWarningMinutes: 30
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSettings, setOriginalSettings] = useState(null);

    // Fetch current settings
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get('/api/settings/compliance/status');

            if (response.success) {
                const { compliance } = response;
                setSettings({
                    mandatoryDutySelection: compliance.mandatoryDutySelection,
                    gracePeriodMinutes: compliance.gracePeriodMinutes,
                    sessionTimeoutMinutes: compliance.sessionTimeoutMinutes,
                    sessionTimeoutWarningMinutes: compliance.sessionTimeoutWarningMinutes
                });
                setOriginalSettings({
                    mandatoryDutySelection: compliance.mandatoryDutySelection,
                    gracePeriodMinutes: compliance.gracePeriodMinutes,
                    sessionTimeoutMinutes: compliance.sessionTimeoutMinutes,
                    sessionTimeoutWarningMinutes: compliance.sessionTimeoutWarningMinutes
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load compliance settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Check for changes
    useEffect(() => {
        if (originalSettings) {
            const changed =
                settings.mandatoryDutySelection !== originalSettings.mandatoryDutySelection ||
                settings.gracePeriodMinutes !== originalSettings.gracePeriodMinutes ||
                settings.sessionTimeoutMinutes !== originalSettings.sessionTimeoutMinutes ||
                settings.sessionTimeoutWarningMinutes !== originalSettings.sessionTimeoutWarningMinutes;
            setHasChanges(changed);
        }
    }, [settings, originalSettings]);

    // Handle setting changes
    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        setSuccess(null);
    };

    const handleNumberChange = (key, value) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setSettings(prev => ({
                ...prev,
                [key]: numValue
            }));
            setSuccess(null);
        }
    };

    // Save settings
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            // Update each setting
            const updates = [
                { key: 'mandatory_duty_selection', value: String(settings.mandatoryDutySelection) },
                { key: 'duty_selection_grace_period_minutes', value: String(settings.gracePeriodMinutes) },
                { key: 'session_timeout_minutes', value: String(settings.sessionTimeoutMinutes) },
                { key: 'session_timeout_warning_minutes', value: String(settings.sessionTimeoutWarningMinutes) }
            ];

            for (const update of updates) {
                await apiClient.put(`/api/settings/${update.key}`, { value: update.value });
            }

            setOriginalSettings({ ...settings });
            setHasChanges(false);
            setSuccess('Compliance settings saved successfully');

        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Reset to original
    const handleReset = () => {
        if (originalSettings) {
            setSettings({ ...originalSettings });
            setSuccess(null);
        }
    };

    if (loading) {
        return (
            <div className="compliance-settings">
                <div className="compliance-settings__loading">
                    <span className="compliance-settings__loading-icon">...</span>
                    <p>Loading compliance settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="compliance-settings">
            <div className="compliance-settings__header">
                <div className="compliance-settings__header-content">
                    <span className="compliance-settings__icon">&#x1F512;</span>
                    <div>
                        <h2 className="compliance-settings__title">Compliance Settings</h2>
                        <p className="compliance-settings__subtitle">
                            Configure duty requirements and session policies
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="compliance-settings__alert compliance-settings__alert--error">
                    <span>&#x26A0;&#xFE0F;</span> {error}
                </div>
            )}

            {success && (
                <div className="compliance-settings__alert compliance-settings__alert--success">
                    <span>&#x2705;</span> {success}
                </div>
            )}

            <div className="compliance-settings__content">
                {/* Mandatory Duty Selection */}
                <div className="compliance-settings__section">
                    <div className="compliance-settings__section-header">
                        <span className="compliance-settings__section-icon">&#x1F4CB;</span>
                        <h3>Duty Selection Requirements</h3>
                    </div>

                    <div className="compliance-settings__setting">
                        <div className="compliance-settings__setting-info">
                            <label className="compliance-settings__label">
                                Mandatory Duty Selection
                            </label>
                            <p className="compliance-settings__description">
                                When enabled, supervisors must select a duty shift before accessing the app.
                                View-only access is still allowed for managers and admins.
                            </p>
                        </div>
                        <button
                            className={`compliance-settings__toggle ${settings.mandatoryDutySelection ? 'compliance-settings__toggle--on' : ''}`}
                            onClick={() => handleToggle('mandatoryDutySelection')}
                            disabled={saving}
                        >
                            <span className="compliance-settings__toggle-slider"></span>
                            <span className="compliance-settings__toggle-label">
                                {settings.mandatoryDutySelection ? 'Required' : 'Optional'}
                            </span>
                        </button>
                    </div>

                    <div className="compliance-settings__setting">
                        <div className="compliance-settings__setting-info">
                            <label className="compliance-settings__label">
                                Grace Period (minutes)
                            </label>
                            <p className="compliance-settings__description">
                                Time allowed after login before duty selection is enforced.
                            </p>
                        </div>
                        <div className="compliance-settings__input-group">
                            <input
                                type="number"
                                className="compliance-settings__input"
                                value={settings.gracePeriodMinutes}
                                onChange={(e) => handleNumberChange('gracePeriodMinutes', e.target.value)}
                                min="0"
                                max="60"
                                disabled={saving || !settings.mandatoryDutySelection}
                            />
                            <span className="compliance-settings__input-suffix">min</span>
                        </div>
                    </div>
                </div>

                {/* Session Timeout */}
                <div className="compliance-settings__section">
                    <div className="compliance-settings__section-header">
                        <span className="compliance-settings__section-icon">&#x23F0;</span>
                        <h3>Session Timeout</h3>
                    </div>

                    <div className="compliance-settings__setting">
                        <div className="compliance-settings__setting-info">
                            <label className="compliance-settings__label">
                                Session Duration (minutes)
                            </label>
                            <p className="compliance-settings__description">
                                Maximum session length before automatic logout. Default is 8 hours (480 minutes).
                            </p>
                        </div>
                        <div className="compliance-settings__input-group">
                            <input
                                type="number"
                                className="compliance-settings__input"
                                value={settings.sessionTimeoutMinutes}
                                onChange={(e) => handleNumberChange('sessionTimeoutMinutes', e.target.value)}
                                min="30"
                                max="1440"
                                disabled={saving}
                            />
                            <span className="compliance-settings__input-suffix">min</span>
                        </div>
                    </div>

                    <div className="compliance-settings__setting">
                        <div className="compliance-settings__setting-info">
                            <label className="compliance-settings__label">
                                Warning Before Timeout (minutes)
                            </label>
                            <p className="compliance-settings__description">
                                How early to warn users about session expiring.
                            </p>
                        </div>
                        <div className="compliance-settings__input-group">
                            <input
                                type="number"
                                className="compliance-settings__input"
                                value={settings.sessionTimeoutWarningMinutes}
                                onChange={(e) => handleNumberChange('sessionTimeoutWarningMinutes', e.target.value)}
                                min="5"
                                max="120"
                                disabled={saving}
                            />
                            <span className="compliance-settings__input-suffix">min</span>
                        </div>
                    </div>
                </div>

                {/* Current Status */}
                <div className="compliance-settings__status">
                    <h4>Current Status</h4>
                    <div className="compliance-settings__status-grid">
                        <div className="compliance-settings__status-item">
                            <span className="compliance-settings__status-label">Duty Selection</span>
                            <span className={`compliance-settings__status-value ${settings.mandatoryDutySelection ? 'compliance-settings__status-value--required' : ''}`}>
                                {settings.mandatoryDutySelection ? 'Required' : 'Optional'}
                            </span>
                        </div>
                        <div className="compliance-settings__status-item">
                            <span className="compliance-settings__status-label">Session Length</span>
                            <span className="compliance-settings__status-value">
                                {Math.floor(settings.sessionTimeoutMinutes / 60)}h {settings.sessionTimeoutMinutes % 60}m
                            </span>
                        </div>
                        <div className="compliance-settings__status-item">
                            <span className="compliance-settings__status-label">Warning Time</span>
                            <span className="compliance-settings__status-value">
                                {settings.sessionTimeoutWarningMinutes} minutes before
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="compliance-settings__actions">
                <button
                    className="compliance-settings__btn compliance-settings__btn--secondary"
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                >
                    Reset Changes
                </button>
                <button
                    className="compliance-settings__btn compliance-settings__btn--primary"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {hasChanges && (
                <div className="compliance-settings__unsaved">
                    <span>&#x26A0;&#xFE0F;</span> You have unsaved changes
                </div>
            )}
        </div>
    );
};

export default AdminComplianceSettings;
