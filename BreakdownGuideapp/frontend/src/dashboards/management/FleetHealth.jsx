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
      case 'up': return 'fh-trend-up';
      case 'down': return 'fh-trend-down';
      default: return 'fh-trend-stable';
    }
  };

  return (
    <div className="fh-fleet-health">
      <h3>Fleet Health Status</h3>

      <div className="fh-overall-status">
        <div className="fh-status-circle">
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1E293B"
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
              fill="#FFFFFF"
            >
              {operationalPercentage}%
            </text>
          </svg>
        </div>
        <div className="fh-status-details">
          <div className="fh-status-item fh-operational">
            <span className="fh-label">Operational</span>
            <span className="fh-value">{fleetHealth.operational}</span>
          </div>
          <div className="fh-status-item fh-maintenance">
            <span className="fh-label">Maintenance</span>
            <span className="fh-value">{fleetHealth.inMaintenance}</span>
          </div>
          <div className="fh-status-item fh-breakdown">
            <span className="fh-label">Breakdown</span>
            <span className="fh-value">{fleetHealth.breakdown}</span>
          </div>
        </div>
      </div>

      <div className="fh-fleet-categories">
        <h4>By Category</h4>
        {fleetHealth.categories.map((category, index) => (
          <div key={index} className="fh-category-item">
            <div className="fh-category-info">
              <span className="fh-category-type">{category.type}</span>
              <span className="fh-category-stats">
                {category.operational} / {category.total}
              </span>
            </div>
            <div className="fh-category-bar">
              <div
                className="fh-category-bar-fill"
                style={{ width: `${category.percentage}%` }}
              ></div>
            </div>
            <span className="fh-category-percentage">{category.percentage}%</span>
          </div>
        ))}
      </div>

      <div className="fh-top-issues">
        <h4>Top Breakdown Causes</h4>
        <div className="fh-issues-list">
          {fleetHealth.topIssues.map((issue, index) => (
            <div key={index} className="fh-issue-item">
              <span className="fh-issue-rank">{index + 1}</span>
              <span className="fh-issue-name">{issue.issue}</span>
              <span className="fh-issue-count">{issue.count}</span>
              <span className={`fh-issue-trend ${getTrendClass(issue.trend)}`}>
                {getTrendIcon(issue.trend)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .fh-fleet-health {
          background: #141D2B;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        h3 {
          color: #0097A7;
          font-size: 20px;
          margin-bottom: 20px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
        }

        .fh-overall-status {
          display: flex;
          gap: 30px;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #1E293B;
        }

        .fh-status-circle {
          width: 120px;
          height: 120px;
        }

        .fh-status-circle svg {
          width: 100%;
          height: 100%;
        }

        .fh-status-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .fh-status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .fh-status-item.fh-operational {
          background: rgba(16, 185, 129, 0.15);
        }

        .fh-status-item.fh-maintenance {
          background: rgba(245, 158, 11, 0.15);
        }

        .fh-status-item.fh-breakdown {
          background: rgba(220, 38, 38, 0.15);
        }

        .fh-status-item .fh-label {
          font-size: 14px;
          color: #94A3B8;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
        }

        .fh-status-item .fh-value {
          font-size: 18px;
          font-weight: 600;
          color: #0097A7;
          font-family: 'JetBrains Mono', monospace;
        }

        .fh-fleet-categories {
          margin-bottom: 30px;
        }

        h4 {
          font-size: 16px;
          color: #FFFFFF;
          margin-bottom: 15px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
        }

        .fh-category-item {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
        }

        .fh-category-info {
          flex: 0 0 140px;
          display: flex;
          flex-direction: column;
        }

        .fh-category-type {
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
        }

        .fh-category-stats {
          font-size: 12px;
          color: #94A3B8;
          font-family: 'JetBrains Mono', monospace;
        }

        .fh-category-bar {
          flex: 1;
          height: 8px;
          background: #1E293B;
          border-radius: 4px;
          overflow: hidden;
        }

        .fh-category-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #0097A7, #00838F);
          transition: width 0.5s ease;
        }

        .fh-category-percentage {
          flex: 0 0 45px;
          text-align: right;
          font-size: 14px;
          font-weight: 600;
          color: #0097A7;
          font-family: 'JetBrains Mono', monospace;
        }

        .fh-top-issues {
          padding-top: 20px;
          border-top: 1px solid #1E293B;
        }

        .fh-issues-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fh-issue-item {
          display: grid;
          grid-template-columns: 30px 1fr auto 30px;
          gap: 10px;
          align-items: center;
          padding: 8px;
          background: #0F1624;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .fh-issue-item:hover {
          background: #1E293B;
        }

        .fh-issue-rank {
          width: 24px;
          height: 24px;
          background: #1E293B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #94A3B8;
          font-family: 'JetBrains Mono', monospace;
        }

        .fh-issue-name {
          font-size: 14px;
          color: #FFFFFF;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
        }

        .fh-issue-count {
          font-size: 16px;
          font-weight: 600;
          color: #0097A7;
          font-family: 'JetBrains Mono', monospace;
        }

        .fh-issue-trend {
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .fh-trend-up {
          color: #ef4444;
        }

        .fh-trend-down {
          color: #10b981;
        }

        .fh-trend-stable {
          color: #f59e0b;
        }

        @media (max-width: 480px) {
          .fh-overall-status {
            flex-direction: column;
            text-align: center;
          }

          .fh-status-details {
            width: 100%;
          }

          .fh-category-info {
            flex: 0 0 100px;
          }

          .fh-category-type {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default FleetHealth;
