import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../shared/AppHeader.jsx';
import { theme } from '@styles/theme';


const DashboardLayout = ({ children, title, icon, breakdownCount, criticalCount, connectionStatus, onRefresh }) => {
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  
  return (
    <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <AppHeader />
      
      {/* Page Header with Title - Dark Theme */}
      <div 
        className="dashboard-header"
        style={{
          backgroundColor: theme.colors.bgSecondary,
          color: theme.colors.textPrimary,
          padding: '24px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          // Remove any gradient backgrounds
          backgroundImage: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: theme.colors.textPrimary,
          }}>
            {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
            {title}
          </h1>
          
          {/* Breakdown Counter for SDC Dashboard */}
          {breakdownCount !== undefined && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 16px',
              background: `linear-gradient(135deg, ${theme.colors.bgSecondary}, ${theme.colors.bgPrimary})`,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: theme.colors.textPrimary
              }}>
                <span style={{ fontSize: '16px' }}>📋</span>
                <span>{breakdownCount} Active</span>
              </div>
              
              {criticalCount > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: theme.colors.danger,
                  padding: '4px 8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.danger}`,
                }}>
                  <span style={{ fontSize: '16px' }}>🚨</span>
                  <span>{criticalCount} Critical</span>
                </div>
              )}
              
              {/* Connection Status Indicator */}
              {connectionStatus && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '12px',
                  color: connectionStatus === 'connected' ? theme.colors.success : theme.colors.warning
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: connectionStatus === 'connected' ? theme.colors.success : theme.colors.warning,
                    animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none'
                  }} />
                  <span>{connectionStatus === 'connected' ? 'Live' : 'Reconnecting'}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Dashboard Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                transition: theme.transitions.fast,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bgSecondary;
                e.currentTarget.style.color = theme.colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              <span style={{ fontSize: '16px' }}>🔄</span>
              <span>Refresh</span>
            </button>
          )}
          
          <button
            onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textSecondary,
              cursor: 'pointer',
              transition: theme.transitions.fast,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bgSecondary;
              e.currentTarget.style.color = theme.colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme.colors.textSecondary;
            }}
          >
            <span style={{ fontSize: '16px' }}>☰</span>
            <span>Actions</span>
          </button>
        </div>

      </div>

      {/* Main Content - Dark Theme */}
      <div 
        className="dashboard-content"
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          minHeight: 'calc(100vh - 160px)',
          paddingBottom: '80px', // Space for mobile nav
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
          <span>SDC</span>
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
              📞 Contact SDC
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
            padding-bottom: 80px;
          }
          
          /* Hide breakdown counter on mobile */
          .dashboard-header > div:first-child > div:last-child {
            display: none !important;
          }
          
          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          
          .dashboard-header > div:last-child {
            width: 100% !important;
            justify-content: flex-end !important;
          }
        }
        
        /* Animations */
        .floating-quick-panel {
          transition: right 0.3s ease;
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
        
        /* Enhanced Quick Panel */
        .floating-quick-panel {
          backdrop-filter: blur(10px);
        }
        
        /* Breakdown counter animations */
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Apply animation to breakdown counter */
        .dashboard-header > div:first-child > div:last-child {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
