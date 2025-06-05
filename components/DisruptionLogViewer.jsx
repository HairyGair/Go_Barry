// Go_BARRY/components/DisruptionLogViewer.jsx
// Component for viewing and managing existing disruption logs

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const DisruptionLogViewer = ({ supervisorInfo, visible, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    severity_level: '',
    depot: '',
    date_from: '',
    date_to: '',
    limit: 50
  });

  useEffect(() => {
    if (visible) {
      fetchLogs();
    }
  }, [visible, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (supervisorInfo?.id) params.append('supervisor_id', supervisorInfo.id);
      if (filters.type) params.append('type', filters.type);
      if (filters.severity_level) params.append('severity_level', filters.severity_level);
      if (filters.depot) params.append('depot', filters.depot);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('limit', filters.limit.toString());

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/disruptions/logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.logs || []);
      } else {
        Alert.alert('Error', `Failed to fetch logs: ${result.error}`);
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const showLogDetail = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'incident': return '🚨';
      case 'roadwork': return '🚧';
      case 'diversion': return '↩️';
      case 'weather': return '🌧️';
      case 'breakdown': return '🔧';
      case 'accident': return '💥';
      case 'emergency': return '🚑';
      case 'planned_works': return '📋';
      default: return '📝';
    }
  };

  const renderLogCard = (log) => (
    <TouchableOpacity 
      key={log.id} 
      style={styles.logCard}
      onPress={() => showLogDetail(log)}
    >
      <View style={styles.logHeader}>
        <View style={styles.logTitleRow}>
          <Text style={styles.logIcon}>{getTypeIcon(log.type)}</Text>
          <Text style={styles.logTitle} numberOfLines={1}>{log.title}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(log.severity_level) }]}>
          <Text style={styles.severityText}>{log.severity_level?.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.logLocation}>📍 {log.location}</Text>
      
      {log.affected_routes && log.affected_routes.length > 0 && (
        <View style={styles.routesContainer}>
          <Text style={styles.routesLabel}>Routes: </Text>
          {log.affected_routes.slice(0, 5).map(route => (
            <View key={route} style={styles.routeBadge}>
              <Text style={styles.routeText}>{route}</Text>
            </View>
          ))}
          {log.affected_routes.length > 5 && (
            <Text style={styles.moreRoutes}>+{log.affected_routes.length - 5} more</Text>
          )}
        </View>
      )}
      
      <View style={styles.logMeta}>
        <Text style={styles.logDate}>{formatDate(log.logged_at)}</Text>
        {log.resolution_time_minutes && (
          <Text style={styles.resolutionTime}>⏱️ {log.resolution_time_minutes}min</Text>
        )}
      </View>
      
      <Text style={styles.logSupervisor}>👤 {log.supervisor_name || log.supervisor_id}</Text>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedLog) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Disruption Details</Text>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>📋 Basic Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title:</Text>
                <Text style={styles.detailValue}>{selectedLog.title}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{getTypeIcon(selectedLog.type)} {selectedLog.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{selectedLog.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Severity:</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedLog.severity_level) }]}>
                  <Text style={styles.severityText}>{selectedLog.severity_level?.toUpperCase()}</Text>
                </View>
              </View>
              {selectedLog.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedLog.description}</Text>
                </View>
              )}
            </View>

            {selectedLog.affected_routes && selectedLog.affected_routes.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>🚌 Affected Routes</Text>
                <View style={styles.routesContainer}>
                  {selectedLog.affected_routes.map(route => (
                    <View key={route} style={styles.routeBadge}>
                      <Text style={styles.routeText}>{route}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>🔧 Resolution</Text>
              {selectedLog.resolution_method && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{selectedLog.resolution_method}</Text>
                </View>
              )}
              {selectedLog.actions_taken && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Actions Taken:</Text>
                  <Text style={styles.detailValue}>{selectedLog.actions_taken}</Text>
                </View>
              )}
              {selectedLog.diversion_route && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Diversion:</Text>
                  <Text style={styles.detailValue}>{selectedLog.diversion_route}</Text>
                </View>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>⏱️ Timing</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Logged:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedLog.logged_at)}</Text>
              </View>
              {selectedLog.disruption_resolved && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Resolved:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedLog.disruption_resolved)}</Text>
                </View>
              )}
              {selectedLog.resolution_time_minutes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Resolution Time:</Text>
                  <Text style={styles.detailValue}>{selectedLog.resolution_time_minutes} minutes</Text>
                </View>
              )}
              {selectedLog.response_time_minutes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Response Time:</Text>
                  <Text style={styles.detailValue}>{selectedLog.response_time_minutes} minutes</Text>
                </View>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>👤 Responsibility</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Supervisor:</Text>
                <Text style={styles.detailValue}>{selectedLog.supervisor_name || selectedLog.supervisor_id}</Text>
              </View>
              {selectedLog.depot && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Depot:</Text>
                  <Text style={styles.detailValue}>{selectedLog.depot}</Text>
                </View>
              )}
              {selectedLog.shift && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shift:</Text>
                  <Text style={styles.detailValue}>{selectedLog.shift}</Text>
                </View>
              )}
            </View>

            {(selectedLog.lessons_learned || selectedLog.improvement_suggestions) && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>📚 Learning</Text>
                {selectedLog.lessons_learned && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lessons Learned:</Text>
                    <Text style={styles.detailValue}>{selectedLog.lessons_learned}</Text>
                  </View>
                )}
                {selectedLog.improvement_suggestions && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Improvements:</Text>
                    <Text style={styles.detailValue}>{selectedLog.improvement_suggestions}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>🏷️ Flags</Text>
              <View style={styles.flagsContainer}>
                {selectedLog.preventable && (
                  <View style={[styles.flagBadge, styles.preventableBadge]}>
                    <Text style={styles.flagText}>Preventable</Text>
                  </View>
                )}
                {selectedLog.recurring_issue && (
                  <View style={[styles.flagBadge, styles.recurringBadge]}>
                    <Text style={styles.flagText}>Recurring</Text>
                  </View>
                )}
                {selectedLog.follow_up_required && (
                  <View style={[styles.flagBadge, styles.followUpBadge]}>
                    <Text style={styles.flagText}>Follow-up Required</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>🔍 Filters</Text>
      
      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              style={styles.filterPicker}
            >
              <Picker.Item label="All Types" value="" />
              <Picker.Item label="Incident" value="incident" />
              <Picker.Item label="Roadwork" value="roadwork" />
              <Picker.Item label="Diversion" value="diversion" />
              <Picker.Item label="Weather" value="weather" />
              <Picker.Item label="Breakdown" value="breakdown" />
              <Picker.Item label="Accident" value="accident" />
              <Picker.Item label="Emergency" value="emergency" />
              <Picker.Item label="Planned Works" value="planned_works" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Severity</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.severity_level}
              onValueChange={(value) => setFilters(prev => ({ ...prev, severity_level: value }))}
              style={styles.filterPicker}
            >
              <Picker.Item label="All Levels" value="" />
              <Picker.Item label="Critical" value="critical" />
              <Picker.Item label="High" value="high" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="Low" value="low" />
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Disruption Logs</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {renderFilters()}

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {logs.length} logs {supervisorInfo?.id && '(your logs)'}
          </Text>
          <TouchableOpacity onPress={fetchLogs} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading logs...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.logsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No Disruption Logs</Text>
                <Text style={styles.emptyText}>
                  {supervisorInfo?.id 
                    ? "You haven't logged any disruptions yet." 
                    : "No disruption logs found with current filters."
                  }
                </Text>
              </View>
            ) : (
              logs.map(renderLogCard)
            )}
          </ScrollView>
        )}

        {renderDetailModal()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 0.48,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
  filterPicker: {
    height: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  logsList: {
    flex: 1,
    padding: 16,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  logIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  routesLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  routeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  moreRoutes: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: '#666',
  },
  resolutionTime: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  logSupervisor: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  preventableBadge: {
    backgroundColor: '#FF9500',
  },
  recurringBadge: {
    backgroundColor: '#FF3B30',
  },
  followUpBadge: {
    backgroundColor: '#007AFF',
  },
  flagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default DisruptionLogViewer;
