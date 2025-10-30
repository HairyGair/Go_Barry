import React, { useState } from 'react';
import JobDetailsModal from './JobDetailsModal';
import StatusUpdatePanel from './StatusUpdatePanel';
import ResolutionDialog from './ResolutionDialog';
import AssessmentDetail from './AssessmentDetail';
import ContactActions from './ContactActions';
import VehicleHistory from './VehicleHistory';
import NavigationButton from './NavigationButton';
import DepotContactBadge from '../../components/DepotContactBadge';
import { apiClient } from '../../services/api-client';
import { createAssessmentSummary, getServiceImpact } from './utils/assessmentParser';

const EngineeringCardEnhanced = ({
  breakdown,
  onJobAccepted,
  onStatusUpdated,
  onJobCompleted,
  onRefresh
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Check if engineer has been dispatched (simplified - no individual tracking)
  const isDispatched = breakdown.status === 'dispatched' ||
                       breakdown.status === 'on_site' ||
                       breakdown.status === 'in_progress' ||
                       breakdown.engineer_dispatched_at !== null;

  // Calculate elapsed time
  const created = new Date(breakdown.created_at);
  const now = new Date();
  const elapsedMinutes = Math.floor((now - created) / 60000);

  // Determine SLA status
  const slaStatus = elapsedMinutes > 90 ? 'critical' : elapsedMinutes > 60 ? 'warning' : 'normal';

  // Get assessment summary and service impact
  const assessmentSummary = createAssessmentSummary(breakdown);
  const serviceImpact = getServiceImpact(breakdown);

  // Check if priority route
  const isPriority = serviceImpact.level === 'CRITICAL' || serviceImpact.level === 'HIGH';

  // Handle dispatch engineer (simplified - no individual tracking)
  const handleDispatchEngineer = async () => {
    const eta = prompt('Estimated arrival time (minutes):', '30');
    if (eta === null) return; // User cancelled

    setAccepting(true);
    try {
      const response = await apiClient.post('/api/engineering/assign', {
        breakdown_id: breakdown.breakdown_id,
        estimated_arrival_minutes: parseInt(eta) || null,
        assigned_by: 'Engineering Manager'
      });

      if (response.success) {
        if (onJobAccepted) {
          onJobAccepted(response.dispatch);
        }
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert('Failed to dispatch engineer: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error dispatching engineer:', error);
      alert('Failed to dispatch engineer');
    } finally {
      setAccepting(false);
    }
  };

  // Quick status update handler
  const handleQuickStatusUpdate = () => {
    setShowStatusPanel(true);
  };

  // Handle status updated
  const handleStatusUpdated = (updatedBreakdown) => {
    if (onStatusUpdated) {
      onStatusUpdated(updatedBreakdown);
    }
    if (onRefresh) {
      onRefresh();
    }
    setShowStatusPanel(false);
  };

  // Handle job resolved
  const handleJobResolved = (completion) => {
    if (onJobCompleted) {
      onJobCompleted(completion);
    }
    if (onRefresh) {
      onRefresh();
    }
    setShowResolutionDialog(false);
  };

  return (
    <>
      <div className={`engineering-card ${slaStatus} ${isPriority ? 'priority' : ''}`}>
        {/* Header */}
        <div className="card-header">
          <div className="header-row">
            <div className="fleet-info">
              <h3 className="fleet-number">Fleet {breakdown.fleet_number}</h3>
              <p className="breakdown-id">{breakdown.breakdown_id}</p>
            </div>
            <div className="elapsed-time">
              <span className="time-value">{elapsedMinutes}</span>
              <span className="time-label">min</span>
            </div>
          </div>

          {/* Badges */}
          <div className="badge-row">
            {serviceImpact.level === 'CRITICAL' && (
              <span className="badge badge-impact-critical">
                🚨 CRITICAL SERVICE IMPACT
              </span>
            )}
            {serviceImpact.level === 'HIGH' && (
              <span className="badge badge-impact-high">
                ⚠️ HIGH SERVICE IMPACT
              </span>
            )}
            <span className="badge badge-depot">{breakdown.depot || 'Unknown Depot'}</span>
            <DepotContactBadge
              fleetNumber={breakdown.fleet_number}
              depot={breakdown.depot}
              size="small"
              showDepotName={false}
              variant="inline"
            />
            <span className={`badge badge-severity ${(breakdown.severity || breakdown.wizard_decision || '').toLowerCase()}`}>
              {breakdown.severity || breakdown.wizard_decision || 'Unknown'}
            </span>
            {assessmentSummary.safety.hasConcerns && (
              <span className="badge badge-safety">
                🚨 {assessmentSummary.safety.criticalCount} SAFETY CONCERN{assessmentSummary.safety.criticalCount > 1 ? 'S' : ''}
              </span>
            )}
            {breakdown.wizard_assessment_data?.not_in_service && (
              <span className="badge badge-not-in-service">
                🔵 NOT IN SERVICE (Light Running)
              </span>
            )}
          </div>

          {/* Service Impact Details */}
          {serviceImpact.factors.length > 0 && (
            <div className="impact-factors">
              {serviceImpact.factors.map((factor, idx) => (
                <span key={idx} className="impact-factor">• {factor}</span>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle History */}
        <VehicleHistory fleetNo={breakdown.fleet_no} compact={true} />

        {/* Location & Issue */}
        <div className="card-body">
          {/* Navigation */}
          <NavigationButton breakdown={breakdown} variant="inline" />

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Issue:</span>
              <span className="info-value">{breakdown.issue_category || 'General'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Depot:</span>
              <span className="info-value">{breakdown.depot || 'Unknown'}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Supervisor:</span>
              <span className="info-value">{breakdown.supervisor_name || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`status-badge status-${breakdown.status}`}>
                {formatStatus(breakdown.status)}
              </span>
            </div>
          </div>

          {/* Engineer Dispatch Status */}
          {isDispatched && (
            <div className="engineer-info">
              <div className="engineer-icon">🔧</div>
              <div className="engineer-details">
                <div className="engineer-name">Engineer Dispatched</div>
                <div className="engineer-dispatch-time">
                  Dispatched: {formatTime(breakdown.engineer_dispatched_at || breakdown.dispatched_at)}
                </div>
                {breakdown.engineer_eta_minutes && (
                  <div className="engineer-eta">ETA: {breakdown.engineer_eta_minutes} min</div>
                )}
                {breakdown.engineer_on_site_at && (
                  <div className="engineer-status-text">✓ Arrived on site</div>
                )}
                {breakdown.engineer_fixing_at && (
                  <div className="engineer-status-text">🔧 Repair in progress</div>
                )}
              </div>
            </div>
          )}

          {/* Assessment Summary */}
          {assessmentSummary.symptoms.length > 0 && (
            <div className="assessment-summary">
              <div className="summary-header">
                <span className="summary-icon">🔍</span>
                <span className="summary-title">Assessment Summary</span>
              </div>
              <ul className="symptoms-quick-list">
                {assessmentSummary.symptoms.slice(0, 3).map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
              {assessmentSummary.suggestedSkills.length > 0 && (
                <div className="suggested-skills">
                  <strong>Suggested Skills:</strong>{' '}
                  {assessmentSummary.suggestedSkills.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full Assessment Detail (Collapsible) */}
        <AssessmentDetail breakdown={breakdown} compact={true} />

        {/* Contact Actions */}
        <ContactActions breakdown={breakdown} />

        {/* Timeline/Progress */}
        {isDispatched && (
          <div className="progress-section">
            <div className="progress-steps">
              <ProgressStep label="Dispatched" active={!!breakdown.engineer_dispatched_at} />
              <ProgressStep label="On Site" active={!!breakdown.engineer_on_site_at} />
              <ProgressStep label="Working" active={!!breakdown.engineer_fixing_at} />
              <ProgressStep label="Complete" active={!!breakdown.engineer_completed_at} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions">
          {!isDispatched ? (
            <>
              <button
                className="action-btn primary"
                onClick={handleDispatchEngineer}
                disabled={accepting}
              >
                {accepting ? 'Dispatching...' : '🚗 Dispatch Engineer'}
              </button>
              <button
                className="action-btn secondary"
                onClick={() => setShowDetailsModal(true)}
              >
                📋 Full Details
              </button>
            </>
          ) : (
            <>
              <button
                className="action-btn secondary"
                onClick={() => setShowDetailsModal(true)}
              >
                📋 Details
              </button>
              {breakdown.status !== 'resolved' && breakdown.status !== 'cleared' && (
                <button
                  className="action-btn success"
                  onClick={() => setShowResolutionDialog(true)}
                >
                  ✅ Mark Complete
                </button>
              )}
            </>
          )}
        </div>

        <style jsx>{`
          .engineering-card {
            background: #1a1a2e;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
          }

          .engineering-card:hover {
            border-color: rgba(100, 181, 246, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          }

          .engineering-card.warning {
            border-color: rgba(245, 158, 11, 0.5);
          }

          .engineering-card.critical {
            border-color: rgba(239, 68, 68, 0.7);
            animation: pulse-border 2s infinite;
          }

          .engineering-card.priority {
            border-top: 4px solid #f59e0b;
          }

          @keyframes pulse-border {
            0%, 100% {
              border-color: rgba(239, 68, 68, 0.7);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            }
            50% {
              border-color: rgba(239, 68, 68, 1);
              box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
            }
          }

          .card-header {
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
          }

          .fleet-info {
            flex: 1;
          }

          .fleet-number {
            margin: 0 0 4px 0;
            color: white;
            font-size: 20px;
            font-weight: bold;
          }

          .breakdown-id {
            margin: 0;
            color: #999;
            font-size: 12px;
            font-family: monospace;
          }

          .elapsed-time {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: rgba(239, 68, 68, 0.2);
            padding: 8px 16px;
            border-radius: 8px;
          }

          .time-value {
            font-size: 28px;
            font-weight: bold;
            color: #ef4444;
            line-height: 1;
          }

          .time-label {
            font-size: 11px;
            color: #999;
            text-transform: uppercase;
          }

          .badge-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .badge-priority {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
          }

          .badge-depot {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
          }

          .badge-severity {
            background: rgba(156, 163, 175, 0.2);
            color: #9ca3af;
          }

          .badge-severity.stop {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
          }

          .badge-severity.amber {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
          }

          .badge-severity.continue {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
          }

          .badge-impact-critical {
            background: rgba(239, 68, 68, 0.3);
            color: #fee;
            border: 1px solid rgba(239, 68, 68, 0.6);
            animation: pulse-badge 2s infinite;
          }

          @keyframes pulse-badge {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          .badge-impact-high {
            background: rgba(245, 158, 11, 0.3);
            color: #fff;
            border: 1px solid rgba(245, 158, 11, 0.6);
          }

          .badge-safety {
            background: rgba(239, 68, 68, 0.3);
            color: #fee;
            border: 1px solid rgba(239, 68, 68, 0.6);
            font-weight: 700;
          }

          .badge-not-in-service {
            background: rgba(59, 130, 246, 0.3);
            color: #93c5fd;
            border: 1px solid rgba(59, 130, 246, 0.6);
            font-weight: 600;
          }

          .impact-factors {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .impact-factor {
            font-size: 11px;
            color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
            padding: 3px 8px;
            border-radius: 4px;
          }

          .card-body {
            padding: 16px;
          }

          .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }

          .info-row:last-child {
            margin-bottom: 0;
          }

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .info-label {
            color: #999;
            font-size: 11px;
            text-transform: uppercase;
          }

          .info-value {
            color: white;
            font-size: 14px;
            font-weight: 500;
          }

          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            display: inline-block;
          }

          .status-pending, .status-active {
            background: rgba(156, 163, 175, 0.2);
            color: #9ca3af;
          }

          .status-dispatched {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
          }

          .status-on_site {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
          }

          .status-in_progress {
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
          }

          .status-resolved {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
          }

          .engineer-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(100, 181, 246, 0.1);
            border-radius: 8px;
            border-left: 3px solid #64b5f6;
            margin-top: 12px;
          }

          .engineer-icon {
            font-size: 24px;
          }

          .engineer-details {
            flex: 1;
          }

          .engineer-name {
            color: white;
            font-weight: 600;
            font-size: 14px;
          }

          .engineer-dispatch-time {
            color: #64b5f6;
            font-size: 12px;
            font-family: monospace;
            margin-top: 4px;
          }

          .engineer-status-text {
            color: #10b981;
            font-size: 12px;
            font-weight: 600;
            margin-top: 4px;
          }

          .engineer-eta {
            color: #999;
            font-size: 11px;
            margin-top: 2px;
          }

          .my-job-badge {
            background: #10b981;
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
          }

          .assessment-summary {
            margin-top: 12px;
            padding: 12px;
            background: rgba(100, 181, 246, 0.08);
            border-radius: 8px;
            border-left: 3px solid #64b5f6;
          }

          .summary-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
          }

          .summary-icon {
            font-size: 16px;
          }

          .summary-title {
            color: #64b5f6;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .symptoms-quick-list {
            margin: 0 0 8px 0;
            padding-left: 20px;
            color: #e0e0e0;
            font-size: 12px;
            line-height: 1.6;
          }

          .symptoms-quick-list li {
            margin-bottom: 4px;
          }

          .suggested-skills {
            font-size: 11px;
            color: #999;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .suggested-skills strong {
            color: #64b5f6;
          }

          .progress-section {
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .progress-steps {
            display: flex;
            justify-content: space-between;
            position: relative;
          }

          .card-actions {
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 8px;
          }

          .action-btn {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .action-btn.primary {
            background: #64b5f6;
            color: #1a1a2e;
          }

          .action-btn.primary:hover:not(:disabled) {
            background: #5da9e8;
            transform: translateY(-1px);
          }

          .action-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .action-btn.secondary:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
          }

          .action-btn.success {
            background: #10b981;
            color: white;
          }

          .action-btn.success:hover:not(:disabled) {
            background: #059669;
            transform: translateY(-1px);
          }

          .action-btn.full-width {
            flex: 1 1 100%;
          }
        `}</style>
      </div>

      {/* Modals */}
      {showDetailsModal && (
        <JobDetailsModal
          show={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          breakdownId={breakdown.breakdown_id}
        />
      )}

      {showStatusPanel && (
        <div className="modal-overlay" onClick={() => setShowStatusPanel(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <StatusUpdatePanel
              breakdown={breakdown}
              onStatusUpdated={handleStatusUpdated}
              onClose={() => setShowStatusPanel(false)}
            />
          </div>
        </div>
      )}

      {showResolutionDialog && (
        <div className="modal-overlay" onClick={() => setShowResolutionDialog(false)}>
          <div className="modal-container large" onClick={e => e.stopPropagation()}>
            <ResolutionDialog
              breakdown={breakdown}
              onResolved={handleJobResolved}
              onClose={() => setShowResolutionDialog(false)}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: #1a1a2e;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .modal-container.large {
          max-width: 900px;
        }
      `}</style>
    </>
  );
};

// Progress Step Component
const ProgressStep = ({ label, active }) => (
  <div className={`progress-step ${active ? 'active' : ''}`}>
    <div className="step-dot"></div>
    <div className="step-label">{label}</div>

    <style jsx>{`
      .progress-step {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .step-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        margin-bottom: 8px;
        transition: all 0.3s;
      }

      .progress-step.active .step-dot {
        background: #64b5f6;
        border-color: #64b5f6;
        box-shadow: 0 0 8px rgba(100, 181, 246, 0.5);
      }

      .step-label {
        font-size: 10px;
        color: #999;
        text-transform: uppercase;
        text-align: center;
      }

      .progress-step.active .step-label {
        color: #64b5f6;
        font-weight: 600;
      }
    `}</style>
  </div>
);

// Helper function to format status
function formatStatus(status) {
  const statusMap = {
    'active': 'Active',
    'pending': 'Pending',
    'dispatched': 'Dispatched',
    'on_site': 'On Site',
    'in_progress': 'Fixing',
    'resolved': 'Resolved'
  };
  return statusMap[status] || status;
}

// Helper function to format time
function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m ago`;
  }
}

export default EngineeringCardEnhanced;
