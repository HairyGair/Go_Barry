import React from 'react';

const StatusWidget = ({ breakdowns }) => {
  // Calculate statistics
  const stats = {
    awaitingDecision: breakdowns.filter(b => b.currentStage === 'acknowledged').length,
    engineeringRequested: breakdowns.filter(b => b.assigned_engineer_id).length,
    over30: breakdowns.filter(b => b.elapsed > 30).length,
    priorityAffected: breakdowns.filter(b => b.isPriority).length
  };
  
  // Calculate percentages for visual indicators
  const total = breakdowns.length || 1;
  const percentages = {
    awaitingDecision: (stats.awaitingDecision / total) * 100,
    engineeringRequested: (stats.engineeringRequested / total) * 100,
    over30: (stats.over30 / total) * 100,
    priorityAffected: (stats.priorityAffected / total) * 100
  };
  
  const items = [
    {
      name: 'Awaiting Decision',
      value: stats.awaitingDecision,
      percentage: percentages.awaitingDecision,
      icon: '⏳',
      color: '#f59e0b'
    },
    {
      name: 'Engineering Requested',
      value: stats.engineeringRequested,
      percentage: percentages.engineeringRequested,
      icon: '🔧',
      color: '#3b82f6'
    },
    {
      name: 'Over 30 mins',
      value: stats.over30,
      percentage: percentages.over30,
      icon: '⚠️',
      color: stats.over30 > 0 ? '#dc2626' : '#10b981',
      critical: stats.over30 > 0
    },
    {
      name: 'Priority Routes Affected',
      value: stats.priorityAffected,
      percentage: percentages.priorityAffected,
      icon: '🚨',
      color: stats.priorityAffected > 0 ? '#dc2626' : '#10b981',
      critical: stats.priorityAffected > 0
    }
  ];

  return (
    <div className="stats-widget">
      <div className="widget-header">
        <h3>📊 Current Status</h3>
        <span className="total-badge">{breakdowns.length} Active</span>
      </div>
      
      <div className="stats-container">
        {items.map((item, index) => (
          <div key={index} className={`stat-item ${item.critical ? 'critical' : ''}`}>
            <div className="stat-header">
              <div className="stat-icon">{item.icon}</div>
              <div className="stat-info">
                <span className="stat-name">{item.name}</span>
                <span className="stat-value">{item.value}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .stats-widget {
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%),
            radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.02) 0%, transparent 50%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 
            0 10px 40px rgba(0,0,0,0.06),
            0 2px 10px rgba(0,0,0,0.04),
            inset 0 2px 0 rgba(255,255,255,0.7);
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .widget-header h3 {
          font-size: 18px;
          color: #0f172a;
          margin: 0;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }

        .total-badge {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow: 
            0 4px 12px rgba(59,130,246,0.25),
            inset 0 1px 0 rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .stats-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stat-item {
          background: 
            linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%),
            radial-gradient(circle at 0% 50%, rgba(59, 130, 246, 0.02) 0%, transparent 50%);
          border: 1px solid rgba(226,232,240,0.3);
          border-radius: 16px;
          padding: 18px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .stat-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.6s;
        }
        
        .stat-item:hover::before {
          left: 100%;
        }

        .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(0,0,0,0.08),
            0 2px 8px rgba(0,0,0,0.04);
          border-color: rgba(209,213,219,0.5);
        }

        .stat-item.critical {
          background: linear-gradient(135deg, rgba(254,242,242,0.9) 0%, rgba(254,226,226,0.9) 100%);
          border-color: rgba(220,38,38,0.3);
          animation: criticalGlow 3s infinite;
        }

        @keyframes criticalGlow {
          0%, 100% { box-shadow: 0 2px 8px rgba(220,38,38,0.1); }
          50% { box-shadow: 0 4px 16px rgba(220,38,38,0.2); }
        }

        .stat-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 
            0 2px 8px rgba(0,0,0,0.04),
            inset 0 1px 0 rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.5);
        }

        .stat-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-name {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .progress-bar {
          height: 10px;
          background: 
            linear-gradient(135deg, rgba(229,231,235,0.5) 0%, rgba(226,232,240,0.5) 100%);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }

        .progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @media (max-width: 640px) {
          .stats-widget {
            padding: 15px;
          }

          .stat-name {
            font-size: 12px;
          }

          .stat-value {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default StatusWidget;
