import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../services/api-client';

const ReturnToServiceModal = ({ breakdown, isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('stops'); // 'stops' | 'coords'
  const [stops, setStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && breakdown) {
      loadStops();
    }
  }, [isOpen, breakdown?.breakdown_id]);

  const loadStops = async () => {
    if (!breakdown?.breakdown_id) return;
    setLoadingStops(true);
    try {
      const response = await apiClient.get(
        `/api/breakdowns/${breakdown.breakdown_id}/replacement/route-stops`
      );
      if (response.success) {
        setStops(response.stops || []);
      }
    } catch (err) {
      console.error('Error loading route stops:', err);
    } finally {
      setLoadingStops(false);
    }
  };

  if (!isOpen || !breakdown) return null;

  const filteredStops = searchTerm
    ? stops.filter(s => s.stop_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : stops;

  const handleAtBreakdownPoint = () => {
    const lat = breakdown.location_lat;
    const lng = breakdown.location_lng;
    if (lat && lng) {
      handleSubmit({
        latitude: lat,
        longitude: lng,
        location_description: 'At breakdown point'
      });
    }
  };

  const handleStopSelect = (stop) => {
    setSelectedStop(stop);
  };

  const handleSubmitStop = () => {
    if (!selectedStop) return;
    handleSubmit({ stop_id: selectedStop.stop_id });
  };

  const handleSubmitCoords = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) {
      setError('Valid latitude and longitude required');
      return;
    }
    handleSubmit({ latitude: lat, longitude: lng, location_description: customDesc });
  };

  const handleSubmit = async (payload) => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await apiClient.put(
        `/api/breakdowns/${breakdown.breakdown_id}/replacement/return-to-service`,
        payload
      );

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to record return to service');
      }
    } catch (err) {
      setError(err.message || 'Failed to record return to service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result && onSuccess) {
      onSuccess(result);
    }
    setSelectedStop(null);
    setSearchTerm('');
    setResult(null);
    setError('');
    setMode('stops');
    onClose();
  };

  return (
    <div className="rts-overlay" onClick={handleClose}>
      <div className="rts-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rts-header">
          <h2>Return to Service Point</h2>
          <button className="rts-close" onClick={handleClose} type="button">&times;</button>
        </div>

        <div className="rts-body">
          {/* Replacement info */}
          <div className="rts-summary">
            <div className="rts-summary-row">
              <span className="rts-label">Replacement:</span>
              <span className="rts-value">{breakdown.replacement_vehicle?.replacement_fleet_no || '?'}</span>
            </div>
            <div className="rts-summary-row">
              <span className="rts-label">Dead miles:</span>
              <span className="rts-value">{breakdown.replacement_vehicle?.dead_miles ?? 'N/A'} mi</span>
            </div>
          </div>

          {result ? (
            /* Success state */
            <div className="rts-success">
              <div className="rts-success-icon">&#10003;</div>
              <p className="rts-success-msg">
                Replacement now in service
                {result.return_to_service_location && (
                  <> at <strong>{result.return_to_service_location}</strong></>
                )}
              </p>
              <div className="rts-miles-grid">
                <div className="rts-mile-card">
                  <span className="rts-mile-label">Dead miles</span>
                  <span className="rts-mile-value">{result.dead_miles ?? 'N/A'}</span>
                </div>
                <div className="rts-mile-card">
                  <span className="rts-mile-label">Pickup miles</span>
                  <span className="rts-mile-value">{result.pickup_miles ?? 'N/A'}</span>
                </div>
                <div className="rts-mile-card rts-mile-total">
                  <span className="rts-mile-label">Total dead</span>
                  <span className="rts-mile-value">{result.total_dead_miles ?? 'N/A'}</span>
                </div>
              </div>
              <button className="rts-btn rts-btn-done" onClick={handleClose}>Done</button>
            </div>
          ) : (
            <>
              {/* Quick action: at breakdown point */}
              <button
                className="rts-shortcut"
                onClick={handleAtBreakdownPoint}
                disabled={isSubmitting || !breakdown.location_lat}
              >
                At breakdown point (same location)
              </button>

              {/* Mode tabs */}
              <div className="rts-tabs">
                <button
                  className={`rts-tab ${mode === 'stops' ? 'active' : ''}`}
                  onClick={() => setMode('stops')}
                >
                  Route Stops
                </button>
                <button
                  className={`rts-tab ${mode === 'coords' ? 'active' : ''}`}
                  onClick={() => setMode('coords')}
                >
                  Custom Location
                </button>
              </div>

              {mode === 'stops' ? (
                <div className="rts-stops-panel">
                  <input
                    type="text"
                    className="rts-search"
                    placeholder="Search stops..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {loadingStops ? (
                    <div className="rts-loading">Loading route stops...</div>
                  ) : filteredStops.length === 0 ? (
                    <div className="rts-empty">
                      {stops.length === 0 ? 'No route linked to this breakdown' : 'No stops match search'}
                    </div>
                  ) : (
                    <div className="rts-stop-list">
                      {filteredStops.map(stop => (
                        <button
                          key={stop.stop_id}
                          className={`rts-stop-item ${selectedStop?.stop_id === stop.stop_id ? 'selected' : ''}`}
                          onClick={() => handleStopSelect(stop)}
                        >
                          <span className="rts-stop-name">{stop.stop_name}</span>
                          <span className="rts-stop-id">{stop.stop_id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="rts-actions">
                    <button
                      className="rts-btn rts-btn-cancel"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="rts-btn rts-btn-confirm"
                      onClick={handleSubmitStop}
                      disabled={isSubmitting || !selectedStop}
                    >
                      {isSubmitting ? 'Saving...' : 'Confirm Stop'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rts-coords-panel">
                  <div className="rts-field">
                    <label>Latitude</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 54.9695"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                    />
                  </div>
                  <div className="rts-field">
                    <label>Longitude</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. -1.6095"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                    />
                  </div>
                  <div className="rts-field">
                    <label>Description (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Eldon Square interchange"
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                    />
                  </div>
                  <div className="rts-actions">
                    <button
                      className="rts-btn rts-btn-cancel"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="rts-btn rts-btn-confirm"
                      onClick={handleSubmitCoords}
                      disabled={isSubmitting || !customLat || !customLng}
                    >
                      {isSubmitting ? 'Saving...' : 'Confirm Location'}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="rts-error">{error}</div>}
            </>
          )}
        </div>
      </div>

      <style>{`
        .rts-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: rtsFadeIn 0.2s ease;
        }
        @keyframes rtsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .rts-dialog {
          background: #1a1a2e;
          border-radius: 16px;
          max-width: 520px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 151, 167, 0.3);
          animation: rtsSlideUp 0.3s ease;
        }
        @keyframes rtsSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .rts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rts-header h2 {
          margin: 0;
          font-size: 18px;
          color: #e0e0e0;
          font-weight: 600;
        }
        .rts-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        }
        .rts-close:hover { color: #fff; }
        .rts-body {
          padding: 24px;
        }
        .rts-summary {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }
        .rts-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }
        .rts-label { color: #999; }
        .rts-value { color: #e0e0e0; font-weight: 500; }
        .rts-shortcut {
          width: 100%;
          padding: 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10B981;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        .rts-shortcut:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.2);
        }
        .rts-shortcut:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .rts-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 4px;
        }
        .rts-tab {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: #999;
          transition: all 0.2s;
        }
        .rts-tab.active {
          background: rgba(0, 151, 167, 0.2);
          color: #00BCD4;
        }
        .rts-tab:hover:not(.active) {
          color: #ccc;
        }
        .rts-search {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #e0e0e0;
          font-size: 14px;
          outline: none;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .rts-search:focus {
          border-color: #0097A7;
          box-shadow: 0 0 0 2px rgba(0, 151, 167, 0.2);
        }
        .rts-loading, .rts-empty {
          text-align: center;
          padding: 24px;
          color: #999;
          font-size: 14px;
        }
        .rts-stop-list {
          max-height: 250px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        .rts-stop-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #e0e0e0;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 4px;
          transition: all 0.15s;
          text-align: left;
        }
        .rts-stop-item:hover {
          background: rgba(0, 151, 167, 0.1);
          border-color: rgba(0, 151, 167, 0.3);
        }
        .rts-stop-item.selected {
          background: rgba(0, 151, 167, 0.2);
          border-color: #0097A7;
          color: #00BCD4;
        }
        .rts-stop-name { font-weight: 500; }
        .rts-stop-id { color: #666; font-size: 11px; }
        .rts-field {
          margin-bottom: 12px;
        }
        .rts-field label {
          display: block;
          font-size: 13px;
          color: #aaa;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .rts-field input {
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
        .rts-field input:focus {
          border-color: #0097A7;
          box-shadow: 0 0 0 2px rgba(0, 151, 167, 0.2);
        }
        .rts-error {
          background: rgba(211, 47, 47, 0.15);
          border: 1px solid rgba(211, 47, 47, 0.3);
          color: #ef5350;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-top: 12px;
        }
        .rts-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .rts-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rts-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .rts-btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #ccc;
        }
        .rts-btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
        .rts-btn-confirm {
          background: linear-gradient(135deg, #0097A7, #00838F);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 151, 167, 0.3);
        }
        .rts-btn-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 151, 167, 0.4);
        }
        .rts-success {
          text-align: center;
          padding: 16px 0;
        }
        .rts-success-icon {
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
        .rts-success-msg {
          color: #e0e0e0;
          font-size: 15px;
          margin-bottom: 20px;
        }
        .rts-miles-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .rts-mile-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }
        .rts-mile-card.rts-mile-total {
          background: rgba(0, 151, 167, 0.15);
          border: 1px solid rgba(0, 151, 167, 0.3);
        }
        .rts-mile-label {
          display: block;
          font-size: 11px;
          color: #999;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rts-mile-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #e0e0e0;
        }
        .rts-mile-total .rts-mile-value {
          color: #00BCD4;
        }
        .rts-btn-done {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          max-width: 200px;
          margin: 0 auto;
          display: block;
        }
        .rts-btn-done:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ReturnToServiceModal;
