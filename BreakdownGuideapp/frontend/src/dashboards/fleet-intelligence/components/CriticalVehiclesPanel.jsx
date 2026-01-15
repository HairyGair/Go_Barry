/**
 * CriticalVehiclesPanel Component
 *
 * Displays vehicles with repeated defects that need attention.
 * Features: Expandable cards, severity badges, action buttons.
 */

import React, { useState } from 'react';

const CriticalVehicleCard = ({
  vehicle,
  isExpanded,
  onToggle,
  onEscalate,
  onViewHistory,
}) => {
  const defectCount = vehicle.defect_count || vehicle.breakdown_count || 1;
  const severityClass = defectCount >= 5 ? 'critical' : defectCount >= 3 ? 'warning' : 'info';

  return (
    <div className={`vehicle-card ${severityClass} ${isExpanded ? 'expanded' : ''}`}>
      <div className="vehicle-card-header" onClick={onToggle}>
        <div className="vehicle-info">
          <span className="fleet-number">{vehicle.fleet_number || vehicle.fleet_no || 'Unknown'}</span>
          {vehicle.isRealtime && <span className="live-badge">LIVE</span>}
        </div>
        <span className={`defect-badge ${severityClass}`}>
          {defectCount} defect{defectCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="vehicle-card-body">
        <div className="info-row">
          <span className="label">Depot</span>
          <span className="value">{vehicle.depot || vehicle.depot_id || 'Unknown'}</span>
        </div>
        <div className="info-row">
          <span className="label">Top Issue</span>
          <span className="value">{vehicle.top_issue || vehicle.issue_type || vehicle.most_common_issue || 'Various'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="vehicle-card-expanded">
          <div className="info-row">
            <span className="label">Registration</span>
            <span className="value">{vehicle.registration || vehicle.reg_number || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Last Defect</span>
            <span className="value">
              {vehicle.last_defect_date
                ? new Date(vehicle.last_defect_date).toLocaleDateString('en-GB')
                : 'Unknown'}
            </span>
          </div>
          {vehicle.pattern_score !== undefined && (
            <div className="info-row">
              <span className="label">Pattern Score</span>
              <span className="value">{vehicle.pattern_score}%</span>
            </div>
          )}
          <div className="action-buttons">
            <button
              className="action-btn escalate"
              onClick={(e) => {
                e.stopPropagation();
                onEscalate(vehicle);
              }}
            >
              ⚠️ Escalate
            </button>
            <button
              className="action-btn secondary"
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(vehicle);
              }}
            >
              📋 History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CriticalVehiclesPanel = ({
  vehicles = [],
  onEscalate,
  onViewHistory,
  loading,
}) => {
  const [expandedId, setExpandedId] = useState(null);

  // Sort vehicles by defect count (highest first)
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const countA = a.defect_count || a.breakdown_count || 0;
    const countB = b.defect_count || b.breakdown_count || 0;
    return countB - countA;
  });

  // Default handlers if not provided
  const handleEscalate = onEscalate || ((vehicle) => {
    console.log('Escalating vehicle:', vehicle);
    alert(`Escalation notification would be sent for Fleet ${vehicle.fleet_number || vehicle.fleet_no}`);
  });

  const handleViewHistory = onViewHistory || ((vehicle) => {
    console.log('Viewing history for:', vehicle);
  });

  if (loading) {
    return (
      <div className="fid-card critical-vehicles-panel">
        <div className="panel-header">
          <h3>🚨 Critical Vehicles</h3>
        </div>
        <div className="vehicles-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="vehicle-card loading">
              <div className="loading-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card critical-vehicles-panel">
      <div className="panel-header">
        <h3>🚨 Critical Vehicles</h3>
        <span className="count-badge">{vehicles.length}</span>
      </div>

      <div className="vehicles-list">
        {sortedVehicles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <p>No critical vehicles</p>
            <span className="empty-subtext">All fleet vehicles operating normally</span>
          </div>
        ) : (
          sortedVehicles.slice(0, 10).map((vehicle) => {
            const vehicleKey = vehicle.id || vehicle.fleet_number || vehicle.fleet_no;
            return (
              <CriticalVehicleCard
                key={vehicleKey}
                vehicle={vehicle}
                isExpanded={expandedId === vehicleKey}
                onToggle={() => setExpandedId(expandedId === vehicleKey ? null : vehicleKey)}
                onEscalate={handleEscalate}
                onViewHistory={handleViewHistory}
              />
            );
          })
        )}
      </div>

      {sortedVehicles.length > 0 && (
        <div className="panel-footer">
          <button className="bulk-action-btn">
            📧 Notify Engineering ({sortedVehicles.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CriticalVehiclesPanel;
