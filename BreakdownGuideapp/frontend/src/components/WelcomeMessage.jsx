/**
 * Welcome Message Component - Shift Status Panel
 * Personalized greeting with duty info, SVG progress ring, and quick actions
 * Dismissible per user+duty combination
 * Updated: February 2026 - Transport control panel redesign
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DutyBadge as DutyBadgeIcon } from './icons/DutyBadgeIcons';
import './WelcomeMessage.css';

const WelcomeMessage = ({ currentUser, currentDuty, onClose }) => {
    const navigate = useNavigate();
    const [timeInfo, setTimeInfo] = useState({ greeting: '', progressPercent: 0, message: '' });
    const [warningState, setWarningState] = useState('normal');
    const [showCelebration, setShowCelebration] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Check if dismissed
    const dismissKey = `welcomeDismissed_${currentUser?.email}_${currentDuty?.code}`;
    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem(dismissKey) === 'true';
    });

    // Celebration entrance - settle after 2.5s
    useEffect(() => {
        if (!showCelebration) return;
        const timer = setTimeout(() => setShowCelebration(false), 2500);
        return () => clearTimeout(timer);
    }, [showCelebration]);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    // Handle duties without shift times (e.g. Engineering Manager)
    useEffect(() => {
        if (!currentDuty || currentDuty.viewOnly) return;
        if (!currentDuty.startTime || !currentDuty.endTime) {
            const now = new Date();
            const hour = now.getHours();
            const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
            setTimeInfo({ greeting, progressPercent: 0, message: 'Have a productive session!' });
            return;
        }
    }, [currentDuty]);

    // Update time info every minute
    useEffect(() => {
        if (!currentDuty || currentDuty.viewOnly || !currentDuty.startTime || !currentDuty.endTime) return;

        const updateTimeInfo = () => {
            const now = new Date();
            const currentHour = now.getHours();

            let greeting = '';
            if (currentHour < 12) greeting = 'Good Morning';
            else if (currentHour < 18) greeting = 'Good Afternoon';
            else greeting = 'Good Evening';

            const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);
            const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);

            const startTime = new Date();
            startTime.setHours(startHour, startMin, 0, 0);
            const endTime = new Date();
            endTime.setHours(endHour, endMin, 0, 0);

            if (endHour < startHour) {
                if (now.getHours() < endHour) {
                    startTime.setDate(startTime.getDate() - 1);
                } else {
                    endTime.setDate(endTime.getDate() + 1);
                }
            }

            const totalShiftMs = endTime - startTime;
            const elapsedMs = now - startTime;
            const remainingMs = endTime - now;

            const progressPercent = Math.max(0, Math.min(100, (elapsedMs / totalShiftMs) * 100));

            const hoursRemaining = Math.floor(remainingMs / (1000 * 60 * 60));
            const minsRemaining = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

            let message = '';
            let state = 'normal';

            if (currentDuty.code === '500' && currentHour === 23 && now.getMinutes() >= 45) {
                message = 'Start of Service report reminder coming at midnight';
                state = 'warning';
            } else if (remainingMs <= 10 * 60 * 1000 && remainingMs > 0) {
                message = 'Less than 10 minutes remaining - prepare for handover!';
                state = 'urgent';
            } else if (remainingMs <= 30 * 60 * 1000 && remainingMs > 0) {
                message = `${minsRemaining} minutes remaining, stay focused!`;
                state = 'warning';
            } else if (hoursRemaining <= 2 && hoursRemaining > 0) {
                message = `${hoursRemaining}h ${minsRemaining}m remaining, stay focused!`;
                state = 'normal';
            } else if (progressPercent >= 45 && progressPercent <= 55) {
                message = 'Keep up the great work!';
                state = 'normal';
            } else {
                message = 'Have a productive shift!';
                state = 'normal';
            }

            setTimeInfo({ greeting, progressPercent, message });
            setWarningState(state);
        };

        updateTimeInfo();
        const interval = setInterval(updateTimeInfo, 60000);
        return () => clearInterval(interval);
    }, [currentDuty]);

    const handleDismiss = () => {
        localStorage.setItem(dismissKey, 'true');
        setIsDismissed(true);
        if (onClose) onClose();
    };

    const handleQuickAction = (action) => {
        switch (action) {
            case 'breakdown':
                navigate('/breakdown-guide');
                break;
            case 'dashboard':
                navigate('/dashboards/control-room');
                break;
            case 'handover':
                alert('Shift Handover feature coming soon!');
                break;
            default:
                break;
        }
    };

    if (isDismissed || !currentDuty || !currentUser || currentDuty.viewOnly) return null;

    const dutyColors = {
        '100': '#3B82F6',
        '200': '#10B981',
        '400': '#F59E0B',
        '500': '#8B5CF6',
        'ENG': '#0097A7'
    };
    const themeColor = dutyColors[currentDuty.code] || '#0097A7';

    // SVG progress ring values
    const ringRadius = 26;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference * (1 - timeInfo.progressPercent / 100);

    return (
        <div
            className={`wm-card ${warningState} ${showCelebration ? 'wm-celebrating' : ''}`}
            style={{ '--wm-color': themeColor }}
        >
            {/* Close */}
            <button className="wm-close" onClick={handleDismiss} title="Dismiss">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="3" x2="13" y2="13" />
                    <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
            </button>

            {/* Top section: dark panel */}
            <div className="wm-header">
                <div className="wm-header-accent" />

                <div className="wm-greeting-row">
                    <div className="wm-greeting-text">
                        <h2 className="wm-greeting">{timeInfo.greeting}, {currentUser.name}</h2>
                        <p className="wm-subtitle">
                            You're on <strong>{currentDuty.name}</strong>
                        </p>
                    </div>
                    <span className="wm-clock">
                        <span className="wm-clock-dot" />
                        {formatTime(currentTime)}
                    </span>
                </div>
            </div>

            {/* Duty status strip */}
            <div className="wm-duty-strip">
                <div className="wm-duty-badge">
                    {currentDuty.code === 'ENG' ? (
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--wm-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    ) : (
                        <DutyBadgeIcon dutyCode={currentDuty.code} size={44} />
                    )}
                </div>

                <div className="wm-duty-info">
                    <span className="wm-duty-code">
                        {currentDuty.code === 'ENG' ? 'Engineering' : `Duty ${currentDuty.code}`}
                    </span>
                    <span className="wm-duty-time">
                        {currentDuty.startTime && currentDuty.endTime ? (
                            <>
                                {currentDuty.startTime}
                                <svg className="wm-time-arrow" width="16" height="6" viewBox="0 0 16 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                    <line x1="0" y1="3" x2="13" y2="3" />
                                    <polyline points="11,1 13,3 11,5" />
                                </svg>
                                {currentDuty.endTime}
                            </>
                        ) : (
                            currentDuty.description || 'Flexible hours'
                        )}
                    </span>
                </div>

                {/* Progress ring */}
                {currentDuty.startTime && currentDuty.endTime && (
                    <div className="wm-progress">
                        <svg className="wm-ring" viewBox="0 0 64 64">
                            <circle
                                cx="32" cy="32" r={ringRadius}
                                className="wm-ring-bg"
                            />
                            <circle
                                cx="32" cy="32" r={ringRadius}
                                className="wm-ring-fill"
                                style={{
                                    strokeDasharray: ringCircumference,
                                    strokeDashoffset: ringOffset,
                                    stroke: themeColor
                                }}
                            />
                        </svg>
                        <span className="wm-progress-text">
                            {Math.round(timeInfo.progressPercent)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Progress bar (thin) */}
            {currentDuty.startTime && currentDuty.endTime && (
                <div className="wm-progress-bar">
                    <div
                        className="wm-progress-fill"
                        style={{
                            width: `${timeInfo.progressPercent}%`,
                            background: currentDuty.gradient || themeColor
                        }}
                    />
                </div>
            )}

            {/* Status message */}
            <div className={`wm-message ${warningState}`}>
                <span className="wm-message-icon">
                    {warningState === 'urgent' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    ) : warningState === 'warning' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </span>
                <span>{timeInfo.message}</span>
            </div>

            {/* Quick Actions */}
            <div className="wm-actions">
                <button className="wm-action wm-action-breakdown" onClick={() => handleQuickAction('breakdown')}>
                    <svg className="wm-action-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="wm-action-label">Report Breakdown</span>
                </button>

                <button className="wm-action wm-action-dashboard" onClick={() => handleQuickAction('dashboard')}>
                    <svg className="wm-action-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span className="wm-action-label">View Dashboard</span>
                </button>

                <button className="wm-action wm-action-handover" onClick={() => handleQuickAction('handover')}>
                    <svg className="wm-action-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    <span className="wm-action-label">Shift Handover</span>
                </button>
            </div>
        </div>
    );
};

export default WelcomeMessage;
