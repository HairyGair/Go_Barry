import React, { useState } from 'react';
import { Phone, ChevronDown, ChevronRight } from 'lucide-react';
import { getDepotContactsTable } from '../../constants/depotContacts';

const DepotContactsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const depotContacts = getDepotContactsTable();

  const handleCall = (number) => {
    // In a production environment with phone integration
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="depot-contacts-panel">
      <button
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Phone className="icon" size={18} strokeWidth={2} />
        <span className="label">Depot Contacts</span>
        {isExpanded ? <ChevronDown className="expand-icon" size={14} /> : <ChevronRight className="expand-icon" size={14} />}
      </button>

      {isExpanded && (
        <div className="contacts-content">
          <div className="contacts-grid">
            {Object.entries(depotContacts).map(([depotId, depot]) => (
              depot.contacts.length > 0 && (
                <div key={depotId} className="depot-group">
                  <h4 className="depot-name">{depot.name}</h4>
                  <div className="contacts-list">
                    {depot.contacts.map((contact, index) => (
                      <div key={index} className="contact-item">
                        <div className="contact-info">
                          <span className="contact-role">{contact.role}</span>
                          <span className="contact-number">{contact.number}</span>
                        </div>
                        <button
                          className="call-button"
                          onClick={() => handleCall(contact.number)}
                          title={`Call ${depot.name} ${contact.role}`}
                        >
                          <Phone size={16} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .depot-contacts-panel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .toggle-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 15px;
        }

        .toggle-button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .toggle-button .icon {
          color: #22d3ee;
          flex-shrink: 0;
        }

        .toggle-button .label {
          flex: 1;
          text-align: left;
          font-weight: 600;
          font-family: var(--font-body, 'Inter'), sans-serif;
        }

        .toggle-button .expand-icon {
          color: #22d3ee;
          flex-shrink: 0;
        }

        .contacts-content {
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .depot-group {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 16px;
        }

        .depot-name {
          margin: 0 0 12px 0;
          color: #22d3ee;
          font-size: 16px;
          font-weight: 700;
          font-family: var(--font-display, 'Outfit'), sans-serif;
          border-bottom: 2px solid rgba(0, 151, 167, 0.3);
          padding-bottom: 8px;
        }

        .contacts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .contact-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(2px);
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .contact-role {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-number {
          color: #f1f5f9;
          font-size: 16px;
          font-weight: 700;
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
          font-variant-numeric: tabular-nums;
        }

        .call-button {
          background: rgba(0, 151, 167, 0.15);
          border: 1px solid rgba(0, 188, 212, 0.4);
          color: #22d3ee;
          border-radius: 6px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .call-button:hover {
          background: rgba(0, 151, 167, 0.3);
          transform: scale(1.05);
        }

        .call-button:active {
          transform: scale(0.95);
        }

        @media (max-width: 768px) {
          .contacts-grid {
            grid-template-columns: 1fr;
          }

          .toggle-button {
            padding: 12px 14px;
            font-size: 14px;
          }

          .depot-group {
            padding: 12px;
          }

          .contact-number {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default DepotContactsPanel;
