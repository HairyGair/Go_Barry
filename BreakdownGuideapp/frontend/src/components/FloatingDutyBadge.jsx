/**
 * FloatingDutyBadge Component
 * Persistent floating badge that appears when header scrolls out of view
 * Shows duty status with live countdown timer
 * Updated January 2026: Custom SVG badge icons
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DutyBadge as DutyBadgeIcon } from './icons/DutyBadgeIcons';
import './FloatingDutyBadge.css';

// Duty shift configurations
const DUTY_CONFIG = {
  '100': {
    name: 'Early',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)'
  },
  '200': {
    name: 'Day',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)'
  },
  '400': {
    name: 'Late',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #FCD34D)'
  },
  '500': {
    name: 'Night',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
  }
};

const FloatingDutyBadge = ({ currentDuty, onClick, scrollThreshold = 100 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [status, setStatus] = useState('active'); // active, warning, ending
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setIsVisible(scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!currentDuty || currentDuty.viewOnly || !currentDuty.endTime) return;

    const now = new Date();
    const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);
    const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);

    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);

    // Handle overnight shifts
    if (endTime < startTime) {
      if (now < endTime) {
        startTime.setDate(startTime.getDate() - 1);
      } else {
        endTime.setDate(endTime.getDate() + 1);
      }
    }

    const remaining = endTime - now;
    const remainingMinutes = Math.floor(remaining / (1000 * 60));
    const remainingHours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    if (remainingMinutes <= 0) {
      setTimeRemaining('Ended');
      setStatus('ended');
    } else if (remainingMinutes <= 10) {
      setTimeRemaining(`${remainingMinutes}m`);
      setStatus('ending');
    } else if (remainingMinutes <= 30) {
      setTimeRemaining(`${remainingMinutes}m`);
      setStatus('warning');
    } else if (remainingHours > 0) {
      setTimeRemaining(`${remainingHours}h ${mins}m`);
      setStatus('active');
    } else {
      setTimeRemaining(`${remainingMinutes}m`);
      setStatus('active');
    }
  }, [currentDuty]);

  useEffect(() => {
    if (!currentDuty || currentDuty.viewOnly || !currentDuty.endTime) return;

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [currentDuty, calculateTimeRemaining]);

  // Don't render if no duty, view-only mode, or not visible
  if (!currentDuty || currentDuty.viewOnly || !isVisible) {
    return null;
  }

  const dutyConfig = DUTY_CONFIG[currentDuty.code] || DUTY_CONFIG['200'];

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  return (
    <div
      className={`floating-duty-badge floating-duty-badge--${status} ${isExpanded ? 'floating-duty-badge--expanded' : ''}`}
      style={{
        '--duty-color': dutyConfig.color,
        '--duty-gradient': dutyConfig.gradient
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Duty ${currentDuty.code} - ${timeRemaining} remaining. Click to change duty.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Main Badge Content */}
      <div className="floating-duty-badge__main">
        <span className="floating-duty-badge__icon">
          <DutyBadgeIcon dutyCode={currentDuty.code} size={24} />
        </span>
        <span className="floating-duty-badge__code">{currentDuty.code}</span>
      </div>

      {/* Expanded Content */}
      <div className="floating-duty-badge__expanded">
        <span className="floating-duty-badge__name">{dutyConfig.name} Shift</span>
        <span className="floating-duty-badge__time">{timeRemaining}</span>
        <span className="floating-duty-badge__range">
          {currentDuty.startTime} - {currentDuty.endTime}
        </span>
      </div>

      {/* Countdown Indicator */}
      <div className={`floating-duty-badge__countdown floating-duty-badge__countdown--${status}`}>
        {status === 'ending' && '⚠️'}
        {status === 'warning' && '⏱️'}
        {status === 'active' && '●'}
        {status === 'ended' && '⏹️'}
      </div>
    </div>
  );
};

export default FloatingDutyBadge;
