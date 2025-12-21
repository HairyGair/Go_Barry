/**
 * LiveStatsBar Component
 * Real-time breakdown statistics dashboard for SDC Operations
 * Shows active breakdowns, critical counts, and response metrics
 */

import React, { useMemo, useState, useEffect } from 'react';
import './LiveStatsBar.css';

const LiveStatsBar = ({ breakdowns = [], onFilterChange }) => {
  const [animatedValues, setAnimatedValues] = useState({});
  const [pulsingStats, setPulsingStats] = useState([]);

  // Calculate statistics from breakdowns
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Active breakdowns (not resolved or cleared)
    const active = breakdowns.filter(b =>
      b.status !== 'resolved' && b.status !== 'cleared'
    );

    // STOP severity (critical)
    const stop = breakdowns.filter(b =>
      (b.severity === 'STOP' || b.wizard_decision === 'STOP') &&
      b.status !== 'resolved' && b.status !== 'cleared'
    );

    // AMBER severity (warning)
    const amber = breakdowns.filter(b =>
      (b.severity === 'AMBER' || b.wizard_decision === 'AMBER') &&
      b.status !== 'resolved' && b.status !== 'cleared'
    );

    // Dispatched (engineering assigned/en-route)
    const dispatched = breakdowns.filter(b =>
      b.status === 'dispatched' || b.status === 'en-route' || b.status === 'engineer-assigned'
    );

    // Resolved today
    const resolvedToday = breakdowns.filter(b =>
      (b.status === 'resolved' || b.status === 'cleared') &&
      new Date(b.resolved_at || b.updated_at) >= todayStart
    );

    // Pending (no decision yet)
    const pending = breakdowns.filter(b =>
      b.status === 'pending' || b.status === 'new' || !b.wizard_decision
    );

    // In assessment
    const inAssessment = breakdowns.filter(b =>
      b.status === 'in-assessment' || b.status === 'assessing'
    );

    // Average response time (minutes) for resolved today
    let avgResponseTime = 0;
    if (resolvedToday.length > 0) {
      const totalMinutes = resolvedToday.reduce((sum, b) => {
        const created = new Date(b.created_at);
        const resolved = new Date(b.resolved_at || b.updated_at);
        return sum + (resolved - created) / 60000;
      }, 0);
      avgResponseTime = Math.round(totalMinutes / resolvedToday.length);
    }

    return {
      active: active.length,
      stop: stop.length,
      amber: amber.length,
      dispatched: dispatched.length,
      resolved: resolvedToday.length,
      pending: pending.length,
      inAssessment: inAssessment.length,
      avgResponseTime
    };
  }, [breakdowns]);

  // Detect changes and trigger animations
  useEffect(() => {
    const newPulsing = [];

    Object.entries(stats).forEach(([key, value]) => {
      const prev = animatedValues[key];
      if (prev !== undefined && prev !== value) {
        newPulsing.push(key);
      }
    });

    if (newPulsing.length > 0) {
      setPulsingStats(newPulsing);
      setTimeout(() => setPulsingStats([]), 1000);
    }

    setAnimatedValues(stats);
  }, [stats]);

  // Stats configuration with colors and icons
  const statItems = [
    {
      key: 'active',
      label: 'Active',
      value: stats.active,
      icon: '🚨',
      color: '#3b82f6', // Blue
      bgColor: 'rgba(59, 130, 246, 0.15)',
      filter: 'active',
      description: 'Active breakdowns'
    },
    {
      key: 'stop',
      label: 'STOP',
      value: stats.stop,
      icon: '🛑',
      color: '#dc2626', // Red
      bgColor: 'rgba(220, 38, 38, 0.15)',
      filter: 'critical',
      description: 'Critical - vehicle must stop',
      pulse: stats.stop > 0
    },
    {
      key: 'amber',
      label: 'AMBER',
      value: stats.amber,
      icon: '⚠️',
      color: '#f59e0b', // Amber
      bgColor: 'rgba(245, 158, 11, 0.15)',
      filter: 'warning',
      description: 'Warning - monitor closely'
    },
    {
      key: 'pending',
      label: 'Pending',
      value: stats.pending,
      icon: '⏳',
      color: '#8b5cf6', // Purple
      bgColor: 'rgba(139, 92, 246, 0.15)',
      filter: 'pending',
      description: 'Awaiting decision'
    },
    {
      key: 'dispatched',
      label: 'Dispatched',
      value: stats.dispatched,
      icon: '🔧',
      color: '#06b6d4', // Cyan
      bgColor: 'rgba(6, 182, 212, 0.15)',
      filter: 'dispatched',
      description: 'Engineers en-route'
    },
    {
      key: 'resolved',
      label: 'Today',
      value: stats.resolved,
      icon: '✅',
      color: '#22c55e', // Green
      bgColor: 'rgba(34, 197, 94, 0.15)',
      filter: 'resolved',
      description: 'Resolved today'
    }
  ];

  const handleStatClick = (filter) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  return (
    <div className="live-stats-bar">
      <div className="live-stats-bar__header">
        <h3 className="live-stats-bar__title">
          <span className="live-stats-bar__title-icon">📊</span>
          Live Operations
        </h3>
        {stats.avgResponseTime > 0 && (
          <div className="live-stats-bar__avg-time">
            <span className="avg-time-label">Avg Response:</span>
            <span className="avg-time-value">{stats.avgResponseTime} min</span>
          </div>
        )}
      </div>

      <div className="live-stats-bar__stats">
        {statItems.map(item => (
          <button
            key={item.key}
            className={`stat-card ${pulsingStats.includes(item.key) ? 'pulse' : ''} ${item.pulse ? 'critical-pulse' : ''}`}
            style={{
              '--stat-color': item.color,
              '--stat-bg': item.bgColor
            }}
            onClick={() => handleStatClick(item.filter)}
            title={item.description}
          >
            <div className="stat-card__icon">{item.icon}</div>
            <div className="stat-card__value">{item.value}</div>
            <div className="stat-card__label">{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LiveStatsBar;
