import React, { useState, useEffect } from 'react';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

const EngineerModal = ({ breakdownId, depotId, onAssign, onClose }) => {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format depot name
  const formatDepotName = (depot) => {
    const names = {
      'WASHINGTON': 'Washington',
      'RIVERSIDE': 'Riverside',
      'PERCY_MAIN': 'Percy Main',
      'CONSETT': 'Consett',
      'DEPTFORD': 'Deptford',
      'HEXHAM': 'Hexham'
    };
    return names[depot] || depot || 'Unknown';
  };

  // Fetch available engineers
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/engineering/engineers/available/${depotId}`);
        const data = await response.json();
        
        if (data.success) {
          setEngineers(data.engineers || []);
        } else {
          setError('Failed to load engineers');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching engineers:', err);
        setError('Failed to load engineers');
        setLoading(false);
      }
    };

    if (depotId) {
      fetchEngineers();
    }
  }, [depotId]);

  // Handle clicking outside modal
  const handleBackdropClick = (e) => {
    if (e.target.className.includes('modal')) {
      onClose();
    }
  };

  return (
    <div className="modal show" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Select Engineer</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading available engineers...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>⚠️ {error}</p>
              <button className="retry-btn" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : engineers.length > 0 ? (
            <div className="engineer-select-list">
              {engineers.map(eng => (
                <div 
                  key={eng.engineer_id}
                  className={`engineer-option ${eng.status !== 'available' ? 'unavailable' : ''}`}
                  onClick={() => eng.status === 'available' && onAssign(eng.engineer_id)}
                >
                  <div className="engineer-option-header">
                    <span className="engineer-option-name">
                      {eng.name} ({eng.badge_number})
                    </span>
                    <span className={`engineer-option-status ${eng.status}`}>
                      {eng.status}
                    </span>
                  </div>
                  <div className="engineer-option-details">
                    <div className="engineer-skills">
                      {eng.specializations?.join(', ') || 'General'}
                    </div>
                    <div className="engineer-shift">
                      Shift: {eng.shift_start} - {eng.shift_end}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-engineers">
              <p>No available engineers at {formatDepotName(depotId)}</p>
              <p className="suggestion">Try auto-assign to find engineers from other depots</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }
        
        .modal.show {
          display: flex;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background: white;
          padding: 0;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(20px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 12px 12px 0 0;
        }
        
        .modal-title {
          font-size: 20px;
          font-weight: bold;
          color: #1e3a8a;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
        
        .spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid #1e3a8a;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-state {
          text-align: center;
          padding: 40px;
          color: #ef4444;
        }
        
        .retry-btn {
          margin-top: 15px;
          padding: 8px 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .retry-btn:hover {
          background: #dc2626;
        }
        
        .engineer-select-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .engineer-option {
          padding: 15px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .engineer-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .engineer-option.unavailable {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .engineer-option.unavailable:hover {
          border-color: #e5e7eb;
          background: white;
          transform: none;
          box-shadow: none;
        }
        
        .engineer-option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .engineer-option-name {
          font-weight: bold;
          color: #1e3a8a;
          font-size: 16px;
        }
        
        .engineer-option-status {
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .engineer-option-status.available {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .engineer-option-status.busy {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .engineer-option-details {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          font-size: 13px;
          color: #6b7280;
        }
        
        .engineer-skills {
          font-style: italic;
        }
        
        .engineer-shift {
          text-align: right;
        }
        
        .no-engineers {
          text-align: center;
          padding: 40px 20px;
        }
        
        .no-engineers p {
          color: #6b7280;
          margin: 10px 0;
        }
        
        .suggestion {
          font-size: 14px;
          color: #9ca3af;
          font-style: italic;
        }
        
        @media (max-width: 640px) {
          .modal-content {
            width: 95%;
            max-height: 90vh;
          }
          
          .engineer-option-details {
            grid-template-columns: 1fr;
          }
          
          .engineer-shift {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default EngineerModal;
