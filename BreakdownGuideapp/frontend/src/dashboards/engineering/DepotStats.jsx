import React, { useState } from 'react';
import { theme } from '@styles/theme';

const DepotStats = ({ engineers, metrics }) => {
  const [hoveredDepot, setHoveredDepot] = useState(null);
  
  const depots = ['WASHINGTON', 'RIVERSIDE', 'PERCY_MAIN', 'CONSETT', 'DEPTFORD', 'HEXHAM'];
  
  // Format depot name
  const formatDepotName = (depot) => {
    const names = {
      'WASHINGTON': 'Washington',
      'RIVERSIDE': 'Riverside',
      'PERCY_MAIN': 'Percy Main',
      'CONSETT': 'Consett',
      'DEPTFORD': 'Deptford',
      'HEXHAM': 'Hexham'
    };
    return names[depot] || depot;
  };

  // Get status class based on SLA performance
  const getStatusClass = (slaPercentage) => {
    if (slaPercentage < 80) return 'critical';
    if (slaPercentage < 90) return 'warning';
    return '';
  };

  return (
    <div className="depot-stats">
      {depots.map(depot => {
        const depotMetrics = metrics[depot] || {};
        const depotEngineers = depotMetrics.engineers || { total: 0, available: 0, busy: 0 };
        const avgResponse = depotMetrics.avg_response_time_minutes || 0;
        const slaPercentage = depotMetrics.sla_percentage || 100;
        
        // Get depot engineers list
        const depotEngineersList = engineers.filter(e => e.depot_id === depot);
        
        return (
          <div 
            key={depot}
            className={`depot-stat ${getStatusClass(slaPercentage)}`}
            onMouseEnter={() => setHoveredDepot(depot)}
            onMouseLeave={() => setHoveredDepot(null)}
          >
            <div className="depot-name">{formatDepotName(depot)}</div>
            <div className="depot-metrics">
              <div className="metric">
                <span className="metric-label">Avg Response</span>
                <span className="metric-value">{avgResponse} mins</span>
              </div>
              <div className="metric">
                <span className="metric-label">SLA</span>
                <span className="metric-value">{Math.round(slaPercentage)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Engineers</span>
                <span className="metric-value">
                  {depotEngineers.busy}/{depotEngineers.total}
                </span>
              </div>
            </div>
            
            {hoveredDepot === depot && (
              <div className="engineer-list">
                {depotEngineersList.length > 0 ? (
                  depotEngineersList.map(eng => (
                    <div key={eng.engineer_id} className="engineer-item">
                      <span>{eng.name} ({eng.badge_number})</span>
                      <span className={eng.status === 'available' ? 'engineer-available' : 'engineer-busy'}>
                        {eng.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="no-engineers">No engineers assigned</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        .depot-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .depot-stat {
          background: var(--bg-secondary);
          padding: 15px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          position: relative;
          cursor: pointer;
          transition: all var(--transition-normal);
          border-left: 4px solid var(--color-info);
        }
        
        .depot-stat:hover {
          transform: translateY(-2px);
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
        }
        
        .depot-stat.warning {
          border-left-color: var(--color-warning);
          background: rgba(255, 193, 7, 0.1);
        }
        
        .depot-stat.critical {
          border-left-color: var(--color-danger);
          background: rgba(220, 53, 69, 0.1);
        }
        
        .depot-name {
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .depot-metrics {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }
        
        .metric-label {
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
        }
        
        .metric-value {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 14px;
        }
        
        .depot-stat.warning .metric-value {
          color: var(--color-warning);
        }
        
        .depot-stat.critical .metric-value {
          color: var(--color-danger);
        }
        
        .engineer-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          margin-top: 5px;
          padding: 10px;
          z-index: 100;
          box-shadow: var(--shadow-lg);
          max-height: 200px;
          overflow-y: auto;
        }
        
        .engineer-item {
          display: flex;
          justify-content: space-between;
          padding: 5px;
          font-size: 12px;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
        }
        
        .engineer-item:last-child {
          border-bottom: none;
        }
        
        .engineer-available {
          color: var(--color-success);
          font-weight: 600;
        }
        
        .engineer-busy {
          color: var(--color-danger);
          font-weight: 600;
        }
        
        .no-engineers {
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          padding: 10px;
        }
        
        /* Custom scrollbar for engineer list */
        .engineer-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .engineer-list::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }
        
        .engineer-list::-webkit-scrollbar-thumb {
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }
        
        @media (max-width: 768px) {
          .depot-stats {
            grid-template-columns: 1fr;
          }
          
          .engineer-list {
            position: static;
            margin-top: 10px;
            box-shadow: none;
            border-top: 2px solid var(--border);
            padding-top: 10px;
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DepotStats;
