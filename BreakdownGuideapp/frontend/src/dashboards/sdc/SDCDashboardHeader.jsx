import React, { useState, useEffect } from 'react';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

const SDCDashboardHeader = ({ 
  stats, 
  connectionManager, 
  onReportBreakdown,
  onRefresh 
}) => {
  const [currentSupervisor, setCurrentSupervisor] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current supervisor from auth
  useEffect(() => {
    const getSupervisor = () => {
      try {
        // Try multiple sources for supervisor data
        const sources = [
          localStorage.getItem('currentSupervisor'),
          localStorage.getItem('supervisorData'),
          sessionStorage.getItem('currentSupervisor'),
          localStorage.getItem('supervisor')
        ];

        for (const source of sources) {
          if (source) {
            try {
              const supervisor = JSON.parse(source);
              if (supervisor.badge || supervisor.supervisorBadge || supervisor.name) {
                setCurrentSupervisor({
                  name: supervisor.name || supervisor.supervisorName || 'Unknown Supervisor',
                  badge: supervisor.badge || supervisor.supervisorBadge || supervisor.id || 'N/A',
                  depot: supervisor.depot || supervisor.depotName || 'Unknown Depot'
                });
                return;
              }
            } catch (e) {
              // Continue to next source
            }
          }
        }

        // If no supervisor found, try to get from any auth token data
        const authSources = [
          localStorage.getItem('auth_user'),
          sessionStorage.getItem('auth_user')
        ];

        for (const source of authSources) {
          if (source) {
            try {
              const user = JSON.parse(source);
              if (user.email || user.user_metadata) {
                setCurrentSupervisor({
                  name: user.user_metadata?.name || user.email?.split('@')[0] || 'Supervisor',
                  badge: user.user_metadata?.badge || 'N/A',
                  depot: user.user_metadata?.depot || 'SDC'
                });
                return;
              }
            } catch (e) {
              // Continue
            }
          }
        }

      } catch (error) {
        console.error('Error getting supervisor data:', error);
      }
    };

    getSupervisor();
  }, []);

  const getOutstandingCount = () => {
    return stats.total - stats.dispatched || 0;
  };

  const getConnectionStatusIcon = () => {
    if (!connectionManager?.isConnected) return { icon: '🔴', text: 'Disconnected' };
    if (connectionManager.currentMode === 'websocket') return { icon: '🟢', text: 'Real-time' };
    if (connectionManager.currentMode === 'polling') return { icon: '🟡', text: 'Polling' };
    return { icon: '⚫', text: 'Unknown' };
  };

  const handleReportBreakdown = () => {
    if (onReportBreakdown) {
      onReportBreakdown();
    } else {
      // Default behavior - redirect to breakdown guide
      window.open('/breakdown-guide', '_blank');
    }
  };

  const connectionStatus = getConnectionStatusIcon();

  return (
    <div className="sdc-dashboard-header">
      <div className="header-main">
        <div className="header-left">
          <div className="dashboard-title">
            <h1>🎯 SDC Operations Centre</h1>
            <div className="dashboard-subtitle">
              Real-time breakdown management and coordination
            </div>
          </div>
        </div>

        <div className="header-center">
          {/* Outstanding Breakdown Counter */}
          <div className="outstanding-counter">
            <div className="counter-icon">📋</div>
            <div className="counter-content">
              <div className="counter-number">{getOutstandingCount()}</div>
              <div className="counter-label">Outstanding</div>
            </div>
          </div>

          {/* Critical Alert Badge */}
          {stats.critical > 0 && (
            <div className="critical-alert">
              <div className="alert-icon">🚨</div>
              <div className="alert-content">
                <div className="alert-number">{stats.critical}</div>
                <div className="alert-label">Critical</div>
              </div>
            </div>
          )}
        </div>

        <div className="header-right">
          <div className="header-actions">
            {/* Report Breakdown Button */}
            <button 
              className="action-btn report-breakdown"
              onClick={handleReportBreakdown}
              title="Report a new breakdown"
            >
              <span className="btn-icon">📱</span>
              <span className="btn-text">Report Breakdown</span>
            </button>

            {/* Refresh Button */}
            <button 
              className="action-btn refresh"
              onClick={onRefresh}
              title="Refresh dashboard data"
            >
              <span className="btn-icon">🔄</span>
              <span className="btn-text">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="header-status">
        <div className="status-left">
          {/* Supervisor Context */}
          {currentSupervisor && (
            <div className="supervisor-context">
              <div className="supervisor-avatar">
                {currentSupervisor.name.charAt(0).toUpperCase()}
              </div>
              <div className="supervisor-info">
                <div className="supervisor-name">{currentSupervisor.name}</div>
                <div className="supervisor-details">
                  Badge: {currentSupervisor.badge} • {currentSupervisor.depot}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="status-center">
          {/* Connection Status */}
          <div className="connection-status">
            <span className="connection-icon">{connectionStatus.icon}</span>
            <span className="connection-text">{connectionStatus.text}</span>
          </div>
        </div>

        <div className="status-right">
          {/* Current Time */}
          <div className="current-time">
            <div className="time-display">
              {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="date-display">
              {currentTime.toLocaleDateString('en-GB', { 
                weekday: 'short',
                day: 'numeric', 
                month: 'short'
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sdc-dashboard-header {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 50%,
            rgba(51, 65, 85, 0.95) 100%
          );
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 24px;
          color: white;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 8px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .header-left {
          flex: 1;
        }

        .dashboard-title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .dashboard-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 4px;
          font-weight: 500;
        }

        .header-center {
          display: flex;
          gap: 16px;
          align-items: center;
          flex: 1;
          justify-content: center;
        }

        .outstanding-counter {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1));
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          backdrop-filter: blur(10px);
        }

        .counter-icon {
          font-size: 24px;
          opacity: 0.9;
        }

        .counter-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .counter-number {
          font-size: 20px;
          font-weight: 700;
          color: #60a5fa;
          line-height: 1;
        }

        .counter-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .critical-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2));
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 12px;
          padding: 12px 16px;
          backdrop-filter: blur(10px);
          animation: criticalPulse 2s infinite;
        }

        @keyframes criticalPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }

        .alert-icon {
          font-size: 24px;
          animation: shake 1s infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .alert-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .alert-number {
          font-size: 20px;
          font-weight: 700;
          color: #f87171;
          line-height: 1;
        }

        .alert-label {
          font-size: 11px;
          color: #fca5a5;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .header-right {
          flex: 1;
          display: flex;
          justify-content: flex-end;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn.report-breakdown {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .action-btn.report-breakdown:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .action-btn.refresh {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1));
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .action-btn.refresh:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-icon {
          font-size: 16px;
        }

        .btn-text {
          font-size: 12px;
          white-space: nowrap;
        }

        .header-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .supervisor-context {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .supervisor-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .supervisor-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .supervisor-name {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .supervisor-details {
          font-size: 11px;
          color: #94a3b8;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .connection-icon {
          font-size: 12px;
        }

        .connection-text {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
        }

        .current-time {
          text-align: right;
        }

        .time-display {
          font-size: 16px;
          font-weight: 700;
          color: #e2e8f0;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .date-display {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        @media (max-width: 1024px) {
          .header-main {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .header-center {
            justify-content: center;
          }

          .header-right {
            justify-content: center;
          }

          .header-status {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }

          .supervisor-context {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .dashboard-title h1 {
            font-size: 24px;
          }

          .header-center {
            flex-direction: column;
            gap: 12px;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .action-btn {
            justify-content: center;
          }

          .btn-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCDashboardHeader;