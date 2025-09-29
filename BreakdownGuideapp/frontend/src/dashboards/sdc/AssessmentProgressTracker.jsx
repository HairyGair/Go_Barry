import React, { useState, useEffect } from 'react';

const AssessmentProgressTracker = ({ assessments = [] }) => {
  const [expandedAssessment, setExpandedAssessment] = useState(null);

  // Auto-expand if only one assessment
  useEffect(() => {
    if (assessments.length === 1) {
      setExpandedAssessment(assessments[0].breakdown_id);
    } else if (assessments.length === 0) {
      setExpandedAssessment(null);
    }
  }, [assessments]);

  const getElapsedTime = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const elapsed = Math.floor((now - start) / 1000 / 60); // minutes
    
    if (elapsed < 1) return 'Just started';
    if (elapsed === 1) return '1 minute';
    return `${elapsed} minutes`;
  };

  const getProgressColor = (elapsed) => {
    if (elapsed < 5) return '#10b981'; // green
    if (elapsed < 10) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getProgressPercentage = (elapsed) => {
    // Assume 15 minutes is 100% (expected assessment time)
    return Math.min((elapsed / 15) * 100, 100);
  };

  const formatSupervisorName = (assessment) => {
    return assessment.supervisorName || 
           assessment.supervisor_name || 
           assessment.actor_name || 
           'Unknown Supervisor';
  };

  const toggleExpanded = (assessmentId) => {
    setExpandedAssessment(prev => prev === assessmentId ? null : assessmentId);
  };

  if (assessments.length === 0) return null;

  return (
    <div className="assessment-progress-tracker">
      <div className="tracker-header">
        <h3>🔄 Active Assessments</h3>
        <span className="assessment-count">{assessments.length} in progress</span>
      </div>
      
      <div className="assessments-grid">
        {assessments.map(assessment => {
          const elapsedMinutes = Math.floor((new Date() - new Date(assessment.timestamp)) / 1000 / 60);
          const progressPercentage = getProgressPercentage(elapsedMinutes);
          const progressColor = getProgressColor(elapsedMinutes);
          const isExpanded = expandedAssessment === assessment.breakdown_id;
          
          return (
            <div 
              key={assessment.breakdown_id || assessment.id}
              className={`assessment-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpanded(assessment.breakdown_id)}
            >
              <div className="assessment-header">
                <div className="vehicle-info">
                  <span className="fleet-number">Fleet {assessment.fleet_no || assessment.busNumber}</span>
                  {assessment.route && (
                    <span className="route-badge">Route {assessment.route}</span>
                  )}
                </div>
                <div className="assessment-status">
                  <div 
                    className="progress-ring"
                    style={{ '--progress': progressPercentage, '--color': progressColor }}
                  >
                    <div className="progress-text">{elapsedMinutes}m</div>
                  </div>
                </div>
              </div>
              
              <div className="assessment-details">
                <div className="supervisor-info">
                  <span className="supervisor-label">Supervisor:</span>
                  <span className="supervisor-name">{formatSupervisorName(assessment)}</span>
                </div>
                
                <div className="issue-info">
                  <span className="issue-label">Issue:</span>
                  <span className="issue-type">{assessment.issue || assessment.issue_type || 'General Assessment'}</span>
                </div>
                
                <div className="elapsed-time">
                  Started: {getElapsedTime(assessment.timestamp)}
                </div>
              </div>
              
              {isExpanded && (
                <div className="assessment-expanded">
                  <div className="progress-stages">
                    <div className="stage completed">
                      <div className="stage-icon">📋</div>
                      <span>Assessment Started</span>
                    </div>
                    <div className="stage current">
                      <div className="stage-icon">🔍</div>
                      <span>In Progress</span>
                    </div>
                    <div className="stage pending">
                      <div className="stage-icon">✅</div>
                      <span>Completion</span>
                    </div>
                  </div>
                  
                  {assessment.location && (
                    <div className="location-info">
                      <span className="location-label">📍 Location:</span>
                      <span className="location-value">{assessment.location}</span>
                    </div>
                  )}
                  
                  <div className="assessment-actions">
                    <button 
                      className="action-btn view-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/breakdown-guide?continue=${assessment.breakdown_id}`, '_blank');
                      }}
                    >
                      📱 View Assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .assessment-progress-tracker {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.02));
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .tracker-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .assessment-count {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .assessments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .assessment-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.5);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .assessment-card:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .assessment-card.expanded {
          background: rgba(255, 255, 255, 0.98);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 12px 35px rgba(59, 130, 246, 0.15);
        }

        .assessment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .vehicle-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fleet-number {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .route-badge {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          width: fit-content;
        }

        .assessment-status {
          position: relative;
        }

        .progress-ring {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: conic-gradient(
            var(--color) calc(var(--progress) * 1%),
            #e5e7eb 0deg
          );
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .progress-ring::before {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: white;
        }

        .progress-text {
          position: relative;
          z-index: 1;
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
        }

        .assessment-details {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          font-size: 13px;
        }

        .supervisor-info,
        .issue-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .supervisor-label,
        .issue-label {
          color: #64748b;
          font-weight: 500;
        }

        .supervisor-name,
        .issue-type {
          color: #1e293b;
          font-weight: 600;
        }

        .elapsed-time {
          color: #64748b;
          font-size: 12px;
          text-align: center;
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid rgba(226, 232, 240, 0.5);
        }

        .assessment-expanded {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(226, 232, 240, 0.3);
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

        .progress-stages {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          position: relative;
        }

        .progress-stages::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          height: 2px;
          background: linear-gradient(
            to right,
            #10b981 0%,
            #10b981 33%,
            #f59e0b 33%,
            #f59e0b 66%,
            #e5e7eb 66%
          );
          z-index: 1;
        }

        .stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 2;
        }

        .stage-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          background: white;
          border: 2px solid #e5e7eb;
        }

        .stage.completed .stage-icon {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .stage.current .stage-icon {
          background: #f59e0b;
          border-color: #f59e0b;
          color: white;
          animation: pulse 2s infinite;
        }

        .stage span {
          font-size: 10px;
          color: #64748b;
          text-align: center;
          font-weight: 500;
        }

        .location-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 12px;
        }

        .location-label {
          color: #64748b;
          font-weight: 500;
        }

        .location-value {
          color: #1e293b;
          font-weight: 600;
        }

        .assessment-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 768px) {
          .assessments-grid {
            grid-template-columns: 1fr;
          }
          
          .tracker-header {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default AssessmentProgressTracker;