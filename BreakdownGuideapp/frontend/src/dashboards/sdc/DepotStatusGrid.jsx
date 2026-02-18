/**
 * Depot Status Grid
 * Shows breakdown counts and status for each depot
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React, { useMemo } from 'react';
import './DepotStatusGrid.css';

const DEPOTS = [
  { id: 'Washington', name: 'Washington', icon: '🏭' },
  { id: 'Riverside', name: 'Riverside', icon: '🏭' },
  { id: 'Consett', name: 'Consett', icon: '🏭' },
  { id: 'Deptford', name: 'Deptford', icon: '🏭' },
  { id: 'Percy Main', name: 'Percy Main', icon: '🏭' },
  { id: 'Hexham', name: 'Hexham', icon: '🏭' }
];

const DepotStatusGrid = ({ breakdowns = [], onDepotClick }) => {
  // Calculate breakdown counts per depot
  const depotStats = useMemo(() => {
    const stats = {};

    // Initialize all depots with zero counts
    DEPOTS.forEach(depot => {
      stats[depot.id] = {
        total: 0,
        critical: 0,
        pending: 0,
        breakdowns: []
      };
    });

    // Count breakdowns per depot
    breakdowns.forEach(breakdown => {
      const depotName = breakdown.depot || breakdown.depot_id || breakdown.depot_display || 'Unknown';

      // Try to match depot name (case-insensitive, partial match)
      const matchedDepot = DEPOTS.find(d =>
        depotName.toLowerCase().includes(d.id.toLowerCase()) ||
        d.id.toLowerCase().includes(depotName.toLowerCase())
      );

      if (matchedDepot) {
        stats[matchedDepot.id].total++;
        stats[matchedDepot.id].breakdowns.push(breakdown);

        if (breakdown.isCritical || breakdown.severity === 'STOP' || breakdown.wizard_decision === 'STOP') {
          stats[matchedDepot.id].critical++;
        }
        if (breakdown.isPending || !breakdown.acknowledged_at) {
          stats[matchedDepot.id].pending++;
        }
      }
    });

    return stats;
  }, [breakdowns]);

  // Get status class based on breakdown counts
  const getStatusClass = (depot) => {
    const stat = depotStats[depot.id];
    if (stat.critical > 0) return 'critical';
    if (stat.total > 2) return 'warning';
    if (stat.total > 0) return 'active';
    return 'clear';
  };

  // Get status icon
  const getStatusIcon = (depot) => {
    const stat = depotStats[depot.id];
    if (stat.critical > 0) return '🔴';
    if (stat.total > 2) return '🟡';
    if (stat.total > 0) return '🟠';
    return '✅';
  };

  // Total breakdowns across all depots
  const totalBreakdowns = breakdowns.length;
  const totalCritical = Object.values(depotStats).reduce((sum, s) => sum + s.critical, 0);

  return (
    <div className="depot-status-grid">
      <div className="depot-grid-header">
        <h3>
          <span className="header-icon">🏭</span>
          Depot Status
        </h3>
        <div className="header-stats">
          <span className="total-count">{totalBreakdowns} active</span>
          {totalCritical > 0 && (
            <span className="critical-count">{totalCritical} critical</span>
          )}
        </div>
      </div>

      <div className="depot-grid-body">
        {DEPOTS.map(depot => {
          const stat = depotStats[depot.id];
          const statusClass = getStatusClass(depot);

          return (
            <div
              key={depot.id}
              className={`depot-card ${statusClass}`}
              onClick={() => onDepotClick && onDepotClick(depot.id)}
              role="button"
              tabIndex={0}
            >
              <div className="depot-card-header">
                <span className="depot-status-icon">{getStatusIcon(depot)}</span>
                <span className="depot-name">{depot.name}</span>
              </div>

              <div className="depot-card-stats">
                <div className="stat-main">
                  <span className="stat-value">{stat.total}</span>
                  <span className="stat-label">breakdown{stat.total !== 1 ? 's' : ''}</span>
                </div>

                {stat.critical > 0 && (
                  <div className="stat-critical">
                    <span className="critical-dot"></span>
                    <span>{stat.critical} STOP</span>
                  </div>
                )}

                {stat.pending > 0 && stat.critical === 0 && (
                  <div className="stat-pending">
                    <span>{stat.pending} pending</span>
                  </div>
                )}
              </div>

              {stat.total > 0 && (
                <div className="depot-card-preview">
                  {stat.breakdowns.slice(0, 2).map(b => (
                    <div key={b.breakdown_id} className="preview-item">
                      <span className="preview-fleet">Fleet {b.fleet_no}</span>
                      <span className={`preview-severity severity-${(b.wizard_decision || b.severity || 'pending').toLowerCase()}`}>
                        {b.wizard_decision || b.severity || 'PENDING'}
                      </span>
                    </div>
                  ))}
                  {stat.total > 2 && (
                    <div className="preview-more">+{stat.total - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="depot-grid-footer">
        <div className="legend">
          <span className="legend-item"><span className="dot clear"></span> Clear</span>
          <span className="legend-item"><span className="dot active"></span> Active</span>
          <span className="legend-item"><span className="dot warning"></span> Busy</span>
          <span className="legend-item"><span className="dot critical"></span> Critical</span>
        </div>
      </div>
    </div>
  );
};

export default DepotStatusGrid;
