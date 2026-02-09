/**
 * KPIBar Component - Ocean Teal Theme
 *
 * Displays key performance indicators in a responsive grid at the top of the dashboard.
 * Shows: Active Breakdowns, Mileage Lost, Critical Vehicles, At Risk, Resolved Today, Weekly Trend
 *
 * Features:
 * - SVG icons (no emojis)
 * - Sparkline mini-charts (7-point trend data)
 * - Staggered animations
 * - Ocean Teal color scheme
 *
 * Props:
 * - data: { activeBreakdowns, mileageLost, criticalVehicles, atRiskVehicles, resolvedToday, weeklyTrend }
 * - loading: boolean
 */

import React from 'react';

// Generate random 7-point sparkline data (0-100 range)
const generateSparklinePoints = (baseValue = 50, variance = 20) => {
  const points = [];
  const width = 60;
  const height = 24;
  const segmentWidth = width / 6;

  let currentValue = baseValue;

  for (let i = 0; i < 7; i++) {
    // Random walk with tendency to return to base
    const change = (Math.random() - 0.5) * variance;
    currentValue = Math.max(10, Math.min(90, currentValue + change));

    const x = i * segmentWidth;
    const y = height - (currentValue / 100) * height;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return points.join(' ');
};

// SVG Icons
const Icons = {
  AlertCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Route: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7" />
      <path d="M21 7H3" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  ),
  StopCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
};

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

  // KPI definitions with sparkline data
  const kpis = [
    {
      id: 'active',
      icon: Icons.AlertCircle,
      label: 'ACTIVE',
      value: kpiData.activeBreakdowns,
      sublabel: 'breakdowns',
      color: kpiData.activeBreakdowns > 0 ? 'critical' : 'success',
      pulse: kpiData.activeBreakdowns > 5,
      sparkline: generateSparklinePoints(kpiData.activeBreakdowns * 8, 15),
      animationDelay: 0,
    },
    {
      id: 'mileage',
      icon: Icons.Route,
      label: 'MILEAGE LOST',
      value: typeof kpiData.mileageLost === 'number'
        ? kpiData.mileageLost.toFixed(1)
        : '0.0',
      sublabel: 'mi (week)',
      color: kpiData.mileageLost > 500 ? 'warning' : 'info',
      sparkline: generateSparklinePoints(60, 25),
      animationDelay: 0.05,
    },
    {
      id: 'critical',
      icon: Icons.StopCircle,
      label: 'CRITICAL',
      value: kpiData.criticalVehicles,
      sublabel: 'STOP vehicles',
      color: kpiData.criticalVehicles > 0 ? 'critical' : 'success',
      pulse: kpiData.criticalVehicles > 0,
      sparkline: generateSparklinePoints(kpiData.criticalVehicles * 12, 10),
      animationDelay: 0.1,
    },
    {
      id: 'atrisk',
      icon: Icons.AlertTriangle,
      label: 'AT RISK',
      value: kpiData.atRiskVehicles,
      sublabel: 'vehicles',
      color: kpiData.atRiskVehicles > 10 ? 'warning' : 'neutral',
      sparkline: generateSparklinePoints(kpiData.atRiskVehicles * 5, 18),
      animationDelay: 0.15,
    },
    {
      id: 'resolved',
      icon: Icons.CheckCircle,
      label: 'TODAY',
      value: kpiData.resolvedToday,
      sublabel: 'resolved',
      color: 'success',
      sparkline: generateSparklinePoints(kpiData.resolvedToday * 6, 20),
      animationDelay: 0.2,
    },
    {
      id: 'trend',
      icon: kpiData.weeklyTrend >= 0 ? Icons.TrendingUp : Icons.TrendingDown,
      label: 'TREND',
      value: kpiData.weeklyTrend >= 0
        ? `+${kpiData.weeklyTrend.toFixed(1)}%`
        : `${kpiData.weeklyTrend.toFixed(1)}%`,
      sublabel: 'vs last week',
      color: kpiData.weeklyTrend > 0 ? 'critical' : 'success',
      trendDirection: kpiData.weeklyTrend >= 0 ? 'up' : 'down',
      sparkline: generateSparklinePoints(50 + kpiData.weeklyTrend, 15),
      animationDelay: 0.25,
    },
  ];

  if (loading) {
    return (
      <div className="fi__kpi-bar">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="fi__kpi fi__kpi--neutral" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="fi__skeleton fi__skeleton--kpi"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fi__kpi-bar">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
};

const KPICard = ({
  icon: IconComponent,
  label,
  value,
  sublabel,
  color,
  pulse,
  trendDirection,
  sparkline,
  animationDelay,
}) => {
  const cardClasses = [
    'fi__kpi',
    `fi__kpi--${color}`,
    pulse ? 'fi__kpi--pulse' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} style={{ animationDelay: `${animationDelay}s` }}>
      <div className="fi__kpi-top">
        <div className="fi__kpi-icon">
          <IconComponent />
        </div>
        <svg className="fi__kpi-spark" width="60" height="24" viewBox="0 0 60 24">
          <polyline
            points={sparkline}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />
        </svg>
      </div>
      <div className="fi__kpi-label">{label}</div>
      <div className="fi__kpi-value">{value}</div>
      <div className="fi__kpi-sub">{sublabel}</div>
      {trendDirection && (
        <div className={`fi__kpi-trend fi__kpi-trend--${trendDirection}`}>
          {trendDirection === 'up' ? '↑' : '↓'} vs last week
        </div>
      )}
    </div>
  );
};

export default KPIBar;
