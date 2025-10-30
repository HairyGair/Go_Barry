import React, { useState } from 'react';
import { apiClient } from '../../services/api-client';

const StatusUpdatePanel = ({ breakdown, onStatusUpdated, onClose }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [eta, setEta] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = [
    {
      id: 'arrived',
      label: 'Arrived On Site',
      icon: '📍',
      description: 'Engineer has arrived at breakdown location',
      color: '#f59e0b',
      requiresEta: false
    },
    {
      id: 'working',
      label: 'Working on Repair',
      icon: '🔧',
      description: 'Engineer is actively working on the vehicle',
      color: '#8b5cf6',
      requiresEta: false
    },
    {
      id: 'completed',
      label: 'Repair Completed',
      icon: '✅',
      description: 'Repair work has been completed',
      color: '#10b981',
      requiresEta: false
    }
  ];

  // Determine which statuses are available based on current status
  const getAvailableStatuses = () => {
    const currentStatus = breakdown.status;

    // Status progression logic
    const statusFlow = {
      'active': ['dispatched'],
      'pending': ['dispatched'],
      'dispatched': ['on_site'],
      'on_site': ['fixing'],
      'in_progress': ['testing'],
      'fixing': ['testing']
    };

    const allowedIds = statusFlow[currentStatus] || [];
    return statusOptions.filter(opt => allowedIds.includes(opt.id));
  };

  const availableStatuses = getAvailableStatuses();

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    if (selectedStatus.requiresEta && !eta) {
      setError('ETA is required for dispatched status');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/engineering/update-engineer-status', {
        breakdown_id: breakdown.breakdown_id,
        status: selectedStatus.id,
        notes: notes.trim() || null
      });

      if (response.success) {
        if (onStatusUpdated) {
          onStatusUpdated(response.breakdown);
        }
        if (onClose) {
          onClose();
        }
      } else {
        setError(response.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="status-update-panel">
      <div className="panel-header">
        <h3>Update Job Status</h3>
        <p className="breakdown-info">
          Fleet {breakdown.fleet_number} - {breakdown.breakdown_id}
        </p>
      </div>

      {availableStatuses.length === 0 ? (
        <div className="no-options">
          <p>No status updates available at this stage.</p>
          <p className="hint">Current status: <strong>{breakdown.status}</strong></p>
        </div>
      ) : (
        <>
          <div className="status-options">
            <label className="section-label">Select New Status:</label>
            <div className="status-grid">
              {availableStatuses.map(status => (
                <button
                  key={status.id}
                  className={`status-option ${selectedStatus?.id === status.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStatus(status)}
                  style={{
                    borderColor: selectedStatus?.id === status.id ? status.color : 'transparent'
                  }}
                >
                  <div className="status-icon" style={{ color: status.color }}>
                    {status.icon}
                  </div>
                  <div className="status-label">{status.label}</div>
                  <div className="status-description">{status.description}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedStatus?.requiresEta && (
            <div className="eta-input-section">
              <label className="section-label">Estimated Time of Arrival (minutes):</label>
              <input
                type="number"
                className="eta-input"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                placeholder="e.g., 15"
                min="1"
                max="120"
              />
            </div>
          )}

          <div className="notes-section">
            <label className="section-label">Notes (optional):</label>
            <textarea
              className="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes about this status update..."
              rows={4}
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={updating}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleStatusUpdate}
              disabled={updating || !selectedStatus}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .status-update-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel-header h3 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 20px;
        }

        .breakdown-info {
          margin: 0;
          color: #999;
          font-size: 14px;
        }

        .no-options {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .no-options p {
          color: #999;
          margin: 0 0 8px 0;
        }

        .no-options .hint {
          color: #64b5f6;
          font-size: 14px;
        }

        .section-label {
          display: block;
          color: #64b5f6;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .status-options {
          display: flex;
          flex-direction: column;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .status-option {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .status-option:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .status-option.selected {
          background: rgba(100, 181, 246, 0.1);
        }

        .status-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .status-label {
          color: white;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .status-description {
          color: #999;
          font-size: 12px;
        }

        .eta-input-section {
          display: flex;
          flex-direction: column;
        }

        .eta-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 12px;
          color: white;
          font-size: 16px;
          width: 200px;
        }

        .eta-input:focus {
          outline: none;
          border-color: #64b5f6;
          background: rgba(255, 255, 255, 0.08);
        }

        .notes-section {
          display: flex;
          flex-direction: column;
        }

        .notes-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 12px;
          color: white;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .notes-input:focus {
          outline: none;
          border-color: #64b5f6;
          background: rgba(255, 255, 255, 0.08);
        }

        .notes-input::placeholder {
          color: #666;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 6px;
          padding: 12px;
          color: #ef4444;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-primary {
          background: #64b5f6;
          color: #1a1a2e;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5da9e8;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default StatusUpdatePanel;
