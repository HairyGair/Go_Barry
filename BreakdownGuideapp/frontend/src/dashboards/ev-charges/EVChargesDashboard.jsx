/**
 * EV Charges Dashboard
 * Displays fleet EV charge levels, vehicle types, and charging status.
 * Currently uses mock data — designed to accept real API data feeds.
 */

import React, { useState, useMemo } from 'react';
import { theme } from '@styles/theme';
import './EVChargesDashboard.css';

// Mock EV fleet data — replace with API call when real data feed is available
// 6801-6824: Enviro400EV (Riverside), 8801-8809: Yutong (Riverside), 5801-5809: Yutong (Riverside)
const MOCK_EV_VEHICLES = [
  // Enviro400EV fleet: 6801-6824 (Riverside)
  { fleet_no: '6801', type: 'Enviro400EV', charge: 92, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '6802', type: 'Enviro400EV', charge: 78, status: 'In Service', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '6803', type: 'Enviro400EV', charge: 45, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6804', type: 'Enviro400EV', charge: 23, status: 'Returning to Depot', depot: 'Riverside', lastUpdated: '5 min ago' },
  { fleet_no: '6805', type: 'Enviro400EV', charge: 100, status: 'Charging Complete', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6806', type: 'Enviro400EV', charge: 67, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '6807', type: 'Enviro400EV', charge: 54, status: 'In Service', depot: 'Riverside', lastUpdated: '4 min ago' },
  { fleet_no: '6808', type: 'Enviro400EV', charge: 12, status: 'Charging', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6809', type: 'Enviro400EV', charge: 88, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '6810', type: 'Enviro400EV', charge: 35, status: 'In Service', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '6811', type: 'Enviro400EV', charge: 71, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6812', type: 'Enviro400EV', charge: 8, status: 'Charging', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6813', type: 'Enviro400EV', charge: 61, status: 'In Service', depot: 'Riverside', lastUpdated: '6 min ago' },
  { fleet_no: '6814', type: 'Enviro400EV', charge: 41, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '6815', type: 'Enviro400EV', charge: 97, status: 'Charging Complete', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6816', type: 'Enviro400EV', charge: 29, status: 'Returning to Depot', depot: 'Riverside', lastUpdated: '4 min ago' },
  { fleet_no: '6817', type: 'Enviro400EV', charge: 83, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '6818', type: 'Enviro400EV', charge: 56, status: 'In Service', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '6819', type: 'Enviro400EV', charge: 74, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6820', type: 'Enviro400EV', charge: 19, status: 'Returning to Depot', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '6821', type: 'Enviro400EV', charge: 100, status: 'Charging Complete', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '6822', type: 'Enviro400EV', charge: 48, status: 'In Service', depot: 'Riverside', lastUpdated: '5 min ago' },
  { fleet_no: '6823', type: 'Enviro400EV', charge: 65, status: 'In Service', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '6824', type: 'Enviro400EV', charge: 33, status: 'In Service', depot: 'Riverside', lastUpdated: '4 min ago' },
  // Yutong fleet: 8801-8809 (Riverside)
  { fleet_no: '8801', type: 'Yutong', charge: 86, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '8802', type: 'Yutong', charge: 52, status: 'In Service', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '8803', type: 'Yutong', charge: 15, status: 'Charging', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '8804', type: 'Yutong', charge: 100, status: 'Charging Complete', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '8805', type: 'Yutong', charge: 73, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '8806', type: 'Yutong', charge: 38, status: 'In Service', depot: 'Riverside', lastUpdated: '5 min ago' },
  { fleet_no: '8807', type: 'Yutong', charge: 91, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '8808', type: 'Yutong', charge: 27, status: 'Returning to Depot', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '8809', type: 'Yutong', charge: 64, status: 'In Service', depot: 'Riverside', lastUpdated: '4 min ago' },
  // Yutong fleet: 5801-5809 (Riverside)
  { fleet_no: '5801', type: 'Yutong', charge: 95, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '5802', type: 'Yutong', charge: 44, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '5803', type: 'Yutong', charge: 7, status: 'Charging', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '5804', type: 'Yutong', charge: 100, status: 'Charging Complete', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '5805', type: 'Yutong', charge: 58, status: 'In Service', depot: 'Riverside', lastUpdated: '3 min ago' },
  { fleet_no: '5806', type: 'Yutong', charge: 82, status: 'In Service', depot: 'Riverside', lastUpdated: '2 min ago' },
  { fleet_no: '5807', type: 'Yutong', charge: 31, status: 'In Service', depot: 'Riverside', lastUpdated: '4 min ago' },
  { fleet_no: '5808', type: 'Yutong', charge: 69, status: 'In Service', depot: 'Riverside', lastUpdated: '1 min ago' },
  { fleet_no: '5809', type: 'Yutong', charge: 11, status: 'Returning to Depot', depot: 'Riverside', lastUpdated: '5 min ago' },
];

const getChargeLevel = (charge) => {
  if (charge >= 80) return 'high';
  if (charge >= 40) return 'medium';
  if (charge >= 20) return 'low';
  return 'critical';
};

const getChargeColor = (charge) => {
  if (charge >= 80) return theme.colors.success;
  if (charge >= 40) return theme.colors.primaryLight;
  if (charge >= 20) return theme.colors.warning;
  return theme.colors.danger;
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Charging': return '⚡';
    case 'Charging Complete': return '✓';
    case 'In Service': return '🚌';
    case 'Returning to Depot': return '↩';
    default: return '—';
  }
};

const EVChargesDashboard = () => {
  const [filterDepot, setFilterDepot] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('fleet');
  const [searchTerm, setSearchTerm] = useState('');

  const depots = useMemo(() => {
    const set = new Set(MOCK_EV_VEHICLES.map(v => v.depot));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const types = useMemo(() => {
    const set = new Set(MOCK_EV_VEHICLES.map(v => v.type));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filteredVehicles = useMemo(() => {
    let result = [...MOCK_EV_VEHICLES];

    if (filterDepot !== 'all') {
      result = result.filter(v => v.depot === filterDepot);
    }
    if (filterType !== 'all') {
      result = result.filter(v => v.type === filterType);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v => v.fleet_no.includes(term));
    }

    switch (sortBy) {
      case 'charge-asc':
        result.sort((a, b) => a.charge - b.charge);
        break;
      case 'charge-desc':
        result.sort((a, b) => b.charge - a.charge);
        break;
      case 'fleet':
        result.sort((a, b) => a.fleet_no.localeCompare(b.fleet_no));
        break;
      default:
        break;
    }

    return result;
  }, [filterDepot, filterType, sortBy, searchTerm]);

  // Summary stats
  const stats = useMemo(() => {
    const total = MOCK_EV_VEHICLES.length;
    const critical = MOCK_EV_VEHICLES.filter(v => v.charge < 20).length;
    const charging = MOCK_EV_VEHICLES.filter(v => v.status === 'Charging' || v.status === 'Charging Complete').length;
    const avgCharge = Math.round(MOCK_EV_VEHICLES.reduce((sum, v) => sum + v.charge, 0) / total);
    return { total, critical, charging, avgCharge };
  }, []);

  return (
    <div className="evc-dashboard">
      {/* Header */}
      <div className="evc-header">
        <div className="evc-header-left">
          <h1 className="evc-title">EV Charges</h1>
          <span className="evc-subtitle">Fleet charge monitoring</span>
        </div>
        <div className="evc-header-right">
          <span className="evc-mock-badge">Demo Data</span>
          <span className="evc-updated">Updated just now</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="evc-kpi-row">
        <div className="evc-kpi">
          <span className="evc-kpi-value">{stats.total}</span>
          <span className="evc-kpi-label">EV Vehicles</span>
        </div>
        <div className="evc-kpi">
          <span className="evc-kpi-value" style={{ color: theme.colors.primaryLight }}>{stats.avgCharge}%</span>
          <span className="evc-kpi-label">Avg Charge</span>
        </div>
        <div className="evc-kpi">
          <span className="evc-kpi-value" style={{ color: theme.colors.success }}>{stats.charging}</span>
          <span className="evc-kpi-label">Charging</span>
        </div>
        <div className="evc-kpi evc-kpi--alert">
          <span className="evc-kpi-value" style={{ color: stats.critical > 0 ? theme.colors.danger : theme.colors.success }}>
            {stats.critical}
          </span>
          <span className="evc-kpi-label">Low Charge</span>
        </div>
      </div>

      {/* Filters */}
      <div className="evc-filters">
        <input
          type="text"
          className="evc-search"
          placeholder="Search fleet no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="evc-select" value={filterDepot} onChange={(e) => setFilterDepot(e.target.value)}>
          {depots.map(d => (
            <option key={d} value={d}>{d === 'all' ? 'All Depots' : d}</option>
          ))}
        </select>
        <select className="evc-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {types.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
          ))}
        </select>
        <select className="evc-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="charge-asc">Lowest Charge First</option>
          <option value="charge-desc">Highest Charge First</option>
          <option value="fleet">Fleet Number</option>
        </select>
      </div>

      {/* Vehicle Grid */}
      <div className="evc-grid">
        {filteredVehicles.map(vehicle => {
          const level = getChargeLevel(vehicle.charge);
          const color = getChargeColor(vehicle.charge);

          return (
            <div key={vehicle.fleet_no} className={`evc-card evc-card--${level}`}>
              {/* Card Header */}
              <div className="evc-card-header">
                <span className="evc-fleet-no">{vehicle.fleet_no}</span>
                <span className="evc-status-badge" data-status={vehicle.status.toLowerCase().replace(/\s+/g, '-')}>
                  {getStatusIcon(vehicle.status)} {vehicle.status}
                </span>
              </div>

              {/* Charge Display */}
              <div className="evc-charge-display">
                <div className="evc-charge-ring" style={{ '--charge-color': color, '--charge-pct': `${vehicle.charge}%` }}>
                  <svg viewBox="0 0 100 100" className="evc-ring-svg">
                    <circle cx="50" cy="50" r="42" className="evc-ring-bg" />
                    <circle
                      cx="50" cy="50" r="42"
                      className="evc-ring-fill"
                      style={{
                        strokeDasharray: `${vehicle.charge * 2.639} 263.9`,
                        stroke: color,
                      }}
                    />
                  </svg>
                  <span className="evc-charge-pct" style={{ color }}>{vehicle.charge}%</span>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="evc-card-info">
                <div className="evc-info-row">
                  <span className="evc-info-label">Type</span>
                  <span className="evc-info-value">{vehicle.type}</span>
                </div>
                <div className="evc-info-row">
                  <span className="evc-info-label">Depot</span>
                  <span className="evc-info-value">{vehicle.depot}</span>
                </div>
                <div className="evc-info-row">
                  <span className="evc-info-label">Updated</span>
                  <span className="evc-info-value evc-info-value--muted">{vehicle.lastUpdated}</span>
                </div>
              </div>

              {/* Low charge warning */}
              {vehicle.charge < 20 && (
                <div className="evc-warning">Low charge — requires attention</div>
              )}
            </div>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="evc-empty">No vehicles match the current filters.</div>
      )}
    </div>
  );
};

export default EVChargesDashboard;
