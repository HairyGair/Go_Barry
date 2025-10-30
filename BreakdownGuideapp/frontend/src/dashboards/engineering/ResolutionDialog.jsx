import React, { useState } from 'react';
import { apiClient } from '../../services/api-client';

const ResolutionDialog = ({ breakdown, onResolved, onClose }) => {
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState([{ partNumber: '', description: '', quantity: 1 }]);
  const [laborHours, setLaborHours] = useState('');
  const [repairCategory, setRepairCategory] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [returnedToService, setReturnedToService] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);

  const resolutionTypes = [
    {
      id: 'fixed',
      label: 'Fixed on Site',
      icon: '✅',
      description: 'Vehicle repaired and returned to service',
      color: '#10b981'
    },
    {
      id: 'changeover',
      label: 'Changeover Required',
      icon: '🔄',
      description: 'Replacement vehicle needed',
      color: '#f59e0b'
    },
    {
      id: 'workshop_required',
      label: 'Workshop Required',
      icon: '🏭',
      description: 'Vehicle requires workshop repair',
      color: '#ef4444'
    },
    {
      id: 'deem_safe',
      label: 'Deemed Safe to Continue',
      icon: '✓',
      description: 'Issue not critical, vehicle can continue',
      color: '#64b5f6'
    },
    {
      id: 'escalated',
      label: 'Escalated',
      icon: '⚠️',
      description: 'Requires manager/specialist attention',
      color: '#8b5cf6'
    }
  ];

  const repairCategories = [
    'Electrical',
    'Mechanical',
    'HVAC',
    'Hydraulics',
    'Brakes',
    'Steering',
    'Engine',
    'Transmission',
    'Bodywork',
    'Destination Display',
    'Door Systems',
    'Wheelchair Ramp',
    'Other'
  ];

  const handleAddPart = () => {
    setPartsUsed([...partsUsed, { partNumber: '', description: '', quantity: 1 }]);
  };

  const handleRemovePart = (index) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const handlePartChange = (index, field, value) => {
    const updated = [...partsUsed];
    updated[index][field] = value;
    setPartsUsed(updated);
  };

  const handleComplete = async () => {
    if (!resolutionType) {
      setError('Please select a resolution type');
      return;
    }

    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes');
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      // Filter out empty parts
      const validParts = partsUsed.filter(p => p.partNumber.trim() && p.description.trim());

      const response = await apiClient.post('/api/engineering/complete-job', {
        breakdown_id: breakdown.breakdown_id,
        resolution_type: resolutionType,
        resolution_notes: resolutionNotes.trim(),
        parts_used: validParts.length > 0 ? validParts : null,
        labor_hours: laborHours ? parseFloat(laborHours) : null,
        repair_category: repairCategory || null,
        root_cause: rootCause.trim() || null,
        returned_to_service: returnedToService
      });

      if (response.success) {
        if (onResolved) {
          onResolved(response.completion);
        }
        if (onClose) {
          onClose();
        }
      } else {
        setError(response.error || 'Failed to complete job');
      }
    } catch (err) {
      console.error('Error completing job:', err);
      setError('Failed to complete job. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const selectedResolution = resolutionTypes.find(r => r.id === resolutionType);

  return (
    <div className="resolution-dialog">
      <div className="dialog-header">
        <h3>Complete Job</h3>
        <p className="breakdown-info">
          Fleet {breakdown.fleet_number} - {breakdown.breakdown_id}
        </p>
      </div>

      <div className="dialog-body">
        {/* Resolution Type Selection */}
        <div className="section">
          <label className="section-label">Resolution Type: *</label>
          <div className="resolution-grid">
            {resolutionTypes.map(type => (
              <button
                key={type.id}
                className={`resolution-option ${resolutionType === type.id ? 'selected' : ''}`}
                onClick={() => setResolutionType(type.id)}
                style={{
                  borderColor: resolutionType === type.id ? type.color : 'transparent'
                }}
              >
                <div className="resolution-icon" style={{ color: type.color }}>
                  {type.icon}
                </div>
                <div className="resolution-label">{type.label}</div>
                <div className="resolution-description">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Notes */}
        <div className="section">
          <label className="section-label">Resolution Notes: *</label>
          <textarea
            className="text-input"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Describe the work completed, diagnosis, and outcome..."
            rows={4}
          />
        </div>

        {/* Repair Details Grid */}
        <div className="details-grid">
          <div className="section">
            <label className="section-label">Repair Category:</label>
            <select
              className="select-input"
              value={repairCategory}
              onChange={(e) => setRepairCategory(e.target.value)}
            >
              <option value="">Select category...</option>
              {repairCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="section">
            <label className="section-label">Labor Hours:</label>
            <input
              type="number"
              className="text-input"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              placeholder="e.g., 1.5"
              step="0.25"
              min="0"
              max="24"
            />
          </div>
        </div>

        {/* Root Cause */}
        <div className="section">
          <label className="section-label">Root Cause Analysis:</label>
          <textarea
            className="text-input"
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="What caused this breakdown? (e.g., worn component, operator error, maintenance issue)"
            rows={2}
          />
        </div>

        {/* Parts Used */}
        <div className="section">
          <div className="section-header-row">
            <label className="section-label">Parts Used:</label>
            <button className="add-part-btn" onClick={handleAddPart}>
              + Add Part
            </button>
          </div>

          <div className="parts-list">
            {partsUsed.map((part, index) => (
              <div key={index} className="part-row">
                <input
                  type="text"
                  className="part-input part-number"
                  value={part.partNumber}
                  onChange={(e) => handlePartChange(index, 'partNumber', e.target.value)}
                  placeholder="Part number"
                />
                <input
                  type="text"
                  className="part-input part-description"
                  value={part.description}
                  onChange={(e) => handlePartChange(index, 'description', e.target.value)}
                  placeholder="Description"
                />
                <input
                  type="number"
                  className="part-input part-quantity"
                  value={part.quantity}
                  onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  max="999"
                />
                {partsUsed.length > 1 && (
                  <button
                    className="remove-part-btn"
                    onClick={() => handleRemovePart(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Returned to Service Toggle */}
        <div className="section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={returnedToService}
              onChange={(e) => setReturnedToService(e.target.checked)}
            />
            <span>Vehicle returned to service</span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="dialog-footer">
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={completing}
        >
          Cancel
        </button>
        <button
          className="btn btn-success"
          onClick={handleComplete}
          disabled={completing || !resolutionType}
        >
          {completing ? 'Completing...' : 'Complete Job'}
        </button>
      </div>

      <style jsx>{`
        .resolution-dialog {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .dialog-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dialog-header h3 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 20px;
        }

        .breakdown-info {
          margin: 0;
          color: #999;
          font-size: 14px;
        }

        .dialog-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-label {
          display: block;
          color: #64b5f6;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .resolution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .resolution-option {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .resolution-option:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .resolution-option.selected {
          background: rgba(100, 181, 246, 0.1);
        }

        .resolution-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .resolution-label {
          color: white;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .resolution-description {
          color: #999;
          font-size: 11px;
        }

        .text-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 12px;
          color: white;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .text-input:focus {
          outline: none;
          border-color: #64b5f6;
          background: rgba(255, 255, 255, 0.08);
        }

        .text-input::placeholder {
          color: #666;
        }

        .select-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 12px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }

        .select-input:focus {
          outline: none;
          border-color: #64b5f6;
          background: rgba(255, 255, 255, 0.08);
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .add-part-btn {
          background: rgba(100, 181, 246, 0.2);
          border: 1px solid #64b5f6;
          border-radius: 6px;
          padding: 6px 12px;
          color: #64b5f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-part-btn:hover {
          background: rgba(100, 181, 246, 0.3);
        }

        .parts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .part-row {
          display: grid;
          grid-template-columns: 150px 1fr 80px 40px;
          gap: 8px;
          align-items: center;
        }

        .part-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 10px;
          color: white;
          font-size: 14px;
        }

        .part-input:focus {
          outline: none;
          border-color: #64b5f6;
          background: rgba(255, 255, 255, 0.08);
        }

        .part-input::placeholder {
          color: #666;
        }

        .part-number {
          font-family: monospace;
        }

        .part-quantity {
          text-align: center;
        }

        .remove-part-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          width: 32px;
          height: 32px;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-part-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-label span {
          color: white;
          font-size: 14px;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 6px;
          padding: 12px;
          color: #ef4444;
          font-size: 14px;
          margin-top: 16px;
        }

        .dialog-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
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

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default ResolutionDialog;
