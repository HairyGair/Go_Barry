/**
 * DepotPerformanceChart Component
 * Ocean Teal themed depot performance chart with pure CSS bars
 *
 * Features:
 * - Pure CSS horizontal bar chart (no Recharts dependency)
 * - Inline SVG icons (no emoji)
 * - Color-coded severity bars (high=red, medium=amber, low=green)
 * - Sorted by defect count descending
 * - Default depot list with zero values if no data
 */

import React, { useMemo } from 'react';

const DepotPerformanceChart = ({ depots = [], loading }) => {
  // Process and sort depot data
  const chartData = useMemo(() => {
    if (!depots || depots.length === 0) {
      // Default depots with zero values
      return [
        { name: 'Washington', value: 0, trend: 0 },
        { name: 'Riverside', value: 0, trend: 0 },
        { name: 'Percy Main', value: 0, trend: 0 },
        { name: 'Deptford', value: 0, trend: 0 },
        { name: 'Consett', value: 0, trend: 0 },
        { name: 'Chester-le-Street', value: 0, trend: 0 },
      ];
    }

    return depots
      .map(depot => ({
        name: depot.depot || depot.name || depot.depot_id,
        value: depot.defect_count || depot.breakdown_count || depot.count || 0,
        trend: depot.trend || depot.weekly_change || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [depots]);

  // Calculate max value for percentage width
  const maxValue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.value));
    return max > 0 ? max : 1; // Avoid division by zero
  }, [chartData]);

  // Calculate total defects
  const totalDefects = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.value, 0);
  }, [chartData]);

  // Determine severity class based on value
  const getSeverityClass = (value) => {
    if (value >= 10) return 'fi__depot-bar-fill--high';
    if (value >= 5) return 'fi__depot-bar-fill--medium';
    return 'fi__depot-bar-fill--low';
  };

  if (loading) {
    return (
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Depot Performance
          </h3>
        </div>
        <div className="fi__skeleton fi__skeleton--chart"></div>
      </div>
    );
  }

  return (
    <div className="fi__card">
      <div className="fi__card-header">
        <h3 className="fi__card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Depot Performance
        </h3>
        <span className="fi__card-badge fi__card-badge--count">
          {totalDefects} total
        </span>
      </div>

      <div className="fi__depot-chart">
        {chartData.length === 0 || totalDefects === 0 ? (
          <div className="fi__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>No depot data available</p>
            <p className="fi__empty-sub">Breakdown data will appear here when recorded</p>
          </div>
        ) : (
          <div className="fi__depot-bars">
            {chartData.map((depot, index) => {
              const widthPercent = maxValue > 0 ? (depot.value / maxValue) * 100 : 0;
              const severityClass = getSeverityClass(depot.value);

              return (
                <div key={index} className="fi__depot-row">
                  <div className="fi__depot-name" title={depot.name}>
                    {depot.name}
                  </div>
                  <div className="fi__depot-bar-track">
                    <div
                      className={`fi__depot-bar-fill ${severityClass}`}
                      style={{ width: `${widthPercent}%` }}
                      title={`${depot.name}: ${depot.value} defects`}
                    />
                  </div>
                  <div className="fi__depot-count">
                    {depot.value}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotPerformanceChart;
