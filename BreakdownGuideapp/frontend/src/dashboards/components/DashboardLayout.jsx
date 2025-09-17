import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

// Dashboard configuration matching the HTML version
const dashboardConfig = {
  sdc: {
    path: '/dashboards/sdc',
    roles: ['SDC', 'Supervisor', 'Manager', 'Director', 'Admin'],
    name: 'SDC Operations Centre',
    icon: '📡',
    description: 'Real-time dispatch & monitoring'
  },
  breakdown: {
    path: '/dashboards/breakdown',
    roles: ['Supervisor', 'Manager', 'SDC', 'Director', 'Admin'],
    name: 'Breakdown Tracker',
    icon: '⏱️',
    description: 'Timed response tracking'
  },
  engineering: {
    path: '/dashboards/engineering',
    roles: ['Engineer', 'Engineering Manager', 'Director', 'Admin'],
    name: 'Engineering Response Live',
    icon: '⚙️',
    description: 'Technical diagnostics'
  },
  management: {
    path: '/dashboards/management',
    roles: ['Manager', 'Director', 'Executive', 'Admin'],
    name: 'Management Overview',
    icon: '📊',
    description: 'KPIs & analytics'
  }
};

const DashboardLayout = ({ children, title, activeTab }) => {
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [stats, setStats] = useState({ active: 0, today: 0 });
  const location = useLocation();

  // Update navigation statistics
  useEffect(() => {
    const updateStats = async () => {
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/breakdowns/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats({ 
            active: data.active || 0, 
            today: data.today || 0 
          });
        }
      } catch (error) {
        console.log('Navigation stats unavailable:', error);
        setConnectionStatus('offline');
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case '1': window.location.href = '/breakdown-guide'; break;
          case '2': window.location.href = '/dashboards/sdc'; break;
          case '3': window.location.href = '/dashboards/breakdown'; break;
          case '4': window.location.href = '/dashboards/engineering'; break;
          case '5': window.location.href = '/dashboards/management'; break;
          case 'h': window.location.href = '/'; break;
          case 'q': setIsQuickPanelOpen(!isQuickPanelOpen); break;
        }
      }
      if (e.key === 'Escape' && isQuickPanelOpen) {
        setIsQuickPanelOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isQuickPanelOpen]);

  // Determine active dashboard from location
  const currentDashboard = Object.keys(dashboardConfig).find(key => 
    location.pathname.includes(dashboardConfig[key].path)
  );

  return (
    <>
      {/* Main Navigation Bar */}
      <div className="shared-nav-container">
        <div className="shared-nav-header">
          <Link to="/" className="nav-logo">
            <span className="go">Go</span>
            <span className="north-east">NorthEast</span>
            <span className="nav-system-badge">Breakdown Intelligence</span>
          </Link>
          
          <div className="nav-dashboard-switcher">
            {Object.entries(dashboardConfig).map(([key, config]) => (
              <Link 
                key={key}
                to={config.path}
                className={`nav-btn ${currentDashboard === key ? 'active' : ''}`}
              >
                {config.icon} {config.name.split(' ')[0]}
              </Link>
            ))}
          </div>
          
          <div className="nav-quick-actions">
            <Link to="/breakdown-guide" className="nav-action-btn emergency">
              🚨 Report
            </Link>
            <Link to="/" className="nav-action-btn">
              🏠 Home
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Quick Panel */}
      <div className={`floating-quick-panel ${isQuickPanelOpen ? 'active' : ''}`}>
        <button 
          className="panel-toggle-btn" 
          onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
        >
          <span>☰</span>
        </button>
        
        <div className="quick-panel-content">
          <h4>Quick Navigation</h4>
          
          <div className="quick-panel-section">
            <Link to="/breakdown-guide" className="quick-btn emergency">
              🚨 Report Breakdown
            </Link>
            <Link to="/breakdown-guide" className="quick-btn primary">
              📖 Breakdown Guide
            </Link>
          </div>
          
          <div className="quick-panel-links">
            {Object.entries(dashboardConfig).map(([key, config]) => (
              <Link
                key={key}
                to={config.path}
                className={`quick-link ${currentDashboard === key ? 'active' : ''}`}
              >
                <span>{config.icon} {config.name}</span>
                {key === 'sdc' && <span className="live-badge">LIVE</span>}
              </Link>
            ))}
          </div>
          
          <div className="quick-panel-info">
            <div className="info-item">
              <span className="info-label">Active:</span>
              <span className="info-value">{stats.active}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Today:</span>
              <span className="info-value">{stats.today}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header with Title and Connection Status */}
      <div className="dashboard-header">
        <h1>{title}</h1>
        <div className={`connection-status ${connectionStatus}`}>
          <span className={`status-dot ${connectionStatus}`}></span>
          <span>{connectionStatus === 'online' ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/breakdown-guide" className="mobile-nav-item">
          <span className="mobile-icon">🔧</span>
          <span className="mobile-label">Guide</span>
        </Link>
        <Link to="/dashboards/sdc" className="mobile-nav-item">
          <span className="mobile-icon">📡</span>
          <span className="mobile-label">SDC</span>
        </Link>
        <Link to="/breakdown-guide" className="mobile-nav-item mobile-emergency">
          <span className="mobile-icon-large">🚨</span>
        </Link>
        <Link to="/dashboards/breakdown" className="mobile-nav-item">
          <span className="mobile-icon">⏱️</span>
          <span className="mobile-label">Tracker</span>
        </Link>
        <button 
          className="mobile-nav-item" 
          onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
        >
          <span className="mobile-icon">☰</span>
          <span className="mobile-label">More</span>
        </button>
      </div>

      <style jsx>{`
        /* Dashboard Layout Styles */
        .shared-nav-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          padding: 10px 20px;
        }
        
        .shared-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .nav-logo {
          display: flex;
          align-items: baseline;
          gap: 10px;
          cursor: pointer;
          font-size: 20px;
          font-weight: bold;
          text-decoration: none;
        }
        
        .nav-logo .go {
          color: #003B5C;
        }
        
        .nav-logo .north-east {
          color: #E4003B;
        }
        
        .nav-system-badge {
          font-size: 12px;
          color: #6b7280;
          font-weight: normal;
          padding-left: 10px;
          border-left: 2px solid #e5e7eb;
          margin-left: 5px;
        }
        
        .nav-dashboard-switcher {
          display: flex;
          gap: 8px;
        }
        
        .nav-btn {
          padding: 8px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #4b5563;
          transition: all 0.2s;
          white-space: nowrap;
          text-decoration: none;
        }
        
        .nav-btn:hover {
          background: #003B5C;
          color: white;
          transform: translateY(-1px);
        }
        
        .nav-btn.active {
          background: #003B5C;
          color: white;
          border-color: #003B5C;
        }
        
        .nav-quick-actions {
          display: flex;
          gap: 10px;
        }
        
        .nav-action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        
        .nav-action-btn.emergency {
          background: #ef4444;
          color: white;
        }
        
        .nav-action-btn:not(.emergency) {
          background: #f3f4f6;
          color: #1f2937;
        }
        
        .nav-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .dashboard-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
          color: white;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          margin-top: 70px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .connection-status {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connection-status.online {
          background: rgba(16, 185, 129, 0.2);
          color: white;
        }

        .connection-status.offline {
          background: rgba(239, 68, 68, 0.2);
          color: white;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.online {
          background: #10b981;
        }

        .status-dot.offline {
          background: #ef4444;
        }
        
        .floating-quick-panel {
          position: fixed;
          right: -300px;
          top: 80px;
          width: 280px;
          background: white;
          border-radius: 12px 0 0 12px;
          box-shadow: -4px 0 20px rgba(0,0,0,0.15);
          transition: right 0.3s ease;
          z-index: 999;
        }
        
        .floating-quick-panel.active {
          right: 0;
        }
        
        .panel-toggle-btn {
          position: absolute;
          left: -40px;
          top: 20px;
          width: 40px;
          height: 40px;
          background: #003B5C;
          color: white;
          border: none;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        
        .quick-panel-content {
          padding: 20px;
        }
        
        .quick-panel-content h4 {
          font-size: 14px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .quick-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          transition: all 0.2s;
          text-decoration: none;
          display: block;
          text-align: center;
        }
        
        .quick-btn.emergency {
          background: #ef4444;
          color: white;
        }
        
        .quick-btn.primary {
          background: #003B5C;
          color: white;
        }
        
        .quick-btn:hover {
          transform: translateX(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .quick-panel-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .quick-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          background: #f9fafb;
          border-radius: 6px;
          text-decoration: none;
          color: #1f2937;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .quick-link:hover {
          background: #00A9CE;
          color: white;
        }
        
        .quick-link.active {
          background: #003B5C;
          color: white;
        }
        
        .live-badge {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .quick-panel-info {
          display: flex;
          justify-content: space-around;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        
        .info-item {
          text-align: center;
        }
        
        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          display: block;
        }
        
        .info-value {
          font-size: 20px;
          font-weight: bold;
          color: #003B5C;
        }

        .dashboard-content {
          background: #f3f4f6;
          min-height: calc(100vh - 150px);
        }
        
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          padding: 8px 0;
          z-index: 999;
          justify-content: space-around;
          align-items: center;
        }
        
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          text-decoration: none;
          color: #6b7280;
          font-size: 11px;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mobile-nav-item:hover {
          color: #003B5C;
        }
        
        .mobile-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }
        
        .mobile-emergency {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          margin: -20px 0 0;
        }
        
        .mobile-icon-large {
          font-size: 24px;
        }
        
        @media (max-width: 768px) {
          .shared-nav-container {
            padding: 10px;
          }
          
          .shared-nav-header {
            flex-direction: column;
            gap: 10px;
          }
          
          .nav-dashboard-switcher {
            display: none;
          }
          
          .nav-quick-actions {
            display: none;
          }
          
          .mobile-bottom-nav {
            display: flex;
          }
          
          .dashboard-content {
            padding-bottom: 80px;
          }
        }
      `}</style>
    </>
  );
};

export default DashboardLayout;
