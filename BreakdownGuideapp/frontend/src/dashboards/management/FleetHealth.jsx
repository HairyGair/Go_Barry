import React from 'react';

const FleetHealth = ({ fleetHealth }) => {
  if (!fleetHealth) return null;

  const operationalPercentage = ((fleetHealth.operational / fleetHealth.totalVehicles) * 100).toFixed(1);

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const getTrendClass = (trend) => {
    switch(trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  };

  return (
    <div className="fleet-health">
      <h3>Fleet Health Status</h3>
      
      {/* Overall Status */}
      <div className="overall-status">
        <div className="status-circle">
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45 * operationalPercentage / 100} ${2 * Math.PI * 45}`}
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fontWeight="bold"
              fill="#1e3a8a"
            >
              {operationalPercentage}%
            </text>
          </svg>
        </div>
        <div className="status-details">
          <div className="status-item operational">
            <span className="label">Operational</span>
            <span className="value">{fleetHealth.operational}</span>
          </div>
          <div className="status-item maintenance">
            <span className="label">Maintenance</span>
            <span className="value">{fleetHealth.inMaintenance}</span>
          </div>
          <div className="status-item breakdown">
            <span className="label">Breakdown</span>
            <span className="value">{fleetHealth.breakdown}</span>
          </div>
        </div>
      </div>

      {/* Fleet Categories */}
      <div className="fleet-categories">
        <h4>By Category</h4>
        {fleetHealth.categories.map((category, index) => (
          <div key={index} className="category-item">
            <div className="category-info">
              <span className="category-type">{category.type}</span>
              <span className="category-stats">
                {category.operational} / {category.total}
              </span>
            </div>
            <div className="category-bar">
              <div 
                className="category-bar-fill"
                style={{ width: `${category.percentage}%` }}
              ></div>
            </div>
            <span className="category-percentage">{category.percentage}%</span>
          </div>
        ))}
      </div>

      {/* Top Issues */}
      <div className="top-issues">
        <h4>Top Breakdown Causes</h4>
        <div className="issues-list">
          {fleetHealth.topIssues.map((issue, index) => (
            <div key={index} className="issue-item">
              <span className="issue-rank">{index + 1}</span>
              <span className="issue-name">{issue.issue}</span>
              <span className="issue-count">{issue.count}</span>
              <span className={`issue-trend ${getTrendClass(issue.trend)}`}>
                {getTrendIcon(issue.trend)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .fleet-health {
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

        .overall-status {
          display: flex;
          gap: 30px;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .status-circle {
          width: 120px;
          height: 120px;
        }

        .status-circle svg {
          width: 100%;
          height: 100%;
        }

        .status-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .status-item.operational {
          background: #dcfce7;
        }

        .status-item.maintenance {
          background: #fef3c7;
        }

        .status-item.breakdown {
          background: #fee2e2;
        }

        .status-item .label {
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        .status-item .value {
          font-size: 18px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .fleet-categories {
          margin-bottom: 30px;
        }

        h4 {
          font-size: 16px;
          color: #374151;
          margin-bottom: 15px;
          font-weight: 600;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
        }

        .category-info {
          flex: 0 0 140px;
          display: flex;
          flex-direction: column;
        }

        .category-type {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .category-stats {
          font-size: 12px;
          color: #6b7280;
        }

        .category-bar {
          flex: 1;
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .category-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1e3a8a);
          transition: width 0.5s ease;
        }

        .category-percentage {
          flex: 0 0 45px;
          text-align: right;
          font-size: 14px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .top-issues {
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .issue-item {
          display: grid;
          grid-template-columns: 30px 1fr auto 30px;
          gap: 10px;
          align-items: center;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .issue-item:hover {
          background: #f3f4f6;
        }

        .issue-rank {
          width: 24px;
          height: 24px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
        }

        .issue-name {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .issue-count {
          font-size: 16px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .issue-trend {
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .trend-up {
          color: #ef4444;
        }

        .trend-down {
          color: #10b981;
        }

        .trend-stable {
          color: #f59e0b;
        }

        @media (max-width: 480px) {
          .overall-status {
            flex-direction: column;
            text-align: center;
          }

          .status-details {
            width: 100%;
          }

          .category-info {
            flex: 0 0 100px;
          }

          .category-type {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default FleetHealth;
