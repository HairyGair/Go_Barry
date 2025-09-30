import React, { useState } from 'react';

const ManualFleetEntry = ({ breakdownId, onFleetUpdate }) => {
  const [fleetNumber, setFleetNumber] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = () => {
    if (fleetNumber) {
      // Store the fleet number
      const breakdownKey = `breakdown_${breakdownId}`;
      const breakdown = JSON.parse(localStorage.getItem(breakdownKey) || '{}');
      breakdown.fleet_no = fleetNumber;
      breakdown.fleet_number = fleetNumber;
      localStorage.setItem(breakdownKey, JSON.stringify(breakdown));
      
      // Notify parent
      onFleetUpdate(breakdownId, fleetNumber);
      setShowInput(false);
      
      console.log(`✅ Fleet ${fleetNumber} saved for breakdown ${breakdownId}`);
    }
  };

  return (
    <div className="manual-fleet-entry">
      {showInput ? (
        <div className="fleet-input-container">
          <input
            type="text"
            value={fleetNumber}
            onChange={(e) => setFleetNumber(e.target.value)}
            placeholder="Enter fleet number"
            className="fleet-input"
            autoFocus
          />
          <button onClick={handleSubmit} className="btn-save">Save</button>
          <button onClick={() => setShowInput(false)} className="btn-cancel">Cancel</button>
        </div>
      ) : (
        <button 
          onClick={() => setShowInput(true)} 
          className="btn-add-fleet"
          title="Add fleet number manually"
        >
          + Add Fleet
        </button>
      )}
      
      <style jsx>{`
        .manual-fleet-entry {
          display: inline-block;
        }
        
        .fleet-input-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .fleet-input {
          width: 100px;
          padding: 4px 8px;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .btn-save {
          padding: 4px 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .btn-cancel {
          padding: 4px 12px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .btn-add-fleet {
          padding: 4px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .btn-add-fleet:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default ManualFleetEntry;
