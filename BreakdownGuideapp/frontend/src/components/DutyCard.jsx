/**
 * DutyCard Component
 * Large duty status card for HomePage dashboard
 *
 * Features:
 * - Visual progress bar showing shift completion
 * - Live countdown timer
 * - Color-coded by duty type
 * - Shift statistics
 * - Warning states when ending soon
 * - Break time tracking (Phase 2.3)
 * - Updated January 2026: Custom SVG badge icons
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, AlertTriangle, Coffee, Pause, Play,
  Loader2, Utensils, Toilet, RefreshCw, Plus, Clock, Sparkles
} from 'lucide-react';
import { apiClient } from '../services/api-client.js';
import { DutyBadge as DutyBadgeIcon } from './icons/DutyBadgeIcons';
import './DutyCard.css';

// Duty shift definitions — brand teal family (green/amber are status colours
// and purple/blue are off-brand), so a duty card never reads as a warning
const DUTY_CONFIG = {
  '100': {
    name: 'Early Shift',
    color: '#26C6DA',
    gradient: 'linear-gradient(135deg, #00ACC1, #26C6DA)',
    bgGradient: 'linear-gradient(135deg, rgba(38, 198, 218, 0.15), rgba(38, 198, 218, 0.06))'
  },
  '200': {
    name: 'Day Shift',
    color: '#00BCD4',
    gradient: 'linear-gradient(135deg, #0097A7, #00BCD4)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 188, 212, 0.15), rgba(0, 188, 212, 0.06))'
  },
  '400': {
    name: 'Late Shift',
    color: '#00ACC1',
    gradient: 'linear-gradient(135deg, #00838F, #00ACC1)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 172, 193, 0.15), rgba(0, 172, 193, 0.06))'
  },
  '500': {
    name: 'Night Shift',
    color: '#4DD0E1',
    gradient: 'linear-gradient(135deg, #0097A7, #4DD0E1)',
    bgGradient: 'linear-gradient(135deg, rgba(77, 208, 225, 0.15), rgba(77, 208, 225, 0.06))'
  },
  'ENG': {
    name: 'Engineering Manager',
    color: '#0097A7',
    gradient: 'linear-gradient(135deg, #0097A7, #00BCD4)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 151, 167, 0.15), rgba(0, 188, 212, 0.08))'
  }
};

const DutyCard = ({ currentDuty, onChangeDuty, onStartHandover, onExtendShift, shiftStats = {}, supervisorInfo = {} }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('active'); // active, warning, ending, expired, overtime
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false); // Phase 8.1: Celebration animation
  const [previousProgress, setPreviousProgress] = useState(0); // Phase 8.1: Track progress for milestone detection

  // Phase 2.3: Break tracking state
  const [onBreak, setOnBreak] = useState(false);
  const [currentBreakMinutes, setCurrentBreakMinutes] = useState(0);
  const [totalBreakMinutesToday, setTotalBreakMinutesToday] = useState(0);
  const [breakLoading, setBreakLoading] = useState(false);
  const [showBreakTypeMenu, setShowBreakTypeMenu] = useState(false);

  // Phase 2.3: Fetch break status on mount and periodically
  const fetchBreakStatus = useCallback(async () => {
    if (!supervisorInfo?.id) return;
    try {
      const response = await apiClient.get(`/api/breaks/status/${supervisorInfo.id}`);
      if (response.success) {
        setOnBreak(response.onBreak);
        setCurrentBreakMinutes(response.currentBreakMinutes || 0);
        setTotalBreakMinutesToday(response.totalBreakMinutesToday || 0);
      }
    } catch (error) {
      console.error('Failed to fetch break status:', error);
    }
  }, [supervisorInfo?.id]);

  useEffect(() => {
    fetchBreakStatus();
    // Refresh break status every 30 seconds
    const interval = setInterval(fetchBreakStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchBreakStatus]);

  // Phase 2.3: Update break timer every minute when on break
  useEffect(() => {
    if (!onBreak) return;
    const interval = setInterval(() => {
      setCurrentBreakMinutes(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [onBreak]);

  // Phase 2.3: Start break
  const handleStartBreak = async (breakType = 'other') => {
    if (!supervisorInfo?.id || !currentDuty?.code) return;
    setBreakLoading(true);
    setShowBreakTypeMenu(false);
    try {
      const response = await apiClient.post('/api/breaks/start', {
        supervisorId: supervisorInfo.id,
        supervisorBadge: supervisorInfo.badge_number,
        supervisorName: supervisorInfo.name,
        dutyCode: currentDuty.code,
        breakType
      });
      if (response.success) {
        setOnBreak(true);
        setCurrentBreakMinutes(0);
      }
    } catch (error) {
      console.error('Failed to start break:', error);
    } finally {
      setBreakLoading(false);
    }
  };

  // Phase 2.3: End break
  const handleEndBreak = async () => {
    if (!supervisorInfo?.id) return;
    setBreakLoading(true);
    try {
      const response = await apiClient.post('/api/breaks/end', {
        supervisorId: supervisorInfo.id,
        supervisorBadge: supervisorInfo.badge_number,
        supervisorName: supervisorInfo.name
      });
      if (response.success) {
        setOnBreak(false);
        setTotalBreakMinutesToday(prev => prev + (response.durationMinutes || 0));
        setCurrentBreakMinutes(0);
      }
    } catch (error) {
      console.error('Failed to end break:', error);
    } finally {
      setBreakLoading(false);
    }
  };

  useEffect(() => {
    if (!currentDuty || currentDuty.viewOnly || !currentDuty.startTime || !currentDuty.endTime) return;

    const updateProgress = () => {
      const now = new Date();

      // Parse start and end times
      const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);
      const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);

      const startTime = new Date();
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts
      if (endTime < startTime) {
        if (now < endTime) {
          startTime.setDate(startTime.getDate() - 1);
        } else {
          endTime.setDate(endTime.getDate() + 1);
        }
      }

      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const remaining = endTime - now;

      // Calculate progress percentage
      const progressPercent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

      // Phase 8.1: Detect shift completion for celebration
      if (progressPercent >= 100 && previousProgress < 100) {
        setShowCelebration(true);
        // Hide celebration after 3 seconds
        setTimeout(() => setShowCelebration(false), 3000);
      }
      setPreviousProgress(progressPercent);
      setProgress(progressPercent);

      // Calculate time remaining
      const remainingMinutes = Math.floor(remaining / (1000 * 60));
      const remainingHours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;

      if (remainingMinutes <= 0) {
        // Calculate overtime
        const overtime = Math.abs(remainingMinutes);
        setOvertimeMinutes(overtime);
        const overtimeHours = Math.floor(overtime / 60);
        const overtimeMins = overtime % 60;

        if (overtime >= 30) {
          // 30+ minutes overtime - critical alert
          setTimeRemaining(overtimeHours > 0 ? `${overtimeHours}h ${overtimeMins}m overtime!` : `${overtime}m overtime!`);
          setStatus('overtime');
        } else if (overtime > 0) {
          // Less than 30 minutes overtime
          setTimeRemaining(`${overtime}m overtime`);
          setStatus('expired');
        } else {
          setTimeRemaining('Shift Ended');
          setStatus('expired');
        }
      } else if (remainingMinutes <= 10) {
        setTimeRemaining(`${remainingMinutes}m remaining`);
        setStatus('ending');
      } else if (remainingMinutes <= 30) {
        setTimeRemaining(`${remainingMinutes}m remaining`);
        setStatus('warning');
      } else if (remainingHours > 0) {
        setTimeRemaining(`${remainingHours}h ${mins}m remaining`);
        setStatus('active');
      } else {
        setTimeRemaining(`${remainingMinutes}m remaining`);
        setStatus('active');
      }
    };

    updateProgress();
    const timer = setInterval(updateProgress, 1000);
    return () => clearInterval(timer);
  }, [currentDuty]);

  if (!currentDuty || currentDuty.viewOnly) {
    return (
      <div className="duty-card duty-card--empty">
        <div className="duty-card__empty-content">
          <span className="duty-card__empty-icon"><ClipboardList size={32} strokeWidth={1.5} /></span>
          <h3>{currentDuty?.viewOnly ? 'View Only Mode' : 'No Active Duty'}</h3>
          <p>{currentDuty?.viewOnly ? 'You are browsing in view-only mode' : 'Select a duty shift to get started'}</p>
          {onChangeDuty && !currentDuty?.viewOnly && (
            <button className="duty-card__select-btn" onClick={onChangeDuty}>
              Select Duty
            </button>
          )}
        </div>
      </div>
    );
  }

  const dutyConfig = DUTY_CONFIG[currentDuty.code] || DUTY_CONFIG['200'];

  return (
    <div
      className={`duty-card duty-card--${status} ${showCelebration ? 'duty-card--completed' : ''}`}
      style={{
        '--duty-color': dutyConfig.color,
        '--duty-gradient': dutyConfig.gradient,
        '--duty-bg-gradient': dutyConfig.bgGradient
      }}
    >
      {/* Phase 8.1: Celebration Confetti */}
      {showCelebration && (
        <div className="duty-card__celebration">
          <div className="duty-card__confetti"></div>
          <div className="duty-card__confetti"></div>
          <div className="duty-card__confetti"></div>
          <div className="duty-card__confetti"></div>
          <div className="duty-card__confetti"></div>
          <div className="duty-card__confetti"></div>
        </div>
      )}
      {/* Header */}
      <div className="duty-card__header">
        <div className="duty-card__icon-wrapper">
          <span className="duty-card__icon">
            <DutyBadgeIcon dutyCode={currentDuty.code} size={48} />
          </span>
        </div>
        <div className="duty-card__title-group">
          <h3 className="duty-card__title">Duty {currentDuty.code}</h3>
          <span className="duty-card__subtitle">{dutyConfig.name}</span>
        </div>
        <div className={`duty-card__status duty-card__status--${status}`}>
          <span className="duty-card__status-dot" />
          {status === 'active' && 'Active'}
          {status === 'warning' && 'Ending Soon'}
          {status === 'ending' && 'Almost Done'}
          {status === 'expired' && 'Ended'}
          {status === 'overtime' && 'Overtime'}
        </div>
      </div>

      {/* Progress Section */}
      <div className="duty-card__progress-section">
        <div className="duty-card__time-info">
          <span className="duty-card__time-start">{currentDuty.startTime}</span>
          <span className="duty-card__time-remaining">{timeRemaining}</span>
          <span className="duty-card__time-end">{currentDuty.endTime}</span>
        </div>
        <div className="duty-card__progress-track">
          <div
            className="duty-card__progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div
            className="duty-card__progress-marker"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="duty-card__progress-labels">
          <span>Start</span>
          <span>{Math.round(progress)}% complete</span>
          <span>End</span>
        </div>
      </div>

      {/* Stats Section */}
      <div className="duty-card__stats">
        <div className="duty-card__stat">
          <span className="duty-card__stat-value">
            {shiftStats.breakdownsHandled || 0}
            {shiftStats.comparison?.trend && (
              <span className={`duty-card__trend duty-card__trend--${shiftStats.comparison.trend}`}>
                {shiftStats.comparison.trend === 'above' ? '↑' :
                 shiftStats.comparison.trend === 'below' ? '↓' : '→'}
              </span>
            )}
          </span>
          <span className="duty-card__stat-label">Breakdowns</span>
        </div>
        <div className="duty-card__stat">
          <span className="duty-card__stat-value">{shiftStats.assessments || 0}</span>
          <span className="duty-card__stat-label">Assessments</span>
        </div>
        <div className="duty-card__stat">
          <span className="duty-card__stat-value">
            {shiftStats.avgResponse !== null && shiftStats.avgResponse !== undefined
              ? `${shiftStats.avgResponse}m`
              : '--'}
          </span>
          <span className="duty-card__stat-label">Avg Response</span>
        </div>
        <div className="duty-card__stat">
          <span className={`duty-card__stat-value duty-card__stat-value--${shiftStats.performance || 'good'}`}>
            {shiftStats.resolutionRate || 100}%
          </span>
          <span className="duty-card__stat-label">Resolved</span>
        </div>
      </div>

      {/* Phase 2.3: Break Section */}
      <div className={`duty-card__break-section ${onBreak ? 'duty-card__break-section--active' : ''}`}>
        <div className="duty-card__break-info">
          <span className="duty-card__break-icon">{onBreak ? <Coffee size={20} /> : <Pause size={20} />}</span>
          <div className="duty-card__break-details">
            {onBreak ? (
              <>
                <span className="duty-card__break-status">On Break</span>
                <span className="duty-card__break-timer">{currentBreakMinutes}m elapsed</span>
              </>
            ) : (
              <>
                <span className="duty-card__break-status">Break Time</span>
                <span className="duty-card__break-timer">
                  {totalBreakMinutesToday > 0 ? `${totalBreakMinutesToday}m today` : 'No breaks yet'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="duty-card__break-actions">
          {onBreak ? (
            <button
              className="duty-card__break-btn duty-card__break-btn--end"
              onClick={handleEndBreak}
              disabled={breakLoading}
            >
              {breakLoading ? <Loader2 size={14} className="duty-card__spin" /> : <Play size={14} />} End Break
            </button>
          ) : (
            <div className="duty-card__break-menu-wrapper">
              <button
                className="duty-card__break-btn duty-card__break-btn--start"
                onClick={() => setShowBreakTypeMenu(!showBreakTypeMenu)}
                disabled={breakLoading || status === 'expired' || status === 'overtime'}
              >
                {breakLoading ? <Loader2 size={14} className="duty-card__spin" /> : <Coffee size={14} />} Take Break
              </button>
              {showBreakTypeMenu && (
                <div className="duty-card__break-menu">
                  <button
                    className="duty-card__break-menu-btn"
                    onClick={() => handleStartBreak('meal')}
                    disabled={breakLoading}
                  >
                    <Utensils size={14} /> Meal Break
                  </button>
                  <button
                    className="duty-card__break-menu-btn"
                    onClick={() => handleStartBreak('comfort')}
                    disabled={breakLoading}
                  >
                    <Toilet size={14} /> Comfort Break
                  </button>
                  <button
                    className="duty-card__break-menu-btn"
                    onClick={() => handleStartBreak('other')}
                    disabled={breakLoading}
                  >
                    <Pause size={14} /> Other Break
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {currentBreakMinutes > 60 && onBreak && (
          <div className="duty-card__break-warning">
            <AlertTriangle size={13} /> Break exceeds 1 hour
          </div>
        )}
      </div>

      {/* Performance Indicator */}
      {shiftStats.performance && shiftStats.performance !== 'good' && (
        <div className={`duty-card__performance duty-card__performance--${shiftStats.performance}`}>
          {shiftStats.performance === 'excellent' && (
            <><Sparkles size={14} /> Excellent shift performance!</>
          )}
          {shiftStats.performance === 'needs-attention' && (
            <><AlertTriangle size={14} /> High severity incidents this shift</>
          )}
        </div>
      )}

      {/* Overtime Alert Banner */}
      {status === 'overtime' && (
        <div className="duty-card__overtime-alert">
          <span className="duty-card__overtime-icon"><Clock size={22} /></span>
          <div className="duty-card__overtime-message">
            <strong>You are working {overtimeMinutes}+ minutes overtime!</strong>
            <span>Please end your shift or request an extension.</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="duty-card__actions">
        {/* Handover button - shows when shift is ending, expired, or overtime */}
        {onStartHandover && (status === 'warning' || status === 'ending' || status === 'expired' || status === 'overtime') && (
          <button
            className="duty-card__action-btn duty-card__action-btn--handover"
            onClick={onStartHandover}
          >
            <RefreshCw size={14} /> Start Handover
          </button>
        )}
        {/* Extend shift button - shows during overtime */}
        {onExtendShift && status === 'overtime' && (
          <button
            className="duty-card__action-btn duty-card__action-btn--extend"
            onClick={onExtendShift}
          >
            <Plus size={14} /> Extend Shift
          </button>
        )}
        {onChangeDuty && (
          <button className="duty-card__action-btn" onClick={onChangeDuty}>
            {status === 'overtime' ? 'End Shift' : 'Change Duty'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DutyCard;
