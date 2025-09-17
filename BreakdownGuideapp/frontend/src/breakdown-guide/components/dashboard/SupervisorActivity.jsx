import React, { useMemo } from 'react';
import { Users, Award, Clock, Activity } from 'lucide-react';

const SupervisorActivity = ({ supervisorStats, activeBreakdowns, todaysAssessments }) => {
  // Calculate supervisor metrics
  const supervisorMetrics = useMemo(() => {
    // Supervisor names mapping
    const supervisorNames = {
      'AW001': 'Alan Wilson',
      'AC002': 'Andrew Coates',
      'AG003': 'Anthony Gair',
      'CF004': 'Chris Forster',
      'DH005': 'David Hunter',
      'JD006': 'John Dobson',
      'JP007': 'John Patterson',
      'SG008': 'Steven Graham',
      'BP009': 'Brian Pears'
    };

    // Get current shift based on time
    const getCurrentShift = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 14) return 'Morning';
      if (hour >= 14 && hour < 22) return 'Afternoon';
      return 'Night';
    };

    // Count activities by supervisor
    const supervisorActivityMap = {};
    
    // Process today's assessments
    todaysAssessments.forEach(assessment => {
      const badge = assessment.supervisor_badge;
      if (!badge) return;
      
      if (!supervisorActivityMap[badge]) {
        supervisorActivityMap[badge] = {
          badge,
          name: supervisorNames[badge] || badge,
          assessments_completed: 0,
          active_breakdowns: 0,
          decisions: { STOP: 0, AMBER: 0, CONTINUE: 0 },
          avg_response_time: [],
          last_activity: null,
          shift_start: null
        };
      }
      
      supervisorActivityMap[badge].assessments_completed++;
      
      if (assessment.severity) {
        supervisorActivityMap[badge].decisions[assessment.severity]++;
      }
      
      // Calculate response time
      if (assessment.diagnosed_at && assessment.created_at) {
        const responseTime = (new Date(assessment.diagnosed_at) - new Date(assessment.created_at)) / (1000 * 60);
        supervisorActivityMap[badge].avg_response_time.push(responseTime);
      }
      
      // Track last activity
      const activityTime = new Date(assessment.updated_at || assessment.created_at);
      if (!supervisorActivityMap[badge].last_activity || activityTime > supervisorActivityMap[badge].last_activity) {
        supervisorActivityMap[badge].last_activity = activityTime;
      }
      
      // Estimate shift start (first activity today)
      const createdTime = new Date(assessment.created_at);
      if (!supervisorActivityMap[badge].shift_start || createdTime < supervisorActivityMap[badge].shift_start) {
        supervisorActivityMap[badge].shift_start = createdTime;
      }
    });
    
    // Process active breakdowns
    activeBreakdowns.forEach(breakdown => {
      const badge = breakdown.supervisor_badge;
      if (!badge || !supervisorActivityMap[badge]) return;
      
      supervisorActivityMap[badge].active_breakdowns++;
    });
    
    // Calculate averages and format data
    const supervisorList = Object.values(supervisorActivityMap).map(supervisor => {
      const avgResponseTime = supervisor.avg_response_time.length > 0
        ? supervisor.avg_response_time.reduce((a, b) => a + b, 0) / supervisor.avg_response_time.length
        : 0;
      
      const hoursOnShift = supervisor.shift_start
        ? (new Date() - supervisor.shift_start) / (1000 * 60 * 60)
        : 0;
      
      return {
        ...supervisor,
        avg_response_time: Math.round(avgResponseTime),
        hours_on_shift: Math.round(hoursOnShift * 10) / 10,
        is_active: supervisor.last_activity && (new Date() - supervisor.last_activity) < 30 * 60 * 1000 // Active in last 30 mins
      };
    });
    
    // Sort by activity (active first, then by assessments completed)
    supervisorList.sort((a, b) => {
      if (a.is_active !== b.is_active) return b.is_active - a.is_active;
      return b.assessments_completed - a.assessments_completed;
    });
    
    return {
      currentShift: getCurrentShift(),
      activeSupervisors: supervisorList.filter(s => s.is_active).length,
      totalSupervisors: supervisorList.length,
      supervisors: supervisorList
    };
  }, [activeBreakdowns, todaysAssessments]);

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const minutes = Math.floor((new Date() - date) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="supervisor-activity">
      {/* Shift Summary */}
      <div className="shift-summary">
        <div className="shift-info">
          <h3>{supervisorMetrics.currentShift} Shift</h3>
          <p>{supervisorMetrics.activeSupervisors} of {supervisorMetrics.totalSupervisors} supervisors active</p>
        </div>
        <div className="shift-stats">
          <div className="stat">
            <Users className="stat-icon" />
            <span>{supervisorMetrics.totalSupervisors}</span>
          </div>
          <div className="stat active">
            <Activity className="stat-icon" />
            <span>{supervisorMetrics.activeSupervisors}</span>
          </div>
        </div>
      </div>

      {/* Supervisor List */}
      <div className="supervisor-list">
        {supervisorMetrics.supervisors.map(supervisor => (
          <div 
            key={supervisor.badge} 
            className={`supervisor-card ${supervisor.is_active ? 'active' : 'inactive'}`}
          >
            <div className="supervisor-header">
              <div className="supervisor-info">
                <h4>{supervisor.name}</h4>
                <p className="badge-number">{supervisor.badge}</p>
              </div>
              <div className="activity-status">
                <span className={`status-dot ${supervisor.is_active ? 'active' : ''}`} />
                <span className="last-activity">
                  {formatTimeAgo(supervisor.last_activity)}
                </span>
              </div>
            </div>
            
            <div className="supervisor-metrics">
              <div className="metric-row">
                <div className="metric">
                  <Activity className="metric-icon" />
                  <span className="metric-value">{supervisor.assessments_completed}</span>
                  <span className="metric-label">Assessments</span>
                </div>
                
                <div className="metric">
                  <Clock className="metric-icon" />
                  <span className="metric-value">{supervisor.avg_response_time}m</span>
                  <span className="metric-label">Avg Response</span>
                </div>
                
                <div className="metric">
                  <Award className="metric-icon" />
                  <span className="metric-value">{supervisor.hours_on_shift}h</span>
                  <span className="metric-label">On Shift</span>
                </div>
              </div>
              
              <div className="decisions-row">
                {supervisor.decisions.STOP > 0 && (
                  <span className="decision stop">STOP: {supervisor.decisions.STOP}</span>
                )}
                {supervisor.decisions.AMBER > 0 && (
                  <span className="decision amber">AMBER: {supervisor.decisions.AMBER}</span>
                )}
                {supervisor.decisions.CONTINUE > 0 && (
                  <span className="decision continue">CONTINUE: {supervisor.decisions.CONTINUE}</span>
                )}
              </div>
              
              {supervisor.active_breakdowns > 0 && (
                <div className="active-breakdowns">
                  <span className="breakdown-alert">
                    {supervisor.active_breakdowns} active breakdown{supervisor.active_breakdowns > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {supervisorMetrics.supervisors.length === 0 && (
          <div className="no-activity">
            <p>No supervisor activity recorded today</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .supervisor-activity {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .shift-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .shift-info h3 {
          margin: 0;
          font-size: 18px;
          color: #1a1a1a;
        }

        .shift-info p {
          margin: 5px 0 0;
          color: #666;
          font-size: 14px;
        }

        .shift-stats {
          display: flex;
          gap: 20px;
        }

        .shift-stats .stat {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .stat-icon {
          width: 20px;
          height: 20px;
          color: #666;
        }

        .stat.active .stat-icon {
          color: #28a745;
        }

        .supervisor-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .supervisor-card {
          padding: 15px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .supervisor-card.active {
          border-color: #28a745;
          background: #f8fff9;
        }

        .supervisor-card.inactive {
          opacity: 0.7;
        }

        .supervisor-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .supervisor-info h4 {
          margin: 0;
          font-size: 16px;
          color: #1a1a1a;
        }

        .badge-number {
          margin: 2px 0 0;
          font-size: 12px;
          color: #666;
        }

        .activity-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ddd;
        }

        .status-dot.active {
          background: #28a745;
          box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
        }

        .last-activity {
          font-size: 12px;
          color: #666;
        }

        .supervisor-metrics {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .metric-row {
          display: flex;
          justify-content: space-around;
          padding: 10px 0;
          border-top: 1px solid #f0f0f0;
        }

        .metric {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .metric-icon {
          width: 16px;
          height: 16px;
          color: #666;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .metric-label {
          font-size: 11px;
          color: #666;
        }

        .decisions-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .decision {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .decision.stop {
          background: #fde8ea;
          color: #dc3545;
        }

        .decision.amber {
          background: #fff8e1;
          color: #ffc107;
        }

        .decision.continue {
          background: #e8f5e9;
          color: #28a745;
        }

        .active-breakdowns {
          margin-top: 5px;
        }

        .breakdown-alert {
          display: inline-block;
          padding: 4px 10px;
          background: #dc3545;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .no-activity {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default SupervisorActivity;