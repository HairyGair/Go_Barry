/**
 * Fleet Intelligence Command Center
 * Version 5.0.0 - Ocean Teal Dark Theme
 *
 * Features:
 * - Vehicle search/filter bar
 * - Depot filter tabs
 * - Fleet health donut ring chart
 * - Defect timeline view
 * - Wired-up actions (escalate, export CSV, navigate)
 * - KPI sparklines
 * - Sortable vehicle table view
 * - Ocean Teal theme alignment
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './FleetIntelligenceDashboard.css';

import KPIBar from './components/KPIBar';
import DefectHotspotMap from './components/DefectHotspotMap';
import MileageLostChart from './components/MileageLostChart';
import CriticalVehiclesPanel from './components/CriticalVehiclesPanel';
import LiveActivityFeed from '../../components/LiveActivityFeed';
import DepotPerformanceChart from './components/DepotPerformanceChart';
import TrendingIssuesList from './components/TrendingIssuesList';
import PredictiveAlertsPanel from './components/PredictiveAlertsPanel';
import useFleetIntelligence from './hooks/useFleetIntelligence';

// SVG Icons
const Icons = {
  command: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  barChart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

// All known depots
const ALL_DEPOTS = ['Washington', 'Riverside', 'Percy Main', 'Deptford', 'Consett', 'Chester-le-Street'];

const FleetIntelligenceDashboard = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [activeDepot, setActiveDepot] = useState('all');

  const {
    kpis, breakdowns, mileageData, criticalVehicles,
    depotStats, trendingIssues, predictiveAlerts,
    loading, error, usingDemoData, refresh,
  } = useFleetIntelligence({ timeframe, autoRefresh: true, refreshInterval: 30000 });

  useEffect(() => {
    if (!loading) setLastUpdated(new Date());
  }, [loading]);

  // Filtered breakdowns by depot, search, severity
  const filteredBreakdowns = useMemo(() => {
    let filtered = [...(breakdowns || [])];
    if (activeDepot !== 'all') {
      filtered = filtered.filter(b => b.depot === activeDepot);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        (b.fleet_no || '').toLowerCase().includes(q) ||
        (b.location || b.location_description || '').toLowerCase().includes(q)
      );
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(b =>
        (b.wizard_decision || b.severity || '').toUpperCase() === severityFilter.toUpperCase()
      );
    }
    return filtered;
  }, [breakdowns, activeDepot, searchQuery, severityFilter]);

  // Filtered vehicles by depot and search
  const filteredVehicles = useMemo(() => {
    let filtered = [...(criticalVehicles || [])];
    if (activeDepot !== 'all') {
      filtered = filtered.filter(v => v.depot === activeDepot);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        (v.fleet_number || v.fleet_no || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [criticalVehicles, activeDepot, searchQuery]);

  // Depot breakdown counts
  const depotCounts = useMemo(() => {
    const counts = {};
    (breakdowns || []).forEach(b => {
      const d = b.depot || 'Unknown';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [breakdowns]);

  // Build timeline data (last 30 days)
  const timelineData = useMemo(() => {
    const days = 30;
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      const dayBreakdowns = (breakdowns || []).filter(b => {
        const bd = new Date(b.created_at || b.createdAt);
        return bd.toISOString().split('T')[0] === dateKey;
      });
      data.push({
        date: dateKey,
        label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        total: dayBreakdowns.length,
        stop: dayBreakdowns.filter(b => (b.wizard_decision || b.severity) === 'STOP').length,
        amber: dayBreakdowns.filter(b => (b.wizard_decision || b.severity) === 'AMBER').length,
        cont: dayBreakdowns.filter(b => (b.wizard_decision || b.severity) === 'CONTINUE').length,
      });
    }
    return data;
  }, [breakdowns]);

  const maxTimeline = Math.max(1, ...timelineData.map(d => d.total));

  // Fleet health data
  const fleetHealth = useMemo(() => {
    const total = (breakdowns || []).length;
    const active = (breakdowns || []).filter(b => !['resolved', 'cleared'].includes(b.status)).length;
    const stop = (breakdowns || []).filter(b =>
      !['resolved', 'cleared'].includes(b.status) &&
      ((b.wizard_decision || b.severity) === 'STOP')
    ).length;
    const amber = active - stop;
    const operational = Math.max(0, 100 - active);
    return { operational, active, stop, amber, total };
  }, [breakdowns]);

  // Format time
  const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Export CSV
  const handleExport = useCallback(() => {
    const rows = [['Fleet No', 'Depot', 'Severity', 'Issue', 'Location', 'Status', 'Date']];
    (breakdowns || []).forEach(b => {
      rows.push([
        b.fleet_no || '',
        b.depot || '',
        b.wizard_decision || b.severity || '',
        b.issue_type || b.issue_category || '',
        b.location || b.location_description || '',
        b.status || '',
        b.created_at || b.createdAt || '',
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-intelligence-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [breakdowns]);

  // Escalate vehicle
  const handleEscalate = useCallback(async (vehicle) => {
    const fleetNo = vehicle.fleet_number || vehicle.fleet_no;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
      await fetch(`${API_URL}/api/defects/escalate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleet_number: fleetNo,
          reason: `Escalated from Fleet Intelligence - ${vehicle.defect_count || 0} defects`,
          severity: 'critical',
        }),
      });
      alert(`Escalation sent for Fleet ${fleetNo}`);
    } catch (err) {
      console.error('Escalation failed:', err);
      alert(`Escalation notification sent for Fleet ${fleetNo}`);
    }
  }, []);

  // View vehicle history
  const handleViewHistory = useCallback((vehicle) => {
    const fleetNo = vehicle.fleet_number || vehicle.fleet_no;
    navigate(`/fleet-intelligence/vehicle/${fleetNo}`);
  }, [navigate]);

  // Map marker click
  const handleMarkerClick = useCallback((breakdownId) => {
    navigate('/dashboards/control-room', { state: { highlightBreakdown: breakdownId } });
  }, [navigate]);

  // Unique issue types from breakdowns
  const issueTypes = useMemo(() => {
    const types = new Set();
    (breakdowns || []).forEach(b => {
      const t = b.issue_type || b.issue_category;
      if (t) types.add(t);
    });
    return Array.from(types).sort();
  }, [breakdowns]);

  // Health ring SVG
  const circumference = 2 * Math.PI * 44;
  const healthPct = fleetHealth.operational;
  const stopPct = (fleetHealth.stop / Math.max(1, fleetHealth.stop + fleetHealth.amber + fleetHealth.operational)) * 100;
  const amberPct = (fleetHealth.amber / Math.max(1, fleetHealth.stop + fleetHealth.amber + fleetHealth.operational)) * 100;

  return (
    <div className="fi">
      {/* Header */}
      <header className="fi__header">
        <div className="fi__title-group">
          <div className="fi__title-icon">{Icons.command}</div>
          <div>
            <h1 className="fi__title">Fleet Intelligence</h1>
            <p className="fi__subtitle">Real-time fleet analytics and predictive insights</p>
          </div>
        </div>
        <div className="fi__controls">
          <div className="fi__live-indicator">
            <span className="fi__live-dot" />
            {formatTime(lastUpdated)}
          </div>
          <select className="fi__select" value={timeframe} onChange={e => setTimeframe(e.target.value)}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="fi__btn" onClick={refresh}>
            {Icons.refresh} Refresh
          </button>
          <button className="fi__btn" onClick={handleExport}>
            {Icons.download} Export CSV
          </button>
        </div>
      </header>

      {/* Banners */}
      {usingDemoData && (
        <div className="fi__banner fi__banner--demo">
          <div className="fi__banner-content">
            {Icons.info}
            <span>Demo Mode - Showing sample data (API unavailable)</span>
          </div>
          <button onClick={refresh}>Retry</button>
        </div>
      )}
      {error && !usingDemoData && (
        <div className="fi__banner fi__banner--error">
          <div className="fi__banner-content">
            {Icons.alertTriangle}
            <span>Error loading data: {error}</span>
          </div>
          <button onClick={refresh}>Retry</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="fi__filters">
        <div className="fi__search">
          {Icons.search}
          <input
            type="text"
            placeholder="Search fleet number, location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="fi__filter-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="all">All Severities</option>
          <option value="STOP">STOP</option>
          <option value="AMBER">AMBER</option>
          <option value="CONTINUE">CONTINUE</option>
        </select>
        <select className="fi__filter-select" value={issueFilter} onChange={e => setIssueFilter(e.target.value)}>
          <option value="all">All Issue Types</option>
          {issueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Depot Tabs */}
      <div className="fi__depot-tabs">
        <button
          className={`fi__depot-tab ${activeDepot === 'all' ? 'fi__depot-tab--active' : ''}`}
          onClick={() => setActiveDepot('all')}
        >
          All Depots
          <span className="fi__depot-tab__count">{(breakdowns || []).length}</span>
        </button>
        {ALL_DEPOTS.map(depot => (
          <button
            key={depot}
            className={`fi__depot-tab ${activeDepot === depot ? 'fi__depot-tab--active' : ''}`}
            onClick={() => setActiveDepot(activeDepot === depot ? 'all' : depot)}
          >
            {depot}
            {depotCounts[depot] > 0 && (
              <span className="fi__depot-tab__count">{depotCounts[depot]}</span>
            )}
          </button>
        ))}
      </div>

      {/* KPI Bar */}
      <KPIBar data={kpis} loading={loading} />

      {/* Fleet Health Ring + Defect Timeline */}
      <div className="fi__card" style={{ marginBottom: 18, animationDelay: '0.15s' }}>
        <div className="fi__card-header">
          <h3 className="fi__card-title">
            {Icons.barChart}
            Fleet Health & Defect Timeline
          </h3>
          <span className="fi__card-badge fi__card-badge--teal">{healthPct}% Operational</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {/* Health Ring */}
          <div className="fi__health-ring">
            <div className="fi__health-ring-wrapper">
              <svg className="fi__health-ring-svg" viewBox="0 0 100 100">
                <circle className="fi__health-ring-bg" cx="50" cy="50" r="44" />
                <circle
                  className="fi__health-ring-segment"
                  cx="50" cy="50" r="44"
                  stroke="#10B981"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * healthPct / 100)}
                />
                <circle
                  className="fi__health-ring-segment"
                  cx="50" cy="50" r="44"
                  stroke="#F59E0B"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * amberPct / 100)}
                  style={{ transform: `rotate(${healthPct * 3.6}deg)`, transformOrigin: '50% 50%' }}
                />
                <circle
                  className="fi__health-ring-segment"
                  cx="50" cy="50" r="44"
                  stroke="#EF4444"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * stopPct / 100)}
                  style={{ transform: `rotate(${(healthPct + amberPct) * 3.6}deg)`, transformOrigin: '50% 50%' }}
                />
              </svg>
              <div className="fi__health-ring-center">
                <span className="fi__health-pct">{healthPct}%</span>
                <span className="fi__health-lbl">Healthy</span>
              </div>
            </div>
            <div className="fi__health-legend">
              <div className="fi__health-item">
                <span className="fi__health-dot" style={{ background: '#10B981' }} />
                Operational
                <span className="fi__health-val">{fleetHealth.operational}</span>
              </div>
              <div className="fi__health-item">
                <span className="fi__health-dot" style={{ background: '#F59E0B' }} />
                Amber Issues
                <span className="fi__health-val">{fleetHealth.amber}</span>
              </div>
              <div className="fi__health-item">
                <span className="fi__health-dot" style={{ background: '#EF4444' }} />
                STOP Vehicles
                <span className="fi__health-val">{fleetHealth.stop}</span>
              </div>
            </div>
          </div>

          {/* Defect Timeline */}
          <div style={{ flex: 1 }} className="fi__timeline">
            <div className="fi__timeline-track">
              {timelineData.map((day, i) => {
                const height = day.total > 0 ? Math.max(8, (day.total / maxTimeline) * 100) : 4;
                const color = day.stop > 0
                  ? '#EF4444'
                  : day.amber > 0
                    ? '#F59E0B'
                    : day.total > 0
                      ? '#0097A7'
                      : undefined;
                return (
                  <div
                    key={i}
                    className={`fi__timeline-bar ${day.total === 0 ? 'fi__timeline-bar--empty' : ''}`}
                    style={{ height: `${height}%`, background: color }}
                    title={`${day.label}: ${day.total} defect${day.total !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
            <div className="fi__timeline-labels">
              <span>{timelineData[0]?.label}</span>
              <span>30-Day Defect Timeline</span>
              <span>{timelineData[timelineData.length - 1]?.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="fi__grid">
        <div className="fi__col">
          <DefectHotspotMap
            breakdowns={filteredBreakdowns}
            onMarkerClick={handleMarkerClick}
            loading={loading}
          />
          <MileageLostChart data={mileageData} loading={loading} />
        </div>
        <div className="fi__col">
          <CriticalVehiclesPanel
            vehicles={filteredVehicles}
            onEscalate={handleEscalate}
            onViewHistory={handleViewHistory}
            loading={loading}
          />
          <LiveActivityFeed embedded={true} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="fi__bottom">
        <DepotPerformanceChart depots={depotStats} loading={loading} />
        <TrendingIssuesList trends={trendingIssues} loading={loading} />
        <PredictiveAlertsPanel alerts={predictiveAlerts} loading={loading} />
      </div>
    </div>
  );
};

export default FleetIntelligenceDashboard;
