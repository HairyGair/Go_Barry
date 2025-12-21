/**
 * Duty Indicator Component
 * Shows current duty with real-time countdown, progress bar, and color states
 * Updates every 30 seconds, auto-clears 5 minutes after shift end
 */

import React, { useState, useEffect } from 'react';
import './DutyIndicator.css';

const DutyIndicator = ({ currentDuty, onClick, isAdmin }) => {
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [warningState, setWarningState] = useState('normal'); // 'normal', 'warning', 'urgent'

    // Update countdown every 30 seconds
    useEffect(() => {
        if (!currentDuty) return;

        const updateCountdown = () => {
            const now = new Date();
            const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);
            const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);

            // Calculate end time
            const endTime = new Date();
            endTime.setHours(endHour, endMin, 0, 0);

            // Handle midnight crossing for Duty 500 and overnight shifts
            if (endHour < startHour || (currentDuty.code === '500' && endTime < now)) {
                endTime.setDate(endTime.getDate() + 1);
            }

            // Calculate start time
            const startTime = new Date();
            startTime.setHours(startHour, startMin, 0, 0);
            if (startTime > now && startHour > endHour) {
                startTime.setDate(startTime.getDate() - 1);
            }

            const diffMs = endTime - now;
            const totalShiftMs = endTime - startTime;

            // Auto-clear 5 minutes after shift end
            if (diffMs < -5 * 60 * 1000) {
                console.log('⏰ Shift ended 5+ minutes ago, auto-clearing duty');
                sessionStorage.removeItem('currentDuty');
                return;
            }

            // Calculate remaining time
            const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
            const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            // Update warning state
            if (diffMs <= 10 * 60 * 1000 && diffMs > 0) {
                setWarningState('urgent');
            } else if (diffMs <= 30 * 60 * 1000 && diffMs > 0) {
                setWarningState('warning');
            } else {
                setWarningState('normal');
            }

            // Calculate progress percentage
            const progress = Math.max(0, Math.min(100, ((totalShiftMs - diffMs) / totalShiftMs) * 100));
            setProgressPercent(progress);

            // Format time remaining
            if (diffMs > 0) {
                if (hoursLeft > 0) {
                    setTimeRemaining(`${hoursLeft}h ${minsLeft}m`);
                } else if (minsLeft > 0) {
                    setTimeRemaining(`${minsLeft} min`);
                } else {
                    setTimeRemaining('Ending soon');
                }
            } else {
                setTimeRemaining('Ended');
            }
        };

        // Initial update
        updateCountdown();

        // Update every 30 seconds
        const interval = setInterval(updateCountdown, 30000);

        return () => clearInterval(interval);
    }, [currentDuty]);

    // Handle click (admin only)
    const handleClick = () => {
        if (isAdmin && onClick) {
            onClick();
        }
    };

    if (!currentDuty) return null;

    // Phase 6.3: Generate ARIA label for screen readers
    const getAriaLabel = () => {
        let label = `Duty ${currentDuty.code}, ${currentDuty.name}`;
        if (timeRemaining) {
            label += `. Time remaining: ${timeRemaining}`;
        }
        if (warningState === 'warning') {
            label += '. Warning: Shift ending soon';
        } else if (warningState === 'urgent') {
            label += '. Urgent: Less than 10 minutes remaining';
        }
        if (isAdmin) {
            label += '. Click to change duty';
        }
        return label;
    };

    return (
        <div
            className={`duty-indicator ${warningState} ${isAdmin ? 'clickable' : ''}`}
            onClick={handleClick}
            title={isAdmin ? 'Click to change duty (Admin)' : `Current duty: ${currentDuty.name}`}
            style={{ '--duty-color': currentDuty.color }}
            role="status"
            aria-label={getAriaLabel()}
            aria-live={warningState !== 'normal' ? 'polite' : 'off'}
            tabIndex={isAdmin ? 0 : -1}
            onKeyDown={(e) => {
                if (isAdmin && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            <div className="duty-indicator-content">
                <span className="duty-indicator-icon">{currentDuty.icon}</span>
                <div className="duty-indicator-info">
                    <div className="duty-indicator-code">
                        Duty {currentDuty.code}
                        <span className="duty-indicator-name">{currentDuty.name}</span>
                    </div>
                    {timeRemaining && (
                        <div className="duty-indicator-time">
                            {timeRemaining}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="duty-progress-bar">
                <div
                    className="duty-progress-fill"
                    style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${currentDuty.color} 0%, ${currentDuty.color}AA 100%)`
                    }}
                />
            </div>

            {/* Warning Indicator */}
            {warningState !== 'normal' && (
                <div className={`warning-pulse ${warningState}`}>
                    {warningState === 'urgent' ? '⚠️' : '⏰'}
                </div>
            )}
        </div>
    );
};

export default DutyIndicator;
