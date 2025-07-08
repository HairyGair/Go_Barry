// Go_BARRY/components/DisruptionLogger.jsx
// Disruption Logging Interface - Integrates with backend /api/disruptions/* endpoints
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../config/api';

const DisruptionLogger = ({ baseUrl, supervisorId }) => {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for new disruption
  const [formData, setFormData] = useState({
    title: '',
    type: 'incident',
    location: '',
    description: '',
    severity_level: 'medium',
    routes_affected: '',
    depot: '',
    estimated_duration: '',
    contact_info: ''
  });

  const disruptionTypes = [
    { value: 'incident', label: 'Traffic Incident', icon: 'car-outline' },
    { value: 'roadworks', label: 'Roadworks', icon: 'construct-outline' },
    { value: 'breakdown', label: 'Vehicle Breakdown', icon: 'bus-outline' },
    { value: 'weather', label: 'Weather Event', icon: 'cloud-outline' },
    { value: 'special_event', label: 'Special Event', icon: 'calendar-outline' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: '#10B981' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#EF4444' },
    { value: 'critical', label: 'Critical', color: '#DC2626' }
  ];

  // Fetch disruption logs
  const fetchDisruptions = async () => {
    try {
      setLoading(true);
      
      const [logsResponse, statsResponse] = await Promise.all([
        apiRequest('/api/disruptions/logs?limit=50'),
        apiRequest('/api/disruptions/statistics')
      ]);

      if (logsResponse.success) {
        setDisruptions(logsResponse.logs || []);
      }

      if (statsResponse.success) {
        setStatistics(statsResponse.statistics);
      }

    } catch (error) {
      console.error('Error fetching disruptions:', error);
      Alert.alert('Error', 'Failed to fetch disruption data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Log new disruption
  const logDisruption = async () => {
    if (!formData.title || !formData.location) {
      Alert.alert('Error', 'Title and location are required');
      return;
    }

    try {
      setLoading(true);

      const disruptionData = {
        ...formData,
        supervisor_id: supervisorId || 'unknown',
        routes_affected: formData.routes_affected ? formData.routes_affected.split(',').map(r => r.trim()) : []
      };

      const response = await apiRequest('/api/disruptions/log', {
        method: 'POST',
        body: JSON.stringify(disruptionData)
      });

      if (response.success) {
        Alert.alert('Success', 'Disruption logged successfully');
        setShowLogModal(false);
        setFormData({
          title: '',
          type: 'incident',
          location: '',
          description: '',
          severity_level: 'medium',
          routes_affected: '',
          depot: '',
          estimated_duration: '',
          contact_info: ''
        });
        fetchDisruptions(); // Refresh list
      } else {
        Alert.alert('Error', response.error || 'Failed to log disruption');
      }

    } catch (error) {
      console.error('Error logging disruption:', error);
      Alert.alert('Error', 'Failed to log disruption');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisruptions();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchDisruptions, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDisruptions();
  };

  const getSeverityColor = (severity) => {
    const level = severityLevels.find(s => s.value === severity);
    return level?.color || '#6B7280';
  };

  const getTypeIcon = (type) => {
    const typeData = disruptionTypes.find(t => t.value === type);
    return typeData?.icon || 'alert-circle-outline';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DisruptionCard = ({ disruption }) => (
    <View style={[styles.disruptionCard, { borderLeftColor: getSeverityColor(disruption.severity_level) }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons 
            name={getTypeIcon(disruption.type)} 
            size={20} 
            color={getSeverityColor(disruption.severity_level)} 
          />
          <Text style={styles.disruptionTitle}>{disruption.title}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(disruption.severity_level) }]}>
          <Text style={styles.severityText}>{disruption.severity_level.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.disruptionLocation}>📍 {disruption.location}</Text>
      
      {disruption.description && (
        <Text style={styles.disruptionDescription}>{disruption.description}</Text>
      )}
      
      <View style={styles.cardFooter}>
        <Text style={styles.timestamp}>
          {formatDateTime(disruption.logged_at)}
        </Text>
        <Text style={styles.supervisor}>
          by {disruption.supervisor_id}
        </Text>
      </View>
      
      {disruption.routes_affected && disruption.routes_affected.length > 0 && (
        <View style={styles.routesContainer}>
          <Text style={styles.routesLabel}>Affected Routes:</Text>
          <View style={styles.routesList}>
            {disruption.routes_affected.map((route, index) => (
              <View key={index} style={styles.routeBadge}>
                <Text style={styles.routeText}>{route}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const StatCard = ({ title, value, subtitle, color = '#3B82F6' }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading disruption data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Disruption Logger</Text>
          <Text style={styles.subtitle}>Track and manage service disruptions</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowLogModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      {statistics && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <StatCard
            title="Today"
            value={statistics.today?.total || 0}
            subtitle="disruptions"
            color="#3B82F6"
          />
          <StatCard
            title="This Week"
            value={statistics.thisWeek?.total || 0}
            subtitle="disruptions"
            color="#10B981"
          />
          <StatCard
            title="Critical"
            value={statistics.bySeverity?.critical || 0}
            subtitle="this week"
            color="#DC2626"
          />
          <StatCard
            title="Most Affected"
            value={statistics.topRoutes?.[0]?.route || 'N/A'}
            subtitle="route"
            color="#F59E0B"
          />
        </ScrollView>
      )}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {disruptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Disruptions Logged</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to log a new disruption</Text>
          </View>
        ) : (
          disruptions.map((disruption, index) => (
            <DisruptionCard key={disruption.id || index} disruption={disruption} />
          ))
        )}
      </ScrollView>

      {/* Log New Disruption Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLogModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log New Disruption</Text>
            <TouchableOpacity onPress={logDisruption} disabled={loading}>
              <Text style={[styles.saveButton, { opacity: loading ? 0.5 : 1 }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Brief description of the disruption"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {disruptionTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip,
                      formData.type === type.value && styles.typeChipActive
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Ionicons 
                      name={type.icon} 
                      size={16} 
                      color={formData.type === type.value ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.typeText,
                      formData.type === type.value && styles.typeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Specific location of the disruption"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Severity Level</Text>
              <View style={styles.severityContainer}>
                {severityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.severityChip,
                      { borderColor: level.color },
                      formData.severity_level === level.value && { backgroundColor: level.color }
                    ]}
                    onPress={() => setFormData({ ...formData, severity_level: level.value })}
                  >
                    <Text style={[
                      styles.severityChipText,
                      { color: formData.severity_level === level.value ? '#FFFFFF' : level.color }
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Affected Routes</Text>
              <TextInput
                style={styles.input}
                value={formData.routes_affected}
                onChangeText={(text) => setFormData({ ...formData, routes_affected: text })}
                placeholder="e.g., X1, 21, 56 (comma separated)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Detailed description of the disruption"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Duration</Text>
              <TextInput
                style={styles.input}
                value={formData.estimated_duration}
                onChangeText={(text) => setFormData({ ...formData, estimated_duration: text })}
                placeholder="e.g., 2 hours, Until 15:30"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 12,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderTopWidth: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  disruptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  disruptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  disruptionLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  disruptionDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  supervisor: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  routesContainer: {
    marginTop: 8,
  },
  routesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#3B82F6',
  },
  typeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  severityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  severityChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DisruptionLogger;