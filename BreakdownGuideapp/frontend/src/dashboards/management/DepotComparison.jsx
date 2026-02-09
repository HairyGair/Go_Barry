import React from 'react';

const DepotComparison = ({ depotData }) => {
  if (!depotData || depotData.length === 0) return null;

  // Sort depots by SLA compliance
  const sortedDepots = [...depotData].sort((a, b) => b.slaCompliance - a.slaCompliance);

  const getPerformanceClass = (performance) => {
    switch(performance) {
      case 'good': return 'dc-performance-good';
      case 'warning': return 'dc-performance-warning';
      case 'critical': return 'dc-performance-critical';
      default: return '';
    }
  };

  const getMetricColor = (metric, value) => {
    switch(metric) {
      case 'slaCompliance':
        return value >= 95 ? '#10b981' : value >= 90 ? '#f59e0b' : '#ef4444';
      case 'avgResponse':
        return value <= 25 ? '#10b981' : value <= 35 ? '#f59e0b' : '#ef4444';
      case 'engineerEfficiency':
        return value >= 80 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444';
      default:
        return '#94A3B8';
    }
  };

  return (
    <div className="dc-depot-comparison">
      <h3>Depot Performance Comparison</h3>

      <div className="dc-depot-table">
        <div className="dc-table-header">
          <div className="dc-header-cell dc-depot-name">Depot</div>
          <div className="dc-header-cell">Breakdowns</div>
          <div className="dc-header-cell">Avg Response</div>
          <div className="dc-header-cell">SLA %</div>
          <div className="dc-header-cell">Efficiency</div>
        </div>

        {sortedDepots.map((depot, index) => (
          <div key={depot.depot} className={`dc-depot-row ${getPerformanceClass(depot.performance)}`}>
            <div className="dc-cell dc-depot-name">
              <span className="dc-rank">#{index + 1}</span>
              <span className="dc-name">{depot.depot}</span>
              <span className="dc-fleet-size">({depot.fleetSize} vehicles)</span>
            </div>

            <div className="dc-cell dc-metric">
              <span className="dc-value">{depot.breakdowns}</span>
              <div className="dc-mini-bar">
                <div
                  className="dc-mini-bar-fill"
                  style={{
                    width: `${(depot.breakdowns / 25) * 100}%`,
                    backgroundColor: depot.breakdowns > 15 ? '#ef4444' : '#0097A7'
                  }}
                ></div>
              </div>
            </div>

            <div className="dc-cell dc-metric">
              <span
                className="dc-value"
                style={{ color: getMetricColor('avgResponse', depot.avgResponse) }}
              >
                {depot.avgResponse}m
              </span>
              <div className="dc-mini-bar">
                <div
                  className="dc-mini-bar-fill"
                  style={{
                    width: `${(depot.avgResponse / 45) * 100}%`,
                    backgroundColor: getMetricColor('avgResponse', depot.avgResponse)
                  }}
                ></div>
              </div>
            </div>

            <div className="dc-cell dc-metric">
              <span
                className="dc-value"
                style={{ color: getMetricColor('slaCompliance', depot.slaCompliance) }}
              >
                {depot.slaCompliance}%
              </span>
              <div className="dc-mini-bar">
                <div
                  className="dc-mini-bar-fill"
                  style={{
                    width: `${depot.slaCompliance}%`,
                    backgroundColor: getMetricColor('slaCompliance', depot.slaCompliance)
                  }}
                ></div>
              </div>
            </div>

            <div className="dc-cell dc-metric">
              <span
                className="dc-value"
                style={{ color: getMetricColor('engineerEfficiency', depot.engineerEfficiency) }}
              >
                {depot.engineerEfficiency}%
              </span>
              <div className="dc-mini-bar">
                <div
                  className="dc-mini-bar-fill"
                  style={{
                    width: `${depot.engineerEfficiency}%`,
                    backgroundColor: getMetricColor('engineerEfficiency', depot.engineerEfficiency)
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dc-depot-summary">
        <div className="dc-summary-item">
          <span className="dc-label">Best Performing:</span>
          <span className="dc-summary-value">{sortedDepots[0].depot}</span>
        </div>
        <div className="dc-summary-item">
          <span className="dc-label">Needs Attention:</span>
          <span className="dc-summary-value">{sortedDepots[sortedDepots.length - 1].depot}</span>
        </div>
      </div>

      <style jsx>{`
        .dc-depot-comparison {
          background: #141D2B;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          font-family: 'Inter', sans-serif;
        }

        .dc-depot-comparison h3 {
          color: #0097A7;
          font-size: 20px;
          margin-bottom: 20px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
        }

        .dc-depot-table {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #0F1624;
          border-radius: 8px;
          overflow: hidden;
        }

        .dc-table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          background: linear-gradient(135deg, #0097A7 0%, #00838F 100%);
          color: white;
          font-weight: 600;
          font-size: 13px;
        }

        .dc-header-cell {
          padding: 12px 15px;
          text-align: center;
        }

        .dc-header-cell.dc-depot-name {
          text-align: left;
        }

        .dc-depot-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          background: #141D2B;
          transition: all 0.2s;
        }

        .dc-depot-row:hover {
          background: #1E293B;
        }

        .dc-depot-row.dc-performance-warning {
          border-left: 4px solid #f59e0b;
        }

        .dc-depot-row.dc-performance-critical {
          border-left: 4px solid #ef4444;
        }

        .dc-depot-row.dc-performance-good {
          border-left: 4px solid #10b981;
        }

        .dc-cell {
          padding: 12px 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .dc-cell.dc-depot-name {
          flex-direction: row;
          gap: 8px;
          align-items: center;
          justify-content: flex-start;
        }

        .dc-rank {
          font-weight: 600;
          color: #94A3B8;
          font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
        }

        .dc-name {
          font-weight: 600;
          color: #0097A7;
        }

        .dc-fleet-size {
          font-size: 12px;
          color: #64748B;
        }

        .dc-metric {
          gap: 4px;
        }

        .dc-value {
          font-weight: 600;
          font-size: 15px;
          z-index: 1;
          font-family: 'JetBrains Mono', monospace;
        }

        .dc-mini-bar {
          width: 100%;
          height: 3px;
          background: #1E293B;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 4px;
        }

        .dc-mini-bar-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .dc-depot-summary {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #1E293B;
        }

        .dc-summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dc-summary-item .dc-label {
          font-size: 13px;
          color: #94A3B8;
        }

        .dc-summary-item .dc-summary-value {
          font-size: 16px;
          font-weight: 600;
          color: #0097A7;
        }

        @media (max-width: 768px) {
          .dc-table-header,
          .dc-depot-row {
            grid-template-columns: 2fr 1fr 1fr;
          }

          .dc-header-cell:nth-child(4),
          .dc-header-cell:nth-child(5),
          .dc-cell:nth-child(4),
          .dc-cell:nth-child(5) {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .dc-fleet-size {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DepotComparison;
