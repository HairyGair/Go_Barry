import React, { useState } from 'react';
import JobDetailsModal from './JobDetailsModal';
import StatusUpdatePanel from './StatusUpdatePanel';
import ResolutionDialog from './ResolutionDialog';
import { apiClient } from '../../services/api-client';

const EngineeringCardEnhanced = ({
  breakdown,
  engineerBadge,
  engineerName,
  onJobAccepted,
  onStatusUpdated,
  onJobCompleted,
  onRefresh
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const isAssigned = breakdown.engineer_id !== null;
  const isMyJob = breakdown.engineer_badge === engineerBadge;

  // Calculate elapsed time
  const created = new Date(breakdown.created_at);
  const now = new Date();
  const elapsedMinutes = Math.floor((now - created) / 60000);

  // Determine SLA status
  const slaStatus = elapsedMinutes > 90 ? 'critical' : elapsedMinutes > 60 ? 'warning' : 'normal';

  // Check if priority route
  const priorityRoutes = ['X10', 'X21', '21', '56', '1'];
  const isPriority = priorityRoutes.some(route => breakdown.location?.includes(route));

  // Handle accept job
  const handleAcceptJob = async () => {
    if (!engineerBadge) {
      alert('Engineer badge not set');
      return;
    }

    const eta = prompt('Enter estimated arrival time (minutes):', '15');
    if (!eta) return;

    setAccepting(true);
    try {
      const response = await apiClient.post('/api/engineering/accept-job', {
        breakdown_id: breakdown.breakdown_id,
        engineer_badge: engineerBadge,
        engineer_name: engineerName || 'Engineer',
        eta_minutes: parseInt(eta)
      });

      if (response.success) {
        if (onJobAccepted) {
          onJobAccepted(response.breakdown);
        }
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert('Failed to accept job: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      alert('Failed to accept job');
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
            {isPriority && <span className="badge badge-priority">⚠️ PRIORITY ROUTE</span>}
            <span className="badge badge-depot">{breakdown.depot || 'Unknown Depot'}</span>
            <span className={`badge badge-severity ${(breakdown.severity || breakdown.wizard_decision || '').toLowerCase()}`}>
              {breakdown.severity || breakdown.wizard_decision || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Location & Issue */}
        <div className="card-body">
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">{breakdown.location || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Issue:</span>
              <span className="info-value">{breakdown.issue_category || 'General'}</span>
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

          {/* Engineer Assignment */}
          {isAssigned && (
            <div className="engineer-info">
              <div className="engineer-icon">🔧</div>
              <div className="engineer-details">
                <div className="engineer-name">{breakdown.engineer_name}</div>
                <div className="engineer-badge-number">{breakdown.engineer_badge}</div>
                {breakdown.engineer_eta_minutes && (
                  <div className="engineer-eta">ETA: {breakdown.engineer_eta_minutes} min</div>
                )}
              </div>
              {isMyJob && <span className="my-job-badge">MY JOB</span>}
            </div>
          )}
        </div>

        {/* Timeline/Progress */}
        {isAssigned && (
          <div className="progress-section">
            <div className="progress-steps">
              <ProgressStep label="Accepted" active={!!breakdown.engineer_accepted_at} />
              <ProgressStep label="On Site" active={!!breakdown.engineer_on_site_at} />
              <ProgressStep label="Fixing" active={!!breakdown.engineer_fixing_at} />
              <ProgressStep label="Complete" active={!!breakdown.engineer_completed_at} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions">
          {!isAssigned ? (
            <>
              <button
                className="action-btn primary"
                onClick={handleAcceptJob}
                disabled={accepting}
              >
                {accepting ? 'Accepting...' : '✓ Accept Job'}
              </button>
              <button
                className="action-btn secondary"
                onClick={() => setShowDetailsModal(true)}
              >
                📋 View Details
              </button>
            </>
          ) : isMyJob ? (
            <>
              <button
                className="action-btn primary"
                onClick={handleQuickStatusUpdate}
              >
                📍 Update Status
              </button>
              <button
                className="action-btn secondary"
                onClick={() => setShowDetailsModal(true)}
              >
                📋 Details
              </button>
              <button
                className="action-btn success"
                onClick={() => setShowResolutionDialog(true)}
              >
                ✅ Complete
              </button>
            </>
          ) : (
            <button
              className="action-btn secondary full-width"
              onClick={() => setShowDetailsModal(true)}
            >
              📋 View Details
            </button>
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

          .engineer-badge-number {
            color: #64b5f6;
            font-size: 12px;
            font-family: monospace;
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
              engineerBadge={engineerBadge}
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
              engineerBadge={engineerBadge}
              engineerName={engineerName}
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

export default EngineeringCardEnhanced;
