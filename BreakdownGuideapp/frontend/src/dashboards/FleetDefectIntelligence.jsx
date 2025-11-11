import React from 'react';
import DashboardLayout from './components/DashboardLayout';
import TrendsDefectsPanel from './sdc/TrendsDefectsPanel';

/**
 * Fleet Defect Intelligence Dashboard
 *
 * Standalone dashboard for comprehensive fleet defect analysis and predictive maintenance.
 *
 * Features:
 * - Real-time defect tracking across entire fleet
 * - Repeat vehicle defects with automatic escalation
 * - Trending defect patterns by type and depot
 * - Depot-specific issue hotspots
 * - Predictive maintenance alerts
 * - Pattern detection for common issues
 * - WebSocket real-time updates with polling fallback
 *
 * Data Sources:
 * - /api/defects/repeat - Repeat vehicle defects
 * - /api/defects/trends - Fleet-wide defect trends
 * - /api/defects/depot-stats - Depot-specific statistics
 * - /api/defects/predictive - Predictive maintenance alerts
 *
 * Real-time Updates:
 * - Primary: WebSocket connection (/ws?channel=defect-intelligence)
 * - Fallback: HTTP polling (30-second intervals)
 * - Auto-refresh: 30 seconds
 */
const FleetDefectIntelligence = () => {
  return (
    <DashboardLayout
      title="Fleet Defect Intelligence Dashboard"
      icon="🔍"
    >
      {/* Header Section */}
      <div style={styles.headerSection}>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>Fleet Defect Intelligence</h1>
          <p style={styles.pageDescription}>
            Real-time monitoring of vehicle defects, repair trends, and predictive maintenance alerts across your entire fleet
          </p>
        </div>
      </div>

      {/* Main Content - TrendsDefectsPanel */}
      <div style={styles.mainContent}>
        <TrendsDefectsPanel />
      </div>

      {/* Footer Information */}
      <div style={styles.footerInfo}>
        <div style={styles.footerItem}>
          <span style={styles.footerIcon}>🔄</span>
          <span style={styles.footerText}>Auto-refresh every 30 seconds</span>
        </div>
        <div style={styles.footerItem}>
          <span style={styles.footerIcon}>📡</span>
          <span style={styles.footerText}>Real-time WebSocket updates with polling fallback</span>
        </div>
        <div style={styles.footerItem}>
          <span style={styles.footerIcon}>🎯</span>
          <span style={styles.footerText}>Pattern detection and predictive maintenance</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Styles
const styles = {
  headerSection: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '16px',
    padding: '24px 32px',
    marginBottom: '24px',
    backdropFilter: 'blur(10px)'
  },
  headerContent: {
    maxWidth: '100%'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
    background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  pageDescription: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.6'
  },
  mainContent: {
    marginBottom: '24px'
  },
  footerInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(248, 250, 252, 0.8)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginTop: '24px'
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    color: '#475569'
  },
  footerIcon: {
    fontSize: '16px'
  },
  footerText: {
    fontWeight: '500'
  }
};

export default FleetDefectIntelligence;
