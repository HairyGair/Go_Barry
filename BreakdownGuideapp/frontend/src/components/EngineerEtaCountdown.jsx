import React, { useState, useEffect } from 'react';
import './EngineerEtaCountdown.css';

const EngineerEtaCountdown = ({ dispatchedAt, etaMinutes, onSite, compact = true }) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!dispatchedAt || !etaMinutes || onSite) return;

    const expectedArrival = new Date(dispatchedAt).getTime() + etaMinutes * 60000;

    const tick = () => {
      const now = Date.now();
      const diffMs = expectedArrival - now;
      setRemaining(Math.round(diffMs / 60000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dispatchedAt, etaMinutes, onSite]);

  // Don't render if engineer is on site or no data
  if (onSite || !dispatchedAt || !etaMinutes) return null;
  if (remaining === null) return null;

  // Determine urgency level
  let level;
  if (remaining <= 0) {
    level = 'overdue';
  } else if (remaining <= 5) {
    level = 'critical';
  } else if (remaining <= 10) {
    level = 'warning';
  } else {
    level = 'normal';
  }

  // Format display text
  let timeText;
  if (remaining <= 0) {
    const overdueMins = Math.abs(remaining);
    timeText = overdueMins === 0 ? 'OVERDUE' : `+${overdueMins}m OVERDUE`;
  } else if (remaining >= 60) {
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    timeText = `${h}h ${m}m`;
  } else {
    timeText = `${remaining}m`;
  }

  return (
    <span className={`eta-countdown eta-${level} ${compact ? '' : 'full'}`}>
      <span className="eta-label">ETA</span>
      <span className="eta-time">{timeText}</span>
    </span>
  );
};

export default EngineerEtaCountdown;
