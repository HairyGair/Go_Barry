/**
 * Contact Actions Component
 * Quick communication buttons for engineering team
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState } from 'react';

const ContactActions = ({ breakdown }) => {
  const [copied, setCopied] = useState(false);

  // Extract contact information
  const supervisorName = breakdown.supervisor_name || 'Unknown Supervisor';
  const supervisorBadge = breakdown.supervisor_badge || breakdown.badge_number || '';
  const supervisorPhone = breakdown.supervisor_phone || '';
  const supervisorEmail = breakdown.supervisor_email || '';
  const depotName = breakdown.depot || '';

  // Depot phone numbers (these should come from database in production)
  const DEPOT_PHONES = {
    'Washington': '0191 416 3322',
    'Riverside': '0191 420 3000',
    'Consett': '01207 501 201',
    'Deptford': '0191 566 2300',
    'Percy Main': '0191 257 3344',
    'Hexham': '01434 602 217',
    'SDC': '0191 420 3000'
  };

  const depotPhone = DEPOT_PHONES[depotName] || '';

  // Handle copy to clipboard
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format phone number for tel: link (remove spaces)
  const formatPhoneLink = (phone) => {
    return phone.replace(/\s/g, '');
  };

  return (
    <div className="contact-actions">
      <div className="contact-section">
        <h4 className="contact-title">👤 Supervisor Contact</h4>
        <div className="contact-info">
          <div className="contact-name">{supervisorName}</div>
          {supervisorBadge && (
            <div className="contact-badge">Badge: {supervisorBadge}</div>
          )}
        </div>

        {supervisorPhone ? (
          <div className="contact-buttons">
            <a
              href={`tel:${formatPhoneLink(supervisorPhone)}`}
              className="contact-btn call"
              title="Call supervisor"
            >
              📞 Call
            </a>
            <a
              href={`sms:${formatPhoneLink(supervisorPhone)}`}
              className="contact-btn sms"
              title="Send SMS"
            >
              💬 SMS
            </a>
            <button
              onClick={() => handleCopy(supervisorPhone, 'phone')}
              className="contact-btn copy"
              title="Copy phone number"
            >
              {copied === 'phone' ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        ) : (
          <div className="no-contact">No phone number available</div>
        )}

        {supervisorEmail && (
          <a
            href={`mailto:${supervisorEmail}?subject=Breakdown ${breakdown.breakdown_id} - Fleet ${breakdown.fleet_no}`}
            className="contact-btn email"
          >
            📧 Email Supervisor
          </a>
        )}
      </div>

      {depotPhone && (
        <div className="contact-section">
          <h4 className="contact-title">🏢 {depotName} Depot</h4>
          <div className="contact-buttons">
            <a
              href={`tel:${formatPhoneLink(depotPhone)}`}
              className="contact-btn call"
              title="Call depot"
            >
              📞 {depotPhone}
            </a>
            <button
              onClick={() => handleCopy(depotPhone, 'depot')}
              className="contact-btn copy"
              title="Copy depot number"
            >
              {copied === 'depot' ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Breakdown Reference */}
      <div className="contact-section reference">
        <h4 className="contact-title">📋 Breakdown Reference</h4>
        <div className="reference-info">
          <div className="reference-id">{breakdown.breakdown_id}</div>
          <button
            onClick={() => handleCopy(breakdown.breakdown_id, 'id')}
            className="contact-btn copy small"
            title="Copy breakdown ID"
          >
            {copied === 'id' ? '✓' : '📋'}
          </button>
        </div>
      </div>

      <style>{`
        .contact-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contact-section.reference {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .contact-title {
          margin: 0;
          color: #999;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .contact-name {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .contact-badge {
          color: #64b5f6;
          font-size: 12px;
          font-family: monospace;
        }

        .contact-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .contact-btn {
          flex: 1;
          min-width: 80px;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .contact-btn.call {
          background: #10b981;
          color: white;
        }

        .contact-btn.call:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .contact-btn.sms {
          background: #3b82f6;
          color: white;
        }

        .contact-btn.sms:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .contact-btn.email {
          background: #8b5cf6;
          color: white;
        }

        .contact-btn.email:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .contact-btn.copy {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .contact-btn.copy:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .contact-btn.copy.small {
          min-width: 50px;
          flex: 0;
        }

        .no-contact {
          padding: 8px 12px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px dashed rgba(245, 158, 11, 0.3);
          border-radius: 6px;
          color: #f59e0b;
          font-size: 12px;
          text-align: center;
        }

        .reference-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .reference-id {
          flex: 1;
          color: white;
          font-family: monospace;
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .contact-btn {
            flex: 1 1 100%;
            min-width: auto;
          }

          .contact-btn.copy.small {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactActions;
