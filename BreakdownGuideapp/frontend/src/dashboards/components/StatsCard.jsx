import React from 'react';

const StatsCard = ({ 
  value, 
  label, 
  change = null, 
  trend = 'neutral', 
  icon = null,
  colorScheme = 'blue'
}) => {
  // Color schemes
  const colorSchemes = {
    blue: 'border-blue-500',
    red: 'border-red-500',
    green: 'border-green-500',
    amber: 'border-amber-500',
    gray: 'border-gray-500'
  };

  const getTrendClass = () => {
    if (trend === 'positive') return 'stat-change positive';
    if (trend === 'negative') return 'stat-change negative';
    return 'stat-change';
  };

  return (
    <div className={`stat-card ${colorSchemes[colorScheme]}`}>
      <div className="stat-content">
        {icon && <div className="stat-icon">{icon}</div>}
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      {change !== null && (
        <div className={getTrendClass()}>
          {trend === 'positive' ? '+' : ''}{change}
        </div>
      )}

      <style jsx>{`
        .stat-card {
          background: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          border-left: 4px solid;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #1e3a8a);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
          opacity: 0.8;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #1e3a8a;
        }

        .stat-label {
          color: #6b7280;
          font-size: 14px;
          margin-top: 5px;
        }

        .stat-change {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #e5e7eb;
          color: #6b7280;
        }

        .stat-change.positive {
          background: #dcfce7;
          color: #16a34a;
        }

        .stat-change.negative {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default StatsCard;
