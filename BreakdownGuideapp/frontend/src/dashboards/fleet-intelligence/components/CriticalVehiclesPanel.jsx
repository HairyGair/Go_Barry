/**
 * CriticalVehiclesPanel Component
 * Ocean Teal Edition - Fleet Intelligence Command Center
 *
 * Displays vehicles with repeated defects requiring attention.
 * Features: Card/Table toggle view, sortable columns, severity-coded borders.
 */

import React, { useState, useMemo } from 'react';

// SVG Icons
const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ClipboardListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ViewListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ViewGridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Individual Vehicle Card Component
 */
const CriticalVehicleCard = ({
  vehicle,
  isExpanded,
  onToggle,
  onEscalate,
  onViewHistory,
}) => {
  const defectCount = vehicle.defect_count || vehicle.breakdown_count || 1;
  const severityClass =
    defectCount >= 5 ? 'critical' : defectCount >= 3 ? 'warning' : 'info';

  return (
    <div className={`fi__vehicle fi__vehicle--${severityClass}`}>
      <div className="fi__vehicle-header" onClick={onToggle}>
        <div className="fi__vehicle-info">
          <span className="fi__fleet-no">
            {vehicle.fleet_number || vehicle.fleet_no || 'Unknown'}
          </span>
          {vehicle.isRealtime && <span className="fi__live-badge">LIVE</span>}
        </div>
        <span className={`fi__defect-badge fi__defect-badge--${severityClass}`}>
          {defectCount} defect{defectCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="fi__vehicle-body">
        <div className="fi__vehicle-row">
          <span className="fi__vehicle-row-label">Depot</span>
          <span className="fi__vehicle-row-value">
            {vehicle.depot || vehicle.depot_id || 'Unknown'}
          </span>
        </div>
        <div className="fi__vehicle-row">
          <span className="fi__vehicle-row-label">Top Issue</span>
          <span className="fi__vehicle-row-value">
            {vehicle.top_issue || vehicle.issue_type || vehicle.most_common_issue || 'Various'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="fi__vehicle-expanded">
          <div className="fi__vehicle-row">
            <span className="fi__vehicle-row-label">Registration</span>
            <span className="fi__vehicle-row-value">
              {vehicle.registration || vehicle.reg_number || 'N/A'}
            </span>
          </div>
          <div className="fi__vehicle-row">
            <span className="fi__vehicle-row-label">Last Defect</span>
            <span className="fi__vehicle-row-value">
              {vehicle.last_defect_date
                ? new Date(vehicle.last_defect_date).toLocaleDateString('en-GB')
                : 'Unknown'}
            </span>
          </div>
          {vehicle.pattern_score !== undefined && (
            <div className="fi__vehicle-row">
              <span className="fi__vehicle-row-label">Pattern Score</span>
              <span className="fi__vehicle-row-value">{vehicle.pattern_score}%</span>
            </div>
          )}

          <div className="fi__vehicle-actions">
            <button
              className="fi__action-btn fi__action-btn--escalate"
              onClick={(e) => {
                e.stopPropagation();
                onEscalate(vehicle);
              }}
            >
              <AlertTriangleIcon />
              Escalate
            </button>
            <button
              className="fi__action-btn fi__action-btn--history"
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(vehicle);
              }}
            >
              <ClipboardListIcon />
              History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Table View Component
 */
const VehicleTable = ({ vehicles, sortField, sortDirection, onSort, onEscalate, onViewHistory }) => {
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />;
  };

  const getSeverityClass = (defectCount) => {
    if (defectCount >= 5) return 'critical';
    if (defectCount >= 3) return 'warning';
    return 'info';
  };

  return (
    <div className="fi__vehicle-table-wrap">
      <table className="fi__vehicle-table">
        <thead>
          <tr>
            <th onClick={() => onSort('fleet_number')}>
              Fleet {getSortIcon('fleet_number')}
            </th>
            <th onClick={() => onSort('depot')}>
              Depot {getSortIcon('depot')}
            </th>
            <th onClick={() => onSort('defect_count')}>
              Defects {getSortIcon('defect_count')}
            </th>
            <th onClick={() => onSort('top_issue')}>
              Top Issue {getSortIcon('top_issue')}
            </th>
            <th onClick={() => onSort('last_defect_date')}>
              Last Defect {getSortIcon('last_defect_date')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const defectCount = vehicle.defect_count || vehicle.breakdown_count || 1;
            const severityClass = getSeverityClass(defectCount);
            const vehicleKey = vehicle.id || vehicle.fleet_number || vehicle.fleet_no;

            return (
              <tr key={vehicleKey}>
                <td className="fi__fleet-cell">
                  {vehicle.fleet_number || vehicle.fleet_no || 'Unknown'}
                  {vehicle.isRealtime && (
                    <span className="fi__live-badge" style={{ marginLeft: '6px' }}>
                      LIVE
                    </span>
                  )}
                </td>
                <td>{vehicle.depot || vehicle.depot_id || 'Unknown'}</td>
                <td>
                  <span className={`fi__sev-cell fi__sev-cell--${severityClass}`}>
                    {defectCount}
                  </span>
                </td>
                <td>
                  {vehicle.top_issue || vehicle.issue_type || vehicle.most_common_issue || 'Various'}
                </td>
                <td>
                  {vehicle.last_defect_date
                    ? new Date(vehicle.last_defect_date).toLocaleDateString('en-GB')
                    : 'Unknown'}
                </td>
                <td>
                  <button
                    className="fi__table-action"
                    onClick={() => onEscalate(vehicle)}
                    style={{ marginRight: '4px' }}
                  >
                    Escalate
                  </button>
                  <button
                    className="fi__table-action"
                    onClick={() => onViewHistory(vehicle)}
                  >
                    History
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Main CriticalVehiclesPanel Component
 */
const CriticalVehiclesPanel = ({
  vehicles = [],
  onEscalate,
  onViewHistory,
  loading,
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [sortField, setSortField] = useState('defect_count');
  const [sortDirection, setSortDirection] = useState('desc');

  // Default handlers if not provided
  const handleEscalate = onEscalate || ((vehicle) => {
    console.log('Escalating vehicle:', vehicle);
    alert(`Escalation notification would be sent for Fleet ${vehicle.fleet_number || vehicle.fleet_no}`);
  });

  const handleViewHistory = onViewHistory || ((vehicle) => {
    console.log('Viewing history for:', vehicle);
  });

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    const sorted = [...vehicles].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'fleet_number':
          aVal = a.fleet_number || a.fleet_no || '';
          bVal = b.fleet_number || b.fleet_no || '';
          break;
        case 'depot':
          aVal = a.depot || a.depot_id || '';
          bVal = b.depot || b.depot_id || '';
          break;
        case 'defect_count':
          aVal = a.defect_count || a.breakdown_count || 0;
          bVal = b.defect_count || b.breakdown_count || 0;
          break;
        case 'top_issue':
          aVal = a.top_issue || a.issue_type || a.most_common_issue || '';
          bVal = b.top_issue || b.issue_type || b.most_common_issue || '';
          break;
        case 'last_defect_date':
          aVal = a.last_defect_date ? new Date(a.last_defect_date).getTime() : 0;
          bVal = b.last_defect_date ? new Date(b.last_defect_date).getTime() : 0;
          break;
        default:
          aVal = a.defect_count || a.breakdown_count || 0;
          bVal = b.defect_count || b.breakdown_count || 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [vehicles, sortField, sortDirection]);

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="fi__card fi__vehicles">
        <div className="fi__card-header">
          <h3 className="fi__card-title">
            <AlertTriangleIcon />
            Critical Vehicles
          </h3>
        </div>
        <div className="fi__vehicles-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="fi__skeleton fi__skeleton--card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fi__card fi__vehicles">
      <div className="fi__card-header">
        <h3 className="fi__card-title">
          <AlertTriangleIcon />
          Critical Vehicles
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="fi__card-badge fi__card-badge--count">{vehicles.length}</span>
          <div className="fi__vehicles-mode">
            <button
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
            >
              <ViewGridIcon />
              Cards
            </button>
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              <ViewListIcon />
              Table
            </button>
          </div>
        </div>
      </div>

      {sortedVehicles.length === 0 ? (
        <div className="fi__empty">
          <CheckCircleIcon />
          <p>No critical vehicles</p>
          <div className="fi__empty-sub">All fleet vehicles operating normally</div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="fi__vehicles-list">
          {sortedVehicles.map((vehicle) => {
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
          })}
        </div>
      ) : (
        <VehicleTable
          vehicles={sortedVehicles}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEscalate={handleEscalate}
          onViewHistory={handleViewHistory}
        />
      )}

      {sortedVehicles.length > 0 && (
        <div className="fi__panel-footer">
          <button className="fi__bulk-btn">
            <BellIcon />
            Notify Engineering ({sortedVehicles.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CriticalVehiclesPanel;
