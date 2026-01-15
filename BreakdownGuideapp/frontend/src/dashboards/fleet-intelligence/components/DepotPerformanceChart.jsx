/**
 * DepotPerformanceChart Component
 *
 * Horizontal bar chart showing defect rates per depot.
 * Features: Sorted by severity, color-coded bars, depot comparison.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Depot colors
const DEPOT_COLORS = {
  'Washington': '#E30613',
  'Riverside': '#003B5C',
  'Percy Main': '#10B981',
  'Deptford': '#F59E0B',
  'Consett': '#8B5CF6',
  'Chester-le-Street': '#EC4899',
  'default': '#64748B',
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{data.name || data.depot}</p>
        <p className="tooltip-value">
          <span className="tooltip-label">Defects:</span>
          <span className="tooltip-number">{data.defect_count || data.value || 0}</span>
        </p>
        {data.trend !== undefined && (
          <p className="tooltip-trend">
            <span className={data.trend >= 0 ? 'trend-up' : 'trend-down'}>
              {data.trend >= 0 ? '↑' : '↓'} {Math.abs(data.trend).toFixed(1)}% vs last week
            </span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const DepotPerformanceChart = ({ depots = [], loading }) => {
  // Process and sort depot data
  const chartData = useMemo(() => {
    if (!depots || depots.length === 0) {
      // Default depots with zero values
      return [
        { name: 'Washington', value: 0 },
        { name: 'Riverside', value: 0 },
        { name: 'Percy Main', value: 0 },
        { name: 'Deptford', value: 0 },
        { name: 'Consett', value: 0 },
        { name: 'Chester-le-Street', value: 0 },
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

  // Calculate total
  const totalDefects = chartData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="fid-card depot-performance-chart">
        <div className="panel-header">
          <h3>🏭 Depot Performance</h3>
        </div>
        <div className="chart-loading">
          <div className="loading-skeleton chart-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card depot-performance-chart">
      <div className="panel-header">
        <h3>🏭 Depot Performance</h3>
        <span className="total-badge">{totalDefects} total</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              width={75}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={500}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DEPOT_COLORS[entry.name] || DEPOT_COLORS.default}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="depot-legend">
        {chartData.slice(0, 3).map((depot, index) => (
          <div key={index} className="depot-legend-item">
            <span
              className="depot-dot"
              style={{ background: DEPOT_COLORS[depot.name] || DEPOT_COLORS.default }}
            ></span>
            <span className="depot-name">{depot.name}</span>
            <span className="depot-count">{depot.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepotPerformanceChart;
