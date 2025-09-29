import React, { useState, useEffect, memo } from 'react';
import { getWizardInfo, getStepDescription, getWizardPriority } from './utils/wizardTypeMapping';

/**
 * AssessmentProgressCard - Enhanced visual design for in-progress assessments
 * Features: ProgressIndicator, StepDescription, SupervisorInfo, EstimatedCompletion, VehicleInfo
 * UI Specification compliant with color coding and visual hierarchy
 * Performance: Memoized to prevent unnecessary re-renders
 */
const AssessmentProgressCard = memo(({
  breakdownId,
  currentStep = "1/1",
  stepDescription = "Starting assessment...",
  supervisor = "Unknown Supervisor",
  estimatedCompletion = "Unknown",
  fleetNumber,
  route,
  location,
  startTime,
  wizardType = "General Assessment",
  onViewDetails,
  onCancel,
  priority = "normal"
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get detailed wizard information
  const wizardInfo = getWizardInfo(wizardType);
  const enhancedPriority = priority !== "normal" ? priority : getWizardPriority(wizardType);
  
  // Parse current step for enhanced descriptions
  const [currentStepNum, totalSteps] = currentStep.split('/').map(Number);

  // Calculate elapsed time
  useEffect(() => {
    const calculateElapsed = () => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - new Date(startTime)) / 1000);
        setElapsedTime(elapsed);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format elapsed time
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    const [current, total] = currentStep.split('/').map(Number);
    return Math.round((current / total) * 100);
  };

  // Generate supervisor avatar initials
  const generateAvatar = (name) => {
    if (!name || name === 'Unknown Supervisor') return 'UN';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Enhanced step description with DVSA compliance
  const getEnhancedStepDescription = () => {
    if (stepDescription !== "Starting assessment..." && stepDescription !== "Assessment in progress...") {
      return stepDescription;
    }
    
    const baseDescription = getStepDescription(wizardType, currentStepNum, totalSteps);
    const wizardInfo = getWizardInfo(wizardType);
    
    if (wizardInfo.dvsa_reference && baseDescription.includes('check') || baseDescription.includes('test')) {
      return `${baseDescription} (${wizardInfo.dvsa_reference})`;
    }
    
    return baseDescription;
  };

  // Get priority styling with enhanced priority detection
  const getPriorityClass = () => {
    switch (enhancedPriority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-normal';
    }
  };

  // Get estimated completion status
  const getCompletionStatus = () => {
    if (estimatedCompletion === "Unknown") return { text: "Unknown", class: "unknown" };
    
    const match = estimatedCompletion.match(/(\d+)\s*(min|mins|sec|secs)/i);
    if (!match) return { text: estimatedCompletion, class: "normal" };
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const totalSeconds = unit.startsWith('min') ? value * 60 : value;
    
    if (totalSeconds <= 60) return { text: estimatedCompletion, class: "urgent" };
    if (totalSeconds <= 300) return { text: estimatedCompletion, class: "normal" };
    return { text: estimatedCompletion, class: "extended" };
  };

  const progressPercentage = getProgressPercentage();
  const completionStatus = getCompletionStatus();

  return (
    <div className={`assessment-progress-card ${getPriorityClass()}`}>
      <div className="progress-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="progress-main">
          <div className="progress-info">
            <div className="breakdown-id">{breakdownId}</div>
            <div className="fleet-info">
              <span className="fleet-number">Fleet {fleetNumber}</span>
              {route && <span className="route-info">Route {route}</span>}
            </div>
          </div>
          
          <div className="progress-ring-container">
            <div className="progress-ring">
              <svg className="progress-svg" viewBox="0 0 42 42">
                <circle
                  className="progress-bg"
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  className="progress-fill"
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercentage} ${100 - progressPercentage}`}
                  transform="rotate(-90 21 21)"
                />
              </svg>
              <div className="progress-text">
                <div className="step-number">{currentStep}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="progress-details">
          {/* Enhanced Step Description with DVSA Reference */}
          <div className="step-description-section">
            <div className="current-step">
              <span className="step-icon">{wizardInfo.icon}</span>
              <span className="step-description">
                {getEnhancedStepDescription()}
              </span>
            </div>
            
            {wizardInfo.dvsa_reference && (
              <div className="dvsa-reference">
                <span className="reference-icon">📋</span>
                <span className="reference-text">{wizardInfo.dvsa_reference}</span>
              </div>
            )}
          </div>
          
          {/* Enhanced Supervisor Info with Avatar */}
          <div className="supervisor-info-section">
            <div className="supervisor-avatar">
              {generateAvatar(supervisor)}
            </div>
            <div className="supervisor-details">
              <span className="supervisor-name">{supervisor}</span>
              <span className="supervisor-meta">
                Started: {startTime ? new Date(startTime).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'Unknown'}
              </span>
            </div>
          </div>
          
          {/* Enhanced Vehicle Info */}
          <div className="vehicle-info-section">
            <div className="vehicle-details">
              <div className="vehicle-item">
                <span className="vehicle-icon">🚌</span>
                <span className="vehicle-text">Fleet {fleetNumber}</span>
              </div>
              {route && (
                <div className="vehicle-item">
                  <span className="vehicle-icon">🛣️</span>
                  <span className="vehicle-text">Route {route}</span>
                </div>
              )}
              {location && (
                <div className="vehicle-item">
                  <span className="vehicle-icon">📍</span>
                  <span className="vehicle-text">{location}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Estimated Completion */}
          <div className="completion-section">
            <div className="timing-info">
              <div className="elapsed-time">
                <span className="time-icon">⏱️</span>
                <span className="time-value">{formatElapsedTime(elapsedTime)} elapsed</span>
              </div>
              <div className={`completion-estimate ${completionStatus.class}`}>
                <span className="completion-icon">⏰</span>
                <span className="completion-text">~{completionStatus.text} remaining</span>
              </div>
            </div>
          </div>
        </div>

        <div className="expand-indicator">
          <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="progress-expanded">
          <div className="assessment-details">
            <div className="detail-section">
              <h4>{wizardInfo.icon} {wizardInfo.displayName}</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{wizardInfo.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority:</span>
                  <span className={`detail-value priority-badge ${enhancedPriority}`}>
                    {enhancedPriority.toUpperCase()}
                  </span>
                </div>
                {location && (
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{location}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Started:</span>
                  <span className="detail-value">
                    {startTime ? new Date(startTime).toLocaleTimeString('en-GB') : 'Unknown'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Progress:</span>
                  <span className="detail-value">{progressPercentage}% complete</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Est. Duration:</span>
                  <span className="detail-value">{wizardInfo.estimated_duration} mins</span>
                </div>
              </div>
              
              {wizardInfo.dvsa_reference && (
                <div className="dvsa-section">
                  <strong>DVSA Reference:</strong> {wizardInfo.dvsa_reference}
                </div>
              )}
            </div>

            <div className="assessment-timeline">
              <h4>Assessment Progress</h4>
              <div className="timeline-steps">
                {wizardInfo.typical_steps.map((stepDesc, i) => {
                  const stepNum = i + 1;
                  const isCompleted = stepNum < currentStepNum;
                  const isCurrent = stepNum === currentStepNum;
                  
                  return (
                    <div key={stepNum} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="step-marker">
                        {isCompleted ? '✓' : stepNum}
                      </div>
                      <div className="step-label">
                        <div className="step-title">Step {stepNum}</div>
                        <div className="step-description">{stepDesc}</div>
                        {isCurrent && <span className="current-indicator">In Progress</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="decision-criteria">
              <h4>Decision Criteria</h4>
              <div className="criteria-grid">
                <div className="criteria-column stop">
                  <h5>🛑 STOP</h5>
                  <ul>
                    {wizardInfo.stop_criteria.map((criteria, i) => (
                      <li key={i}>{criteria}</li>
                    ))}
                  </ul>
                </div>
                <div className="criteria-column amber">
                  <h5>⚠️ AMBER</h5>
                  <ul>
                    {wizardInfo.amber_criteria.map((criteria, i) => (
                      <li key={i}>{criteria}</li>
                    ))}
                  </ul>
                </div>
                <div className="criteria-column continue">
                  <h5>✅ CONTINUE</h5>
                  <ul>
                    {wizardInfo.continue_criteria.map((criteria, i) => (
                      <li key={i}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="progress-actions">
              {onViewDetails && (
                <button 
                  className="action-btn view-details"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(breakdownId);
                  }}
                >
                  📱 View Live Assessment
                </button>
              )}
              {onCancel && (
                <button 
                  className="action-btn cancel-assessment"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(breakdownId);
                  }}
                >
                  🚫 Cancel Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .assessment-progress-card {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.05) 0%, 
            rgba(37, 99, 235, 0.02) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .assessment-progress-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.6) 50%, 
            transparent 100%
          );
          animation: progress-shimmer 2s infinite;
        }

        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .assessment-progress-card:hover {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.08) 0%, 
            rgba(37, 99, 235, 0.04) 100%
          );
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }

        .priority-critical {
          border-color: rgba(220, 38, 38, 0.3);
          background: linear-gradient(135deg, 
            rgba(220, 38, 38, 0.05) 0%, 
            rgba(185, 28, 28, 0.02) 100%
          );
        }

        .priority-critical::before {
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(220, 38, 38, 0.8) 50%, 
            transparent 100%
          );
        }

        .priority-high {
          border-color: rgba(245, 158, 11, 0.3);
          background: linear-gradient(135deg, 
            rgba(245, 158, 11, 0.05) 0%, 
            rgba(217, 119, 6, 0.02) 100%
          );
        }

        .progress-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .progress-main {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .progress-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .breakdown-id {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .fleet-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fleet-number {
          font-size: 13px;
          font-weight: 600;
          color: #3b82f6;
        }

        .route-info {
          font-size: 11px;
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .progress-ring-container {
          position: relative;
        }

        .progress-ring {
          width: 50px;
          height: 50px;
          position: relative;
        }

        .progress-svg {
          width: 100%;
          height: 100%;
          color: #3b82f6;
        }

        .priority-critical .progress-svg {
          color: #dc2626;
        }

        .priority-high .progress-svg {
          color: #f59e0b;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .step-number {
          font-size: 10px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .progress-details {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .current-step {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-icon {
          font-size: 16px;
        }

        .step-description {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          line-height: 1.4;
        }

        /* Enhanced Section Layouts */
        .step-description-section {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.3);
        }

        .supervisor-info-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.3);
        }

        .supervisor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .supervisor-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .supervisor-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .supervisor-meta {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .vehicle-info-section {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.3);
        }

        .vehicle-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vehicle-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .vehicle-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }

        .vehicle-text {
          font-weight: 500;
          color: #374151;
        }

        .completion-section {
          margin-bottom: 12px;
        }

        .timing-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .elapsed-time, .completion-estimate {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .time-icon, .completion-icon {
          font-size: 14px;
        }

        .time-value {
          color: #6b7280;
        }

        .completion-text {
          font-weight: 600;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .supervisor-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .supervisor-icon {
          font-size: 14px;
        }

        .supervisor-name {
          font-weight: 500;
          color: #374151;
        }

        .dvsa-reference {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #059669;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          margin-top: 4px;
        }

        .reference-icon {
          font-size: 12px;
        }

        .reference-text {
          font-weight: 500;
        }

        .timing-info {
          display: flex;
          gap: 12px;
          font-size: 12px;
        }

        .elapsed-time {
          color: #6b7280;
        }

        .completion-estimate {
          font-weight: 500;
        }

        .completion-estimate.urgent {
          color: #dc2626;
        }

        .completion-estimate.normal {
          color: #059669;
        }

        .completion-estimate.extended {
          color: #f59e0b;
        }

        .completion-estimate.unknown {
          color: #6b7280;
        }

        .expand-indicator {
          display: flex;
          align-items: center;
        }

        .expand-arrow {
          font-size: 12px;
          color: #6b7280;
          transition: transform 0.3s ease;
        }

        .expand-arrow.expanded {
          transform: rotate(180deg);
        }

        .progress-expanded {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(226, 232, 240, 0.5);
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

        .assessment-details {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .detail-value {
          font-size: 12px;
          color: #374151;
          font-weight: 600;
        }

        .priority-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }

        .priority-badge.critical {
          background: #fee2e2;
          color: #dc2626;
        }

        .priority-badge.high {
          background: #fef3c7;
          color: #d97706;
        }

        .priority-badge.medium {
          background: #e0e7ff;
          color: #3730a3;
        }

        .priority-badge.normal {
          background: #f0f9ff;
          color: #0369a1;
        }

        .dvsa-section {
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.05);
          border-left: 3px solid #10b981;
          border-radius: 4px;
          font-size: 12px;
          color: #059669;
        }

        .assessment-timeline h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .timeline-steps {
          display: flex;
          gap: 16px;
          align-items: center;
          overflow-x: auto;
          padding: 8px 0;
        }

        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 60px;
        }

        .step-marker {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          transition: all 0.3s ease;
        }

        .timeline-step.completed .step-marker {
          background: #10b981;
          color: white;
        }

        .timeline-step.current .step-marker {
          background: #3b82f6;
          color: white;
          animation: pulse 2s infinite;
        }

        .step-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
          position: relative;
          min-width: 120px;
        }

        .step-title {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
        }

        .step-label .step-description {
          font-size: 9px;
          color: #9ca3af;
          text-align: center;
          line-height: 1.2;
          max-width: 100px;
        }

        .current-indicator {
          display: block;
          background: #3b82f6;
          color: white;
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 8px;
          margin-top: 2px;
        }

        .progress-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.view-details {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .action-btn.view-details:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }

        .action-btn.cancel-assessment {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .action-btn.cancel-assessment:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-1px);
        }

        .decision-criteria {
          margin-top: 20px;
        }

        .decision-criteria h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .criteria-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .criteria-column {
          padding: 12px;
          border-radius: 8px;
          border: 1px solid;
        }

        .criteria-column.stop {
          background: rgba(220, 38, 38, 0.05);
          border-color: rgba(220, 38, 38, 0.2);
        }

        .criteria-column.amber {
          background: rgba(245, 158, 11, 0.05);
          border-color: rgba(245, 158, 11, 0.2);
        }

        .criteria-column.continue {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .criteria-column h5 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .criteria-column.stop h5 {
          color: #dc2626;
        }

        .criteria-column.amber h5 {
          color: #d97706;
        }

        .criteria-column.continue h5 {
          color: #059669;
        }

        .criteria-column ul {
          margin: 0;
          padding: 0 0 0 16px;
          list-style: none;
        }

        .criteria-column li {
          font-size: 11px;
          line-height: 1.4;
          margin-bottom: 4px;
          position: relative;
          color: #374151;
        }

        .criteria-column li::before {
          content: '•';
          position: absolute;
          left: -12px;
          font-weight: bold;
        }

        .criteria-column.stop li::before {
          color: #dc2626;
        }

        .criteria-column.amber li::before {
          color: #d97706;
        }

        .criteria-column.continue li::before {
          color: #059669;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 768px) {
          .progress-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .progress-meta {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .timing-info {
            justify-content: space-between;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .timeline-steps {
            justify-content: center;
          }

          .progress-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - prevent re-render if key props haven't changed
  return (
    prevProps.breakdownId === nextProps.breakdownId &&
    prevProps.currentStep === nextProps.currentStep &&
    prevProps.stepDescription === nextProps.stepDescription &&
    prevProps.supervisor === nextProps.supervisor &&
    prevProps.estimatedCompletion === nextProps.estimatedCompletion &&
    prevProps.fleetNumber === nextProps.fleetNumber &&
    prevProps.route === nextProps.route &&
    prevProps.location === nextProps.location &&
    prevProps.wizardType === nextProps.wizardType &&
    prevProps.priority === nextProps.priority &&
    prevProps.startTime === nextProps.startTime
  );
});

// Add display name for debugging
AssessmentProgressCard.displayName = 'AssessmentProgressCard';

export default AssessmentProgressCard;