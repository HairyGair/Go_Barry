import React, { useState, useEffect } from 'react';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

/**
 * EditAssessmentModal - Provides audit trail and edit capabilities for completed assessments
 * Shows assessment history, allows editing, and tracks all changes
 */
const EditAssessmentModal = ({
  isOpen = false,
  onClose,
  breakdownId,
  originalDecision = "UNKNOWN",
  originalAssessment = {},
  auditTrail = [],
  onEdit,
  onCancel
}) => {
  const [assessmentData, setAssessmentData] = useState(null);
  const [auditHistory, setAuditHistory] = useState(auditTrail);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [editReason, setEditReason] = useState('');

  // Load assessment data when modal opens
  useEffect(() => {
    if (isOpen && breakdownId) {
      loadAssessmentData();
    }
  }, [isOpen, breakdownId]);

  const loadAssessmentData = async () => {
    setLoading(true);
    try {
      // Load assessment details
      const response = await fetch(`${apiConfig.baseUrl}/api/sdc/${breakdownId}/assessment`);
      if (response.ok) {
        const data = await response.json();
        setAssessmentData(data.assessment || originalAssessment);
      } else {
        setAssessmentData(originalAssessment);
      }

      // Load audit trail
      const auditResponse = await fetch(`${apiConfig.baseUrl}/api/sdc/${breakdownId}/audit`);
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditHistory(auditData.history || auditTrail);
      } else {
        setAuditHistory(auditTrail);
      }
    } catch (error) {
      console.error('Error loading assessment data:', error);
      setAssessmentData(originalAssessment);
      setAuditHistory(auditTrail);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssessment = async () => {
    if (!editReason.trim()) {
      alert('Please provide a reason for editing this assessment');
      return;
    }

    try {
      // Log the edit action
      await fetch(`${apiConfig.baseUrl}/api/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assessment_edit_initiated',
          breakdown_id: breakdownId,
          reason: editReason,
          original_decision: originalDecision,
          user_type: 'sdc_operator',
          timestamp: new Date().toISOString(),
          source: 'edit_assessment_modal'
        })
      });

      // Close modal and redirect to wizard
      onClose();
      
      if (onEdit) {
        onEdit(breakdownId, editReason);
      } else {
        // Default redirect behavior
        const returnUrl = encodeURIComponent(`/dashboards/sdc?highlight=${breakdownId}`);
        window.location.href = `/breakdown-guide?edit=${breakdownId}&return=${returnUrl}&reason=${encodeURIComponent(editReason)}`;
      }
    } catch (error) {
      console.error('Error initiating assessment edit:', error);
      alert('Failed to initiate assessment edit. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDecisionIcon = (decision) => {
    switch (decision?.toUpperCase()) {
      case 'STOP': return '🛑';
      case 'AMBER': 
      case 'CHANGEOVER': return '⚡';
      case 'CONTINUE': return '✅';
      default: return '❓';
    }
  };

  const getDecisionClass = (decision) => {
    switch (decision?.toUpperCase()) {
      case 'STOP': return 'decision-stop';
      case 'AMBER':
      case 'CHANGEOVER': return 'decision-amber';
      case 'CONTINUE': return 'decision-continue';
      default: return 'decision-unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-assessment-modal-overlay">
      <div className="edit-assessment-modal">
        <div className="modal-header">
          <div className="modal-title">
            <h2>📋 Assessment Details & Edit</h2>
            <div className="breakdown-info">
              {breakdownId} - {assessmentData?.fleet_number ? `Fleet ${assessmentData.fleet_number}` : 'Unknown Fleet'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessment')}
          >
            📊 Assessment Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            📜 Audit Trail ({auditHistory.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            ✏️ Edit Assessment
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner">🔄</div>
              <p>Loading assessment data...</p>
            </div>
          ) : (
            <>
              {/* Assessment Details Tab */}
              {activeTab === 'assessment' && (
                <div className="assessment-details-tab">
                  <div className="assessment-summary">
                    <div className="summary-header">
                      <div className={`decision-badge ${getDecisionClass(assessmentData?.decision || originalDecision)}`}>
                        {getDecisionIcon(assessmentData?.decision || originalDecision)}
                        {assessmentData?.decision || originalDecision}
                      </div>
                      <div className="assessment-type">
                        {assessmentData?.wizard_type || assessmentData?.issue_type || 'General Assessment'}
                      </div>
                    </div>

                    <div className="assessment-grid">
                      <div className="assessment-item">
                        <span className="item-label">Supervisor:</span>
                        <span className="item-value">
                          {assessmentData?.supervisor_name || 'Unknown'}
                          {assessmentData?.supervisor_badge && ` (${assessmentData.supervisor_badge})`}
                        </span>
                      </div>
                      
                      <div className="assessment-item">
                        <span className="item-label">Completed:</span>
                        <span className="item-value">
                          {assessmentData?.completed_at ? 
                            formatTimestamp(assessmentData.completed_at) : 
                            'Unknown'
                          }
                        </span>
                      </div>
                      
                      <div className="assessment-item">
                        <span className="item-label">Location:</span>
                        <span className="item-value">{assessmentData?.location || 'Not specified'}</span>
                      </div>
                      
                      <div className="assessment-item">
                        <span className="item-label">Route:</span>
                        <span className="item-value">{assessmentData?.route || 'Not specified'}</span>
                      </div>
                    </div>

                    {assessmentData?.notes && (
                      <div className="assessment-notes">
                        <h4>Assessment Notes</h4>
                        <div className="notes-content">
                          {assessmentData.notes}
                        </div>
                      </div>
                    )}

                    {assessmentData?.wizard_responses && (
                      <div className="wizard-responses">
                        <h4>Wizard Responses</h4>
                        <div className="responses-grid">
                          {Object.entries(assessmentData.wizard_responses).map(([key, value]) => (
                            <div key={key} className="response-item">
                              <span className="response-label">{key.replace(/_/g, ' ')}:</span>
                              <span className="response-value">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Trail Tab */}
              {activeTab === 'audit' && (
                <div className="audit-trail-tab">
                  <div className="audit-header">
                    <h3>📜 Complete Audit Trail</h3>
                    <p>Chronological history of all assessment actions and changes</p>
                  </div>

                  <div className="audit-timeline">
                    {auditHistory.length === 0 ? (
                      <div className="no-audit-data">
                        <p>No audit trail data available</p>
                        <small>This may be an older assessment completed before audit logging was implemented</small>
                      </div>
                    ) : (
                      auditHistory.map((entry, index) => (
                        <div key={entry.id || index} className="audit-entry">
                          <div className="audit-timestamp">
                            {formatTimestamp(entry.timestamp)}
                          </div>
                          <div className="audit-action">
                            <div className="action-type">{entry.action}</div>
                            <div className="action-details">
                              {entry.details || entry.description || 'No additional details'}
                            </div>
                            {entry.user && (
                              <div className="action-user">By: {entry.user}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Edit Assessment Tab */}
              {activeTab === 'edit' && (
                <div className="edit-assessment-tab">
                  <div className="edit-header">
                    <h3>✏️ Edit Assessment</h3>
                    <div className="edit-warning">
                      <p>⚠️ <strong>Important:</strong> Editing this assessment will create an audit trail entry and redirect you to the breakdown guide wizard.</p>
                    </div>
                  </div>

                  <div className="current-assessment">
                    <h4>Current Assessment</h4>
                    <div className="current-decision">
                      <span className={`decision-display ${getDecisionClass(assessmentData?.decision || originalDecision)}`}>
                        {getDecisionIcon(assessmentData?.decision || originalDecision)}
                        {assessmentData?.decision || originalDecision}
                      </span>
                      <span className="decision-type">
                        {assessmentData?.wizard_type || 'General Assessment'}
                      </span>
                    </div>
                  </div>

                  <div className="edit-form">
                    <div className="form-group">
                      <label htmlFor="editReason">Reason for Edit (Required)</label>
                      <textarea
                        id="editReason"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Please provide a detailed reason for editing this assessment..."
                        rows="4"
                        className="reason-textarea"
                      />
                    </div>

                    <div className="edit-confirmation">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={confirmEdit}
                          onChange={(e) => setConfirmEdit(e.target.checked)}
                        />
                        I understand that editing this assessment will create an audit trail and require completing the wizard again
                      </label>
                    </div>
                  </div>

                  <div className="edit-actions">
                    <button 
                      className="edit-btn cancel"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button 
                      className="edit-btn confirm"
                      onClick={handleEditAssessment}
                      disabled={!editReason.trim() || !confirmEdit}
                    >
                      🔄 Edit Assessment
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .edit-assessment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .edit-assessment-modal {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        }

        .modal-title h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .breakdown-info {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #64748b;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #374151;
        }

        .modal-tabs {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-btn {
          flex: 1;
          padding: 16px 20px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 3px solid transparent;
        }

        .tab-btn:hover {
          background: #f1f5f9;
          color: #374151;
        }

        .tab-btn.active {
          color: #3b82f6;
          background: white;
          border-bottom-color: #3b82f6;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .spinner {
          font-size: 24px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .assessment-summary {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .decision-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
        }

        .decision-stop {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
        }

        .decision-amber {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .decision-continue {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .decision-unknown {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
        }

        .assessment-type {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .assessment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .assessment-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .item-value {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .assessment-notes {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .assessment-notes h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .notes-content {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }

        .wizard-responses {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .wizard-responses h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .responses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .response-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .response-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .response-value {
          font-size: 13px;
          color: #374151;
          font-weight: 500;
        }

        .audit-header {
          margin-bottom: 24px;
        }

        .audit-header h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .audit-header p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .audit-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .no-audit-data {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .no-audit-data p {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .no-audit-data small {
          font-size: 12px;
          color: #9ca3af;
        }

        .audit-entry {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .audit-timestamp {
          font-size: 12px;
          color: #6b7280;
          font-family: 'Monaco', 'Consolas', monospace;
          min-width: 140px;
          flex-shrink: 0;
        }

        .audit-action {
          flex: 1;
        }

        .action-type {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .action-details {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .action-user {
          font-size: 11px;
          color: #6b7280;
          font-style: italic;
        }

        .edit-header {
          margin-bottom: 24px;
        }

        .edit-header h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .edit-warning {
          background: #fef3cd;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
        }

        .edit-warning p {
          margin: 0;
          font-size: 14px;
          color: #92400e;
        }

        .current-assessment {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .current-assessment h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .current-decision {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .decision-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
        }

        .decision-type {
          font-size: 14px;
          color: #6b7280;
        }

        .edit-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .reason-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
        }

        .reason-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .edit-confirmation {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          margin-top: 2px;
        }

        .edit-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .edit-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-btn.cancel {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #d1d5db;
        }

        .edit-btn.cancel:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .edit-btn.confirm {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .edit-btn.confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }

        .edit-btn.confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .edit-assessment-modal {
            margin: 10px;
            max-height: calc(100vh - 20px);
          }

          .modal-header {
            padding: 16px;
          }

          .modal-content {
            padding: 16px;
          }

          .tab-btn {
            padding: 12px 8px;
            font-size: 12px;
          }

          .assessment-grid {
            grid-template-columns: 1fr;
          }

          .responses-grid {
            grid-template-columns: 1fr;
          }

          .audit-entry {
            flex-direction: column;
            gap: 8px;
          }

          .audit-timestamp {
            min-width: unset;
          }

          .current-decision {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .edit-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default EditAssessmentModal;