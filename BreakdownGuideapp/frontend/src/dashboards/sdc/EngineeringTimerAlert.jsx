import React, { useState, useEffect } from 'react';

/**
 * EngineeringTimerAlert - Shows countdown timers for engineering response
 * Displays target response times for STOP (15 mins) and AMBER (30 mins) decisions
 */
const EngineeringTimerAlert = ({ engineeringTimers }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Convert Map to array and filter active timers
  const activeTimers = Array.from(engineeringTimers.entries())
    .map(([breakdownId, timer]) => ({
      breakdownId,
      ...timer,
      elapsed: currentTime - timer.startTime,
      remaining: Math.max(0, timer.targetTime - (currentTime - timer.startTime))
    }))
    .filter(timer => timer.remaining > 0)
    .sort((a, b) => a.remaining - b.remaining); // Sort by most urgent first

  if (activeTimers.length === 0) return null;

  // Format time display
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get urgency class
  const getUrgencyClass = (timer) => {
    const percentRemaining = (timer.remaining / timer.targetTime) * 100;
    if (percentRemaining <= 10) return 'critical';
    if (percentRemaining <= 25) return 'urgent';
    if (percentRemaining <= 50) return 'warning';
    return 'normal';
  };

  return (
    <div className="engineering-timer-alert">
      <div className="timer-header">
        <span className="timer-icon">⏰</span>
        <h3>Engineering Response Timers</h3>
        <span className="timer-count">{activeTimers.length} active</span>
      </div>

      <div className="timer-list">
        {activeTimers.map(timer => {
          const urgencyClass = getUrgencyClass(timer);
          const percentComplete = ((timer.targetTime - timer.remaining) / timer.targetTime) * 100;

          return (
            <div key={timer.breakdownId} className={`timer-item ${urgencyClass}`}>
              <div className="timer-main">
                <div className="timer-info">
                  <div className="breakdown-ref">
                    <span className="breakdown-id">{timer.breakdownId}</span>
                    <span className="fleet-number">Fleet {timer.fleet}</span>
                  </div>
                  <div className="decision-badge">
                    <span className={`decision ${timer.decision.toLowerCase()}`}>
                      {timer.decision === 'STOP' ? '🛑 STOP' : '⚠️ AMBER'}
                    </span>
                  </div>
                </div>

                <div className="timer-display">
                  <div className="time-remaining">
                    <span className="time-value">{formatTime(timer.remaining)}</span>
                    <span className="time-label">remaining</span>
                  </div>
                  <div className="target-time">
                    Target: {timer.decision === 'STOP' ? '15' : '30'} mins
                  </div>
                </div>
              </div>

              <div className="timer-progress">
                <div 
                  className="progress-bar"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              {urgencyClass === 'critical' && (
                <div className="critical-alert">
                  <span className="alert-icon">🚨</span>
                  <span className="alert-text">IMMEDIATE ATTENTION REQUIRED</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .engineering-timer-alert {
          background: linear-gradient(135deg, 
            rgba(239, 68, 68, 0.05) 0%, 
            rgba(220, 38, 38, 0.02) 100%
          );
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          backdrop-filter: blur(10px);
          animation: alertPulse 3s infinite;
        }

        @keyframes alertPulse {
          0%, 100% { 
            border-color: rgba(239, 68, 68, 0.2);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.1);
          }
          50% { 
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
          }
        }

        .timer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(239, 68, 68, 0.1);
        }

        .timer-icon {
          font-size: 20px;
          animation: tick 1s infinite;
        }

        @keyframes tick {
          0%, 50% { transform: rotate(0deg); }
          75% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }

        .timer-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #dc2626;
          margin: 0;
          flex: 1;
        }

        .timer-count {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }

        .timer-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timer-item {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .timer-item.normal {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .timer-item.warning {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(254, 243, 199, 0.3);
        }

        .timer-item.urgent {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(254, 226, 226, 0.4);
          animation: urgentPulse 2s infinite;
        }

        .timer-item.critical {
          border-color: rgba(220, 38, 38, 0.6);
          background: rgba(254, 226, 226, 0.6);
          animation: criticalFlash 1s infinite;
        }

        @keyframes urgentPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes criticalFlash {
          0%, 50%, 100% { 
            background: rgba(254, 226, 226, 0.6);
            border-color: rgba(220, 38, 38, 0.6);
          }
          25%, 75% { 
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.8);
          }
        }

        .timer-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .timer-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .breakdown-ref {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breakdown-id {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .fleet-number {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
        }

        .decision-badge {
          display: flex;
          align-items: center;
        }

        .decision {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .decision.stop {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }

        .decision.amber {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .timer-display {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .time-remaining {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .time-value {
          font-size: 24px;
          font-weight: 800;
          color: #dc2626;
          font-family: 'Monaco', 'Consolas', monospace;
          line-height: 1;
        }

        .time-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .target-time {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
        }

        .timer-progress {
          height: 6px;
          background: rgba(229, 231, 235, 0.5);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
          border-radius: 3px;
          transition: width 1s ease;
          position: relative;
        }

        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .critical-alert {
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: criticalAlert 1s infinite;
        }

        @keyframes criticalAlert {
          0%, 100% { background: rgba(220, 38, 38, 0.1); }
          50% { background: rgba(220, 38, 38, 0.2); }
        }

        .alert-icon {
          font-size: 16px;
          animation: flash 0.5s infinite;
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .alert-text {
          font-size: 12px;
          font-weight: 700;
          color: #dc2626;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .timer-main {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .timer-display {
            align-items: center;
          }

          .time-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default EngineeringTimerAlert;