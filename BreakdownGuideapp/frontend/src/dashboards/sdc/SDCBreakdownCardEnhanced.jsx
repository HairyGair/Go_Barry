import React, { useState, memo, useEffect } from 'react';
import { getWizardInfo } from './utils/wizardTypeMapping';

// SDC Guide category mappings with icons and sections
const SDC_GUIDE_CATEGORIES = {
  'Steering': { icon: '🚗', section: 'Section 8', critical: true, page: 8 },
  'Brakes': { icon: '🛑', section: 'Section 7', critical: true, page: 7 },
  'ABS Light': { icon: '⚠️', section: 'Section 3', critical: true, page: 14 },
  'Battery Light': { icon: '🔋', section: 'Section 4', critical: false, page: 13 },
  'Non Starter': { icon: '🔑', section: 'Section 19', critical: true, page: 9 },
  'Overheating': { icon: '🌡️', section: 'Section 21', critical: true, page: 11 },
  'Oil Warning Light': { icon: '🛢️', section: 'Section 20', critical: true, page: 22 },
  'Road Traffic Incidents': { icon: '🚨', section: 'Section 2', critical: true, page: 4 },
  'Doors': { icon: '🚪', section: 'Section 10', critical: false, page: 17 },
  'Wipers/Screenwash': { icon: '🌧️', section: 'Section 30', critical: false, page: 12 },
  'Puncture': { icon: '🔧', section: 'Section 22', critical: true, page: 32 },
  'Exterior Lights': { icon: '💡', section: 'Section 11', critical: false, page: 35 },
  'Interior Lights': { icon: '💡', section: 'Section 15', critical: false, page: 33 },
  'Warning Lights': { icon: '⚡', section: 'Section 28', critical: true, page: 25 },
  'Suspension': { icon: '🔩', section: 'Section 27', critical: true, page: 34 },
  'Wing Mirrors': { icon: '🪞', section: 'Section 29', critical: false, page: 27 },
  'Broken Windows': { icon: '🪟', section: 'Section 6', critical: false, page: 6 },
  'Gear Selection': { icon: '⚙️', section: 'Section 13', critical: true, page: 24 },
  'Gearbox': { icon: '⚙️', section: 'Section 14', critical: true, page: 21 },
  'Low Water': { icon: '💧', section: 'Section 18', critical: false, page: 16 },
  'Excessive Smoke': { icon: '💨', section: 'Section 12', critical: false, page: 10 },
  'Cutting Out/Fuel': { icon: '⛽', section: 'Section 8', critical: true, page: 18 },
  'Demisters/Heaters': { icon: '🌬️', section: 'Section 9', critical: false, page: 15 },
  'Ramp': { icon: '♿', section: 'Section 23', critical: false, page: 20 },
  'Repeat Defects': { icon: '🔄', section: 'Section 24', critical: false, page: 23 },
  'Speedo': { icon: '📊', section: 'Section 25', critical: false, page: 31 },
  'Buzzers': { icon: '🔔', section: 'Section 7', critical: false, page: 26 },
  'Interior/Exterior Damage': { icon: '🚧', section: 'Section 17', critical: false, page: 29 },
  'Loose Wheel Nuts': { icon: '⚠️', section: 'Section 17', critical: true, page: 28 }
};

