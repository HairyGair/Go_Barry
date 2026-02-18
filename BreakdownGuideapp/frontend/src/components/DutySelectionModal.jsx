/**
 * Duty Selection Modal - Transport Control Panel Design
 * Two-step flow: Selection > Confirmation
 * Features: Smart recommendations, live clock, supervisor greeting,
 *           duty locking, admin override, compliance settings
 * Updated: February 2026 - Redesigned with boiga/aileron typography
 */

import React, { useState, useEffect } from 'react';
import './DutySelectionModal.css';
import { DutyBadge } from './icons/DutyBadgeIcons';

// Duty shift definitions - the operator Standard Shifts
const DUTY_SHIFTS = [
    {
        code: '100',
        name: 'Early Shift',
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
    const [currentTime, setCurrentTime] = useState(new Date());

    const isAdmin = currentUser?.role === 'admin';
    const isManager = currentUser?.role === 'manager';
    const isEngineeringManager = currentUser?.role === 'engineering' || currentUser?.role === 'engineering_manager';
    const firstName = currentUser?.name?.split(' ')[0] || 'Supervisor';

    // Live clock - update every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Time-based greeting
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

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
    const canSkipDutySelection = !complianceSettings.mandatoryDutySelection || isAdmin || isManager || isEngineeringManager;

    // Check for existing locked duty
    useEffect(() => {
        const existingDuty = sessionStorage.getItem('currentDuty');
        if (existingDuty) {
            try {
                const duty = JSON.parse(existingDuty);
                if (duty.locked && !isAdmin) {
                    console.log('Duty already locked, cannot change');
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

            if (startHour > endHour) {
                isActive = currentHour >= startHour || currentHour < endHour;
                isUpcoming = (currentHour === startHour - 1) ||
                            (startHour === 0 && currentHour === 23);
            } else {
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

        return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 2);
    };

    const recommendedDuties = getRecommendedDuties();

    // Calculate time remaining if joining mid-shift
    const getTimeRemaining = (duty) => {
        const now = new Date();
        const [endHour, endMin] = duty.endTime.split(':').map(Number);

        const endTime = new Date();
        endTime.setHours(endHour, endMin, 0, 0);

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
        if (notificationPermission === 'default' && typeof Notification !== 'undefined') {
            try {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }

        const now = new Date();
        const [endHour, endMin] = selectedDuty.endTime.split(':').map(Number);
        const shiftEnd = new Date();
        shiftEnd.setHours(endHour, endMin, 0, 0);

        if (shiftEnd < now) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        const dutyData = {
            ...selectedDuty,
            locked: true,
            lockedAt: new Date().toISOString(),
            lockedBy: currentUser?.email || 'unknown',
            shiftEnd: shiftEnd.toISOString(),
            notifications: {
                thirtyMinWarning: true,
                tenMinWarning: true,
                midnightReminder: selectedDuty.code === '500'
            }
        };

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

            let csrfToken = null;
            try {
                const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
                    credentials: 'include'
                });
                if (csrfResponse.ok) {
                    const csrfData = await csrfResponse.json();
                    csrfToken = csrfData.csrfToken;
                }
            } catch (csrfError) {
                console.warn('Failed to get CSRF token for set-duty:', csrfError);
            }

            const response = await fetch(`${apiUrl}/api/auth/set-duty`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken || ''
                },
                body: JSON.stringify({ duty: selectedDuty.code })
            });

            if (!response.ok) {
                console.warn('Failed to set duty on backend, continuing with local storage');
            } else {
                console.log('Duty set on backend successfully');
            }
        } catch (error) {
            console.error('Error calling set-duty endpoint:', error);
        }

        sessionStorage.setItem('currentDuty', JSON.stringify(dutyData));
        sessionStorage.removeItem('showDutyModal');

        console.log('Duty confirmed and locked until:', shiftEnd.toLocaleString());

        onDutySelected(dutyData);
    };

    const handleAdminOverride = () => {
        if (!overrideReason.trim()) {
            alert('Please provide a reason for changing the duty');
            return;
        }

        sessionStorage.removeItem('currentDuty');

        console.log('Admin override:', {
            user: currentUser?.email,
            reason: overrideReason,
            timestamp: new Date().toISOString()
        });

        setStep('selection');
        setSelectedDuty(null);
        setShowAdminOverride(false);
        setOverrideReason('');
    };

    const handleBack = () => {
        setStep('selection');
        setSelectedDuty(null);
    };

    const isDutyRecommended = (dutyCode) => {
        return recommendedDuties.some(d => d.code === dutyCode);
    };

    const getStatusBadge = (dutyCode) => {
        const recommended = recommendedDuties.find(d => d.code === dutyCode);
        if (!recommended) return null;

        if (recommended.isActive) {
            return <span className="dsm-status-badge dsm-status-active">ACTIVE NOW</span>;
        } else if (recommended.isUpcoming) {
            return <span className="dsm-status-badge dsm-status-upcoming">STARTING SOON</span>;
        }
        return null;
    };

    const existingDuty = sessionStorage.getItem('currentDuty');
    const hasLockedDuty = existingDuty && JSON.parse(existingDuty).locked;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
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
        <div className="dsm-overlay" onClick={handleClose}>
            <div className="dsm-container" onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button className="dsm-close" onClick={handleClose} aria-label="Close modal">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="4" y1="4" x2="16" y2="16" />
                        <line x1="16" y1="4" x2="4" y2="16" />
                    </svg>
                </button>

                {/* Locked Duty Warning (Admin Only) */}
                {hasLockedDuty && isAdmin && !showAdminOverride && (
                    <div className="dsm-locked-warning">
                        <div className="dsm-locked-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <div className="dsm-locked-content">
                            <h3>Duty Already Locked</h3>
                            <p>A duty shift has already been locked for this session.</p>
                            <button className="dsm-override-trigger" onClick={() => setShowAdminOverride(true)}>
                                Admin Override
                            </button>
                        </div>
                    </div>
                )}

                {/* Admin Override Section */}
                {showAdminOverride && (
                    <div className="dsm-admin-override">
                        <h3>Admin Override</h3>
                        <p>Provide a reason for changing the locked duty:</p>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Reason for override (required)..."
                            rows={3}
                            className="dsm-override-input"
                        />
                        <div className="dsm-override-actions">
                            <button className="dsm-btn dsm-btn-ghost" onClick={() => setShowAdminOverride(false)}>
                                Cancel
                            </button>
                            <button
                                className="dsm-btn dsm-btn-danger"
                                onClick={handleAdminOverride}
                                disabled={!overrideReason.trim()}
                            >
                                Confirm Override
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!showAdminOverride && (
                    <>
                        {/* Header */}
                        <div className="dsm-header">
                            {/* Accent bar */}
                            <div className="dsm-accent-bar" />

                            {/* Step indicator */}
                            <div className="dsm-steps">
                                <div className={`dsm-step ${step === 'selection' ? 'active' : 'done'}`}>
                                    <span className="dsm-step-dot">
                                        {step === 'confirmation' ? (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="2,6 5,9 10,3" /></svg>
                                        ) : '1'}
                                    </span>
                                    <span className="dsm-step-label">Select</span>
                                </div>
                                <div className={`dsm-step-line ${step === 'confirmation' ? 'filled' : ''}`} />
                                <div className={`dsm-step ${step === 'confirmation' ? 'active' : ''}`}>
                                    <span className="dsm-step-dot">2</span>
                                    <span className="dsm-step-label">Confirm</span>
                                </div>
                            </div>

                            {/* Greeting & Title */}
                            <p className="dsm-greeting">{getGreeting()}, {firstName}</p>
                            <h2 className="dsm-title">
                                {step === 'selection' ? 'Select Your Duty Shift' : 'Confirm Your Shift'}
                            </h2>

                            {/* Meta: clock + hint */}
                            <div className="dsm-header-meta">
                                <span className="dsm-clock">
                                    <span className="dsm-clock-dot" />
                                    {formatTime(currentTime)}
                                </span>
                                {step === 'selection' && recommendedDuties.length > 0 && (
                                    <span className="dsm-rec-hint">Recommended shifts highlighted</span>
                                )}
                                {step === 'confirmation' && selectedDuty && (
                                    <span className="dsm-rec-hint">Review your selection below</span>
                                )}
                            </div>
                        </div>

                        {/* Selection Step */}
                        {step === 'selection' && (
                            <div className="dsm-body">
                                <div className="dsm-cards-grid">
                                    {DUTY_SHIFTS.map((duty, index) => {
                                        const isRec = isDutyRecommended(duty.code);
                                        const recData = recommendedDuties.find(d => d.code === duty.code);
                                        return (
                                            <button
                                                key={duty.code}
                                                className={`dsm-card ${isRec ? 'recommended' : ''}`}
                                                onClick={() => handleDutySelect(duty)}
                                                style={{
                                                    '--card-color': duty.color,
                                                    '--card-gradient': duty.gradient,
                                                    animationDelay: `${index * 0.07}s`
                                                }}
                                            >
                                                {isRec && (
                                                    <span className="dsm-rec-badge">RECOMMENDED</span>
                                                )}

                                                <div className="dsm-card-top">
                                                    <div className="dsm-card-badge">
                                                        <DutyBadge dutyCode={duty.code} size={48} />
                                                    </div>
                                                    <div className="dsm-card-identity">
                                                        <span className="dsm-card-code">Duty {duty.code}</span>
                                                        <span className="dsm-card-name">{duty.name}</span>
                                                    </div>
                                                </div>

                                                <div className="dsm-card-time">
                                                    <span className="dsm-time-value">{duty.startTime}</span>
                                                    <span className="dsm-time-arrow">
                                                        <svg width="24" height="8" viewBox="0 0 24 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                                            <line x1="0" y1="4" x2="20" y2="4" />
                                                            <polyline points="17,1 20,4 17,7" />
                                                        </svg>
                                                    </span>
                                                    <span className="dsm-time-value">{duty.endTime}</span>
                                                    <span className="dsm-time-duration">{duty.duration}</span>
                                                </div>

                                                <div className="dsm-card-tasks">
                                                    {duty.tasks.map((task, i) => (
                                                        <div key={i} className="dsm-task">
                                                            <span className="dsm-task-dot" />
                                                            {task}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="dsm-card-footer">
                                                    {getStatusBadge(duty.code)}
                                                    {isRec && recData?.isActive && (
                                                        <span className="dsm-remaining">{getTimeRemaining(duty)}</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Engineering Manager Option */}
                                {isEngineeringManager && (
                                    <div className="dsm-alt-section">
                                        <div className="dsm-divider"><span>or</span></div>
                                        <button
                                            className="dsm-alt-btn dsm-alt-engineering"
                                            onClick={() => {
                                                const shiftEnd = new Date();
                                                shiftEnd.setDate(shiftEnd.getDate() + 1);
                                                shiftEnd.setHours(0, 0, 0, 0);
                                                onDutySelected({
                                                    code: 'ENG',
                                                    name: 'Engineering Manager',
                                                    locked: true,
                                                    lockedAt: new Date().toISOString(),
                                                    lockedBy: currentUser?.email || 'unknown',
                                                    shiftEnd: shiftEnd.toISOString(),
                                                    description: 'Engineering management and dispatch',
                                                    notifications: { thirtyMinWarning: false, tenMinWarning: false }
                                                });
                                            }}
                                        >
                                            <svg className="dsm-alt-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                            </svg>
                                            <div className="dsm-alt-text">
                                                <strong>Engineering Manager</strong>
                                                <p>Engineering dispatch, vehicle monitoring, and engineer management</p>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* View Only / Skip */}
                                {canSkipDutySelection ? (
                                    <div className="dsm-alt-section">
                                        <div className="dsm-divider"><span>or</span></div>
                                        <button
                                            className="dsm-alt-btn"
                                            onClick={() => {
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
                                            <svg className="dsm-alt-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <div className="dsm-alt-text">
                                                <strong>Continue without selecting a duty</strong>
                                                <p>View-only access for office staff, managers, or non-operational users</p>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="dsm-mandatory-notice">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <p>Duty selection is required. Please select a shift to continue.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Confirmation Step */}
                        {step === 'confirmation' && selectedDuty && (
                            <div className="dsm-body">
                                <div className="dsm-confirm">
                                    {/* Selected Duty Display */}
                                    <div
                                        className="dsm-confirm-card"
                                        style={{
                                            '--card-color': selectedDuty.color,
                                            '--card-gradient': selectedDuty.gradient
                                        }}
                                    >
                                        <div className="dsm-confirm-badge">
                                            <DutyBadge dutyCode={selectedDuty.code} size={72} />
                                        </div>
                                        <div className="dsm-confirm-info">
                                            <span className="dsm-confirm-code">Duty {selectedDuty.code}</span>
                                            <span className="dsm-confirm-name">{selectedDuty.name}</span>
                                            <div className="dsm-confirm-time">
                                                <span>{selectedDuty.startTime}</span>
                                                <svg width="28" height="8" viewBox="0 0 28 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
                                                    <line x1="0" y1="4" x2="24" y2="4" />
                                                    <polyline points="21,1 24,4 21,7" />
                                                </svg>
                                                <span>{selectedDuty.endTime}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail Grid */}
                                    <div className="dsm-details-grid">
                                        <div className="dsm-detail">
                                            <div className="dsm-detail-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <strong>Shift Duration</strong>
                                            <p>9.5 hours of coverage</p>
                                        </div>

                                        <div className="dsm-detail">
                                            <div className="dsm-detail-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                            </div>
                                            <strong>Notifications</strong>
                                            <p>30-min & 10-min end warnings</p>
                                            {selectedDuty.code === '500' && (
                                                <p className="dsm-detail-note">+ Midnight Start of Service reminder</p>
                                            )}
                                        </div>

                                        <div className="dsm-detail">
                                            <div className="dsm-detail-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </div>
                                            <strong>Duty Lock</strong>
                                            <p>Locked until shift end</p>
                                            {isAdmin && (
                                                <p className="dsm-detail-note">Admin override available</p>
                                            )}
                                        </div>
                                    </div>

                                    {notificationPermission === 'denied' && (
                                        <div className="dsm-notif-warning">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                            <div>
                                                <strong>Notifications Blocked</strong>
                                                <p>Enable notifications in your browser to receive shift warnings</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="dsm-confirm-actions">
                                        <button className="dsm-btn dsm-btn-ghost" onClick={handleBack}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="12" y1="8" x2="4" y2="8" />
                                                <polyline points="7,4 4,8 7,12" />
                                            </svg>
                                            Back
                                        </button>
                                        <button className="dsm-btn dsm-btn-primary" onClick={handleConfirm}>
                                            Start Shift
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="4" y1="8" x2="12" y2="8" />
                                                <polyline points="9,4 12,8 9,12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DutySelectionModal;
