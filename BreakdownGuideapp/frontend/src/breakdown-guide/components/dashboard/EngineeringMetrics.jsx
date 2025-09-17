import React, { useState, useEffect } from 'react';
import { Clock, Wrench, TrendingUp, AlertCircle } from 'lucide-react';

const EngineeringMetrics = ({ metrics, breakdowns }) => {
  const [responseMetrics, setResponseMetrics] = useState({
    avgResponseTime: 0,
    avgRepairTime: 0,
    changeoversCompleted: 0,
    repeatDefects: []
  });

  // Calculate engineering response metrics
  useEffect(() => {
    const calculateMetrics = () => {
      // Average response time (from breakdown reported to acknowledged)
      const acknowledgedBreakdowns = breakdowns.filter(b => b.diagnosed_at);
      const responseTimes = acknowledgedBreakdowns.map(b => {
        const start = new Date(b.created_at);
        const ack = new Date(b.diagnosed_at);
        return (ack - start) / (1000 * 60); // minutes
      });
      
      const avgResponse = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Average repair time (from diagnosed to resolved)
      const resolvedBreakdowns = breakdowns.filter(b => b.resolved_at && b.diagnosed_at);
      const repairTimes = resolvedBreakdowns.map(b => {
        const diagnosed = new Date(b.diagnosed_at);
        const resolved = new Date(b.resolved_at);
        return (resolved - diagnosed) / (1000 * 60); // minutes
      });
      
      const avgRepair = repairTimes.length > 0
        ? repairTimes.reduce((a, b) => a + b, 0) / repairTimes.length
        : 0;

      // Changeover completions
      const changeovers = breakdowns.filter(b => 
        b.severity === 'AMBER' || 
        (b.resolution && b.resolution.includes('changeover'))
      ).length;

      // Identify repeat defects
      const vehicleDefects = {};
      breakdowns.forEach(b => {
        if (!b.fleet_no) return;
        if (!vehicleDefects[b.fleet_no]) {
          vehicleDefects[b.fleet_no] = [];
        }
        vehicleDefects[b.fleet_no].push({
          type: b.assessment_type,
          date: b.created_at
        });
      });

      const repeatDefects = [];
      Object.entries(vehicleDefects).forEach(([fleet, defects]) => {
        // Group by defect type
        const typeGroups = {};
        defects.forEach(d => {
          if (!typeGroups[d.type]) {
            typeGroups[d.type] = [];
          }
          typeGroups[d.type].push(d.date);
        });

        // Find repeated defect types
        Object.entries(typeGroups).forEach(([type, dates]) => {
          if (dates.length >= 2) {
            repeatDefects.push({
              fleet_no: fleet,
              defect_type: type,
              occurrences: dates.length,
              last_occurrence: new Date(Math.max(...dates.map(d => new Date(d)))).toLocaleDateString()
            });
          }
        });
      });

      setResponseMetrics({
        avgResponseTime: Math.round(avgResponse),
        avgRepairTime: Math.round(avgRepair),
        changeoversCompleted: changeovers,
        repeatDefects: repeatDefects.sort((a, b) => b.occurrences - a.occurrences)
      });
    };

    calculateMetrics();
  }, [breakdowns]);

  // Format time display
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="engineering-metrics">
      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Clock />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatTime(responseMetrics.avgResponseTime)}</div>
            <div className="metric-label">Avg Response Time</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Wrench />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatTime(responseMetrics.avgRepairTime)}</div>
            <div className="metric-label">Avg Repair Time</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp />
          </div>
          <div className="metric-content">
            <div className="metric-value">{responseMetrics.changeoversCompleted}</div>
            <div className="metric-label">Changeovers Today</div>
          </div>
        </div>
      </div>

      {/* Fleet Health Metrics */}
      {metrics && metrics.vehicle_status && (
        <div className="fleet-health">
          <h3>Fleet Health Overview</h3>
          <div className="health-stats">
            <div className="health-stat">
              <span className="stat-label">Operational</span>
              <span className="stat-value operational">{metrics.vehicle_status.operational}</span>
            </div>
            <div className="health-stat">
              <span className="stat-label">In Maintenance</span>
              <span className="stat-value maintenance">{metrics.vehicle_status.in_maintenance}</span>
            </div>
            <div className="health-stat">
              <span className="stat-label">Breakdown</span>
              <span className="stat-value breakdown">{metrics.vehicle_status.breakdown}</span>
            </div>
            <div className="health-stat">
              <span className="stat-label">Availability</span>
              <span className="stat-value">{metrics.overall_health_score}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Defects Alert */}
      {responseMetrics.repeatDefects.length > 0 && (
        <div className="repeat-defects">
          <h3>
            <AlertCircle className="alert-icon" />
            Repeat Defects Alert
          </h3>
          <div className="defects-list">
            {responseMetrics.repeatDefects.slice(0, 5).map((defect, index) => (
              <div key={index} className="defect-item">
                <div className="defect-info">
                  <span className="fleet-no">Fleet {defect.fleet_no}</span>
                  <span className="defect-type">{defect.defect_type}</span>
                </div>
                <div className="defect-stats">
                  <span className="occurrences">{defect.occurrences} times</span>
                  <span className="last-date">Last: {defect.last_occurrence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Indicators */}
      <div className="performance-indicators">
        <h3>Performance Targets</h3>
        <div className="indicator-list">
          <div className="indicator">
            <span className="indicator-label">Response Time Target</span>
            <div className="indicator-bar">
              <div 
                className="indicator-fill"
                style={{
                  width: `${Math.min(100, (15 / responseMetrics.avgResponseTime) * 100)}%`,
                  backgroundColor: responseMetrics.avgResponseTime <= 15 ? '#28a745' : '#dc3545'
                }}
              />
            </div>
            <span className="indicator-value">
              {responseMetrics.avgResponseTime <= 15 ? '✓ Met' : '✗ Missed'}
            </span>
          </div>

          <div className="indicator">
            <span className="indicator-label">Repair Time Target</span>
            <div className="indicator-bar">
              <div 
                className="indicator-fill"
                style={{
                  width: `${Math.min(100, (60 / responseMetrics.avgRepairTime) * 100)}%`,
                  backgroundColor: responseMetrics.avgRepairTime <= 60 ? '#28a745' : '#dc3545'
                }}
              />
            </div>
            <span className="indicator-value">
              {responseMetrics.avgRepairTime <= 60 ? '✓ Met' : '✗ Missed'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .engineering-metrics {
          height: 100%;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .metric-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          color: #007bff;
        }

        .metric-icon svg {
          width: 20px;
          height: 20px;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .metric-label {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .fleet-health {
          margin-bottom: 20px;
        }

        .fleet-health h3 {
          margin: 0 0 15px;
          font-size: 16px;
          color: #1a1a1a;
        }

        .health-stats {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .health-stat {
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: 600;
        }

        .stat-value.operational {
          color: #28a745;
        }

        .stat-value.maintenance {
          color: #ffc107;
        }

        .stat-value.breakdown {
          color: #dc3545;
        }

        .repeat-defects {
          margin-bottom: 20px;
        }

        .repeat-defects h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 15px;
          font-size: 16px;
          color: #dc3545;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
        }

        .defects-list {
          background: #fde8ea;
          border-radius: 8px;
          padding: 15px;
        }

        .defect-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(220, 53, 69, 0.2);
        }

        .defect-item:last-child {
          border-bottom: none;
        }

        .defect-info {
          display: flex;
          gap: 10px;
        }

        .fleet-no {
          font-weight: 600;
          color: #1a1a1a;
        }

        .defect-type {
          color: #666;
        }

        .defect-stats {
          display: flex;
          gap: 15px;
          font-size: 13px;
          color: #666;
        }

        .occurrences {
          font-weight: 600;
          color: #dc3545;
        }

        .performance-indicators h3 {
          margin: 0 0 15px;
          font-size: 16px;
          color: #1a1a1a;
        }

        .indicator {
          margin-bottom: 15px;
        }

        .indicator-label {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }

        .indicator-bar {
          height: 20px;
          background: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .indicator-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .indicator-value {
          font-size: 13px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .health-stats {
            flex-wrap: wrap;
            gap: 10px;
          }

          .health-stat {
            flex: 1 1 40%;
          }
        }
      `}</style>
    </div>
  );
};

export default EngineeringMetrics;