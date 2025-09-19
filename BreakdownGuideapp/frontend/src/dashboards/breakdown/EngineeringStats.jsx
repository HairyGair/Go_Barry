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


    </div>
  );
};

export default EngineeringStats;
