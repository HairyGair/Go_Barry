// Go_BARRY/components/ServiceFrequencyDashboard.jsx
// Real-time Service Frequency and Breakdown Detection Dashboard
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ServiceFrequencyDashboard = ({ baseUrl }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [breakdownAlerts, setBreakdownAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const API_BASE_URL = baseUrl || (__DEV__ 
    ? 'http://192.168.1.132:3001'
    : 'https://go-barry.onrender.com');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      console.log('📊 Fetching service frequency dashboard...');
      
      const [dashboardResponse, alertsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/routes/frequency/dashboard-summary`),
        fetch(`${API_BASE_URL}/api/routes/frequency/breakdown-alerts`)
      ]);
      
      if (!dashboardResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const dashboardResult = await dashboardResponse.json();
      const alertsResult = await alertsResponse.json();
      
      if (dashboardResult.success) {
        setDashboardData(dashboardResult.summary);
      }
      
      if (alertsResult.success) {
        setBreakdownAlerts(alertsResult.data);
      }
      
      console.log('✅ Dashboard data loaded successfully');
      
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleAlertPress = (alert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return '#DC2626';
      case 'WARNING': return '#F59E0B';
      case 'DEGRADED': return '#EF4444';
      case 'NORMAL': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CRITICAL': return 'alert-circle';
      case 'WARNING': return 'warning';
      case 'DEGRADED': return 'radio-button-off';
      case 'NORMAL': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading service frequency data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚌 Service Frequency Control</Text>
        <Text style={styles.subtitle}>Real-time breakdown detection & service gaps</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#EF4444" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Network Overview */}
      {dashboardData && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Network Overview</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dashboardData.networkOverview.status) }]}>
              <Ionicons 
                name={getStatusIcon(dashboardData.networkOverview.status)} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>{dashboardData.networkOverview.status}</Text>
            </View>
          </View>
          
          <View style={styles.overviewStats}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{dashboardData.networkOverview.totalRoutes}</Text>
              <Text style={styles.overviewLabel}>Total Routes</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{dashboardData.networkOverview.operationalRoutes}</Text>
              <Text style={styles.overviewLabel}>Operational</Text>
            </View>
          </View>
        </View>
      )}

      {/* Service Gaps Summary */}
      {dashboardData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Gaps Analysis</Text>
          <View style={styles.gapsContainer}>
            <View style={[styles.gapCard, styles.totalGaps]}>
              <Ionicons name="timer-outline" size={24} color="#3B82F6" />
              <Text style={styles.gapNumber}>{dashboardData.serviceGaps.totalGaps}</Text>
              <Text style={styles.gapLabel}>Total Gaps</Text>
            </View>
            
            <View style={[styles.gapCard, styles.criticalGaps]}>
              <Ionicons name="alert-circle" size={24} color="#DC2626" />
              <Text style={styles.gapNumber}>{dashboardData.serviceGaps.criticalGaps}</Text>
              <Text style={styles.gapLabel}>Critical</Text>
            </View>
            
            <View style={[styles.gapCard, styles.breakdownGaps]}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
              <Text style={styles.gapNumber}>{dashboardData.serviceGaps.potentialBreakdowns}</Text>
              <Text style={styles.gapLabel}>Breakdowns</Text>
            </View>
          </View>
        </View>
      )}

      {/* Breakdown Alerts */}
      {breakdownAlerts && breakdownAlerts.alerts && breakdownAlerts.alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Breakdown Alerts</Text>
            <View style={styles.alertsBadge}>
              <Text style={styles.alertsCount}>{breakdownAlerts.alertCount}</Text>
            </View>
          </View>
          
          {breakdownAlerts.alerts.slice(0, 5).map((alert, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.alertCard, { borderLeftColor: getStatusColor(alert.severity) }]}
              onPress={() => handleAlertPress(alert)}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertRoute}>Route {alert.route}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getStatusColor(alert.severity) }]}>
                    <Text style={styles.severityText}>{alert.severity}</Text>
                  </View>
                </View>
                <Text style={styles.alertTime}>{alert.gapDuration}</Text>
              </View>
              
              <Text style={styles.alertDescription}>
                Service gap exceeds threshold by {alert.exceedsThresholdBy} minutes
              </Text>
              
              <View style={styles.alertFooter}>
                <Text style={styles.alertImpact}>{alert.passengerImpact}</Text>
                {alert.actionRequired && (
                  <View style={styles.actionRequired}>
                    <Ionicons name="flag" size={12} color="#DC2626" />
                    <Text style={styles.actionText}>Action Required</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Top Priority Routes */}
      {dashboardData && dashboardData.topPriorityRoutes && dashboardData.topPriorityRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Routes</Text>
          {dashboardData.topPriorityRoutes.map((route, index) => (
            <View key={index} style={styles.priorityRouteCard}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeNumber}>Route {route.route}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getStatusColor(route.status) }]}>
                  <Text style={styles.priorityText}>{route.status}</Text>
                </View>
              </View>
              <Text style={styles.routeGap}>{route.serviceGap}</Text>
              <View style={styles.priorityBar}>
                <View 
                  style={[styles.priorityBarFill, { width: `${route.priority}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Immediate Actions */}
      {dashboardData && dashboardData.immediateActions && dashboardData.immediateActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Immediate Actions Required</Text>
          {dashboardData.immediateActions.map((action, index) => (
            <View key={index} style={styles.actionCard}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Alert Detail Modal */}
      <Modal
        visible={showAlertModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Alert Details</Text>
            <TouchableOpacity onPress={() => setShowAlertModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {selectedAlert && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Route</Text>
                <Text style={styles.modalValue}>Route {selectedAlert.route}</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Severity</Text>
                <View style={[styles.modalSeverityBadge, { backgroundColor: getStatusColor(selectedAlert.severity) }]}>
                  <Text style={styles.modalSeverityText}>{selectedAlert.severity}</Text>
                </View>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Gap Duration</Text>
                <Text style={styles.modalValue}>{selectedAlert.gapDuration}</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Threshold Exceeded By</Text>
                <Text style={styles.modalValue}>{selectedAlert.exceedsThresholdBy} minutes</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Last Known Service</Text>
                <Text style={styles.modalValue}>{selectedAlert.lastKnownService}</Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Passenger Impact</Text>
                <Text style={styles.modalValue}>{selectedAlert.passengerImpact}</Text>
              </View>
              
              {selectedAlert.alternativeRoutes && selectedAlert.alternativeRoutes.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Alternative Routes</Text>
                  <Text style={styles.modalValue}>{selectedAlert.alternativeRoutes.join(', ')}</Text>
                </View>
              )}
              
              {selectedAlert.recommendations && selectedAlert.recommendations.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Recommendations</Text>
                  {selectedAlert.recommendations.map((rec, index) => (
                    <Text key={index} style={styles.modalRecommendation}>• {rec}</Text>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  gapsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  gapCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  totalGaps: {
    backgroundColor: '#EFF6FF',
  },
  criticalGaps: {
    backgroundColor: '#FEF2F2',
  },
  breakdownGaps: {
    backgroundColor: '#FFFBEB',
  },
  gapNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  gapLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  alertsBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertsCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  alertDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertImpact: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  actionRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
  },
  priorityRouteCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  routeGap: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  priorityBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  priorityBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  modalSeverityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalSeverityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalRecommendation: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 4,
    marginLeft: 8,
  },
});

export default ServiceFrequencyDashboard;