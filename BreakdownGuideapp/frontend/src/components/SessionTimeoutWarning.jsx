/**
 * SessionTimeoutWarning Component
 * Phase 9.3: Alert if session expires before shift ends
 *
 * Features:
 * - Monitors session expiry vs shift end time
 * - Shows warning when session will expire during shift
 * - Auto-extend option
 * - Re-authentication prompt if needed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiClient } from '../services/api-client.js';
import './SessionTimeoutWarning.css';

const SessionTimeoutWarning = () => {
    const { currentUser, refreshSession } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [extending, setExtending] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [complianceSettings, setComplianceSettings] = useState({
        sessionTimeoutMinutes: 480,
        sessionTimeoutWarningMinutes: 30
    });

    // Fetch compliance settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await apiClient.get('/api/settings/compliance/status');
                if (response.success && response.compliance) {
                    setComplianceSettings({
                        sessionTimeoutMinutes: response.compliance.sessionTimeoutMinutes || 480,
                        sessionTimeoutWarningMinutes: response.compliance.sessionTimeoutWarningMinutes || 30
                    });
                }
            } catch (error) {
                console.warn('Could not fetch compliance settings for session timeout');
            }
        };
        fetchSettings();
    }, []);

    // Check session status
    const checkSessionStatus = useCallback(() => {
        if (!currentUser || dismissed) return;

        // Get current duty from session storage
        const dutyStr = sessionStorage.getItem('currentDuty');
        if (!dutyStr) return;

        try {
            const duty = JSON.parse(dutyStr);
            if (!duty.shiftEnd) return;

            // Calculate session expiry (login time + timeout)
            const loginTime = sessionStorage.getItem('loginTime');
            if (!loginTime) return;

            const sessionStart = new Date(loginTime);
            const sessionEnd = new Date(sessionStart.getTime() + complianceSettings.sessionTimeoutMinutes * 60000);
            const shiftEnd = new Date(duty.shiftEnd);
            const warningThreshold = complianceSettings.sessionTimeoutWarningMinutes * 60000;

            const now = new Date();
            const timeUntilSessionExpiry = sessionEnd - now;
            const timeUntilShiftEnd = shiftEnd - now;

            // Check if session will expire before shift ends
            const sessionExpiresBeforeShift = sessionEnd < shiftEnd;

            // Check if we're within warning threshold
            const withinWarningThreshold = timeUntilSessionExpiry < warningThreshold && timeUntilSessionExpiry > 0;

            // Calculate remaining times
            const sessionMinutesRemaining = Math.max(0, Math.floor(timeUntilSessionExpiry / 60000));
            const shiftMinutesRemaining = Math.max(0, Math.floor(timeUntilShiftEnd / 60000));

            setSessionInfo({
                sessionEnd,
                shiftEnd,
                sessionMinutesRemaining,
                shiftMinutesRemaining,
                sessionExpiresBeforeShift,
                dutyCode: duty.code,
                dutyName: duty.name
            });

            // Show warning if session expires before shift and within threshold
            if (sessionExpiresBeforeShift && withinWarningThreshold) {
                setShowWarning(true);
            }
        } catch (error) {
            console.error('Error checking session status:', error);
        }
    }, [currentUser, dismissed, complianceSettings]);

    // Check session status every minute
    useEffect(() => {
        if (!currentUser) return;

        // Store login time if not already stored
        if (!sessionStorage.getItem('loginTime')) {
            sessionStorage.setItem('loginTime', new Date().toISOString());
        }

        checkSessionStatus();
        const interval = setInterval(checkSessionStatus, 60000);

        return () => clearInterval(interval);
    }, [currentUser, checkSessionStatus]);

    // Handle session extension
    const handleExtendSession = async () => {
        setExtending(true);
        try {
            // Refresh the session token
            if (refreshSession) {
                await refreshSession();
            }

            // Update login time to reset session
            sessionStorage.setItem('loginTime', new Date().toISOString());

            setShowWarning(false);
            setDismissed(false);

            console.log('Session extended successfully');
        } catch (error) {
            console.error('Failed to extend session:', error);
            alert('Failed to extend session. You may need to log in again.');
        } finally {
            setExtending(false);
        }
    };

    // Handle dismiss
    const handleDismiss = () => {
        setShowWarning(false);
        setDismissed(true);

        // Reset dismissed after 5 minutes (will warn again)
        setTimeout(() => {
            setDismissed(false);
        }, 5 * 60000);
    };

    // Don't render if no warning needed
    if (!showWarning || !sessionInfo) return null;

    return (
        <div className="session-timeout-overlay" role="presentation">
            <div className="session-timeout-modal" role="alertdialog" aria-modal="true" aria-labelledby="session-timeout-title" aria-describedby="session-timeout-desc">
                <div className="session-timeout__header">
                    <span className="session-timeout__icon" aria-hidden="true">&#x23F0;</span>
                    <div>
                        <h2 className="session-timeout__title" id="session-timeout-title">Session Expiring Soon</h2>
                        <p className="session-timeout__subtitle" id="session-timeout-desc">
                            Your session will end before your shift finishes
                        </p>
                    </div>
                </div>

                <div className="session-timeout__content">
                    <div className="session-timeout__info-grid">
                        <div className="session-timeout__info-card">
                            <span className="session-timeout__info-icon">&#x1F4BB;</span>
                            <div className="session-timeout__info-content">
                                <span className="session-timeout__info-label">Session Expires In</span>
                                <span className="session-timeout__info-value session-timeout__info-value--warning">
                                    {sessionInfo.sessionMinutesRemaining} minutes
                                </span>
                            </div>
                        </div>

                        <div className="session-timeout__info-card">
                            <span className="session-timeout__info-icon">&#x1F3F7;</span>
                            <div className="session-timeout__info-content">
                                <span className="session-timeout__info-label">Shift Ends In</span>
                                <span className="session-timeout__info-value">
                                    {sessionInfo.shiftMinutesRemaining > 60
                                        ? `${Math.floor(sessionInfo.shiftMinutesRemaining / 60)}h ${sessionInfo.shiftMinutesRemaining % 60}m`
                                        : `${sessionInfo.shiftMinutesRemaining} minutes`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {sessionInfo.dutyCode && (
                        <div className="session-timeout__duty">
                            <span className="session-timeout__duty-label">Current Duty:</span>
                            <span className="session-timeout__duty-value">
                                Duty {sessionInfo.dutyCode} ({sessionInfo.dutyName})
                            </span>
                        </div>
                    )}

                    <div className="session-timeout__warning-box">
                        <span>&#x26A0;&#xFE0F;</span>
                        <p>
                            If your session expires, you will be logged out and any unsaved work may be lost.
                            Extend your session to continue working through your shift.
                        </p>
                    </div>
                </div>

                <div className="session-timeout__actions">
                    <button
                        className="session-timeout__btn session-timeout__btn--secondary"
                        onClick={handleDismiss}
                        disabled={extending}
                    >
                        Remind Me Later
                    </button>
                    <button
                        className="session-timeout__btn session-timeout__btn--primary"
                        onClick={handleExtendSession}
                        disabled={extending}
                    >
                        {extending ? (
                            <>
                                <span className="session-timeout__spinner"></span>
                                Extending...
                            </>
                        ) : (
                            <>
                                <span>&#x1F504;</span>
                                Extend Session
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutWarning;
