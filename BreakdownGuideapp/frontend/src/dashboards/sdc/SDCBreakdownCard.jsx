import React, { useState, memo, useMemo } from 'react';
import { getWizardInfo } from './utils/wizardTypeMapping';
import DepotContactBadge from '../../components/DepotContactBadge';
import QuickDecisionButtons from './QuickDecisionButtons';

const SDCBreakdownCard = memo(({
  breakdown,
  onAcknowledge,
  onMakeDecision,
  onRequestEngineering,
  onEditAssessment,
  onQuickDecision,
  onAddNote,
  onResolve,
  onContact,
  animationDelay = 0,
  isHighlighted = false,
  engineeringTimer = null,
  recentlyCompleted = false
}) => {
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);
  const [showWizardResponses, setShowWizardResponses] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Phase 7.4: Check if shift is ending soon (priority indicator)
  const shiftPriorityInfo = useMemo(() => {
    try {
      const dutyStr = sessionStorage.getItem('currentDuty');
      if (!dutyStr) return null;

      const duty = JSON.parse(dutyStr);
      if (!duty.shiftEnd) return null;

      const shiftEnd = new Date(duty.shiftEnd);
      const now = new Date();
      const remainingMinutes = Math.floor((shiftEnd - now) / 60000);

      // Show priority badge when <60 minutes remaining
      if (remainingMinutes > 0 && remainingMinutes <= 60) {
        return {
          showBadge: true,
          remainingMinutes,
          isUrgent: remainingMinutes <= 30,
          dutyCode: duty.code
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // Determine criticality class with decision color coding
  const getCriticalityClass = () => {
    // Decision-based color coding (primary)
    if (breakdown.decision || breakdown.severity || breakdown.wizard_decision) {
      const decision = (breakdown.decision || breakdown.severity || breakdown.wizard_decision).toLowerCase();
      switch (decision) {
        case 'stop': return 'breakdown-card--stop-decision';
        case 'amber': return 'breakdown-card--amber-decision';
        case 'continue': return 'breakdown-card--continue-decision';
        default: break;
      }
    }
    
    // Assessment progress color coding
    if (breakdown.inAssessment || breakdown.hasActiveAssessment) {
      return 'breakdown-card--in-progress';
    }
    
    // Fallback to criticality
    return breakdown.criticality || 'normal';
  };

  // Get wizard information for enhanced display
  const wizardInfo = getWizardInfo(breakdown.wizard_type || breakdown.issue_category || breakdown.assessmentType);

  // Format assessment duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Format completion time
  const formatCompletionTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      className={`sdc-breakdown-card ${getCriticalityClass()} ${isHighlighted ? 'highlighted' : ''} ${breakdown.inAssessment ? 'in-assessment' : ''} ${recentlyCompleted ? 'recently-completed' : ''} ${engineeringTimer ? 'has-timer' : ''}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Priority Badge */}
      {breakdown.isPriority && (
        <div className="priority-badge">
          <span>⚠️ Priority Route</span>
        </div>
      )}
      
      {/* Assessment Status Badge */}
      {breakdown.inAssessment && (
        <div className="assessment-badge">
          <span>🔄 Assessment In Progress</span>
        </div>
      )}
      
      {/* Completion Highlighting */}
      {recentlyCompleted && (
        <div className="completion-badge">
          <span>✨ Assessment Just Completed</span>
        </div>
      )}
      
      {/* Engineering Timer Badge */}
      {engineeringTimer && (
        <div className="timer-badge">
          <span>⏰ Engineering: {Math.floor(engineeringTimer.remaining / 60000)}:{Math.floor((engineeringTimer.remaining % 60000) / 1000).toString().padStart(2, '0')}</span>
        </div>
      )}
      
      {/* Highlighted Badge */}
      {isHighlighted && !recentlyCompleted && (
        <div className="highlight-badge">
          <span>✨ Recently Updated</span>
        </div>
      )}

      {/* Phase 7.4: Shift-End Priority Badge */}
      {shiftPriorityInfo?.showBadge && (
        <div className={`shift-priority-badge ${shiftPriorityInfo.isUrgent ? 'shift-priority-badge--urgent' : ''}`}>
          <span>⏰ {shiftPriorityInfo.remainingMinutes}min left in Duty {shiftPriorityInfo.dutyCode}</span>
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
          <span className="info-label">Issue Type</span>
          <span className="info-value">{breakdown.issue_type || breakdown.wizard_type?.replace('Wizard', '') || 'General'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Depot</span>
          <span className="info-value">{breakdown.depot_display || breakdown.depot_id || 'Unknown'}</span>
        </div>
        <div className="info-item full-width">
          <DepotContactBadge
            fleetNumber={breakdown.fleet_no || breakdown.fleet_number}
            depot={breakdown.depot_display || breakdown.depot_id}
            size="small"
            showDepotName={false}
            variant="inline"
          />
        </div>
        <div className="info-item">
          <span className="info-label">Supervisor</span>
          <span className="info-value">{breakdown.supervisor_badge || breakdown.supervisor_name || 'N/A'}</span>
        </div>
        {breakdown.duration_text && (
          <div className="info-item full-width">
            <span className="info-label">Duration</span>
            <span className="info-value duration-highlight">{breakdown.duration_text}</span>
          </div>
        )}
        {(breakdown.wizard_decision || breakdown.severity) && (
          <div className="info-item full-width">
            <span className="info-label">Assessment Result</span>
            <span className={`info-value severity-${(breakdown.wizard_decision || breakdown.severity || '').toLowerCase()}`}>
              {breakdown.wizard_decision || breakdown.severity}
            </span>
          </div>
        )}
      </div>

      {/* Comprehensive Assessment Results */}
      {(breakdown.wizard_decision || breakdown.severity) && (
        <div className="assessment-results-section">
          <div className="results-header" onClick={() => setShowAssessmentDetails(!showAssessmentDetails)}>
            <div className="results-title">
              <span className="results-icon">{wizardInfo.icon}</span>
              <span className="results-text">Assessment Results</span>
              {breakdown.sdcGuideSection && (
                <span className="guide-section">({breakdown.sdcGuideSection || `${wizardInfo.displayName} Assessment`})</span>
              )}
            </div>
            <div className="expand-toggle">
              <span className={`toggle-arrow ${showAssessmentDetails ? 'expanded' : ''}`}>▼</span>
            </div>
          </div>

          {showAssessmentDetails && (
            <div className="results-expanded">
              {/* Decision Summary */}
              <div className="decision-summary">
                <div className="decision-main">
                  <div className={`decision-indicator ${(breakdown.wizard_decision || breakdown.severity || '').toLowerCase()}`}>
                    <span className="decision-icon">
                      {(breakdown.wizard_decision || breakdown.severity) === 'STOP' ? '🛑' : 
                       (breakdown.wizard_decision || breakdown.severity) === 'AMBER' ? '⚠️' : '✅'}
                    </span>
                    <span className="decision-text">{breakdown.wizard_decision || breakdown.severity}</span>
                  </div>
                  <div className="decision-meta">
                    {breakdown.completedAt && (
                      <span className="completion-time">
                        ✓ Completed: {formatCompletionTime(breakdown.completedAt)}
                      </span>
                    )}
                    {breakdown.assessmentDuration && (
                      <span className="assessment-duration">
                        ⏱️ Duration: {formatDuration(breakdown.assessmentDuration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Decision Reason */}
                {breakdown.decisionReason && (
                  <div className="decision-reason">
                    <h4>🔍 Decision Reason</h4>
                    <p>{breakdown.decisionReason}</p>
                  </div>
                )}

                {/* DVSA Reference */}
                {wizardInfo.dvsa_reference && (
                  <div className="dvsa-reference">
                    <h4>📋 DVSA Reference</h4>
                    <p>{wizardInfo.dvsa_reference}</p>
                  </div>
                )}
              </div>

              {/* Recommended Actions */}
              {(breakdown.recommendedActions && breakdown.recommendedActions.length > 0) && (
                <div className="recommended-actions">
                  <h4>📝 Recommended Actions</h4>
                  <ul className="actions-list">
                    {breakdown.recommendedActions.map((action, index) => (
                      <li key={index} className="action-item">
                        <span className="action-number">{index + 1}</span>
                        <span className="action-text">{action.description || action}</span>
                        {action.priority && (
                          <span className={`action-priority ${action.priority}`}>
                            {action.priority.toUpperCase()}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Wizard Responses Summary */}
              {breakdown.wizardResponses && Object.keys(breakdown.wizardResponses).length > 0 && (
                <div className="wizard-responses">
                  <div className="responses-header" onClick={() => setShowWizardResponses(!showWizardResponses)}>
                    <h4>🔬 Assessment Details</h4>
                    <span className={`responses-toggle ${showWizardResponses ? 'expanded' : ''}`}>
                      {showWizardResponses ? '▲' : '▼'} {Object.keys(breakdown.wizardResponses).length} steps
                    </span>
                  </div>
                  
                  {showWizardResponses && (
                    <div className="responses-list">
                      {Object.entries(breakdown.wizardResponses).map(([step, response], index) => (
                        <div key={step} className="response-item">
                          <div className="response-header">
                            <span className="step-number">{index + 1}</span>
                            <span className="step-label">
                              {step.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/step\d+/i, 'Step')}
                            </span>
                          </div>
                          <div className="response-content">
                            {typeof response === 'object' ? JSON.stringify(response) : response}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Assessment Timeline */}
              {(breakdown.startedAt || breakdown.completedAt) && (
                <div className="assessment-timeline-summary">
                  <h4>⏰ Assessment Timeline</h4>
                  <div className="timeline-grid">
                    {breakdown.startedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Started:</span>
                        <span className="timeline-value">{formatCompletionTime(breakdown.startedAt)}</span>
                      </div>
                    )}
                    {breakdown.completedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Completed:</span>
                        <span className="timeline-value">{formatCompletionTime(breakdown.completedAt)}</span>
                      </div>
                    )}
                    {breakdown.assessmentDuration && (
                      <div className="timeline-item">
                        <span className="timeline-label">Total Duration:</span>
                        <span className="timeline-value">{formatDuration(breakdown.assessmentDuration)}</span>
                      </div>
                    )}
                    {breakdown.supervisor_name && (
                      <div className="timeline-item">
                        <span className="timeline-label">Assessed by:</span>
                        <span className="timeline-value">{breakdown.supervisor_name}</span>
                      </div>
                    )}
                    {breakdown.duty_code && (
                      <div className="timeline-item">
                        <span className="timeline-label">During Shift:</span>
                        <span className="timeline-value duty-tag">
                          Duty {breakdown.duty_code}
                          {breakdown.duty_name && ` (${breakdown.duty_name})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="breakdown-actions">
        {breakdown.currentStage === 'received' && (
          <button
            className="action-btn acknowledge"
            onClick={() => onAcknowledge(breakdown.breakdown_id)}
          >
            ✓ Acknowledge
          </button>
        )}

        {/* Quick Decision Buttons - Show for acknowledged breakdowns or when no decision yet */}
        {(breakdown.currentStage === 'acknowledged' || !breakdown.wizard_decision) && (
          <div className="quick-decision-section">
            <QuickDecisionButtons
              breakdownId={breakdown.breakdown_id}
              currentDecision={breakdown.wizard_decision || breakdown.severity}
              onDecisionMade={(decision, data) => {
                if (onQuickDecision) {
                  onQuickDecision(breakdown.breakdown_id, decision, data);
                }
              }}
              compact={false}
            />
          </div>
        )}

        {breakdown.currentStage === 'acknowledged' && (
          <button
            className="action-btn decision"
            onClick={() => onMakeDecision(breakdown.breakdown_id)}
          >
            📋 Full Assessment
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

        {/* Edit Assessment Button - Show if assessment exists */}
        {(breakdown.wizard_decision || breakdown.severity) && onEditAssessment && (
          <button
            className="action-btn edit-assessment"
            onClick={() => onEditAssessment(breakdown.breakdown_id)}
            title="Edit the original assessment for this breakdown"
          >
            ✏️ Edit Assessment
          </button>
        )}

        {/* Add Note Button */}
        <button
          className={`action-btn add-note ${showNoteInput ? 'active' : ''}`}
          onClick={() => setShowNoteInput(!showNoteInput)}
          title="Add a note to this breakdown"
        >
          📝 Note
        </button>

        {/* Resolve Button - Show when decision has been made */}
        {breakdown.wizard_decision && onResolve && breakdown.status !== 'resolved' && (
          <button
            className="action-btn resolve"
            onClick={() => onResolve(breakdown)}
            title="Mark this breakdown as resolved"
          >
            ✅ Resolve
          </button>
        )}

        {/* Contact Depot Button */}
        <button
          className="action-btn contact"
          onClick={() => onContact ? onContact(breakdown) : null}
          title="Contact depot or driver"
        >
          📞 Contact
        </button>
      </div>

      {/* Inline Note Input */}
      {showNoteInput && (
        <div className="note-input-container">
          <textarea
            className="note-input"
            placeholder="Add a note about this breakdown..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
          />
          <div className="note-actions">
            <button
              className="note-btn save"
              onClick={() => {
                if (noteText.trim() && onAddNote) {
                  onAddNote(breakdown.breakdown_id, noteText.trim());
                  setNoteText('');
                  setShowNoteInput(false);
                }
              }}
              disabled={!noteText.trim()}
            >
              Save Note
            </button>
            <button
              className="note-btn cancel"
              onClick={() => {
                setNoteText('');
                setShowNoteInput(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

        /* Decision Color Coding */
        .breakdown-card--stop-decision {
          border-left: 4px solid #ef4444 !important;
          background: 
            linear-gradient(135deg, rgba(254, 226, 226, 0.98) 0%, rgba(253, 242, 242, 0.95) 100%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 50%);
          box-shadow: 
            0 4px 20px rgba(239, 68, 68, 0.15),
            0 2px 8px rgba(239, 68, 68, 0.1),
            inset 0 2px 0 rgba(255,255,255,0.7);
        }

        .breakdown-card--amber-decision {
          border-left: 4px solid #f59e0b !important;
          background: 
            linear-gradient(135deg, rgba(254, 243, 199, 0.98) 0%, rgba(253, 246, 178, 0.95) 100%),
            radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 50%);
          box-shadow: 
            0 4px 20px rgba(245, 158, 11, 0.15),
            0 2px 8px rgba(245, 158, 11, 0.1),
            inset 0 2px 0 rgba(255,255,255,0.7);
        }

        .breakdown-card--continue-decision {
          border-left: 4px solid #10b981 !important;
          background: 
            linear-gradient(135deg, rgba(220, 252, 231, 0.98) 0%, rgba(209, 250, 229, 0.95) 100%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%);
          box-shadow: 
            0 4px 20px rgba(16, 185, 129, 0.15),
            0 2px 8px rgba(16, 185, 129, 0.1),
            inset 0 2px 0 rgba(255,255,255,0.7);
        }

        .breakdown-card--in-progress {
          border-left: 4px solid #3b82f6 !important;
          background: 
            linear-gradient(135deg, rgba(219, 234, 254, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
          box-shadow: 
            0 4px 20px rgba(59, 130, 246, 0.15),
            0 2px 8px rgba(59, 130, 246, 0.1),
            inset 0 2px 0 rgba(255,255,255,0.7);
          animation: pulseInProgress 3s infinite;
        }

        @keyframes pulseInProgress {
          0%, 100% { 
            box-shadow: 
              0 4px 20px rgba(59, 130, 246, 0.15),
              0 2px 8px rgba(59, 130, 246, 0.1),
              inset 0 2px 0 rgba(255,255,255,0.7);
          }
          50% { 
            box-shadow: 
              0 6px 25px rgba(59, 130, 246, 0.25),
              0 3px 12px rgba(59, 130, 246, 0.15),
              inset 0 2px 0 rgba(255,255,255,0.7);
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

        .sdc-breakdown-card.highlighted {
          background: linear-gradient(135deg, rgba(236,254,255,0.98) 0%, rgba(207,250,254,0.95) 100%);
          border: 2px solid rgba(6,182,212,0.4);
          animation: fadeInUp 0.6s both, highlightGlow 3s ease-in-out;
        }

        .sdc-breakdown-card.in-assessment {
          background: linear-gradient(135deg, rgba(240,253,244,0.98) 0%, rgba(220,252,231,0.95) 100%);
          border: 1px solid rgba(34,197,94,0.3);
        }

        .sdc-breakdown-card.in-assessment::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
          opacity: 0.8;
          animation: shimmer 2s infinite;
        }

        @keyframes highlightGlow {
          0%, 100% { 
            box-shadow: 
              0 4px 15px rgba(6,182,212,0.15),
              0 1px 3px rgba(6,182,212,0.1),
              inset 0 1px 0 rgba(255,255,255,0.5);
          }
          50% { 
            box-shadow: 
              0 8px 30px rgba(6,182,212,0.25),
              0 2px 6px rgba(6,182,212,0.15),
              inset 0 1px 0 rgba(255,255,255,0.5);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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

        .assessment-badge {
          position: absolute;
          top: -12px;
          left: 24px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 
            0 4px 12px rgba(34,197,94,0.4),
            0 2px 4px rgba(34,197,94,0.2);
          animation: pulse 2s infinite;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .highlight-badge {
          position: absolute;
          top: -12px;
          right: 120px;
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          color: white;
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow:
            0 4px 12px rgba(6,182,212,0.4),
            0 2px 4px rgba(6,182,212,0.2);
          animation: bounce 2s infinite;
          border: 1px solid rgba(255,255,255,0.2);
        }

        /* Phase 7.4: Shift-End Priority Badge */
        .shift-priority-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow:
            0 4px 12px rgba(245, 158, 11, 0.4),
            0 2px 4px rgba(245, 158, 11, 0.2);
          animation: shiftWarning 2s infinite;
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
          z-index: 15;
        }

        .shift-priority-badge--urgent {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow:
            0 4px 12px rgba(239, 68, 68, 0.5),
            0 2px 4px rgba(239, 68, 68, 0.3);
          animation: shiftUrgent 1s infinite;
        }

        @keyframes shiftWarning {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          }
          50% {
            transform: translateX(-50%) scale(1.02);
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.5);
          }
        }

        @keyframes shiftUrgent {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) scale(1.03);
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.6);
            opacity: 0.95;
          }
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

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
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

        .info-value.duration-highlight {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
          color: #3b82f6;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .info-value.severity-stop {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid rgba(220, 38, 38, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value.severity-amber {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
          color: #f59e0b;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid rgba(245, 158, 11, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value.severity-continue {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
          color: #10b981;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
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

        .action-btn.edit-assessment {
          background: linear-gradient(135deg, #a855f7, #9333ea);
          color: white;
          border-color: rgba(147, 51, 234, 0.2);
          box-shadow: 
            0 2px 8px rgba(147, 51, 234, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .action-btn.edit-assessment:hover {
          transform: translateY(-2px);
          box-shadow:
            0 6px 20px rgba(147, 51, 234, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.3);
          border-color: rgba(147, 51, 234, 0.3);
        }

        .action-btn.add-note {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
          border-color: rgba(245, 158, 11, 0.2);
          color: #d97706;
        }

        .action-btn.add-note:hover,
        .action-btn.add-note.active {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
          border-color: rgba(251, 191, 36, 0.4);
          color: white;
        }

        .action-btn.resolve {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
          border-color: rgba(34, 197, 94, 0.2);
          color: #16a34a;
        }

        .action-btn.resolve:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #4ade80, #22c55e);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
          border-color: rgba(74, 222, 128, 0.4);
          color: white;
        }

        .action-btn.contact {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(2, 132, 199, 0.05));
          border-color: rgba(14, 165, 233, 0.2);
          color: #0284c7;
        }

        .action-btn.contact:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #38bdf8, #0ea5e9);
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
          border-color: rgba(56, 189, 248, 0.4);
          color: white;
        }

        /* Note Input Styles */
        .note-input-container {
          margin-top: 16px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(217, 119, 6, 0.02));
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 16px;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .note-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 70px;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .note-input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .note-input::placeholder {
          color: #9ca3af;
        }

        .note-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          justify-content: flex-end;
        }

        .note-btn {
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .note-btn.save {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .note-btn.save:hover:not(:disabled) {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .note-btn.save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .note-btn.cancel {
          background: rgba(0, 0, 0, 0.05);
          color: #6b7280;
        }

        .note-btn.cancel:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        /* New Badge Styles */
        .completion-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          animation: completionPulse 2s infinite;
          z-index: 10;
        }

        @keyframes completionPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5);
          }
        }

        .timer-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
          animation: timerPulse 1s infinite;
          z-index: 10;
        }

        @keyframes timerPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.9;
          }
        }

        .sdc-breakdown-card.recently-completed {
          background: 
            linear-gradient(135deg, rgba(220, 252, 231, 0.98) 0%, rgba(187, 247, 208, 0.95) 100%),
            radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%);
          border: 2px solid rgba(16, 185, 129, 0.4);
          animation: fadeInUp 0.6s both, completionGlow 3s infinite;
        }

        @keyframes completionGlow {
          0%, 100% {
            border-color: rgba(16, 185, 129, 0.4);
            box-shadow: 
              0 4px 20px rgba(0,0,0,0.04),
              0 2px 8px rgba(0,0,0,0.06),
              inset 0 2px 0 rgba(255,255,255,0.7);
          }
          50% {
            border-color: rgba(16, 185, 129, 0.6);
            box-shadow: 
              0 8px 30px rgba(16, 185, 129, 0.15),
              0 4px 12px rgba(16, 185, 129, 0.1),
              inset 0 2px 0 rgba(255,255,255,0.8);
          }
        }

        .sdc-breakdown-card.has-timer {
          border-left: 4px solid #dc2626;
          animation: fadeInUp 0.6s both, timerAlert 2s infinite;
        }

        @keyframes timerAlert {
          0%, 100% {
            border-left-color: #dc2626;
          }
          50% {
            border-left-color: #ef4444;
          }
        }

        @media (max-width: 640px) {
          .breakdown-info {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .breakdown-actions {
            grid-template-columns: 1fr;
          }

          .completion-badge,
          .timer-badge,
          .shift-priority-badge {
            position: static;
            margin-top: 8px;
            align-self: flex-start;
            transform: none;
          }
        }

        /* Assessment Results Section Styles */
        .assessment-results-section {
          margin-top: 20px;
          border-top: 1px solid rgba(226, 232, 240, 0.5);
          padding-top: 16px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02));
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }

        .results-header:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04));
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .results-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .results-icon {
          font-size: 16px;
        }

        .results-text {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .guide-section {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-left: 4px;
        }

        .expand-toggle {
          display: flex;
          align-items: center;
        }

        .toggle-arrow {
          font-size: 12px;
          color: #64748b;
          transition: transform 0.3s ease;
        }

        .toggle-arrow.expanded {
          transform: rotate(180deg);
        }

        .results-expanded {
          background: rgba(248, 250, 252, 0.5);
          border-radius: 12px;
          padding: 20px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Decision Summary Styles */
        .decision-summary {
          margin-bottom: 20px;
        }

        .decision-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .decision-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 700;
        }

        .decision-indicator.stop {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }

        .decision-indicator.amber {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .decision-indicator.continue {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .decision-icon {
          font-size: 18px;
        }

        .decision-text {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .decision-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
          font-size: 12px;
          color: #64748b;
        }

        .completion-time,
        .assessment-duration {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .decision-reason,
        .dvsa-reference {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .decision-reason h4,
        .dvsa-reference h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .decision-reason p,
        .dvsa-reference p {
          margin: 0;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
        }

        /* Recommended Actions Styles */
        .recommended-actions {
          margin-bottom: 20px;
        }

        .recommended-actions h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .actions-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .action-item:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(203, 213, 225, 0.8);
          transform: translateX(2px);
        }

        .action-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .action-text {
          flex: 1;
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }

        .action-priority {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .action-priority.critical {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
        }

        .action-priority.high {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .action-priority.medium {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .action-priority.low {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        /* Wizard Responses Styles */
        .wizard-responses {
          margin-bottom: 20px;
        }

        .responses-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 8px 0;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        }

        .responses-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .responses-toggle {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          transition: transform 0.3s ease;
        }

        .responses-toggle.expanded {
          transform: rotate(180deg);
        }

        .responses-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .response-item {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(226, 232, 240, 0.5);
          border-radius: 6px;
          padding: 10px;
        }

        .response-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: #64748b;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .response-content {
          font-size: 12px;
          color: #4b5563;
          line-height: 1.4;
          padding-left: 24px;
          font-style: italic;
        }

        /* Assessment Timeline Summary Styles */
        .assessment-timeline-summary {
          margin-bottom: 16px;
        }

        .assessment-timeline-summary h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .timeline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
        }

        .timeline-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 6px;
        }

        .timeline-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .timeline-value {
          font-size: 12px;
          color: #374151;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .decision-main {
            flex-direction: column;
            align-items: stretch;
          }

          .decision-meta {
            align-items: flex-start;
          }

          .timeline-grid {
            grid-template-columns: 1fr;
          }

          .action-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .action-number {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - prevent re-render if key props haven't changed
  const prevBreakdown = prevProps.breakdown || {};
  const nextBreakdown = nextProps.breakdown || {};
  
  return (
    prevBreakdown.id === nextBreakdown.id &&
    prevBreakdown.breakdown_id === nextBreakdown.breakdown_id &&
    prevBreakdown.status === nextBreakdown.status &&
    prevBreakdown.severity === nextBreakdown.severity &&
    prevBreakdown.wizard_decision === nextBreakdown.wizard_decision &&
    prevBreakdown.acknowledged_at === nextBreakdown.acknowledged_at &&
    prevBreakdown.decision_at === nextBreakdown.decision_at &&
    prevBreakdown.engineer_assigned === nextBreakdown.engineer_assigned &&
    prevBreakdown.assessment_status === nextBreakdown.assessment_status &&
    prevBreakdown.assessment_progress === nextBreakdown.assessment_progress &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.recentlyCompleted === nextProps.recentlyCompleted &&
    prevProps.animationDelay === nextProps.animationDelay &&
    JSON.stringify(prevProps.engineeringTimer) === JSON.stringify(nextProps.engineeringTimer)
  );
});

// Add display name for debugging
SDCBreakdownCard.displayName = 'SDCBreakdownCard';

export default SDCBreakdownCard;
