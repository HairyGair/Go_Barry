/**
 * MileageLostChart Component
 *
 * Displays a 7-day trend chart of mileage lost due to breakdowns.
 * Features: Area/Bar chart toggle, trend indicator, top routes summary.
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import MileageDetailsModal from './MileageDetailsModal';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <p className="tooltip-value">
          <span className="tooltip-label">Mileage Lost:</span>
          <span className="tooltip-number">{payload[0].value.toFixed(1)} mi</span>
        </p>
      </div>
    );
  }
  return null;
};

const MileageLostChart = ({ data, loading }) => {
  const [chartType, setChartType] = useState('area');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!data?.daily || !Array.isArray(data.daily)) {
      // Generate sample data for 7 days if no data available
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push({
          date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
          total: 0,
        });
      }
      return days;
    }

    return data.daily.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      total: d.total || d.mileage_lost || 0,
      byRoute: d.byRoute || {},
    }));
  }, [data]);

  // Calculate totals
  const totals = useMemo(() => {
    const thisWeek = data?.summary?.totalMileageLost ||
      chartData.reduce((sum, d) => sum + (d.total || 0), 0);
    const lastWeek = data?.summary?.lastWeekMileageLost || thisWeek * 0.9;
    const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    // Top routes by mileage lost
    const topRoutes = data?.topRoutes || data?.summary?.topRoutes || [];

    return {
      thisWeek,
      lastWeek,
      change,
      topRoutes: Array.isArray(topRoutes) ? topRoutes.slice(0, 5) : [],
    };
  }, [data, chartData]);

  if (loading) {
    return (
      <div className="fid-card mileage-chart-container">
        <div className="chart-header">
          <h3>📈 Mileage Lost (7 Days)</h3>
        </div>
        <div className="chart-loading">
          <div className="loading-skeleton chart-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card mileage-chart-container">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>📈 Mileage Lost (7 Days)</h3>
          <div className="chart-summary">
            <span className="total-miles">{totals.thisWeek.toFixed(1)} mi</span>
            <span className={`trend ${totals.change >= 0 ? 'up' : 'down'}`}>
              {totals.change >= 0 ? '↑' : '↓'} {Math.abs(totals.change).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="chart-type-toggle">
          <button
            className={chartType === 'area' ? 'active' : ''}
            onClick={() => setChartType('area')}
          >
            📈 Trend
          </button>
          <button
            className={chartType === 'bar' ? 'active' : ''}
            onClick={() => setChartType('bar')}
          >
            📊 Daily
          </button>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mileageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E30613" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E30613" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#E30613"
                strokeWidth={2}
                fill="url(#mileageGradient)"
                animationDuration={500}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                fill="#E30613"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {totals.topRoutes.length > 0 && (
        <div className="top-routes">
          <h4>Top Impact Routes</h4>
          <div className="route-chips">
            {totals.topRoutes.map((route, index) => (
              <span key={index} className="route-chip">
                Route {route.route || route.route_id}: {(route.miles || route.mileage_lost || 0).toFixed(1)} mi
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Details Button */}
      <div className="chart-actions">
        <button
          className="view-details-btn"
          onClick={() => setShowDetailsModal(true)}
        >
          🔍 View Detailed Breakdown
        </button>
      </div>

      {/* Mileage Details Modal */}
      <MileageDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        initialDays={7}
      />
    </div>
  );
};

export default MileageLostChart;
