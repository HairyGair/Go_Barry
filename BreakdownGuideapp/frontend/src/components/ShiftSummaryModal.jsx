/**
 * ShiftSummaryModal Component
 * Phase 8.4: Shows shift statistics before logout
 *
 * Features:
 * - Total shift duration with visual progress
 * - Breakdown statistics (handled, resolved, pending)
 * - Performance metrics
 * - Achievement badges
 * - Optional shift notes
 * - Animated statistics reveal
 */

import React, { useState, useEffect, useMemo } from 'react';
import './ShiftSummaryModal.css';

// Achievement definitions
const ACHIEVEMENTS = {
  QUICK_RESPONDER: {
    id: 'quick_responder',
    icon: '⚡',
    title: 'Quick Responder',
    description: 'Average response under 5 minutes',
    condition: (stats) => stats.avgResponseTime < 5
  },
  PROBLEM_SOLVER: {
    id: 'problem_solver',
    icon: '🏆',
    title: 'Problem Solver',
    description: 'Resolved all assigned breakdowns',
    condition: (stats) => stats.breakdownsResolved > 0 && stats.breakdownsPending === 0
  },
  BUSY_BEE: {
    id: 'busy_bee',
    icon: '🐝',
    title: 'Busy Bee',
    description: 'Handled 5+ breakdowns',
    condition: (stats) => stats.breakdownsHandled >= 5
  },
  MARATHON_RUNNER: {
    id: 'marathon_runner',
    icon: '🏃',
    title: 'Marathon Runner',
    description: 'Extended shift to help team',
    condition: (stats) => stats.shiftExtended
  },
  CLEAN_SLATE: {
    id: 'clean_slate',
    icon: '✨',
    title: 'Clean Slate',
    description: 'No pending breakdowns at handover',
    condition: (stats) => stats.breakdownsPending === 0
  },
  FIRST_SHIFT: {
    id: 'first_shift',
    icon: '🎉',
    title: 'First Shift',
    description: 'Welcome to the team!',
    condition: (stats) => stats.isFirstShift
  }
};

