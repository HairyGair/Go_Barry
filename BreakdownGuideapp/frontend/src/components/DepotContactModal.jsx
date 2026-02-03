/**
 * Depot Contact Modal Component
 * Shows depot-specific contact numbers when Contact button is clicked
 *
 * Automatically detects depot from fleet number and displays
 * relevant engineering/yardman contact numbers
 */

import React from 'react';
import { DEPOT_CONTACTS, getDepotByFleetNumber, getDepotContacts, getDepotName } from '../constants/depotContacts';
import './DepotContactModal.css';

const DepotContactModal = ({
  isOpen,
  onClose,
  breakdown,
  fleetNumber,
  depot
}) => {
  if (!isOpen) return null;

  // Determine depot from fleet number or use provided depot
  const fleetNo = fleetNumber || breakdown?.fleet_no || breakdown?.fleet_number;
  const detectedDepot = getDepotByFleetNumber(fleetNo);
  const depotKey = detectedDepot || depot?.toUpperCase()?.replace(/\s+/g, '_') || null;

  // Get contacts for the depot
  const contacts = depotKey ? getDepotContacts(depotKey) : [];
  const depotName = depotKey ? getDepotName(depotKey) : 'Unknown Depot';

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="depot-contact-modal-backdrop" onClick={handleBackdropClick}>
      <div className="depot-contact-modal">
        <div className="depot-contact-modal__header">
          <div className="depot-contact-modal__title-row">
            <span className="depot-contact-modal__icon">📞</span>
            <h2 className="depot-contact-modal__title">Contact {depotName}</h2>
          </div>
          <button
            className="depot-contact-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="depot-contact-modal__content">
          {/* Breakdown Info */}
          {breakdown && (
            <div className="depot-contact-modal__breakdown-info">
              <div className="breakdown-detail">
                <span className="breakdown-detail__label">Fleet Number</span>
                <span className="breakdown-detail__value">{fleetNo || 'Unknown'}</span>
              </div>
              {breakdown.location && (
                <div className="breakdown-detail">
                  <span className="breakdown-detail__label">Location</span>
                  <span className="breakdown-detail__value">{breakdown.location}</span>
                </div>
              )}
              {(breakdown.issue_type || breakdown.wizard_type) && (
                <div className="breakdown-detail">
                  <span className="breakdown-detail__label">Issue</span>
                  <span className="breakdown-detail__value">
                    {breakdown.issue_type || breakdown.wizard_type?.replace('Wizard', '')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Contact Numbers */}
          {contacts.length > 0 ? (
            <div className="depot-contact-modal__contacts">
              <h3 className="depot-contact-modal__contacts-title">
                Call {depotName} Depot
              </h3>
              <div className="depot-contact-modal__contact-list">
                {contacts.map((contact, index) => (
                  <a
                    key={index}
                    href={contact.fullNumber}
                    className={`depot-contact-modal__contact-item ${index === 0 ? 'primary' : 'secondary'}`}
                  >
                    <div className="contact-item__info">
                      <span className="contact-item__role">{contact.role}</span>
                      <span className="contact-item__number">{contact.number}</span>
                    </div>
                    <div className="contact-item__action">
                      <span className="contact-item__call-icon">📱</span>
                      <span className="contact-item__call-text">
                        {index === 0 ? 'Call First' : 'Alternative'}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
              <p className="depot-contact-modal__instruction">
                Tap a contact to call. Try the primary contact first.
              </p>
            </div>
          ) : (
            <div className="depot-contact-modal__no-contacts">
              <span className="no-contacts__icon">⚠️</span>
              <p className="no-contacts__message">
                No contact numbers available for this depot.
              </p>
              <p className="no-contacts__hint">
                {fleetNo ? `Fleet ${fleetNo} ` : ''}
                {depotName !== 'Unknown Depot' ? `(${depotName})` : ''}
              </p>
            </div>
          )}

          {/* All Depots Quick Reference */}
          <details className="depot-contact-modal__all-depots">
            <summary className="all-depots__summary">
              <span className="all-depots__icon">📋</span>
              View All Depot Contacts
            </summary>
            <div className="all-depots__list">
              {Object.entries(DEPOT_CONTACTS).map(([key, depot]) => (
                depot.contacts.length > 0 && (
                  <div key={key} className="all-depots__depot">
                    <span className="all-depots__depot-name">{depot.name}</span>
                    <div className="all-depots__numbers">
                      {depot.contacts.map((contact, idx) => (
                        <a
                          key={idx}
                          href={contact.fullNumber}
                          className="all-depots__number"
                        >
                          {contact.role}: {contact.number}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </details>
        </div>

        <div className="depot-contact-modal__footer">
          <button
            className="depot-contact-modal__close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepotContactModal;
