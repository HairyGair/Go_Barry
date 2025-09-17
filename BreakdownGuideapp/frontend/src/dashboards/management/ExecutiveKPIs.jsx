import React from 'react';

const ExecutiveKPIs = ({ kpiData, period }) => {
  if (!kpiData) return null;

  const kpiCards = [
    {
      key: 'mtbf',
      title: 'MTBF',
      subtitle: 'Mean Time Between Failures',
      icon: '⚙️',
      format: 'number'
    },
    {
      key: 'slaCompliance',
      title: 'SLA Compliance',
      subtitle: 'Service Level Agreement',
      icon: '📊',
      format: 'percentage'
    },
    {
      key: 'avgResponseTime',
      title: 'Avg Response Time',
      subtitle: 'Engineer dispatch to arrival',
      icon: '⏱️',
      format: 'time'
    },
    {
      key: 'fleetAvailability',
      title: 'Fleet Availability',
      subtitle: 'Operational vehicles',
      icon: '🚌',
      format: 'percentage'
    },
    {
      key: 'breakdownsToday',
      title: 'Breakdowns',
      subtitle: getPeriodLabel(period),
      icon: '🔧',
      format: 'number'
    },
    {
      key: 'engineerUtilization',
      title: 'Engineer Utilization',
      subtitle: 'Active engineering time',
      icon: '👷',
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

  function formatValue(value, format) {
    if (format === 'percentage') {
      return `${value}%`;
    } else if (format === 'time') {
      return `${value} min`;
    }
    return value.toLocaleString();
  }

  function getStatusClass(kpi) {
    if (kpi.status === 'good') return 'status-good';
    if (kpi.status === 'warning') return 'status-warning';
    if (kpi.status === 'critical') return 'status-critical';
    return '';
  }

  function getTrendIcon(trend) {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  }

  function getTrendClass(trend, isPositiveGood = true) {
    if (trend === 0) return 'trend-neutral';
    if (isPositiveGood) {
      return trend > 0 ? 'trend-positive' : 'trend-negative';
    } else {
      return trend < 0 ? 'trend-positive' : 'trend-negative';
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
    <div className="executive-kpis">
      <h2>Executive KPIs</h2>
      <div className="kpi-grid">
        {kpiCards.map(card => {
          const kpi = kpiData[card.key];
          if (!kpi) return null;

          return (
            <div key={card.key} className={`kpi-card ${getStatusClass(kpi)}`}>
              <div className="kpi-header">
                <div className="kpi-icon">{card.icon}</div>
                <div className="kpi-trend">
                  <span className={getTrendClass(kpi.trend, positiveIsGood[card.key])}>
                    {getTrendIcon(kpi.trend)} {Math.abs(kpi.trend)}%
                  </span>
                </div>
              </div>
              
              <div className="kpi-value">
                {formatValue(kpi.value, card.format)}
                {kpi.unit && <span className="kpi-unit">{kpi.unit}</span>}
              </div>
              
              <div className="kpi-title">{card.title}</div>
              <div className="kpi-subtitle">{card.subtitle}</div>
              
              {kpi.target && (
                <div className="kpi-target">
                  Target: {formatValue(kpi.target, card.format)}
                </div>
              )}
              
              {/* Progress bar for percentage KPIs */}
              {card.format === 'percentage' && (
                <div className="kpi-progress">
                  <div 
                    className="kpi-progress-bar" 
                    style={{ width: `${kpi.value}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .executive-kpis {
          margin-bottom: 30px;
        }

        h2 {
          color: #1e3a8a;
          font-size: 24px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .kpi-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .kpi-card.status-warning {
          border-left: 4px solid #f59e0b;
        }

        .kpi-card.status-critical {
          border-left: 4px solid #ef4444;
        }

        .kpi-card.status-good {
          border-left: 4px solid #10b981;
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .kpi-icon {
          font-size: 28px;
          opacity: 0.8;
        }

        .kpi-trend {
          font-size: 13px;
          font-weight: 600;
        }

        .trend-positive {
          color: #10b981;
        }

        .trend-negative {
          color: #ef4444;
        }

        .trend-neutral {
          color: #6b7280;
        }

        .kpi-value {
          font-size: 36px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 10px;
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .kpi-unit {
          font-size: 16px;
          font-weight: normal;
          color: #6b7280;
        }

        .kpi-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .kpi-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 10px;
        }

        .kpi-target {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f3f4f6;
        }

        .kpi-progress {
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          margin-top: 12px;
          overflow: hidden;
        }

        .kpi-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1e3a8a);
          transition: width 0.5s ease;
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ExecutiveKPIs;
