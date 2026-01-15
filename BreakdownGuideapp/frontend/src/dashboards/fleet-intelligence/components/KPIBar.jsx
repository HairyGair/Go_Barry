/**
 * KPIBar Component
 *
 * Displays key performance indicators in a horizontal bar at the top of the dashboard.
 * Shows: Active Breakdowns, Mileage Lost, Critical Vehicles, At Risk, Resolved Today, Weekly Trend
 */

import React from 'react';

const KPIBar = ({ data, loading }) => {
  // Default/empty state data
  const defaultData = {
    activeBreakdowns: 0,
    mileageLost: 0,
    criticalVehicles: 0,
    atRiskVehicles: 0,
    resolvedToday: 0,
    weeklyTrend: 0,
  };

  const kpiData = data || defaultData;

  // KPI definitions
  const kpis = [
    {
      id: 'active',
      icon: '\u{1F6A8}', // Red rotating light
      label: 'ACTIVE',
      value: kpiData.activeBreakdowns,
      sublabel: 'breakdowns',
      color: kpiData.activeBreakdowns > 0 ? 'critical' : 'success',
      pulse: kpiData.activeBreakdowns > 5,
    },
    {
      id: 'mileage',
      icon: '\u{1F4CF}', // Straight ruler
      label: 'MILEAGE LOST',
      value: typeof kpiData.mileageLost === 'number'
        ? kpiData.mileageLost.toFixed(1)
        : '0.0',
      sublabel: 'mi (week)',
      color: kpiData.mileageLost > 500 ? 'warning' : 'info',
    },
    {
      id: 'critical',
      icon: '\u{1F6D1}', // Stop sign
      label: 'CRITICAL',
      value: kpiData.criticalVehicles,
      sublabel: 'STOP vehicles',
      color: kpiData.criticalVehicles > 0 ? 'critical' : 'success',
      pulse: kpiData.criticalVehicles > 0,
    },
    {
      id: 'atrisk',
      icon: '\u{26A0}\u{FE0F}', // Warning
      label: 'AT RISK',
      value: kpiData.atRiskVehicles,
      sublabel: 'vehicles',
      color: kpiData.atRiskVehicles > 10 ? 'warning' : 'neutral',
    },
    {
      id: 'resolved',
      icon: '\u{2705}', // Check mark
      label: 'TODAY',
      value: kpiData.resolvedToday,
      sublabel: 'resolved',
      color: 'success',
    },
    {
      id: 'trend',
      icon: '\u{1F4C8}', // Chart increasing
      label: 'TREND',
      value: kpiData.weeklyTrend >= 0
        ? `+${kpiData.weeklyTrend.toFixed(1)}%`
        : `${kpiData.weeklyTrend.toFixed(1)}%`,
      sublabel: 'vs last week',
      color: kpiData.weeklyTrend > 0 ? 'critical' : 'success',
      trendDirection: kpiData.weeklyTrend >= 0 ? 'up' : 'down',
    },
  ];

  if (loading) {
    return (
      <div className="kpi-bar">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="kpi-card">
            <div className="loading-skeleton kpi-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-bar">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
};

const KPICard = ({
  icon,
  label,
  value,
  sublabel,
  color,
  pulse,
  trendDirection,
}) => {
  const cardClasses = [
    'kpi-card',
    color,
    pulse ? 'pulse' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sublabel">{sublabel}</div>
      {trendDirection && (
        <div className={`kpi-trend ${trendDirection}`}>
          {trendDirection === 'up' ? '\u2191' : '\u2193'} vs last week
        </div>
      )}
    </div>
  );
};

export default KPIBar;
