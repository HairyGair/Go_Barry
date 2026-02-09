/**
 * MileageLostChart Component
 *
 * Ocean Teal themed mileage lost chart for Fleet Intelligence Dashboard.
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

// Inline SVG Icons
const TrendLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12L5 9L8 11L14 5M14 5H10M14 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="3" height="6" fill="currentColor" rx="1"/>
    <rect x="6.5" y="4" width="3" height="10" fill="currentColor" rx="1"/>
    <rect x="11" y="6" width="3" height="8" fill="currentColor" rx="1"/>
  </svg>
);

const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 13L7 7L10 10L13 1M13 1H9M13 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L7 7L10 4L13 13M13 13H9M13 13V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MagnifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="fi__tooltip">
        <p className="fi__tooltip-label">{label}</p>
        <p className="fi__tooltip-value">
          <span>Mileage Lost:</span>
          <strong>{payload[0].value.toFixed(1)} mi</strong>
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
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">Mileage Lost (7 Days)</h3>
        </div>
        <div className="fi__skeleton fi__skeleton--chart"></div>
      </div>
    );
  }

  return (
    <div className="fi__card">
      <div className="fi__card-header">
        <div className="fi__chart-header">
          <h3 className="fi__card-title">Mileage Lost (7 Days)</h3>
          <div className="fi__chart-summary">
            <span className="fi__chart-total">{totals.thisWeek.toFixed(1)} mi</span>
            <span className={`fi__chart-trend ${totals.change >= 0 ? 'fi__chart-trend--up' : 'fi__chart-trend--down'}`}>
              {totals.change >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
              {Math.abs(totals.change).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="fi__chart-toggle">
          <button
            className={chartType === 'area' ? 'active' : ''}
            onClick={() => setChartType('area')}
            aria-label="Trend view"
          >
            <TrendLineIcon />
            Trend
          </button>
          <button
            className={chartType === 'bar' ? 'active' : ''}
            onClick={() => setChartType('bar')}
            aria-label="Bar chart view"
          >
            <BarChartIcon />
            Daily
          </button>
        </div>
      </div>

      <div className="fi__chart-container">
        <ResponsiveContainer width="100%" height={200}>
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mileageGradientOcean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(0,151,167,0.4)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(0,151,167,0)" stopOpacity={1} />
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
                stroke="#0097A7"
                strokeWidth={2}
                fill="url(#mileageGradientOcean)"
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
                fill="#00BCD4"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {totals.topRoutes.length > 0 && (
        <div className="fi__chart-routes">
          <h4>Top Impact Routes</h4>
          <div className="fi__route-chips">
            {totals.topRoutes.map((route, index) => (
              <span key={index} className="fi__route-chip">
                Route {route.route || route.route_id}: {(route.miles || route.mileage_lost || 0).toFixed(1)} mi
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="fi__chart-actions">
        <button
          className="fi__view-details-btn"
          onClick={() => setShowDetailsModal(true)}
        >
          <MagnifyIcon />
          View Detailed Breakdown
        </button>
      </div>

      <MileageDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        initialDays={7}
      />
    </div>
  );
};

export default MileageLostChart;
