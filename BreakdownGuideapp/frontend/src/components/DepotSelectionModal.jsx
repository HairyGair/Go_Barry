/**
 * Depot Selection Modal
 * Allows supervisors to choose which depot's engineering display to open
 */

import React from 'react';
import { MonitorPlay, X, ArrowRight } from 'lucide-react';
import './DepotSelectionModal.css';

// Accent colours stay within the brand teal/cyan family (no off-brand
// rainbow) — only depth varies so each depot card is still identifiable.
const DEPOTS = [
  { code: 'Washington', name: 'Washington Depot', color: '#00BCD4' },
  { code: 'Riverside', name: 'Riverside Depot', color: '#00ACC1' },
  { code: 'Consett', name: 'Consett Depot', color: '#0097A7' },
  { code: 'Deptford', name: 'Deptford Depot', color: '#00838F' },
  { code: 'Percy Main', name: 'Percy Main Depot', color: '#26C6DA' },
  { code: 'Hexham', name: 'Hexham Depot', color: '#006064' }
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
            <X size={17} strokeWidth={2.25} aria-hidden="true" />
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
              <div className="depot-icon"><MonitorPlay size={26} strokeWidth={1.75} aria-hidden="true" /></div>
              <div className="depot-info">
                <div className="depot-code">{depot.code}</div>
                <div className="depot-name">{depot.name}</div>
              </div>
              <div className="depot-arrow"><ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></div>
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
