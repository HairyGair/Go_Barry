import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing } from '../styles/incidents.styles';

const ActionRemindersModal = ({ 
  visible, 
  onClose, 
  incident,
  messages
}) => {
  const [checkedItems, setCheckedItems] = useState({
    email: false,
    ticketer: false,
    passengerCloud: false,
    disruptionDb: incident?.actionTaken?.toLowerCase().includes('divert') || false
  });

  const [copiedField, setCopiedField] = useState(null);

  const handleCheck = (item) => {
    setCheckedItems({
      ...checkedItems,
      [item]: !checkedItems[item]
    });
  };

  const handleCopy = async (text, field) => {
    try {
      await Clipboard.setStringAsync(text);
      
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCompletionPercentage = () => {
    const total = Object.keys(checkedItems).length;
    const checked = Object.values(checkedItems).filter(v => v).length;
    return Math.round((checked / total) * 100);
  };

  const allCompleted = Object.values(checkedItems).every(v => v);

  const reminders = [
    {
      id: 'email',
      icon: 'mail',
      iconColor: '#FF6B6B',
      title: 'Email Affected Depots',
      description: 'Send incident notification to depot managers',
      instruction: 'Copy the message below and send via Outlook:',
      message: messages?.email || `INCIDENT ALERT: ${incident?.type} at ${incident?.location}\n\nAffected Routes: ${incident?.affectedRoutes?.join(', ')}\n\nDescription: ${incident?.description}\n\nAction Taken: ${incident?.actionTaken || 'Monitoring situation'}\n\nPlease inform drivers on affected routes.`,
      copyLabel: 'Copy Email'
    },
    {
      id: 'ticketer',
      icon: 'phone-portrait',
      iconColor: '#4ECDC4',
      title: 'Update Ticketer',
      description: 'Send message to drivers via Ticketer system',
      instruction: 'Copy and paste into Ticketer broadcast:',
      message: messages?.ticketer || `${incident?.actionTaken?.includes('divert') ? 'DIVERSION' : 'CAUTION'} - ${incident?.location}\n\nRoutes ${incident?.affectedRoutes?.join(', ')}\n\n${incident?.description}\n\n${incident?.actionTaken || 'Proceed with caution'}`,
      copyLabel: 'Copy Ticketer Message'
    },
    {
      id: 'passengerCloud',
      icon: 'cloud',
      iconColor: '#45B7D1',
      title: 'Update Passenger Cloud',
      description: 'Inform customers via Passenger Cloud',
      instruction: 'Copy for Passenger Cloud announcement:',
      message: messages?.passengerCloud || `Due to ${incident?.type?.toLowerCase()} at ${incident?.location}, services ${incident?.affectedRoutes?.join(', ')} ${incident?.actionTaken?.includes('divert') ? 'are currently on diversion' : 'may experience delays'}. We apologise for any inconvenience.`,
      copyLabel: 'Copy Customer Message'
    },
    {
      id: 'disruptionDb',
      icon: 'server',
      iconColor: '#9B59B6',
      title: 'Flag for Disruption Database',
      description: incident?.actionTaken?.toLowerCase().includes('divert') 
        ? 'Diversion detected - will be added to database'
        : 'Mark if this incident should be tracked',
      instruction: incident?.actionTaken?.toLowerCase().includes('divert')
        ? 'This incident has been automatically flagged'
        : 'Check this box if incident caused significant disruption',
      isAutoChecked: incident?.actionTaken?.toLowerCase().includes('divert'),
      noMessage: true
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Action Reminders</Text>
              <Text style={styles.subtitle}>Complete these steps to notify all stakeholders</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getCompletionPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{getCompletionPercentage()}% Complete</Text>
          </View>

          {/* Incident Summary */}
          <View style={styles.incidentSummary}>
            <Text style={styles.summaryTitle}>Incident Created:</Text>
            <Text style={styles.summaryText}>
              {incident?.type} at {incident?.location} affecting routes {incident?.affectedRoutes?.join(', ')}
            </Text>
          </View>

          {/* Reminders List */}
          <ScrollView style={styles.remindersList} showsVerticalScrollIndicator={false}>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <Pressable
                    style={styles.checkboxContainer}
                    onPress={() => handleCheck(reminder.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      checkedItems[reminder.id] && styles.checkboxChecked
                    ]}>
                      {checkedItems[reminder.id] && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={[styles.iconCircle, { backgroundColor: `${reminder.iconColor}20` }]}>
                      <Ionicons name={reminder.icon} size={20} color={reminder.iconColor} />
                    </View>
                    <View style={styles.reminderInfo}>
                      <Text style={[
                        styles.reminderTitle,
                        checkedItems[reminder.id] && styles.reminderTitleChecked
                      ]}>
                        {reminder.title}
                      </Text>
                      <Text style={styles.reminderDescription}>{reminder.description}</Text>
                    </View>
                  </Pressable>
                </View>

                {!reminder.noMessage && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.instructionText}>{reminder.instruction}</Text>
                    <View style={styles.messageBox}>
                      <Text style={styles.messageText}>{reminder.message}</Text>
                    </View>
                    <Pressable
                      style={styles.copyButton}
                      onPress={() => handleCopy(reminder.message, reminder.id)}
                    >
                      <Ionicons 
                        name={copiedField === reminder.id ? "checkmark-circle" : "copy"} 
                        size={16} 
                        color="#fff" 
                      />
                      <Text style={styles.copyButtonText}>
                        {copiedField === reminder.id ? 'Copied!' : reminder.copyLabel}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {reminder.noMessage && reminder.isAutoChecked && (
                  <View style={styles.autoFlaggedContainer}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.autoFlaggedText}>{reminder.instruction}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable 
              style={[styles.button, styles.laterButton]} 
              onPress={onClose}
            >
              <Text style={styles.laterButtonText}>Complete Later</Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.button, 
                styles.doneButton,
                !allCompleted && styles.doneButtonDisabled
              ]} 
              onPress={allCompleted ? onClose : null}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={allCompleted ? "#fff" : colors.textTertiary} 
              />
              <Text style={[
                styles.doneButtonText,
                !allCompleted && styles.doneButtonTextDisabled
              ]}>
                {allCompleted ? 'All Done!' : 'Complete All Actions'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary
  },
  closeButton: {
    padding: spacing.sm
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  incidentSummary: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 8
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4
  },
  summaryText: {
    fontSize: 14,
    color: colors.text
  },
  remindersList: {
    flex: 1,
    paddingHorizontal: spacing.xl
  },
  reminderCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  reminderInfo: {
    flex: 1
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  reminderTitleChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary
  },
  reminderDescription: {
    fontSize: 14,
    color: colors.textSecondary
  },
  messageContainer: {
    marginTop: spacing.md,
    marginLeft: 32 + spacing.md + 40 + spacing.md
  },
  instructionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  messageBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md
  },
  messageText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  autoFlaggedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginLeft: 32 + spacing.md + 40 + spacing.md,
    gap: spacing.xs
  },
  autoFlaggedText: {
    fontSize: 13,
    color: colors.success
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  laterButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  doneButton: {
    backgroundColor: colors.success
  },
  doneButtonDisabled: {
    backgroundColor: colors.background
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  doneButtonTextDisabled: {
    color: colors.textTertiary
  }
});

export default ActionRemindersModal;