/*
 * Go Barry - Adopt Incident Modal
 * Allows supervisors to adopt traffic incidents as manual incidents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../styles/incidents.styles';

const AdoptIncidentModal = ({
  visible,
  onClose,
  trafficIncident,
  onAdopt,
  supervisorName,
  sessionId,
  baseUrl
}) => {
  const [adopting, setAdopting] = useState(false);
  const [adoptedData, setAdoptedData] = useState({
    title: '',
    description: '',
    actionTaken: '',
    additionalNotes: '',
    affectedRoutes: [],
    priority: 'medium'
  });

  // Pre-fill data when traffic incident changes
  useEffect(() => {
    if (trafficIncident) {
      setAdoptedData({
        title: trafficIncident.title || `Traffic Incident: ${trafficIncident.type || 'Unknown'}`,
        description: trafficIncident.description || '',
        actionTaken: '',
        additionalNotes: '',
        affectedRoutes: trafficIncident.affectedRoutes || trafficIncident.affectsRoutes || [],
        priority: trafficIncident.priority || 'medium'
      });
    }
  }, [trafficIncident]);

  const handleAdopt = async () => {
    setAdopting(true);

    try {
      // Create new manual incident based on traffic incident
      const manualIncident = {
        type: trafficIncident.type || 'traffic',
        title: adoptedData.title,
        description: adoptedData.description,
        location: trafficIncident.location,
        coordinates: trafficIncident.coordinates,
        affectedRoutes: adoptedData.affectedRoutes,
        priority: adoptedData.priority,
        actionTaken: adoptedData.actionTaken,
        additionalNotes: adoptedData.additionalNotes,
        source: 'adopted',
        originalTrafficIncidentId: trafficIncident.id,
        originalSource: trafficIncident.source || 'traffic_alert',
        createdBy: supervisorName,
        status: 'active'
      };

      // Create via API
      const response = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify(manualIncident)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Traffic incident adopted:', result.incident?.id);
        
        if (onAdopt) {
          onAdopt(result.incident);
        }
        
        handleClose();
      } else {
        throw new Error('Failed to adopt incident');
      }
    } catch (error) {
      console.error('❌ Error adopting incident:', error);
      alert('Failed to adopt incident. Please try again.');
    } finally {
      setAdopting(false);
    }
  };

  const handleClose = () => {
    setAdoptedData({
      title: '',
      description: '',
      actionTaken: '',
      additionalNotes: '',
      affectedRoutes: [],
      priority: 'medium'
    });
    onClose();
  };

  if (!trafficIncident) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Adopt Traffic Incident</Text>
              <Text style={styles.modalSubtitle}>
                Convert traffic alert to manual incident for detailed tracking
              </Text>
            </View>
            <Pressable 
              style={styles.closeButton} 
              onPress={handleClose}
              disabled={adopting}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Original Traffic Data */}
            <View style={styles.originalDataSection}>
              <Text style={styles.sectionTitle}>Original Traffic Alert</Text>
              <View style={styles.originalDataCard}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Source:</Text>
                  <Text style={styles.dataValue}>
                    {trafficIncident.source || 'Traffic Alert'}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Type:</Text>
                  <Text style={styles.dataValue}>{trafficIncident.type}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Location:</Text>
                  <Text style={styles.dataValue}>
                    {trafficIncident.location?.description || trafficIncident.location}
                  </Text>
                </View>
                {trafficIncident.delayMinutes && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Delay:</Text>
                    <Text style={styles.dataValue}>
                      {trafficIncident.delayMinutes} minutes
                    </Text>
                  </View>
                )}
                {trafficIncident.intelligenceScore && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Intelligence Score:</Text>
                    <Text style={styles.dataValue}>
                      {trafficIncident.intelligenceScore}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Incident Title</Text>
              <TextInput
                style={styles.textInput}
                value={adoptedData.title}
                onChangeText={(text) => setAdoptedData(prev => ({ ...prev, title: text }))}
                placeholder="Enter a descriptive title..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={adoptedData.description}
                onChangeText={(text) => setAdoptedData(prev => ({ ...prev, description: text }))}
                placeholder="Describe the incident in detail..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Action Taken */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Action Taken</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={adoptedData.actionTaken}
                onChangeText={(text) => setAdoptedData(prev => ({ ...prev, actionTaken: text }))}
                placeholder="What actions have been taken? (e.g., Routes diverted via...)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Additional Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={adoptedData.additionalNotes}
                onChangeText={(text) => setAdoptedData(prev => ({ ...prev, additionalNotes: text }))}
                placeholder="Any additional information..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map((priority) => (
                  <Pressable
                    key={priority}
                    style={[
                      styles.priorityButton,
                      adoptedData.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setAdoptedData(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      adoptedData.priority === priority && styles.priorityButtonTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Affected Routes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Affected Routes ({adoptedData.affectedRoutes.length})
              </Text>
              <View style={styles.routesList}>
                {adoptedData.affectedRoutes.map((route, index) => (
                  <View key={index} style={styles.routeTag}>
                    <Text style={styles.routeTagText}>{route}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>
                Routes auto-detected from traffic data. Edit in next step if needed.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.footerButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={adopting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={[styles.footerButton, styles.adoptButton]}
              onPress={handleAdopt}
              disabled={adopting || !adoptedData.title.trim()}
            >
              {adopting ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color={colors.textInverse} />
                  <Text style={styles.adoptButtonText}>
                    Adopt as Manual Incident
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    ...shadows.lg,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },

  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },

  closeButton: {
    padding: spacing.sm,
  },

  modalContent: {
    flex: 1,
    padding: spacing.xl,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },

  originalDataSection: {
    marginBottom: spacing.xl,
  },

  originalDataCard: {
    backgroundColor: colors.warningBg,
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },

  dataRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },

  dataLabel: {
    ...typography.small,
    color: colors.textSecondary,
    width: 120,
    fontWeight: '600',
  },

  dataValue: {
    ...typography.small,
    color: colors.text,
    flex: 1,
  },

  textInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },

  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  priorityOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  priorityButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  priorityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  priorityButtonText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  priorityButtonTextActive: {
    color: colors.textInverse,
  },

  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  routeTag: {
    backgroundColor: colors.primary,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  routeTagText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },

  hint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  cancelButton: {
    backgroundColor: colors.backgroundDark,
  },

  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  adoptButton: {
    backgroundColor: colors.success,
  },

  adoptButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
};

export default AdoptIncidentModal;
