import React from 'react';

const DepotComparison = ({ depotData }) => {
  if (!depotData || depotData.length === 0) return null;

  // Sort depots by SLA compliance
  const sortedDepots = [...depotData].sort((a, b) => b.slaCompliance - a.slaCompliance);

  const getPerformanceClass = (performance) => {
    switch(performance) {
      case 'good': return 'performance-good';
      case 'warning': return 'performance-warning';
      case 'critical': return 'performance-critical';
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
        return '#6b7280';
    }
  };

  return (
    <div className="depot-comparison">
      <h3>Depot Performance Comparison</h3>
      
      <div className="depot-table">
        <div className="table-header">
          <div className="header-cell depot-name">Depot</div>
          <div className="header-cell">Breakdowns</div>
          <div className="header-cell">Avg Response</div>
          <div className="header-cell">SLA %</div>
          <div className="header-cell">Efficiency</div>
        </div>

        {sortedDepots.map((depot, index) => (
          <div key={depot.depot} className={`depot-row ${getPerformanceClass(depot.performance)}`}>
            <div className="cell depot-name">
              <span className="rank">#{index + 1}</span>
              <span className="name">{depot.depot}</span>
              <span className="fleet-size">({depot.fleetSize} vehicles)</span>
            </div>
            
            <div className="cell metric">
              <span className="value">{depot.breakdowns}</span>
              <div className="mini-bar">
                <div 
                  className="mini-bar-fill"
                  style={{ 
                    width: `${(depot.breakdowns / 25) * 100}%`,
                    backgroundColor: depot.breakdowns > 15 ? '#ef4444' : '#3b82f6'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="cell metric">
              <span 
                className="value" 
                style={{ color: getMetricColor('avgResponse', depot.avgResponse) }}
              >
                {depot.avgResponse}m
              </span>
              <div className="mini-bar">
                <div 
                  className="mini-bar-fill"
                  style={{ 
                    width: `${(depot.avgResponse / 45) * 100}%`,
                    backgroundColor: getMetricColor('avgResponse', depot.avgResponse)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="cell metric">
              <span 
                className="value"
                style={{ color: getMetricColor('slaCompliance', depot.slaCompliance) }}
              >
                {depot.slaCompliance}%
              </span>
              <div className="mini-bar">
                <div 
                  className="mini-bar-fill"
                  style={{ 
                    width: `${depot.slaCompliance}%`,
                    backgroundColor: getMetricColor('slaCompliance', depot.slaCompliance)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="cell metric">
              <span 
                className="value"
                style={{ color: getMetricColor('engineerEfficiency', depot.engineerEfficiency) }}
              >
                {depot.engineerEfficiency}%
              </span>
              <div className="mini-bar">
                <div 
                  className="mini-bar-fill"
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

      <div className="depot-summary">
        <div className="summary-item">
          <span className="label">Best Performing:</span>
          <span className="value">{sortedDepots[0].depot}</span>
        </div>
        <div className="summary-item">
          <span className="label">Needs Attention:</span>
          <span className="value">{sortedDepots[sortedDepots.length - 1].depot}</span>
        </div>
      </div>

      <style jsx>{`
        .depot-comparison {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        h3 {
          color: #1e3a8a;
          font-size: 20px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .depot-table {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          background: #1e3a8a;
          color: white;
          font-weight: 600;
          font-size: 13px;
        }

        .header-cell {
          padding: 12px 15px;
          text-align: center;
        }

        .header-cell.depot-name {
          text-align: left;
        }

        .depot-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          background: white;
          transition: all 0.2s;
        }

        .depot-row:hover {
          background: #f9fafb;
        }

        .depot-row.performance-warning {
          border-left: 4px solid #f59e0b;
        }

        .depot-row.performance-critical {
          border-left: 4px solid #ef4444;
        }

        .depot-row.performance-good {
          border-left: 4px solid #10b981;
        }

        .cell {
          padding: 12px 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .cell.depot-name {
          flex-direction: row;
          gap: 8px;
          align-items: center;
          justify-content: flex-start;
        }

        .rank {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }

        .name {
          font-weight: 600;
          color: #1e3a8a;
        }

        .fleet-size {
          font-size: 12px;
          color: #9ca3af;
        }

        .metric {
          gap: 4px;
        }

        .value {
          font-weight: 600;
          font-size: 15px;
          z-index: 1;
        }

        .mini-bar {
          width: 100%;
          height: 3px;
          background: #f3f4f6;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 4px;
        }

        .mini-bar-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .depot-summary {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-item .label {
          font-size: 13px;
          color: #6b7280;
        }

        .summary-item .value {
          font-size: 16px;
          font-weight: 600;
          color: #1e3a8a;
        }

        @media (max-width: 768px) {
          .table-header,
          .depot-row {
            grid-template-columns: 2fr 1fr 1fr;
          }

          .header-cell:nth-child(4),
          .header-cell:nth-child(5),
          .cell:nth-child(4),
          .cell:nth-child(5) {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .fleet-size {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DepotComparison;
