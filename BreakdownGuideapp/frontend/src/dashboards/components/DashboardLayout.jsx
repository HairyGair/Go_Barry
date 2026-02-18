import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '@styles/theme';


const DashboardLayout = ({ children, title, icon, breakdownCount, criticalCount, connectionStatus, onRefresh }) => {
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  
  return (
    <div className="dark-theme" style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>

      {/* Main Content - Dark Theme */}
      <div
        className="dashboard-content"
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          minHeight: '100vh',
          paddingTop: '90px', // Space for fixed header
          paddingBottom: '80px', // Space for mobile nav
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        {children}
      </div>

      {/* Mobile Bottom Navigation - Dark Theme */}
      <div 
        className="mobile-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.bgSecondary,
          borderTop: `1px solid ${theme.colors.border}`,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
          padding: '8px 0',
          zIndex: theme.zIndex.dropdown,
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <Link 
          to="/breakdown-guide" 
          className="mobile-nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            textDecoration: 'none',
            color: theme.colors.textSecondary,
            fontSize: '11px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>🔧</span>
          <span>Guide</span>
        </Link>
        
        <Link 
          to="/dashboards/sdc" 
          className="mobile-nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            textDecoration: 'none',
            color: theme.colors.textSecondary,
            fontSize: '11px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>📡</span>
          <span>Ops</span>
        </Link>
        
        <Link 
          to="/breakdown-guide" 
          className="mobile-emergency"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.danger,
            color: 'white',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            margin: '-20px 0 0',
            textDecoration: 'none',
            boxShadow: theme.shadows.lg,
          }}
        >
          <span style={{ fontSize: '24px' }}>🚨</span>
        </Link>
        
        <Link 
          to="/dashboards/breakdown" 
          className="mobile-nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            textDecoration: 'none',
            color: theme.colors.textSecondary,
            fontSize: '11px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>⏱️</span>
          <span>Tracker</span>
        </Link>
        
        <button 
          className="mobile-nav-item"
          onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            textDecoration: 'none',
            color: theme.colors.textSecondary,
            fontSize: '11px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>☰</span>
          <span>More</span>
        </button>
      </div>

      {/* Quick Panel - Dark Theme */}
      <div 
        className={`floating-quick-panel ${isQuickPanelOpen ? 'active' : ''}`}
        style={{
          position: 'fixed',
          right: isQuickPanelOpen ? 0 : '-300px',
          top: '80px',
          width: '280px',
          backgroundColor: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: `${theme.radius.lg} 0 0 ${theme.radius.lg}`,
          boxShadow: theme.shadows.xl,
          transition: 'right 0.3s ease',
          zIndex: theme.zIndex.dropdown,
        }}
      >
        <button 
          className="panel-toggle-btn"
          onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
          style={{
            position: 'absolute',
            left: '-40px',
            top: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: `${theme.radius.md} 0 0 ${theme.radius.md}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          {isQuickPanelOpen ? '→' : '☰'}
        </button>
        
        <div style={{ padding: '20px' }}>
          <h4 style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            color: theme.colors.textSecondary,
            marginBottom: '15px',
            fontWeight: '600',
          }}>
            Quick Actions
          </h4>
          
          {/* Quick actions content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="theme-btn theme-btn-danger"
              style={{ width: '100%' }}
              onClick={() => window.location.href = '/breakdown-guide'}
            >
              🚨 Emergency Breakdown
            </button>
            <button 
              className="theme-btn theme-btn-primary"
              style={{ width: '100%' }}
            >
              📞 Contact Ops
            </button>
            <button 
              className="theme-btn theme-btn-secondary"
              style={{ width: '100%' }}
            >
              📊 View Reports
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Mobile responsive */
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
          
          .dashboard-content {
            padding: 12px !important;
            padding-bottom: 80px !important;
          }
        }
        
        /* Animations */
        .floating-quick-panel {
          transition: right 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .floating-quick-panel.active {
          right: 0 !important;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
