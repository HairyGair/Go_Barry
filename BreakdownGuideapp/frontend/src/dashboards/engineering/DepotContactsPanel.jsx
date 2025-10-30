import React, { useState } from 'react';
import { DEPOT_CONTACTS } from '../../constants/depotContacts';

const DepotContactsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        <span className="icon">📞</span>
        <span className="label">Depot Contacts</span>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="contacts-content">
          <div className="contacts-grid">
            {Object.entries(DEPOT_CONTACTS).map(([depotId, depot]) => (
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
                          📞
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
          font-size: 20px;
        }

        .toggle-button .label {
          flex: 1;
          text-align: left;
          font-weight: 600;
        }

        .toggle-button .expand-icon {
          font-size: 12px;
          color: #64b5f6;
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
          color: #64b5f6;
          font-size: 16px;
          font-weight: 700;
          border-bottom: 2px solid rgba(100, 181, 246, 0.3);
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
          color: #999;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-number {
          color: white;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .call-button {
          background: rgba(100, 181, 246, 0.2);
          border: 1px solid #64b5f6;
          border-radius: 6px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 18px;
        }

        .call-button:hover {
          background: rgba(100, 181, 246, 0.4);
          transform: scale(1.1);
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
