import React from 'react';

const ExecutiveKPIs = ({ kpiData, period }) => {
  if (!kpiData) return null;

  // SVG Icons
  const GearIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6m5.2-13l-1 1.7M8.8 18.3l-1 1.7m8.4-16.3l-1.7 1M8.8 18.3l-1.7 1m11.8-7.3h-6m-6 0H1m17.7 5.2l-1.7-1M7 9.8l-1.7-1m13.4 8.4l-1.7-1M7 9.8l-1.7 1"/>
    </svg>
  );

  const ChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );

  const ClockIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );

  const BusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18v10H3V6z"/>
      <path d="M3 10h18M8 16h.01M16 16h.01"/>
      <circle cx="8" cy="19" r="1"/>
      <circle cx="16" cy="19" r="1"/>
      <path d="M7 6V4h10v2"/>
    </svg>
  );

  const WrenchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );

  const PersonIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const kpiCards = [
    {
      key: 'mtbf',
      title: 'MTBF',
      // MTBF is computed over a fixed rolling window (see kpi.windowLabel from
      // the API) rather than the period tabs above, since "today"/"this week"
      // makes a mean-time-between-failures reading meaningless after a single
      // incident. Say so in the subtitle rather than implying it tracks period.
      subtitle: kpiData?.mtbf?.windowLabel
        ? `Mean Time Between Failures · ${kpiData.mtbf.windowLabel}`
        : 'Mean Time Between Failures',
      icon: <GearIcon />,
      format: 'mtbf'
    },
    {
      key: 'slaCompliance',
      title: 'SLA Compliance',
      subtitle: 'Service Level Agreement',
      icon: <ChartIcon />,
      format: 'percentage'
    },
    {
      key: 'avgResponseTime',
      title: 'Avg Response Time',
      subtitle: 'Engineer dispatch to arrival',
      icon: <ClockIcon />,
      format: 'time'
    },
    {
      key: 'fleetAvailability',
      title: 'Fleet Availability',
      subtitle: 'Operational vehicles',
      icon: <BusIcon />,
      format: 'percentage'
    },
    {
      key: 'breakdownsToday',
      title: 'Breakdowns',
      subtitle: getPeriodLabel(period),
      icon: <WrenchIcon />,
      format: 'number'
    },
    {
      key: 'engineerUtilization',
      title: 'Engineer Utilization',
      subtitle: 'Active engineering time',
      icon: <PersonIcon />,
      format: 'percentage'
    }
  ];

  function getPeriodLabel(period) {
    switch(period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'Today';
    }
  }

  // MTBF is stored/measured in hours, but "1 hours" (wrong plural, wrong
  // scale) is what a raw hours count looks like once a period has only had
  // one or two incidents. Pick the unit that reads naturally and pluralise
  // correctly instead.
  function formatMtbf(hours) {
    if (hours === null || hours === undefined) return '—';
    if (hours < 1) {
      const mins = Math.round(hours * 60);
      return `${mins} min${mins === 1 ? '' : 's'}`;
    }
    if (hours < 48) {
      const rounded = Math.round(hours * 10) / 10;
      return `${rounded} hour${rounded === 1 ? '' : 's'}`;
    }
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  function formatValue(value, format) {
    if (value === null || value === undefined) return '—';
    if (format === 'percentage') {
      return `${value}%`;
    } else if (format === 'time') {
      return `${value} min`;
    } else if (format === 'mtbf') {
      return formatMtbf(value);
    }
    return value.toLocaleString();
  }

  function getEmptySubtitle(key) {
    // MTBF's empty state isn't period-bound (it's a fixed 30-day window), so
    // it needs its own honest "nothing to show" line rather than the generic
    // period-based one.
    if (key === 'mtbf') return 'Not enough breakdowns in the last 30 days';
    return 'Not enough data for this period';
  }

  function getStatusClass(kpi) {
    if (kpi.status === 'good') return 'ekpi-status-good';
    if (kpi.status === 'warning') return 'ekpi-status-warning';
    if (kpi.status === 'critical') return 'ekpi-status-critical';
    return '';
  }

  function getTrendIcon(trend) {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  }

  function getTrendClass(trend, isPositiveGood = true) {
    if (trend === 0) return 'ekpi-trend-neutral';
    if (isPositiveGood) {
      return trend > 0 ? 'ekpi-trend-positive' : 'ekpi-trend-negative';
    } else {
      return trend < 0 ? 'ekpi-trend-positive' : 'ekpi-trend-negative';
    }
  }

  // Determine if positive trend is good for each KPI
  const positiveIsGood = {
    mtbf: true,
    slaCompliance: true,
    avgResponseTime: false, // Lower is better
    fleetAvailability: true,
    breakdownsToday: false, // Lower is better
    engineerUtilization: true
  };

  return (
    <div className="ekpi-executive-kpis">
      <h2>Executive KPIs</h2>
      <div className="ekpi-grid">
        {kpiCards.map(card => {
          const kpi = kpiData[card.key];
          if (!kpi) return null;

          return (
            <div key={card.key} className={`ekpi-card ${getStatusClass(kpi)}`}>
              <div className="ekpi-header">
                <div className="ekpi-icon">{card.icon}</div>
                {typeof kpi.trend === 'number' && (
                  <div className="ekpi-trend">
                    <span className={getTrendClass(kpi.trend, positiveIsGood[card.key])}>
                      {getTrendIcon(kpi.trend)} {Math.abs(kpi.trend)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="ekpi-value">
                {formatValue(kpi.value, card.format)}
                {/* formatValue() already appends % / min for percentage & time KPIs,
                    so only show the separate unit badge for plain numbers (hours, incidents, etc.) */}
                {card.format === 'number' && kpi.unit && kpi.value != null && (
                  <span className="ekpi-unit">{kpi.unit}</span>
                )}
              </div>

              <div className="ekpi-title">{card.title}</div>
              <div className="ekpi-subtitle">
                {kpi.value == null ? getEmptySubtitle(card.key) : card.subtitle}
              </div>

              {kpi.target && (
                <div className="ekpi-target">
                  Target: {formatValue(kpi.target, card.format)}
                </div>
              )}

              {/* Progress bar for percentage KPIs */}
              {card.format === 'percentage' && kpi.value != null && (
                <div className="ekpi-progress">
                  <div
                    className="ekpi-progress-bar"
                    style={{ width: `${kpi.value}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .ekpi-executive-kpis {
          margin-bottom: 30px;
        }

        h2 {
          color: #0097A7;
          font-size: 24px;
          margin-bottom: 20px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
        }

        .ekpi-grid {
          display: grid;
          /* Fixed column counts (rather than auto-fit) so 6 KPI cards always
             fill complete rows instead of leaving a lone orphan card. */
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .ekpi-card {
          background: #141D2B;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }

        .ekpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 151, 167, 0.3);
        }

        .ekpi-card.ekpi-status-warning {
          border-left: 4px solid #f59e0b;
        }

        .ekpi-card.ekpi-status-critical {
          border-left: 4px solid #ef4444;
        }

        .ekpi-card.ekpi-status-good {
          border-left: 4px solid #10b981;
        }

        .ekpi-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .ekpi-icon {
          color: #0097A7;
          opacity: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ekpi-trend {
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
        }

        .ekpi-trend-positive {
          color: #10b981;
        }

        .ekpi-trend-negative {
          color: #ef4444;
        }

        .ekpi-trend-neutral {
          color: #94A3B8;
        }

        .ekpi-value {
          font-size: 36px;
          font-weight: bold;
          color: #0097A7;
          margin-bottom: 10px;
          display: flex;
          align-items: baseline;
          gap: 5px;
          font-family: 'JetBrains Mono', monospace;
        }

        .ekpi-unit {
          font-size: 16px;
          font-weight: normal;
          color: #94A3B8;
          font-family: 'Inter', sans-serif;
        }

        .ekpi-title {
          font-size: 16px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 4px;
          font-family: 'Inter', sans-serif;
        }

        .ekpi-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin-bottom: 10px;
          font-family: 'Inter', sans-serif;
        }

        .ekpi-target {
          font-size: 12px;
          color: #64748B;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #1E293B;
          font-family: 'Inter', sans-serif;
        }

        .ekpi-progress {
          height: 4px;
          background: #1E293B;
          border-radius: 2px;
          margin-top: 12px;
          overflow: hidden;
        }

        .ekpi-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #0097A7, #00838F);
          transition: width 0.5s ease;
        }

        @media (max-width: 1180px) {
          .ekpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .ekpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ExecutiveKPIs;
