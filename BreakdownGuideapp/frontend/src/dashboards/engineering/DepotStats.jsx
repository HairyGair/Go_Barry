import React, { useState } from 'react';

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
    <div className="engineering-panel">
      <h2>⚙️ Engineering Team Performance (Real-Time)</h2>
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
                <span>
                  Avg: <span className="metric-value">{avgResponse} mins</span>
                </span>
                <span>
                  SLA: <span className="metric-value">{Math.round(slaPercentage)}%</span>
                </span>
                <span>
                  Active: <span className="metric-value">
                    {depotEngineers.busy}/{depotEngineers.total}
                  </span>
                </span>
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
      </div>

      <style>{`
        .engineering-panel {
          background: white;
          margin-bottom: 20px;
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
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .depot-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
          font-size: 14px;
        }
        
        .depot-metrics {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #4b5563;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .metric-value {
          font-weight: bold;
          color: #1e3a8a;
        }
        
        .engineer-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-top: 5px;
          padding: 10px;
          z-index: 100;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-height: 200px;
          overflow-y: auto;
        }
        
        .engineer-item {
          display: flex;
          justify-content: space-between;
          padding: 5px;
          font-size: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .engineer-item:last-child {
          border-bottom: none;
        }
        
        .engineer-available {
          color: #10b981;
          font-weight: 600;
        }
        
        .engineer-busy {
          color: #ef4444;
          font-weight: 600;
        }
        
        .no-engineers {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          padding: 10px;
        }
        
        @media (max-width: 768px) {
          .depot-stats {
            grid-template-columns: 1fr;
          }
          
          .engineer-list {
            position: static;
            margin-top: 10px;
            box-shadow: none;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DepotStats;
