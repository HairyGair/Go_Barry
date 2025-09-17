import React from 'react';

const SDCBreakdownCard = ({ 
  breakdown, 
  onAcknowledge, 
  onMakeDecision, 
  onRequestEngineering,
  animationDelay = 0
}) => {
  // Determine criticality class
  const getCriticalityClass = () => {
    return breakdown.criticality || 'normal';
  };
  
  // Get status icon
  const getStatusIcon = (stage) => {
    const icons = {
      received: '📨',
      acknowledged: '✅',
      decision: '📋',
      engineering: '🔧'
    };
    return icons[stage] || '❔';
  };

  // Create status steps
  const statusSteps = [
    { key: 'received', label: 'Received' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'decision', label: 'Decision' },
    { key: 'engineering', label: 'Engineering' }
  ];

  const currentIndex = statusSteps.findIndex(s => s.key === breakdown.currentStage);

  return (
    <div 
      className={`sdc-breakdown-card ${getCriticalityClass()}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Priority Badge */}
      {breakdown.isPriority && (
        <div className="priority-badge">
          <span>⚠️ Priority Route</span>
        </div>
      )}
      
      <div className="breakdown-header">
        <div className="fleet-info">
          <div className="fleet-number">Fleet {breakdown.fleet_no}</div>
          <div className="route-badge">
            Route <span className="route-id">{breakdown.route_id || 'N/A'}</span>
          </div>
        </div>
        <div className="breakdown-time">
          <div className="time-ring">
            <svg className="time-svg" viewBox="0 0 36 36">
              <circle className="time-bg" cx="18" cy="18" r="15.915" />
              <circle 
                className="time-progress" 
                cx="18" 
                cy="18" 
                r="15.915"
                style={{ strokeDashoffset: `${100 - (breakdown.elapsed / 60) * 100}` }}
              />
            </svg>
            <div className="time-value">
              <div className="time-elapsed">{breakdown.elapsed}</div>
              <div className="time-label">min</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="status-timeline">
        <div className="status-line">
          <div 
            className="status-line-progress" 
            style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
          />
        </div>
        {statusSteps.map((step, index) => {
          let className = 'status-step';
          if (index <= currentIndex) className += ' completed';
          if (index === currentIndex && breakdown.currentStage !== 'resolved') className += ' current';
          
          return (
            <div key={step.key} className={className}>
              <div className="step-icon">{getStatusIcon(step.key)}</div>
              <span className="status-label">{step.label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="breakdown-info">
        <div className="info-item">
          <span className="info-label">Location</span>
          <span className="info-value">{breakdown.location || 'Unknown'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Route</span>
          <span className={`info-value ${breakdown.isPriority ? 'route-priority' : ''}`}>
            {breakdown.route_id || 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Depot</span>
          <span className="info-value">{breakdown.depot_display || 'Unknown'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Supervisor</span>
          <span className="info-value">{breakdown.supervisor_badge || 'N/A'}</span>
        </div>
      </div>
      
      <div className="breakdown-actions">
        {breakdown.currentStage === 'received' && (
          <button 
            className="action-btn acknowledge" 
            onClick={() => onAcknowledge(breakdown.breakdown_id)}
          >
            ✓ Acknowledge
          </button>
        )}
        {breakdown.currentStage === 'acknowledged' && (
          <button 
            className="action-btn decision" 
            onClick={() => onMakeDecision(breakdown.breakdown_id)}
          >
            📋 Decision
          </button>
        )}
        {breakdown.currentStage === 'decision' && !breakdown.assigned_engineer_id && (
          <button 
            className="action-btn engineering" 
            onClick={() => onRequestEngineering(breakdown.breakdown_id)}
          >
            🔧 Engineering
          </button>
        )}
      </div>

      <style jsx>{`
        .sdc-breakdown-card {
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          animation: fadeInUp 0.6s both;
          box-shadow: 
            0 4px 20px rgba(0,0,0,0.04),
            0 2px 8px rgba(0,0,0,0.06),
            inset 0 2px 0 rgba(255,255,255,0.7);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sdc-breakdown-card:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 12px 40px rgba(0,0,0,0.08),
            0 4px 12px rgba(0,0,0,0.1),
            inset 0 2px 0 rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,1);
        }

        .sdc-breakdown-card.critical {
          background: 
            linear-gradient(135deg, rgba(254,242,242,0.98) 0%, rgba(254,226,226,0.95) 100%),
            radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.05) 0%, transparent 50%);
          border: 1px solid rgba(220,38,38,0.2);
          animation: fadeInUp 0.6s both, criticalPulse 3s infinite;
        }
        
        .sdc-breakdown-card.critical::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #dc2626, transparent);
          opacity: 0.6;
          animation: shimmer 2s infinite;
        }

        @keyframes criticalPulse {
          0%, 100% { 
            box-shadow: 
              0 4px 15px rgba(220,38,38,0.15),
              0 1px 3px rgba(220,38,38,0.1),
              inset 0 1px 0 rgba(255,255,255,0.5);
          }
          50% { 
            box-shadow: 
              0 8px 30px rgba(220,38,38,0.25),
              0 2px 6px rgba(220,38,38,0.15),
              inset 0 1px 0 rgba(255,255,255,0.5);
          }
        }

        .sdc-breakdown-card.warning {
          background: linear-gradient(135deg, rgba(255,251,235,0.98) 0%, rgba(254,243,199,0.95) 100%);
          border: 1px solid rgba(245,158,11,0.3);
        }

        .priority-badge {
          position: absolute;
          top: -12px;
          right: 24px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 
            0 4px 12px rgba(220,38,38,0.4),
            0 2px 4px rgba(220,38,38,0.2);
          animation: bounce 2s infinite;
          border: 1px solid rgba(255,255,255,0.2);
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes pulse-shadow {
          0%, 100% { box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2); }
          50% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4); }
        }

        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 20px;
        }

        .fleet-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fleet-number {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #1e293b, #334155);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .route-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .route-id {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          padding: 3px 10px;
          border-radius: 8px;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .breakdown-time {
          position: relative;
        }

        .time-ring {
          width: 60px;
          height: 60px;
          position: relative;
        }

        .time-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .time-bg {
          fill: none;
          stroke: #e5e7eb;
          stroke-width: 3;
        }

        .time-progress {
          fill: none;
          stroke: #dc2626;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 100;
          transition: stroke-dashoffset 0.3s;
        }

        .critical .time-progress {
          stroke: #dc2626;
        }

        .warning .time-progress {
          stroke: #f59e0b;
        }

        .normal .time-progress {
          stroke: #3b82f6;
        }

        .time-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .time-elapsed {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .time-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 2px;
        }
        
        .status-timeline {
          display: flex;
          justify-content: space-between;
          margin: 24px 0;
          padding: 20px;
          background: 
            linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.8) 100%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.02) 0%, transparent 50%);
          border: 1px solid rgba(226,232,240,0.3);
          border-radius: 16px;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
        }

        .status-step {
          flex: 1;
          text-align: center;
          position: relative;
          z-index: 2;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .status-step:hover {
          transform: translateY(-2px);
        }

        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          font-size: 18px;
          position: relative;
          transition: all 0.3s;
        }

        .status-step.completed .step-icon {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 2px 8px rgba(16,185,129,0.3);
        }

        .status-step.current .step-icon {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          animation: pulse 2s infinite;
          box-shadow: 0 2px 8px rgba(245,158,11,0.3);
        }

        .status-step.current .step-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid #f59e0b;
          border-radius: 50%;
          animation: ripple 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes ripple {
          0% { 
            opacity: 1;
            transform: scale(1);
          }
          100% { 
            opacity: 0;
            transform: scale(1.3);
          }
        }

        .status-label {
          font-size: 12px;
          color: #475569;
          font-weight: 500;
        }

        .status-step.completed .status-label {
          color: #10b981;
          font-weight: 600;
        }

        .status-step.current .status-label {
          color: #f59e0b;
          font-weight: 600;
        }

        .status-line {
          position: absolute;
          top: 32px;
          left: 16px;
          right: 16px;
          height: 3px;
          background: #e5e7eb;
          z-index: 1;
          border-radius: 2px;
          overflow: hidden;
        }

        .status-line-progress {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #f59e0b);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .breakdown-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 12px 0;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .info-value {
          font-size: 14px;
          color: #111827;
          font-weight: 500;
        }

        .info-value.route-priority {
          color: #dc2626;
          font-weight: bold;
        }
        
        .breakdown-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }

        .action-btn {
          padding: 12px 16px;
          border: 1px solid transparent;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .action-btn:hover::before {
          opacity: 1;
        }

        .action-btn.acknowledge {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          border-color: rgba(59, 130, 246, 0.2);
          box-shadow: 
            0 2px 8px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .action-btn.acknowledge:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 20px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.3);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .action-btn.decision {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          border-color: rgba(245, 158, 11, 0.2);
          box-shadow: 
            0 2px 8px rgba(245, 158, 11, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .action-btn.decision:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 20px rgba(245, 158, 11, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.3);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .action-btn.engineering {
          background: linear-gradient(135deg, #34d399, #10b981);
          color: white;
          border-color: rgba(16, 185, 129, 0.2);
          box-shadow: 
            0 2px 8px rgba(16, 185, 129, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .action-btn.engineering:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 20px rgba(16, 185, 129, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.3);
          border-color: rgba(16, 185, 129, 0.3);
        }

        @media (max-width: 640px) {
          .breakdown-info {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .breakdown-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCBreakdownCard;
