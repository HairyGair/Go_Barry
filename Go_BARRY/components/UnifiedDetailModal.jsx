// Go_BARRY/components/UnifiedDetailModal.jsx
// Modal for viewing and managing roadwork details with comprehensive functionality

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UnifiedDetailModal = ({ 
  visible, 
  data,
  onClose,
  onUpdateStatus,
  onDismiss,
  onPushToDisplay,
  onEditRoadwork,
  supervisorData 
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [displayStatus, setDisplayStatus] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const statusOptions = [
    { value: 'reported', label: 'Reported', icon: 'information-circle', color: '#6B7280' },
    { value: 'assessing', label: 'Assessing Impact', icon: 'search', color: '#F59E0B' },
    { value: 'planning', label: 'Planning Response', icon: 'document-text', color: '#3B82F6' },
    { value: 'approved', label: 'Plans Approved', icon: 'checkmark-circle', color: '#10B981' },
    { value: 'active', label: 'Monitoring Active', icon: 'eye', color: '#DC2626' },
    { value: 'monitoring', label: 'Ongoing Monitoring', icon: 'pulse', color: '#7C3AED' },
    { value: 'resolved', label: 'Resolved', icon: 'checkmark-done', color: '#059669' }
  ];

  const dismissReasons = [
    'Duplicate entry',
    'Incorrect information',
    'Outside operational area',
    'No impact on bus routes',
    'Resolved/Completed',
    'Planning cancelled',
    'Other'
  ];

  useEffect(() => {
    if (visible && data) {
      setStatusNotes('');
      setDisplayStatus(data.promotedToDisplay || false);
      setDismissReason('');
      setActiveTab('details');
    }
  }, [visible, data]);

  if (!data) return null;

  const currentStatus = statusOptions.find(s => s.value === data.status) || statusOptions[0];
  const severityColor = getSeverityColor(data.severity || data.priority);
  const isManualEntry = data.source === 'manual';
  const hasCoordinates = data.coordinates && data.coordinates.length === 2;

  function getSeverityColor(severity) {
    const sev = (severity || 'medium').toLowerCase();
    switch (sev) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!statusNotes.trim()) {
      Alert.alert('Note Required', 'Please add a note explaining this status change.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const result = await onUpdateStatus(data.id, newStatus, statusNotes.trim());
      if (result?.success) {
        Alert.alert('Success', 'Status updated successfully.');
        setStatusNotes('');
      } else {
        Alert.alert('Error', result?.error || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDismiss = async () => {
    if (!dismissReason) {
      Alert.alert('Reason Required', 'Please select a reason for dismissing this roadwork.');
      return;
    }

    Alert.alert(
      'Confirm Dismissal',
      `Are you sure you want to dismiss this roadwork?\n\nReason: ${dismissReason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await onDismiss(data.id, dismissReason);
              if (result?.success) {
                Alert.alert('Success', 'Roadwork dismissed successfully.', [
                  { text: 'OK', onPress: onClose }
                ]);
              } else {
                Alert.alert('Error', result?.error || 'Failed to dismiss roadwork');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while dismissing roadwork');
            }
          }
        }
      ]
    );
  };

  const handleDisplayToggle = async (enabled) => {
    try {
      const result = await onPushToDisplay(data.id, enabled);
      if (result?.success) {
        setDisplayStatus(enabled);
        Alert.alert(
          'Success', 
          enabled ? 'Roadwork pushed to display screens' : 'Roadwork removed from display screens'
        );
      } else {
        Alert.alert('Error', result?.error || 'Failed to update display status');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating display status');
    }
  };

  const openInMaps = () => {
    if (!hasCoordinates) {
      Alert.alert('No Location', 'GPS coordinates not available for this roadwork');
      return;
    }

    const [lat, lng] = data.coordinates;
    const label = encodeURIComponent(data.title || 'Roadwork');
    
    if (Platform.OS === 'ios') {
      const url = `maps://0,0?q=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      const url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      Linking.openURL(url);
    }
  };

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Status and Severity */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '20' }]}>
          <Ionicons name={currentStatus.icon} size={16} color={currentStatus.color} />
          <Text style={[styles.statusText, { color: currentStatus.color }]}>
            {currentStatus.label}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
          <Text style={[styles.severityText, { color: severityColor }]}>
            {(data.severity || data.priority || 'Medium').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Title and Location */}
      <Text style={styles.roadworkTitle}>{data.title}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location" size={16} color="#6B7280" />
        <Text style={styles.locationText}>{data.location}</Text>
        {hasCoordinates && (
          <TouchableOpacity style={styles.mapButton} onPress={openInMaps}>
            <Ionicons name="map" size={14} color="#3B82F6" />
            <Text style={styles.mapButtonText}>Open</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {data.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{data.description}</Text>
        </View>
      )}

      {/* Affected Routes */}
      {(data.affectedRoutes?.length > 0 || data.affectsRoutes?.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affected Bus Routes</Text>
          <View style={styles.routesContainer}>
            {(data.affectedRoutes || data.affectsRoutes || []).map((route) => (
              <View key={route} style={styles.routeChip}>
                <Text style={styles.routeChipText}>{route}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Traffic Management */}
      {data.trafficManagement && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Traffic Management</Text>
          <Text style={styles.infoText}>{data.trafficManagement}</Text>
        </View>
      )}

      {/* Duration */}
      {data.expectedDuration && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Duration</Text>
          <Text style={styles.infoText}>{data.expectedDuration}</Text>
        </View>
      )}

      {/* Promoter */}
      {data.promoter && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promoter/Contractor</Text>
          <Text style={styles.infoText}>{data.promoter}</Text>
        </View>
      )}

      {/* Source and Dates */}
      <View style={styles.metadataSection}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Source:</Text>
          <Text style={styles.metadataValue}>
            {isManualEntry ? 'Manual Entry' : data.source || 'Street Manager'}
          </Text>
        </View>
        {data.createdAt && (
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Reported:</Text>
            <Text style={styles.metadataValue}>
              {new Date(data.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
        {data.startDate && (
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Start Date:</Text>
            <Text style={styles.metadataValue}>
              {new Date(data.startDate).toLocaleDateString('en-GB')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderStatusTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Update Status</Text>
      <Text style={styles.sectionDescription}>
        Change the status of this roadwork and add notes for other supervisors.
      </Text>

      {/* Current Status */}
      <View style={styles.currentStatusContainer}>
        <Text style={styles.currentStatusLabel}>Current Status:</Text>
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '20' }]}>
          <Ionicons name={currentStatus.icon} size={16} color={currentStatus.color} />
          <Text style={[styles.statusText, { color: currentStatus.color }]}>
            {currentStatus.label}
          </Text>
        </View>
      </View>

      {/* Status Options */}
      <View style={styles.statusOptionsContainer}>
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusOption,
              data.status === option.value && styles.statusOptionCurrent
            ]}
            onPress={() => {
              if (data.status === option.value) return;
              Alert.alert(
                'Confirm Status Change',
                `Change status to "${option.label}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Change', onPress: () => handleStatusUpdate(option.value) }
                ]
              );
            }}
            disabled={data.status === option.value || isUpdatingStatus}
          >
            <View style={styles.statusOptionContent}>
              <Ionicons name={option.icon} size={20} color={option.color} />
              <Text style={[styles.statusOptionText, { color: option.color }]}>
                {option.label}
              </Text>
            </View>
            {data.status === option.value && (
              <Ionicons name="checkmark" size={20} color={option.color} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Notes */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesLabel}>Status Update Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes about this status change..."
          placeholderTextColor="#9CA3AF"
          value={statusNotes}
          onChangeText={setStatusNotes}
          multiline
          numberOfLines={3}
        />
      </View>
    </ScrollView>
  );

  const renderActionsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Display Toggle */}
      <View style={styles.actionSection}>
        <View style={styles.actionHeader}>
          <Ionicons name="tv" size={20} color="#3B82F6" />
          <Text style={styles.actionTitle}>Passenger Displays</Text>
        </View>
        <Text style={styles.actionDescription}>
          Control whether this roadwork appears on passenger information displays
        </Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Push to Display Screens</Text>
          <Switch
            value={displayStatus}
            onValueChange={handleDisplayToggle}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={displayStatus ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Edit Roadwork */}
      {isManualEntry && onEditRoadwork && (
        <View style={styles.actionSection}>
          <View style={styles.actionHeader}>
            <Ionicons name="create" size={20} color="#F59E0B" />
            <Text style={styles.actionTitle}>Edit Details</Text>
          </View>
          <Text style={styles.actionDescription}>
            Modify the details of this manual roadwork entry
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEditRoadwork(data)}
          >
            <Ionicons name="create" size={16} color="#F59E0B" />
            <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
              Edit Roadwork
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dismiss Roadwork */}
      <View style={styles.actionSection}>
        <View style={styles.actionHeader}>
          <Ionicons name="close-circle" size={20} color="#EF4444" />
          <Text style={styles.actionTitle}>Dismiss Roadwork</Text>
        </View>
        <Text style={styles.actionDescription}>
          Remove this roadwork from active monitoring
        </Text>
        
        <Text style={styles.dismissReasonLabel}>Dismissal Reason:</Text>
        <View style={styles.dismissReasonsContainer}>
          {dismissReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.dismissReasonChip,
                dismissReason === reason && styles.dismissReasonChipSelected
              ]}
              onPress={() => setDismissReason(reason)}
            >
              <Text style={[
                styles.dismissReasonText,
                dismissReason === reason && styles.dismissReasonTextSelected
              ]}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.dismissButton,
            !dismissReason && styles.actionButtonDisabled
          ]}
          onPress={handleDismiss}
          disabled={!dismissReason}
        >
          <Ionicons name="close-circle" size={16} color="#FFFFFF" />
          <Text style={styles.dismissButtonText}>Dismiss Roadwork</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Roadwork Details</Text>
              <Text style={styles.headerSubtitle}>
                {isManualEntry ? 'Manual Entry' : 'Street Manager'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {[
              { id: 'details', label: 'Details', icon: 'information-circle' },
              { id: 'status', label: 'Status', icon: 'settings' },
              { id: 'actions', label: 'Actions', icon: 'options' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.tabActive
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.id ? '#3B82F6' : '#6B7280'} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'status' && renderStatusTab()}
            {activeTab === 'actions' && renderActionsTab()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roadworkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  metadataSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 12,
    color: '#374151',
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  currentStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusOptionsContainer: {
    gap: 8,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  statusOptionCurrent: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismissReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dismissReasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dismissReasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dismissReasonChipSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  dismissReasonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  dismissReasonTextSelected: {
    color: '#FFFFFF',
  },
  dismissButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UnifiedDetailModal;