const ShiftSummaryModal = ({
  isVisible,
  currentDuty,
  currentUser,
  shiftStats = {},
  onConfirmEnd,
  onCancel,
  onAddNotes
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [shiftNotes, setShiftNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Default stats if not provided
  const stats = useMemo(() => ({
    breakdownsHandled: shiftStats.breakdownsHandled || 0,
    breakdownsResolved: shiftStats.breakdownsResolved || 0,
    breakdownsPending: shiftStats.breakdownsPending || 0,
    avgResponseTime: shiftStats.avgResponseTime || null,
    assessmentsCompleted: shiftStats.assessmentsCompleted || 0,
    shiftExtended: shiftStats.shiftExtended || false,
    isFirstShift: shiftStats.isFirstShift || false,
    performance: shiftStats.performance || 'good' // good, excellent, needs-improvement
  }), [shiftStats]);

  // Calculate earned achievements
  const earnedAchievements = useMemo(() => {
    return Object.values(ACHIEVEMENTS).filter(achievement =>
      achievement.condition(stats)
    );
  }, [stats]);

  // Calculate shift duration
  const shiftDuration = useMemo(() => {
    if (!currentDuty) return { hours: 0, minutes: 0 };

    const now = new Date();
    const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);

    // Handle overnight shifts
    if (now < startTime) {
      startTime.setDate(startTime.getDate() - 1);
    }

    const durationMs = now - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }, [currentDuty]);

  // Animate stats reveal
  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase(0);
      return;
    }

    // Phase 1: Card entrance (0ms)
    const phase1 = setTimeout(() => setAnimationPhase(1), 100);
    // Phase 2: Stats reveal (400ms)
    const phase2 = setTimeout(() => setAnimationPhase(2), 500);
    // Phase 3: Achievements (800ms)
    const phase3 = setTimeout(() => setAnimationPhase(3), 900);
    // Phase 4: Notes section (1200ms)
    const phase4 = setTimeout(() => setAnimationPhase(4), 1300);

    // Show confetti if achievements earned
    if (earnedAchievements.length > 0) {
      const confettiTimer = setTimeout(() => setShowConfetti(true), 1000);
      const hideConfetti = setTimeout(() => setShowConfetti(false), 3500);
      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(hideConfetti);
      };
    }

    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      clearTimeout(phase4);
    };
  }, [isVisible, earnedAchievements.length]);

  const handleConfirmEnd = async () => {
    setIsSubmitting(true);

    // Save notes if provided
    if (shiftNotes.trim() && onAddNotes) {
      await onAddNotes(shiftNotes);
    }

    // Confirm end shift
    if (onConfirmEnd) {
      await onConfirmEnd({
        notes: shiftNotes,
        stats,
        achievements: earnedAchievements.map(a => a.id)
      });
    }

    setIsSubmitting(false);
  };

  if (!isVisible || !currentDuty) return null;

  // Get duty theme color
  const dutyColors = {
    '100': { primary: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
    '200': { primary: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
    '400': { primary: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #FCD34D)' },
    '500': { primary: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }
  };
  const dutyTheme = dutyColors[currentDuty.code] || dutyColors['200'];

  return (
    <div className={`shift-summary-modal phase-${animationPhase}`}>
      <div className="shift-summary-modal__backdrop" onClick={onCancel} />

      {/* Confetti celebration */}
      {showConfetti && (
        <div className="shift-summary-modal__confetti">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                '--delay': `${i * 0.05}s`,
                '--x': `${5 + Math.random() * 90}%`,
                '--color': i % 3 === 0 ? dutyTheme.primary : i % 3 === 1 ? '#FFD700' : '#FF6B6B'
              }}
            />
          ))}
        </div>
      )}

      <div className="shift-summary-modal__container">
        <div className="shift-summary-modal__card" style={{ '--duty-color': dutyTheme.primary }}>

          {/* Header */}
          <div className="shift-summary-modal__header" style={{ background: dutyTheme.gradient }}>
            <div className="shift-summary-modal__header-content">
              <span className="shift-summary-modal__icon">{currentDuty.icon || '🌟'}</span>
              <div className="shift-summary-modal__title-group">
                <h2 className="shift-summary-modal__title">Shift Complete!</h2>
                <p className="shift-summary-modal__subtitle">
                  Great work on Duty {currentDuty.code}, {currentUser?.name?.split(' ')[0] || 'Supervisor'}!
                </p>
              </div>
            </div>
          </div>

          {/* Duration Summary */}
          <div className="shift-summary-modal__duration">
            <div className="duration-visual">
              <div className="duration-clock">
                <span className="duration-hours">{shiftDuration.hours}</span>
                <span className="duration-label">hrs</span>
                <span className="duration-minutes">{shiftDuration.minutes}</span>
                <span className="duration-label">min</span>
              </div>
            </div>
            <div className="duration-info">
              <span className="duration-range">{currentDuty.startTime} → {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="duration-name">{currentDuty.name}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={`shift-summary-modal__stats ${animationPhase >= 2 ? 'visible' : ''}`}>
            <div className="stat-item">
              <span className="stat-icon">🚌</span>
              <span className="stat-value">{stats.breakdownsHandled}</span>
              <span className="stat-label">Breakdowns Handled</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">✅</span>
              <span className="stat-value">{stats.breakdownsResolved}</span>
              <span className="stat-label">Resolved</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📋</span>
              <span className="stat-value">{stats.assessmentsCompleted}</span>
              <span className="stat-label">Assessments</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">
                {stats.avgResponseTime !== null ? `${stats.avgResponseTime}m` : '--'}
              </span>
              <span className="stat-label">Avg Response</span>
            </div>
          </div>

          {/* Pending Breakdowns Warning */}
          {stats.breakdownsPending > 0 && (
            <div className="shift-summary-modal__pending-warning">
              <span className="pending-icon">⚠️</span>
              <span className="pending-text">
                {stats.breakdownsPending} breakdown{stats.breakdownsPending > 1 ? 's' : ''} still pending - ensure proper handover
              </span>
            </div>
          )}

          {/* Achievements Section */}
          {earnedAchievements.length > 0 && (
            <div className={`shift-summary-modal__achievements ${animationPhase >= 3 ? 'visible' : ''}`}>
              <h3 className="achievements-title">🏅 Achievements Earned</h3>
              <div className="achievements-grid">
                {earnedAchievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className="achievement-badge"
                    style={{ '--delay': `${index * 0.15}s` }}
                  >
                    <span className="achievement-icon">{achievement.icon}</span>
                    <div className="achievement-info">
                      <span className="achievement-title">{achievement.title}</span>
                      <span className="achievement-desc">{achievement.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shift Notes */}
          <div className={`shift-summary-modal__notes ${animationPhase >= 4 ? 'visible' : ''}`}>
            <label className="notes-label">
              <span className="notes-icon">📝</span>
              Add Shift Notes (Optional)
            </label>
            <textarea
              className="notes-input"
              placeholder="Any handover notes, issues encountered, or things to mention..."
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="shift-summary-modal__actions">
            <button
              className="shift-summary-modal__btn shift-summary-modal__btn--cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Continue Working
            </button>
            <button
              className="shift-summary-modal__btn shift-summary-modal__btn--confirm"
              onClick={handleConfirmEnd}
              disabled={isSubmitting}
              style={{ background: dutyTheme.gradient }}
            >
              {isSubmitting ? '⏳ Ending...' : '✓ End Shift'}
            </button>
          </div>

          {/* Footer */}
          <p className="shift-summary-modal__footer">
            Thank you for your hard work today! Your stats have been recorded.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftSummaryModal;
