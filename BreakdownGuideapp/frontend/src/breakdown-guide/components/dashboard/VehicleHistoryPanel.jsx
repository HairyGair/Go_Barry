import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Calendar, Search } from 'lucide-react';

const VehicleHistoryPanel = ({ breakdowns, activeBreakdowns }) => {
  const [vehicleStats, setVehicleStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('breakdowns'); // 'breakdowns' or 'fleet'
  const [timeframe, setTimeframe] = useState(30); // days

  // Calculate vehicle breakdown statistics
  useEffect(() => {
    const calculateVehicleStats = () => {
      // Get breakdowns within timeframe
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframe);
      
      const recentBreakdowns = breakdowns.filter(b => 
        new Date(b.created_at) >= cutoffDate
      );

      // Group by vehicle
      const vehicleMap = {};
      
      recentBreakdowns.forEach(breakdown => {
        const fleetNo = breakdown.fleet_no;
        if (!vehicleMap[fleetNo]) {
          vehicleMap[fleetNo] = {
            fleet_no: fleetNo,
            total_breakdowns: 0,
            breakdown_types: {},
            last_breakdown: null,
            severity_counts: { STOP: 0, AMBER: 0, CONTINUE: 0 },
            is_active: false
          };
        }
        
        vehicleMap[fleetNo].total_breakdowns++;
        
        // Track breakdown types
        const type = breakdown.assessment_type || 'Unknown';
        vehicleMap[fleetNo].breakdown_types[type] = 
          (vehicleMap[fleetNo].breakdown_types[type] || 0) + 1;
        
        // Track severity
        if (breakdown.severity) {
          vehicleMap[fleetNo].severity_counts[breakdown.severity]++;
        }
        
        // Track last breakdown
        if (!vehicleMap[fleetNo].last_breakdown || 
            new Date(breakdown.created_at) > new Date(vehicleMap[fleetNo].last_breakdown)) {
          vehicleMap[fleetNo].last_breakdown = breakdown.created_at;
        }
      });

      // Mark active vehicles
      activeBreakdowns.forEach(breakdown => {
        if (vehicleMap[breakdown.fleet_no]) {
          vehicleMap[breakdown.fleet_no].is_active = true;
        }
      });

      // Convert to array and calculate risk scores
      const stats = Object.values(vehicleMap).map(vehicle => {
        // Calculate risk score based on frequency and severity
        let riskScore = vehicle.total_breakdowns * 10;
        riskScore += vehicle.severity_counts.STOP * 20;
        riskScore += vehicle.severity_counts.AMBER * 10;
        
        // Increase risk if multiple breakdowns in short time
        if (vehicle.total_breakdowns >= 3) {
          riskScore += 30;
        }
        
        return {
          ...vehicle,
          risk_score: riskScore,
          risk_level: 
            riskScore >= 50 ? 'high' :
            riskScore >= 30 ? 'medium' : 'low'
        };
      });

      // Sort by total breakdowns (highest first)
      stats.sort((a, b) => b.total_breakdowns - a.total_breakdowns);
      
      setVehicleStats(stats);
    };

    calculateVehicleStats();
  }, [breakdowns, activeBreakdowns, timeframe]);

  // Filter vehicles based on search
  const filteredVehicles = vehicleStats.filter(vehicle =>
    vehicle.fleet_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortBy === 'breakdowns') {
      return b.total_breakdowns - a.total_breakdowns;
    } else {
      return a.fleet_no.localeCompare(b.fleet_no);
    }
  });

  // Get top breakdown types for a vehicle
  const getTopBreakdownTypes = (breakdownTypes) => {
    return Object.entries(breakdownTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const days = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="vehicle-history-panel">
      {/* Controls */}
      <div className="panel-controls">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by fleet number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="timeframe-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="breakdowns">Sort by Breakdowns</option>
            <option value="fleet">Sort by Fleet No</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="history-summary">
        <div className="summary-stat">
          <span className="stat-value">{vehicleStats.length}</span>
          <span className="stat-label">Vehicles with issues</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">
            {vehicleStats.filter(v => v.risk_level === 'high').length}
          </span>
          <span className="stat-label">High risk vehicles</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">
            {vehicleStats.filter(v => v.total_breakdowns >= 3).length}
          </span>
          <span className="stat-label">3+ breakdowns</span>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="vehicle-list">
        {sortedVehicles.map(vehicle => (
          <div 
            key={vehicle.fleet_no}
            className={`vehicle-card ${vehicle.risk_level} ${vehicle.is_active ? 'active' : ''}`}
          >
            <div className="vehicle-header">
              <div className="vehicle-info">
                <h4 className="fleet-number">
                  Fleet {vehicle.fleet_no}
                  {vehicle.is_active && (
                    <span className="active-badge">ACTIVE</span>
                  )}
                </h4>
                <p className="last-breakdown">
                  Last breakdown: {formatDate(vehicle.last_breakdown)}
                </p>
              </div>
              <div className="breakdown-count">
                <span className="count-value">{vehicle.total_breakdowns}</span>
                <span className="count-label">breakdowns</span>
              </div>
            </div>
            
            <div className="vehicle-details">
              <div className="breakdown-types">
                <strong>Types:</strong> {getTopBreakdownTypes(vehicle.breakdown_types)}
              </div>
              
              <div className="severity-breakdown">
                {vehicle.severity_counts.STOP > 0 && (
                  <span className="severity-item stop">
                    STOP: {vehicle.severity_counts.STOP}
                  </span>
                )}
                {vehicle.severity_counts.AMBER > 0 && (
                  <span className="severity-item amber">
                    AMBER: {vehicle.severity_counts.AMBER}
                  </span>
                )}
                {vehicle.severity_counts.CONTINUE > 0 && (
                  <span className="severity-item continue">
                    CONTINUE: {vehicle.severity_counts.CONTINUE}
                  </span>
                )}
              </div>
              
              <div className={`risk-indicator ${vehicle.risk_level}`}>
                <AlertTriangle className="risk-icon" />
                <span>Risk Level: {vehicle.risk_level.toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
        
        {sortedVehicles.length === 0 && (
          <div className="no-results">
            <p>No vehicles found with breakdowns in the selected timeframe</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .vehicle-history-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .panel-controls {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #666;
        }

        .search-input {
          width: 100%;
          padding: 8px 8px 8px 35px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .filter-controls {
          display: flex;
          gap: 10px;
        }

        .timeframe-select, .sort-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .history-summary {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .summary-stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }

        .vehicle-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .vehicle-card {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #ddd;
          transition: all 0.3s ease;
        }

        .vehicle-card.high {
          border-left-color: #dc3545;
          background: #fde8ea;
        }

        .vehicle-card.medium {
          border-left-color: #ffc107;
          background: #fff8e1;
        }

        .vehicle-card.low {
          border-left-color: #28a745;
          background: #e8f5e9;
        }

        .vehicle-card.active {
          box-shadow: 0 0 0 2px #007bff;
        }

        .vehicle-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 10px;
        }

        .fleet-number {
          margin: 0;
          font-size: 18px;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .active-badge {
          padding: 2px 8px;
          background: #dc3545;
          color: white;
          font-size: 11px;
          font-weight: normal;
          border-radius: 4px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .last-breakdown {
          margin: 5px 0 0;
          font-size: 13px;
          color: #666;
        }

        .breakdown-count {
          text-align: center;
        }

        .count-value {
          display: block;
          font-size: 28px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .count-label {
          display: block;
          font-size: 12px;
          color: #666;
        }

        .vehicle-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }

        .breakdown-types {
          color: #666;
        }

        .severity-breakdown {
          display: flex;
          gap: 10px;
        }

        .severity-item {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .severity-item.stop {
          background: #dc3545;
          color: white;
        }

        .severity-item.amber {
          background: #ffc107;
          color: #1a1a1a;
        }

        .severity-item.continue {
          background: #28a745;
          color: white;
        }

        .risk-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 5px;
        }

        .risk-indicator.high {
          color: #dc3545;
        }

        .risk-indicator.medium {
          color: #ffc107;
        }

        .risk-indicator.low {
          color: #28a745;
        }

        .risk-icon {
          width: 16px;
          height: 16px;
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default VehicleHistoryPanel;