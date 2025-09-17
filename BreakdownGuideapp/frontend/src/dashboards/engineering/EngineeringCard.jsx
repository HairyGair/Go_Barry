import React from 'react';

const EngineeringCard = ({ breakdown, onShowEngineerModal, onAutoAssign, onUpdateStatus }) => {
  const { assignment, totalElapsed, waitTime, timeStatus, currentStage, isPriority } = breakdown;
  const engineer = assignment?.engineer;

  // Format depot name
  const formatDepotName = (depot) => {
    const names = {
      'WASHINGTON': 'Washington',
      'RIVERSIDE': 'Riverside', 
      'PERCY_MAIN': 'Percy Main',
      'CONSETT': 'Consett',
      'DEPTFORD': 'Deptford',
      'HEXHAM': 'Hexham'
    };
    return names[depot] || depot || 'Unknown';
  };

  // Format status
  const formatStatus = (status) => {
    const statuses = {
      'assigned': 'Assigned',
      'dispatched': 'Dispatched',
      'on_site': 'On Site',
      'repairing': 'Repairing',
      'completed': 'Completed'
    };
    return statuses[status] || status;
  };

  // Get progress percentage
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

  // Timeline stages
  const timelineStages = [
    { key: 'reported', label: 'Reported' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'onSite', label: 'On Site' },
    { key: 'fixing', label: 'Fixing' },
    { key: 'resolved', label: 'Resolved' }
  ];

  // Show overdue badge if over 30 minutes
  const overdueBadge = totalElapsed > 30 ? 
    `⚠️ OVERDUE ${totalElapsed}m` : '';

  return (
    <div className={`breakdown-card ${timeStatus} ${isPriority ? 'priority' : ''}`}>
      {overdueBadge && (
        <div className="overdue-badge">{overdueBadge}</div>
      )}
      
      {/* Card Header */}
      <div className="card-header">
        <div className="card-header-top">
          <span className="fleet-number">Fleet {breakdown.fleet_no}</span>
          <div className="card-badges">
            {isPriority && <span className="priority-badge">🚨 PRIORITY</span>}
            {breakdown.repeat_breakdown && <span className="repeat-flag">⚠️ REPEAT</span>}
            <span className="depot-badge">{formatDepotName(breakdown.depot_id)}</span>
          </div>
        </div>
      </div>
      
      {/* Progress Timeline */}
      <div className="progress-timeline">
        <div className="timeline-track">
          <div className="timeline-line">
            <div 
              className="timeline-progress" 
              style={{ width: `${getProgressPercentage(currentStage)}%` }}
            ></div>
          </div>
          {timelineStages.map((stage, index) => {
            let className = 'timeline-step';
            const currentStageIndex = timelineStages.findIndex(s => s.key === currentStage);
            if (index <= currentStageIndex) {
              className += ' completed';
            }
            if (index === currentStageIndex && currentStage !== 'resolved') {
              className += ' current';
            }
            
            return (
              <div key={stage.key} className={className}>
                <div className="timeline-label">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Engineering Assignment */}
      {engineer ? (
        <div className="engineering-assignment">
          <div className="assignment-info">
            <span className="team-badge">{formatDepotName(engineer.depot_id)} Engineering</span>
            <span className="engineer-name">{engineer.name} ({engineer.badge_number})</span>
            <span className="engineer-phone">📞 {engineer.phone || 'No phone'}</span>
          </div>
          {assignment.status !== 'on_site' && assignment.status !== 'repairing' ? (
            <span className="response-eta">Status: {formatStatus(assignment.status)}</span>
          ) : (
            <span className="response-eta on-site">On Site</span>
          )}
        </div>
      ) : (
        <div className="engineering-assignment unassigned">
          <div className="assignment-info">
            <span className="team-badge">⚠️ No Engineer Assigned</span>
            <span className="engineer-name">Awaiting dispatch</span>
          </div>
          <button 
            className="btn btn-auto-assign" 
            onClick={() => onAutoAssign(breakdown.breakdown_id, breakdown.depot_id)}
          >
            🤖 Auto-Assign
          </button>
        </div>
      )}
      
      {/* Card Body */}
      <div className="card-body">
        <div className="timer-section">
          <div className={`timer-box ${totalElapsed > 45 ? 'critical' : totalElapsed > 30 ? 'warning' : ''}`}>
            <div className="timer-value">{totalElapsed}</div>
            <div className="timer-label">Total Minutes</div>
          </div>
          <div className={`timer-box ${waitTime > 30 && !assignment ? 'critical' : waitTime > 20 ? 'warning' : ''}`}>
            <div className="timer-value">{waitTime}</div>
            <div className="timer-label">{assignment ? 'Response Time' : 'Wait Time'}</div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="card-actions">
        {!assignment ? (
          <>
            <button 
              className="btn btn-dispatch" 
              onClick={() => onShowEngineerModal(breakdown.breakdown_id, breakdown.depot_id)}
            >
              📞 Assign Engineer
            </button>
            <button 
              className="btn btn-auto-assign" 
              onClick={() => onAutoAssign(breakdown.breakdown_id, breakdown.depot_id)}
            >
              🤖 Auto-Assign
            </button>
          </>
        ) : assignment.status !== 'on_site' && assignment.status !== 'repairing' ? (
          <>
            <button 
              className="btn btn-update" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'dispatched')}
            >
              🚗 Mark Dispatched
            </button>
            <button 
              className="btn btn-update" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'on_site')}
            >
              📍 Mark On Site
            </button>
          </>
        ) : assignment.status === 'on_site' ? (
          <>
            <button 
              className="btn btn-update" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'repairing')}
            >
              🔧 Start Repair
            </button>
            <button 
              className="btn btn-resolve" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'completed')}
            >
              ✅ Complete
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn btn-resolve" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'completed')}
            >
              ✅ Complete Repair
            </button>
            <button 
              className="btn btn-update" 
              onClick={() => onShowEngineerModal(breakdown.breakdown_id, breakdown.depot_id)}
            >
              📝 Request Update
            </button>
          </>
        )}
      </div>

      <style>{`
        .breakdown-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.3s;
          position: relative;
          border: 2px solid transparent;
        }
        
        .breakdown-card.overdue {
          border: 2px solid #ef4444;
          background: #fef2f2;
          animation: pulse-border 2s infinite;
        }
        
        .breakdown-card.warning {
          border: 2px solid #f59e0b;
          background: #fffbeb;
        }
        
        .breakdown-card.priority {
          border-top: 4px solid #dc2626;
        }
        
        @keyframes pulse-border {
          0%, 100% { 
            border-color: #ef4444;
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% { 
            border-color: #dc2626;
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }
        
        .overdue-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ef4444;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          animation: blink 2s infinite;
          z-index: 10;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
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
          color: #065f46;
        }
        
        .engineer-name {
          font-size: 12px;
          color: #047857;
        }
        
        .engineer-phone {
          font-size: 11px;
          color: #059669;
        }
        
        .response-eta {
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: #dc2626;
        }
        
        .response-eta.on-site {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .card-body {
          padding: 15px;
        }
        
        .timer-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
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
        
        .timer-box.warning {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }
        
        .timer-value {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
        }
        
        .timer-box.critical .timer-value {
          color: #dc2626;
        }
        
        .timer-box.warning .timer-value {
          color: #f59e0b;
        }
        
        .timer-label {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          margin-top: 2px;
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
        
        .btn-auto-assign {
          background: #8b5cf6;
          color: white;
          padding: 4px 12px;
          font-size: 12px;
        }
        
        .btn-auto-assign:hover {
          background: #7c3aed;
        }
        
        .btn-update {
          background: #3b82f6;
          color: white;
        }
        
        .btn-update:hover {
          background: #2563eb;
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
        }
      `}</style>
    </div>
  );
};

export default EngineeringCard;
