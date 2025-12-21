/**
 * Comprehensive Duty Selection Modal
 * Two-step process: Selection → Confirmation
 * Features: Smart recommendations, time-based logic, duty locking, admin override
 */

import React, { useState, useEffect } from 'react';
import './DutySelectionModal.css';

// Duty shift definitions - Go North East Standard Shifts
const DUTY_SHIFTS = [
    {
        code: '100',
        name: 'Early Shift',
        icon: '🌅',
        startTime: '06:00',
        endTime: '15:30',
        duration: '9h 30m',
        gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
        color: '#3B82F6',
        description: 'Morning operations coverage',
        tasks: ['Morning vehicle checks', 'Peak hour support', 'School run coverage']
    },
    {
        code: '200',
        name: 'Day Shift',
        icon: '☀️',
        startTime: '07:30',
        endTime: '17:00',
        duration: '9h 30m',
        gradient: 'linear-gradient(135deg, #10B981, #34D399)',
        color: '#10B981',
        description: 'Core day operations',
        tasks: ['Standard operations', 'Midday changeovers', 'Service monitoring']
    },
    {
        code: '400',
        name: 'Late Shift',
        icon: '🌆',
        startTime: '12:30',
        endTime: '22:00',
        duration: '9h 30m',
        gradient: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
        color: '#F59E0B',
        description: 'Afternoon to evening coverage',
        tasks: ['Evening peak support', 'Late service monitoring', 'Night prep']
    },
    {
        code: '500',
        name: 'Night Shift',
        icon: '🌙',
        startTime: '14:45',
        endTime: '00:15',
        duration: '9h 30m',
        gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
        color: '#8B5CF6',
        description: 'Evening to midnight operations',
        tasks: ['Night service coverage', 'Last bus monitoring', 'Start of Service report at 00:00']
    }
];

