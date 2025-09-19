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


    </div>
  );
};

export default BreakdownCard;