const SDCBreakdownCardEnhanced = memo(({ 
  breakdown, 
  onAcknowledge, 
  onMakeDecision, 
  onRequestEngineering,
  onEditAssessment,
  onViewGuide,
  onAddNote,
  animationDelay = 0,
  isHighlighted = false,
  engineeringTimer = null,
  recentlyCompleted = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [slaStatus, setSlaStatus] = useState('ok');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');

  // Get SDC Guide info based on issue type
  const issueType = breakdown.issue_type || breakdown.wizard_type?.replace('Wizard', '') || 'General';
  const sdcGuideInfo = SDC_GUIDE_CATEGORIES[issueType] || { icon: '❔', section: 'N/A', critical: false };
  
  // Calculate SLA status (30 min warning, 45 min breach for critical)
  useEffect(() => {
    const elapsed = breakdown.elapsed || 0;
    setTimeElapsed(elapsed);
    
    if (sdcGuideInfo.critical) {
      if (elapsed >= 45) setSlaStatus('breached');
      else if (elapsed >= 30) setSlaStatus('warning');
      else setSlaStatus('ok');
    } else {
      if (elapsed >= 90) setSlaStatus('breached');
      else if (elapsed >= 60) setSlaStatus('warning');
      else setSlaStatus('ok');
    }
  }, [breakdown.elapsed, sdcGuideInfo.critical]);

  // Format time display
  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return '--:--';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Get decision class and info
  const getDecisionInfo = () => {
    const decision = (breakdown.decision || breakdown.severity || breakdown.wizard_decision || '').toUpperCase();
    switch (decision) {
      case 'STOP':
        return {
          class: 'decision-stop',
          icon: '🛑',
          text: 'STOP',
          description: 'Vehicle must not continue - Engineering required immediately',
          actions: ['Dispatch Engineer', 'Arrange Recovery', 'Notify Depot']
        };
      case 'AMBER':
        return {
          class: 'decision-amber',
          icon: '⚠️',
          text: 'AMBER',
          description: 'Changeover at earliest convenience',
          actions: ['Schedule Changeover', 'Monitor Vehicle', 'Update Driver']
        };
      case 'CONTINUE':
        return {
          class: 'decision-continue',
          icon: '✅',
          text: 'CONTINUE',
          description: 'Vehicle can continue in service',
          actions: ['Log Defect', 'Schedule Inspection', 'Continue Service']
        };
      default:
        return {
          class: 'decision-pending',
          icon: '❓',
          text: 'PENDING',
          description: 'Assessment required',
          actions: ['Start Assessment', 'Contact Driver', 'Request Info']
        };
    }
  };

  const decisionInfo = getDecisionInfo();

  // Get current stage progress
  const stages = ['received', 'acknowledged', 'decision', 'engineering'];
  const currentStageIndex = stages.indexOf(breakdown.currentStage || 'received');
  const stageProgress = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <div 
      className={`sdc-card-enhanced ${decisionInfo.class} ${slaStatus} ${isHighlighted ? 'highlighted' : ''}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Header Section */}
      <div className="card-header">
        <div className="header-left">
          <div className="fleet-badge">
            <span className="fleet-number">{breakdown.fleet_no || 'Unknown'}</span>
            {breakdown.route_id && (
              <span className="route-number">{breakdown.route_id}</span>
            )}
          </div>
          {breakdown.isPriority && (
            <span className="priority-indicator">PRIORITY</span>
          )}
        </div>
        
        <div className="header-right">
          <div className="sla-timer">
            <div className={`timer-display ${slaStatus}`}>
              <span className="timer-value">{formatTime(timeElapsed)}</span>
              <span className="timer-label">
                {slaStatus === 'breached' ? 'OVERDUE' : 
                 slaStatus === 'warning' ? 'SLA WARNING' : 
                 'ELAPSED'}
              </span>
            </div>
            {sdcGuideInfo.critical && (
              <div className="sla-bar">
                <div 
                  className="sla-progress"
                  style={{ width: `${Math.min(100, (timeElapsed / 45) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Issue Type Section */}
      <div className="issue-section">
        <div className="issue-header">
          <div className="issue-icon">{sdcGuideInfo.icon}</div>
          <div className="issue-info">
            <h3 className="issue-type">{issueType}</h3>
            <div className="sdc-reference">
              <span className="sdc-label">SDC Guide:</span>
              <button 
                className="sdc-link"
                onClick={() => onViewGuide && onViewGuide(sdcGuideInfo.section, sdcGuideInfo.page)}
              >
                {sdcGuideInfo.section} (Page {sdcGuideInfo.page})
              </button>
            </div>
          </div>
        </div>
        
        {/* Decision Display */}
        <div className={`decision-display ${decisionInfo.class}`}>
          <div className="decision-icon">{decisionInfo.icon}</div>
          <div className="decision-content">
            <span className="decision-text">{decisionInfo.text}</span>
            <span className="decision-description">{decisionInfo.description}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Timeline */}
      <div className="timeline-section">
        <div className="timeline-bar">
          <div className="timeline-progress" style={{ width: `${stageProgress}%` }} />
          {stages.map((stage, index) => (
            <div 
              key={stage}
              className={`timeline-step ${index <= currentStageIndex ? 'completed' : ''} ${stage === breakdown.currentStage ? 'current' : ''}`}
            >
              <div className="step-dot">
                {index <= currentStageIndex ? '✓' : index + 1}
              </div>
              <span className="step-label">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Location</span>
          <span className="info-value">{breakdown.location || 'Unknown'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Depot</span>
          <span className="info-value">{breakdown.depot_id || 'Unknown'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Supervisor</span>
          <span className="info-value">{breakdown.supervisor_name || 'Unassigned'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className="info-value status">{breakdown.currentStage || 'Received'}</span>
        </div>
      </div>

      {/* Quick Actions Based on Decision */}
      {decisionInfo.text !== 'PENDING' && (
        <div className="quick-actions">
          <h4>Recommended Actions</h4>
          <div className="actions-list">
            {decisionInfo.actions.map((action, index) => (
              <button key={index} className="quick-action-btn">
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {breakdown.currentStage === 'received' && (
          <button className="btn btn-acknowledge" onClick={() => onAcknowledge(breakdown.breakdown_id)}>
            <span>✓</span> Acknowledge
          </button>
        )}
        {breakdown.currentStage === 'acknowledged' && (
          <button className="btn btn-decision" onClick={() => onMakeDecision(breakdown.breakdown_id)}>
            <span>📋</span> Make Decision
          </button>
        )}
        {breakdown.currentStage === 'decision' && (
          <button className="btn btn-engineering" onClick={() => onRequestEngineering(breakdown.breakdown_id)}>
            <span>🔧</span> Request Engineering
          </button>
        )}
        <button className="btn btn-notes" onClick={() => setShowNotes(!showNotes)}>
          <span>📝</span> Notes
        </button>
        {breakdown.wizard_decision && onEditAssessment && (
          <button className="btn btn-edit" onClick={() => onEditAssessment(breakdown.breakdown_id)}>
            <span>✏️</span> Edit
          </button>
        )}
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="notes-section">
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add notes about this breakdown..."
            className="notes-input"
          />
          <button 
            className="btn btn-save-note"
            onClick={() => {
              onAddNote && onAddNote(breakdown.breakdown_id, note);
              setNote('');
              setShowNotes(false);
            }}
          >
            Save Note
          </button>
        </div>
      )}

      <style jsx>{`
        .sdc-card-enhanced {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 24px;
          margin-bottom: 16px;
          transition: all 0.3s ease;
          animation: slideIn 0.5s ease;
          border-left: 4px solid transparent;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Decision color coding */
        .sdc-card-enhanced.decision-stop {
          border-left-color: #dc2626;
          background: linear-gradient(to right, rgba(254, 226, 226, 0.3), white);
        }

        .sdc-card-enhanced.decision-amber {
          border-left-color: #f59e0b;
          background: linear-gradient(to right, rgba(254, 243, 199, 0.3), white);
        }

        .sdc-card-enhanced.decision-continue {
          border-left-color: #10b981;
          background: linear-gradient(to right, rgba(220, 252, 231, 0.3), white);
        }

        /* SLA Status */
        .sdc-card-enhanced.breached {
          animation: pulse 2s infinite;
        }

        .sdc-card-enhanced.warning {
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2); }
          50% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3); }
        }

        /* Header Section */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fleet-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fleet-number {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .route-number {
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
        }

        .priority-indicator {
          background: #dc2626;
          color: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* SLA Timer */
        .sla-timer {
          text-align: right;
        }

        .timer-display {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .timer-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .timer-display.warning .timer-value {
          color: #f59e0b;
        }

        .timer-display.breached .timer-value {
          color: #dc2626;
        }

        .timer-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
        }

        .timer-display.warning .timer-label {
          color: #f59e0b;
        }

        .timer-display.breached .timer-label {
          color: #dc2626;
        }

        .sla-bar {
          width: 80px;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }

        .sla-progress {
          height: 100%;
          background: linear-gradient(to right, #10b981, #f59e0b, #dc2626);
          transition: width 0.3s ease;
        }

        /* Issue Section */
        .issue-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .issue-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .issue-icon {
          font-size: 32px;
          line-height: 1;
        }

        .issue-info {
          flex: 1;
        }

        .issue-type {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .sdc-reference {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sdc-label {
          font-size: 12px;
          color: #64748b;
        }

        .sdc-link {
          font-size: 12px;
          color: #3b82f6;
          text-decoration: underline;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-weight: 500;
        }

        .sdc-link:hover {
          color: #2563eb;
        }

        /* Decision Display */
        .decision-display {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
        }

        .decision-display.decision-stop {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .decision-display.decision-amber {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .decision-display.decision-continue {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .decision-display.decision-pending {
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .decision-icon {
          font-size: 24px;
        }

        .decision-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .decision-text {
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .decision-display.decision-stop .decision-text {
          color: #dc2626;
        }

        .decision-display.decision-amber .decision-text {
          color: #f59e0b;
        }

        .decision-display.decision-continue .decision-text {
          color: #10b981;
        }

        .decision-display.decision-pending .decision-text {
          color: #64748b;
        }

        .decision-description {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        /* Timeline Section */
        .timeline-section {
          margin: 24px 0;
        }

        .timeline-bar {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
        }

        .timeline-bar::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: #e5e7eb;
          transform: translateY(-50%);
        }

        .timeline-progress {
          position: absolute;
          top: 50%;
          left: 0;
          height: 2px;
          background: linear-gradient(to right, #10b981, #3b82f6);
          transform: translateY(-50%);
          transition: width 0.5s ease;
        }

        .timeline-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 1;
        }

        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          transition: all 0.3s ease;
        }

        .timeline-step.completed .step-dot {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .timeline-step.current .step-dot {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        .step-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .timeline-step.completed .step-label,
        .timeline-step.current .step-label {
          color: #1e293b;
          font-weight: 600;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 20px 0;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
          margin-top: 2px;
        }

        .info-value.status {
          text-transform: capitalize;
        }

        /* Quick Actions */
        .quick-actions {
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
        }

        .quick-actions h4 {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }

        .actions-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quick-action-btn {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          transform: translateY(-1px);
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          flex: 1;
          min-width: 100px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn span {
          font-size: 14px;
        }

        .btn-acknowledge {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .btn-decision {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .btn-engineering {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-notes {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
        }

        .btn-edit {
          background: linear-gradient(135deg, #64748b, #475569);
          color: white;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Notes Section */
        .notes-section {
          margin-top: 16px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .notes-input {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          resize: vertical;
        }

        .btn-save-note {
          margin-top: 8px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-save-note:hover {
          background: #2563eb;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .card-header {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
});

SDCBreakdownCardEnhanced.displayName = 'SDCBreakdownCardEnhanced';

export default SDCBreakdownCardEnhanced;
