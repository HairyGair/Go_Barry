import React, { useState } from 'react';
import { apiClient } from '../../../services/api-client';

const DEPOTS = [
  { code: 'WAS', name: 'Washington' },
  { code: 'NCL', name: 'Riverside' },
  { code: 'CON', name: 'Consett' },
  { code: 'HEX', name: 'Hexham' },
  { code: 'GTS', name: 'Deptford' },
  { code: 'PM', name: 'Percy Main' }
];

const DispatchReplacementModal = ({ breakdown, isOpen, onClose, onSuccess }) => {
  const [fleetNo, setFleetNo] = useState('');
  const [depotCode, setDepotCode] = useState(() => {
    // Default to the breakdown's depot
    const bd = breakdown?.depot || '';
    const match = DEPOTS.find(d => d.name.toLowerCase() === bd.toLowerCase());
    return match?.code || DEPOTS[0].code;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !breakdown) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(fleetNo)) {
      setError('Fleet number must be exactly 4 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(
        `/api/breakdowns/${breakdown.breakdown_id}/replacement`,
        { fleet_no: fleetNo, sending_depot_code: depotCode }
      );

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to dispatch replacement');
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch replacement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result && onSuccess) {
      onSuccess(result);
    }
    setFleetNo('');
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="rvm-overlay" role="presentation" onClick={handleClose}>
      <div className="rvm-dialog" role="dialog" aria-modal="true" aria-labelledby="rvm-title" onClick={(e) => e.stopPropagation()}>
        <div className="rvm-header">
          <h2 id="rvm-title">Dispatch Replacement Vehicle</h2>
          <button className="rvm-close" onClick={handleClose} type="button" aria-label="Close dispatch replacement dialog">&times;</button>
        </div>

        <div className="rvm-body">
          {/* Breakdown summary */}
          <div className="rvm-summary">
            <div className="rvm-summary-row">
              <span className="rvm-label">Breakdown:</span>
              <span className="rvm-value">{breakdown.breakdown_id}</span>
            </div>
            <div className="rvm-summary-row">
              <span className="rvm-label">Fleet:</span>
              <span className="rvm-value">{breakdown.fleet_no || breakdown.fleet_number || 'TBC'}</span>
            </div>
            <div className="rvm-summary-row">
              <span className="rvm-label">Location:</span>
              <span className="rvm-value">{breakdown.location || breakdown.location_description || 'Unknown'}</span>
            </div>
          </div>

          {result ? (
            /* Success state */
            <div className="rvm-success">
              <div className="rvm-success-icon">&#10003;</div>
              <p className="rvm-success-msg">Replacement <strong>{result.replacement_fleet_no}</strong> dispatched from <strong>{result.sending_depot}</strong></p>
              {result.dead_miles != null && (
                <div className="rvm-miles-badge">
                  Dead miles: <strong>{result.dead_miles} mi</strong>
                  {result.dead_miles_duration_minutes != null && (
                    <span> (~{result.dead_miles_duration_minutes} min)</span>
                  )}
                </div>
              )}
              <button className="rvm-btn rvm-btn-done" onClick={handleClose}>Done</button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              <div className="rvm-field">
                <label htmlFor="rv-fleet">Replacement Fleet Number</label>
                <input
                  id="rv-fleet"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="e.g. 6377"
                  value={fleetNo}
                  onChange={(e) => setFleetNo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                />
              </div>

              <div className="rvm-field">
                <label htmlFor="rv-depot">Sending Depot</label>
                <select
                  id="rv-depot"
                  value={depotCode}
                  onChange={(e) => setDepotCode(e.target.value)}
                >
                  {DEPOTS.map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>

              {error && <div className="rvm-error" role="alert">{error}</div>}

              <div className="rvm-actions">
                <button type="button" className="rvm-btn rvm-btn-cancel" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="rvm-btn rvm-btn-dispatch" disabled={isSubmitting || fleetNo.length !== 4}>
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Replacement'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .rvm-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: rvmFadeIn 0.2s ease;
        }
        @keyframes rvmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .rvm-dialog {
          background: #1a1a2e;
          border-radius: 16px;
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 151, 167, 0.3);
          animation: rvmSlideUp 0.3s ease;
        }
        @keyframes rvmSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .rvm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rvm-header h2 {
          margin: 0;
          font-size: 18px;
          color: #e0e0e0;
          font-weight: 600;
        }
        .rvm-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        }
        .rvm-close:hover { color: #fff; }
        .rvm-body {
          padding: 24px;
        }
        .rvm-summary {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .rvm-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }
        .rvm-label { color: #999; }
        .rvm-value { color: #e0e0e0; font-weight: 500; }
        .rvm-field {
          margin-bottom: 16px;
        }
        .rvm-field label {
          display: block;
          font-size: 13px;
          color: #aaa;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .rvm-field input, .rvm-field select {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #e0e0e0;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
        }
        .rvm-field input:focus, .rvm-field select:focus {
          border-color: #0097A7;
          box-shadow: 0 0 0 2px rgba(0, 151, 167, 0.2);
        }
        .rvm-field select option {
          background: #1a1a2e;
          color: #e0e0e0;
        }
        .rvm-error {
          background: rgba(211, 47, 47, 0.15);
          border: 1px solid rgba(211, 47, 47, 0.3);
          color: #ef5350;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .rvm-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .rvm-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rvm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .rvm-btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #ccc;
        }
        .rvm-btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
        .rvm-btn-dispatch {
          background: linear-gradient(135deg, #0097A7, #00838F);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 151, 167, 0.3);
        }
        .rvm-btn-dispatch:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 151, 167, 0.4);
        }
        .rvm-success {
          text-align: center;
          padding: 16px 0;
        }
        .rvm-success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .rvm-success-msg {
          color: #e0e0e0;
          font-size: 15px;
          margin-bottom: 16px;
        }
        .rvm-miles-badge {
          display: inline-block;
          background: rgba(0, 151, 167, 0.15);
          border: 1px solid rgba(0, 151, 167, 0.3);
          color: #00BCD4;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .rvm-btn-done {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          max-width: 200px;
          margin: 0 auto;
          display: block;
        }
        .rvm-btn-done:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
};

export default DispatchReplacementModal;
