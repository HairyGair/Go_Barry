// Go_BARRY/components/admin/AdminPanel.jsx
// Comprehensive admin panel for system management and accountability

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import { useConvexSync } from '../../hooks/useConvexSync';
import MonitoringDashboard from '../MonitoringDashboard';
import SupervisorManager from './SupervisorManager';
import ActivityAuditTrail from './ActivityAuditTrail';
import AlertAnalytics from './AlertAnalytics';
import ApiUsageStats from './ApiUsageStats';
import SystemConfiguration from './SystemConfiguration';
import IntelligenceDashboard from './IntelligenceDashboard';
import UnifiedRoadworksManager from './UnifiedRoadworksManager';
import SystemOverview from './SystemOverview';

const API_BASE = 'https://go-barry.onrender.com';

const AdminPanel = ({ onClose }) => {
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const { activeAlerts, activeSupervisors } = useConvexSync();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  
  console.log('🔴 AdminPanel: activeTab =', activeTab);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    dismissedAlerts: 0,
    supervisorsOnline: 0,
    apiCalls24h: 0,
    systemUptime: '0h',
    lastBackup: 'Never'
  });

  // Check admin access - More resilient check
  useEffect(() => {
    // Only check after a delay to allow session to load
    const checkTimer = setTimeout(() => {
      if (!isAdmin && supervisorSession) {
        console.warn('⚠️ Admin access denied for:', supervisorSession?.supervisor?.name);
        Alert.alert(
          'Access Denied', 
          'Admin privileges required. Only AG003 and BP009 have admin access.',
          [
            { text: 'OK', onPress: () => onClose && onClose() }
          ]
        );
      }
    }, 1000); // Give session 1 second to load
    
    return () => clearTimeout(checkTimer);
  }, [isAdmin, supervisorSession, onClose]);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health-extended`);
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
        
        // Update stats from health data
        setStats(prev => ({
          ...prev,
          systemUptime: data.uptime || '0h',
          apiCalls24h: data.apiStats?.last24Hours || 0
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching system health:', error);
    }
  }, []);

  // Update stats from Convex data (real-time)
  useEffect(() => {
    if (activeAlerts && activeSupervisors) {
      setStats(prev => ({
        ...prev,
        totalAlerts: activeAlerts.length,
        activeAlerts: activeAlerts.filter(a => !a.dismissed).length,
        dismissedAlerts: activeAlerts.filter(a => a.dismissed).length,
        supervisorsOnline: activeSupervisors.length
      }));
    }
  }, [activeAlerts, activeSupervisors]);

  // Initial data load (only system health, alerts come from Convex)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSystemHealth();
      setLoading(false);
    };

    loadData();
    
    // Refresh system health every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemHealth]);

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'System Overview', icon: 'speedometer' },
    { id: 'intelligence', label: 'Intelligence Dashboard', icon: 'analytics' },
    { id: 'roadworks', label: 'Roadworks Manager', icon: 'construct' },
    { id: 'supervisors', label: 'Supervisor Management', icon: 'people' },
    { id: 'activity', label: 'Activity Audit Trail', icon: 'list' },
    { id: 'analytics', label: 'Alert Analytics', icon: 'stats-chart' },
    { id: 'api', label: 'API Usage', icon: 'cloud' },
    { id: 'monitoring', label: 'Live Monitoring', icon: 'pulse' },
    { id: 'config', label: 'Configuration', icon: 'settings' }
  ];



  // Render active tab content
  const renderTabContent = () => {
    console.log('🟢 AdminPanel: renderTabContent called, activeTab =', activeTab);
    
    switch (activeTab) {
      case 'overview':
        console.log('🟡 AdminPanel: Rendering SystemOverview component');
        return <SystemOverview />;
      case 'intelligence':
        return <IntelligenceDashboard supervisorToken={supervisorSession?.token} />;
      case 'roadworks':
        return <UnifiedRoadworksManager supervisorToken={supervisorSession?.token} />;
      case 'supervisors':
        return <SupervisorManager />;
      case 'activity':
        return <ActivityAuditTrail />;
      case 'analytics':
        return <AlertAnalytics />;
      case 'api':
        return <ApiUsageStats />;
      case 'monitoring':
        return <MonitoringDashboard supervisorInfo={{
          name: supervisorSession?.supervisor?.name,
          badge: supervisorSession?.supervisor?.badge,
          isAdmin: true
        }} />;
      case 'config':
        return <SystemConfiguration />;
      default:
        return <SystemOverview />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark" size={32} color="#F59E0B" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Admin Control Center</Text>
            <Text style={styles.headerSubtitle}>
              {supervisorSession?.supervisor?.name} • Full System Access
            </Text>
          </View>
        </View>
        
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content Area */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 20 },
      default: { paddingTop: 44 }
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 60,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  healthCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  healthCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  healthCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  servicesGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  serviceStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    lineHeight: 18,
    marginTop: 8,
  },
});

export default AdminPanel;
