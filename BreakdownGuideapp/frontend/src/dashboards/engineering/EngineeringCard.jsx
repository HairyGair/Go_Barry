import React from 'react';
import { theme, getStatusColor } from '@styles/theme';

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
        <div className="engineering-assignment assigned">
          <div className="assignment-info">
            <span className="team-badge">{formatDepotName(engineer.depot_id)} Engineering</span>
            <span className="engineer-name">{engineer.name} ({engineer.badge_number})</span>
            <span className="engineer-phone">📞 {engineer.phone || 'No phone'}</span>
          </div>
          {assignment.status !== 'on_site' && assignment.status !== 'repairing' ? (
            <span className="response-eta">{formatStatus(assignment.status)}</span>
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
              className="theme-btn theme-btn-primary" 
              onClick={() => onShowEngineerModal(breakdown.breakdown_id, breakdown.depot_id)}
            >
              📞 Assign Engineer
            </button>
            <button 
              className="theme-btn theme-btn-secondary" 
              onClick={() => onAutoAssign(breakdown.breakdown_id, breakdown.depot_id)}
            >
              🤖 Auto-Assign
            </button>
          </>
        ) : assignment.status !== 'on_site' && assignment.status !== 'repairing' ? (
          <>
            <button 
              className="theme-btn theme-btn-primary" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'dispatched')}
            >
              🚗 Mark Dispatched
            </button>
            <button 
              className="theme-btn theme-btn-secondary" 
              onClick={() => onUpdateStatus(assignment.assignment_id, 'on_site')}
            >
              📍 Mark On Site
            </button>
          </>
        ) : assignment.status === 'on_site' ? (
          <>
            <button 
              className="theme-btn theme-btn-primary" 
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
              className="theme-btn theme-btn-secondary" 
              onClick={() => onShowEngineerModal(breakdown.breakdown_id, breakdown.depot_id)}
            >
              📝 Request Update
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .breakdown-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          transition: all var(--transition-normal);
          position: relative;
          border: 1px solid var(--border);
        }
        
        .breakdown-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        
        .breakdown-card.overdue {
          border: 2px solid var(--color-danger);
          animation: pulse-border 2s infinite;
        }
        
        .breakdown-card.warning {
          border: 2px solid var(--color-warning);
        }
        
        .breakdown-card.priority {
          border-top: 4px solid var(--color-primary);
        }
        
        @keyframes pulse-border {
          0%, 100% { 
            border-color: var(--color-danger);
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
          }
          50% { 
            border-color: var(--color-primary);
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
          }
        }
        
        .overdue-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: var(--color-danger);
          color: white;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: bold;
          animation: blink 2s infinite;
          z-index: 10;
          text-transform: uppercase;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .card-header {
          padding: 15px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
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
          color: var(--text-primary);
        }
        
        .card-badges {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        
        .depot-badge {
          background: rgba(30, 64, 175, 0.2);
          color: var(--color-info);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
        }
        
        .priority-badge {
          background: rgba(255, 152, 0, 0.2);
          color: var(--color-amber);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
        }
        
        .repeat-flag {
          background: rgba(220, 53, 69, 0.2);
          color: var(--color-danger);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .progress-timeline {
          padding: 10px 15px;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
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
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
        }
        
        .timeline-step.completed::before {
          background: var(--color-success);
          border-color: var(--color-success);
        }
        
        .timeline-step.current::before {
          background: var(--color-warning);
          border-color: var(--color-warning);
          animation: pulse 2s infinite;
        }
        
        .timeline-step.current::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--color-warning);
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
          color: var(--text-secondary);
          margin-top: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .timeline-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--border);
          z-index: 1;
        }
        
        .timeline-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--color-success);
          transition: width var(--transition-normal);
        }
        
        .engineering-assignment {
          padding: 12px 15px;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .engineering-assignment.assigned {
          background: rgba(40, 167, 69, 0.1);
        }
        
        .engineering-assignment.unassigned {
          background: rgba(220, 53, 69, 0.1);
        }
        
        .assignment-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .team-badge {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .engineer-name {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .engineer-phone {
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .response-eta {
          background: var(--bg-tertiary);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: bold;
          color: var(--color-warning);
          border: 1px solid var(--border);
        }
        
        .response-eta.on-site {
          background: rgba(40, 167, 69, 0.2);
          color: var(--color-success);
          border-color: var(--color-success);
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
          background: var(--bg-primary);
          padding: 10px;
          border-radius: var(--radius-md);
          text-align: center;
          border: 1px solid var(--border);
          border-left: 3px solid var(--color-info);
        }
        
        .timer-box.critical {
          border-left-color: var(--color-danger);
          background: rgba(220, 53, 69, 0.1);
        }
        
        .timer-box.warning {
          border-left-color: var(--color-warning);
          background: rgba(255, 193, 7, 0.1);
        }
        
        .timer-value {
          font-size: 24px;
          font-weight: bold;
          color: var(--text-primary);
        }
        
        .timer-box.critical .timer-value {
          color: var(--color-danger);
        }
        
        .timer-box.warning .timer-value {
          color: var(--color-warning);
        }
        
        .timer-label {
          font-size: 10px;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-top: 2px;
          letter-spacing: 0.05em;
        }
        
        .card-actions {
          padding: 15px;
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border);
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .btn {
          padding: var(--spacing-sm) var(--spacing-md);
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .btn-auto-assign {
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 4px 12px;
          font-size: 12px;
        }
        
        .btn-auto-assign:hover {
          background: var(--bg-hover);
          border-color: var(--border-hover);
        }
        
        .btn-resolve {
          background: var(--color-success);
          color: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .btn-resolve:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
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