const DutySelectionModal = ({ onDutySelected, currentUser, onClose }) => {
    const [step, setStep] = useState('selection'); // 'selection' or 'confirmation'
    const [selectedDuty, setSelectedDuty] = useState(null);
    const [showAdminOverride, setShowAdminOverride] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [notificationPermission, setNotificationPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [complianceSettings, setComplianceSettings] = useState({
        mandatoryDutySelection: false,
        gracePeriodMinutes: 5
    });

    const isAdmin = currentUser?.role === 'admin';
    const isManager = currentUser?.role === 'manager';

    // Fetch compliance settings on mount
    useEffect(() => {
        const fetchComplianceSettings = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
                const response = await fetch(`${apiUrl}/api/settings/compliance/status`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.compliance) {
                        setComplianceSettings(data.compliance);
                    }
                }
            } catch (error) {
                console.warn('Could not fetch compliance settings, using defaults');
            }
        };
        fetchComplianceSettings();
    }, []);

    // Check if skip option should be shown
    // Skip is allowed if: mandatory is disabled, OR user is admin/manager
    const canSkipDutySelection = !complianceSettings.mandatoryDutySelection || isAdmin || isManager;

    // Check for existing locked duty
    useEffect(() => {
        const existingDuty = sessionStorage.getItem('currentDuty');
        if (existingDuty) {
            try {
                const duty = JSON.parse(existingDuty);
                if (duty.locked && !isAdmin) {
                    // Non-admin cannot change locked duty
                    console.log('⚠️ Duty already locked, cannot change');
                    // Auto-select and close
                    onDutySelected(duty);
                }
            } catch (error) {
                console.error('Error parsing existing duty:', error);
            }
        }
    }, [isAdmin, onDutySelected]);

    // Get recommended duties based on current time
    const getRecommendedDuties = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        const recommendations = [];

        DUTY_SHIFTS.forEach(duty => {
            const [startHour, startMin] = duty.startTime.split(':').map(Number);
            const [endHour, endMin] = duty.endTime.split(':').map(Number);

            let isActive = false;
            let isUpcoming = false;

            // Handle overnight shifts
            if (startHour > endHour) {
                // Overnight shift (e.g., 22:00 - 06:00)
                isActive = currentHour >= startHour || currentHour < endHour;
                isUpcoming = (currentHour === startHour - 1) ||
                            (startHour === 0 && currentHour === 23);
            } else {
                // Normal shift
                isActive = (currentHour > startHour || (currentHour === startHour && currentMinutes >= startMin)) &&
                          (currentHour < endHour || (currentHour === endHour && currentMinutes < endMin));
                isUpcoming = currentHour === startHour - 1 && currentMinutes >= 30;
            }

            if (isActive || isUpcoming) {
                recommendations.push({
                    ...duty,
                    isActive,
                    isUpcoming,
                    priority: isActive ? 1 : 2
                });
            }
        });

        // Sort by priority and return top 2
        return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 2);
    };

    const recommendedDuties = getRecommendedDuties();

    // Calculate time remaining if joining mid-shift
    const getTimeRemaining = (duty) => {
        const now = new Date();
        const [endHour, endMin] = duty.endTime.split(':').map(Number);

        const endTime = new Date();
        endTime.setHours(endHour, endMin, 0, 0);

        // Handle overnight shifts
        if (endTime < now) {
            endTime.setDate(endTime.getDate() + 1);
        }

        const diffMs = endTime - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours}h ${diffMins}m remaining`;
        } else if (diffMins > 0) {
            return `${diffMins} minutes remaining`;
        } else {
            return 'Ending soon';
        }
    };

    const handleDutySelect = (duty) => {
        setSelectedDuty(duty);
        setStep('confirmation');
    };

    const handleConfirm = async () => {
        // Request notification permissions if not granted
        if (notificationPermission === 'default' && typeof Notification !== 'undefined') {
            try {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }

        // Calculate shift end time based on duty end time
        const now = new Date();
        const [endHour, endMin] = selectedDuty.endTime.split(':').map(Number);
        const shiftEnd = new Date();
        shiftEnd.setHours(endHour, endMin, 0, 0);

        // Handle overnight shifts (e.g., Night Shift ending after midnight)
        if (shiftEnd < now) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        // Create duty object with lock and shift expiration
        const dutyData = {
            ...selectedDuty,
            locked: true,
            lockedAt: new Date().toISOString(),
            lockedBy: currentUser?.email || 'unknown',
            shiftEnd: shiftEnd.toISOString(), // CRITICAL: Expiration time
            notifications: {
                thirtyMinWarning: true,
                tenMinWarning: true,
                midnightReminder: selectedDuty.code === '500'
            }
        };

        // Call backend to set duty and log to activity feed
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
            const response = await fetch(`${apiUrl}/api/auth/set-duty`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ duty: selectedDuty.code })
            });

            if (!response.ok) {
                console.warn('⚠️ Failed to set duty on backend, continuing with local storage');
            } else {
                console.log('✅ Duty set on backend successfully');
            }
        } catch (error) {
            console.error('❌ Error calling set-duty endpoint:', error);
            // Continue anyway - duty will be stored locally
        }

        // Store in sessionStorage
        sessionStorage.setItem('currentDuty', JSON.stringify(dutyData));
        sessionStorage.removeItem('showDutyModal');

        console.log('✅ Duty confirmed and locked until:', shiftEnd.toLocaleString());
        console.log('   Duty data:', dutyData);

        // Call parent callback
        onDutySelected(dutyData);
    };

    const handleAdminOverride = () => {
        if (!overrideReason.trim()) {
            alert('Please provide a reason for changing the duty');
            return;
        }

        // Clear existing duty
        sessionStorage.removeItem('currentDuty');

        // Log the override
        console.log('🔐 Admin override:', {
            user: currentUser?.email,
            reason: overrideReason,
            timestamp: new Date().toISOString()
        });

        // Reset to selection
        setStep('selection');
        setSelectedDuty(null);
        setShowAdminOverride(false);
        setOverrideReason('');
    };

    const handleBack = () => {
        setStep('selection');
        setSelectedDuty(null);
    };

    // Check if duty is recommended
    const isDutyRecommended = (dutyCode) => {
        return recommendedDuties.some(d => d.code === dutyCode);
    };

    // Get status badge for duty
    const getStatusBadge = (dutyCode) => {
        const recommended = recommendedDuties.find(d => d.code === dutyCode);
        if (!recommended) return null;

        if (recommended.isActive) {
            return <span className="status-badge active">● ACTIVE NOW</span>;
        } else if (recommended.isUpcoming) {
            return <span className="status-badge upcoming">◔ STARTING SOON</span>;
        }
        return null;
    };

    // Check for existing locked duty warning
    const existingDuty = sessionStorage.getItem('currentDuty');
    const hasLockedDuty = existingDuty && JSON.parse(existingDuty).locked;

    // Handle close - pass view-only mode or just close
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            // Fallback: select view-only mode
            const shiftEnd = new Date();
            shiftEnd.setDate(shiftEnd.getDate() + 1);
            shiftEnd.setHours(0, 0, 0, 0);
            onDutySelected({
                viewOnly: true,
                code: null,
                name: 'View Only',
                shiftEnd: shiftEnd.toISOString()
            });
        }
    };

    return (
        <div className="duty-modal-overlay" onClick={handleClose}>
            <div className="duty-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Close Button - Always visible */}
                <button
                    className="duty-modal-close-btn"
                    onClick={handleClose}
                    aria-label="Close modal"
                >
                    <span>×</span>
                </button>

                {/* Locked Duty Warning (Admin Only) */}
                {hasLockedDuty && isAdmin && !showAdminOverride && (
                    <div className="locked-duty-warning">
                        <div className="warning-icon">⚠️</div>
                        <div className="warning-content">
                            <h3>Duty Already Locked</h3>
                            <p>A duty shift has already been locked for this session.</p>
                            <button
                                className="override-btn"
                                onClick={() => setShowAdminOverride(true)}
                            >
                                🔐 Admin Override
                            </button>
                        </div>
                    </div>
                )}

                {/* Admin Override Section */}
                {showAdminOverride && (
                    <div className="admin-override-section">
                        <h3>🔐 Admin Override</h3>
                        <p>Provide a reason for changing the locked duty:</p>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Reason for override (required)..."
                            rows={3}
                            className="override-reason-input"
                        />
                        <div className="override-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowAdminOverride(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-override"
                                onClick={handleAdminOverride}
                                disabled={!overrideReason.trim()}
                            >
                                Confirm Override
                            </button>
                        </div>
                    </div>
                )}

                {/* Selection Step */}
                {step === 'selection' && !showAdminOverride && (
                    <>
                        <div className="duty-modal-header">
                            <h2>🕐 Select Your Duty Shift</h2>
                            <p>Choose your current shift to continue</p>
                            {recommendedDuties.length > 0 && (
                                <div className="recommended-hint">
                                    <span className="star-icon">⭐</span>
                                    <span>Recommended shifts shown first</span>
                                </div>
                            )}
                        </div>

                        <div className="duty-cards-grid">
                            {DUTY_SHIFTS.map(duty => (
                                <div
                                    key={duty.code}
                                    className={`duty-card ${isDutyRecommended(duty.code) ? 'recommended' : ''}`}
                                    onClick={() => handleDutySelect(duty)}
                                    style={{ '--duty-gradient': duty.gradient }}
                                >
                                    {isDutyRecommended(duty.code) && (
                                        <div className="recommended-badge">
                                            ⭐ RECOMMENDED
                                        </div>
                                    )}

                                    <div className="duty-icon">{duty.icon}</div>
                                    <div className="duty-code">Duty {duty.code}</div>
                                    <div className="duty-name">{duty.name}</div>
                                    <div className="duty-time">
                                        {duty.startTime} - {duty.endTime}
                                    </div>
                                    <div className="duty-description">
                                        {duty.description}
                                    </div>

                                    {getStatusBadge(duty.code)}

                                    {isDutyRecommended(duty.code) && recommendedDuties.find(d => d.code === duty.code)?.isActive && (
                                        <div className="time-remaining">
                                            {getTimeRemaining(duty)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* View Only / Skip Duty Option - Only shown when not mandatory OR for admins/managers */}
                        {canSkipDutySelection ? (
                            <div className="duty-skip-section">
                                <div className="skip-divider">
                                    <span>or</span>
                                </div>
                                <button
                                    className="btn-view-only"
                                    onClick={() => {
                                        // View-only access expires at midnight (next day)
                                        const shiftEnd = new Date();
                                        shiftEnd.setDate(shiftEnd.getDate() + 1);
                                        shiftEnd.setHours(0, 0, 0, 0);

                                        onDutySelected({
                                            viewOnly: true,
                                            code: null,
                                            name: 'View Only',
                                            shiftEnd: shiftEnd.toISOString()
                                        });
                                    }}
                                >
                                    <span className="view-only-icon">👁️</span>
                                    <div className="view-only-content">
                                        <strong>Continue without selecting a duty</strong>
                                        <p>View-only access (for office staff, managers, or non-operational users)</p>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="duty-mandatory-notice">
                                <span className="mandatory-icon">&#x1F512;</span>
                                <p>Duty selection is required. Please select a shift to continue.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Confirmation Step */}
                {step === 'confirmation' && selectedDuty && (
                    <>
                        <div className="duty-modal-header">
                            <h2>✓ Confirm Your Duty</h2>
                            <p>Please review your shift selection</p>
                        </div>

                        <div className="confirmation-display">
                            <div
                                className="selected-duty-card"
                                style={{
                                    background: selectedDuty.gradient,
                                    boxShadow: `0 20px 40px ${selectedDuty.color}40`
                                }}
                            >
                                <div className="selected-duty-icon">{selectedDuty.icon}</div>
                                <div className="selected-duty-code">Duty {selectedDuty.code}</div>
                                <div className="selected-duty-name">{selectedDuty.name}</div>
                                <div className="selected-duty-time">
                                    {selectedDuty.startTime} - {selectedDuty.endTime}
                                </div>
                            </div>

                            <div className="confirmation-details">
                                <div className="detail-item">
                                    <span className="detail-icon">⏰</span>
                                    <div className="detail-content">
                                        <strong>Shift Duration</strong>
                                        <p>9.5 hours of coverage</p>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-icon">🔔</span>
                                    <div className="detail-content">
                                        <strong>Notifications</strong>
                                        <p>30-min & 10-min end warnings enabled</p>
                                        {selectedDuty.code === '500' && (
                                            <p className="special-note">+ Midnight Start of Service reminder</p>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-icon">🔒</span>
                                    <div className="detail-content">
                                        <strong>Duty Lock</strong>
                                        <p>This duty will be locked until shift end</p>
                                        {isAdmin && (
                                            <p className="admin-note">Admin override available if needed</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {notificationPermission === 'denied' && (
                                <div className="notification-warning">
                                    <span className="warning-icon">⚠️</span>
                                    <div>
                                        <strong>Notifications Blocked</strong>
                                        <p>Enable notifications in your browser to receive shift warnings</p>
                                    </div>
                                </div>
                            )}

                            <div className="confirmation-actions">
                                <button
                                    className="btn-back"
                                    onClick={handleBack}
                                >
                                    ← Back
                                </button>
                                <button
                                    className="btn-confirm"
                                    onClick={handleConfirm}
                                >
                                    <span className="confirm-icon">✓</span>
                                    Start Shift
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DutySelectionModal;
