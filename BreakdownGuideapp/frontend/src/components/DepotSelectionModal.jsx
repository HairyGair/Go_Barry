/**
 * Depot Selection Modal
 * Allows supervisors to choose which depot's engineering display to open
 */

import React from 'react';
import './DepotSelectionModal.css';

const DEPOTS = [
  { code: 'Washington', name: 'Washington Depot', color: '#3b82f6' },
  { code: 'Riverside', name: 'Riverside Depot', color: '#22c55e' },
  { code: 'Consett', name: 'Consett Depot', color: '#f59e0b' },
  { code: 'Deptford', name: 'Deptford Depot', color: '#8b5cf6' },
  { code: 'Percy Main', name: 'Percy Main Depot', color: '#ec4899' },
  { code: 'Hexham', name: 'Hexham Depot', color: '#06b6d4' }
];

const DepotSelectionModal = ({ isOpen, onClose, onSelectDepot }) => {
  if (!isOpen) return null;

  const handleDepotClick = (depot) => {
    onSelectDepot(depot);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="depot-modal-overlay" onClick={handleBackdropClick}>
      <div className="depot-modal-content">
        <div className="depot-modal-header">
          <h2>Select Engineering Display</h2>
          <p>Choose which depot's yard display to open</p>
          <button
            className="depot-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="depot-grid">
          {DEPOTS.map((depot) => (
            <button
              key={depot.code}
              className="depot-card"
              onClick={() => handleDepotClick(depot)}
              style={{ '--depot-color': depot.color }}
            >
              <div className="depot-icon">📺</div>
              <div className="depot-info">
                <div className="depot-code">{depot.code}</div>
                <div className="depot-name">{depot.name}</div>
              </div>
              <div className="depot-arrow">→</div>
            </button>
          ))}
        </div>

        <div className="depot-modal-footer">
          <p>The display will open in a new window/tab</p>
        </div>
      </div>
    </div>
  );
};

export default DepotSelectionModal;
