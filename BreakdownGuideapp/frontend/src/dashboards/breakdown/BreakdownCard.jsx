import React from 'react';

const BreakdownCard = ({ 
  breakdown, 
  onDispatch,
  onUpdate,
  onEscalate,
  onResolve,
  onRequestETA
}) => {
  // Determine SLA status class
  const getSLAClass = () => {
    if (breakdown.slaStatus === 'breach') return 'sla-breach';
    if (breakdown.slaStatus === 'warning') return 'sla-warning';
    return '';
  };

  // Get progress percentage for timeline
  const getProgressPercentage = (stage) => {
    const stages = { 
      reported: 0, 
      acknowledged: 20, 
      dispatched: 40, 
      onSite: 60, 
      fixing: 80, 
      resolved: 100 
    };
    return stages[stage] || 0;
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch(severity?.toUpperCase()) {
      case 'STOP':
      case 'RED':
        return '#dc2626';
      case 'AMBER':
        return '#f59e0b';
      case 'CONTINUE':
      case 'GREEN':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // Timeline stages
  const timelineStages = [
    { key: 'reported', label: 'Reported' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'onSite', label: 'On Site' },
    { key: 'fixing', label: 'Fixing' },
    { key: 'resolved', label: 'Resolved' }
  ];

  return (
    <div className={`breakdown-card ${getSLAClass()}`} data-breakdown-id={breakdown.breakdown_id}>
      {/* Card Header */}
      <div className="card-header">
        <div className="card-header-top">
          <span className="fleet-number">Fleet {breakdown.fleet_no}</span>
          <div className="card-badges">
            {breakdown.is_priority && <span className="priority-badge">🚨 PRIORITY</span>}
            {breakdown.repeat_breakdown && <span className="repeat-flag">⚠️ REPEAT</span>}
            <span className="depot-badge">{breakdown.depot_id || 'Unknown'}</span>
          </div>
        </div>
      </div>
      
      {/* Progress Timeline */}
      <div className="progress-timeline">
        <div className="timeline-track">
          <div className="timeline-line">
            <div 
              className="timeline-progress" 
              style={{ width: `${getProgressPercentage(breakdown.currentStage)}%` }}
            ></div>
          </div>
          {timelineStages.map(stage => {
            let className = 'timeline-step';
            if (breakdown.timeline[stage.key]) {
              className += ' completed';
            }
            if (breakdown.currentStage === stage.key) {
              className += ' current';
            }
            
            return (
              <div key={stage.key} className={className}>
                <div className="timeline-label">{stage.label}</div>
                {breakdown.timeline[stage.key] && (
                  <div className="timeline-time">
                    {formatTime(new Date(breakdown.timeline[stage.key]))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Engineering Assignment */}
      {breakdown.engineerAssigned ? (
        <div className="engineering-assignment">
          <div className="assignment-info">
            <span className="team-badge">{breakdown.engineerAssigned.team}</span>
            <span className="engineer-name">{breakdown.engineerAssigned.engineer}</span>
          </div>
          {breakdown.engineerAssigned.eta ? (
            <span className="response-eta">ETA: {breakdown.engineerAssigned.eta}</span>
          ) : (
            <span className="response-eta" style={{ background: '#dcfce7', color: '#16a34a' }}>
              On Site
            </span>
          )}
        </div>
      ) : (
        <div className="engineering-assignment unassigned">
          <div className="assignment-info">
            <span className="team-badge">⚠️ No Engineer Assigned</span>
            <span className="engineer-name">Awaiting dispatch</span>
          </div>
          <button 
            className="btn btn-dispatch" 
            style={{ padding: '4px 12px', fontSize: '12px' }}
            onClick={() => onDispatch(breakdown.breakdown_id)}
          >
            Dispatch Now
          </button>
        </div>
      )}
      
      {/* Activity Feed */}
      <div className="activity-feed">
        {breakdown.activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <span className="activity-time">{activity.time}</span> - {activity.text}
          </div>
        ))}
      </div>
      
      {/* Card Body */}
      <div className="card-body">
        <div className="timer-section">
          <div className={`timer-box ${breakdown.totalElapsed > 60 ? 'critical' : ''}`}>
            <div className="timer-value">{breakdown.totalElapsed}</div>
            <div className="timer-label">Total Minutes</div>
          </div>
          <div className={`timer-box ${breakdown.totalElapsed > 30 && !breakdown.engineerAssigned ? 'critical' : ''}`}>
            <div className="timer-value">
              {breakdown.engineerAssigned ? 
                (breakdown.currentStage === 'onSite' || breakdown.currentStage === 'fixing' ? 0 : 
                Math.max(0, 30 - breakdown.totalElapsed)) : 
                breakdown.totalElapsed}
            </div>
            <div className="timer-label">Wait Time</div>
          </div>
        </div>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{breakdown.location || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Route</span>
            <span className="info-value">{breakdown.route_id || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Supervisor</span>
            <span className="info-value">{breakdown.supervisor_badge}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Severity</span>
            <span className="info-value" style={{ color: getSeverityColor(breakdown.severity) }}>
              {breakdown.severity}
            </span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="card-actions">
        {!breakdown.engineerAssigned ? (
          <button className="btn btn-dispatch" onClick={() => onDispatch(breakdown.breakdown_id)}>
            📞 Dispatch Engineer
          </button>
        ) : (
          <button className="btn btn-update" onClick={() => onRequestETA(breakdown.breakdown_id)}>
            🕐 Request ETA
          </button>
        )}
        <button className="btn btn-update" onClick={() => onUpdate(breakdown.breakdown_id)}>
          📝 Update Status
        </button>
        <button className="btn btn-escalate" onClick={() => onEscalate(breakdown.breakdown_id)}>
          ⚠️ Escalate
        </button>
        <button className="btn btn-resolve" onClick={() => onResolve(breakdown)}>
          ✅ Resolve
        </button>
      </div>

      <style jsx>{`
        .breakdown-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.3s;
          position: relative;
        }

        .breakdown-card.sla-warning {
          border: 2px solid #f59e0b;
        }

        .breakdown-card.sla-breach {
          border: 2px solid #ef4444;
          animation: pulse-border 2s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { border-color: #ef4444; }
          50% { border-color: #dc2626; }
        }
        
        .card-header {
          padding: 15px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .card-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .fleet-number {
          font-size: 22px;
          font-weight: bold;
          color: #1e3a8a;
        }

        .card-badges {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .depot-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .priority-badge {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .repeat-flag {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .progress-timeline {
          padding: 10px 15px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .timeline-track {
          display: flex;
          justify-content: space-between;
          position: relative;
          padding: 10px 0;
        }

        .timeline-step {
          flex: 1;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .timeline-step::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e5e7eb;
          border: 2px solid white;
        }

        .timeline-step.completed::before {
          background: #10b981;
        }

        .timeline-step.current::before {
          background: #f59e0b;
          animation: pulse 2s infinite;
        }

        .timeline-step.current::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #f59e0b;
          animation: pulse-ring 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }

        .timeline-label {
          font-size: 10px;
          color: #6b7280;
          margin-top: 20px;
        }

        .timeline-time {
          font-size: 9px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .timeline-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: #e5e7eb;
          z-index: 1;
        }

        .timeline-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #10b981;
          transition: width 0.3s;
        }
        
        .engineering-assignment {
          padding: 12px 15px;
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .engineering-assignment.unassigned {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }

        .assignment-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .team-badge {
          font-size: 13px;
          font-weight: 600;
          color: #92400e;
        }

        .engineer-name {
          font-size: 12px;
          color: #78350f;
        }

        .response-eta {
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: #dc2626;
        }
        
        .activity-feed {
          padding: 10px 15px;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
          max-height: 120px;
          overflow-y: auto;
        }

        .activity-feed::-webkit-scrollbar {
          width: 4px;
        }

        .activity-feed::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .activity-feed::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }

        .activity-item {
          font-size: 11px;
          color: #4b5563;
          padding: 3px 0;
          border-bottom: 1px dashed #e5e7eb;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-time {
          font-weight: bold;
          color: #1e3a8a;
        }
        
        .card-body {
          padding: 15px;
        }
        
        .timer-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .timer-box {
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          border-left: 3px solid #3b82f6;
        }

        .timer-box.critical {
          border-left-color: #ef4444;
          background: #fef2f2;
        }

        .timer-value {
          font-size: 18px;
          font-weight: bold;
          color: #1e3a8a;
        }

        .timer-box.critical .timer-value {
          color: #dc2626;
        }

        .timer-label {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          margin-top: 2px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 15px;
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
          font-size: 13px;
          color: #111827;
          font-weight: 500;
        }
        
        .card-actions {
          padding: 15px;
          background: #f9fafb;
          border-top: 2px solid #e5e7eb;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .btn {
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-dispatch {
          background: #f59e0b;
          color: white;
        }

        .btn-dispatch:hover {
          background: #d97706;
        }

        .btn-update {
          background: #3b82f6;
          color: white;
        }

        .btn-update:hover {
          background: #2563eb;
        }

        .btn-escalate {
          background: #ef4444;
          color: white;
        }

        .btn-escalate:hover {
          background: #dc2626;
        }

        .btn-resolve {
          background: #10b981;
          color: white;
        }

        .btn-resolve:hover {
          background: #059669;
        }

        @media (max-width: 640px) {
          .card-actions {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BreakdownCard;
