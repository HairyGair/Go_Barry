import React, { useState } from 'react';

/**
 * Resolution Dialog Component
 * Modal dialog for marking a breakdown as resolved
 */
const BreakdownResolutionDialog = ({
  breakdown,
  isOpen,
  onClose,
  onConfirm,
  currentSupervisor
}) => {
  const [resolutionType, setResolutionType] = useState('fixed');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [returnedToService, setReturnedToService] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onConfirm({
        breakdown_id: breakdown.breakdown_id,
        resolved_by: currentSupervisor?.name || 'SDC Operator',
        supervisor_badge: currentSupervisor?.badge || currentSupervisor?.supervisorBadge || 'SDC',
        resolution_notes: resolutionNotes.trim(),
        returned_to_service: returnedToService,
        resolution_type: resolutionType
      });

      // Reset form
      setResolutionNotes('');
      setResolutionType('fixed');
      setReturnedToService(true);
      onClose();
    } catch (error) {
      console.error('Error resolving breakdown:', error);
      alert('Failed to resolve breakdown. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolutionTypes = [
    { value: 'fixed', label: '✅ Fixed', description: 'Issue resolved, vehicle repaired' },
    { value: 'changeover', label: '🔄 Changeover', description: 'Vehicle swapped/replaced' },
    { value: 'cancelled', label: '❌ Cancelled', description: 'Breakdown report cancelled' },
    { value: 'duplicate', label: '📋 Duplicate', description: 'Duplicate report' },
    { value: 'other', label: '🔧 Other', description: 'Other resolution method' }
  ];

  return (
    <div className="resolution-dialog-overlay" onClick={onClose}>
      <div className="resolution-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="resolution-dialog-header">
          <h2>Mark Breakdown as Resolved</h2>
          <button className="close-btn" onClick={onClose} type="button">×</button>
        </div>

        <div className="resolution-dialog-body">
          {/* Breakdown Summary */}
          <div className="breakdown-summary">
            <div className="summary-item">
              <span className="label">Breakdown ID:</span>
              <span className="value">{breakdown.breakdown_id}</span>
            </div>
            <div className="summary-item">
              <span className="label">Fleet Number:</span>
              <span className="value">{breakdown.fleet_number || breakdown.fleet_no || 'Unknown'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Issue:</span>
              <span className="value">{breakdown.issue_category || breakdown.issue_type || 'General'}</span>
            </div>
            {breakdown.location && (
              <div className="summary-item">
                <span className="label">Location:</span>
                <span className="value">{breakdown.location}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Resolution Type */}
            <div className="form-group">
              <label htmlFor="resolutionType">Resolution Type *</label>
              <div className="resolution-type-options">
                {resolutionTypes.map(type => (
                  <label
                    key={type.value}
                    className={`resolution-type-option ${resolutionType === type.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="resolutionType"
                      value={type.value}
                      checked={resolutionType === type.value}
                      onChange={(e) => setResolutionType(e.target.value)}
                    />
                    <div className="option-content">
                      <div className="option-label">{type.label}</div>
                      <div className="option-description">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Resolution Notes */}
            <div className="form-group">
              <label htmlFor="resolutionNotes">
                Resolution Notes
                <span className="optional">(Optional)</span>
              </label>
              <textarea
                id="resolutionNotes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter details about the resolution (e.g., 'Replaced steering pump at depot', 'Vehicle swapped with fleet 6302')"
                maxLength={1000}
                rows={4}
              />
              <div className="char-count">
                {resolutionNotes.length} / 1000 characters
              </div>
            </div>

            {/* Returned to Service */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={returnedToService}
                  onChange={(e) => setReturnedToService(e.target.checked)}
                />
                <span>Vehicle returned to service</span>
              </label>
              <p className="help-text">
                Check this if the vehicle is back in service and available for use
              </p>
            </div>

            {/* Action Buttons */}
            <div className="resolution-dialog-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-confirm"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .resolution-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .resolution-dialog {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .resolution-dialog-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .resolution-dialog-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 32px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .resolution-dialog-body {
          padding: 24px;
        }

        .breakdown-summary {
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-item .label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }

        .summary-item .value {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .optional {
          font-weight: 400;
          color: #9ca3af;
          margin-left: 4px;
          font-size: 13px;
        }

        .resolution-type-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .resolution-type-option {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .resolution-type-option:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .resolution-type-option.selected {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #dbeafe, #eff6ff);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .resolution-type-option input[type="radio"] {
          margin-top: 2px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .option-content {
          flex: 1;
        }

        .option-label {
          font-weight: 600;
          color: #111827;
          font-size: 15px;
          margin-bottom: 2px;
        }

        .option-description {
          font-size: 13px;
          color: #6b7280;
        }

        textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .char-count {
          font-size: 12px;
          color: #9ca3af;
          text-align: right;
          margin-top: 4px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .help-text {
          font-size: 13px;
          color: #6b7280;
          margin-top: 6px;
          margin-bottom: 0;
        }

        .resolution-dialog-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-confirm {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .btn-confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          transform: translateY(-1px);
        }

        .btn-confirm:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default BreakdownResolutionDialog;