import React, { useState } from 'react';
import './ChangeDepotModal.css';

/**
 * ChangeDepotModal - Change which depot a display monitors
 *
 * Props:
 * - onClose: Function to close modal
 * - onSave: Function(depot) called with selected depot
 * - currentDepot: Currently selected depot
 * - availableDepots: Array of depot names
 */
export default function ChangeDepotModal({
  onClose,
  onSave,
  currentDepot,
  availableDepots = []
}) {
  const [selectedDepot, setSelectedDepot] = useState(currentDepot);

  const handleSave = () => {
    if (selectedDepot && selectedDepot !== currentDepot) {
      onSave(selectedDepot);
    } else if (selectedDepot === currentDepot) {
      onClose(); // No change needed
    }
  };

  // Depot info for display
  const depotInfo = {
    Washington: {
      description: 'Washington depot operations',
      icon: '🚌',
      routes: '50+ routes'
    },
    Riverside: {
      description: 'Riverside depot operations',
      icon: '🚍',
      routes: '40+ routes'
    },
    Consett: {
      description: 'Consett depot operations',
      icon: '🚐',
      routes: '30+ routes'
    },
    Deptford: {
      description: 'Deptford depot operations',
      icon: '🚎',
      routes: '35+ routes'
    },
    'Percy Main': {
      description: 'Percy Main depot operations',
      icon: '🚌',
      routes: '25+ routes'
    },
    Hexham: {
      description: 'Hexham depot operations',
      icon: '🚍',
      routes: '20+ routes'
    }
  };

  const getDepotInfo = (depot) => {
    return depotInfo[depot] || {
      description: `${depot} depot operations`,
      icon: '🚌',
      routes: 'Multiple routes'
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content change-depot-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Change Display Depot</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="modal-info">
          <p>Select which depot this display should monitor</p>
          <div className="current-depot-info">
            <strong>Current Depot:</strong> {currentDepot}
          </div>
        </div>

        {/* Depot selection */}
        <div className="modal-body">
          {availableDepots.length === 0 ? (
            <div className="empty-state">
              <p>No depots available</p>
            </div>
          ) : (
            <div className="depot-options">
              {availableDepots.map(depot => {
                const info = getDepotInfo(depot);
                return (
                  <label
                    key={depot}
                    className={`depot-option ${
                      selectedDepot === depot ? 'selected' : ''
                    } ${currentDepot === depot ? 'current' : ''}`}
                  >
                    <input
                      type="radio"
                      name="depot"
                      value={depot}
                      checked={selectedDepot === depot}
                      onChange={(e) => setSelectedDepot(e.target.value)}
                    />
                    <div className="depot-content">
                      <div className="depot-header">
                        <span className="depot-icon">{info.icon}</span>
                        <span className="depot-name">{depot}</span>
                        {currentDepot === depot && (
                          <span className="current-badge">Current</span>
                        )}
                      </div>
                      <p className="depot-description">{info.description}</p>
                      <p className="depot-routes">{info.routes}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning if changing depot */}
        {selectedDepot && selectedDepot !== currentDepot && (
          <div className="change-warning">
            <span className="warning-icon">⚠️</span>
            <div className="warning-content">
              <strong>Changing depot will:</strong>
              <ul>
                <li>Update the display to show {selectedDepot} breakdowns only</li>
                <li>Clear any currently highlighted breakdowns</li>
                <li>Refresh the display automatically</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="confirm-btn"
            disabled={!selectedDepot}
          >
            {selectedDepot === currentDepot ? 'Close' : 'Change Depot'}
          </button>
        </div>
      </div>
    </div>
  );
}
