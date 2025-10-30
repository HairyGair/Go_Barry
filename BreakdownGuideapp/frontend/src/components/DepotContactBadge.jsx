import React, { useState } from 'react';
import { getDepotByFleetNumber, getDepotContacts, getDepotName } from '../constants/depotContacts';

/**
 * DepotContactBadge - Reusable component that shows depot contacts based on fleet number
 * Automatically detects depot from fleet number and displays relevant contacts
 *
 * Usage:
 * <DepotContactBadge fleetNumber="5401" size="small" />
 * <DepotContactBadge fleetNumber="6123" size="large" showDepotName={true} />
 */
const DepotContactBadge = ({
  fleetNumber,
  depot = null,
  size = 'medium',
  showDepotName = false,
  variant = 'inline', // 'inline' | 'dropdown' | 'modal'
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine depot from fleet number or use provided depot
  const detectedDepot = depot || getDepotByFleetNumber(fleetNumber);
  const depotName = detectedDepot ? getDepotName(detectedDepot) : null;
  const contacts = detectedDepot ? getDepotContacts(detectedDepot) : [];

  // If no depot or no contacts, don't render anything
  if (!detectedDepot || contacts.length === 0) {
    return null;
  }

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  const handleCopy = (number) => {
    navigator.clipboard.writeText(number);
    // Could add a toast notification here
  };

  // Size variants
  const sizeClasses = {
    small: 'badge-small',
    medium: 'badge-medium',
    large: 'badge-large'
  };

  // Inline variant - compact badge with hover
  if (variant === 'inline') {
    return (
      <div className={`depot-contact-badge ${sizeClasses[size]} ${className}`}>
        <div
          className="badge-trigger"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="badge-icon">📞</span>
          {showDepotName && <span className="badge-depot">{depotName}</span>}
          <span className="badge-count">{contacts.length}</span>
        </div>

        {isExpanded && (
          <div className="badge-dropdown">
            <div className="dropdown-header">{depotName} Contacts</div>
            <div className="dropdown-contacts">
              {contacts.map((contact, index) => (
                <div key={index} className="dropdown-contact-item">
                  <div className="contact-details">
                    <span className="contact-role">{contact.role}</span>
                    <span className="contact-number">{contact.number}</span>
                  </div>
                  <div className="contact-actions">
                    <button
                      className="action-btn call-btn"
                      onClick={() => handleCall(contact.number)}
                      title="Call"
                    >
                      📞
                    </button>
                    <button
                      className="action-btn copy-btn"
                      onClick={() => handleCopy(contact.number)}
                      title="Copy number"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <style jsx>{`
          .depot-contact-badge {
            position: relative;
            display: inline-flex;
            align-items: center;
          }

          .badge-trigger {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(100, 181, 246, 0.15);
            border: 1px solid rgba(100, 181, 246, 0.3);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            font-weight: 600;
            color: #64b5f6;
          }

          .badge-trigger:hover {
            background: rgba(100, 181, 246, 0.25);
            border-color: #64b5f6;
            transform: translateY(-1px);
          }

          .badge-icon {
            font-size: 14px;
          }

          .badge-depot {
            color: white;
          }

          .badge-count {
            background: rgba(100, 181, 246, 0.3);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
          }

          .badge-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            background: #1a1a2e;
            border: 1px solid rgba(100, 181, 246, 0.3);
            border-radius: 8px;
            padding: 0;
            min-width: 280px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideDown 0.2s ease;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dropdown-header {
            background: rgba(100, 181, 246, 0.2);
            padding: 10px 14px;
            border-bottom: 1px solid rgba(100, 181, 246, 0.3);
            color: #64b5f6;
            font-weight: 700;
            font-size: 13px;
            border-radius: 8px 8px 0 0;
          }

          .dropdown-contacts {
            padding: 8px;
          }

          .dropdown-contact-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 6px;
            margin-bottom: 6px;
            transition: background 0.2s;
          }

          .dropdown-contact-item:last-child {
            margin-bottom: 0;
          }

          .dropdown-contact-item:hover {
            background: rgba(255, 255, 255, 0.08);
          }

          .contact-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .contact-role {
            color: #999;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .contact-number {
            color: white;
            font-size: 15px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
          }

          .contact-actions {
            display: flex;
            gap: 6px;
          }

          .action-btn {
            background: rgba(100, 181, 246, 0.2);
            border: 1px solid rgba(100, 181, 246, 0.3);
            border-radius: 6px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
          }

          .action-btn:hover {
            background: rgba(100, 181, 246, 0.4);
            transform: scale(1.1);
          }

          .action-btn:active {
            transform: scale(0.95);
          }

          /* Size variants */
          .badge-small .badge-trigger {
            padding: 4px 8px;
            font-size: 11px;
            gap: 4px;
          }

          .badge-small .badge-icon {
            font-size: 12px;
          }

          .badge-large .badge-trigger {
            padding: 8px 16px;
            font-size: 14px;
            gap: 8px;
          }

          .badge-large .badge-icon {
            font-size: 16px;
          }

          @media (max-width: 768px) {
            .badge-dropdown {
              left: auto;
              right: 0;
              min-width: 260px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Dropdown variant - button that opens contacts
  if (variant === 'dropdown') {
    return (
      <div className={`depot-contact-dropdown ${className}`}>
        <button
          className="dropdown-trigger"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>📞</span>
          <span>{showDepotName ? `${depotName} Contacts` : 'Depot Contacts'}</span>
          <span className="arrow">{isExpanded ? '▲' : '▼'}</span>
        </button>

        {isExpanded && (
          <div className="dropdown-content">
            {contacts.map((contact, index) => (
              <div key={index} className="dropdown-item">
                <div className="item-info">
                  <span className="item-role">{contact.role}</span>
                  <span className="item-number">{contact.number}</span>
                </div>
                <button
                  className="item-call-btn"
                  onClick={() => handleCall(contact.number)}
                >
                  📞 Call
                </button>
              </div>
            ))}
          </div>
        )}

        <style jsx>{`
          .depot-contact-dropdown {
            width: 100%;
          }

          .dropdown-trigger {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: rgba(100, 181, 246, 0.15);
            border: 1px solid rgba(100, 181, 246, 0.3);
            border-radius: 8px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .dropdown-trigger:hover {
            background: rgba(100, 181, 246, 0.25);
          }

          .arrow {
            font-size: 10px;
            color: #64b5f6;
          }

          .dropdown-content {
            margin-top: 8px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
          }

          .dropdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            margin-bottom: 6px;
          }

          .dropdown-item:last-child {
            margin-bottom: 0;
          }

          .item-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .item-role {
            color: #999;
            font-size: 11px;
            text-transform: uppercase;
          }

          .item-number {
            color: white;
            font-size: 16px;
            font-weight: 700;
            font-family: monospace;
          }

          .item-call-btn {
            background: #64b5f6;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            color: #1a1a2e;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }

          .item-call-btn:hover {
            background: #5da9e8;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default DepotContactBadge;
