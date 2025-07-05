// components/messaging/IntegrationStatus.jsx
// Service health monitoring for Message Distribution Centre Phase 7
// Real-time status of external services, API health checks, integration monitoring

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const IntegrationStatus = ({ visible, onClose }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [overallStatus, setOverallStatus] = useState('unknown');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceDetail, setShowServiceDetail] = useState(false);

  // Load service status when component opens
  useEffect(() => {
    if (visible) {
      loadServiceStatus();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(refreshServiceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  // Load service status from backend
  const loadServiceStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/status', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setServices(data.services || []);
        setOverallStatus(data.overallStatus || 'unknown');
        setLastUpdate(new Date());
      } else {
        // No data available
        setServices([]);
        setOverallStatus('unknown');
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load service status:', error);
      // No data available
      setServices([]);
      setOverallStatus('unknown');
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Refresh service status without loading state
  const refreshServiceStatus = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const response = await fetch('/api/integrations/status', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });
      const data = await response.json();
      if (data.success) {
        setServices(data.services || []);
        setOverallStatus(data.overallStatus || 'unknown');
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };


  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      operational: { color: '#10B981', icon: 'checkmark-circle', bg: '#ECFDF5', text: 'Operational' },
      degraded: { color: '#F59E0B', icon: 'warning', bg: '#FFFBEB', text: 'Degraded' },
      warning: { color: '#F59E0B', icon: 'alert-circle', bg: '#FFFBEB', text: 'Warning' },
      outage: { color: '#DC2626', icon: 'close-circle', bg: '#FEF2F2', text: 'Outage' },
      major_outage: { color: '#7F1D1D', icon: 'skull', bg: '#FEF2F2', text: 'Major Outage' },
      unknown: { color: '#6B7280', icon: 'help-circle', bg: '#F9FAFB', text: 'Unknown' }
    };
    return statusMap[status] || statusMap.unknown;
  };

  // Get response time color
  const getResponseTimeColor = (responseTime) => {
    if (responseTime < 300) return '#10B981'; // Green
    if (responseTime < 800) return '#F59E0B'; // Orange
    return '#DC2626'; // Red
  };

  // Handle service detail view
  const showServiceDetails = (service) => {
    setSelectedService(service);
    setShowServiceDetail(true);
  };

  // Render overall status card
  const renderOverallStatus = () => {
    const statusInfo = getStatusInfo(overallStatus);
    
    return (
      <View style={[styles.overallStatusCard, { backgroundColor: statusInfo.bg }]}>
        <View style={styles.overallStatusHeader}>
          <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
          <Text style={[styles.overallStatusText, { color: statusInfo.color }]}>
            System Status: {statusInfo.text}
          </Text>
        </View>
        
        <Text style={styles.overallStatusSubtext}>
          {services.filter(s => s.status === 'operational').length} of {services.length} services operational
        </Text>
        
        {lastUpdate && (
          <Text style={styles.lastUpdateText}>
            Last updated: {lastUpdate.toLocaleTimeString('en-GB')}
          </Text>
        )}
      </View>
    );
  };

  // Render service card
  const renderServiceCard = (service) => {
    const statusInfo = getStatusInfo(service.status);
    const responseTimeColor = getResponseTimeColor(service.responseTime);
    
    return (
      <TouchableOpacity
        key={service.id}
        style={styles.serviceCard}
        onPress={() => showServiceDetails(service)}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <View style={styles.serviceTitle}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.critical && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalText}>CRITICAL</Text>
                </View>
              )}
            </View>
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </View>
          
          <View style={styles.serviceStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: statusInfo.bg }]}>
              <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.serviceMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Response Time</Text>
            <Text style={[styles.metricValue, { color: responseTimeColor }]}>
              {service.responseTime}ms
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Uptime</Text>
            <Text style={styles.metricValue}>
              {service.uptime.toFixed(2)}%
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Incidents</Text>
            <Text style={[styles.metricValue, { color: service.incidents > 0 ? '#DC2626' : '#10B981' }]}>
              {service.incidents}
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Type</Text>
            <Text style={styles.metricValue}>
              {service.type === 'external' ? 'External' : 'Internal'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render service detail modal
  const renderServiceDetail = () => {
    if (!selectedService) return null;
    
    const statusInfo = getStatusInfo(selectedService.status);
    
    return (
      <Modal
        visible={showServiceDetail}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowServiceDetail(false)}
      >
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity 
              style={styles.detailBackButton}
              onPress={() => setShowServiceDetail(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.detailHeaderContent}>
              <Text style={styles.detailTitle}>{selectedService.name}</Text>
              <Text style={styles.detailSubtitle}>{selectedService.description}</Text>
            </View>
          </View>
          
          <ScrollView style={styles.detailContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Current Status</Text>
              <View style={[styles.detailStatusCard, { backgroundColor: statusInfo.bg }]}>
                <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
                <Text style={[styles.detailStatusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Health Checks</Text>
              {selectedService.healthChecks.map((check, index) => {
                const checkStatusInfo = getStatusInfo(check.status);
                return (
                  <View key={index} style={styles.healthCheckItem}>
                    <View style={styles.healthCheckHeader}>
                      <Text style={styles.healthCheckName}>{check.name}</Text>
                      <View style={[styles.healthCheckStatus, { backgroundColor: checkStatusInfo.bg }]}>
                        <Ionicons name={checkStatusInfo.icon} size={12} color={checkStatusInfo.color} />
                        <Text style={[styles.healthCheckStatusText, { color: checkStatusInfo.color }]}>
                          {checkStatusInfo.text}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.healthCheckResponseTime}>
                      Response time: {check.responseTime}ms
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Service Information</Text>
              <View style={styles.serviceInfoGrid}>
                <View style={styles.serviceInfoItem}>
                  <Text style={styles.serviceInfoLabel}>Service URL</Text>
                  <Text style={styles.serviceInfoValue}>{selectedService.url}</Text>
                </View>
                <View style={styles.serviceInfoItem}>
                  <Text style={styles.serviceInfoLabel}>Service Type</Text>
                  <Text style={styles.serviceInfoValue}>
                    {selectedService.type === 'external' ? 'External Service' : 'Internal Service'}
                  </Text>
                </View>
                <View style={styles.serviceInfoItem}>
                  <Text style={styles.serviceInfoLabel}>Critical Service</Text>
                  <Text style={styles.serviceInfoValue}>
                    {selectedService.critical ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.serviceInfoItem}>
                  <Text style={styles.serviceInfoLabel}>Last Check</Text>
                  <Text style={styles.serviceInfoValue}>
                    {selectedService.lastCheck.toLocaleString('en-GB')}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Integration Status</Text>
            <Text style={styles.headerSubtitle}>
              Monitor external service health and API status
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshServiceStatus}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? '#9CA3AF' : '#2563EB'} 
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading service status...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshServiceStatus}
                tintColor="#2563EB"
              />
            }
          >
            {renderOverallStatus()}
            
            <View style={styles.servicesSection}>
              <Text style={styles.servicesSectionTitle}>Service Details</Text>
              {services.map(renderServiceCard)}
            </View>
          </ScrollView>
        )}

        {renderServiceDetail()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overallStatusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overallStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  overallStatusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  overallStatusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  servicesSection: {
    marginBottom: 20,
  },
  servicesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Detail modal styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBackButton: {
    padding: 8,
    marginRight: 16,
  },
  detailHeaderContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  healthCheckItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  healthCheckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  healthCheckName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  healthCheckStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  healthCheckStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  healthCheckResponseTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceInfoGrid: {
    gap: 12,
  },
  serviceInfoItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  serviceInfoValue: {
    fontSize: 14,
    color: '#1F2937',
  },
});

export default IntegrationStatus;