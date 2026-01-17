/**
 * Welcome Message Component
 * Personalized greeting with duty info, progress, and quick actions
 * Dismissible per user+duty combination
 * Updated January 2026: Custom SVG badge icons
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DutyBadge as DutyBadgeIcon } from './icons/DutyBadgeIcons';
import './WelcomeMessage.css';

const WelcomeMessage = ({ currentUser, currentDuty, onClose }) => {
    const navigate = useNavigate();
    const [timeInfo, setTimeInfo] = useState({ greeting: '', progressPercent: 0, message: '' });
    const [warningState, setWarningState] = useState('normal'); // 'normal', 'warning', 'urgent'
    const [showCelebration, setShowCelebration] = useState(true); // Phase 8.3: Show celebration on mount
    const [celebrationPhase, setCelebrationPhase] = useState(1); // 1: confetti, 2: sparkles, 3: settled

    // Check if dismissed
    const dismissKey = `welcomeDismissed_${currentUser?.email}_${currentDuty?.code}`;
    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem(dismissKey) === 'true';
    });

    // Phase 8.3: Celebration animation phases
    useEffect(() => {
        if (!showCelebration) return;

        // Phase 1: Confetti burst (0-1.5s)
        const phase2Timer = setTimeout(() => {
            setCelebrationPhase(2);
        }, 1500);

        // Phase 2: Sparkle glow (1.5-3s)
        const phase3Timer = setTimeout(() => {
            setCelebrationPhase(3);
        }, 3000);

        // Phase 3: Settled - end celebration (3.5s)
        const endTimer = setTimeout(() => {
            setShowCelebration(false);
        }, 3500);

        return () => {
            clearTimeout(phase2Timer);
            clearTimeout(phase3Timer);
            clearTimeout(endTimer);
        };
    }, [showCelebration]);

    // Update time info every minute
    useEffect(() => {
        if (!currentDuty) return;

        const updateTimeInfo = () => {
            const now = new Date();
            const currentHour = now.getHours();

            // Personalized greeting
            let greeting = '';
            if (currentHour < 12) {
                greeting = 'Good Morning';
            } else if (currentHour < 18) {
                greeting = 'Good Afternoon';
            } else {
                greeting = 'Good Evening';
            }

            // Calculate shift progress
            const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);
            const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);

            const startTime = new Date();
            startTime.setHours(startHour, startMin, 0, 0);

            const endTime = new Date();
            endTime.setHours(endHour, endMin, 0, 0);

            // Handle overnight shifts
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

            // Calculate hours remaining
            const hoursRemaining = Math.floor(remainingMs / (1000 * 60 * 60));
            const minsRemaining = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

            // Dynamic message based on progress
            let message = '';
            let state = 'normal';

            // Special Duty 500 midnight reminder
            if (currentDuty.code === '500' && currentHour === 23 && now.getMinutes() >= 45) {
                message = '⏰ Start of Service report reminder coming at midnight';
                state = 'warning';
            }
            // Urgent - 10 minutes or less
            else if (remainingMs <= 10 * 60 * 1000 && remainingMs > 0) {
                message = `⚠️ Less than 10 minutes remaining - prepare for handover!`;
                state = 'urgent';
            }
            // Warning - 30 minutes or less
            else if (remainingMs <= 30 * 60 * 1000 && remainingMs > 0) {
                message = `⏰ ${minsRemaining} minutes remaining, stay focused!`;
                state = 'warning';
            }
            // Near end - last 2 hours
            else if (hoursRemaining <= 2 && hoursRemaining > 0) {
                message = `${hoursRemaining}h ${minsRemaining}m remaining, stay focused!`;
                state = 'normal';
            }
            // Halfway point
            else if (progressPercent >= 45 && progressPercent <= 55) {
                message = 'Keep up the great work!';
                state = 'normal';
            }
            // Start of shift
            else {
                message = 'Have a productive shift!';
                state = 'normal';
            }

            setTimeInfo({ greeting, progressPercent, message });
            setWarningState(state);
        };

        updateTimeInfo();
        const interval = setInterval(updateTimeInfo, 60000); // Update every minute

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
                // Future: Navigate to handover page
                alert('Shift Handover feature coming soon!');
                break;
            default:
                break;
        }
    };

    if (isDismissed || !currentDuty || !currentUser) return null;

    // Get duty theme color for celebration
    const dutyColors = {
        '100': '#3B82F6', // Blue
        '200': '#10B981', // Green
        '400': '#F59E0B', // Amber
        '500': '#8B5CF6'  // Purple
    };
    const celebrationColor = dutyColors[currentDuty.code] || '#0066A1';

    return (
        <div className={`welcome-message ${warningState} ${showCelebration ? 'celebrating' : ''} celebration-phase-${celebrationPhase}`}
             style={{ '--celebration-color': celebrationColor }}>

            {/* Phase 8.3: Celebration Overlay */}
            {showCelebration && (
                <div className="welcome-celebration">
                    {/* Confetti particles */}
                    <div className="confetti-container">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti-piece"
                                style={{
                                    '--delay': `${i * 0.1}s`,
                                    '--x-offset': `${(i % 4) * 25 - 37.5}%`,
                                    '--rotation': `${Math.random() * 360}deg`,
                                    backgroundColor: i % 2 === 0 ? celebrationColor : '#FFD700'
                                }}
                            />
                        ))}
                    </div>
                    {/* Sparkle stars */}
                    <div className="sparkle-container">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="sparkle-star"
                                style={{
                                    '--delay': `${i * 0.15}s`,
                                    '--x': `${10 + (i * 12)}%`,
                                    '--y': `${20 + (i % 3) * 30}%`
                                }}
                            >✨</div>
                        ))}
                    </div>
                    {/* Welcome burst text */}
                    <div className="welcome-burst">
                        <span className="burst-text">Welcome!</span>
                    </div>
                </div>
            )}

            <button className="welcome-close" onClick={handleDismiss} title="Dismiss">
                ✕
            </button>

            <div className="welcome-header">
                <h2 className={`welcome-greeting ${showCelebration ? 'greeting-animated' : ''}`}>
                    {timeInfo.greeting}, {currentUser.name}!
                </h2>
                <p className="welcome-subtitle">
                    You're on <strong>{currentDuty.name}</strong>
                </p>
            </div>

            <div className="welcome-duty-card" style={{ '--duty-color': currentDuty.color }}>
                <div className="duty-card-icon">
                    <DutyBadgeIcon dutyCode={currentDuty.code} size={48} />
                </div>
                <div className="duty-card-info">
                    <div className="duty-card-code">Duty {currentDuty.code}</div>
                    <div className="duty-card-time">
                        {currentDuty.startTime} - {currentDuty.endTime}
                    </div>
                </div>
                <div className="duty-card-progress">
                    <div className="progress-circle" style={{
                        background: `conic-gradient(${currentDuty.color} ${timeInfo.progressPercent * 3.6}deg, rgba(0,0,0,0.1) 0deg)`
                    }}>
                        <div className="progress-inner">
                            {Math.round(timeInfo.progressPercent)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="welcome-progress-bar">
                <div
                    className="welcome-progress-fill"
                    style={{
                        width: `${timeInfo.progressPercent}%`,
                        background: currentDuty.gradient
                    }}
                />
            </div>

            {/* Dynamic Message */}
            <div className={`welcome-message-text ${warningState}`}>
                <span className="message-icon">
                    {warningState === 'urgent' ? '⚠️' : warningState === 'warning' ? '⏰' : '✨'}
                </span>
                <span>{timeInfo.message}</span>
            </div>

            {/* Quick Actions */}
            <div className="welcome-quick-actions">
                <button
                    className="quick-action-btn breakdown"
                    onClick={() => handleQuickAction('breakdown')}
                >
                    <span className="action-icon">🚨</span>
                    <span className="action-text">Report Breakdown</span>
                </button>
                <button
                    className="quick-action-btn dashboard"
                    onClick={() => handleQuickAction('dashboard')}
                >
                    <span className="action-icon">📺</span>
                    <span className="action-text">View Dashboard</span>
                </button>
                <button
                    className="quick-action-btn handover"
                    onClick={() => handleQuickAction('handover')}
                >
                    <span className="action-icon">🔄</span>
                    <span className="action-text">Shift Handover</span>
                </button>
            </div>
        </div>
    );
};

export default WelcomeMessage;
