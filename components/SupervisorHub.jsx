// components/SupervisorHub.jsx
// Unified Supervisor Command Center - Phase 1 Implementation
// Consolidates all supervisor functions into single interface

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useConvexSync } from '../hooks/useConvexSync';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { useIntelligentForwarder } from '../services/IntelligentForwarder';

// Import existing components to integrate
import SupervisorControl from './SupervisorControl';
import ControlDashboard from './ControlDashboard';
import MessageDistributionCenter from './MessageDistributionCenter';
import MessageTemplateSelector from './MessageTemplateSelector';
import CreateRoadworkModal from './CreateRoadworkModal';
import SystemHealthMonitor from './SystemHealthMonitor';
import SupervisorAnalytics from './SupervisorAnalytics';
import AdvancedAnalytics from './AdvancedAnalytics';
import SupervisorHandover from './SupervisorHandover';
import SupervisorCoordination from './SupervisorCoordination';

const SupervisorHub = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRoadworkModal, setShowRoadworkModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const { activeAlerts, activeSupervisors, syncState } = useConvexSync();
  const { supervisor, isLoggedIn } = useSupervisorSession();
  const { sendMessage, getQueueStatus, getAnalytics } = useIntelligentForwarder();

  // Tab configuration with icons and labels
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'control', label: 'Control Panel', icon: '🎛️' },
    { id: 'communications', label: 'Communications', icon: '📢' },
    { id: 'coordination', label: 'Coordination', icon: '🤝' },
    { id: 'analytics', label: 'Advanced Analytics', icon: '📈' },
    { id: 'handover', label: 'Handover', icon: '🔄' },
  ];

  // Quick actions available in floating action button
  const quickActions = [
    { id: 'emergency', label: 'Emergency Broadcast', icon: '🚨', action: () => setShowTemplateSelector(true) },
    { id: 'coordination', label: 'Send Coordination', icon: '🤝', action: () => setActiveTab('coordination') },
    { id: 'analytics', label: 'Advanced Analytics', icon: '📈', action: () => setActiveTab('analytics') },
    { id: 'roadwork', label: 'Create Roadwork', icon: '🚧', action: () => setShowRoadworkModal(true) },
    { id: 'template', label: 'Send Message', icon: '📝', action: () => setShowTemplateSelector(true) },
    { id: 'handover', label: 'Create Handover', icon: '🔄', action: () => setActiveTab('handover') },
  ];

  // Handle sending message from template selector
  const handleSendMessage = async (messageData) => {
    try {
      console.log('Sending message via IntelligentForwarder:', messageData);
      
      // Use the intelligent forwarder to process and send the message
      const result = await sendMessage({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: messageData.content,
        priority: messageData.priority,
        messageType: messageData.templateId ? 'template' : 'custom',
        supervisorId: messageData.createdBy,
        supervisorName: messageData.supervisorName,
        templateId: messageData.templateId,
        templateVariables: messageData.templateVariables,
        expiresAt: Date.now() + (messageData.priority === 'P0' ? 2 * 60 * 60 * 1000 : 
                                messageData.priority === 'P1' ? 1 * 60 * 60 * 1000 :
                                messageData.priority === 'P2' ? 30 * 60 * 1000 : 15 * 60 * 1000),
        channels: messageData.channels || ['display'],
        timestamp: messageData.timestamp
      }, {
        source: 'supervisor'
      });
      
      if (result.success) {
        alert(`✅ Message sent successfully!\n\nPriority: ${messageData.priority}\nEstimated display: ${result.estimatedDisplay}\n\n${messageData.content}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`❌ Failed to send message: ${error.message}\n\nPlease try again.`);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginPrompt}>Please log in to access Supervisor Hub</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView activeAlerts={activeAlerts} activeSupervisors={activeSupervisors} />;
      case 'control':
        return <SupervisorControl />;
      case 'communications':
        return <CommunicationsView onOpenTemplates={() => setShowTemplateSelector(true)} />;
      case 'coordination':
        return <SupervisorCoordination />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'handover':
        return <SupervisorHandover />;
      default:
        return <DashboardView activeAlerts={activeAlerts} activeSupervisors={activeSupervisors} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with supervisor info and quick stats */}
      <View style={styles.header}>
        <View style={styles.supervisorInfo}>
          <Text style={styles.supervisorName}>{supervisor?.supervisorName}</Text>
          <Text style={styles.supervisorBadge}>{supervisor?.badge} • {supervisor?.duty?.name}</Text>
        </View>
        <View style={styles.quickStats}>
          <StatItem label="Active Alerts" value={activeAlerts?.length || 0} color="#ff6b6b" />
          <StatItem label="Online Supervisors" value={activeSupervisors?.length || 0} color="#4ecdc4" />
          <StatItem label="System Status" value={syncState ? "Online" : "Offline"} color={syncState ? "#51cf66" : "#ff6b6b"} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Floating Action Button for Quick Actions */}
      <QuickActionFAB actions={quickActions} />

      {/* Modals */}
      {showRoadworkModal && (
        <CreateRoadworkModal
          visible={showRoadworkModal}
          onClose={() => setShowRoadworkModal(false)}
          supervisor={supervisor}
        />
      )}
      
      {showTemplateSelector && (
        <MessageTemplateSelector
          visible={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSendMessage={handleSendMessage}
        />
      )}
    </View>
  );
};

// Dashboard view component
const DashboardView = ({ activeAlerts, activeSupervisors }) => {
  const criticalAlerts = activeAlerts?.filter(alert => 
    alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
  ) || [];

  return (
    <ScrollView style={styles.dashboardContent}>
      {/* Critical Alerts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Critical Alerts</Text>
        {criticalAlerts.length > 0 ? (
          criticalAlerts.slice(0, 3).map((alert, index) => (
            <AlertCard key={index} alert={alert} />
          ))
        ) : (
          <Text style={styles.noAlertsText}>No critical alerts at this time</Text>
        )}
      </View>

      {/* Active Supervisors Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Active Personnel</Text>
        <View style={styles.supervisorGrid}>
          {activeSupervisors?.map((sup, index) => (
            <SupervisorCard key={index} supervisor={sup} />
          )) || <Text style={styles.noDataText}>No active supervisors found</Text>}
        </View>
      </View>

      {/* System Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ System Overview</Text>
        <SystemHealthMonitor compact={true} />
      </View>
    </ScrollView>
  );
};

// Communications view component
const CommunicationsView = ({ onOpenTemplates }) => {
  return (
    <ScrollView style={styles.communicationsContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📢 Quick Communications</Text>
        
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={onOpenTemplates}
        >
          <Text style={styles.quickActionIcon}>📝</Text>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Message Templates</Text>
            <Text style={styles.quickActionDesc}>Send pre-formatted messages to displays</Text>
          </View>
          <Text style={styles.quickActionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionCard}>
          <Text style={styles.quickActionIcon}>📧</Text>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Email Distribution</Text>
            <Text style={styles.quickActionDesc}>Send updates to email groups</Text>
          </View>
          <Text style={styles.quickActionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionCard}>
          <Text style={styles.quickActionIcon}>📱</Text>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Multi-Channel Broadcast</Text>
            <Text style={styles.quickActionDesc}>Send to web, mobile, and displays</Text>
          </View>
          <Text style={styles.quickActionArrow}>›</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Communication Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Messages Today" value="23" color="#0984E3" />
          <StatCard title="Templates Used" value="8" color="#00B894" />
          <StatCard title="Email Alerts" value="12" color="#FDCB6E" />
          <StatCard title="Display Updates" value="45" color="#E17055" />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕒 Recent Messages</Text>
        <Text style={styles.comingSoon}>Recent message history coming soon...</Text>
      </View>
    </ScrollView>
  );
};

// Analytics view component
const AnalyticsView = ({ supervisor }) => {
  return (
    <ScrollView style={styles.analyticsContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
        <Text style={styles.comingSoon}>
          Performance analytics coming soon in Phase 3
        </Text>
        <View style={styles.metricsGrid}>
          <MetricCard title="Alerts Acknowledged Today" value="12" trend="+3" />
          <MetricCard title="Average Response Time" value="2.3 min" trend="-0.5" />
          <MetricCard title="Actions Taken" value="8" trend="+2" />
          <MetricCard title="Roadworks Created" value="3" trend="+1" />
        </View>
      </View>
    </ScrollView>
  );
};

// Quick Action Floating Action Button
const QuickActionFAB = ({ actions }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.fabContainer}>
      {expanded && (
        <View style={styles.actionsList}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              onPress={() => {
                action.action && action.action();
                setExpanded(false);
              }}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.fabIcon}>{expanded ? '✕' : '⚡'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Utility Components
const StatItem = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AlertCard = ({ alert }) => (
  <View style={styles.alertCard}>
    <View style={styles.alertHeader}>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <Text style={[styles.alertSeverity, { color: getSeverityColor(alert.severity) }]}>
        {alert.severity}
      </Text>
    </View>
    <Text style={styles.alertLocation}>{alert.location}</Text>
    <Text style={styles.alertTime}>
      {new Date(alert.timestamp).toLocaleTimeString()}
    </Text>
  </View>
);

const SupervisorCard = ({ supervisor }) => (
  <View style={styles.supervisorCard}>
    <Text style={styles.supervisorName}>{supervisor.supervisorName}</Text>
    <Text style={styles.supervisorDuty}>{supervisor.duty}</Text>
    <Text style={styles.supervisorBadge}>{supervisor.badge}</Text>
  </View>
);

const MetricCard = ({ title, value, trend }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    {trend && (
      <Text style={[styles.metricTrend, { color: trend.startsWith('+') ? '#51cf66' : '#ff6b6b' }]}>
        {trend}
      </Text>
    )}
  </View>
);

const StatCard = ({ title, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    <Text style={styles.statCardTitle}>{title}</Text>
  </View>
);

// Utility functions
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return '#ff4757';
    case 'HIGH': return '#ff6348';
    case 'MEDIUM': return '#ffa502';
    case 'LOW': return '#7bed9f';
    default: return '#70a1ff';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  supervisorBadge: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0984e3',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    color: '#636e72',
  },
  activeTabLabel: {
    color: '#0984e3',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  dashboardContent: {
    flex: 1,
    padding: 16,
  },
  communicationsContent: {
    flex: 1,
    padding: 16,
  },
  analyticsContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    flex: 1,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertLocation: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 11,
    color: '#b2bec3',
  },
  supervisorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supervisorCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  quickActionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 2,
  },
  quickActionDesc: {
    fontSize: 14,
    color: '#636e72',
  },
  quickActionArrow: {
    fontSize: 20,
    color: '#b2bec3',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statCardTitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  metricTitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#636e72',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#636e72',
    fontStyle: 'italic',
  },
  comingSoon: {
    fontSize: 14,
    color: '#636e72',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  actionsList: {
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    minWidth: 160,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3436',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0984e3',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  loginPrompt: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default SupervisorHub;
