import React from 'react';

const EngineeringStats = ({ depots }) => {
  // Determine status class based on SLA percentage
  const getStatusClass = (slaPercentage) => {
    if (slaPercentage < 80) return 'critical';
    if (slaPercentage < 90) return 'warning';
    return '';
  };

  return (
    <div className="engineering-panel">
      <h2>⚙️ Engineering Team Performance (Today)</h2>
      <div className="depot-stats">
        {depots.map((depot, index) => (
          <div key={index} className={`depot-stat ${getStatusClass(depot.sla)}`}>
            <div className="depot-name">{depot.name}</div>
            <div className="depot-metrics">
              <span>Avg Response: <span className="metric-value">{depot.avgResponse} mins</span></span>
              <span>SLA: <span className="metric-value">{depot.sla}%</span></span>
              <span>Active: <span className="metric-value">{depot.activeEngineers}/{depot.totalEngineers}</span></span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .engineering-panel {
          background: white;
          margin: 20px;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .engineering-panel h2 {
          color: #1e3a8a;
          margin-bottom: 15px;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .depot-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .depot-stat {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          transition: all 0.3s ease;
        }

        .depot-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .depot-stat.warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-left-color: #f59e0b;
        }

        .depot-stat.critical {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-left-color: #ef4444;
        }

        .depot-name {
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 8px;
          font-size: 16px;
        }

        .depot-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #4b5563;
        }

        .depot-metrics > span {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-value {
          font-weight: bold;
          color: #1e3a8a;
          font-size: 14px;
        }

        .depot-stat.critical .metric-value {
          color: #dc2626;
        }

        .depot-stat.warning .metric-value {
          color: #d97706;
        }

        @media (max-width: 768px) {
          .engineering-panel {
            margin: 10px;
          }

          .depot-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }

        /* Loading animation for data updates */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .depot-stat.loading {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            #f0f0f0 0px,
            #e0e0e0 20px,
            #f0f0f0 40px
          );
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
};

export default EngineeringStats;
